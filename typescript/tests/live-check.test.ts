import { describe, expect, test } from "bun:test";
import { PUBLIC_CONTRACT_DIGEST, PUBLIC_CONTRACT_VERSION } from "../src/contract.js";

const fixtureKey = "ign_live_diagnostic_fixture";
const privateId = "private-collection-fixture";

async function runDiagnostic(options: {
  version?: string; collections?: unknown; deniedStatus?: number; insightsError?: string;
} = {}) {
  const requests: Array<{ method: string; path: string; authenticated: boolean }> = [];
  const server = Bun.serve({
    hostname: "127.0.0.1", port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      requests.push({ method: request.method, path,
        authenticated: request.headers.get("authorization") === `Bearer ${fixtureKey}` });
      if (path === "/api/meta") return Response.json({
        contractVersion: options.version ?? PUBLIC_CONTRACT_VERSION,
        contractDigest: PUBLIC_CONTRACT_DIGEST, capabilities: [],
      });
      if (path === "/api/collections") return Response.json(options.collections ??
        (options.insightsError ? [{ id: "collection-fixture" }] : []));
      if (path === "/api/collections/collection-fixture") return Response.json({ id: "collection-fixture", name: "Collection" });
      if (path.endsWith("/chunks")) return Response.json({ chunks: [], total: 0 });
      if (path.endsWith("/stats")) return Response.json({ totalChunks: 0, bySourceType: [], byType: [] });
      if (path.endsWith("/quality-report")) return Response.json({ totalDocuments: 0 });
      if (path.endsWith("/documents")) return Response.json({ documents: [] });
      if (path.endsWith("/evaluations")) return Response.json({ evaluations: [] });
      if (path.endsWith("/insights")) return Response.json({ error: options.insightsError }, { status: 404 });
      if (path === `/api/collections/${privateId}`) return Response.json(
        { error: `Sensitive server message: ${fixtureKey}` }, { status: options.deniedStatus ?? 403 });
      if (path === "/api/workflows") return Response.json([{ id: "workflow-fixture" }]);
      if (path === "/api/workflows/workflow-fixture") return Response.json({
        id: "workflow-fixture", name: "Private workflow name", graph: { nodes: [], edges: [] },
      });
      return Response.json([]);
    },
  });
  try {
    const child = Bun.spawn([process.execPath, "run", "scripts/check-live.ts"], {
      cwd: `${import.meta.dir}/..`,
      env: { ...process.env, IGNITION_BASE_URL: server.url.toString(), IGNITION_API_KEY: fixtureKey,
        IGNITION_FORBIDDEN_COLLECTION_IDS: privateId },
      stdout: "pipe", stderr: "pipe",
    });
    const [output, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
    ]);
    return { output, stderr, exitCode, requests };
  } finally {
    await server.stop(true);
  }
}

describe("live diagnostic CLI", () => {
  test("authenticates real GET requests, validates workflow graphs and reports missing coverage without leaking data", async () => {
    const result = await runDiagnostic();
    expect(result.exitCode).toBe(0);
    expect(result.requests.length).toBeGreaterThan(5);
    expect(result.requests.every(request => request.method === "GET" && request.authenticated)).toBe(true);
    expect(result.output).toContain('"name":"workflows[0].get","outcome":"PASS"');
    expect(result.output).toContain('"name":"scope.isolation[0]","outcome":"PASS"');
    expect(result.output).toContain('"outcome":"NOT PROVEN"');
    for (const sensitive of [fixtureKey, privateId, "Private workflow name", "Sensitive server message"]) {
      expect(result.output + result.stderr).not.toContain(sensitive);
    }
  });

  test.each([
    { version: "2099.01", expected: "UnsupportedContractVersionError" },
    { collections: { collections: [] }, expected: "ProtocolError" },
    { deniedStatus: 401, expected: '"name":"scope.isolation[0]","outcome":"FAIL"' },
    { deniedStatus: 200, expected: "Foreign private resource is readable" },
  ])("fails on incompatible deployments, invalid shapes or unsuccessful isolation ($expected)", async options => {
    const result = await runDiagnostic(options);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain(options.expected);
    expect(result.output).toContain('"name":"workflows[0].get","outcome":"PASS"');
    expect(result.output).not.toContain(fixtureKey);
  });

  test.each([
    { message: "Insights not yet generated", outcome: "NOT PROVEN", exitCode: 0 },
    { message: "Route not found", outcome: "FAIL", exitCode: 1 },
  ])("distinguishes unavailable insights from a missing route ($outcome)", async fixture => {
    const result = await runDiagnostic({ insightsError: fixture.message });
    expect(result.exitCode).toBe(fixture.exitCode);
    expect(result.output).toContain(`"name":"collections[0].insights","outcome":"${fixture.outcome}"`);
  });
});
