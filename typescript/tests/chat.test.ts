import { describe, expect, test, mock } from "bun:test";
import { IgnitionAI } from "../src/index";

function sseBody(sseText: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });
}

function createClient(fetchMock: typeof fetch): IgnitionAI {
  return new IgnitionAI({
    apiKey: "ign_test_key",
    baseURL: "http://localhost",
    fetch: fetchMock,
    maxRetries: 0,
  });
}

describe("chat.send", () => {
  test("sends POST /chat and returns parsed response", async () => {
    const responseData = {
      answer: "The refund policy is...",
      sources: [{ type: "text", content: "policy doc", score: 0.92, source: "policy.pdf", sourceType: "document" }],
    };

    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const result = await client.chat.send({
      collectionId: "coll_123",
      query: "What is the refund policy?",
    });

    expect(result.answer).toBe("The refund policy is...");
    expect(result.sources.length).toBe(1);

    // Verify the fetch was called with correct params
    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/chat");
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.collectionId).toBe("coll_123");
    expect(body.query).toBe("What is the refund policy?");
  });

  test("passes history and filters", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ answer: "ok", sources: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    await client.chat.send({
      collectionId: "coll_123",
      query: "Follow up",
      history: [
        { role: "user", content: "First question" },
        { role: "assistant", content: "First answer" },
      ],
      filters: [{ field: "category", operator: "eq", value: "support" }],
    });

    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.history.length).toBe(2);
    expect(body.filters.length).toBe(1);
    expect(body.filters[0].field).toBe("category");
  });
});

describe("chat.stream", () => {
  test("returns ChatStream that yields typed events", async () => {
    const sse = `event: chunk\ndata: "Hello "\n\nevent: chunk\ndata: "world"\n\nevent: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.chat.stream({
      collectionId: "coll_123",
      query: "Hello",
    });

    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "chunk", content: "Hello " },
      { type: "chunk", content: "world" },
      { type: "done" },
    ]);

    // Verify it hit the stream endpoint
    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/chat/stream");
  });
});

describe("chat.streamProgressive", () => {
  test("returns ProgressiveStream with stage events", async () => {
    const stage = JSON.stringify({ stage: "searching", elapsed: 100 });
    const sources = JSON.stringify({ sources: [], retrievalTimeMs: 150 });
    const sse = `event: stage\ndata: ${stage}\n\nevent: sources\ndata: ${sources}\n\nevent: chunk\ndata: "Answer"\n\nevent: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.chat.streamProgressive({
      collectionId: "coll_123",
      query: "Compare plans",
    });

    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBe(4);
    expect(events[0].type).toBe("stage");
    expect(events[1].type).toBe("sources");
    expect(events[2]).toEqual({ type: "chunk", content: "Answer" });
    expect(events[3]).toEqual({ type: "done" });

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/chat/stream/progressive");
  });
});

describe("managed chat budgets", () => {
  for (const method of ["send", "stream", "streamProgressive"] as const) {
    test(`${method} sends an exact budget without model configuration`, async () => {
      const request = mock(() => Promise.resolve(new Response(JSON.stringify({ answer: "ok", sources: [] }), { status: 200 })));
      const client = createClient(request as unknown as typeof fetch);
      await client.chat[method]({ collectionId: "collection", query: "Question", maximumMilliCredits: "9999999999999999" });
      const body = JSON.parse((request.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
      expect(body.maximumMilliCredits).toBe("9999999999999999");
      expect(body).not.toHaveProperty("llmConfigId");
    });
    test(`${method} rejects invalid budgets and model overrides before dispatch`, async () => {
      const request = mock(() => Promise.reject(new Error("must not dispatch")));
      const client = createClient(request as unknown as typeof fetch);
      for (const maximumMilliCredits of ["0", "-1", "1.5", "1e6", "10000000000000000"]) {
        await expect(Promise.resolve().then(() => client.chat[method]({ collectionId: "collection", query: "Question", maximumMilliCredits }))).rejects.toBeInstanceOf(TypeError);
      }
      await expect(Promise.resolve().then(() => client.chat[method]({ collectionId: "collection", query: "Question", maximumMilliCredits: "1000", llmConfigId: "private-model" }))).rejects.toBeInstanceOf(TypeError);
      expect(request).not.toHaveBeenCalled();
    });
  }
});

describe("explicit managed chat contract", () => {
  test("rejects model and LLM configuration overrides before dispatch with or without a budget", async () => {
    const request = mock(() => Promise.reject(new Error("must not dispatch")));
    const client = createClient(request as unknown as typeof fetch);
    const methods = ["send", "stream", "streamProgressive"] as const;
    const overrides = [
      { llmConfigId: "private-llm-config" },
      { model: "private-model" },
    ];

    for (const method of methods) {
      for (const maximumMilliCredits of [undefined, "1000"]) {
        for (const override of overrides) {
          const params = {
            collectionId: "collection",
            query: "Question",
            ...(maximumMilliCredits === undefined ? {} : { maximumMilliCredits }),
            ...override,
          };
          await expect(
            Promise.resolve().then(() => client.chat.managed[method](params as never)),
          ).rejects.toThrow("Managed chat cannot override model or LLM configuration");
        }
      }
    }
    expect(request).not.toHaveBeenCalled();
  });

  test("whitelists nested request and response fields and strips progressive diagnostics", async () => {
    const responseBody = JSON.stringify({
      answer: "Safe answer", model: "private-model", usage: { promptTokens: 99 }, providerConfig: { key: "secret" },
      sources: [{ type: "text", content: "Excerpt", score: 0.9, source: "doc.pdf", sourceType: "document", providerConfig: "secret" }],
    });
    const fetchMock = mock(() => Promise.resolve(new Response(responseBody, { status: 200, headers: { "Content-Type": "application/json" } }))) as unknown as typeof fetch;
    const client = createClient(fetchMock);
    const result = await client.chat.managed.send({ collectionId: "collection", query: "Question" });
    expect(result.answer).toBe("Safe answer");
    expect(result).not.toHaveProperty("model");
    expect(result).not.toHaveProperty("usage");
    expect(result.sources[0]).not.toHaveProperty("providerConfig");

    const streamSse = `event: sources\ndata: ${JSON.stringify([{ type: "text", content: "Excerpt", score: 1, source: "doc", sourceType: "document", model: "secret" }])}\n\nevent: done\ndata: \n\n`;
    const streamFetch = mock(() => Promise.resolve(new Response(sseBody(streamSse), { status: 200, headers: { "Content-Type": "text/event-stream" } }))) as unknown as typeof fetch;
    const streamClient = createClient(streamFetch);
    const events = [];
    for await (const event of streamClient.chat.managed.stream({ collectionId: "collection", query: "Question" })) events.push(event);
    expect(events[0].type).toBe("sources");
    if (events[0].type === "sources") expect(events[0].sources[0]).not.toHaveProperty("model");

    const progressiveSse = [
      `event: stage\ndata: ${JSON.stringify({ stage: "searching", elapsed: 4, details: { config: "secret" } })}`,
      `event: metrics\ndata: ${JSON.stringify({ pipelineMetrics: { totalTimeMs: 4, queryEnhancementMs: 0, searchMs: 4, rerankMs: 0, resultsCount: 1 }, featuresUsed: [], config: { apiKey: "secret" } })}`,
      "event: done\ndata: ",
    ].join("\n\n") + "\n\n";
    const progressiveFetch = mock(() => Promise.resolve(new Response(sseBody(progressiveSse), { status: 200, headers: { "Content-Type": "text/event-stream" } }))) as unknown as typeof fetch;
    const progressiveClient = createClient(progressiveFetch);
    const progressiveEvents = [];
    for await (const event of progressiveClient.chat.managed.streamProgressive({ collectionId: "collection", query: "Question" })) progressiveEvents.push(event);
    expect(progressiveEvents[0]).toEqual({ type: "stage", stage: "searching", elapsed: 4 });
    expect(progressiveEvents[1].type).toBe("metrics");
    if (progressiveEvents[1].type === "metrics") expect(progressiveEvents[1]).not.toHaveProperty("config");

    const invalidNestedFetch = mock(() => Promise.reject(new Error("must not dispatch"))) as unknown as typeof fetch;
    const invalidNestedClient = createClient(invalidNestedFetch);
    await expect(invalidNestedClient.chat.managed.send({
      collectionId: "collection", query: "Question",
      history: [{ role: "user", content: "Q", model: "private-model" } as never],
    })).rejects.toThrow("Managed chat cannot override model or LLM configuration");
    expect(invalidNestedFetch).not.toHaveBeenCalled();
  });
});
