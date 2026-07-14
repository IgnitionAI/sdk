// ─── Client ────────────────────────────────────────────────────────

export interface ClientOptions {
  /** API key (ign_xxx). Falls back to IGNITION_API_KEY env var. */
  apiKey?: string;
  /** Async user-token provider, intended for browser and delegated user sessions. */
  tokenProvider?: () => string | Promise<string>;
  /** Absolute URL of the licensed IgnitionRAG deployment. */
  baseURL: string;
  /** Max retries on retryable errors. Default: 2 */
  maxRetries?: number;
  /** Request timeout in ms. Default: 60000 */
  timeout?: number;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
  /** Default headers added to every request */
  defaultHeaders?: Record<string, string>;
}

// ─── Workflows ────────────────────────────────────────────────────

export type WorkflowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; config: Record<string, unknown> };
  width?: number;
  height?: number;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  data?: Record<string, unknown>;
  type?: string;
  animated?: boolean;
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
};

export type WorkflowVariable = {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "any" |
    "message" | "messages" | "documents" | "embedding";
  defaultValue?: unknown;
  description?: string;
  required?: boolean;
};

export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  graph: WorkflowGraph;
  variables: WorkflowVariable[] | null;
  isActive: boolean;
  defaultCollectionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowListItem = Pick<
  Workflow,
  "id" | "name" | "description" | "isActive" | "createdAt" | "updatedAt"
> & {
  nodeCount: number;
  lastExecutionStatus: string | null;
  lastExecutedAt: string | null;
};

export type WorkflowCreateParams = {
  name: string;
  description?: string;
  graph?: WorkflowGraph;
  variables?: WorkflowVariable[];
  defaultCollectionId?: string;
};

export type WorkflowUpdateParams = Partial<WorkflowCreateParams> & {
  isActive?: boolean;
  defaultCollectionId?: string | null;
};

export type WorkflowExecutionStatus =
  | "pending" | "running" | "pending_approval" | "completed" | "failed" | "cancelled";

export type WorkflowExecution = {
  id: string;
  workflowId: string;
  status: WorkflowExecutionStatus;
  input: unknown | null;
  output: unknown | null;
  nodeStates: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  triggeredBy: string | null;
  createdAt: string;
};

export type WorkflowExecutionResult = {
  executionId: string;
  status: WorkflowExecutionStatus;
  output: unknown | null;
  error?: string;
};

export type WorkflowValidationResult = {
  valid: boolean;
  errors: Array<{ type: string; message: string; nodeId?: string; edgeId?: string }>;
  warnings: Array<{ type: string; message: string; nodeId?: string }>;
};

export type DeepResearchExecutionStatus =
  | "queued" | "running" | "awaiting_approval" | "completed" | "cancelled" | "failed";

export type DeepResearchStatus = {
  execution: {
    id: string;
    status: DeepResearchExecutionStatus;
    query: string;
    todoState?: unknown;
    scratchpad?: unknown;
    tokenCount: number;
    tokenBudget: number;
    result?: string | null;
    resultMetadata?: unknown;
  };
  tasks: Array<Record<string, unknown>>;
};

export type DeepResearchStreamEvent = {
  type: string;
  data: unknown;
};

// ─── Core Types ────────────────────────────────────────────────────

export interface Source {
  type: "text" | "image";
  content?: string;
  score: number;
  source: string;
  sourceType: string;
  title?: string;
  url?: string;
  pageNumber?: number;
  imageIndex?: number;
  mimeType?: string;
}

export interface ImageResult {
  source: string;
  pageNumber?: number;
  imageIndex?: number;
  mimeType?: string;
  score: number;
  signedUrl?: string;
}

export interface PipelineMetrics {
  totalTimeMs: number;
  queryEnhancementMs: number;
  searchMs: number;
  rerankMs: number;
  resultsCount: number;
  bm25IndexSize?: number;
}

export interface FilterDefinition {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "contains"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "between"
    | "exists";
  value:
    | string
    | number
    | boolean
    | Array<string | number>
    | { from: number; to: number };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolHumanInLoopConfig {
  /** Require an explicit human confirmation before this tool can execute. */
  humanInTheLoop?: boolean;
}

export interface AgentBuiltinToolConfig extends ToolHumanInLoopConfig {
  id: string;
}

export type AgentBuiltinToolEntry = string | AgentBuiltinToolConfig;

export type McpToolPolicy = ToolHumanInLoopConfig;

export interface McpToolAnnotations {
  readOnly?: boolean;
  requiresConfirmation?: boolean;
  destructive?: boolean;
}

export interface McpDiscoveredTool {
  name: string;
  description?: string;
  annotations?: McpToolAnnotations;
}

export interface McpServer {
  name: string;
  url: string;
  description?: string;
  token?: string;
  toolPolicies?: Record<string, McpToolPolicy>;
}

// ─── Agent ─────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  collectionId: string | null;
  collectionName?: string | null;
  systemPrompt: string | null;
  instructions: string | null;
  llmConfigId: string | null;
  fallbackLlmConfigId?: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  scoreThreshold: number;
  mcpServers: McpServer[] | null;
  enabledBuiltinTools: AgentBuiltinToolEntry[] | null;
  skillIds?: string[];
  workflowToolIds?: string[];
  isActive: boolean;
  isDeepAgent: boolean;
  subAgentIds: string[] | null;
  enableContextEngineering: boolean;
  contextWindowSize: number;
  createdAt: string;
  updatedAt: string;
}

export type AgentSkillStatus = "draft" | "published" | "archived";

export interface AgentSkillExample {
  input?: string;
  output?: string;
  notes?: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  constraints: string | null;
  examples: AgentSkillExample[] | null;
  builtinTools: AgentBuiltinToolEntry[] | null;
  mcpServerRefs: string[] | null;
  workflowToolRefs: string[] | null;
  status: AgentSkillStatus;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSkillCreateParams {
  name: string;
  description?: string | null;
  instructions?: string | null;
  constraints?: string | null;
  examples?: AgentSkillExample[];
  builtinTools?: AgentBuiltinToolEntry[];
  mcpServerRefs?: string[];
  workflowToolRefs?: string[];
  status?: AgentSkillStatus;
}

export interface AgentSkillUpdateParams extends Partial<AgentSkillCreateParams> {}

export interface AgentCreateParams {
  name: string;
  description?: string;
  collectionId?: string | null;
  systemPrompt?: string;
  instructions?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  scoreThreshold?: number;
  mcpServers?: McpServer[];
  enabledBuiltinTools?: AgentBuiltinToolEntry[];
  skillIds?: string[];
  workflowToolIds?: string[];
  enableContextEngineering?: boolean;
  contextWindowSize?: number;
  isDeepAgent?: boolean;
  subAgentIds?: string[];
}

export interface AgentUpdateParams extends Partial<AgentCreateParams> {}

export interface AgentGenerateParams {
  description: string;
  collectionId?: string;
  language?: string;
}

export interface AgentGenerateResult {
  name: string;
  description: string | null;
  systemPrompt: string;
  instructions: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  scoreThreshold: number;
  suggestedTools?: Array<{ name: string; description: string }>;
}

// ─── Collection ────────────────────────────────────────────────────

export type ChunkingStrategy =
  | "default"
  | "markdown-heading"
  | "legal-article"
  | "regulatory-section"
  | "csv-row-grouped"
  | "email-thread"
  | "semantic";

export type PublicCollectionRequiredPlanId = "pro" | "scale" | "enterprise";

export type CollectionAccessTier =
  | "owner"
  | "shared"
  | "public-free"
  | "public-gated";

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  documentCount: number;
  storageBytes: number;
  imagesCount?: number;
  hasMultimodalEmbeddings?: boolean;
  visibility: "private" | "shared" | "public";
  createdByAdmin: boolean;
  isSystemCollection?: boolean;
  sourceDataset?: string | null;
  slug?: string | null;
  requiredPlanId?: PublicCollectionRequiredPlanId | null;
  accessTier?: CollectionAccessTier;
  publisherOrgId?: string | null;
  isReadOnly?: boolean;
  createdAt: string;
  /**
   * Optional override of the auto-detected chunking strategy. null = detector
   * picks at ingestion time (default).
   */
  defaultChunkingStrategy?: ChunkingStrategy | null;
}

export interface CollectionCreateParams {
  name: string;
  description?: string;
  visibility?: "private" | "shared" | "public";
  sourceDataset?: string;
  slug?: string;
  requiredPlanId?: PublicCollectionRequiredPlanId;
}

export interface CollectionUpdateParams {
  name?: string;
  description?: string;
  defaultChunkingStrategy?: ChunkingStrategy | null;
}

// ─── Chat ──────────────────────────────────────────────────────────

export interface ChatParams {
  collectionId: string;
  query: string;
  history?: ChatMessage[];
  llmConfigId?: string;
  includeImages?: boolean;
  filters?: FilterDefinition[];
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  images?: ImageResult[];
  relevanceScore?: number;
  pipelineMetrics?: PipelineMetrics;
  featuresUsed?: string[];
}

export interface AgentChatParams {
  query: string;
  sessionId?: string;
  depth?: "quick" | "deep";
  history?: ChatMessage[];
  attachments?: {
    prompts?: Array<{
      server: string;
      name: string;
      arguments?: Record<string, string>;
    }>;
    resources?: Array<{
      server: string;
      uri: string;
    }>;
  };
}

// ─── SSE Events ────────────────────────────────────────────────────

// Chat stream (/api/chat/stream)
export type ChatStreamEvent =
  | { type: "chunk"; content: string }
  | { type: "sources"; sources: Source[] }
  | { type: "images"; images: ImageResult[] }
  | {
      type: "metrics";
      pipelineMetrics: PipelineMetrics;
      featuresUsed: string[];
    }
  | { type: "done" }
  | { type: "error"; error: string };

// Progressive stream (/api/chat/stream/progressive)
export type ProgressiveStreamEvent =
  | { type: "stage"; stage: string; elapsed: number; details?: unknown }
  | {
      type: "enhancement";
      original: string;
      enhanced: string;
      filters?: unknown;
      hyde?: string;
      multiQueries?: string[];
      featuresUsed: string[];
    }
  | {
      type: "sources";
      sources: Source[];
      images?: ImageResult[];
      retrievalTimeMs: number;
    }
  | { type: "chunk"; content: string }
  | { type: "citation"; index: number; sourceId: string; position: number }
  | {
      type: "metrics";
      pipelineMetrics: PipelineMetrics;
      stageBreakdown: unknown[];
      featuresUsed: string[];
      citations: unknown[];
      config: unknown;
    }
  | { type: "done" }
  | { type: "error"; error: string };

// Agent chat stream (/api/agents/:id/chat/stream)
export type AgentChatStreamEvent =
  | { type: "chunk"; content: string }
  | {
      type: "tool_call";
      id: string;
      name: string;
      args: Record<string, unknown>;
    }
  | { type: "tool_result"; id: string; name: string; result: string }
  | { type: "deep_status"; executionId?: string; status?: string; [key: string]: unknown }
  | { type: "deep_task"; executionId?: string; [key: string]: unknown }
  | { type: "deep_finding"; executionId?: string; [key: string]: unknown }
  | { type: "deep_synthesis"; executionId?: string; content?: string; result?: string; [key: string]: unknown }
  | { type: "sources"; sources: Source[] }
  | { type: "done" }
  | { type: "error"; error: string };

// ─── Ingestion ─────────────────────────────────────────────────────

export interface IngestUrlParams {
  collectionId: string;
  url: string;
  enableMultimodal?: boolean;
  enableEnrichment?: boolean;
  enrichmentSummary?: boolean;
  enrichmentEntities?: boolean;
  enrichmentTags?: boolean;
}

export interface IngestDocumentParams {
  collectionId: string;
  content: string;
  filename: string;
}

export interface IngestFileParams {
  collectionId: string;
  file: File | Blob;
}

export interface IngestCrawlParams {
  collectionId: string;
  url: string;
  maxPages?: number;
  maxDepth?: number;
  enableMultimodal?: boolean;
  enableEnrichment?: boolean;
}

export interface IngestDatasetParams {
  collectionId: string;
  datasetId: string;
  config?: string;
  split?: string;
  limit?: number;
  enableMultimodal?: boolean;
  enableEnrichment?: boolean;
}

export interface IngestResult {
  success: boolean;
  message: string;
  chunksCount: number;
  imagesCount?: number;
  documentId?: string;
  multimodalEnabled?: boolean;
  embeddingModel?: "openai" | "jina-clip";
}

export interface CrawlResult extends IngestResult {
  pagesCount: number;
}

// ─── MCP ───────────────────────────────────────────────────────────

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
  server: string;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  server: string;
}

export interface McpPromptContent {
  description?: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

export interface McpResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface McpTestResult {
  success: boolean;
  tools?: Array<string | McpDiscoveredTool>;
  error?: string;
}

// ─── Collection Exploration ────────────────────────────────────────

export interface Chunk {
  id: string;
  content: string;
  type: "text" | "image";
  sourceType: "document" | "web" | "dataset";
  source: string;
  title?: string;
  pageNumber?: number;
  chunkIndex?: number;
  createdAt?: string;
  imageIndex?: number;
  mimeType?: string;
  signedUrl?: string;
  documentId?: string;
  summary?: string;
  entities?: Array<{ name: string; type: string }>;
  tags?: string[];
}

export interface ChunkListParams {
  offset?: number;
  limit?: number;
  sourceType?: "document" | "web" | "dataset";
  type?: "text" | "image";
}

export interface ChunkListResponse {
  chunks: Chunk[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchParams {
  query: string;
  limit?: number;
  sourceType?: "document" | "web" | "dataset";
  type?: "text" | "image";
  filters?: FilterDefinition[];
}

export interface SearchResponse {
  results: Array<Chunk & { score: number }>;
  query: string;
}

export interface CollectionStats {
  totalChunks: number;
  bySourceType: Array<{ sourceType: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  topSources: Array<{ source: string; title?: string; count: number }>;
}

export interface CollectionInsights {
  mainTopics: string;
  keyFindings: string;
  methodology: string;
  importantDates: string;
}

// ─── Ingestion Quality Report ─────────────────────────────────────

export interface DocumentIngestionReport {
  version: 1;
  extractionMethod: string;
  pageCount?: number;
  ocr: { pagesOcrd: number; pagesRejected: number; charsExtracted: number } | null;
  images: { extracted: number; indexed: number; skippedTooLarge: number };
  tables: { detected: number; totalRows?: number; totalCols?: number; sheets?: number } | null;
  chunking: {
    strategy: string;
    strategyReason?: "explicit" | "auto" | "default-fallback";
    strategyExplanation?: string;
    chunksCreated: number;
    avgChars: number;
    minChars: number;
    maxChars: number;
  };
  embedding: {
    provider: string;
    model: string;
    vectorDims?: number;
    multimodal: boolean;
  };
  durations: { extractMs: number; chunkMs: number; embedMs: number; totalMs: number };
  warnings: string[];
}

export interface DocumentRecord {
  id: string;
  filename: string;
  sourceType: string;
  sourceUrl: string | null;
  chunksCount: number;
  imagesCount: number;
  storageBytes: number;
  hasMultimodalEmbeddings: boolean;
  embeddingModel: string;
  createdAt: string;
  ingestionReport: DocumentIngestionReport | null;
}

export interface CollectionQualityReport {
  totalDocuments: number;
  documentsWithReport: number;
  extractionMethods: Record<string, number>;
  ocr: {
    docsWithOcr: number;
    totalPagesOcrd: number;
    totalPagesRejected: number;
    docsWithOcrRejections: number;
    totalCharsExtracted: number;
  };
  images: {
    totalExtracted: number;
    totalIndexed: number;
    totalSkipped: number;
    docsWithImages: number;
  };
  tables: { docsWithTables: number; totalTables: number; totalRows: number };
  chunking: {
    strategyDistribution: Record<string, number>;
    totalChunks: number;
    avgChunksPerDoc: number;
    avgChunkChars: number;
    minChunkChars: number;
    maxChunkChars: number;
  };
  embedding: {
    providers: Record<string, number>;
    models: Record<string, number>;
    multimodalDocs: number;
  };
  durations: { totalMs: number; avgTotalMs: number; maxTotalMs: number };
  warnings: {
    total: number;
    docsWithWarnings: number;
    topMessages: Array<{ message: string; count: number }>;
  };
}

// ─── Evaluations ──────────────────────────────────────────────────

export type EvaluationStatus = "queued" | "running" | "completed" | "failed";

export interface EvaluationProgress {
  phase: "generating" | "running" | "judging";
  current: number;
  total: number;
}

/**
 * User-provided golden-set question. All fields validated server-side:
 * `query` required (≤ 500 chars), `expectedAnswer` and `expectedKeywords`
 * optional. Cap 50 items per run.
 */
export interface UserProvidedQuestion {
  query: string;
  expectedAnswer?: string;
  expectedKeywords?: string[];
}

export interface EvaluationCreateParams {
  /** Number of synthetic questions to generate. Ignored when `goldenSet` is provided. Default 10, cap 30. */
  numQuestions?: number;
  /** Email to notify on completion. Falls back to requester's user email. */
  notifyEmail?: string;
  /** Re-run with the same synthetic questions as a past evaluation. Parent must be completed on the same collection. */
  inheritFromEvaluationId?: string;
  /** Partial ragConfig merged with the collection's config for this run (auto-optimize). */
  ragConfigOverride?: Record<string, unknown>;
  /** User-provided golden set. When present, backend skips the synthetic generator. Max 50 items. */
  goldenSet?: UserProvidedQuestion[];
}

export interface EvaluationSummary {
  id: string;
  collectionId?: string;
  status: EvaluationStatus;
  numQuestions: number;
  progress: EvaluationProgress | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  parentEvaluationId: string | null;
  ragConfigOverride?: Record<string, unknown> | null;
  /** 0-100 composite score. null while the run is pending / running / failed. */
  score: number | null;
  /** 0-1 hit rate, or null when not mesurable (user questions without sourceChunkId + keywords). */
  retrievalHitRate: number | null;
  /** 1-5 average judge score, null if no judge ran. */
  avgJudgeOverall: number | null;
}

export interface EvaluationAggregate {
  numQuestions: number;
  retrievalHitRate: number | null;
  avgRetrievalRank: number | null;
  avgJudgeOverall: number | null;
  avgCorrectness: number | null;
  avgCompleteness: number | null;
  avgGroundedness: number | null;
  avgAnswerLatencyMs: number;
  score: number;
}

export interface EvaluationQuery {
  question: {
    id: string;
    query: string;
    sourceChunkId?: string;
    sourcePreview?: string;
    sourceDocumentId?: string | null;
    sourceLabel?: string | null;
    expectedAnswer?: string;
    expectedKeywords?: string[];
  };
  retrievedChunkIds: string[];
  topResultPreview: string | null;
  answer: string;
  answerLatencyMs: number;
  retrievalHit: boolean | null;
  retrievalRank: number | null;
  judge: {
    correctness: number;
    completeness: number;
    groundedness: number;
    overall: number;
    reasoning: string;
  } | null;
}

export interface EvaluationDetail {
  id: string;
  collectionId: string;
  status: EvaluationStatus;
  numQuestions: number;
  progress: EvaluationProgress | null;
  parentEvaluationId: string | null;
  result: {
    collectionId: string;
    numQuestions: number;
    runAtIso: string;
    aggregate: EvaluationAggregate;
    queries: EvaluationQuery[];
  } | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface DataChatResource { type: "collection" | "data_connector"; id: string }
export interface DataChatParams { query: string; llmConfigId: string; resources: DataChatResource[] }
export interface DataChatPrecheck {
  compatible: boolean;
  resources: Array<DataChatResource & { compatible: boolean; errorCode?: string }>;
}
export interface DataChatResponse {
  answer: string;
  completeness: "complete" | "partial";
  missingSources: string[];
  sources: Array<{
    resourceType: DataChatResource["type"];
    id: string;
    name: string;
    outcome: "succeeded" | "skipped_irrelevant" | "blocked_policy" | "unavailable" | "timed_out";
    provenance?: Record<string, unknown>;
    errorCode?: string;
  }>;
}
