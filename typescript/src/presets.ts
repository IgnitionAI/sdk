/**
 * Retrieval presets for collection RAG config.
 *
 * Each preset is a partial ragConfig merged server-side with the collection's
 * current configuration when applied via `sdk.collections.applyRagPreset()`.
 * The 4 presets mirror the UI picker on the collection page so API and
 * dashboard stay in sync.
 *
 * Tradeoffs:
 *  - BALANCED  — good default, hybrid + rerank + dynamic features
 *  - PRECISION — vector-heavy, tight top-N, for factual exact-match queries
 *  - RECALL    — HyDE + multi-query + wide top-N, for exploratory queries
 *  - SPEED     — no reranking, no dynamic features, for widgets / low latency
 */

export type RetrievalPresetName = "BALANCED" | "PRECISION" | "RECALL" | "SPEED";

export interface RetrievalPresetConfig {
  features: {
    hybridSearch: boolean;
    selfQuery: boolean;
    queryRewriting: boolean;
    queryExpansion: boolean;
    hyde: boolean;
    multiQuery: boolean;
    reranking: boolean;
    dynamicFeatureSelection: boolean;
  };
  hybridSearch: { alpha: number };
  reranking: { topN: number };
}

export const RETRIEVAL_PRESETS: Record<RetrievalPresetName, RetrievalPresetConfig> = {
  BALANCED: {
    features: {
      hybridSearch: true,
      selfQuery: true,
      queryRewriting: true,
      queryExpansion: false,
      hyde: false,
      multiQuery: false,
      reranking: true,
      dynamicFeatureSelection: true,
    },
    hybridSearch: { alpha: 0.7 },
    reranking: { topN: 7 },
  },
  PRECISION: {
    features: {
      hybridSearch: true,
      selfQuery: true,
      queryRewriting: true,
      queryExpansion: false,
      hyde: false,
      multiQuery: false,
      reranking: true,
      dynamicFeatureSelection: false,
    },
    hybridSearch: { alpha: 0.85 },
    reranking: { topN: 5 },
  },
  RECALL: {
    features: {
      hybridSearch: true,
      selfQuery: true,
      queryRewriting: true,
      queryExpansion: true,
      hyde: true,
      multiQuery: true,
      reranking: true,
      dynamicFeatureSelection: false,
    },
    hybridSearch: { alpha: 0.6 },
    reranking: { topN: 10 },
  },
  SPEED: {
    features: {
      hybridSearch: true,
      selfQuery: false,
      queryRewriting: false,
      queryExpansion: false,
      hyde: false,
      multiQuery: false,
      reranking: false,
      dynamicFeatureSelection: false,
    },
    hybridSearch: { alpha: 0.75 },
    reranking: { topN: 5 },
  },
};
