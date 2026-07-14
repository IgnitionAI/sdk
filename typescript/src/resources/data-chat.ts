import type { BaseClient } from "../client.js";
import type { DataChatParams, DataChatPrecheck, DataChatResponse } from "../types.js";

export class DataChat {
  constructor(private client: BaseClient) {}

  precheck(params: Omit<DataChatParams, "query">): Promise<DataChatPrecheck> {
    return this.client.request("POST", "/data-chat/precheck", { body: JSON.stringify(params) });
  }

  send(params: DataChatParams): Promise<DataChatResponse> {
    return this.client.request("POST", "/data-chat", { body: JSON.stringify(params) });
  }
}
