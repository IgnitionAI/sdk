import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

async function generate(previous: string[]) {
  const directory = await mkdtemp(join(tmpdir(), "sdk-generations-"));
  directories.push(directory);
  const contract = join(directory, "candidate.json");
  await writeFile(contract, JSON.stringify({ payload: {
    schemaVersion: 1, contractVersion: "2026.11", manifest: {}, protocols: {},
    openapi: { openapi: "3.1.0", info: { title: "Synthetic public contract", version: "2026.11" }, paths: {} },
  } }));
  const identity = join(directory, "contract.ts");
  const python = join(directory, "contract.py");
  const proc = Bun.spawn([process.execPath, join(import.meta.dir, "../scripts/generate-wire-types.ts"),
    "--contract", contract, "--output", join(directory, "wire.ts"), "--identity-output", identity,
    "--python-identity-output", python, ...previous.flatMap((version) => ["--previous-contract", version]),
  ], { stdout: "pipe", stderr: "pipe" });
  const [exit, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text(), new Response(proc.stdout).text()]);
  return { exit, stderr, identity, python };
}

test("retains multiple previous revisions without replacing the current identity", async () => {
  const result = await generate(["2026.10", "2026.09", "2026.10"]);
  expect(result.exit).toBe(0);
  expect(await readFile(result.identity, "utf8")).toContain('["2026.11","2026.10","2026.09"]');
  expect(await readFile(result.python, "utf8")).toContain('("2026.11", "2026.10", "2026.09")');
});

test.each(["2026.13", "2026.12", "2026.11", "--output"])("rejects invalid or newer previous revision %s before writing identities", async (version) => {
    const result = await generate([version]);
    expect(result.exit).not.toBe(0);
    expect(result.stderr).toContain("--previous-contract");
    expect(await Bun.file(result.identity).exists()).toBe(false);
});
