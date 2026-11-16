import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI } from "../src/index";

function clientWith(response: unknown, capabilities = ["data_connectors"]) {
  const fetchMock = mock((url: string) => Promise.resolve(new Response(JSON.stringify(url.endsWith("/meta") ? {
    contractVersion: capabilities.length ? "2026.08" : "2026.09",
    contractDigest: "sha256:legacy-deployment",
    capabilities,
  } : response), {
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
    const [url, init] = (fetchMock as any).mock.calls.find(([url]: [string]) => url.endsWith("/data-chat/precheck"));
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
    const [, init] = (fetchMock as any).mock.calls.find(([url]: [string]) => url.endsWith("/data-chat"));
    expect(JSON.parse(init.body).resources).toHaveLength(2);
  });

  test.each(["precheck", "send"] as const)("%s fails clearly when the deployment retired Data Chat", async (method) => {
    const { client, fetchMock } = clientWith({ answer: "must not be requested" }, []);
    await expect(client.dataChat[method]({
      query: "Revenue by region",
      llmConfigId: "llm_1",
      resources: [{ type: "data_connector", id: "connector_1" }],
    })).rejects.toMatchObject({
      name: "UnsupportedCapabilityError",
      capability: "data_connectors",
      contractVersion: "2026.09",
    });
    expect((fetchMock as any).mock.calls.map(([url]: [string]) => new URL(url).pathname)).toEqual(["/api/meta"]);
  });
});
