# @ignitionai/sdk

[![npm version](https://img.shields.io/npm/v/@ignitionai/sdk.svg)](https://www.npmjs.com/package/@ignitionai/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@ignitionai/sdk.svg)](https://www.npmjs.com/package/@ignitionai/sdk)
[![license](https://img.shields.io/npm/l/@ignitionai/sdk.svg)](./LICENSE)
[![types](https://img.shields.io/npm/types/@ignitionai/sdk.svg)](https://www.npmjs.com/package/@ignitionai/sdk)

TypeScript SDK for your licensed or self-hosted IgnitionRAG deployment. Zero dependencies, compatible with Node.js 20+, Bun, edge runtimes and browsers. API keys stay in trusted server runtimes; browsers use delegated user tokens.

## Installation

```bash
npm install @ignitionai/sdk
# or
bun add @ignitionai/sdk
```

## Setup

```typescript
import { IgnitionAI } from "@ignitionai/sdk";

const client = new IgnitionAI({
  apiKey: "ign_xxxxxxxxxxxx",
  baseURL: "https://rag.example.com",
});
```

Or use the `IGNITION_API_KEY` environment variable:

```typescript
const client = IgnitionAI.fromEnv({
  baseURL: "https://rag.example.com",
});
```

### Configuration Options

```typescript
const client = new IgnitionAI({
  apiKey: "ign_xxxx",               // trusted runtime only
  baseURL: "https://rag.example.com", // required: your deployment
  maxRetries: 3,                    // default: 2
  timeout: 60_000,                  // default: 60_000ms
  fetch: customFetch,               // custom fetch implementation
});
```

There is deliberately no hosted SaaS fallback. An omitted `baseURL` is a configuration error.

### Browser authentication

```typescript
import { IgnitionAI } from "@ignitionai/sdk/browser";

const client = new IgnitionAI({
  baseURL: "https://rag.example.com",
  tokenProvider: () => authSession.getAccessToken(),
});
```

The browser export rejects API keys at runtime and in TypeScript.

### Contract compatibility

```typescript
const deployment = await client.compatibility.assertCompatible();
console.log(deployment.contractVersion, deployment.capabilities);
```

The SDK caches metadata briefly and fails explicitly on an unsupported version or a changed digest under the same contract version.

## RAG Chat

### Non-streaming

```typescript
const response = await client.chat.send({
  collectionId: "coll_xxxx",
  query: "What is the refund policy?",
});

console.log(response.answer);
console.log(`${response.sources.length} sources used`);
```

### Streaming

```typescript
const stream = client.chat.stream({
  collectionId: "coll_xxxx",
  query: "Explain the onboarding process",
});

for await (const event of stream) {
  if (event.type === "chunk") {
    process.stdout.write(event.content);
  }
  if (event.type === "sources") {
    console.log("\nSources:", event.sources.length);
  }
}
```

#### Text-only stream

```typescript
for await (const text of stream.toTextStream()) {
  process.stdout.write(text);
}
```

#### Collect full response

```typescript
const { text, sources, metrics } = await stream.getFullResponse();
```

### Progressive Streaming

Track RAG pipeline stages in real time:

```typescript
const stream = client.chat.streamProgressive({
  collectionId: "coll_xxxx",
  query: "Compare pricing plans",
});

for await (const event of stream) {
  switch (event.type) {
    case "stage":
      console.log(`[${event.stage}] ${event.elapsed}ms`);
      break;
    case "sources":
      console.log(`Found ${event.sources.length} sources`);
      break;
    case "chunk":
      process.stdout.write(event.content);
      break;
    case "metrics":
      console.log(`\nTotal: ${event.pipelineMetrics.totalTimeMs}ms`);
      break;
  }
}
```

## Agent Chat

```typescript
const stream = client.agentChat.stream("agent_xxxx", {
  query: "How do I configure SSO?",
  // sessionId auto-generated if omitted
});

for await (const event of stream) {
  switch (event.type) {
    case "chunk":
      process.stdout.write(event.content);
      break;
    case "tool_call":
      console.log(`\n[Tool: ${event.name}]`);
      break;
    case "tool_result":
      console.log(`[Result: ${event.name}]`);
      break;
    case "sources":
      console.log(`\n${event.sources.length} sources`);
      break;
  }
}
```

## Agents

```typescript
// List
const agents = await client.agents.list();

// Get
const agent = await client.agents.get("agent_xxxx");

// Create
const agent = await client.agents.create({
  name: "Support Bot",
  collectionId: "coll_xxxx",
  model: "gpt-4.1-mini",
  temperature: 30,
  enabledBuiltinTools: [
    "web_search",
    { id: "calculator", humanInTheLoop: true },
  ],
  mcpServers: [
    {
      name: "Slack",
      url: "https://mcp.example.com/slack",
      toolPolicies: {
        post_message: { humanInTheLoop: true },
      },
    },
  ],
});

// Generate config with AI wizard
const config = await client.agents.generate({
  description: "A customer support agent for our SaaS platform",
  language: "en",
});

// Update
await client.agents.update("agent_xxxx", { temperature: 50 });

// Delete (soft)
await client.agents.delete("agent_xxxx");

// Delete (permanent)
await client.agents.delete("agent_xxxx", true);
```

## Collections

```typescript
// List
const collections = await client.collections.list();
const readable = await client.collections.list({
  includeShared: true,
  includePublic: true,
});

for (const collection of readable) {
  if (collection.isReadOnly) {
    console.log(`${collection.name} is readable but not writable`);
  }
  if (collection.requiredPlanId) {
    console.log(`${collection.name} requires ${collection.requiredPlanId}`);
  }
}

// Create
const coll = await client.collections.create({
  name: "Product Docs",
  description: "All product documentation",
});

// Search
const results = await client.collections.search("coll_xxxx", {
  query: "authentication",
  limit: 10,
  filters: [{ field: "category", operator: "eq", value: "security" }],
});

// Browse chunks
const { chunks, total, hasMore } = await client.collections.chunks("coll_xxxx", {
  limit: 20,
  type: "text",
});

// Stats & insights
const stats = await client.collections.stats("coll_xxxx");
const insights = await client.collections.insights("coll_xxxx");

// Update / Delete
await client.collections.update("coll_xxxx", { name: "Renamed" });
await client.collections.delete("coll_xxxx");
```

Shared and public collections expose access metadata on `Collection`:
`isReadOnly`, `accessTier`, `publisherOrgId`, `slug`, and `requiredPlanId`.
Treat `isReadOnly: true` as a hard no-write signal for ingestion, sync, delete,
and workflow output storage.

```typescript
import { PermissionError } from "@ignitionai/sdk";

try {
  await client.ingest.document({
    collectionId: "coll_public",
    content: "New text",
    filename: "note.txt",
  });
} catch (error) {
  if (error instanceof PermissionError) {
    console.log(error.reasonCode); // COLLECTION_READ_ONLY or PUBLIC_COLLECTION_PLAN_REQUIRED
    console.log(error.collectionId);
    console.log(error.requiredPlanId);
  }
}
```

## Ingestion

```typescript
// Ingest from URL
await client.ingest.url({
  collectionId: "coll_xxxx",
  url: "https://docs.example.com/guide",
});

// Ingest raw text
await client.ingest.document({
  collectionId: "coll_xxxx",
  content: "Your document content...",
  filename: "guide.txt",
});

// Upload file
await client.ingest.file({
  collectionId: "coll_xxxx",
  file: new File([buffer], "report.pdf", { type: "application/pdf" }),
});

// Crawl website
await client.ingest.crawl({
  collectionId: "coll_xxxx",
  url: "https://docs.example.com",
  maxPages: 50,
});

// Import HuggingFace dataset
await client.ingest.dataset({
  collectionId: "coll_xxxx",
  source: "huggingface",
  datasetId: "squad",
  split: "train",
  maxRows: 1000,
});
```

## Evaluations

Score the quality of a collection with synthetic questions (auto-generated) or your own golden set (CSV-style). Runs asynchronously — create the job, poll for status, receive an email when it's done.

```typescript
// Auto-eval: 10 LLM-generated questions from your chunks
const run = await client.evaluations.create("coll_xxxx", {
  numQuestions: 10,
  notifyEmail: "team@acme.com", // optional, fallback to requester email
});
console.log(run.status); // "queued"

// Poll until completion
let detail = await client.evaluations.get(run.id);
while (detail.status !== "completed" && detail.status !== "failed") {
  await new Promise((r) => setTimeout(r, 5000));
  detail = await client.evaluations.get(run.id);
}
console.log(`Score: ${detail.result?.aggregate.score}/100`);

// Custom eval with your own questions + expected answers
const custom = await client.evaluations.create("coll_xxxx", {
  goldenSet: [
    { query: "Quel est le délai de rétractation ?", expectedAnswer: "14 jours calendaires", expectedKeywords: ["14", "jours"] },
    { query: "Qui paie les cotisations ?", expectedAnswer: "L'employeur" },
    { query: "Comment fonctionne le PACS ?" }, // answer optional → grounded-in-context judge
  ],
});

// History
const history = await client.evaluations.list("coll_xxxx");
history.forEach((e) => console.log(e.id, e.score));

// Re-run with the same questions (to A/B a config change)
await client.evaluations.create("coll_xxxx", {
  inheritFromEvaluationId: run.id,
});
```

**Cost**: every question runs the full RAG pipeline + an LLM judge against your BYOK provider. Budget ~€0.02 per 10 questions on gpt-4.1-mini pricing. Caps: 30 synthetic / 50 user-provided per run.

## Ingestion Quality Report

```typescript
// Aggregate stats across all docs: extraction methods, OCR, chunking strategies, warnings
const report = await client.collections.qualityReport("coll_xxxx");
console.log(
  report.totalDocuments,
  report.chunking.strategyDistribution, // { "legal-article": 8, "semantic": 2 }
  report.warnings.topMessages,
);

// Per-doc listing with ingestion report attached
const docs = await client.collections.documents("coll_xxxx");
docs.forEach((doc) => {
  console.log(doc.filename, doc.ingestionReport?.chunking.strategy);
});
```

## Retrieval Presets

```typescript
import { RETRIEVAL_PRESETS } from "@ignitionai/sdk";

// Apply a named preset (Balanced / Precision / Recall / Speed)
await client.collections.applyRagPreset("coll_xxxx", "PRECISION");

// Or inline a custom partial config
await client.collections.applyRagPreset("coll_xxxx", RETRIEVAL_PRESETS.RECALL);

// Force a specific chunking strategy for future ingestions
await client.collections.setDefaultChunkingStrategy("coll_xxxx", "semantic");
await client.collections.setDefaultChunkingStrategy("coll_xxxx", null); // clear override
```

Presets write to the collection's `ragConfig` via `PUT /rag-config`. Combined with evaluation re-runs, this enables a simple A/B loop: `applyRagPreset → create({ inheritFromEvaluationId }) → compare scores`.

## MCP compatibility (deprecated)

MCP servers belong to each private IgnitionRAG deployment. The former `client.mcp` helper remains temporarily available so existing `0.2.x` integrations do not break, but it is deprecated and excluded from new quickstarts. Configure and operate MCP through the deployment itself.

## Error Handling

All errors extend `IgnitionAIError`. HTTP errors are automatically mapped:

```typescript
import {
  IgnitionAI,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
} from "@ignitionai/sdk";

try {
  await client.chat.send({ collectionId: "coll_xxxx", query: "Hello" });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (error instanceof NotFoundError) {
    console.log("Resource not found");
  }
}
```

| Error Class | Status Code |
|---|---|
| `BadRequestError` | 400 |
| `AuthenticationError` | 401 |
| `PermissionError` | 403 |
| `NotFoundError` | 404 |
| `RateLimitError` | 429 |
| `InternalServerError` | 500+ |
| `APIConnectionError` | Network failure |
| `APIConnectionTimeoutError` | Timeout |

Retries are automatic for status codes 408, 429, 500, 502, 503 and 504 with exponential backoff. Mutating requests are retried only when an `Idempotency-Key` header is supplied.

## Vercel AI SDK Integration

Drop-in adapter for Next.js with `useChat()`:

### Route Handler (`app/api/chat/route.ts`)

```typescript
import { IgnitionAI } from "@ignitionai/sdk";
import { toAIStreamResponse } from "@ignitionai/sdk/adapters/vercel-ai";

const client = IgnitionAI.fromEnv({
  baseURL: process.env.IGNITION_BASE_URL!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = client.chat.stream({
    collectionId: process.env.COLLECTION_ID!,
    query: messages.at(-1).content,
    history: messages.slice(0, -1),
  });

  return toAIStreamResponse(stream);
}
```

### Client Component

```tsx
"use client";
import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

Works with `AgentChatStream` too:

```typescript
const stream = client.agentChat.stream(agentId, { query, sessionId });
return toAIStreamResponse(stream);
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `IGNITION_API_KEY` | API key (starts with `ign_`) | Yes (or pass in constructor) |
| `IGNITION_BASE_URL` | Your deployment URL (pass it as `baseURL`) | Yes |

## Requirements

- Node.js 20+ / Bun / modern browser
- Zero dependencies

## License

MIT
