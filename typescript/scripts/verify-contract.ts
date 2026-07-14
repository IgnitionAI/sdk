import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

function resolvePublicFile(explicit: string | undefined, relativePath: string): string {
  if (explicit) return resolve(explicit);
  for (const candidate of [relativePath, `../${relativePath}`]) {
    const absolute = resolve(candidate);
    if (existsSync(absolute)) return absolute;
  }
  throw new Error(`Unable to locate ${relativePath}`);
}

const contractPath = resolvePublicFile(
  valueAfter(process.argv, "--contract"),
  "contracts/2026.07/public-sdk-contract.json",
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
  payload: { releaseSequence: number } & Record<string, unknown>;
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

console.log(
  `Verified contract sequence ${artifact.payload.releaseSequence} with ${artifact.signature.keyId}`,
);
