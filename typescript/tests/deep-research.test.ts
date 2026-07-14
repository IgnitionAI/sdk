import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI } from "../src/index";

describe("deep research", () => {
  test("reads status, reconnects to events and explicitly cancels the remote run", async () => {
    const fetchMock = mock((url: string, init?: RequestInit) => {
      if (url.endsWith("/deep-status")) {
        return Promise.resolve(new Response(JSON.stringify({
          execution: { id: "exec_1", status: "running", query: "Analyse", tokenCount: 10, tokenBudget: 100 },
          tasks: [],
        }), { headers: { "Content-Type": "application/json" } }));
      }
      if (url.endsWith("/deep-stream")) {
        return Promise.resolve(new Response(
          "event: snapshot\ndata: {\"executionId\":\"exec_1\",\"status\":\"running\"}\n\n" +
          "event: finding\ndata: {\"title\":\"Evidence\"}\n\n" +
          "event: done\ndata: {}\n\n",
          { headers: { "Content-Type": "text/event-stream" } },
        ));
      }
      return Promise.resolve(new Response(JSON.stringify({ cancelled: true }), {
        headers: { "Content-Type": "application/json" },
      }));
    }) as unknown as typeof fetch;
    const client = new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 0,
    });

    const status = await client.deepResearch.status("agent_1");
    const events = [];
    for await (const event of client.deepResearch.stream("agent_1")) events.push(event);
    const cancellation = await client.deepResearch.cancel("agent_1");

    expect(status?.execution.id).toBe("exec_1");
    expect(events).toEqual([
      { type: "snapshot", data: { executionId: "exec_1", status: "running" } },
      { type: "finding", data: { title: "Evidence" } },
      { type: "done", data: {} },
    ]);
    expect(cancellation.cancelled).toBe(true);
    expect((fetchMock.mock.calls[2]?.[1] as RequestInit).method).toBe("POST");
  });

  test("returns null when the deployment has no recent run", async () => {
    const client = new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: mock(() => Promise.resolve(new Response(null, { status: 204 }))) as unknown as typeof fetch,
      maxRetries: 0,
    });
    await expect(client.deepResearch.status("agent_1")).resolves.toBeNull();
  });
});
