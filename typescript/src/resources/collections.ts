import type { BaseClient } from "../client.js";
import type {
  Collection,
  CollectionCreateParams,
  CollectionUpdateParams,
  ChunkListParams,
  ChunkListResponse,
  SearchParams,
  SearchResponse,
  CollectionStats,
  CollectionInsights,
  CollectionQualityReport,
  DocumentRecord,
  ChunkingStrategy,
} from "../types.js";
import {
  RETRIEVAL_PRESETS,
  type RetrievalPresetConfig,
  type RetrievalPresetName,
} from "../presets.js";

export class Collections {
  constructor(private client: BaseClient) {}

  async list(options?: {
    includeShared?: boolean;
    includePublic?: boolean;
  }): Promise<Collection[]> {
    const params = new URLSearchParams();
    if (options?.includeShared) params.set("includeShared", "true");
    if (options?.includePublic) params.set("includePublic", "true");
    const query = params.toString() ? `?${params}` : "";
    return this.client.request<Collection[]>("GET", `/collections${query}`);
  }

  async get(id: string): Promise<Collection> {
    return this.client.request<Collection>("GET", `/collections/${id}`);
  }

  async create(params: CollectionCreateParams): Promise<Collection> {
    return this.client.request<Collection>("POST", "/collections", {
      body: JSON.stringify(params),
    });
  }

  async update(
    id: string,
    params: CollectionUpdateParams
  ): Promise<Collection> {
    return this.client.request<Collection>("PATCH", `/collections/${id}`, {
      body: JSON.stringify(params),
    });
  }

  async delete(
    id: string,
    force?: boolean
  ): Promise<{ success: boolean; permanent?: boolean }> {
    const query = force ? "?force=true" : "";
    return this.client.request("DELETE", `/collections/${id}${query}`);
  }

  async chunks(
    collectionId: string,
    params?: ChunkListParams
  ): Promise<ChunkListResponse> {
    const qs = new URLSearchParams();
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.sourceType) qs.set("sourceType", params.sourceType);
    if (params?.type) qs.set("type", params.type);
    const query = qs.toString() ? `?${qs}` : "";
    return this.client.request<ChunkListResponse>(
      "GET",
      `/collections/${collectionId}/chunks${query}`
    );
  }

  async search(
    collectionId: string,
    params: SearchParams
  ): Promise<SearchResponse> {
    const qs = new URLSearchParams();
    qs.set("q", params.query);
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.sourceType) qs.set("sourceType", params.sourceType);
    if (params.type) qs.set("type", params.type);
    if (params.filters) qs.set("filters", JSON.stringify(params.filters));
    return this.client.request<SearchResponse>(
      "GET",
      `/collections/${collectionId}/search?${qs}`
    );
  }

  async stats(collectionId: string): Promise<CollectionStats> {
    return this.client.request<CollectionStats>(
      "GET",
      `/collections/${collectionId}/stats`
    );
  }

  async insights(collectionId: string): Promise<CollectionInsights> {
    return this.client.request<CollectionInsights>(
      "GET",
      `/collections/${collectionId}/insights`
    );
  }

  async regenerateInsights(
    collectionId: string
  ): Promise<CollectionInsights> {
    return this.client.request<CollectionInsights>(
      "POST",
      `/collections/${collectionId}/insights/regenerate`
    );
  }

  /**
   * Aggregate ingestion quality report for a collection — extraction methods,
   * OCR stats, chunking strategies distribution, warnings, chunk size stats.
   * Public/shared collections are readable by any authenticated caller.
   */
  async qualityReport(
    collectionId: string
  ): Promise<CollectionQualityReport> {
    return this.client.request<CollectionQualityReport>(
      "GET",
      `/collections/${collectionId}/quality-report`
    );
  }

  /**
   * List per-document metadata with ingestion report attached. Cap 200 docs
   * ordered by creation (most recent first). Public/shared collections are
   * readable by any authenticated caller.
   */
  async documents(
    collectionId: string
  ): Promise<DocumentRecord[]> {
    const data = await this.client.request<{ documents: DocumentRecord[] }>(
      "GET",
      `/collections/${collectionId}/documents`
    );
    return data.documents;
  }

  /**
   * Force a specific chunking strategy for all future ingestions. Pass `null`
   * to clear the override and return to auto-detection. Shortcut for
   * `update(id, { defaultChunkingStrategy: strategy })`.
   */
  async setDefaultChunkingStrategy(
    collectionId: string,
    strategy: ChunkingStrategy | null
  ): Promise<Collection> {
    return this.update(collectionId, { defaultChunkingStrategy: strategy });
  }

  /**
   * Apply a retrieval preset (Balanced / Precision / Recall / Speed) or an
   * inline partial config. Writes to the collection's ragConfig via
   * `PUT /rag-config`.
   */
  async applyRagPreset(
    collectionId: string,
    preset: RetrievalPresetName | RetrievalPresetConfig
  ): Promise<unknown> {
    const config =
      typeof preset === "string" ? RETRIEVAL_PRESETS[preset] : preset;
    return this.client.request(
      "PUT",
      `/collections/${collectionId}/rag-config`,
      { body: JSON.stringify(config) }
    );
  }
}
