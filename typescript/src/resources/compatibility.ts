import type { BaseClient } from "../client.js";
import {
  ContractDigestMismatchError,
  ProtocolError,
  UnsupportedContractVersionError,
} from "../errors.js";
import {
  PUBLIC_CONTRACT_DIGEST,
  PUBLIC_CONTRACT_VERSION,
  SUPPORTED_CONTRACT_VERSIONS,
} from "../contract.js";

export type DeploymentMetadata = {
  contractVersion: string;
  contractDigest: string;
  capabilities: string[];
};

const CACHE_MS = 5 * 60_000;

export class Compatibility {
  private cached?: { metadata: DeploymentMetadata; expiresAt: number };

  constructor(private readonly client: BaseClient) {}

  async get(options: { refresh?: boolean } = {}): Promise<DeploymentMetadata> {
    if (!options.refresh && this.cached && this.cached.expiresAt > Date.now()) {
      return structuredClone(this.cached.metadata);
    }
    const metadata = this.parse(await this.client.request<unknown>("GET", "/meta"));
    this.cached = { metadata, expiresAt: Date.now() + CACHE_MS };
    return structuredClone(metadata);
  }

  async assertCompatible(): Promise<DeploymentMetadata> {
    const metadata = await this.get();
    if (!(SUPPORTED_CONTRACT_VERSIONS as readonly string[]).includes(metadata.contractVersion)) {
      throw new UnsupportedContractVersionError(
        metadata.contractVersion,
        [...SUPPORTED_CONTRACT_VERSIONS],
      );
    }
    if (
      metadata.contractVersion === PUBLIC_CONTRACT_VERSION &&
      metadata.contractDigest !== PUBLIC_CONTRACT_DIGEST
    ) {
      throw new ContractDigestMismatchError(
        PUBLIC_CONTRACT_DIGEST,
        metadata.contractDigest,
      );
    }
    return metadata;
  }

  private parse(value: unknown): DeploymentMetadata {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new ProtocolError("IgnitionRAG /api/meta returned a non-object response.");
    }
    const record = value as Record<string, unknown>;
    if (
      typeof record.contractVersion !== "string" ||
      typeof record.contractDigest !== "string" ||
      !Array.isArray(record.capabilities) ||
      !record.capabilities.every((item) => typeof item === "string")
    ) {
      throw new ProtocolError("IgnitionRAG /api/meta returned an invalid compatibility document.");
    }
    return {
      contractVersion: record.contractVersion,
      contractDigest: record.contractDigest,
      capabilities: [...record.capabilities] as string[],
    };
  }
}
