# TypeScript contract 2026.10 operation mapping

The canonical allow-list contains 65 operations. The table maps each operation
to the ergonomic client. Inputs and wire responses are generated in
`src/generated/public-api.ts`; the package root exposes ergonomic types.
This inventory is not runtime proof for every operation. Existing focused tests
cover the resource families, multipart transport, asynchronous jobs, cancellation,
managed admission, streaming and errors; live coverage must be assessed separately.

Legacy synchronous ingestion, discovery/crawling, skill mutations and agent SSE
remain deployment-dependent. Ordinary SaaS users must use durably admitted file
ingestion and managed agent execution. Availability on licensed deployments does
not imply SaaS availability. No private widgets/MCP routes enter this contract.

| Operation | HTTP | Client method |
| --- | --- | --- |
| `chat.send` | `POST /api/chat` | `chat.send` |
| `chat.stream` | `POST /api/chat/stream` | `chat.stream` |
| `chat.streamProgressive` | `POST /api/chat/stream/progressive` | `chat.streamProgressive` |
| `collections.listPublic` | `GET /api/public-collections` | `collections.listPublic` |
| `collections.getPublic` | `GET /api/public-collections/{slug}` | `collections.getPublic` |
| `collections.list` | `GET /api/collections` | `collections.list` |
| `collections.create` | `POST /api/collections` | `collections.create` |
| `collections.get` | `GET /api/collections/:id` | `collections.get` |
| `collections.update` | `PATCH /api/collections/:id` | `collections.update` |
| `collections.delete` | `DELETE /api/collections/:id` | `collections.delete` |
| `collections.insights` | `GET /api/collections/:id/insights` | `collections.insights` |
| `collections.regenerateInsights` | `POST /api/collections/:id/insights/regenerate` | `collections.regenerateInsights` |
| `collections.chunks` | `GET /api/collections/:id/chunks` | `collections.chunks` |
| `collections.search` | `GET /api/collections/:id/search` | `collections.search` |
| `collections.stats` | `GET /api/collections/:id/stats` | `collections.stats` |
| `collections.qualityReport` | `GET /api/collections/:id/quality-report` | `collections.qualityReport` |
| `collections.documents` | `GET /api/collections/:id/documents` | `collections.documents` |
| `collections.setRagConfig` | `PUT /api/collections/:collectionId/rag-config` | `collections.applyRagPreset` |
| `ingestion.url` | `POST /api/ingest/url` | `ingest.url` |
| `ingestion.document` | `POST /api/ingest/document` | `ingest.document` |
| `ingestion.file` | `POST /api/ingest/file/async` | `ingest.file` (alias of `ingest.fileAsync`; SaaS rejects sync `/ingest/file`) |
| `ingestion.crawl` | `POST /api/ingest/crawl` | `ingest.crawl` |
| `ingestion.dataset` | `POST /api/ingest/dataset` | `ingest.dataset` |
| `ingestion.fileAsync` | `POST /api/ingest/file/async` | `ingest.fileAsync` |
| `ingestion.crawlAsync` | `POST /api/ingest/crawl/async` | `ingest.crawlAsync` |
| `ingestion.datasetAsync` | `POST /api/ingest/dataset/async` | `ingest.datasetAsync` |
| `ingestion.discover` | `POST /api/ingest/discover` | `ingest.discover` |
| `ingestion.crawlSelectedAsync` | `POST /api/ingest/crawl-selected/async` | `ingest.crawlSelectedAsync` |
| `ingestion.getJob` | `GET /api/ingest/jobs/{jobId}` | `ingest.getJob` |
| `ingestion.listJobs` | `GET /api/ingest/jobs` | `ingest.listJobs` |
| `ingestion.streamJob` | `GET /api/ingest/jobs/{jobId}/stream` | `ingest.streamJob` |
| `ingestion.cancelJob` | `POST /api/ingest/jobs/{jobId}/cancel` | `ingest.cancelJob` |
| `agents.listSkills` | `GET /api/agents/skills` | `agents.listSkills` |
| `agents.createSkill` | `POST /api/agents/skills` | `agents.createSkill` |
| `agents.updateSkill` | `PATCH /api/agents/skills/:id` | `agents.updateSkill` |
| `agents.deleteSkill` | `DELETE /api/agents/skills/:id` | `agents.deleteSkill` |
| `agents.list` | `GET /api/agents` | `agents.list` |
| `agents.create` | `POST /api/agents` | `agents.create` |
| `agents.get` | `GET /api/agents/:id` | `agents.get` |
| `agents.update` | `PATCH /api/agents/:id` | `agents.update` |
| `agents.delete` | `DELETE /api/agents/:id` | `agents.delete` |
| `agents.generate` | `POST /api/agents/generate` | `agents.generate` |
| `agents.chatStream` | `POST /api/agents/:id/chat/stream` | `agentChat.stream` |
| `deepResearch.cancel` | `POST /api/agents/:agentId/chat/cancel-deep` | `deepResearch.cancel` |
| `deepResearch.status` | `GET /api/agents/:agentId/chat/deep-status` | `deepResearch.status` |
| `deepResearch.stream` | `GET /api/agents/:agentId/chat/deep-stream` | `deepResearch.stream` |
| `workflows.list` | `GET /api/workflows` | `workflows.list` |
| `workflows.create` | `POST /api/workflows` | `workflows.create` |
| `workflows.get` | `GET /api/workflows/:id` | `workflows.get` |
| `workflows.update` | `PATCH /api/workflows/:id` | `workflows.update` |
| `workflows.delete` | `DELETE /api/workflows/:id` | `workflows.delete` |
| `workflows.validate` | `POST /api/workflows/:id/validate` | `workflows.validate` |
| `workflows.execute` | `POST /api/workflows/:id/execute` | `workflows.execute` |
| `workflows.listExecutions` | `GET /api/workflows/:id/executions` | `workflows.listExecutions` |
| `workflows.getExecution` | `GET /api/workflows/executions/:executionId` | `workflows.getExecution` |
| `workflows.cancelExecution` | `DELETE /api/workflows/executions/:executionId` | `workflows.cancelExecution` |
| `evaluations.create` | `POST /api/collections/:id/evaluations` | `evaluations.create` |
| `evaluations.list` | `GET /api/collections/:id/evaluations` | `evaluations.list` |
| `evaluations.get` | `GET /api/evaluations/:evaluationId` | `evaluations.get` |
| `ragExperiments.runAbTest` | `POST /api/collections/:collectionId/rag-config/test` | `ragAbTests.run` |
| `observability.listTraces` | `GET /api/traces` | `traces.list` |
| `observability.getTrace` | `GET /api/traces/{id}` | `traces.get` |
| `observability.getTraceMetrics` | `GET /api/traces/metrics` | `traces.metrics` |
| `observability.exportTraces` | `GET /api/traces/export` | `traces.export` |
| `feedback.submit` | `POST /api/feedback` | `feedback.submit` |

`collections.applyRagPreset` accepts a preset or its inline retrieval config;
it deliberately does not expose arbitrary platform provider/model configuration.
`workflows.cancelExecution` returns `{ cancelled: boolean }`. It is a remote
cancellation request, distinct from aborting an HTTP request. SaaS durable
workflow/agent execution has separate managed helpers and admission rules.

Full per-operation input/result conformance and both-space live completion
remain release gates. Empty lists, accepted submissions and skipped scenarios
do not establish completed execution or successful ingestion.
