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

describe("widgets", () => {
  test("supports management, key rotation, and analytics", async () => {
    const { client, fetchMock } = clientWith({ widgets: [], id: "widget_1" });

    await client.widgets.list();
    await client.widgets.get("widget_1");
    await client.widgets.create({ name: "Support", type: "agent", agentId: "agent_1" });
    await client.widgets.update("widget_1", { isActive: false });
    await client.widgets.regenerateKey("widget_1");
    await client.widgets.analytics("widget_1", "7d");
    await client.widgets.delete("widget_1");

    expect(fetchMock.mock.calls.map((call) => [
      (call[1] as RequestInit).method,
      call[0],
    ])).toEqual([
      ["GET", "http://localhost/api/widgets"],
      ["GET", "http://localhost/api/widgets/widget_1"],
      ["POST", "http://localhost/api/widgets"],
      ["PUT", "http://localhost/api/widgets/widget_1"],
      ["POST", "http://localhost/api/widgets/widget_1/regenerate-key"],
      ["GET", "http://localhost/api/widgets/widget_1/analytics?period=7d"],
      ["DELETE", "http://localhost/api/widgets/widget_1"],
    ]);
  });
});

describe("managed widget contract", () => {
  test("rejects provider configuration before dispatch and projects a safe response", async () => {
    const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify({
      id: "widget_1", name: "Support", type: "agent", collectionId: null, agentId: "agent_1", workflowId: null,
      workflowConfig: { buttonLabel: "Run", apiKey: "secret" }, keyPrefix: "wgt_", allowedDomains: [],
      theme: { preset: "dark", primaryColor: "#000", providerConfig: "secret" }, position: "bottom-right",
      welcomeMessage: null, placeholder: null, suggestions: [], avatarUrl: null, displayMode: "support", locale: null,
      headerTitle: null, hidePoweredBy: true, customCss: null, humanEscalation: { type: "webhook", target: "https://example.test/?token=secret" },
      rateLimitPerMinute: 10, sessionTtlMinutes: 30, isActive: true, createdAt: "now", updatedAt: "now",
      llmConfigId: "private-config", llmModel: "private-model", llmSource: "byok",
    }), { status: 200, headers: { "Content-Type": "application/json" } }))) as unknown as typeof fetch;
    const client = new IgnitionAI({ apiKey: "ign_test", baseURL: "http://localhost", fetch: fetchMock, maxRetries: 0 });

    await expect(client.widgets.managed.create({ name: "Nope", type: "agent", llmModel: "private-model" } as never))
      .rejects.toThrow("Managed widgets cannot select a provider or include secret configuration");
    await expect(client.widgets.managed.create({ name: "Nope", type: "workflow-form", workflowConfig: { providerKey: "private-key" } } as never))
      .rejects.toThrow("Managed contract does not accept providerKey");
    expect(fetchMock).not.toHaveBeenCalled();

    const widget = await client.widgets.managed.get("widget_1");
    expect(widget.name).toBe("Support");
    expect(widget.theme).toEqual({ preset: "dark", primaryColor: "#000" });
    expect(widget.workflowConfig).toEqual({ buttonLabel: "Run" });
    expect(widget).not.toHaveProperty("llmConfigId");
    expect(widget).not.toHaveProperty("humanEscalation");
  });

  test("sends the strict business contract and retains licensed widget fields", async () => {
    const fetchMock = mock(() => Promise.resolve(new Response(JSON.stringify({
      widget: { id: "widget_1", name: "Managed", llmModel: "private-model", llmConfigId: "private-id" },
      widgetKey: "wgt_public_once", embedCode: "<script>public widget key</script>",
    }), { status: 200, headers: { "Content-Type": "application/json" } }))) as unknown as typeof fetch;
    const client = new IgnitionAI({ apiKey: "ign_test", baseURL: "http://localhost", fetch: fetchMock, maxRetries: 0 });
    const created = await client.widgets.managed.create({ name: "Managed", type: "agent", agentId: "agent_1" });
    expect(created.widget).not.toHaveProperty("llmModel");
    expect(created.widgetKey).toBe("wgt_public_once");
    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body).toEqual({ name: "Managed", type: "agent", agentId: "agent_1" });

    await client.widgets.create({ name: "Licensed", type: "agent", llmModel: "self-hosted-model" });
    expect(JSON.parse((fetchMock as any).mock.calls[1][1].body).llmModel).toBe("self-hosted-model");
  });
});
