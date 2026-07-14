import type { BaseClient } from "../client.js";
import type {
  IngestUrlParams,
  IngestDocumentParams,
  IngestFileParams,
  IngestCrawlParams,
  IngestDatasetParams,
  IngestResult,
  CrawlResult,
} from "../types.js";

export class Ingest {
  constructor(private client: BaseClient) {}

  async url(params: IngestUrlParams): Promise<IngestResult> {
    return this.client.request<IngestResult>("POST", "/ingest/url", {
      body: JSON.stringify(params),
    });
  }

  async document(params: IngestDocumentParams): Promise<IngestResult> {
    return this.client.request<IngestResult>("POST", "/ingest/document", {
      body: JSON.stringify(params),
    });
  }

  async file(params: IngestFileParams): Promise<IngestResult> {
    const formData = new FormData();
    formData.append("collectionId", params.collectionId);
    formData.append("file", params.file);
    return this.client.request<IngestResult>("POST", "/ingest/file", {
      body: formData as any,
      multipart: true,
    });
  }

  async crawl(params: IngestCrawlParams): Promise<CrawlResult> {
    return this.client.request<CrawlResult>("POST", "/ingest/crawl", {
      body: JSON.stringify(params),
    });
  }

  async dataset(params: IngestDatasetParams): Promise<IngestResult> {
    return this.client.request<IngestResult>("POST", "/ingest/dataset", {
      body: JSON.stringify(params),
    });
  }
}
