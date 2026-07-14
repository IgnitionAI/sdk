import { describe, expect, test, mock } from "bun:test";
import { IgnitionAI } from "../src/index";

function jsonFetch(data: unknown, status = 200): typeof fetch {
  return mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    )
  ) as unknown as typeof fetch;
}

function createClient(fetchMock: typeof fetch): IgnitionAI {
  return new IgnitionAI({
    apiKey: "ign_test",
    baseURL: "http://localhost",
    fetch: fetchMock,
    maxRetries: 0,
  });
}

describe("agents.list", () => {
  test("GET /agents and returns agent array", async () => {
    const agents = [
			{ id: "agent_1", name: "Bot A", model: "gpt-4.1-mini", isActive: true },
			{ id: "agent_2", name: "Bot B", model: "gpt-4o", isActive: false },
		];
    const fetchMock = jsonFetch({ agents });
    const client = createClient(fetchMock);

    const result = await client.agents.list();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Bot A");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/agents");
    expect(call[1].method).toBe("GET");
  });
});

describe("agents.get", () => {
  test("GET /agents/:id", async () => {
    const agent = { id: "agent_1", name: "Bot A", model: "gpt-4.1-mini" };
    const fetchMock = jsonFetch(agent);
    const client = createClient(fetchMock);

    const result = await client.agents.get("agent_1");
    expect(result.name).toBe("Bot A");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/agents/agent_1");
  });
});

describe("agents.create", () => {
  test("POST /agents with params", async () => {
    const created = {
			id: "agent_new",
			name: "Support Bot",
			model: "gpt-4.1-mini",
		};
    const fetchMock = jsonFetch(created);
    const client = createClient(fetchMock);

    const result = await client.agents.create({
			name: "Support Bot",
			collectionId: "coll_123",
			model: "gpt-4.1-mini",
			temperature: 30,
			enabledBuiltinTools: ["web_search"],
		});

    expect(result.name).toBe("Support Bot");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe("Support Bot");
    expect(body.collectionId).toBe("coll_123");
    expect(body.enabledBuiltinTools).toEqual(["web_search"]);
  });

  test("POST /agents with human-in-the-loop tool policies", async () => {
    const created = {
			id: "agent_new",
			name: "Support Bot",
			model: "gpt-4.1-mini",
		};
    const fetchMock = jsonFetch(created);
    const client = createClient(fetchMock);

    await client.agents.create({
      name: "Support Bot",
      enabledBuiltinTools: [
        "current_date",
        { id: "calculator", humanInTheLoop: true },
      ],
      mcpServers: [
        {
          name: "Slack",
          url: "https://mcp.example.com/slack",
          toolPolicies: {
            post_message: { humanInTheLoop: true },
          },
        },
      ],
    });

    const call = (fetchMock as any).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.enabledBuiltinTools).toEqual([
      "current_date",
      { id: "calculator", humanInTheLoop: true },
    ]);
    expect(body.mcpServers[0].toolPolicies.post_message).toEqual({
      humanInTheLoop: true,
    });
  });
});

describe("agents.update", () => {
  test("PATCH /agents/:id with partial params", async () => {
    const updated = { id: "agent_1", name: "Bot A", temperature: 50 };
    const fetchMock = jsonFetch(updated);
    const client = createClient(fetchMock);

    await client.agents.update("agent_1", { temperature: 50 });

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/agents/agent_1");
    expect(call[1].method).toBe("PATCH");
    const body = JSON.parse(call[1].body);
    expect(body.temperature).toBe(50);
  });
});

describe("agents.delete", () => {
  test("DELETE /agents/:id (soft delete)", async () => {
    const fetchMock = jsonFetch({ success: true });
    const client = createClient(fetchMock);

    const result = await client.agents.delete("agent_1");
    expect(result.success).toBe(true);

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/agents/agent_1");
    expect(call[0]).not.toContain("force");
    expect(call[1].method).toBe("DELETE");
  });

  test("DELETE /agents/:id?force=true (hard delete)", async () => {
    const fetchMock = jsonFetch({ success: true, permanent: true });
    const client = createClient(fetchMock);

    const result = await client.agents.delete("agent_1", true);
    expect(result.permanent).toBe(true);

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("force=true");
  });
});

describe("agents.generate", () => {
  test("POST /agents/generate with description", async () => {
    const generated = {
			name: "Assistant Support",
			systemPrompt: "Tu es un agent...",
			model: "gpt-4.1-mini",
			temperature: 30,
		};
    const fetchMock = jsonFetch(generated);
    const client = createClient(fetchMock);

    const result = await client.agents.generate({
      description: "Un assistant support pour notre SaaS",
      language: "fr",
    });

    expect(result.name).toBe("Assistant Support");

    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.description).toBe("Un assistant support pour notre SaaS");
    expect(body.language).toBe("fr");
  });
});
