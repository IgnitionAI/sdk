import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const generated = readFileSync(
  join(import.meta.dir, "../src/generated/public-api.ts"),
  "utf8",
);
const packageRoot = readFileSync(join(import.meta.dir, "../src/index.ts"), "utf8");
const identity = readFileSync(join(import.meta.dir, "../src/contract.ts"), "utf8");

describe("generated public wire contract", () => {
  test("contains only the public operation surface", () => {
    expect(generated).toContain('"/api/chat"');
    expect(generated).toContain('"/api/workflows/:id/execute"');
    expect(generated).toContain('"/api/ingest/jobs/{jobId}"');
    expect(generated).toContain('"/api/traces/{id}"');
    expect(generated).toContain('"/api/feedback"');
    expect(generated).toContain('"/api/collections/:collectionId/rag-config/test"');
    expect(generated).toContain("readonly servedSource?:");
    expect(generated).toContain("readonly officialCorpusQualified: false;");
    expect(generated).not.toContain("/api/admin");
    expect(generated).not.toContain("/api/internal/mcp");
    expect(generated).not.toContain("/api/data-chat");
  });

  test("is not re-exported from the ergonomic package root", () => {
    expect(packageRoot).not.toContain("generated/public-api");
  });

  test("binds the SDK to the generated aggregate contract digest", () => {
    expect(identity).toContain("sha256:37839de6724326e9d7ad949a08f95dcc2d960580d9fc2c8bad0933ce8b4ef78d");
    expect(identity).toContain('["2026.11","2026.10","2026.09"]');
  });
});
