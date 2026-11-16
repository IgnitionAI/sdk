import { IgnitionAI, APIError, NotFoundError, ProtocolError } from "../src/index.js";
import { PUBLIC_CONTRACT_VERSION, PUBLIC_CONTRACT_DIGEST } from "../src/contract.js";

type Outcome = "PASS" | "FAIL" | "NOT PROVEN";
type Check = { name: string; outcome: Outcome; detail?: string; status?: number };
const checks: Check[] = [];

function record(check: Check): void {
  checks.push(check);
  process.stdout.write(`${JSON.stringify(check)}\n`);
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProtocolError("Expected an object");
  }
  return value as Record<string, unknown>;
}

function entities(value: unknown): Array<Record<string, unknown> & { id: string }> {
  if (!Array.isArray(value)) throw new ProtocolError("Expected an array");
  return value.map((item: unknown) => {
    const entry = object(item);
    if (typeof entry.id !== "string" || !entry.id) throw new ProtocolError("Missing ID");
    return { ...entry, id: entry.id };
  });
}

function requireFields(value: unknown, fields: Record<string, "string" | "number" | "array">): void {
  const entry = object(value);
  for (const [key, type] of Object.entries(fields)) {
    const valid = type === "array" ? Array.isArray(entry[key]) : typeof entry[key] === type;
    if (!valid) throw new ProtocolError("Invalid response fields");
  }
}

async function check<T>(name: string, call: () => Promise<T>, validate: (value: T) => void,
  allowMissing: (error: unknown) => boolean = () => false): Promise<T | undefined> {
  try {
    const value = await call();
    validate(value);
    record({ name, outcome: "PASS" });
    return value;
  } catch (error) {
    const missing = allowMissing(error);
    record({ name, outcome: missing ? "NOT PROVEN" : "FAIL",
      detail: missing ? "Resource unavailable" : error instanceof Error ? error.name : "UnknownError",
      status: error instanceof APIError ? error.status : undefined });
    return undefined;
  }
}

async function list(name: string, call: () => Promise<unknown>) {
  const value = await check(name, call, entities);
  if (value === undefined) return [];
  const items = entities(value);
  if (!items.length) record({ name: `${name}.details`, outcome: "NOT PROVEN", detail: "No fixtures" });
  return items;
}

async function checkCollections(sdk: IgnitionAI): Promise<void> {
  const collections = await list("collections.list", () => sdk.collections.list());
  for (const [index, collection] of collections.entries()) {
    const name = `collections[${index}]`;
    const id = encodeURIComponent(collection.id);
    await check(`${name}.get`, () => sdk.collections.get(id), value => {
      requireFields(value, { id: "string", name: "string" });
      if (value.id !== collection.id) throw new ProtocolError("Wrong resource");
    });
    await check(`${name}.chunks`, () => sdk.collections.chunks(id, { limit: 1 }), value => {
      requireFields(value, { chunks: "array", total: "number" });
      entities(value.chunks);
    });
    await check(`${name}.stats`, () => sdk.collections.stats(id), value => {
      requireFields(value, { totalChunks: "number", bySourceType: "array", byType: "array" });
    });
    await check(`${name}.insights`, () => sdk.collections.insights(id), value => {
      requireFields(value, { mainTopics: "string", keyFindings: "string" });
    }, error => error instanceof NotFoundError && error.message === "Insights not yet generated");
    await check(`${name}.qualityReport`, () => sdk.collections.qualityReport(id), value => {
      requireFields(value, { totalDocuments: "number" });
    });
    await check(`${name}.documents`, () => sdk.collections.documents(id), entities);
    const evaluations = await list(`${name}.evaluations`, () => sdk.evaluations.list(id));
    for (const [evaluationIndex, evaluation] of evaluations.entries()) {
      await check(`${name}.evaluations[${evaluationIndex}].get`,
        () => sdk.evaluations.get(encodeURIComponent(evaluation.id)), value => {
          requireFields(value, { id: "string", status: "string" });
          if (value.id !== evaluation.id) throw new ProtocolError("Wrong resource");
        });
    }
  }
}

async function checkAgents(sdk: IgnitionAI): Promise<void> {
  await check("agents.skills", () => sdk.agents.listSkills(), entities);
  const agents = await list("agents.list", () => sdk.agents.list());
  for (const [index, agent] of agents.entries()) {
    const id = encodeURIComponent(agent.id);
    await check(`agents[${index}].get`, () => sdk.agents.get(id), value => {
      requireFields(value, { id: "string", name: "string" });
      if (value.id !== agent.id) throw new ProtocolError("Wrong resource");
    });
    const value = await check(`agents[${index}].deepStatus`, () => sdk.deepResearch.status(id), value => {
      if (value !== null) object(value);
    });
    if (value === null) record({ name: `agents[${index}].deepStatus.active`,
      outcome: "NOT PROVEN", detail: "No active research" });
  }
}

async function checkWorkflows(sdk: IgnitionAI): Promise<void> {
  const workflows = await list("workflows.list", () => sdk.workflows.list());
  for (const [index, workflow] of workflows.entries()) {
    const name = `workflows[${index}]`;
    const id = encodeURIComponent(workflow.id);
    await check(`${name}.get`, () => sdk.workflows.get(id), value => {
      requireFields(value, { id: "string", name: "string" });
      requireFields(value.graph, { nodes: "array", edges: "array" });
      if (value.id !== workflow.id) throw new ProtocolError("Wrong resource");
    });
    const executions = await list(`${name}.executions`, () => sdk.workflows.listExecutions(id, { limit: 1 }));
    for (const execution of executions) {
      await check(`${name}.execution.get`, () => sdk.workflows.getExecution(encodeURIComponent(execution.id)), value => {
        requireFields(value, { id: "string", status: "string" });
        if (value.id !== execution.id) throw new ProtocolError("Wrong resource");
      });
    }
  }
}

async function checkIsolation(sdk: IgnitionAI): Promise<void> {
  const ids = process.env.IGNITION_FORBIDDEN_COLLECTION_IDS?.split(",").filter(Boolean) ?? [];
  if (!ids.length) {
    record({ name: "scope.isolation", outcome: "NOT PROVEN", detail: "No foreign private fixtures supplied" });
    return;
  }
  for (const [index, id] of ids.entries()) {
    try {
      await sdk.collections.get(encodeURIComponent(id.trim()));
      record({ name: `scope.isolation[${index}]`, outcome: "FAIL", detail: "Foreign private resource is readable" });
    } catch (error) {
      const denied = error instanceof APIError && [403, 404].includes(error.status);
      record({ name: `scope.isolation[${index}]`, outcome: denied ? "PASS" : "FAIL",
        status: error instanceof APIError ? error.status : undefined });
    }
  }
}

async function main(): Promise<void> {
  const baseURL = process.env.IGNITION_BASE_URL;
  if (!baseURL) throw new ProtocolError("IGNITION_BASE_URL is required");
  const sdk = IgnitionAI.fromEnv({ baseURL, maxRetries: 0, timeout: 15_000 });
  process.stdout.write(`${JSON.stringify({ sdkContract: PUBLIC_CONTRACT_VERSION, sdkDigest: PUBLIC_CONTRACT_DIGEST })}\n`);
  await check("compatibility", () => sdk.compatibility.assertCompatible(), object);
  await checkCollections(sdk);
  await checkAgents(sdk);
  await checkWorkflows(sdk);
  await checkIsolation(sdk);
  record({ name: "mutating-and-streaming-operations", outcome: "NOT PROVEN", detail: "Read-only diagnostic" });
  const failed = checks.filter(entry => entry.outcome === "FAIL").length;
  process.stdout.write(`${JSON.stringify({ passed: checks.filter(entry => entry.outcome === "PASS").length,
    failed, notProven: checks.filter(entry => entry.outcome === "NOT PROVEN").length })}\n`);
  process.exitCode = failed ? 1 : 0;
}

await main().catch(() => {
  record({ name: "configuration", outcome: "FAIL", detail: "Check IGNITION_BASE_URL and IGNITION_API_KEY" });
  process.exitCode = 1;
});
