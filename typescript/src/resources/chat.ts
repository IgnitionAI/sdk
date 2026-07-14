import type { BaseClient } from "../client.js";
import type { ChatParams, ChatResponse } from "../types.js";
import { ChatStream, ProgressiveStream } from "../streaming.js";

export class Chat {
  constructor(private client: BaseClient) {}

  /**
   * Send a non-streaming RAG chat request.
   */
  async send(params: ChatParams): Promise<ChatResponse> {
    return this.client.request<ChatResponse>("POST", "/chat", {
      body: JSON.stringify(params),
    });
  }

  /**
   * Start a streaming RAG chat. Returns an async iterable of typed SSE events.
   */
  stream(params: ChatParams): ChatStream {
    const responsePromise = this.client.requestRaw("POST", "/chat/stream", {
      body: JSON.stringify(params),
    });

    return new ChatStream(responsePromise);
  }

  /**
   * Start a progressive streaming RAG chat with stages, citations, and metrics.
   */
  streamProgressive(params: ChatParams): ProgressiveStream {
    const responsePromise = this.client.requestRaw(
      "POST",
      "/chat/stream/progressive",
      { body: JSON.stringify(params) }
    );

    return new ProgressiveStream(responsePromise);
  }
}
