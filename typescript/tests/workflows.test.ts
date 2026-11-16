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

describe("workflows", () => {
  test("supports CRUD and validation", async () => {
    const { client, fetchMock } = clientWith({ id: "wf_1", name: "Review" });
    await client.workflows.list();
    await client.workflows.get("wf_1");
    await client.workflows.create({ name: "Review", isActive: false });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ name: "Review", isActive: false });
    await client.workflows.update("wf_1", { isActive: true });
    await client.workflows.validate("wf_1");
    await client.workflows.delete("wf_1");

    expect(fetchMock.mock.calls.map((call) => [
      (call[1] as RequestInit).method,
      call[0],
    ])).toEqual([
      ["GET", "http://localhost/api/workflows"],
      ["GET", "http://localhost/api/workflows/wf_1"],
      ["POST", "http://localhost/api/workflows"],
      ["PATCH", "http://localhost/api/workflows/wf_1"],
      ["POST", "http://localhost/api/workflows/wf_1/validate"],
      ["DELETE", "http://localhost/api/workflows/wf_1"],
    ]);
  });

  test("separates transport calls from explicit remote execution cancellation", async () => {
    const { client, fetchMock } = clientWith({ cancelled: true });
    await client.workflows.execute("wf_1", { input: { documentId: "doc_1" } });
    await client.workflows.listExecutions("wf_1", { limit: 10 });
    await client.workflows.getExecution("exec_1");
    const cancellation = await client.workflows.cancelExecution("exec_1");

    expect(cancellation.cancelled).toBe(true);

    expect(fetchMock.mock.calls.map((call) => [
      (call[1] as RequestInit).method,
      call[0],
    ])).toEqual([
      ["POST", "http://localhost/api/workflows/wf_1/execute"],
      ["GET", "http://localhost/api/workflows/wf_1/executions?limit=10"],
      ["GET", "http://localhost/api/workflows/executions/exec_1"],
      ["DELETE", "http://localhost/api/workflows/executions/exec_1"],
    ]);
  });

  test("supports the explicit managed SaaS execution contract", async () => {
    const { client, fetchMock } = clientWith({
      executionId: "exec_1",
      status: "admitted",
      output: null,
      reconciliationRequired: false,
      maximumMilliCredits: "1000",
      chargedMilliCredits: null,
    });
    await client.workflows.executeManaged("wf_1", {
      requestId: "00000000-0000-0000-0000-000000000001",
      input: { query: "hello" },
    });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body).toEqual({
      requestId: "00000000-0000-0000-0000-000000000001",
      input: { query: "hello" },
    });
  });

  test("rejects a missing managed request identity before transport", async () => {
    const { client, fetchMock } = clientWith({});
    await expect(Promise.resolve().then(() => client.workflows.executeManaged("wf_1", {
      requestId: "",
    }))).rejects.toBeInstanceOf(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
