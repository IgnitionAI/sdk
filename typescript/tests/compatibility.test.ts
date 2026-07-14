import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI } from "../src/index";
import { PUBLIC_CONTRACT_DIGEST } from "../src/contract";

function clientFor(metadata: Record<string, unknown>) {
  const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify(metadata), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }))) as unknown as typeof fetch;
  return {
    client: new IgnitionAI({
      apiKey: "ign_test",
      baseURL: "https://rag.example",
      fetch: fetchMock,
      maxRetries: 0,
    }),
    fetchMock,
  };
}

describe("deployment compatibility", () => {
  test("accepts and caches the matching public contract", async () => {
    const { client, fetchMock } = clientFor({
      contractVersion: "2026.07",
      contractDigest: PUBLIC_CONTRACT_DIGEST,
      capabilities: ["rag_chat", "collections"],
    });

    await expect(client.compatibility.assertCompatible()).resolves.toMatchObject({
      contractVersion: "2026.07",
    });
    await client.compatibility.assertCompatible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("rejects an unknown contract version", async () => {
    const { client } = clientFor({
      contractVersion: "2099.01",
      contractDigest: "sha256:unknown",
      capabilities: [],
    });
    await expect(client.compatibility.assertCompatible()).rejects.toThrow(
      "Unsupported IgnitionRAG contract version",
    );
  });

  test("rejects a changed contract under the current version", async () => {
    const { client } = clientFor({
      contractVersion: "2026.07",
      contractDigest: `sha256:${"0".repeat(64)}`,
      capabilities: [],
    });
    await expect(client.compatibility.assertCompatible()).rejects.toThrow(
      "digest does not match",
    );
  });
});
