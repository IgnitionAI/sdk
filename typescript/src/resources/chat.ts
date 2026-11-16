import type { BaseClient } from "../client.js";
import type {
  ChatParams,
  ChatResponse,
  ManagedChatParams,
  ManagedChatResponse,
  ManagedProgressiveStreamEvent,
  Source,
  ImageResult,
  PipelineMetrics,
} from "../types.js";
import { ChatStream, ProgressiveStream } from "../streaming.js";

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

function assertExactKeys(value: unknown, allowed: readonly string[], label: string): Record<string, unknown> {
  const record = object(value);
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      if (key === "model" || key === "llmConfigId") {
        throw new TypeError("Managed chat cannot override model or LLM configuration");
      }
      throw new TypeError(`Managed ${label} does not accept ${key}`);
    }
  }
  return record;
}

const CHAT_FIELDS = ["collectionId", "query", "maximumMilliCredits", "history", "includeImages", "filters"] as const;
const FILTER_OPERATORS = ["eq", "neq", "contains", "gt", "gte", "lt", "lte", "in", "nin", "between", "exists"] as const;

function serializeManagedChat(params: ManagedChatParams): string {
  const value = assertExactKeys(params, CHAT_FIELDS, "chat");
  if (typeof value.collectionId !== "string" || typeof value.query !== "string" || value.query.length < 1) {
    throw new TypeError("collectionId and a non-empty query are required");
  }
  if (value.maximumMilliCredits !== undefined &&
    (typeof value.maximumMilliCredits !== "string" || !/^[1-9][0-9]{0,15}$/.test(value.maximumMilliCredits))) {
    throw new TypeError("maximumMilliCredits must be a positive integer string of at most 16 digits");
  }
  const body: Record<string, unknown> = {
    collectionId: value.collectionId,
    query: value.query,
  };
  if (value.maximumMilliCredits !== undefined) body.maximumMilliCredits = value.maximumMilliCredits;
  if (value.includeImages !== undefined) {
    if (typeof value.includeImages !== "boolean") throw new TypeError("includeImages must be a boolean");
    body.includeImages = value.includeImages;
  }
  if (value.history !== undefined) {
    if (!Array.isArray(value.history)) throw new TypeError("history must be an array");
    body.history = value.history.map((item) => {
      const message = assertExactKeys(item, ["role", "content"], "chat history message");
      if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") {
        throw new TypeError("history messages require a user or assistant role and string content");
      }
      return { role: message.role, content: message.content };
    });
  }
  if (value.filters !== undefined) {
    if (!Array.isArray(value.filters)) throw new TypeError("filters must be an array");
    body.filters = value.filters.map((item) => {
      const filter = assertExactKeys(item, ["field", "operator", "value"], "chat filter");
      if (typeof filter.field !== "string" || typeof filter.operator !== "string" ||
        !(FILTER_OPERATORS as readonly string[]).includes(filter.operator) || !("value" in filter)) {
        throw new TypeError("filters require field, operator, and value");
      }
      const filterValue = filter.value;
      if (filterValue && typeof filterValue === "object" && !Array.isArray(filterValue)) {
        const range = assertExactKeys(filterValue, ["from", "to"], "chat filter range");
        if (typeof range.from !== "number" || !Number.isFinite(range.from) || typeof range.to !== "number" || !Number.isFinite(range.to)) throw new TypeError("filter range bounds must be finite numbers");
        return { field: filter.field, operator: filter.operator, value: { from: range.from, to: range.to } };
      }
      if (Array.isArray(filterValue)) {
        if (!filterValue.every((item) => typeof item === "string" || (typeof item === "number" && Number.isFinite(item)))) {
          throw new TypeError("filter arrays may contain only strings or numbers");
        }
        return { field: filter.field, operator: filter.operator, value: [...filterValue] };
      }
      if (!["string", "boolean"].includes(typeof filterValue) && !(typeof filterValue === "number" && Number.isFinite(filterValue))) {
        throw new TypeError("filter value must be a scalar, array, or numeric range");
      }
      return { field: filter.field, operator: filter.operator, value: filterValue };
    });
  }
  return JSON.stringify(body);
}

function presentSource(value: unknown): Source {
  const source = object(value);
  return {
    type: source.type === "image" ? "image" : "text",
    ...(typeof source.content === "string" ? { content: source.content } : {}),
    ...(typeof source.score === "number" ? { score: source.score } : { score: 0 }),
    ...(typeof source.source === "string" ? { source: source.source } : { source: "" }),
    ...(typeof source.sourceType === "string" ? { sourceType: source.sourceType } : { sourceType: "" }),
    ...(typeof source.title === "string" ? { title: source.title } : {}),
    ...(typeof source.url === "string" ? { url: source.url } : {}),
    ...(typeof source.pageNumber === "number" ? { pageNumber: source.pageNumber } : {}),
    ...(typeof source.imageIndex === "number" ? { imageIndex: source.imageIndex } : {}),
    ...(typeof source.mimeType === "string" ? { mimeType: source.mimeType } : {}),
  };
}

function presentImage(value: unknown): ImageResult {
  const image = object(value);
  return {
    source: typeof image.source === "string" ? image.source : "",
    ...(typeof image.pageNumber === "number" ? { pageNumber: image.pageNumber } : {}),
    ...(typeof image.imageIndex === "number" ? { imageIndex: image.imageIndex } : {}),
    ...(typeof image.mimeType === "string" ? { mimeType: image.mimeType } : {}),
    score: typeof image.score === "number" ? image.score : 0,
    ...(typeof image.signedUrl === "string" ? { signedUrl: image.signedUrl } : {}),
  };
}

function presentManagedResponse(value: unknown): ManagedChatResponse {
  const response = object(value);
  return {
    answer: typeof response.answer === "string" ? response.answer : "",
    sources: Array.isArray(response.sources) ? response.sources.map(presentSource) : [],
    ...(Array.isArray(response.images) ? { images: response.images.map(presentImage) } : {}),
    ...(typeof response.relevanceScore === "number" ? { relevanceScore: response.relevanceScore } : {}),
  };
}

function presentMetrics(value: unknown): PipelineMetrics {
  const metrics = object(value);
  return {
    totalTimeMs: typeof metrics.totalTimeMs === "number" ? metrics.totalTimeMs : 0,
    queryEnhancementMs: typeof metrics.queryEnhancementMs === "number" ? metrics.queryEnhancementMs : 0,
    searchMs: typeof metrics.searchMs === "number" ? metrics.searchMs : 0,
    rerankMs: typeof metrics.rerankMs === "number" ? metrics.rerankMs : 0,
    resultsCount: typeof metrics.resultsCount === "number" ? metrics.resultsCount : 0,
    ...(typeof metrics.bm25IndexSize === "number" ? { bm25IndexSize: metrics.bm25IndexSize } : {}),
  };
}

class ManagedChatStream implements AsyncIterable<import("../types.js").ChatStreamEvent> {
  constructor(private readonly stream: ChatStream) {}

  async *[Symbol.asyncIterator](): AsyncIterableIterator<import("../types.js").ChatStreamEvent> {
    for await (const event of this.stream) {
      if (event.type === "sources") yield { type: "sources", sources: event.sources.map(presentSource) };
      else if (event.type === "images") yield { type: "images", images: event.images.map(presentImage) };
      else if (event.type === "metrics") yield {
        type: "metrics", pipelineMetrics: presentMetrics(event.pipelineMetrics),
        featuresUsed: event.featuresUsed.filter((item): item is string => typeof item === "string"),
      };
      else if (event.type === "error") yield { type: "error", error: "Managed chat request failed" };
      else yield event;
    }
  }

  async *toTextStream(): AsyncIterableIterator<string> {
    for await (const event of this) if (event.type === "chunk") yield event.content;
  }

  async getFullResponse(): Promise<{ text: string; sources: Source[]; images: ImageResult[]; metrics?: PipelineMetrics }> {
    let text = ""; let sources: Source[] = []; let images: ImageResult[] = []; let metrics: PipelineMetrics | undefined;
    for await (const event of this) {
      if (event.type === "chunk") text += event.content;
      else if (event.type === "sources") sources = event.sources;
      else if (event.type === "images") images = event.images;
      else if (event.type === "metrics") metrics = event.pipelineMetrics;
    }
    return { text, sources, images, ...(metrics ? { metrics } : {}) };
  }

  toReadableStream(): ReadableStream<import("../types.js").ChatStreamEvent> {
    const iterator = this[Symbol.asyncIterator]();
    return new ReadableStream({
      async pull(controller) {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      },
      async cancel() { await iterator.return?.(); },
    });
  }
}

class ManagedProgressiveStream implements AsyncIterable<ManagedProgressiveStreamEvent> {
  constructor(private readonly stream: ProgressiveStream) {}

  async *[Symbol.asyncIterator](): AsyncIterableIterator<ManagedProgressiveStreamEvent> {
    for await (const event of this.stream) {
      switch (event.type) {
        case "stage": yield { type: "stage", stage: event.stage, elapsed: event.elapsed }; break;
        case "enhancement": yield {
          type: "enhancement", original: event.original, enhanced: event.enhanced,
          ...(event.multiQueries ? { multiQueries: event.multiQueries.filter((item): item is string => typeof item === "string") } : {}),
          featuresUsed: event.featuresUsed.filter((item): item is string => typeof item === "string"),
        }; break;
        case "sources": yield {
          type: "sources", sources: event.sources.map(presentSource),
          ...(event.images ? { images: event.images.map(presentImage) } : {}), retrievalTimeMs: event.retrievalTimeMs,
        }; break;
        case "chunk": yield { type: "chunk", content: event.content }; break;
        case "citation": yield { type: "citation", index: event.index, sourceId: event.sourceId, position: event.position }; break;
        case "metrics": yield {
          type: "metrics", pipelineMetrics: presentMetrics(event.pipelineMetrics),
          featuresUsed: event.featuresUsed.filter((item): item is string => typeof item === "string"),
        }; break;
        case "error": yield { type: "error", error: "Managed chat request failed" }; break;
        case "done": yield { type: "done" }; break;
      }
    }
  }

  async *toTextStream(): AsyncIterableIterator<string> {
    for await (const event of this) if (event.type === "chunk") yield event.content;
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
      if (event.type === "chunk") text += event.content;
      else if (event.type === "sources") sources = event.sources;
      else if (event.type === "metrics") metrics = event.pipelineMetrics;
      else if (event.type === "citation") citations.push({ index: event.index, sourceId: event.sourceId });
      else if (event.type === "stage") stages.push({ stage: event.stage, elapsed: event.elapsed });
    }
    return { text, sources, ...(metrics ? { metrics } : {}), citations, stages };
  }

  toReadableStream(): ReadableStream<ManagedProgressiveStreamEvent> {
    const iterator = this[Symbol.asyncIterator]();
    return new ReadableStream({
      async pull(controller) {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      },
      async cancel() { await iterator.return?.(); },
    });
  }
}

class ManagedChat {
  constructor(private readonly client: BaseClient) {}

  async send(params: ManagedChatParams): Promise<ManagedChatResponse> {
    const response = await this.client.request<unknown>("POST", "/chat", { body: serializeManagedChat(params) });
    return presentManagedResponse(response);
  }

  stream(params: ManagedChatParams): ManagedChatStream {
    return new ManagedChatStream(new ChatStream(this.client.requestRaw("POST", "/chat/stream", { body: serializeManagedChat(params) })));
  }

  streamProgressive(params: ManagedChatParams): ManagedProgressiveStream {
    return new ManagedProgressiveStream(new ProgressiveStream(this.client.requestRaw("POST", "/chat/stream/progressive", { body: serializeManagedChat(params) })));
  }
}

function serializeChat(params: ChatParams): string {
  if (params.maximumMilliCredits !== undefined) {
    if (typeof params.maximumMilliCredits !== "string" || !/^[1-9][0-9]{0,15}$/.test(params.maximumMilliCredits))
      throw new TypeError("maximumMilliCredits must be a positive integer string of at most 16 digits");
    if (params.llmConfigId !== undefined)
      throw new TypeError("A managed credit budget cannot select an LLM configuration");
  }
  return JSON.stringify(params);
}

export class Chat {
  readonly managed: ManagedChat;

  constructor(private client: BaseClient) {
    this.managed = new ManagedChat(client);
  }

  /**
   * Send a non-streaming RAG chat request.
   */
  async send(params: ChatParams): Promise<ChatResponse> {
    return this.client.request<ChatResponse>("POST", "/chat", {
      body: serializeChat(params),
    });
  }

  /**
   * Start a streaming RAG chat. Returns an async iterable of typed SSE events.
   */
  stream(params: ChatParams): ChatStream {
    const responsePromise = this.client.requestRaw("POST", "/chat/stream", {
      body: serializeChat(params),
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
      { body: serializeChat(params) }
    );

    return new ProgressiveStream(responsePromise);
  }
}
