import { describe, expect, test } from "bun:test";
import { ChatStream, AgentChatStream } from "../src/streaming";
import { toAIStreamResponse } from "../src/adapters/vercel-ai";

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

async function readFullStream(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe("toAIStreamResponse", () => {
  test("converts ChatStream chunk events to Vercel DataStream format", async () => {
    const raw = sseResponse(
      `event: chunk\ndata: "Hello "\n\nevent: chunk\ndata: "world"\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(raw);
    const response = toAIStreamResponse(stream);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8"
    );
    expect(response.headers.get("X-Vercel-AI-Data-Stream")).toBe("v1");

    const output = await readFullStream(response);
    const lines = output.trim().split("\n");

    // Text deltas: 0:"text"
    expect(lines[0]).toBe('0:"Hello "');
    expect(lines[1]).toBe('0:"world"');
    // Finish: d:{...}
    expect(lines[2]).toContain("d:");
    expect(lines[2]).toContain("finishReason");
  });

  test("converts sources to data annotations", async () => {
    const sources = JSON.stringify([
      { type: "text", content: "doc content", score: 0.9, source: "doc.pdf", sourceType: "document" },
    ]);
    const raw = sseResponse(
      `event: chunk\ndata: "Answer"\n\nevent: sources\ndata: ${sources}\n\nevent: done\ndata: \n\n`
    );
    const stream = new ChatStream(raw);
    const response = toAIStreamResponse(stream);
    const output = await readFullStream(response);
    const lines = output.trim().split("\n");

    // Should have: text delta, sources annotation, finish
    expect(lines[0]).toBe('0:"Answer"');
    // Sources are sent as message annotation (8: prefix)
    expect(lines[1]).toStartWith("8:");
    const annotation = JSON.parse(lines[1].slice(2));
    expect(annotation[0].type).toBe("sources");
    expect(annotation[0].data.length).toBe(1);
  });

  test("converts error events", async () => {
    const raw = sseResponse(
      `event: error\ndata: {"error":"Something broke"}\n\n`
    );
    const stream = new ChatStream(raw);
    const response = toAIStreamResponse(stream);
    const output = await readFullStream(response);
    const lines = output.trim().split("\n");

    // Error: 3:"message"
    expect(lines[0]).toStartWith("3:");
    expect(lines[0]).toContain("Something broke");
  });

  test("works with AgentChatStream", async () => {
    const toolCall = JSON.stringify({
      id: "tc_1",
      name: "search",
      args: { q: "test" },
    });
    const raw = sseResponse(
      `event: chunk\ndata: "Searching"\n\nevent: tool_call\ndata: ${toolCall}\n\nevent: chunk\ndata: " done"\n\nevent: done\ndata: \n\n`
    );
    const stream = new AgentChatStream(raw);
    const response = toAIStreamResponse(stream);
    const output = await readFullStream(response);
    const lines = output.trim().split("\n");

    expect(lines[0]).toBe('0:"Searching"');
    // tool_call annotation
    expect(lines[1]).toStartWith("8:");
    const annotation = JSON.parse(lines[1].slice(2));
    expect(annotation[0].type).toBe("tool_call");
    expect(annotation[0].data.name).toBe("search");
    // More text
    expect(lines[2]).toBe('0:" done"');
    // Finish
    expect(lines[3]).toContain("finishReason");
  });
});
