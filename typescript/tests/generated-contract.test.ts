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
    expect(generated).not.toContain("/api/admin");
    expect(generated).not.toContain("/api/internal/mcp");
  });

  test("is not re-exported from the ergonomic package root", () => {
    expect(packageRoot).not.toContain("generated/public-api");
  });

  test("binds the SDK to the generated aggregate contract digest", () => {
    expect(identity).toContain("sha256:a83d9ad89dc77c3d2ab0daae07596aabe161cfe1c4e28ba4afbc500a04ed1fb5");
    expect(identity).toContain('["2026.07", "2026.06"]');
  });
});
