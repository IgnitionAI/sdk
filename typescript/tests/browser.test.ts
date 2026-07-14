import { describe, expect, mock, test } from "bun:test";
import { IgnitionAI as BrowserIgnitionAI } from "../src/browser";

describe("browser SDK entry point", () => {
  test("authenticates only through a token provider", async () => {
    const fetchMock = mock(() => Promise.resolve(new Response(
      JSON.stringify({ contractVersion: "2026.07", contractDigest: "sha256:test", capabilities: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ))) as unknown as typeof fetch;
    const client = new BrowserIgnitionAI({
      baseURL: "https://rag.example",
      tokenProvider: () => "user-token",
      fetch: fetchMock,
      maxRetries: 0,
    });

    await client.request("GET", "/meta");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer user-token",
    });
  });

  test("rejects API keys even when JavaScript bypasses TypeScript", () => {
    expect(() => new BrowserIgnitionAI({
      baseURL: "https://rag.example",
      tokenProvider: () => "user-token",
      apiKey: "ign_must_not_be_in_browser",
    } as never)).toThrow("does not accept API keys");
  });
});
