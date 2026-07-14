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

describe("agentChat.stream", () => {
  test("sends to correct endpoint with agentId", async () => {
    const sse = `event: chunk\ndata: "Hello"\n\nevent: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.agentChat.stream("agent_abc123", {
      query: "How do I configure SSO?",
      sessionId: "sess_explicit",
    });

    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "chunk", content: "Hello" },
      { type: "done" },
    ]);

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/agents/agent_abc123/chat/stream");
    const body = JSON.parse(call[1].body);
    expect(body.sessionId).toBe("sess_explicit");
    expect(body.query).toBe("How do I configure SSO?");
  });

  test("auto-generates sessionId when not provided", async () => {
    const sse = `event: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.agentChat.stream("agent_xyz", {
      query: "Hello",
    });

    for await (const _ of stream) {}

    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.sessionId).toMatch(/^session_/);
    expect(body.sessionId.length).toBeGreaterThan(10);
  });

  test("passes attachments", async () => {
    const sse = `event: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.agentChat.stream("agent_xyz", {
      query: "Check customer",
      sessionId: "sess_1",
      attachments: {
        prompts: [{ server: "crm", name: "customer_context", arguments: { customerId: "c_123" } }],
        resources: [{ server: "analytics", uri: "reports://monthly/2024" }],
      },
    });

    for await (const _ of stream) {}

    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.attachments.prompts.length).toBe(1);
    expect(body.attachments.prompts[0].server).toBe("crm");
    expect(body.attachments.resources.length).toBe(1);
  });

  test("streams tool_call and tool_result events", async () => {
    const toolCall = JSON.stringify({ id: "tc_1", name: "search_knowledge", args: { query: "SSO config" } });
    const toolResult = JSON.stringify({ id: "tc_1", name: "search_knowledge", result: "SSO is configured via..." });
    const sse = `event: chunk\ndata: "Let me search"\n\nevent: tool_call\ndata: ${toolCall}\n\nevent: tool_result\ndata: ${toolResult}\n\nevent: chunk\ndata: " the answer is..."\n\nevent: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.agentChat.stream("agent_xyz", {
      query: "Configure SSO",
      sessionId: "sess_1",
    });

    const events = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBe(5);
    expect(events[0]).toEqual({ type: "chunk", content: "Let me search" });
    expect(events[1]).toEqual({
      type: "tool_call",
      id: "tc_1",
      name: "search_knowledge",
      args: { query: "SSO config" },
    });
    expect(events[2]).toEqual({
      type: "tool_result",
      id: "tc_1",
      name: "search_knowledge",
      result: "SSO is configured via...",
    });
    expect(events[3]).toEqual({ type: "chunk", content: " the answer is..." });
    expect(events[4]).toEqual({ type: "done" });
  });

  test("passes history", async () => {
    const sse = `event: done\ndata: \n\n`;

    const fetchMock = mock(() =>
      Promise.resolve(new Response(sseBody(sse), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }))
    ) as unknown as typeof fetch;

    const client = createClient(fetchMock);
    const stream = client.agentChat.stream("agent_xyz", {
      query: "Follow up",
      sessionId: "sess_1",
      history: [
        { role: "user", content: "Previous question" },
        { role: "assistant", content: "Previous answer" },
      ],
    });

    for await (const _ of stream) {}

    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.history.length).toBe(2);
  });
});
