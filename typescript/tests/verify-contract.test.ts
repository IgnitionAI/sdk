import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { PUBLIC_CONTRACT_VERSION } from "../src/contract.js";

const packageRoot = join(import.meta.dir, "..");

function archivePath(version: string): string {
  const relative = join("contracts", version, "public-sdk-contract.json");
  const candidates = [join(packageRoot, relative), join(packageRoot, "..", relative)];
  return candidates.find(existsSync) ?? candidates[0]!;
}

const currentArchivePath = archivePath(PUBLIC_CONTRACT_VERSION);
const legacyArchivePath = archivePath("2026.07");

function runVerifyContract(args: string[] = []) {
  return Bun.spawnSync(["bun", "run", "scripts/verify-contract.ts", ...args], {
    cwd: packageRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
}

function releaseSequence(path: string): number {
  return JSON.parse(readFileSync(path, "utf8")).payload.releaseSequence as number;
}

describe("verify:contract default archive", () => {
  test("verifies the current signed archive when present, otherwise the legacy private fallback", () => {
    const expectedPath = existsSync(currentArchivePath) ? currentArchivePath : legacyArchivePath;
    const expectedVersion = existsSync(currentArchivePath) ? PUBLIC_CONTRACT_VERSION : "2026.07";
    const result = runVerifyContract(["--minimum-release-sequence", String(releaseSequence(expectedPath))]);
    expect(result.stderr.toString()).not.toContain("Unable to locate");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain(`version ${expectedVersion}`);
    expect(result.stdout.toString()).toContain(expectedPath);
    expect(result.stderr.toString()).not.toContain("Warning: verified archive version");
    if (expectedVersion === PUBLIC_CONTRACT_VERSION) {
      expect(result.stdout.toString()).not.toContain("Using last signed private archive");
    } else {
      expect(result.stdout.toString()).toContain(
        `Using last signed private archive ${expectedVersion}; SDK identity ${PUBLIC_CONTRACT_VERSION} is unsigned in this tree.`,
      );
    }
  });

  test("verifies an explicitly selected preserved 2026.07 artifact and warns about its older identity", () => {
    const result = runVerifyContract([
      "--contract", legacyArchivePath,
      "--minimum-release-sequence", String(releaseSequence(legacyArchivePath)),
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("version 2026.07");
    expect(result.stdout.toString()).toContain(legacyArchivePath);
    if (PUBLIC_CONTRACT_VERSION !== "2026.07") {
      expect(result.stderr.toString()).toContain(
        `Warning: verified archive version 2026.07 differs from SDK identity ${PUBLIC_CONTRACT_VERSION}`,
      );
    } else {
      expect(result.stderr.toString()).not.toContain("Warning: verified archive version");
    }
  });

  test("strict verification rejects a valid signed archive with a different SDK revision", () => {
    if (PUBLIC_CONTRACT_VERSION === "2026.07") return;
    const result = runVerifyContract(["--contract", legacyArchivePath, "--require-sdk-identity"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain(
      `Signed contract version 2026.07 does not match SDK identity ${PUBLIC_CONTRACT_VERSION}`,
    );
    expect(result.stdout.toString()).not.toContain("Verified contract sequence");
  });
});
