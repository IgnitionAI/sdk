import { describe, expect, test, mock } from "bun:test";
import { IgnitionAI } from "../src/index";

function jsonFetch(data: unknown): typeof fetch {
  return mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  ) as unknown as typeof fetch;
}

function createClient(fetchMock: typeof fetch): IgnitionAI {
  return new IgnitionAI({
    apiKey: "ign_test",
    baseURL: "http://localhost",
    fetch: fetchMock,
    maxRetries: 0,
  });
}

describe("collections.list", () => {
  test("GET /collections", async () => {
    const collections = [
      { id: "coll_1", name: "Docs", documentCount: 10 },
    ];
    const fetchMock = jsonFetch(collections);
    const client = createClient(fetchMock);

    const result = await client.collections.list();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Docs");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/collections");
    expect(call[0]).not.toContain("?");
  });

  test("preserves public collection access contract fields", async () => {
    const collections = [
      {
        id: "coll_public",
        name: "Code du travail",
        description: "Public legal dataset",
        documentCount: 11243,
        storageBytes: 0,
        visibility: "public",
        createdByAdmin: true,
        isSystemCollection: true,
        sourceDataset: "legifrance",
        slug: "code-du-travail",
        requiredPlanId: "pro",
        accessTier: "public-gated",
        publisherOrgId: "org_publisher",
        isReadOnly: true,
        createdAt: "2026-04-19T12:00:00.000Z",
      },
    ];
    const fetchMock = jsonFetch(collections);
    const client = createClient(fetchMock);

    const result = await client.collections.list({
      includePublic: true,
    });

    expect(result[0].slug).toBe("code-du-travail");
    expect(result[0].requiredPlanId).toBe("pro");
    expect(result[0].accessTier).toBe("public-gated");
    expect(result[0].publisherOrgId).toBe("org_publisher");
    expect(result[0].isReadOnly).toBe(true);
  });

  test("passes includeShared and includePublic query params", async () => {
    const fetchMock = jsonFetch([]);
    const client = createClient(fetchMock);

    await client.collections.list({
      includeShared: true,
      includePublic: true,
    });

    const url = (fetchMock as any).mock.calls[0][0] as string;
    expect(url).toContain("includeShared=true");
    expect(url).toContain("includePublic=true");
  });
});

describe("collections.create", () => {
  test("POST /collections", async () => {
    const created = { id: "coll_new", name: "New", visibility: "private" };
    const fetchMock = jsonFetch(created);
    const client = createClient(fetchMock);

    const result = await client.collections.create({
      name: "New",
      description: "A new collection",
    });

    expect(result.name).toBe("New");
    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.name).toBe("New");
    expect(body.description).toBe("A new collection");
  });

  test("serializes public collection gate params", async () => {
    const created = {
      id: "coll_public",
      name: "Code du travail",
      visibility: "public",
      requiredPlanId: "pro",
      slug: "code-du-travail",
    };
    const fetchMock = jsonFetch(created);
    const client = createClient(fetchMock);

    await client.collections.create({
      name: "Code du travail",
      visibility: "public",
      sourceDataset: "legifrance",
      slug: "code-du-travail",
      requiredPlanId: "pro",
    });

    const body = JSON.parse((fetchMock as any).mock.calls[0][1].body);
    expect(body.visibility).toBe("public");
    expect(body.sourceDataset).toBe("legifrance");
    expect(body.slug).toBe("code-du-travail");
    expect(body.requiredPlanId).toBe("pro");
  });
});

describe("collections.update", () => {
  test("PATCH /collections/:id", async () => {
    const fetchMock = jsonFetch({ id: "coll_1", name: "Renamed" });
    const client = createClient(fetchMock);

    await client.collections.update("coll_1", { name: "Renamed" });

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/api/collections/coll_1");
    expect(call[1].method).toBe("PATCH");
  });
});

describe("collections.delete", () => {
  test("DELETE with force flag", async () => {
    const fetchMock = jsonFetch({ success: true, permanent: true });
    const client = createClient(fetchMock);

    await client.collections.delete("coll_1", true);

    const url = (fetchMock as any).mock.calls[0][0] as string;
    expect(url).toContain("force=true");
  });
});

describe("collections.chunks", () => {
  test("GET /collections/:id/chunks with params", async () => {
    const response = {
      chunks: [{ id: "chunk_1", content: "Hello", type: "text" }],
      total: 100,
      offset: 0,
      limit: 20,
      hasMore: true,
    };
    const fetchMock = jsonFetch(response);
    const client = createClient(fetchMock);

    const result = await client.collections.chunks("coll_1", {
      limit: 20,
      type: "text",
    });

    expect(result.chunks.length).toBe(1);
    expect(result.hasMore).toBe(true);

    const url = (fetchMock as any).mock.calls[0][0] as string;
    expect(url).toContain("limit=20");
    expect(url).toContain("type=text");
  });
});

describe("collections.search", () => {
  test("GET /collections/:id/search with query", async () => {
    const response = {
      results: [{ id: "chunk_1", content: "auth config", score: 0.95 }],
      query: "authentication",
    };
    const fetchMock = jsonFetch(response);
    const client = createClient(fetchMock);

    const result = await client.collections.search("coll_1", {
      query: "authentication",
      limit: 5,
    });

    expect(result.results.length).toBe(1);
    expect(result.query).toBe("authentication");

    const url = (fetchMock as any).mock.calls[0][0] as string;
    expect(url).toContain("q=authentication");
    expect(url).toContain("limit=5");
  });

  test("encodes filters as JSON in query string", async () => {
    const fetchMock = jsonFetch({ results: [], query: "test" });
    const client = createClient(fetchMock);

    await client.collections.search("coll_1", {
      query: "test",
      filters: [{ field: "category", operator: "eq", value: "support" }],
    });

    const url = (fetchMock as any).mock.calls[0][0] as string;
    expect(url).toContain("filters=");
    // The filters should be JSON-encoded in the URL
    const parsed = new URL(url);
    const filters = JSON.parse(parsed.searchParams.get("filters")!);
    expect(filters[0].field).toBe("category");
  });
});

describe("collections.stats", () => {
  test("GET /collections/:id/stats", async () => {
    const stats = { totalChunks: 500, bySourceType: [], byType: [], topSources: [] };
    const fetchMock = jsonFetch(stats);
    const client = createClient(fetchMock);

    const result = await client.collections.stats("coll_1");
    expect(result.totalChunks).toBe(500);
  });
});

describe("collections.insights", () => {
  test("GET /collections/:id/insights", async () => {
    const insights = { mainTopics: "AI, ML", keyFindings: "...", methodology: "...", importantDates: "..." };
    const fetchMock = jsonFetch(insights);
    const client = createClient(fetchMock);

    const result = await client.collections.insights("coll_1");
    expect(result.mainTopics).toBe("AI, ML");
  });
});

describe("collections.regenerateInsights", () => {
  test("POST /collections/:id/insights/regenerate", async () => {
    const insights = { mainTopics: "Updated", keyFindings: "...", methodology: "...", importantDates: "..." };
    const fetchMock = jsonFetch(insights);
    const client = createClient(fetchMock);

    const result = await client.collections.regenerateInsights("coll_1");
    expect(result.mainTopics).toBe("Updated");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[1].method).toBe("POST");
    expect(call[0]).toContain("/insights/regenerate");
  });
});

describe("collections.qualityReport", () => {
  test("GET /collections/:id/quality-report", async () => {
    const report = {
      totalDocuments: 5,
      documentsWithReport: 5,
      extractionMethods: { "pdf-mupdf": 3, "docx-mammoth": 2 },
      ocr: { docsWithOcr: 1, totalPagesOcrd: 4, totalPagesRejected: 0, docsWithOcrRejections: 0, totalCharsExtracted: 2200 },
      images: { totalExtracted: 8, totalIndexed: 8, totalSkipped: 0, docsWithImages: 2 },
      tables: { docsWithTables: 0, totalTables: 0, totalRows: 0 },
      chunking: { strategyDistribution: { "legal-article": 3, "default": 2 }, totalChunks: 180, avgChunksPerDoc: 36, avgChunkChars: 820, minChunkChars: 100, maxChunkChars: 1400 },
      embedding: { providers: { openai: 5 }, models: { "text-embedding-3-small": 5 }, multimodalDocs: 0 },
      durations: { totalMs: 15000, avgTotalMs: 3000, maxTotalMs: 5200 },
      warnings: { total: 0, docsWithWarnings: 0, topMessages: [] },
    };
    const fetchMock = jsonFetch(report);
    const client = createClient(fetchMock);

    const result = await client.collections.qualityReport("coll_1");
    expect(result.totalDocuments).toBe(5);
    expect(result.chunking.strategyDistribution["legal-article"]).toBe(3);

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/collections/coll_1/quality-report");
    expect(call[1].method).toBe("GET");
  });
});

describe("collections.documents", () => {
  test("GET /collections/:id/documents unwraps array", async () => {
    const docs = [
      { id: "doc_1", filename: "a.pdf", sourceType: "document", sourceUrl: null, chunksCount: 42, imagesCount: 0, storageBytes: 1024, hasMultimodalEmbeddings: false, embeddingModel: "openai", createdAt: "2026-04-20T10:00:00Z", ingestionReport: null },
    ];
    const fetchMock = jsonFetch({ documents: docs });
    const client = createClient(fetchMock);

    const result = await client.collections.documents("coll_1");
    expect(result.length).toBe(1);
    expect(result[0]!.filename).toBe("a.pdf");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/collections/coll_1/documents");
  });
});

describe("collections.setDefaultChunkingStrategy", () => {
  test("PATCH forwards strategy value", async () => {
    const collection = { id: "coll_1", name: "Docs", defaultChunkingStrategy: "semantic" };
    const fetchMock = jsonFetch(collection);
    const client = createClient(fetchMock);

    await client.collections.setDefaultChunkingStrategy("coll_1", "semantic");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[1].method).toBe("PATCH");
    const body = JSON.parse(call[1].body);
    expect(body.defaultChunkingStrategy).toBe("semantic");
  });

  test("PATCH null clears the override", async () => {
    const fetchMock = jsonFetch({ id: "coll_1", name: "Docs" });
    const client = createClient(fetchMock);

    await client.collections.setDefaultChunkingStrategy("coll_1", null);

    const call = (fetchMock as any).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.defaultChunkingStrategy).toBeNull();
  });
});

describe("collections.applyRagPreset", () => {
  test("PUT /rag-config with PRECISION preset body", async () => {
    const fetchMock = jsonFetch({ features: {} });
    const client = createClient(fetchMock);

    await client.collections.applyRagPreset("coll_1", "PRECISION");

    const call = (fetchMock as any).mock.calls[0];
    expect(call[0]).toContain("/collections/coll_1/rag-config");
    expect(call[1].method).toBe("PUT");
    const body = JSON.parse(call[1].body);
    expect(body.hybridSearch.alpha).toBe(0.85);
    expect(body.reranking.topN).toBe(5);
    expect(body.features.dynamicFeatureSelection).toBe(false);
  });
});
