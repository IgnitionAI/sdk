import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { $ } from "bun";

const forbiddenTopLevel = ["back", "front", "deploy", "docker-compose.yml", ".env"];
for (const path of forbiddenTopLevel) {
  if (existsSync(path)) throw new Error(`Private product path leaked: ${path}`);
}

async function filesUnder(root: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) output.push(...await filesUnder(path));
    else output.push(path);
  }
  return output;
}

const forbiddenContractFragments = [
  "/api/admin", "/api/keys", "/api/auth", "/api/widgets",
  "encryptedCredentials", "licenseId", "deploymentId",
];
for (const path of await filesUnder("contracts")) {
  const body = await readFile(path, "utf8");
  for (const fragment of forbiddenContractFragments) {
    if (body.includes(fragment)) throw new Error(`Private contract fragment ${fragment} in ${path}`);
  }
}

const privateKeyMarker = ["PRIVATE", " KEY"].join("");
const secretPatterns = [privateKeyMarker, "CLERK_SECRET", "STRIPE_SECRET", "DATABASE_URL"];
for (const path of [...await filesUnder("typescript/src"), ...await filesUnder("contracts")]) {
  const body = await readFile(path, "utf8");
  for (const pattern of secretPatterns) {
    if (body.includes(pattern)) throw new Error(`Secret marker ${pattern} in ${path}`);
  }
}

if (process.argv.includes("--built")) {
  for (const path of await filesUnder("typescript/dist")) {
    if (!path.includes("/browser") && !path.endsWith("/client.js")) continue;
    const body = await readFile(path, "utf8");
    if (body.includes("process.env") || body.includes("IGNITION_API_KEY")) {
      throw new Error(`Server credential access leaked into browser build: ${path}`);
    }
  }
  const destination = await mkdtemp(join(tmpdir(), "ignition-sdk-pack-"));
  try {
    await $`bun pm pack --destination ${destination}`.cwd("typescript").quiet();
    const archives = (await readdir(destination)).filter((name) => name.endsWith(".tgz"));
    if (archives.length !== 1) throw new Error("Expected one SDK package archive");
    const listing = await $`tar -tzf ${join(destination, archives[0])}`.text();
    const unexpected = listing.split("\n").filter(Boolean).filter((path) =>
      !path.startsWith("package/dist/") &&
      !["package/package.json", "package/README.md", "package/LICENSE"].includes(path)
    );
    if (unexpected.length) throw new Error(`Unexpected npm files: ${unexpected.join(", ")}`);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
}

console.log(`Public surface valid from ${relative(process.cwd(), process.cwd()) || "."}`);
