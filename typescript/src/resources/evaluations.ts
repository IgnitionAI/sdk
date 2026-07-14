import type { BaseClient } from "../client.js";
import type {
  EvaluationCreateParams,
  EvaluationDetail,
  EvaluationSummary,
} from "../types.js";

/**
 * Evaluations — measure RAG quality for a user collection.
 *
 * The runner is asynchronous: `create()` enqueues a job and returns immediately
 * with status=queued. Poll `get()` for status transitions (queued → running →
 * completed/failed) or `list()` for recent runs. An email notification is sent
 * when a run completes (fall-back to the requester's account email).
 *
 * Two modes:
 *  - Synthetic (default): N questions auto-generated from the collection chunks
 *  - User-provided: pass `goldenSet` with your own questions + optional
 *    expected answers / keywords
 *
 * Cost: every question runs the full RAG pipeline + an LLM judge against the
 * org's configured BYOK provider. Budget ~0.02€ per 10 synthetic questions
 * on OpenAI 4o-mini pricing. Cap is 30 synthetic / 50 user-provided.
 */
export class Evaluations {
  constructor(private client: BaseClient) {}

  /**
   * Enqueue a new evaluation run. Returns immediately with status=queued.
   * When `goldenSet` is present, `numQuestions` and `inheritFromEvaluationId`
   * are ignored.
   */
  async create(
    collectionId: string,
    params?: EvaluationCreateParams,
  ): Promise<EvaluationSummary> {
    return this.client.request<EvaluationSummary>(
      "POST",
      `/collections/${collectionId}/evaluations`,
      { body: JSON.stringify(params ?? {}) },
    );
  }

  /**
   * List the 20 most recent evaluations for a collection, each with a
   * headline score. Cheap call — result payload is excluded (use `get(id)`
   * for the per-question breakdown).
   */
  async list(collectionId: string): Promise<EvaluationSummary[]> {
    const data = await this.client.request<{ evaluations: EvaluationSummary[] }>(
      "GET",
      `/collections/${collectionId}/evaluations`,
    );
    return data.evaluations;
  }

  /**
   * Full evaluation detail: aggregate scores + per-question breakdown (query,
   * retrieved chunks, generated answer, judge reasoning).
   */
  async get(evaluationId: string): Promise<EvaluationDetail> {
    return this.client.request<EvaluationDetail>(
      "GET",
      `/evaluations/${evaluationId}`,
    );
  }
}
