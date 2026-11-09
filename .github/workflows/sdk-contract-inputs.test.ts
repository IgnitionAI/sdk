import { expect, test } from "bun:test";
import { readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { resolveContractInputs, resolveContractInputsFromData } from "./sdk-contract-inputs";

const root = resolve(import.meta.dir, "../..");
const policy = JSON.parse(await readFile(resolve(import.meta.dir, "sdk-contract-policy.json"), "utf8"));

test("selects the current signed archive from source metadata and reviewed policy", async () => {
  const result = await resolveContractInputs(root);
  const source = JSON.parse(await readFile(resolve(root, ".sdk-source.json"), "utf8"));
  const selectedPolicy = policy.contracts[result.contractVersion];
  expect(result.contractPath).toBe(source.contract);
  expect(result.contractPath).toBe(`contracts/${result.contractVersion}/public-sdk-contract.json`);
  expect(result.minimumReleaseSequence).toBe(selectedPolicy.minimumReleaseSequence);
  expect(result.requireSdkIdentity).toBe(selectedPolicy.requireSdkIdentity);
  expect(result.previousContracts).toEqual(selectedPolicy.previousContracts);
});

test("selects the 2026.11 scenario with explicit predecessors, strict identity, and sequence floor", () => {
  const result = resolveContractInputsFromData(
    { schemaVersion: 1, contract: "contracts/2026.11/public-sdk-contract.json" },
    policy,
    { payload: { contractVersion: "2026.11", releaseSequence: 5 }, signature: { algorithm: "ed25519", keyId: "synthetic-test-key", value: "synthetic" } },
  );
  expect(result).toEqual({
    contractPath: "contracts/2026.11/public-sdk-contract.json",
    contractVersion: "2026.11",
    minimumReleaseSequence: 5,
    requireSdkIdentity: true,
    previousContracts: ["2026.10", "2026.09"],
  });
});

test("fails closed for unsupported versions, mismatched archive identity, and replayed sequence", () => {
  const artifact = (contractVersion: string, releaseSequence: number) => ({
    payload: { contractVersion, releaseSequence },
    signature: { algorithm: "ed25519", keyId: "synthetic-test-key", value: "synthetic" },
  });
  expect(() => resolveContractInputsFromData(
    { schemaVersion: 1, contract: "contracts/2026.10/public-sdk-contract.json" }, policy, artifact("2026.10", 4),
  )).toThrow("not enabled");
  expect(() => resolveContractInputsFromData(
    { schemaVersion: 1, contract: "contracts/2026.11/public-sdk-contract.json" }, policy, artifact("2026.10", 5),
  )).toThrow("does not match its signed identity");
  expect(() => resolveContractInputsFromData(
    { schemaVersion: 1, contract: "contracts/2026.11/public-sdk-contract.json" }, policy, artifact("2026.11", 4),
  )).toThrow("below the reviewed minimum release sequence");
});

test("writes only validated selection outputs for GitHub Actions", async () => {
  const outputPath = resolve(tmpdir(), `sdk-contract-output-${randomUUID()}.txt`);
  try {
    const result = Bun.spawnSync(["bun", "run", resolve(import.meta.dir, "sdk-contract-inputs.ts")], {
      cwd: root,
      env: { ...process.env, GITHUB_OUTPUT: outputPath },
    });
    expect(result.exitCode).toBe(0);
    const output = await readFile(outputPath, "utf8");
    const current = await resolveContractInputs(root);
    expect(output).toContain(`contract_path=${current.contractPath}\n`);
    expect(output).toContain(`minimum_release_sequence=${current.minimumReleaseSequence}\n`);
    expect(output).toContain(`require_sdk_identity=${current.requireSdkIdentity}\n`);
    expect(output).toContain(`previous_contracts_json=${JSON.stringify(current.previousContracts)}\n`);
  } finally {
    await unlink(outputPath).catch(() => undefined);
  }
});
