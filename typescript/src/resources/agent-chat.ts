import type { BaseClient } from "../client.js";
import type { AgentChatParams } from "../types.js";
import { AgentChatStream } from "../streaming.js";

export class AgentChat {
  constructor(private client: BaseClient) {}

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
