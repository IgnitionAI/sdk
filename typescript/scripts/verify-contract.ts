import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PUBLIC_CONTRACT_DIGEST, PUBLIC_CONTRACT_VERSION } from "../src/contract.js";

function valueAfter(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(
      (key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

function decodeBase64(value: string): ArrayBuffer {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)).buffer;
}

function resolvePublicFile(explicit: string | undefined, ...relativePaths: string[]): string {
  if (explicit) return resolve(explicit);
  const roots = [resolve(import.meta.dir, ".."), resolve(import.meta.dir, "../..")];
  for (const relativePath of relativePaths) {
    for (const root of roots) {
      const absolute = resolve(root, relativePath);
      if (existsSync(absolute)) return absolute;
    }
  }
  throw new Error(`Unable to locate ${relativePaths.join(" or ")}`);
}

const requireSdkIdentity = process.argv.includes("--require-sdk-identity");
const explicitContract = valueAfter(process.argv, "--contract");
const contractPath = resolvePublicFile(
  explicitContract,
  `contracts/${PUBLIC_CONTRACT_VERSION}/public-sdk-contract.json`,
  // Last signed artifact in this private archive. Identity 2026.11 is prepared
  // but unsigned here; official signing targets IgnitionAI/sdk, not this path.
  ...(requireSdkIdentity ? [] : ["contracts/2026.07/public-sdk-contract.json"]),
);
const usedPrivateFallback = !explicitContract && !contractPath.endsWith(
  `/contracts/${PUBLIC_CONTRACT_VERSION}/public-sdk-contract.json`,
);
const trustedKeysPath = resolvePublicFile(
  valueAfter(process.argv, "--trusted-keys"),
  "contracts/trusted-keys.json",
);
const minimumReleaseSequence = Number(
  valueAfter(process.argv, "--minimum-release-sequence") ?? "1",
);
if (!Number.isSafeInteger(minimumReleaseSequence) || minimumReleaseSequence < 1) {
  throw new Error("--minimum-release-sequence must be a positive integer");
}

const artifact = JSON.parse(await Bun.file(contractPath).text()) as {
  payload: { releaseSequence: number; contractVersion?: unknown } & Record<string, unknown>;
  digest: string;
  signature: null | { algorithm: string; keyId: string; value: string };
};
const trustedKeys = JSON.parse(await Bun.file(trustedKeysPath).text()) as Record<string, string>;

if (!artifact.signature) throw new Error("Public release contract is unsigned");
if (artifact.signature.algorithm !== "ed25519") {
  throw new Error(`Unsupported contract signature: ${artifact.signature.algorithm}`);
}
if (artifact.payload.releaseSequence < minimumReleaseSequence) {
  throw new Error("Public contract is replayed or downgraded");
}

const digestBytes = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(stableStringify(artifact.payload)),
);
const expectedDigest = `sha256:${Buffer.from(digestBytes).toString("hex")}`;
if (artifact.digest !== expectedDigest) throw new Error("Public contract digest mismatch");

const publicKeyRaw = trustedKeys[artifact.signature.keyId];
if (!publicKeyRaw) throw new Error(`Untrusted contract key: ${artifact.signature.keyId}`);
const publicKey = await crypto.subtle.importKey(
  "raw",
  decodeBase64(publicKeyRaw),
  { name: "Ed25519" },
  false,
  ["verify"],
);
const valid = await crypto.subtle.verify(
  { name: "Ed25519" },
  publicKey,
  decodeBase64(artifact.signature.value),
  new TextEncoder().encode(stableStringify({
    payload: artifact.payload,
    digest: artifact.digest,
  })),
);
if (!valid) throw new Error("Public contract signature mismatch");

const verifiedVersion = typeof artifact.payload.contractVersion === "string"
  ? artifact.payload.contractVersion
  : "unknown";
if (requireSdkIdentity && verifiedVersion !== PUBLIC_CONTRACT_VERSION) {
  throw new Error(`Signed contract version ${verifiedVersion} does not match SDK identity ${PUBLIC_CONTRACT_VERSION}`);
}
if (verifiedVersion === PUBLIC_CONTRACT_VERSION) {
  const { schemaVersion, contractVersion, manifest, openapi, protocols } = artifact.payload;
  const shapeBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stableStringify({ schemaVersion, contractVersion, manifest, openapi, protocols })),
  );
  const shapeDigest = `sha256:${Buffer.from(shapeBytes).toString("hex")}`;
  if (shapeDigest !== PUBLIC_CONTRACT_DIGEST) {
    throw new Error("Signed contract shape does not match the generated SDK identity");
  }
}

console.log(
  `Verified contract sequence ${artifact.payload.releaseSequence} version ${verifiedVersion} at ${contractPath} with ${artifact.signature.keyId}`,
);
if (verifiedVersion !== PUBLIC_CONTRACT_VERSION) {
  if (usedPrivateFallback) {
    console.log(
      `Using last signed private archive ${verifiedVersion}; SDK identity ${PUBLIC_CONTRACT_VERSION} is unsigned in this tree.`,
    );
  } else {
    console.warn(
      `Warning: verified archive version ${verifiedVersion} differs from SDK identity ${PUBLIC_CONTRACT_VERSION}`,
    );
  }
}
