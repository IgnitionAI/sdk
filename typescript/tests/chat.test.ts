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
