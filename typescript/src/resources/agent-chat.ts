import type { BaseClient } from "../client.js";
import type { AgentChatParams, ChatMessage, ManagedAgentChatHistory, ManagedAgentChatOutput, ManagedAgentChatResponse, ManagedAgentChatStartParams } from "../types.js";
import { AgentChatStream } from "../streaming.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function serializeManagedAgentChat(value: ManagedAgentChatStartParams | Record<string, unknown>): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Managed agent chat requires a request object");
  const raw = value as Record<string, unknown>;
  const allowed = ["requestId", "sessionId", "query", "history", "maximumMilliCredits"];
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) throw new TypeError(`Managed agent chat does not accept ${key}`);
  }
  if (typeof raw.requestId !== "string" || !UUID.test(raw.requestId)) throw new TypeError("requestId must be a UUID");
  if (typeof raw.sessionId !== "string" || raw.sessionId.length < 1 || raw.sessionId.length > 200) throw new TypeError("sessionId must contain 1 to 200 characters");
  if (typeof raw.query !== "string" || raw.query.trim().length < 1 || raw.query.length > 8192) throw new TypeError("query must contain 1 to 8192 characters");
  if (typeof raw.maximumMilliCredits !== "string" || !/^[1-9][0-9]{0,15}$/.test(raw.maximumMilliCredits)) throw new TypeError("maximumMilliCredits must be a positive integer string of at most 16 digits");
  const history = raw.history === undefined ? [] : raw.history;
  if (!Array.isArray(history) || history.length > 100) throw new TypeError("history must be an array with at most 100 messages");
  const body = {
    requestId: raw.requestId,
    sessionId: raw.sessionId,
    query: raw.query,
    history: history.map((item) => {
      const message = object(item);
      if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(message).some((key) => !["role", "content"].includes(key))) {
        throw new TypeError("history messages accept only role and content");
      }
      if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string" || message.content.length > 80000) {
        throw new TypeError("history messages require a supported role and content up to 80000 characters");
      }
      return { role: message.role, content: message.content };
    }),
    maximumMilliCredits: raw.maximumMilliCredits,
  };
  const serialized = JSON.stringify(body);
  if (new TextEncoder().encode(serialized).byteLength > 262144) throw new TypeError("managed agent chat request exceeds 262144 bytes");
  return serialized;
}

function presentHistory(value: unknown): ManagedAgentChatHistory {
  const raw = object(value);
  const items = Array.isArray(raw.items) ? raw.items.flatMap((item) => {
    const entry = object(item);
    return typeof entry.executionId === "string" && typeof entry.createdAt === "string" && typeof entry.question === "string"
      ? [{ executionId: entry.executionId, createdAt: entry.createdAt, question: entry.question }] : [];
  }) : [];
  return { items, nextCursor: typeof raw.nextCursor === "string" ? raw.nextCursor : null };
}

function presentAgentChat(value: unknown): ManagedAgentChatResponse {
  const raw = object(value);
  const request = object(raw.request);
  const presentMessages = (messages: unknown): ChatMessage[] => Array.isArray(messages) ? messages.flatMap((item) => {
    const message = object(item);
    return (message.role === "user" || message.role === "assistant") && typeof message.content === "string"
      ? [{ role: message.role as "user" | "assistant", content: message.content }] : [];
  }) : [];
  const history = presentMessages(request.history);
  const output = raw.output === null || raw.output === undefined ? null : (() => {
    const result = object(raw.output);
    if (typeof result.response !== "string") return null;
    const sources: ManagedAgentChatOutput["sources"] = Array.isArray(result.sources) ? result.sources.flatMap((item) => {
      const source = object(item);
      const safe: Record<string, string | number> = {};
      for (const key of ["id", "content", "type", "sourceType", "source", "documentId", "title"] as const) {
        if (typeof source[key] === "string") safe[key] = source[key] as string;
      }
      for (const key of ["pageNumber", "imageIndex", "score"] as const) {
        if (typeof source[key] === "number") safe[key] = source[key] as number;
      }
      return [safe as ManagedAgentChatOutput["sources"][number]];
    }) : [];
    const outputHistory = presentMessages(result.history);
    return { response: result.response, sources, history: outputHistory };
  })();
  const statuses = ["pending", "running", "completed", "failed", "cancelled", "cancelling"] as const;
  const status = statuses.includes(raw.status as typeof statuses[number]) ? raw.status as typeof statuses[number] : "failed";
  return {
    executionId: typeof raw.executionId === "string" ? raw.executionId : "",
    request: {
      requestId: typeof request.requestId === "string" ? request.requestId : "",
      sessionId: typeof request.sessionId === "string" ? request.sessionId : "",
      query: typeof request.query === "string" ? request.query : "",
      history,
      maximumMilliCredits: typeof request.maximumMilliCredits === "string" ? request.maximumMilliCredits : "",
    },
    status,
    reconciliationRequired: raw.reconciliationRequired === true,
    output,
    maximumMilliCredits: typeof raw.maximumMilliCredits === "string" ? raw.maximumMilliCredits : "0",
    chargedMilliCredits: typeof raw.chargedMilliCredits === "string" ? raw.chargedMilliCredits : null,
  };
}

class ManagedAgentChat {
  constructor(private readonly client: BaseClient) {}

  async start(agentId: string, params: ManagedAgentChatStartParams): Promise<ManagedAgentChatResponse> {
    return presentAgentChat(await this.client.request<unknown>("POST", `/agents/${encodeURIComponent(agentId)}/chat/executions`, {
      body: serializeManagedAgentChat(params),
    }));
  }

  async get(agentId: string, executionId: string): Promise<ManagedAgentChatResponse> {
    return presentAgentChat(await this.client.request<unknown>("GET", `/agents/${encodeURIComponent(agentId)}/chat/executions/${encodeURIComponent(executionId)}`));
  }

  async list(agentId: string, options: { before?: string } = {}): Promise<ManagedAgentChatHistory> {
    if (options.before !== undefined && !UUID.test(options.before)) throw new TypeError("before must be a UUID");
    const query = options.before === undefined ? "" : `?before=${encodeURIComponent(options.before)}`;
    return presentHistory(await this.client.request<unknown>("GET", `/agents/${encodeURIComponent(agentId)}/chat/executions${query}`));
  }

  async cancel(agentId: string, executionId: string): Promise<ManagedAgentChatResponse> {
    return presentAgentChat(await this.client.request<unknown>("POST", `/agents/${encodeURIComponent(agentId)}/chat/executions/${encodeURIComponent(executionId)}/cancel`, { body: "{}" }));
  }
}

export class AgentChat {
  readonly managed: ManagedAgentChat;

  constructor(private client: BaseClient) {
    this.managed = new ManagedAgentChat(client);
  }

  /**
   * Chat with an agent via streaming SSE.
   * Session ID is auto-generated if not provided.
   */
  stream(agentId: string, params: AgentChatParams): AgentChatStream {
    const sessionId = params.sessionId ?? generateSessionId();

    const responsePromise = this.client.requestRaw(
      "POST",
      `/agents/${agentId}/chat/stream`,
      {
        body: JSON.stringify({
          ...params,
          sessionId,
        }),
      }
    );

    return new AgentChatStream(responsePromise);
  }
}

function generateSessionId(): string {
  return `session_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
