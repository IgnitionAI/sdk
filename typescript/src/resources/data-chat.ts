import type { BaseClient } from "../client.js";
import type { DataChatParams, DataChatPrecheck, DataChatResponse } from "../types.js";
import { UnsupportedCapabilityError } from "../errors.js";
import { Compatibility } from "./compatibility.js";

/** @deprecated Data Chat is retained for legacy deployments advertising data_connectors. */
export class DataChat {
  private readonly compatibility: Compatibility;

  constructor(private client: BaseClient) {
    this.compatibility = new Compatibility(client);
  }

  async precheck(params: Omit<DataChatParams, "query">): Promise<DataChatPrecheck> {
    await this.requireCapability();
    return this.client.request("POST", "/data-chat/precheck", { body: JSON.stringify(params) });
  }

  async send(params: DataChatParams): Promise<DataChatResponse> {
    await this.requireCapability();
    return this.client.request("POST", "/data-chat", { body: JSON.stringify(params) });
  }

  private async requireCapability(): Promise<void> {
    const metadata = await this.compatibility.get();
    if (!metadata.capabilities.includes("data_connectors")) {
      throw new UnsupportedCapabilityError("data_connectors", metadata.contractVersion);
    }
  }
}
