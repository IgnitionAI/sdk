import { BaseClient } from "./client.js";
import { SecurityError } from "./errors.js";
import { Chat } from "./resources/chat.js";
import { AgentChat } from "./resources/agent-chat.js";
import { Agents } from "./resources/agents.js";
import { Collections } from "./resources/collections.js";
import { Ingest } from "./resources/ingest.js";
import { Evaluations } from "./resources/evaluations.js";
import { DataChat } from "./resources/data-chat.js";
import { Compatibility } from "./resources/compatibility.js";
import { Workflows } from "./resources/workflows.js";
import { DeepResearch } from "./resources/deep-research.js";
import type { ClientOptions } from "./types.js";

export type BrowserClientOptions = Omit<
  ClientOptions,
  "apiKey" | "tokenProvider"
> & {
  tokenProvider: () => string | Promise<string>;
  apiKey?: never;
};

/** Browser-safe client: authentication must come from a delegated user token. */
export class IgnitionAI extends BaseClient {
  readonly chat: Chat;
  readonly agentChat: AgentChat;
  readonly agents: Agents;
  readonly collections: Collections;
  readonly ingest: Ingest;
  readonly evaluations: Evaluations;
  readonly dataChat: DataChat;
  readonly compatibility: Compatibility;
  readonly workflows: Workflows;
  readonly deepResearch: DeepResearch;

  constructor(options: BrowserClientOptions) {
    if ("apiKey" in options) {
      throw new SecurityError(
        "The IgnitionRAG browser client does not accept API keys. Use tokenProvider."
      );
    }
    super(options);
    this.chat = new Chat(this);
    this.agentChat = new AgentChat(this);
    this.agents = new Agents(this);
    this.collections = new Collections(this);
    this.ingest = new Ingest(this);
    this.evaluations = new Evaluations(this);
    this.dataChat = new DataChat(this);
    this.compatibility = new Compatibility(this);
    this.workflows = new Workflows(this);
    this.deepResearch = new DeepResearch(this);
  }
}

export * from "./errors.js";
export * from "./contract.js";
export type * from "./types.js";
export type { DeploymentMetadata } from "./resources/compatibility.js";
