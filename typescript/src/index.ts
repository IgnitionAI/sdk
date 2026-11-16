import { BaseClient } from "./client.js";
import { Chat } from "./resources/chat.js";
import { AgentChat } from "./resources/agent-chat.js";
import { Agents } from "./resources/agents.js";
import { Collections } from "./resources/collections.js";
import { Ingest } from "./resources/ingest.js";
import { Mcp } from "./resources/mcp.js";
import { Evaluations } from "./resources/evaluations.js";
import { DataChat } from "./resources/data-chat.js";
import { Compatibility } from "./resources/compatibility.js";
import { Workflows } from "./resources/workflows.js";
import { DeepResearch } from "./resources/deep-research.js";
import { Widgets } from "./resources/widgets.js";
import { Feedback } from "./resources/feedback.js";
import { Traces } from "./resources/traces.js";
import { RagAbTests } from "./resources/rag-ab-tests.js";
import { ConfigurationError } from "./errors.js";
import type { ClientOptions } from "./types.js";

export class IgnitionAI extends BaseClient {
  readonly chat: Chat;
  readonly agentChat: AgentChat;
  readonly agents: Agents;
  readonly collections: Collections;
  readonly ingest: Ingest;
  /** @deprecated Deployment-owned compatibility surface; avoid in new integrations. */
  readonly mcp: Mcp;
  readonly evaluations: Evaluations;
  readonly dataChat: DataChat;
  readonly compatibility: Compatibility;
  readonly workflows: Workflows;
  readonly deepResearch: DeepResearch;
  readonly widgets: Widgets;
  readonly feedback: Feedback;
  readonly traces: Traces;
  readonly ragAbTests: RagAbTests;

  constructor(options: ClientOptions) {
    super(options);
    this.chat = new Chat(this);
    this.agentChat = new AgentChat(this);
    this.agents = new Agents(this);
    this.collections = new Collections(this);
    this.ingest = new Ingest(this);
    this.mcp = new Mcp(this);
    this.evaluations = new Evaluations(this);
    this.dataChat = new DataChat(this);
    this.compatibility = new Compatibility(this);
    this.workflows = new Workflows(this);
    this.deepResearch = new DeepResearch(this);
    this.widgets = new Widgets(this);
    this.feedback = new Feedback(this);
    this.traces = new Traces(this);
    this.ragAbTests = new RagAbTests(this);
  }

  /** Construct a client from IGNITION_API_KEY in a trusted server runtime. */
  static fromEnv(options: Omit<ClientOptions, "apiKey" | "tokenProvider">): IgnitionAI {
    const apiKey = (globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }).process?.env?.IGNITION_API_KEY;
    if (!apiKey) {
      throw new ConfigurationError(
        "IGNITION_API_KEY is required when using IgnitionAI.fromEnv()."
      );
    }
    return new IgnitionAI({ ...options, apiKey });
  }
}

// Re-export types
export type {
  ClientOptions,
  FeedbackParams,
  FeedbackResult,
  Trace,
  TraceType,
  TraceStatus,
  TraceListParams,
  TraceListResponse,
  TraceMetricsParams,
  TraceMetrics,
  TraceExportParams,
  TraceExport,
  RagConfigCandidate,
  RagAbTestParams,
  RagAbTestResult,
  Source,
  ImageResult,
  PipelineMetrics,
  FilterDefinition,
  ChatMessage,
  McpServer,
  Agent,
  AgentCreateParams,
  AgentUpdateParams,
  AgentGenerateParams,
  AgentGenerateResult,
  AgentSkill,
  AgentSkillCreateParams,
  AgentSkillExample,
  AgentSkillStatus,
  AgentSkillUpdateParams,
  Collection,
  CollectionServedSource,
  CollectionAccessTier,
  CollectionCreateParams,
  PublicCollectionRequiredPlanId,
  PublicCollectionPublisher,
  PublicCollectionSummary,
  PublicCollectionDetail,
  PublicCollectionListParams,
  CollectionUpdateParams,
  CollectionVisibilityUpdateParams,
  ChatParams,
  ChatResponse,
  ManagedChatParams,
  ManagedChatResponse,
  ManagedProgressiveStreamEvent,
  ManagedAgent,
  ManagedAgentCreateParams,
  ManagedAgentUpdateParams,
  ManagedAgentChatStartParams,
  ManagedAgentChatOutput,
  ManagedAgentChatResponse,
  ManagedAgentChatSummary,
  ManagedAgentChatHistory,
  AgentChatParams,
  ChatStreamEvent,
  ProgressiveStreamEvent,
  AgentChatStreamEvent,
  IngestUrlParams,
  IngestDocumentParams,
  IngestFileParams,
  IngestCrawlParams,
  IngestDatasetParams,
  IngestResult,
  CrawlResult,
  AsyncIngestResult,
  IngestionJob,
  IngestionJobStatus,
  IngestionJobSource,
  IngestionJobStep,
  IngestionJobResponse,
  IngestionJobsResponse,
  IngestionJobCancelResponse,
  IngestionJobStreamEvent,
  DiscoverSiteParams,
  DiscoveredPage,
  DiscoverSiteResult,
  CrawlSelectedParams,
  WidgetType,
  WidgetPosition,
  WidgetTheme,
  WidgetSuggestion,
  WidgetHumanEscalation,
  WidgetConfig,
  ManagedWidgetConfig,
  ManagedWidgetBusinessConfiguration,
  ManagedWidgetCreateParams,
  ManagedWidgetUpdateParams,
  ManagedWidgetCreateResult,
  WidgetCreateParams,
  WidgetUpdateParams,
  WidgetCreateResult,
  WidgetKeyResult,
  WidgetAnalytics,
  McpPrompt,
  McpResource,
  McpPromptContent,
  McpResourceContent,
  McpTestResult,
  Chunk,
  ChunkListParams,
  ChunkListResponse,
  SearchParams,
  SearchResponse,
  CollectionStats,
  CollectionInsights,
  ChunkingStrategy,
  CollectionQualityReport,
  DocumentIngestionReport,
  DocumentRecord,
  EvaluationStatus,
  EvaluationProgress,
  UserProvidedQuestion,
  EvaluationCreateParams,
  EvaluationSummary,
  EvaluationAggregate,
  EvaluationQuery,
  EvaluationDetail,
  DataChatResource,
  DataChatParams,
  DataChatPrecheck,
  DataChatResponse,
  Workflow,
  WorkflowListItem,
  WorkflowCreateParams,
  WorkflowUpdateParams,
  WorkflowExecution,
  WorkflowExecutionResult,
  WorkflowExecutionStatus,
  WorkflowValidationResult,
  DeepResearchExecutionStatus,
  DeepResearchStatus,
  DeepResearchStreamEvent,
} from "./types.js";

// Re-export presets
export {
  RETRIEVAL_PRESETS,
  type RetrievalPresetConfig,
  type RetrievalPresetName,
} from "./presets.js";

// Re-export errors
export {
  IgnitionAIError,
  ConfigurationError,
  SecurityError,
  ProtocolError,
  UnsupportedCapabilityError,
  UnsupportedContractVersionError,
  ContractDigestMismatchError,
  APIError,
  AuthenticationError,
  PermissionError,
  CapabilityDisabledError,
  CapabilityNotLicensedError,
  ForbiddenIdentityError,
  NotFoundError,
  BadRequestError,
  RateLimitError,
  InternalServerError,
  OfferingUnavailableError,
  APIConnectionError,
  APIConnectionTimeoutError,
  RequestCancelledError,
} from "./errors.js";

// Re-export stream classes
export { ChatStream, AgentChatStream, ProgressiveStream, DeepResearchStream, IngestionJobStream } from "./streaming.js";

// Re-export version
export { VERSION } from "./version.js";
export {
  PUBLIC_CONTRACT_VERSION,
  PUBLIC_CONTRACT_DIGEST,
  SUPPORTED_CONTRACT_VERSIONS,
} from "./contract.js";
export type { DeploymentMetadata } from "./resources/compatibility.js";
