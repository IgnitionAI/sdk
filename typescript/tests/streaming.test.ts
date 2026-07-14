import { describe, expect, test } from "bun:test";
import { ChatStream, AgentChatStream, ProgressiveStream } from "../src/streaming";

/**
 * Helper: create a mock Response with SSE body from raw SSE text.
 */
function sseResponse(sseText: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Helper: create a mock Response that sends SSE in multiple chunks.
 */
function chunkedSSEResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("ChatStream", () => {
  test("rejects an oversized SSE frame", async () => {
    const response = sseResponse(`event: chunk\ndata: ${"x".repeat(65_537)}\n\n`);
    const stream = new ChatStream(response);
    await expect(async () => {
      for await (const _event of stream) {
        // consume
      }
    }).toThrow("65,536");
  });

  test("rejects a non-SSE response", async () => {
    const stream = new ChatStream(new Response("{}", {
      headers: { "Content-Type": "application/json" },
    }));
    await expect(async () => {
      for await (const _event of stream) {
        // consume
      }
    }).toThrow("text/event-stream");
  });

  test("cancels the response body when the consumer stops early", async () => {
    let cancelled = false;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("event: chunk\ndata: first\n\n"));
      },
      cancel() {
        cancelled = true;
      },
    });
    const stream = new ChatStream(new Response(body, {
      headers: { "Content-Type": "text/event-stream" },
    }));
    for await (const _event of stream) {
      break;
    }
    expect(cancelled).toBe(true);
  });

  test("parses chunk events", async () => {
    const response = sseResponse(
      `event: chunk\ndata: "Hello "\n\nevent: chunk\ndata: "world"\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "chunk", content: "Hello " },
      { type: "chunk", content: "world" },
      { type: "done" },
    ]);
  });

  test("parses sources event", async () => {
    const sources = JSON.stringify([
      { type: "text", content: "test", score: 0.9, source: "doc.pdf", sourceType: "document" },
    ]);
    const response = sseResponse(
      `event: sources\ndata: ${sources}\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBe(2);
    expect(events[0].type).toBe("sources");
    if (events[0].type === "sources") {
      expect(events[0].sources.length).toBe(1);
      expect(events[0].sources[0].score).toBe(0.9);
    }
  });

  test("parses error event", async () => {
    const response = sseResponse(
      `event: error\ndata: {"error":"Something went wrong"}\n\n`
    );
    const stream = new ChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "error", error: "Something went wrong" },
    ]);
  });

  test("handles partial chunks across reads", async () => {
    const response = chunkedSSEResponse([
      `event: chu`,
      `nk\ndata: "Hello"\n\neve`,
      `nt: done\ndata: \n\n`,
    ]);
    const stream = new ChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "chunk", content: "Hello" },
      { type: "done" },
    ]);
  });

  test("ignores comment lines", async () => {
    const response = sseResponse(
      `: this is a comment\nevent: chunk\ndata: "Hi"\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "chunk", content: "Hi" },
      { type: "done" },
    ]);
  });

  test("ignores unknown event types", async () => {
    const response = sseResponse(
      `event: unknown\ndata: {}\n\nevent: chunk\ndata: "ok"\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "chunk", content: "ok" },
      { type: "done" },
    ]);
  });

  test("toTextStream yields only text", async () => {
    const sources = JSON.stringify([{ type: "text", content: "x", score: 0.5, source: "a", sourceType: "document" }]);
    const response = sseResponse(
      `event: chunk\ndata: "Hello "\n\nevent: sources\ndata: ${sources}\n\nevent: chunk\ndata: "world"\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(response);
    const texts = [];
    for await (const text of stream.toTextStream()) {
      texts.push(text);
    }
    expect(texts).toEqual(["Hello ", "world"]);
  });

  test("getFullResponse collects everything", async () => {
    const sources = JSON.stringify([{ type: "text", content: "x", score: 0.5, source: "a", sourceType: "document" }]);
    const metrics = JSON.stringify({ pipelineMetrics: { totalTimeMs: 100 }, featuresUsed: ["hybridSearch"] });
    const response = sseResponse(
      `event: chunk\ndata: "Hello "\n\nevent: chunk\ndata: "world"\n\nevent: sources\ndata: ${sources}\n\nevent: metrics\ndata: ${metrics}\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(response);
    const result = await stream.getFullResponse();

    expect(result.text).toBe("Hello world");
    expect(result.sources.length).toBe(1);
    expect(result.metrics?.totalTimeMs).toBe(100);
  });

  test("throws if consumed twice", async () => {
    const response = sseResponse(`event: done\ndata: \n\n`);
    const stream = new ChatStream(response);

    // First consumption
    for await (const _ of stream) {}

    // Second consumption should throw
    expect(async () => {
      for await (const _ of stream) {}
    }).toThrow("Stream has already been consumed");
  });

  test("accepts Promise<Response>", async () => {
    const response = sseResponse(`event: chunk\ndata: "async"\n\nevent: done\ndata: \n\n`);
    const stream = new ChatStream(Promise.resolve(response));
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }
    expect(events[0]).toEqual({ type: "chunk", content: "async" });
  });
});

describe("AgentChatStream", () => {
  test("parses chunk, tool_call, tool_result, sources events", async () => {
    const toolCall = JSON.stringify({ id: "tc_1", name: "search_knowledge", args: { query: "test" } });
    const toolResult = JSON.stringify({ id: "tc_1", name: "search_knowledge", result: "found it" });
    const sources = JSON.stringify([{ type: "text", content: "x", score: 0.8, source: "doc", sourceType: "document" }]);

    const response = sseResponse(
      `event: chunk\ndata: "Let me "\n\nevent: tool_call\ndata: ${toolCall}\n\nevent: tool_result\ndata: ${toolResult}\n\nevent: chunk\ndata: "search..."\n\nevent: sources\ndata: ${sources}\n\nevent: done\ndata: \n\n`
    );

    const stream = new AgentChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBe(6);
    expect(events[0]).toEqual({ type: "chunk", content: "Let me " });
    expect(events[1]).toEqual({ type: "tool_call", id: "tc_1", name: "search_knowledge", args: { query: "test" } });
    expect(events[2]).toEqual({ type: "tool_result", id: "tc_1", name: "search_knowledge", result: "found it" });
    expect(events[3]).toEqual({ type: "chunk", content: "search..." });
    expect(events[4].type).toBe("sources");
    expect(events[5]).toEqual({ type: "done" });
  });

  test("getFullResponse aggregates tool calls", async () => {
    const toolCall = JSON.stringify({ id: "tc_1", name: "search", args: { q: "x" } });
    const toolResult = JSON.stringify({ id: "tc_1", name: "search", result: "found" });

    const response = sseResponse(
      `event: chunk\ndata: "Answer: "\n\nevent: tool_call\ndata: ${toolCall}\n\nevent: tool_result\ndata: ${toolResult}\n\nevent: chunk\ndata: "done"\n\nevent: done\ndata: \n\n`
    );

    const stream = new AgentChatStream(response);
    const result = await stream.getFullResponse();

    expect(result.text).toBe("Answer: done");
    expect(result.toolCalls.length).toBe(1);
    expect(result.toolCalls[0].name).toBe("search");
    expect(result.toolCalls[0].result).toBe("found");
  });

  test("handles chunk data as JSON string or object with content", async () => {
    // The agent API sometimes sends raw JSON strings, sometimes objects
    const response = sseResponse(
      `event: chunk\ndata: "Hello"\n\nevent: chunk\ndata: {"content":"World"}\n\nevent: done\ndata: \n\n`
    );

    const stream = new AgentChatStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events[0]).toEqual({ type: "chunk", content: "Hello" });
    expect(events[1]).toEqual({ type: "chunk", content: "World" });
  });
});

describe("ProgressiveStream", () => {
  test("parses stage, enhancement, sources, chunk, citation, metrics, done", async () => {
    const stage = JSON.stringify({ stage: "enhancing", elapsed: 50 });
    const enhancement = JSON.stringify({ original: "test", enhanced: "test query", featuresUsed: ["queryRewriting"] });
    const sources = JSON.stringify({ sources: [{ type: "text", content: "x", score: 0.9, source: "doc", sourceType: "document" }], retrievalTimeMs: 200 });
    const citation = JSON.stringify({ index: 1, sourceId: "src_1", position: 42 });
    const metrics = JSON.stringify({ pipelineMetrics: { totalTimeMs: 500 }, stageBreakdown: [], featuresUsed: ["hybridSearch"], citations: [], config: {} });

    const response = sseResponse(
      `event: stage\ndata: ${stage}\n\nevent: enhancement\ndata: ${enhancement}\n\nevent: sources\ndata: ${sources}\n\nevent: chunk\ndata: "Answer"\n\nevent: citation\ndata: ${citation}\n\nevent: metrics\ndata: ${metrics}\n\nevent: done\ndata: \n\n`
    );

    const stream = new ProgressiveStream(response);
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBe(7);
    expect(events[0]).toEqual({ type: "stage", stage: "enhancing", elapsed: 50, details: undefined });
    expect(events[1].type).toBe("enhancement");
    expect(events[2].type).toBe("sources");
    expect(events[3]).toEqual({ type: "chunk", content: "Answer" });
    expect(events[4]).toEqual({ type: "citation", index: 1, sourceId: "src_1", position: 42 });
    expect(events[5].type).toBe("metrics");
    expect(events[6]).toEqual({ type: "done" });
  });

  test("getFullResponse collects stages and citations", async () => {
    const stage1 = JSON.stringify({ stage: "searching", elapsed: 100 });
    const stage2 = JSON.stringify({ stage: "generating", elapsed: 300 });
    const sources = JSON.stringify({ sources: [{ type: "text", content: "x", score: 0.9, source: "doc", sourceType: "document" }], retrievalTimeMs: 150 });
    const citation = JSON.stringify({ index: 1, sourceId: "src_1", position: 10 });
    const metrics = JSON.stringify({ pipelineMetrics: { totalTimeMs: 500 }, stageBreakdown: [], featuresUsed: [], citations: [], config: {} });

    const response = sseResponse(
      `event: stage\ndata: ${stage1}\n\nevent: stage\ndata: ${stage2}\n\nevent: sources\ndata: ${sources}\n\nevent: chunk\ndata: "Result"\n\nevent: citation\ndata: ${citation}\n\nevent: metrics\ndata: ${metrics}\n\nevent: done\ndata: \n\n`
    );

    const stream = new ProgressiveStream(response);
    const result = await stream.getFullResponse();

    expect(result.text).toBe("Result");
    expect(result.sources.length).toBe(1);
    expect(result.stages).toEqual([
      { stage: "searching", elapsed: 100 },
      { stage: "generating", elapsed: 300 },
    ]);
    expect(result.citations).toEqual([{ index: 1, sourceId: "src_1" }]);
    expect(result.metrics?.totalTimeMs).toBe(500);
  });
});
