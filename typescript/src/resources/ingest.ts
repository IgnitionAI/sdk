import type { BaseClient } from "../client.js";
import {
  APIError,
  isAiTemporarilyUnavailable,
  offeringUnavailable,
} from "../errors.js";
import type {
  IngestUrlParams,
  IngestDocumentParams,
  IngestFileParams,
  IngestCrawlParams,
  IngestDatasetParams,
  IngestResult,
  CrawlResult,
  AsyncIngestResult,
  DiscoverSiteParams,
  DiscoverSiteResult,
  CrawlSelectedParams,
  IngestionJobCancelResponse,
  IngestionJobResponse,
  IngestionJobsResponse,
} from "../types.js";
import { IngestionJobStream } from "../streaming.js";

export class Ingest {
  constructor(private client: BaseClient) {}

  /**
   * Durable single-URL ingestion (`POST /api/ingest/url/async`).
   * Breaking in 1.0.0: returns `AsyncIngestResult` (`jobId`). Wait with `getJob`
   * or `streamJob`. Synchronous `POST /api/ingest/url` remains license-only.
   */
  async url(params: IngestUrlParams): Promise<AsyncIngestResult> {
    return this.urlAsync(params);
  }

  /**
   * Durable raw-text ingestion through `POST /api/ingest/file/async`.
   * SaaS members cannot use synchronous `POST /api/ingest/document`.
   */
  async document(params: IngestDocumentParams): Promise<AsyncIngestResult> {
    const file = new File([params.content], params.filename, { type: "text/plain" });
    return this.fileAsync({ collectionId: params.collectionId, file });
  }

  /**
   * Durable file ingestion (`POST /api/ingest/file/async`).
   * Breaking in 1.0.0: returns `AsyncIngestResult` (`jobId`). Wait with `getJob` or
   * `streamJob`. Synchronous `POST /api/ingest/file` remains license-only.
   */
  async file(params: IngestFileParams): Promise<AsyncIngestResult> {
    return this.fileAsync(params);
  }

  async crawl(params: IngestCrawlParams): Promise<CrawlResult> {
    return this.requestUnlessClosedOffering(
      "ingest.crawl",
      () => this.client.request<CrawlResult>("POST", "/ingest/crawl", {
        body: JSON.stringify(params),
      }),
    );
  }

  async dataset(params: IngestDatasetParams): Promise<IngestResult> {
    return this.requestUnlessClosedOffering(
      "ingest.dataset",
      () => this.client.request<IngestResult>("POST", "/ingest/dataset", {
        body: JSON.stringify(params),
      }),
    );
  }

  async urlAsync(params: IngestUrlParams): Promise<AsyncIngestResult> {
    return this.client.request<AsyncIngestResult>("POST", "/ingest/url/async", {
      body: JSON.stringify({
        collectionId: params.collectionId,
        url: params.url,
        enableMultimodal: params.enableMultimodal,
        maxPages: 1,
      }),
    });
  }

  async fileAsync(params: IngestFileParams): Promise<AsyncIngestResult> {
    const formData = new FormData();
    formData.append("collectionId", params.collectionId);
    const filename = "name" in params.file && typeof params.file.name === "string"
      ? params.file.name
      : undefined;
    if (filename) formData.append("file", params.file, filename);
    else formData.append("file", params.file);
    if (params.enableMultimodal !== undefined) {
      formData.append("enableMultimodal", String(params.enableMultimodal));
    }
    if (params.mode) formData.append("mode", params.mode);
    if (params.ocrMode !== undefined) formData.append("ocrMode", params.ocrMode);
    return this.client.request<AsyncIngestResult>("POST", "/ingest/file/async", {
      body: formData,
      multipart: true,
    });
  }

  async crawlAsync(params: IngestCrawlParams): Promise<AsyncIngestResult> {
    return this.client.request<AsyncIngestResult>("POST", "/ingest/crawl/async", {
      body: JSON.stringify(params),
    });
  }

  async datasetAsync(params: IngestDatasetParams): Promise<AsyncIngestResult> {
    return this.client.request<AsyncIngestResult>("POST", "/ingest/dataset/async", {
      body: JSON.stringify(params),
    });
  }

  async discover(params: DiscoverSiteParams): Promise<DiscoverSiteResult> {
    return this.requestUnlessClosedOffering(
      "ingest.discover",
      () => this.client.request<DiscoverSiteResult>("POST", "/ingest/discover", {
        body: JSON.stringify(params),
      }),
    );
  }

  async crawlSelectedAsync(
    params: CrawlSelectedParams,
  ): Promise<AsyncIngestResult> {
    return this.requestUnlessClosedOffering(
      "ingest.crawlSelectedAsync",
      () => this.client.request<AsyncIngestResult>(
        "POST",
        "/ingest/crawl-selected/async",
        { body: JSON.stringify(params) },
      ),
    );
  }

  async getJob(jobId: string): Promise<IngestionJobResponse> {
    return this.client.request<IngestionJobResponse>(
      "GET",
      `/ingest/jobs/${encodeURIComponent(jobId)}`,
    );
  }

  async listJobs(collectionId: string): Promise<IngestionJobsResponse> {
    return this.client.request<IngestionJobsResponse>(
      "GET",
      `/ingest/jobs?collectionId=${encodeURIComponent(collectionId)}`,
    );
  }

  streamJob(jobId: string): IngestionJobStream {
    return new IngestionJobStream(this.client.requestRaw(
      "GET",
      `/ingest/jobs/${encodeURIComponent(jobId)}/stream`,
    ));
  }

  async cancelJob(jobId: string): Promise<IngestionJobCancelResponse> {
    return this.client.request<IngestionJobCancelResponse>(
      "POST",
      `/ingest/jobs/${encodeURIComponent(jobId)}/cancel`,
      { body: "{}" },
    );
  }

  private async requestUnlessClosedOffering<T>(
    operation: string,
    request: () => Promise<T>,
  ): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (error instanceof APIError && isAiTemporarilyUnavailable(error)) {
        throw offeringUnavailable(operation, error);
      }
      throw error;
    }
  }
}
