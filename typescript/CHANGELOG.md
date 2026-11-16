# Changelog

## 1.0.0

### Fixed

- Collection creation exposes the canonical `embeddingConfigId` input so callers
  can select an owned configuration without changing the workspace default.
- File ingestion forwards the canonical `ocrMode` selection, and workflow
  creation accepts an explicit `isActive` flag.
- Licensed agent creation and updates expose the canonical `llmConfigId`,
  `fallbackLlmConfigId`, and `runtimeKind: "byok_api"` inputs in TypeScript.
  Nullable provider selections remain supported; managed agent inputs stay restricted.

### Breaking

- `ingest.file` now calls `POST /api/ingest/file/async` and returns `AsyncIngestResult`
  (`success`, `jobId`, `message`) instead of a completed `IngestResult`.
  `ingest.fileAsync` is unchanged.
- `ingest.url` now calls `POST /api/ingest/url/async` (single page) and returns
  `AsyncIngestResult` (`success`, `jobId`, `message`) instead of a completed
  `IngestResult` (`chunksCount`, `documentId`, …). Callers that read
  `chunksCount` from `ingest.url` must wait on `getJob` / `streamJob`.
  `ingest.document` also returns `AsyncIngestResult` (raw text uploaded through
  `/file/async`). SaaS members no longer hit the closed synchronous routes.

### Migration

Wait for the durable job instead of treating `ingest.file` or `ingest.url` as a
synchronous ingest:

```ts
const started = await client.ingest.file({ collectionId, file });
const job = await client.ingest.getJob(started.jobId);
// or: for await (const event of client.ingest.streamJob(started.jobId)) { ... }

const fromUrl = await client.ingest.url({ collectionId, url });
await client.ingest.getJob(fromUrl.jobId);
```

`POST /api/ingest/file` and `POST /api/ingest/url` remain published for
**license** deployments only. SaaS rejects those sync routes; the SDK uses the
metered async paths (`ingest.file`, `ingest.url`, `ingest.document`).
Synchronous `ingest.crawl`, `ingest.dataset`, and `ingest.discover` stay on the
license routes and raise `OfferingUnavailableError` when SaaS returns 503
`AI_TEMPORARILY_UNAVAILABLE`. Members should call `ingest.crawlAsync` or
`ingest.datasetAsync` instead.
