import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI } from "../src/index";

function clientWith(response: unknown) {
  const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }))) as unknown as typeof fetch;
  return {
    client: new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 0,
    }),
    fetchMock,
  };
}

describe("dataChat", () => {
  test("prechecks selected resources without a business query", async () => {
    const { client, fetchMock } = clientWith({ compatible: true, resources: [] });
    await client.dataChat.precheck({
      llmConfigId: "llm_1",
      resources: [{ type: "data_connector", id: "connector_1" }],
    });
    const [url, init] = (fetchMock as any).mock.calls[0];
    expect(url).toContain("/api/data-chat/precheck");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      llmConfigId: "llm_1",
      resources: [{ type: "data_connector", id: "connector_1" }],
    });
  });

  test("sends a bounded multi-source data chat request", async () => {
    const { client, fetchMock } = clientWith({ answer: "ok", completeness: "complete", missingSources: [], sources: [] });
    const result = await client.dataChat.send({
      query: "Revenue by region",
      llmConfigId: "llm_1",
      resources: [
        { type: "collection", id: "collection_1" },
        { type: "data_connector", id: "connector_1" },
      ],
    });
    expect(result.answer).toBe("ok");
    const [, init] = (fetchMock as any).mock.calls[0];
    expect(JSON.parse(init.body).resources).toHaveLength(2);
  });
});
