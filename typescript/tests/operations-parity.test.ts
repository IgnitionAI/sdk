import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI } from "../src/index";

function client(fetchImpl: typeof fetch) {
  return new IgnitionAI({ apiKey: "ign_test", baseURL: "http://localhost", fetch: fetchImpl, maxRetries: 0 });
}

describe("operational SDK parity", () => {
  test("submits feedback", async () => {
    const fetchImpl = mock(() => Promise.resolve(Response.json({ success: true, message: "ok" }))) as unknown as typeof fetch;
    await client(fetchImpl).feedback.submit({ type: "feature", message: "Please add this useful feature" });
    const call = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    expect(call[0]).toContain("/api/feedback");
    expect(JSON.parse((call[1] as RequestInit).body as string).type).toBe("feature");
  });

  test("lists, gets metrics and exports traces", async () => {
    const fetchImpl = mock((url: string) => {
      if (url.includes("/export")) return Promise.resolve(new Response("id,status\n1,success", { headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="traces.csv"' } }));
      if (url.includes("/metrics")) return Promise.resolve(Response.json({ summary: { count: 1 } }));
      return Promise.resolve(Response.json({ traces: [], pagination: {} }));
    }) as unknown as typeof fetch;
    const sdk = client(fetchImpl);
    await sdk.traces.list({ collectionId: "coll_1", limit: 10 });
    const metrics = await sdk.traces.metrics({ startDate: "2026-08-01T00:00:00.000Z", endDate: "2026-08-02T00:00:00.000Z" });
    const exported = await sdk.traces.export({ format: "csv", startDate: "2026-08-01T00:00:00.000Z", endDate: "2026-08-02T00:00:00.000Z" });
    expect(metrics.summary).toEqual({ count: 1 });
    expect(exported.filename).toBe("traces.csv");
    expect(exported.content).toContain("success");
  });

  test("runs a transient RAG A/B test", async () => {
    const fetchImpl = mock(() => Promise.resolve(Response.json({ configA: {}, configB: {}, comparison: { speedDifferenceMs: 2, speedWinner: "A", resultOverlap: 0.5, recommendation: "A" } }))) as unknown as typeof fetch;
    const result = await client(fetchImpl).ragAbTests.run("coll/1", { configA: {}, configB: {}, testQuery: "question" });
    expect(result.comparison.speedWinner).toBe("A");
    const call = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    expect(call[0]).toContain("/collections/coll%2F1/rag-config/test");
  });
});
