import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const readme = readFileSync(join(root, "README.md"), "utf8");
const clientSource = readFileSync(join(root, "src/client.ts"), "utf8");
const typesSource = readFileSync(join(root, "src/types.ts"), "utf8");
const mcpSource = readFileSync(join(root, "src/resources/mcp.ts"), "utf8");

describe("README contract snippets", () => {
  test("documents the SDK timeout default from source", () => {
    expect(clientSource).toContain("this.timeout = options.timeout ?? 60_000");
    expect(typesSource).toContain("Default: 60000");
    expect(readme).toContain("timeout: 60_000");
    expect(readme).toContain("default: 60_000ms");
    expect(readme).not.toContain("default: 30_000ms");
  });

  test("keeps MCP only as an explicitly deprecated compatibility surface", () => {
    expect(mcpSource).toContain("@deprecated");
    expect(readme).toContain("MCP compatibility (deprecated)");
    expect(readme).not.toContain("client.mcp.prompts");
  });
});
