import type { BaseClient } from "../client.js";
import type { RagAbTestParams, RagAbTestResult } from "../types.js";

export class RagAbTests {
  constructor(private client: BaseClient) {}

  /** Compare two transient RAG configurations. Does not promote or persist either config. */
  async run(collectionId: string, params: RagAbTestParams): Promise<RagAbTestResult> {
    return this.client.request("POST", `/collections/${encodeURIComponent(collectionId)}/rag-config/test`, {
      body: JSON.stringify(params),
      timeout: 120_000,
    });
  }
}
