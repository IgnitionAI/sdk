import type {
  Source,
  ImageResult,
  PipelineMetrics,
  ChatStreamEvent,
  AgentChatStreamEvent,
  ProgressiveStreamEvent,
  DeepResearchStreamEvent,
} from "./types.js";
import { ProtocolError } from "./errors.js";

// ─── SSE Parser ────────────────────────────────────────────────────

interface SSEEvent {
  event: string;
  data: string;
}

export class DeepResearchStream implements AsyncIterable<DeepResearchStreamEvent> {
  private consumed = false;

  constructor(private readonly response: Response | Promise<Response>) {}

  async *[Symbol.asyncIterator](): AsyncIterableIterator<DeepResearchStreamEvent> {
    if (this.consumed) throw new Error("Stream has already been consumed");
    this.consumed = true;
    for await (const event of parseSSE(await this.response)) {
      const mapped = {
        type: event.event,
        data: tryParseJSON<unknown>(event.data) ?? event.data,
      };
      yield mapped;
      if (mapped.type === "done") break;
    }
  }
}

export const MAX_SSE_FRAME_BYTES = 65_536;

/**
 * Parse a raw SSE Response body into typed event tuples.
 * Handles partial chunks across TCP frames, multi-line data, and comments.
 */
async function* parseSSE(response: Response): AsyncGenerator<SSEEvent> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/event-stream")) {
    throw new ProtocolError(
      `Expected text/event-stream but received ${contentType || "no content type"}.`
    );
  }
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData: string[] = [];
  let frameBytes = 0;
  let completed = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      if (new TextEncoder().encode(buffer).byteLength > MAX_SSE_FRAME_BYTES) {
        throw new ProtocolError(
          `SSE frame exceeds the ${MAX_SSE_FRAME_BYTES.toLocaleString("en-US")}-byte limit.`
        );
      }
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        frameBytes += new TextEncoder().encode(`${line}\n`).byteLength;
        if (frameBytes > MAX_SSE_FRAME_BYTES) {
          throw new ProtocolError(
            `SSE frame exceeds the ${MAX_SSE_FRAME_BYTES.toLocaleString("en-US")}-byte limit.`
          );
        }
        if (line === "") {
          // Blank line = end of event
          if (currentData.length > 0) {
            yield {
              event: currentEvent || "message",
              data: currentData.join("\n"),
            };
          }
          currentEvent = "";
          currentData = [];
          frameBytes = 0;
        } else if (line.startsWith(":")) {
          // Comment, ignore
        } else if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          currentData.push(line.slice(5).trimStart());
        } else if (line.startsWith("data: ")) {
          currentData.push(line.slice(6));
        }
      }
    }

    // Flush any remaining event
    if (currentData.length > 0) {
      yield {
        event: currentEvent || "message",
        data: currentData.join("\n"),
      };
    }
    completed = true;
  } finally {
    if (!completed) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
}

// ─── ChatStream ────────────────────────────────────────────────────

export class ChatStream implements AsyncIterable<ChatStreamEvent> {
  private responseOrPromise: Response | Promise<Response>;
  private _consumed = false;

  constructor(response: Response | Promise<Response>) {
    this.responseOrPromise = response;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<ChatStreamEvent> {
    if (this._consumed) {
      throw new Error("Stream has already been consumed");
    }
    this._consumed = true;

    const response = await this.responseOrPromise;
    for await (const sse of parseSSE(response)) {
      const event = this._mapEvent(sse);
      if (event) {
        yield event;
        if (event.type === "done") break;
      }
    }
  }

  /**
   * Iterate only over text content.
   */
  async *toTextStream(): AsyncIterableIterator<string> {
    for await (const event of this) {
      if (event.type === "chunk") {
        yield event.content;
      }
    }
  }

  /**
   * Collect the full response (blocks until stream ends).
   */
  async getFullResponse(): Promise<{
    text: string;
    sources: Source[];
    images: ImageResult[];
    metrics?: PipelineMetrics;
  }> {
    let text = "";
    let sources: Source[] = [];
    let images: ImageResult[] = [];
    let metrics: PipelineMetrics | undefined;

    for await (const event of this) {
      switch (event.type) {
        case "chunk":
          text += event.content;
          break;
        case "sources":
          sources = event.sources;
          break;
        case "images":
          images = event.images;
          break;
        case "metrics":
          metrics = event.pipelineMetrics;
          break;
      }
    }

    return { text, sources, images, metrics };
  }

  /**
   * Convert to a Web ReadableStream of typed events.
   */
  toReadableStream(): ReadableStream<ChatStreamEvent> {
    const iterator = this[Symbol.asyncIterator]();
    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

  private _mapEvent(sse: SSEEvent): ChatStreamEvent | null {
    switch (sse.event) {
      case "chunk": {
        const content = tryParseJSON<string>(sse.data) ?? sse.data;
        return { type: "chunk", content };
      }
      case "sources": {
        const sources = tryParseJSON<Source[]>(sse.data) ?? [];
        return { type: "sources", sources };
      }
      case "images": {
        const images = tryParseJSON<ImageResult[]>(sse.data) ?? [];
        return { type: "images", images };
      }
      case "metrics": {
        const data = tryParseJSON<Record<string, unknown>>(sse.data);
        if (data) {
          return {
            type: "metrics",
            pipelineMetrics: data.pipelineMetrics as PipelineMetrics,
            featuresUsed: (data.featuresUsed as string[]) ?? [],
          };
        }
        return null;
      }
      case "done":
        return { type: "done" };
      case "error": {
        const data = tryParseJSON<{ error?: string; message?: string }>(
          sse.data
        );
        return {
          type: "error",
          error: data?.error ?? data?.message ?? sse.data,
        };
      }
      default:
        return null;
    }
  }
}

// ─── AgentChatStream ───────────────────────────────────────────────

export class AgentChatStream
  implements AsyncIterable<AgentChatStreamEvent>
{
  private responseOrPromise: Response | Promise<Response>;
  private _consumed = false;

  constructor(response: Response | Promise<Response>) {
    this.responseOrPromise = response;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<AgentChatStreamEvent> {
    if (this._consumed) {
      throw new Error("Stream has already been consumed");
    }
    this._consumed = true;

    const response = await this.responseOrPromise;
    for await (const sse of parseSSE(response)) {
      const event = this._mapEvent(sse);
      if (event) {
        yield event;
        if (event.type === "done") break;
      }
    }
  }

  async *toTextStream(): AsyncIterableIterator<string> {
    for await (const event of this) {
      if (event.type === "chunk") {
        yield event.content;
      }
    }
  }

  async getFullResponse(): Promise<{
    text: string;
    sources: Source[];
    deepEvents: Array<Record<string, unknown>>;
    toolCalls: Array<{
      name: string;
      args: Record<string, unknown>;
      result: string;
    }>;
  }> {
    let text = "";
    let sources: Source[] = [];
    const deepEvents: Array<Record<string, unknown>> = [];
    const toolCalls: Array<{
      id: string;
      name: string;
      args: Record<string, unknown>;
      result: string;
    }> = [];

    for await (const event of this) {
      switch (event.type) {
        case "chunk":
          text += event.content;
          break;
        case "sources":
          sources = event.sources;
          break;
        case "tool_call":
          toolCalls.push({
            id: event.id,
            name: event.name,
            args: event.args,
            result: "",
          });
          break;
        case "tool_result": {
          const call = toolCalls.find((c) => c.id === event.id);
          if (call) call.result = event.result;
          break;
        }
        case "deep_status":
        case "deep_task":
        case "deep_finding":
        case "deep_synthesis":
          deepEvents.push(event);
          break;
      }
    }

    return {
      text,
      sources,
      deepEvents,
      toolCalls: toolCalls.map(({ name, args, result }) => ({
        name,
        args,
        result,
      })),
    };
  }

  toReadableStream(): ReadableStream<AgentChatStreamEvent> {
    const iterator = this[Symbol.asyncIterator]();
    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

  private _mapEvent(sse: SSEEvent): AgentChatStreamEvent | null {
    switch (sse.event) {
      case "chunk": {
        const raw = tryParseJSON<string | { content: string }>(sse.data);
        const content =
          typeof raw === "string"
            ? raw
            : raw && typeof raw === "object" && "content" in raw
              ? raw.content
              : sse.data;
        return { type: "chunk", content };
      }
      case "tool_call": {
        const data = tryParseJSON<{
          id: string;
          name: string;
          args: Record<string, unknown>;
        }>(sse.data);
        if (data) {
          return {
            type: "tool_call",
            id: data.id,
            name: data.name,
            args: data.args,
          };
        }
        return null;
      }
      case "tool_result": {
        const data = tryParseJSON<{
          id: string;
          name: string;
          result: string;
        }>(sse.data);
        if (data) {
          return {
            type: "tool_result",
            id: data.id,
            name: data.name,
            result: data.result,
          };
        }
        return null;
      }
      case "sources": {
        const sources = tryParseJSON<Source[]>(sse.data) ?? [];
        return { type: "sources", sources };
      }
      case "deep_status":
      case "deep_task":
      case "deep_finding":
      case "deep_synthesis": {
        const data = tryParseJSON<Record<string, unknown>>(sse.data) ?? {};
        return {
          ...data,
          type: sse.event,
        } as AgentChatStreamEvent;
      }
      case "done":
        return { type: "done" };
      case "error": {
        const data = tryParseJSON<{ error?: string; message?: string }>(
          sse.data
        );
        return {
          type: "error",
          error: data?.error ?? data?.message ?? sse.data,
        };
      }
      default:
        return null;
    }
  }
}

// ─── ProgressiveStream ─────────────────────────────────────────────

export class ProgressiveStream
  implements AsyncIterable<ProgressiveStreamEvent>
{
  private responseOrPromise: Response | Promise<Response>;
  private _consumed = false;

  constructor(response: Response | Promise<Response>) {
    this.responseOrPromise = response;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<ProgressiveStreamEvent> {
    if (this._consumed) {
      throw new Error("Stream has already been consumed");
    }
    this._consumed = true;

    const response = await this.responseOrPromise;
    for await (const sse of parseSSE(response)) {
      const event = this._mapEvent(sse);
      if (event) {
        yield event;
        if (event.type === "done") break;
      }
    }
  }

  async *toTextStream(): AsyncIterableIterator<string> {
    for await (const event of this) {
      if (event.type === "chunk") {
        yield event.content;
      }
    }
  }

  async getFullResponse(): Promise<{
    text: string;
    sources: Source[];
    metrics?: PipelineMetrics;
    citations: Array<{ index: number; sourceId: string }>;
    stages: Array<{ stage: string; elapsed: number }>;
  }> {
    let text = "";
    let sources: Source[] = [];
    let metrics: PipelineMetrics | undefined;
    const citations: Array<{ index: number; sourceId: string }> = [];
    const stages: Array<{ stage: string; elapsed: number }> = [];

    for await (const event of this) {
      switch (event.type) {
        case "chunk":
          text += event.content;
          break;
        case "sources":
          sources = event.sources;
          break;
        case "metrics":
          metrics = event.pipelineMetrics;
          break;
        case "citation":
          citations.push({ index: event.index, sourceId: event.sourceId });
          break;
        case "stage":
          stages.push({ stage: event.stage, elapsed: event.elapsed });
          break;
      }
    }

    return { text, sources, metrics, citations, stages };
  }

  toReadableStream(): ReadableStream<ProgressiveStreamEvent> {
    const iterator = this[Symbol.asyncIterator]();
    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

  private _mapEvent(sse: SSEEvent): ProgressiveStreamEvent | null {
    switch (sse.event) {
      case "stage": {
        const data = tryParseJSON<{
          stage: string;
          elapsed: number;
          details?: unknown;
        }>(sse.data);
        if (data) {
          return {
            type: "stage",
            stage: data.stage,
            elapsed: data.elapsed,
            details: data.details,
          };
        }
        return null;
      }
      case "enhancement": {
        const data = tryParseJSON<Record<string, unknown>>(sse.data);
        if (data) {
          return {
            type: "enhancement",
            original: data.original as string,
            enhanced: data.enhanced as string,
            filters: data.filters,
            hyde: data.hyde as string | undefined,
            multiQueries: data.multiQueries as string[] | undefined,
            featuresUsed: (data.featuresUsed as string[]) ?? [],
          };
        }
        return null;
      }
      case "sources": {
        const data = tryParseJSON<{
          sources: Source[];
          images?: ImageResult[];
          retrievalTimeMs: number;
        }>(sse.data);
        if (data) {
          return {
            type: "sources",
            sources: data.sources,
            images: data.images,
            retrievalTimeMs: data.retrievalTimeMs,
          };
        }
        return null;
      }
      case "chunk": {
        const content = tryParseJSON<string>(sse.data) ?? sse.data;
        return { type: "chunk", content };
      }
      case "citation": {
        const data = tryParseJSON<{
          index: number;
          sourceId: string;
          position: number;
        }>(sse.data);
        if (data) {
          return {
            type: "citation",
            index: data.index,
            sourceId: data.sourceId,
            position: data.position,
          };
        }
        return null;
      }
      case "metrics": {
        const data = tryParseJSON<Record<string, unknown>>(sse.data);
        if (data) {
          return {
            type: "metrics",
            pipelineMetrics: data.pipelineMetrics as PipelineMetrics,
            stageBreakdown: (data.stageBreakdown as unknown[]) ?? [],
            featuresUsed: (data.featuresUsed as string[]) ?? [],
            citations: (data.citations as unknown[]) ?? [],
            config: data.config,
          };
        }
        return null;
      }
      case "done":
        return { type: "done" };
      case "error": {
        const data = tryParseJSON<{ error?: string; message?: string }>(
          sse.data
        );
        return {
          type: "error",
          error: data?.error ?? data?.message ?? sse.data,
        };
      }
      default:
        return null;
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function tryParseJSON<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}
