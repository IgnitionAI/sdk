import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import openapiTS, { astToString, type OpenAPI3 } from "openapi-typescript";

function valueAfter(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}

const contractPath = valueAfter(process.argv, "--contract");
if (!contractPath) {
  throw new Error("--contract must point to a verified public SDK contract artifact");
}
const outputPath = resolve(
  valueAfter(process.argv, "--output") ?? "src/generated/public-api.ts",
);
const identityOutputPath = resolve(
  valueAfter(process.argv, "--identity-output") ?? "src/contract.ts",
);
const previousContract = valueAfter(process.argv, "--previous-contract") ?? "2026.06";

const artifact = JSON.parse(await Bun.file(resolve(contractPath)).text()) as {
  payload?: {
    schemaVersion?: number;
    contractVersion?: string;
    releaseSequence?: number;
    sourceCommit?: string;
    manifest?: Record<string, unknown>;
    openapi?: OpenAPI3;
    protocols?: Record<string, unknown>;
  };
};
if (!artifact.payload?.openapi || !artifact.payload.contractVersion) {
  throw new Error("The contract artifact does not contain payload.openapi");
}

const ast = await openapiTS(artifact.payload.openapi, {
  alphabetize: true,
  exportType: true,
  immutable: true,
});
const source = [
  "// Generated from the verified IgnitionRAG public contract.",
  "// Do not edit and do not export this module from the package root.",
  astToString(ast),
].join("\n");

await mkdir(dirname(outputPath), { recursive: true });
await Bun.write(outputPath, source);

const contractShape = {
  schemaVersion: artifact.payload.schemaVersion,
  contractVersion: artifact.payload.contractVersion,
  manifest: artifact.payload.manifest,
  openapi: artifact.payload.openapi,
  protocols: artifact.payload.protocols,
};
const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(
      (key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value);
};
const digest = new Bun.CryptoHasher("sha256")
  .update(stableStringify(contractShape))
  .digest("hex");
const identitySource = `// Generated from the verified IgnitionRAG public contract.\n` +
  `export const PUBLIC_CONTRACT_VERSION = ${JSON.stringify(artifact.payload.contractVersion)} as const;\n` +
  `export const PUBLIC_CONTRACT_DIGEST = ${JSON.stringify(`sha256:${digest}`)} as const;\n` +
  `export const SUPPORTED_CONTRACT_VERSIONS = [${JSON.stringify(artifact.payload.contractVersion)}, ${JSON.stringify(previousContract)}] as const;\n`;
await mkdir(dirname(identityOutputPath), { recursive: true });
await Bun.write(identityOutputPath, identitySource);
console.log(`Generated public wire types: ${outputPath}`);
console.log(`Generated public contract identity: ${identityOutputPath}`);
