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
      contractVersion: "2026.11",
      contractDigest: PUBLIC_CONTRACT_DIGEST,
      capabilities: ["rag_chat", "collections"],
    });

    await expect(client.compatibility.assertCompatible()).resolves.toMatchObject({
      contractVersion: "2026.11",
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
      contractVersion: "2026.11",
      contractDigest: `sha256:${"0".repeat(64)}`,
      capabilities: [],
    });
    await expect(client.compatibility.assertCompatible()).rejects.toThrow(
      "digest does not match",
    );
  });

  test.each(["2026.10", "2026.09"])("retains older deployment %s without claiming retired capabilities", async (contractVersion) => {
    const { client } = clientFor({
      contractVersion,
      contractDigest: "sha256:a4bf84ca528369216fafe1613fc97304f1c7b0219b85032388b5003f7b2f0d98",
      capabilities: ["collections"],
    });
    await expect(client.compatibility.assertCompatible()).resolves.toMatchObject({ contractVersion, capabilities: ["collections"] });
  });
});
