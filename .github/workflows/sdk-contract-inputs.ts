import { appendFile, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

// The private sync intentionally preserves .github/workflows. Keep this policy
// beside those workflows; the contracts/ tree is reserved for signed archives.
const contractPathPattern = /^contracts\/(\d{4}\.(?:0[1-9]|1[0-2]))\/public-sdk-contract\.json$/;
const contractVersionPattern = /^\d{4}\.(?:0[1-9]|1[0-2])$/;

export interface ContractInputs {
  contractPath: string;
  contractVersion: string;
  minimumReleaseSequence: number;
  requireSdkIdentity: boolean;
  previousContracts: string[];
}

type ContractPolicy = {
  schemaVersion: number;
  contracts: Record<string, {
    minimumReleaseSequence: number;
    requireSdkIdentity: boolean;
    previousContracts: string[];
  }>;
};

export function resolveContractInputsFromData(
  sourceMetadata: unknown,
  policyValue: unknown,
  artifactValue: unknown,
): ContractInputs {
  if (!sourceMetadata || typeof sourceMetadata !== "object") {
    throw new Error("SDK source metadata must be an object");
  }
  const metadata = sourceMetadata as { schemaVersion?: unknown; contract?: unknown };
  if (metadata.schemaVersion !== 1) throw new Error("Unsupported SDK source metadata schema");
  const contractPath = metadata.contract;
  if (typeof contractPath !== "string") throw new Error("SDK source metadata has no contract path");
  const pathMatch = contractPathPattern.exec(contractPath);
  if (!pathMatch) throw new Error("SDK source metadata must select a versioned public contract archive");
  const contractVersion = pathMatch[1]!;

  if (!policyValue || typeof policyValue !== "object") throw new Error("SDK contract policy must be an object");
  const policy = policyValue as ContractPolicy;
  if (policy.schemaVersion !== 1 || !policy.contracts || typeof policy.contracts !== "object") {
    throw new Error("Unsupported SDK contract policy schema");
  }
  const selectedPolicy = policy.contracts[contractVersion];
  if (!selectedPolicy) throw new Error(`SDK contract version ${contractVersion} is not enabled by the reviewed workflow policy`);
  if (!Number.isSafeInteger(selectedPolicy.minimumReleaseSequence) || selectedPolicy.minimumReleaseSequence < 1) {
    throw new Error("SDK contract policy minimum release sequence must be a positive integer");
  }
  if (typeof selectedPolicy.requireSdkIdentity !== "boolean") {
    throw new Error("SDK contract policy must explicitly select strict SDK identity verification");
  }
  if (!Array.isArray(selectedPolicy.previousContracts) || selectedPolicy.previousContracts.length === 0) {
    throw new Error("SDK contract policy must name at least one predecessor");
  }
  const seen = new Set<string>();
  for (const [index, previous] of selectedPolicy.previousContracts.entries()) {
    if (typeof previous !== "string" || !contractVersionPattern.test(previous) || previous >= contractVersion || seen.has(previous)) {
      throw new Error("SDK contract policy predecessors must be unique earlier calendar revisions");
    }
    if (index > 0 && previous >= selectedPolicy.previousContracts[index - 1]!) {
      throw new Error("SDK contract policy predecessors must be ordered newest first");
    }
    seen.add(previous);
  }

  if (!artifactValue || typeof artifactValue !== "object") throw new Error("Selected SDK contract artifact must be an object");
  const artifact = artifactValue as {
    payload?: { contractVersion?: unknown; releaseSequence?: unknown };
    signature?: { algorithm?: unknown; keyId?: unknown; value?: unknown } | null;
  };
  if (artifact.payload?.contractVersion !== contractVersion) {
    throw new Error("Selected SDK contract path does not match its signed identity");
  }
  if (!Number.isSafeInteger(artifact.payload.releaseSequence) ||
      Number(artifact.payload.releaseSequence) < selectedPolicy.minimumReleaseSequence) {
    throw new Error("Selected SDK contract is below the reviewed minimum release sequence");
  }
  if (artifact.signature?.algorithm !== "ed25519" || typeof artifact.signature.keyId !== "string" ||
      !artifact.signature.keyId || typeof artifact.signature.value !== "string" || !artifact.signature.value) {
    throw new Error("Selected SDK contract must contain an Ed25519 signature");
  }

  return {
    contractPath,
    contractVersion,
    minimumReleaseSequence: selectedPolicy.minimumReleaseSequence,
    requireSdkIdentity: selectedPolicy.requireSdkIdentity,
    previousContracts: [...selectedPolicy.previousContracts],
  };
}

export async function resolveContractInputs(rootPath: string, policyPath?: string): Promise<ContractInputs> {
  const root = resolve(rootPath);
  const metadata = JSON.parse(await readFile(resolve(root, ".sdk-source.json"), "utf8")) as unknown;
  const policyFile = policyPath ? resolve(policyPath) : resolve(root, ".github/workflows/sdk-contract-policy.json");
  const policy = JSON.parse(await readFile(policyFile, "utf8")) as unknown;
  const metadataRecord = metadata as { contract?: unknown };
  const contractValue = metadataRecord?.contract;
  if (typeof contractValue !== "string" || !contractPathPattern.test(contractValue)) {
    throw new Error("SDK source metadata must select a versioned public contract archive");
  }
  const absoluteContractPath = resolve(root, contractValue);
  if (!absoluteContractPath.startsWith(`${root}${sep}`)) throw new Error("SDK contract path escapes the checkout");
  const artifact = JSON.parse(await readFile(absoluteContractPath, "utf8")) as unknown;
  return resolveContractInputsFromData(metadata, policy, artifact);
}

function argumentValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    const root = resolve(argumentValue(args, "--root") ?? process.cwd());
    const policyPath = argumentValue(args, "--policy");
    const inputs = await resolveContractInputs(root, policyPath);
    const output = {
      contract_path: inputs.contractPath,
      contract_version: inputs.contractVersion,
      minimum_release_sequence: String(inputs.minimumReleaseSequence),
      require_sdk_identity: String(inputs.requireSdkIdentity),
      previous_contracts_json: JSON.stringify(inputs.previousContracts),
    };
    const destination = process.env.GITHUB_OUTPUT;
    if (destination) {
      await appendFile(destination, Object.entries(output).map(([key, value]) => `${key}=${value}`).join("\n") + "\n");
    } else {
      console.log(JSON.stringify(output));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to select the reviewed SDK contract");
    process.exitCode = 1;
  }
}
