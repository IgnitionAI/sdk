import { describe, expect, test, beforeEach, mock } from "bun:test";
import { BaseClient } from "../src/client";
import { IgnitionAI } from "../src/index";
import {
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  APIConnectionTimeoutError,
  IgnitionAIError,
  RequestCancelledError,
} from "../src/errors";

function mockFetch(
  response: Partial<Response> & { ok: boolean; status: number }
): typeof fetch {
  return mock(() =>
    Promise.resolve({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText ?? "",
      headers: new Headers(response.headers),
      json: () => Promise.resolve(response.json?.() ?? {}),
      text: () => Promise.resolve(""),
      body: response.body ?? null,
    } as Response)
  ) as unknown as typeof fetch;
}

function jsonResponse(data: unknown, status = 200): typeof fetch {
  return mockFetch({
    ok: status >= 200 && status < 300,
    status,
    json: () => data,
    headers: { "content-type": "application/json" },
  } as any);
}

function errorResponse(
  status: number,
  body: Record<string, unknown>
): typeof fetch {
  return mockFetch({
    ok: false,
    status,
    json: () => body,
    headers: { "content-type": "application/json" },
  } as any);
}

describe("BaseClient constructor", () => {
  test("throws when no API key is provided", () => {
    expect(() => new BaseClient({ baseURL: "http://localhost", fetch: mock(() => {}) as any })).toThrow(
      IgnitionAIError
    );
  });

  test("trusted-runtime factory reads IGNITION_API_KEY", () => {
    const env = process.env.IGNITION_API_KEY;
    process.env.IGNITION_API_KEY = "ign_from_env";
    try {
      const client = IgnitionAI.fromEnv({
        baseURL: "http://localhost",
        fetch: mock(() => {}) as any,
      });
      expect(client.apiKey).toBe("ign_from_env");
    } finally {
      if (env) process.env.IGNITION_API_KEY = env;
      else delete process.env.IGNITION_API_KEY;
    }
  });

  test("explicit apiKey is used by the base client", () => {
    const client = new BaseClient({
      apiKey: "ign_explicit",
      baseURL: "http://localhost",
      fetch: mock(() => {}) as any,
    });
    expect(client.apiKey).toBe("ign_explicit");
  });

  test("requires an explicit deployment baseURL", () => {
    expect(() => new BaseClient({
      apiKey: "ign_test",
      fetch: mock(() => {}) as any,
    })).toThrow("baseURL");
  });

  test("rejects ambiguous authentication configuration", () => {
    expect(() => new BaseClient({
      apiKey: "ign_test",
      tokenProvider: async () => "user-token",
      baseURL: "http://localhost",
      fetch: mock(() => {}) as any,
    })).toThrow("apiKey or tokenProvider");
  });

  test("strips trailing slash from baseURL", () => {
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "https://custom.api.com/",
      fetch: mock(() => {}) as any,
    });
    expect(client.baseURL).toBe("https://custom.api.com");
  });
});

describe("buildURL", () => {
  test("appends /api prefix to path", () => {
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: mock(() => {}) as any,
    });
    expect(client.buildURL("/chat")).toBe(
      "http://localhost/api/chat"
    );
    expect(client.buildURL("/agents/123/chat/stream")).toBe(
      "http://localhost/api/agents/123/chat/stream"
    );
  });
});

describe("buildHeaders", () => {
  test("includes authorization, content-type, and user-agent", () => {
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: mock(() => {}) as any,
    });
    const headers = client.buildHeaders();
    expect(headers["Authorization"]).toBe("Bearer ign_test");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["User-Agent"]).toMatch(/^ignitionai-ts\//);
  });

  test("omits Content-Type when multipart", () => {
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: mock(() => {}) as any,
    });
    const headers = client.buildHeaders(undefined, true);
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers["Authorization"]).toBe("Bearer ign_test");
  });

  test("merges defaultHeaders and extra headers", () => {
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      defaultHeaders: { "X-Custom": "default" },
      fetch: mock(() => {}) as any,
    });
    const headers = client.buildHeaders({ "X-Extra": "extra" });
    expect(headers["X-Custom"]).toBe("default");
    expect(headers["X-Extra"]).toBe("extra");
  });
});

describe("request", () => {
  test("resolves a fresh browser token for each request", async () => {
    let token = "first-token";
    const fetchMock = jsonResponse({ ok: true });
    const client = new BaseClient({
      tokenProvider: async () => token,
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 0,
    });

    await client.request("GET", "/meta");
    token = "second-token";
    await client.request("GET", "/meta");

    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer first-token",
    });
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject({
      Authorization: "Bearer second-token",
    });
  });

  test("fails closed when the deployment redirects an authenticated request", async () => {
    const fetchMock = mock(() => Promise.resolve(new Response(null, {
      status: 302,
      headers: { Location: "https://attacker.example/api/chat" },
    }))) as unknown as typeof fetch;
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "https://rag.example",
      fetch: fetchMock,
      maxRetries: 0,
    });

    await expect(client.request("GET", "/chat")).rejects.toThrow("redirect");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).redirect).toBe("manual");
  });

  test("returns parsed JSON on success", async () => {
    const fetchMock = jsonResponse({ answer: "hello", sources: [] });
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 0,
    });

    const result = await client.request<{ answer: string }>(
      "POST",
      "/chat",
      { body: JSON.stringify({ query: "hi" }) }
    );
    expect(result.answer).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("throws AuthenticationError on 401", async () => {
    const client = new BaseClient({
      apiKey: "ign_bad",
      baseURL: "http://localhost",
      fetch: errorResponse(401, { error: "Invalid API key" }),
      maxRetries: 0,
    });

    await expect(client.request("GET", "/agents")).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  test("throws BadRequestError on 400", async () => {
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: errorResponse(400, { error: "Missing field" }),
      maxRetries: 0,
    });

    await expect(
      client.request("POST", "/chat", { body: "{}" })
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  test("retries on 500 and eventually throws", async () => {
    const fetchMock = errorResponse(500, { error: "Server error" });
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
      timeout: 5000,
    });

    await expect(client.request("GET", "/agents")).rejects.toBeInstanceOf(
      InternalServerError
    );
    // 1 initial + 2 retries = 3 total calls
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("does not retry a mutating request without an idempotency key", async () => {
    const fetchMock = errorResponse(500, { error: "Server error" });
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
    });

    await expect(client.request("POST", "/chat", { body: "{}" })).rejects.toBeInstanceOf(
      InternalServerError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("distinguishes caller cancellation from a timeout and never retries it", async () => {
    const fetchMock = mock((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    })) as unknown as typeof fetch;
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
    });
    const controller = new AbortController();
    const request = client.request("GET", "/agents", { signal: controller.signal });
    controller.abort();

    await expect(request).rejects.toBeInstanceOf(RequestCancelledError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("does not retry on 400", async () => {
    const fetchMock = errorResponse(400, { error: "Bad request" });
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
    });

    await expect(client.request("POST", "/chat", { body: "{}" })).rejects.toBeInstanceOf(
      BadRequestError
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("does not retry on 401", async () => {
    const fetchMock = errorResponse(401, { error: "Unauthorized" });
    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
    });

    await expect(client.request("GET", "/agents")).rejects.toBeInstanceOf(
      AuthenticationError
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("succeeds after retry when server recovers", async () => {
    let callCount = 0;
    const fetchMock = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Server Error",
          headers: new Headers(),
          json: () => Promise.resolve({ error: "Temporary" }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ agents: [] }),
      } as Response);
    }) as unknown as typeof fetch;

    const client = new BaseClient({
      apiKey: "ign_test",
      baseURL: "http://localhost",
      fetch: fetchMock,
      maxRetries: 2,
    });

    const result = await client.request<{ agents: unknown[] }>(
      "GET",
      "/agents"
    );
    expect(result.agents).toEqual([]);
    expect(callCount).toBe(2);
  });
});
