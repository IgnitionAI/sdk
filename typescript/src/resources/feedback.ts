import type { BaseClient } from "../client.js";
import type { FeedbackParams, FeedbackResult } from "../types.js";

export class Feedback {
  constructor(private client: BaseClient) {}

  /** Submit product feedback. This is an explicit external side effect. */
  async submit(params: FeedbackParams): Promise<FeedbackResult> {
    return this.client.request<FeedbackResult>("POST", "/feedback", {
      body: JSON.stringify(params),
    });
  }
}
