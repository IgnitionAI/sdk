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
  test("preserves explicit licensed provider selection and nullable update fields", async () => {
    const bodies: unknown[] = [];
    const client = createClient(async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json({ id: "agent-fixture", name: "Licensed" });
    });
    await client.agents.create({ name: "Licensed", llmConfigId: "primary-config", fallbackLlmConfigId: null, runtimeKind: "byok_api" });
    await client.agents.update("agent-fixture", { llmConfigId: null, fallbackLlmConfigId: "fallback-config", runtimeKind: "byok_api" });
    expect(bodies).toEqual([
      { name: "Licensed", llmConfigId: "primary-config", fallbackLlmConfigId: null, runtimeKind: "byok_api" },
      { llmConfigId: null, fallbackLlmConfigId: "fallback-config", runtimeKind: "byok_api" },
    ]);
  });

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

describe("managed agent contract", () => {
  test("rejects provider/runtime overrides before dispatch and strips private response fields", async () => {
    const fetchMock = jsonFetch({ agents: [{
      id: "agent_1", name: "Support", description: null, collectionId: "collection_1",
      systemPrompt: "Help customers", instructions: null, enabledBuiltinTools: ["web_search"],
      skillIds: [], workflowToolIds: [], isActive: true, createdAt: "now", updatedAt: "now",
      model: "secret-model", llmConfigId: "secret-config", mcpServers: [{ token: "secret-token" }],
      runtimePreferences: { model: "also-secret" },
    }] });
    const client = createClient(fetchMock);

    await expect(client.agents.managed.create({ name: "Nope", model: "private-model" } as never))
      .rejects.toThrow("Managed agents cannot override provider or runtime configuration");
    await expect(client.agents.managed.create({ name: "Nope", mcpServers: [{ token: "private-token" }] } as never))
      .rejects.toThrow("Managed agents cannot override provider or runtime configuration");
    expect(fetchMock).not.toHaveBeenCalled();

    const agents = await client.agents.managed.list();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("Support");
    expect(agents[0]).not.toHaveProperty("model");
    expect(agents[0]).not.toHaveProperty("llmConfigId");
    expect(agents[0]).not.toHaveProperty("mcpServers");
    expect(agents[0]).not.toHaveProperty("runtimePreferences");
  });

  test("sends only managed business fields and preserves licensed resource methods", async () => {
    const fetchMock = jsonFetch({
      id: "agent_1", name: "Support", description: null, collectionId: null,
      systemPrompt: "Help", instructions: null, enabledBuiltinTools: ["web_search"],
      skillIds: [], workflowToolIds: [], isActive: true, createdAt: "now", updatedAt: "now",
      model: "private-model", llmConfigId: "private-config",
    });
    const client = createClient(fetchMock);
    const agent = await client.agents.managed.create({ name: "Support", systemPrompt: "Help" });
    expect(agent.name).toBe("Support");
    expect(agent).not.toHaveProperty("model");
    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body).toEqual({ name: "Support", systemPrompt: "Help" });

    await client.agents.create({ name: "Licensed", model: "local-model" });
    const legacyBody = JSON.parse((fetchMock as any).mock.calls[1][1].body);
    expect(legacyBody.model).toBe("local-model");
  });

  test("updates managed agent activation with a boolean and rejects invalid or provider fields before dispatch", async () => {
    const fetchMock = jsonFetch({
      id: "agent_1", name: "Support", description: null, collectionId: null,
      systemPrompt: "Help", instructions: null, enabledBuiltinTools: [],
      skillIds: [], workflowToolIds: [], isActive: false, createdAt: "now", updatedAt: "now",
    });
    const client = createClient(fetchMock);

    await expect(client.agents.managed.update("agent_1", { isActive: "false" as never }))
      .rejects.toThrow("isActive must be a boolean");
    await expect(client.agents.managed.update("agent_1", { isActive: false, model: "private-model" } as never))
      .rejects.toThrow("Managed agents cannot override provider or runtime configuration");
    await expect(client.agents.managed.create({ name: "Support", isActive: false } as never))
      .rejects.toThrow("Managed contract does not accept isActive");
    expect(fetchMock).not.toHaveBeenCalled();

    const updated = await client.agents.managed.update("agent_1", { isActive: false });
    expect(updated.isActive).toBe(false);
    expect(JSON.parse((fetchMock as any).mock.calls[0][1].body)).toEqual({ isActive: false });
  });
});
