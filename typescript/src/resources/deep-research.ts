import type { BaseClient } from "../client.js";
import { DeepResearchStream } from "../streaming.js";
import type { DeepResearchStatus } from "../types.js";

export class DeepResearch {
  constructor(private readonly client: BaseClient) {}

  async status(agentId: string): Promise<DeepResearchStatus | null> {
    const response = await this.client.requestRaw(
      "GET",
      `/agents/${agentId}/chat/deep-status`,
    );
    if (response.status === 204) return null;
    return response.json() as Promise<DeepResearchStatus>;
  }

  stream(agentId: string): DeepResearchStream {
    return new DeepResearchStream(this.client.requestRaw(
      "GET",
      `/agents/${agentId}/chat/deep-stream`,
    ));
  }

  /** Cancels the active remote deep-research execution for the agent. */
  async cancel(agentId: string): Promise<{ cancelled: true }> {
    return this.client.request(
      "POST",
      `/agents/${agentId}/chat/cancel-deep`,
      { body: "{}" },
    );
  }
}
