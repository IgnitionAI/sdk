import { describe, expect, test, mock } from "bun:test";
import { IgnitionAI, RETRIEVAL_PRESETS } from "../src/index";

function jsonFetch(data: unknown, status = 200): typeof fetch {
  return mock(() =>
    Promise.resolve(
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
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

describe("evaluations.create", () => {
  test("POST /collections/:id/evaluations with defaults", async () => {
    const summary = {
      id: "eval_1",
      status: "queued",
      numQuestions: 10,
      progress: null,
      error: null,
      startedAt: null,
      completedAt: null,
      createdAt: "2026-04-20T10:00:00Z",
      parentEvaluationId: null,
      score: null,
      retrievalHitRate: null,
      avgJudgeOverall: null,
    };
    const fetchMock = jsonFetch(summary, 201);
    const client = createClient(fetchMock);

    const result = await client.evaluations.create("coll_123");
    expect(result.id).toBe("eval_1");
    expect(result.status).toBe("queued");

    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    expect(call[0] as string).toContain("/api/collections/coll_123/evaluations");
    expect((call[1] as { method: string }).method).toBe("POST");
  });

  test("passes goldenSet when provided (user-supplied CSV path)", async () => {
    const fetchMock = jsonFetch({ id: "eval_2", status: "queued" }, 201);
    const client = createClient(fetchMock);

    await client.evaluations.create("coll_abc", {
      goldenSet: [
        { query: "Délai rétractation ?", expectedAnswer: "14 jours", expectedKeywords: ["14", "jours"] },
        { query: "PACS ?" },
      ],
    });

    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    const body = JSON.parse((call[1] as { body: string }).body);
    expect(body.goldenSet.length).toBe(2);
    expect(body.goldenSet[0].query).toBe("Délai rétractation ?");
    expect(body.goldenSet[0].expectedAnswer).toBe("14 jours");
    expect(body.goldenSet[1].expectedAnswer).toBeUndefined();
  });

  test("passes ragConfigOverride + inheritFromEvaluationId for auto-optimize flows", async () => {
    const fetchMock = jsonFetch({ id: "eval_3", status: "queued" }, 201);
    const client = createClient(fetchMock);

    await client.evaluations.create("coll_abc", {
      inheritFromEvaluationId: "eval_parent",
      ragConfigOverride: RETRIEVAL_PRESETS.PRECISION as unknown as Record<string, unknown>,
    });

    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    const body = JSON.parse((call[1] as { body: string }).body);
    expect(body.inheritFromEvaluationId).toBe("eval_parent");
    expect(body.ragConfigOverride.hybridSearch.alpha).toBe(0.85);
  });
});

describe("evaluations.list", () => {
  test("GET /collections/:id/evaluations and unwraps array", async () => {
    const evaluations = [
      { id: "eval_1", status: "completed", score: 72, numQuestions: 10 },
      { id: "eval_2", status: "running", score: null, numQuestions: 10 },
    ];
    const fetchMock = jsonFetch({ evaluations });
    const client = createClient(fetchMock);

    const result = await client.evaluations.list("coll_123");
    expect(result.length).toBe(2);
    expect(result[0]!.score).toBe(72);

    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    expect(call[0] as string).toContain("/api/collections/coll_123/evaluations");
    expect((call[1] as { method: string }).method).toBe("GET");
  });
});

describe("evaluations.get", () => {
  test("GET /evaluations/:id returns full detail", async () => {
    const detail = {
      id: "eval_1",
      collectionId: "coll_123",
      status: "completed",
      numQuestions: 10,
      progress: null,
      parentEvaluationId: null,
      result: {
        collectionId: "coll_123",
        numQuestions: 10,
        runAtIso: "2026-04-20T10:30:00Z",
        aggregate: {
          numQuestions: 10,
          retrievalHitRate: 0.7,
          avgRetrievalRank: 2.5,
          avgJudgeOverall: 4.1,
          avgCorrectness: 4.2,
          avgCompleteness: 4.0,
          avgGroundedness: 4.0,
          avgAnswerLatencyMs: 2100,
          score: 78,
        },
        queries: [],
      },
      error: null,
      startedAt: "2026-04-20T10:01:00Z",
      completedAt: "2026-04-20T10:30:00Z",
      createdAt: "2026-04-20T10:00:00Z",
    };
    const fetchMock = jsonFetch(detail);
    const client = createClient(fetchMock);

    const result = await client.evaluations.get("eval_1");
    expect(result.result?.aggregate.score).toBe(78);

    const call = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    expect(call[0] as string).toContain("/api/evaluations/eval_1");
  });
});

describe("RETRIEVAL_PRESETS", () => {
  test("exports 4 presets with expected shape", () => {
    expect(Object.keys(RETRIEVAL_PRESETS).sort()).toEqual([
      "BALANCED",
      "PRECISION",
      "RECALL",
      "SPEED",
    ]);
    // PRECISION has the tightest topN + highest alpha
    expect(RETRIEVAL_PRESETS.PRECISION.reranking.topN).toBe(5);
    expect(RETRIEVAL_PRESETS.PRECISION.hybridSearch.alpha).toBe(0.85);
    // SPEED disables reranking
    expect(RETRIEVAL_PRESETS.SPEED.features.reranking).toBe(false);
  });
});
