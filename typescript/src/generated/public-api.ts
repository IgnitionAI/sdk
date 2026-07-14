// Generated from the verified IgnitionRAG public contract.
// Do not edit and do not export this module from the package root.
export type paths = {
    readonly "/api/agents": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * List all agents
         * @description Returns all agents for the current organization
         */
        readonly get: operations["agents.list"];
        readonly put?: never;
        /**
         * Create a new agent
         * @description Creates a new agent. Optionally link to a collection for RAG capabilities.
         */
        readonly post: operations["agents.create"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/:agentId/chat/cancel-deep": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /** Cancel active deep research for an agent */
        readonly post: operations["deepResearch.cancel"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/:agentId/chat/deep-status": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Get active or most recent deep research execution for reconnection */
        readonly get: operations["deepResearch.status"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/:agentId/chat/deep-stream": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Reconnect to running deep research SSE stream */
        readonly get: operations["deepResearch.stream"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/:id": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Get agent by ID */
        readonly get: operations["agents.get"];
        readonly put?: never;
        readonly post?: never;
        /**
         * Delete agent
         * @description Permanently deletes an agent and cascades related rows where configured.
         */
        readonly delete: operations["agents.delete"];
        readonly options?: never;
        readonly head?: never;
        /** Update agent */
        readonly patch: operations["agents.update"];
        readonly trace?: never;
    };
    readonly "/api/agents/:id/chat/stream": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Chat with agent (streaming)
         * @description Stream a chat response from the agent. Supports context engineering for long conversations.
         */
        readonly post: operations["agents.chatStream"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/generate": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Generate agent configuration from description
         * @description Uses AI to generate a complete agent configuration based on a natural language description. Returns a suggested config that can be reviewed and modified before creating the agent.
         */
        readonly post: operations["agents.generate"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/skills": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** List agent skills */
        readonly get: operations["agents.listSkills"];
        readonly put?: never;
        /** Create an agent skill */
        readonly post: operations["agents.createSkill"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/agents/skills/:id": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        readonly post?: never;
        /** Delete an agent skill */
        readonly delete: operations["agents.deleteSkill"];
        readonly options?: never;
        readonly head?: never;
        /** Update an agent skill */
        readonly patch: operations["agents.updateSkill"];
        readonly trace?: never;
    };
    readonly "/api/chat": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /** Chat with RAG agent */
        readonly post: operations["chat.send"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/chat/stream": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /** Chat with streaming response */
        readonly post: operations["chat.stream"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/chat/stream/progressive": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /** Chat with progressive streaming response */
        readonly post: operations["chat.streamProgressive"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * List all collections
         * @description Lists organization's collections. Pro+ users can include shared/public collections with includeShared=true or includePublic=true.
         */
        readonly get: operations["collections.list"];
        readonly put?: never;
        /** Create a new collection */
        readonly post: operations["collections.create"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:collectionId/rag-config": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        /**
         * Update RAG configuration for a collection
         * @description Updates the RAG configuration for the specified collection. Partial updates are supported - only provided fields are updated.
         */
        readonly put: operations["collections.setRagConfig"];
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Get collection by ID */
        readonly get: operations["collections.get"];
        readonly put?: never;
        readonly post?: never;
        /**
         * Delete collection
         * @description Permanently deletes a collection and its related database rows.
         */
        readonly delete: operations["collections.delete"];
        readonly options?: never;
        readonly head?: never;
        /** Update collection */
        readonly patch: operations["collections.update"];
        readonly trace?: never;
    };
    readonly "/api/collections/:id/chunks": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * List chunks in collection
         * @description Returns paginated list of chunks stored in the collection
         */
        readonly get: operations["collections.chunks"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/documents": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get: operations["collections.documents"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/evaluations": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get: operations["evaluations.list"];
        readonly put?: never;
        readonly post: operations["evaluations.create"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/insights": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * Get collection insights
         * @description Returns the auto-generated insights for a collection
         */
        readonly get: operations["collections.insights"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/insights/regenerate": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Regenerate collection insights
         * @description Regenerates the 4 insight reports for a collection
         */
        readonly post: operations["collections.regenerateInsights"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/quality-report": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * Ingestion quality aggregate for a collection
         * @description Rolls up per-document ingestion reports into a collection-level view (extraction methods, OCR stats, chunking strategies, warnings, chunk size distribution). Returns zeros for collections whose documents were ingested before the ingestion_report column landed.
         */
        readonly get: operations["collections.qualityReport"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/search": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * Search chunks in collection
         * @description Performs semantic search on collection chunks with optional explicit filters based on detected schema
         */
        readonly get: operations["collections.search"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/collections/:id/stats": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /**
         * Get collection statistics
         * @description Returns statistics about chunks distribution by source type, content type, and top sources
         */
        readonly get: operations["collections.stats"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/data-chat": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /** Chat across selected collections and live data */
        readonly post: operations["dataChat.send"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/data-chat/precheck": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /** Precheck selected collection and connector compatibility */
        readonly post: operations["dataChat.precheck"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/evaluations/:evaluationId": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get: operations["evaluations.get"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/crawl": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Crawl entire website
         * @description Crawls a website using the crawler service and indexes all pages
         */
        readonly post: operations["ingestion.crawl"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/crawl-selected/async": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Crawl selected pages
         * @description Crawl a specific list of URLs selected by the user after discovery. Returns a job ID for progress tracking.
         */
        readonly post: operations["ingestion.crawlSelectedAsync"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/crawl/async": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Crawl website with progress streaming
         * @description Starts a website crawl and returns immediately with a jobId.
         */
        readonly post: operations["ingestion.crawlAsync"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/dataset": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Ingest Parquet dataset from URL
         * @description Streams a Parquet file from URL (e.g., Hugging Face datasets) and indexes rows. Supports large files via streaming.
         */
        readonly post: operations["ingestion.dataset"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/dataset/async": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Ingest HuggingFace dataset with progress streaming
         * @description Starts dataset ingestion and returns immediately with a jobId.
         */
        readonly post: operations["ingestion.datasetAsync"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/discover": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Discover pages on a website
         * @description Discover all pages on a website without extracting content. Returns a list of URLs the user can select from before crawling.
         */
        readonly post: operations["ingestion.discover"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/document": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Ingest text document
         * @description Indexes raw text content as a document
         */
        readonly post: operations["ingestion.document"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/file": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Ingest file (PDF, DOCX, etc.)
         * @description Uploads and indexes a file. Set enableMultimodal=true to use Jina CLIP v2 for cross-modal search (Pro+ plans only).
         */
        readonly post: operations["ingestion.file"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/file/async": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Ingest file with progress streaming
         * @description Uploads a file and returns immediately with a jobId. Use the SSE endpoint to track progress. Set enableMultimodal=true for cross-modal search (Pro+ plans only).
         */
        readonly post: operations["ingestion.fileAsync"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/ingest/url": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Ingest content from URL
         * @description Scrapes a URL using the crawler service and indexes the content
         */
        readonly post: operations["ingestion.url"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/public-collections": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** List public collections eligible for the consumer's plan */
        readonly get: operations["collections.listPublic"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/public-collections/{slug}": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Resolve a single public collection by slug */
        readonly get: operations["collections.getPublic"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/workflows": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** List all workflows */
        readonly get: operations["workflows.list"];
        readonly put?: never;
        /** Create a new workflow */
        readonly post: operations["workflows.create"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/workflows/:id": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Get workflow by ID */
        readonly get: operations["workflows.get"];
        readonly put?: never;
        readonly post?: never;
        /**
         * Delete workflow
         * @description Permanently deletes a workflow and cascades related rows where configured.
         */
        readonly delete: operations["workflows.delete"];
        readonly options?: never;
        readonly head?: never;
        /** Update workflow */
        readonly patch: operations["workflows.update"];
        readonly trace?: never;
    };
    readonly "/api/workflows/:id/execute": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Execute workflow
         * @description Starts executing a workflow and returns the result
         */
        readonly post: operations["workflows.execute"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/workflows/:id/executions": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** List workflow executions */
        readonly get: operations["workflows.listExecutions"];
        readonly put?: never;
        readonly post?: never;
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/workflows/:id/validate": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly get?: never;
        readonly put?: never;
        /**
         * Validate workflow
         * @description Validates the workflow graph structure and connections
         */
        readonly post: operations["workflows.validate"];
        readonly delete?: never;
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
    readonly "/api/workflows/executions/:executionId": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        /** Get execution details */
        readonly get: operations["workflows.getExecution"];
        readonly put?: never;
        readonly post?: never;
        /** Cancel execution */
        readonly delete: operations["workflows.cancelExecution"];
        readonly options?: never;
        readonly head?: never;
        readonly patch?: never;
        readonly trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        readonly Agent: {
            readonly collectionId: string | null;
            readonly collectionName?: string | null;
            readonly contextWindowSize: number;
            readonly createdAt: string;
            readonly description: string | null;
            readonly enableContextEngineering: boolean;
            readonly enabledBuiltinTools: readonly components["schemas"]["BuiltinToolConfig"][] | null;
            readonly fallbackLlmConfigId?: string | null;
            /** Format: uuid */
            readonly id: string;
            readonly instructions: string | null;
            readonly isActive: boolean;
            readonly llmConfigId: string | null;
            readonly maxTokens: number;
            readonly mcpServers: readonly components["schemas"]["McpServer"][] | null;
            readonly model: string;
            readonly name: string;
            readonly openWebuiEnabled: boolean;
            readonly resources: readonly components["schemas"]["AgentResource"][];
            readonly scoreThreshold: number;
            readonly skillIds: readonly string[];
            readonly subAgentIds: readonly string[] | null;
            readonly systemPrompt: string | null;
            readonly temperature: number;
            readonly topK: number;
            readonly updatedAt: string;
            readonly workflowToolIds: readonly string[];
        };
        readonly AgentChatRequest: {
            readonly attachments?: components["schemas"]["ChatAttachments"];
            /**
             * @description Research depth: 'quick' for instant RAG, 'deep' for full deep research
             * @default quick
             * @enum {string}
             */
            readonly depth: "quick" | "deep";
            /** @description Recent chat history (used if context engineering is disabled) */
            readonly history?: readonly {
                readonly content: string;
                /** @enum {string} */
                readonly role: "user" | "assistant";
            }[];
            readonly query: string;
            /**
             * @description Unique session ID for conversation continuity
             * @example session_abc123
             */
            readonly sessionId: string;
        };
        readonly AgentResource: {
            /** Format: uuid */
            readonly id: string;
            readonly name?: string | null;
            /** @default 0 */
            readonly priority: number;
            /** @enum {string} */
            readonly type: "collection" | "data_connector";
        };
        readonly AgentSkill: {
            readonly builtinTools: readonly components["schemas"]["BuiltinToolConfig"][] | null;
            readonly constraints: string | null;
            readonly createdAt: string;
            readonly createdByUserId: string | null;
            readonly description: string | null;
            readonly examples: readonly components["schemas"]["AgentSkillExample"][] | null;
            /** Format: uuid */
            readonly id: string;
            readonly instructions: string | null;
            readonly mcpServerRefs: readonly string[] | null;
            readonly name: string;
            readonly status: components["schemas"]["AgentSkillStatus"];
            readonly updatedAt: string;
            readonly workflowToolRefs: readonly string[] | null;
        };
        readonly AgentSkillExample: {
            readonly input?: string;
            readonly notes?: string;
            readonly output?: string;
        };
        /** @enum {string} */
        readonly AgentSkillStatus: "draft" | "published" | "archived";
        readonly BuiltinToolConfig: string | {
            readonly humanInTheLoop?: boolean;
            readonly id: string;
        };
        /** @description MCP prompts and resources to inject into the chat context */
        readonly ChatAttachments: {
            readonly prompts?: readonly components["schemas"]["PromptAttachment"][];
            readonly resources?: readonly components["schemas"]["ResourceAttachment"][];
        };
        readonly ChatErrorResponse: {
            readonly error: string;
        };
        readonly ChatRequest: {
            readonly collectionId: string;
            readonly filters?: readonly components["schemas"]["FilterDefinition"][];
            readonly history?: readonly components["schemas"]["Message"][];
            /** @default true */
            readonly includeImages: boolean;
            readonly llmConfigId?: string;
            readonly query: string;
        };
        readonly ChatResponse: {
            readonly answer: string;
            readonly featuresUsed?: readonly string[];
            readonly images?: readonly components["schemas"]["ImageResult"][];
            readonly model?: string;
            readonly pipelineMetrics?: components["schemas"]["PipelineMetrics"];
            readonly relevanceScore?: number;
            readonly sources: readonly components["schemas"]["Source"][];
            readonly usage?: {
                readonly completionTokens: number;
                readonly promptTokens: number;
            };
        };
        readonly Chunk: {
            readonly blobPath?: string;
            readonly chunkIndex?: number;
            readonly content: string;
            readonly createdAt?: string;
            readonly documentId?: string;
            readonly entities?: readonly {
                readonly confidence: number;
                /** @enum {string} */
                readonly type: "person" | "organization" | "location" | "date" | "money" | "percent" | "product" | "event";
                readonly value: string;
            }[];
            readonly id: string;
            readonly imageIndex?: number;
            readonly mimeType?: string;
            readonly pageNumber?: number;
            readonly signedUrl?: string;
            readonly source: string;
            /** @enum {string} */
            readonly sourceType: "document" | "web" | "dataset";
            readonly summary?: string;
            readonly tags?: readonly string[];
            readonly title?: string;
            /** @enum {string} */
            readonly type: "text" | "image";
        };
        readonly ChunksList: {
            readonly chunks: readonly components["schemas"]["Chunk"][];
            readonly hasMore: boolean;
            readonly limit: number;
            readonly offset: number;
            readonly total: number;
        };
        readonly Collection: {
            /**
             * @description How the caller can access this collection. Public/shared collections may be read-only for consumers.
             * @enum {string}
             */
            readonly accessTier?: "owner" | "shared" | "public-free" | "public-gated";
            readonly createdAt: string;
            /** @default false */
            readonly createdByAdmin: boolean;
            readonly description: string | null;
            readonly documentCount: number;
            /** @description Embedding model configuration for this collection, null if not yet ingested */
            readonly embeddingConfig?: {
                readonly dimensions: number;
                readonly model: string;
                readonly provider: string;
            } | null;
            /** @description Whether this collection has multimodal embeddings enabled */
            readonly hasMultimodalEmbeddings?: boolean;
            readonly id: string;
            /** @description Total number of images indexed (multimodal collections only) */
            readonly imagesCount?: number;
            readonly isReadOnly?: boolean;
            /** @description Whether this is an admin-managed public collection */
            readonly isSystemCollection?: boolean;
            readonly name: string;
            /** @description Owning organization id when this response represents a shared/public collection consumed by another scope. */
            readonly publisherOrgId?: string | null;
            /**
             * @description Minimum plan ID required to query this public collection (null = free-for-all). Used for pro/scale-gated datasets.
             * @enum {string|null}
             */
            readonly requiredPlanId?: "pro" | "scale" | "enterprise" | null;
            /** @description URL-safe identifier for public collections (e.g., 'code-du-travail'). Unique across all public collections. */
            readonly slug?: string | null;
            /** @description Source identifier for public collections (e.g., 'legifrance', 'insee-sirene') */
            readonly sourceDataset?: string | null;
            readonly storageBytes: number;
            /**
             * @default private
             * @enum {string}
             */
            readonly visibility: "private" | "shared" | "public";
        };
        readonly CollectionDocument: {
            readonly chunksCount: number;
            readonly createdAt: string;
            readonly embeddingModel: string | null;
            readonly filename: string;
            readonly hasMultimodalEmbeddings: boolean;
            readonly id: string;
            readonly imagesCount: number;
            readonly ingestionReport: components["schemas"]["CollectionDocumentIngestionReport"];
            readonly sourceType: string;
            readonly sourceUrl: string | null;
            readonly storageBytes: number;
        };
        readonly CollectionDocumentIngestionReport: {
            readonly chunking: {
                readonly avgChars: number;
                readonly chunksCreated: number;
                readonly maxChars: number;
                readonly minChars: number;
                readonly strategy: string;
                readonly strategyExplanation?: string;
                /** @enum {string} */
                readonly strategyReason?: "explicit" | "auto" | "default-fallback";
            };
            readonly durations: {
                readonly chunkMs: number;
                readonly embedMs: number;
                readonly extractMs: number;
                readonly totalMs: number;
            };
            readonly embedding: {
                readonly model: string;
                readonly multimodal: boolean;
                readonly provider: string;
                readonly vectorDims?: number;
            };
            readonly extraction?: {
                readonly confidence?: number | null;
                readonly engine: string;
                readonly fallbackEngines?: readonly string[];
                readonly layoutBlocks?: number;
            };
            readonly extractionMethod: string;
            readonly images: {
                readonly extracted: number;
                readonly indexed: number;
                readonly skippedTooLarge: number;
            };
            readonly ocr: {
                readonly charsExtracted: number;
                readonly pagesOcrd: number;
                readonly pagesRejected: number;
            } | null;
            readonly pageCount?: number;
            readonly tables: {
                readonly detected: number;
                readonly sheets?: number;
                readonly totalCols?: number;
                readonly totalRows?: number;
            } | null;
            /** @enum {number} */
            readonly version: 1;
            readonly warnings: readonly string[];
        } | null;
        readonly CollectionDocumentsError: {
            readonly error: string;
        };
        readonly CollectionDocumentsResponse: {
            readonly documents: readonly components["schemas"]["CollectionDocument"][];
        };
        readonly CollectionInsights: {
            readonly importantDates: string;
            readonly keyFindings: string;
            readonly mainTopics: string;
            readonly methodology: string;
        };
        readonly CollectionQualityReport: {
            readonly [key: string]: unknown;
        };
        readonly CollectionStats: {
            readonly bySourceType: readonly components["schemas"]["SourceStat"][];
            readonly byType: readonly components["schemas"]["TypeStat"][];
            readonly topSources: readonly components["schemas"]["TopSource"][];
            readonly totalChunks: number;
        };
        readonly CrawlResponse: {
            readonly chunksCount: number;
            readonly embeddingModel?: string;
            readonly imagesCount?: number;
            readonly message: string;
            readonly multimodalEnabled?: boolean;
            readonly pagesCount: number;
            readonly success: boolean;
        };
        readonly CrawlSelectedPagesRequest: {
            readonly collectionId: string;
            /** @description Enable multimodal embeddings (Jina CLIP v2). Requires Pro plan or higher. */
            readonly enableMultimodal?: boolean;
            readonly urls: readonly string[];
        };
        readonly CrawlSiteRequest: {
            /** @example coll_123 */
            readonly collectionId: string;
            /**
             * @description Enable multimodal embeddings (Jina CLIP v2). Requires Pro plan or higher.
             * @example false
             */
            readonly enableMultimodal?: boolean;
            /** @example 3 */
            readonly maxDepth?: number;
            /** @example 100 */
            readonly maxPages?: number;
            /**
             * Format: uri
             * @example https://docs.example.com
             */
            readonly url: string;
        };
        readonly CreateAgentRequest: {
            /** Format: uuid */
            readonly collectionId?: string | null;
            /** @default 10 */
            readonly contextWindowSize: number;
            /** @example Handles customer support queries */
            readonly description?: string;
            /** @default false */
            readonly enableContextEngineering: boolean;
            /**
             * @default [
             *       "web_search",
             *       "current_date",
             *       "calculator"
             *     ]
             */
            readonly enabledBuiltinTools: readonly components["schemas"]["BuiltinToolConfig"][];
            /** Format: uuid */
            readonly fallbackLlmConfigId?: string | null;
            readonly instructions?: string;
            /** Format: uuid */
            readonly llmConfigId?: string | null;
            /** @default 2048 */
            readonly maxTokens: number;
            readonly mcpServers?: readonly components["schemas"]["McpServer"][];
            /** @default gpt-4.1-mini */
            readonly model: string;
            /** @example Support Assistant */
            readonly name: string;
            /** @default false */
            readonly openWebuiEnabled: boolean;
            readonly resources?: readonly {
                /** Format: uuid */
                readonly id: string;
                /** @default 0 */
                readonly priority: number;
                /** @enum {string} */
                readonly type: "collection" | "data_connector";
            }[];
            /** @default 0 */
            readonly scoreThreshold: number;
            /** @default [] */
            readonly skillIds: readonly string[];
            readonly subAgentIds?: readonly string[];
            readonly systemPrompt?: string;
            /** @default 70 */
            readonly temperature: number;
            /** @default 5 */
            readonly topK: number;
            /** @default [] */
            readonly workflowToolIds: readonly string[];
        };
        readonly CreateAgentSkillRequest: {
            /** @default [] */
            readonly builtinTools: readonly components["schemas"]["BuiltinToolConfig"][];
            readonly constraints?: string | null;
            readonly description?: string | null;
            /** @default [] */
            readonly examples: readonly components["schemas"]["AgentSkillExample"][];
            readonly instructions?: string | null;
            /** @default [] */
            readonly mcpServerRefs: readonly string[];
            readonly name: string;
            readonly status?: components["schemas"]["AgentSkillStatus"];
            /** @default [] */
            readonly workflowToolRefs: readonly string[];
        };
        readonly CreateCollectionRequest: {
            /** @example Product documentation */
            readonly description?: string;
            /** @description Optional embedding config ID to override the org default. Must reference a valid embedding config owned by this org/user. */
            readonly embeddingConfigId?: string;
            /** @example Documentation */
            readonly name: string;
            /**
             * @description Plan ID required to query this public collection (e.g. 'pro', 'scale'). Only admins can set.
             * @example pro
             * @enum {string}
             */
            readonly requiredPlanId?: "pro" | "scale" | "enterprise";
            /**
             * @description URL-safe identifier for public collections. Only admins can set. Must be globally unique.
             * @example code-du-travail
             */
            readonly slug?: string;
            /**
             * @description Source identifier for public collections. Only used for system collections.
             * @example legifrance
             */
            readonly sourceDataset?: string;
            /**
             * @description Collection visibility. Only admin users can set 'shared' or 'public'. Public collections require Pro+ plan.
             * @default private
             * @example private
             * @enum {string}
             */
            readonly visibility: "private" | "shared" | "public";
        };
        readonly CreatedEvaluation: {
            readonly collectionId: string;
            readonly createdAt: string;
            readonly id: string;
            readonly notifyEmail: string | null;
            readonly numQuestions: number;
            readonly parentEvaluationId: string | null;
            readonly status: string;
        };
        readonly CreateEvaluationRequest: {
            readonly goldenSet?: readonly {
                readonly expectedAnswer?: string;
                readonly expectedKeywords?: readonly string[];
                readonly query: string;
            }[];
            readonly inheritFromEvaluationId?: string;
            /** Format: email */
            readonly notifyEmail?: string;
            readonly numQuestions?: number;
            readonly ragConfigOverride?: {
                readonly [key: string]: unknown;
            };
        };
        readonly CreateWorkflowRequest: {
            readonly defaultCollectionId?: string;
            readonly description?: string;
            readonly graph?: {
                readonly edges: readonly {
                    readonly animated?: boolean;
                    readonly data?: {
                        readonly [key: string]: unknown;
                    };
                    readonly id: string;
                    readonly label?: string;
                    readonly source: string;
                    readonly sourceHandle?: string;
                    readonly target: string;
                    readonly targetHandle?: string;
                    readonly type?: string;
                }[];
                readonly nodes: readonly {
                    readonly data: {
                        readonly config: {
                            readonly [key: string]: unknown;
                        };
                        readonly label: string;
                    };
                    readonly height?: number;
                    readonly id: string;
                    readonly position: {
                        readonly x: number;
                        readonly y: number;
                    };
                    readonly type: string;
                    readonly width?: number;
                }[];
                readonly viewport?: {
                    readonly x: number;
                    readonly y: number;
                    readonly zoom: number;
                };
            };
            readonly name: string;
            readonly variables?: readonly {
                readonly defaultValue?: unknown;
                readonly description?: string;
                readonly name: string;
                readonly required?: boolean;
                /** @enum {string} */
                readonly type: "string" | "number" | "boolean" | "object" | "array" | "any" | "message" | "messages" | "documents" | "embedding";
            }[];
        };
        readonly DiscoveredPage: {
            readonly depth: number;
            readonly path: string;
            readonly title: string | null;
            readonly url: string;
        };
        readonly DiscoverResponse: {
            readonly duration: number;
            readonly pages: readonly components["schemas"]["DiscoveredPage"][];
            readonly success: boolean;
            readonly totalFound: number;
        };
        readonly DiscoverSiteRequest: {
            readonly excludePatterns?: readonly string[];
            readonly includePatterns?: readonly string[];
            readonly maxDepth?: number;
            readonly maxPages?: number;
            /** Format: uri */
            readonly url: string;
        };
        readonly Error: {
            /** @enum {string} */
            readonly accessTier?: "owner" | "shared" | "public-free" | "public-gated";
            readonly code?: string;
            readonly collectionId?: string;
            readonly details?: {
                readonly [key: string]: unknown;
            };
            readonly error: string;
            readonly publisherOrgId?: string | null;
            /** @enum {string|null} */
            readonly requiredPlanId?: "pro" | "scale" | "enterprise" | null;
            readonly status?: number;
        };
        readonly ErrorResponse: {
            readonly error: string;
            readonly success: boolean;
        };
        readonly EvaluationConflict: {
            readonly error: string;
            readonly evaluationId: string;
            readonly status: string;
        };
        readonly EvaluationDetail: {
            readonly collectionId: string;
            readonly completedAt: string | unknown;
            readonly createdAt: string;
            readonly error: string | null;
            readonly id: string;
            readonly numQuestions: number;
            readonly parentEvaluationId: string | null;
            readonly progress: {
                readonly current: number;
                /** @enum {string} */
                readonly phase: "generating" | "running" | "judging";
                readonly total: number;
            } | null;
            readonly result?: unknown;
            readonly startedAt: string | unknown;
            readonly status: string;
        };
        readonly EvaluationDetailError: {
            readonly error: string;
        };
        readonly EvaluationError: {
            readonly error: string;
        };
        readonly EvaluationSummary: {
            readonly avgJudgeOverall: number | null;
            readonly completedAt: string | unknown;
            readonly createdAt: string;
            readonly error: string | null;
            readonly id: string;
            readonly numQuestions: number;
            readonly parentEvaluationId: string | null;
            readonly progress?: unknown;
            readonly ragConfigOverride?: unknown;
            readonly retrievalHitRate: number | null;
            readonly score: number | null;
            readonly startedAt: string | unknown;
            readonly status: string;
        };
        readonly ExecuteRequest: {
            readonly input?: {
                readonly [key: string]: unknown;
            };
        };
        readonly Execution: {
            readonly completedAt: string | null;
            readonly createdAt: string;
            readonly error: string | null;
            readonly id: string;
            readonly input?: unknown;
            readonly nodeStates: {
                readonly [key: string]: unknown;
            } | null;
            readonly output?: unknown;
            readonly startedAt: string | null;
            /** @enum {string} */
            readonly status: "pending" | "running" | "pending_approval" | "completed" | "failed" | "cancelled";
            readonly triggeredBy: string | null;
            readonly workflowId: string;
        };
        readonly ExecutionResult: {
            readonly error?: string;
            readonly executionId: string;
            readonly output?: unknown;
            /** @enum {string} */
            readonly status: "pending" | "running" | "pending_approval" | "completed" | "failed" | "cancelled";
        };
        readonly FilterDefinition: {
            readonly field: string;
            /** @enum {string} */
            readonly operator: "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "between" | "exists";
            readonly value: string | number | boolean | readonly (string | number)[] | {
                readonly from: number;
                readonly to: number;
            };
        };
        readonly GenerateAgentRequest: {
            /**
             * Format: uuid
             * @description Optional collection ID for RAG capabilities
             */
            readonly collectionId?: string | null;
            /** @example I need an assistant that helps customers with technical support for a SaaS product. It should be friendly, professional, and know how to troubleshoot common issues. */
            readonly description: string;
            /**
             * @description Target language (en, fr, es, etc.)
             * @default en
             * @example en
             */
            readonly language: string;
        };
        readonly GeneratedAgentConfig: {
            readonly description: string | null;
            readonly instructions: string | null;
            readonly maxTokens: number;
            readonly model: string;
            readonly name: string;
            readonly scoreThreshold: number;
            readonly suggestedTools?: readonly {
                readonly description: string;
                readonly name: string;
            }[];
            readonly systemPrompt: string;
            readonly temperature: number;
            readonly topK: number;
        };
        readonly HybridSearchConfig: {
            readonly alpha?: number;
            readonly bm25?: {
                readonly b?: number;
                readonly k1?: number;
            };
            readonly rrf?: {
                readonly k?: number;
            };
        };
        readonly ImageResult: {
            readonly imageIndex?: number;
            readonly mimeType?: string;
            readonly pageNumber?: number;
            readonly score: number;
            readonly signedUrl?: string;
            readonly source: string;
        };
        readonly IngestDatasetRequest: {
            /** @example coll_123 */
            readonly collectionId: string;
            /**
             * @description Dataset config/subset name
             * @example default
             */
            readonly config?: string;
            /**
             * @description Hugging Face dataset ID (e.g., 'squad', 'username/dataset')
             * @example squad
             */
            readonly datasetId: string;
            /**
             * @description Enable multimodal embeddings (Jina CLIP v2). Extracts and indexes images from image columns. Requires Pro plan or higher.
             * @example false
             */
            readonly enableMultimodal?: boolean;
            /**
             * @description Maximum number of rows to ingest (max 1M)
             * @example 10000
             */
            readonly limit?: number;
            /**
             * @description Dataset split (train, test, validation)
             * @example train
             */
            readonly split?: string;
        };
        readonly IngestDocumentRequest: {
            /** @example coll_123 */
            readonly collectionId: string;
            /** @example Document content here... */
            readonly content: string;
            /** @example manual.txt */
            readonly filename: string;
        };
        readonly IngestResponse: {
            readonly chunksCount: number;
            readonly documentId?: string;
            readonly embeddingModel?: string;
            readonly imagesCount?: number;
            readonly message: string;
            readonly multimodalEnabled?: boolean;
            readonly success: boolean;
        };
        readonly IngestUrlRequest: {
            /** @example coll_123 */
            readonly collectionId: string;
            /**
             * @description Enable multimodal embeddings (Jina CLIP v2). Requires Pro plan or higher.
             * @example false
             */
            readonly enableMultimodal?: boolean;
            /**
             * Format: uri
             * @example https://example.com/page
             */
            readonly url: string;
        };
        readonly LLMConfigSchema: {
            /** @enum {string} */
            readonly citationFormat?: "brackets" | "footnote" | "inline";
        };
        readonly McpServer: {
            readonly description?: string;
            readonly name: string;
            readonly token?: string;
            readonly toolPolicies?: {
                readonly [key: string]: {
                    readonly humanInTheLoop?: boolean;
                };
            };
            /** Format: uri */
            readonly url: string;
        };
        readonly Message: {
            readonly content: string;
            /** @enum {string} */
            readonly role: "user" | "assistant";
        };
        readonly PipelineMetrics: {
            readonly bm25IndexSize?: number;
            readonly queryEnhancementMs: number;
            readonly rerankMs: number;
            readonly resultsCount: number;
            readonly searchMs: number;
            readonly totalTimeMs: number;
        };
        readonly PromptAttachment: {
            readonly arguments?: {
                readonly [key: string]: string;
            };
            readonly name: string;
            readonly server: string;
        };
        readonly PublicCollectionDetail: components["schemas"]["PublicCollectionSummary"] & {
            readonly sampleQueries: readonly string[];
            readonly tags: readonly string[];
        };
        readonly PublicCollectionError: {
            readonly code: string;
            readonly error: string;
        };
        readonly PublicCollectionPublisher: {
            readonly isSystem: boolean;
            readonly name: string;
        };
        readonly PublicCollectionSummary: {
            readonly accessible: boolean;
            readonly description: string | null;
            readonly documentCount: number;
            readonly id: string;
            readonly name: string;
            readonly publisher: components["schemas"]["PublicCollectionPublisher"];
            /** @enum {string|null} */
            readonly requiredPlanId: "pro" | "scale" | "enterprise" | null;
            readonly slug: string;
            /** Format: date-time */
            readonly updatedAt: string;
        };
        readonly RAGConfigErrorResponse: {
            readonly error: string;
        };
        readonly RAGConfigInput: {
            readonly features?: components["schemas"]["RAGFeatures"];
            readonly hybridSearch?: components["schemas"]["HybridSearchConfig"];
            readonly llm?: components["schemas"]["LLMConfigSchema"];
            readonly reranking?: components["schemas"]["RerankingConfig"];
            readonly retrieval?: components["schemas"]["RetrievalConfig"];
        };
        readonly RAGConfigResponse: {
            readonly features: {
                readonly citations: boolean;
                readonly contextualRetrieval: boolean;
                readonly dynamicFeatureSelection: boolean;
                readonly hybridSearch: boolean;
                readonly hyde: boolean;
                readonly multiQuery: boolean;
                readonly parallelEnhancement: boolean;
                readonly queryExpansion: boolean;
                readonly queryRewriting: boolean;
                readonly reranking: boolean;
                readonly selfQuery: boolean;
            };
            readonly hybridSearch: {
                readonly alpha: number;
                readonly bm25: {
                    readonly b: number;
                    readonly k1: number;
                };
                readonly rrf: {
                    readonly k: number;
                };
            };
            readonly llm: {
                /** @enum {string} */
                readonly citationFormat: "brackets" | "footnote" | "inline";
            };
            readonly reranking: {
                /** @enum {string} */
                readonly provider: "jina" | "llm";
                readonly topN: number;
            };
            readonly retrieval: {
                readonly topK: number;
            };
            /** @enum {number} */
            readonly version: 1;
        };
        readonly RAGFeatures: {
            readonly citations?: boolean;
            readonly contextualRetrieval?: boolean;
            readonly dynamicFeatureSelection?: boolean;
            readonly hybridSearch?: boolean;
            readonly hyde?: boolean;
            readonly multiQuery?: boolean;
            readonly parallelEnhancement?: boolean;
            readonly queryExpansion?: boolean;
            readonly queryRewriting?: boolean;
            readonly reranking?: boolean;
            readonly selfQuery?: boolean;
        };
        readonly RerankingConfig: {
            /** @enum {string} */
            readonly provider?: "jina" | "llm";
            readonly topN?: number;
        };
        readonly ResourceAttachment: {
            readonly server: string;
            readonly uri: string;
        };
        readonly RetrievalConfig: {
            readonly topK?: number;
        };
        readonly SearchResult: {
            readonly blobPath?: string;
            readonly chunkIndex?: number;
            readonly content: string;
            readonly createdAt?: string;
            readonly documentId?: string;
            readonly entities?: readonly {
                readonly confidence: number;
                /** @enum {string} */
                readonly type: "person" | "organization" | "location" | "date" | "money" | "percent" | "product" | "event";
                readonly value: string;
            }[];
            readonly id: string;
            readonly imageIndex?: number;
            readonly mimeType?: string;
            readonly pageNumber?: number;
            readonly score: number;
            readonly signedUrl?: string;
            readonly source: string;
            /** @enum {string} */
            readonly sourceType: "document" | "web" | "dataset";
            readonly summary?: string;
            readonly tags?: readonly string[];
            readonly title?: string;
            /** @enum {string} */
            readonly type: "text" | "image";
        };
        readonly SearchResults: {
            readonly query: string;
            readonly results: readonly components["schemas"]["SearchResult"][];
        };
        readonly Source: {
            readonly content?: string;
            readonly documentUrl?: string;
            readonly imageIndex?: number;
            readonly mimeType?: string;
            readonly pageNumber?: number;
            readonly score: number;
            readonly signedUrl?: string;
            readonly source: string;
            readonly sourceType: string;
            readonly title?: string;
            /** @enum {string} */
            readonly type: "text" | "image";
            readonly url?: string;
        };
        readonly SourceStat: {
            readonly count: number;
            readonly sourceType: string;
        };
        readonly StreamingCrawlRequest: {
            readonly collectionId: string;
            /** @description Enable multimodal embeddings (Jina CLIP v2). Requires Pro plan or higher. */
            readonly enableMultimodal?: boolean;
            readonly maxDepth?: number;
            readonly maxPages?: number;
            /** Format: uri */
            readonly url: string;
        };
        readonly StreamingDatasetRequest: {
            readonly collectionId: string;
            readonly config?: string;
            readonly datasetId: string;
            readonly limit?: number;
            readonly split?: string;
        };
        readonly StreamingErrorResponse: {
            readonly error: string;
            readonly success: boolean;
        };
        readonly StreamingIngestResponse: {
            readonly jobId: string;
            readonly message: string;
            readonly success: boolean;
        };
        readonly TopSource: {
            readonly count: number;
            readonly source: string;
            readonly title?: string;
        };
        readonly TypeStat: {
            readonly count: number;
            readonly type: string;
        };
        readonly UpdateAgentRequest: {
            /** Format: uuid */
            readonly collectionId?: string | null;
            readonly contextWindowSize?: number;
            readonly description?: string | null;
            readonly enableContextEngineering?: boolean;
            readonly enabledBuiltinTools?: readonly components["schemas"]["BuiltinToolConfig"][] | null;
            /** Format: uuid */
            readonly fallbackLlmConfigId?: string | null;
            readonly instructions?: string | null;
            readonly isActive?: boolean;
            /** Format: uuid */
            readonly llmConfigId?: string | null;
            readonly maxTokens?: number;
            readonly mcpServers?: readonly components["schemas"]["McpServer"][] | null;
            readonly model?: string;
            readonly name?: string;
            readonly openWebuiEnabled?: boolean;
            readonly resources?: readonly {
                /** Format: uuid */
                readonly id: string;
                /** @default 0 */
                readonly priority: number;
                /** @enum {string} */
                readonly type: "collection" | "data_connector";
            }[];
            readonly scoreThreshold?: number;
            readonly skillIds?: readonly string[];
            readonly subAgentIds?: readonly string[] | null;
            readonly systemPrompt?: string | null;
            readonly temperature?: number;
            readonly topK?: number;
            readonly workflowToolIds?: readonly string[];
        };
        readonly UpdateAgentSkillRequest: {
            /** @default [] */
            readonly builtinTools: readonly components["schemas"]["BuiltinToolConfig"][];
            readonly constraints?: string | null;
            readonly description?: string | null;
            /** @default [] */
            readonly examples: readonly components["schemas"]["AgentSkillExample"][];
            readonly instructions?: string | null;
            /** @default [] */
            readonly mcpServerRefs: readonly string[];
            readonly name?: string;
            readonly status?: components["schemas"]["AgentSkillStatus"];
            /** @default [] */
            readonly workflowToolRefs: readonly string[];
        };
        readonly UpdateCollectionRequest: {
            /** @enum {string|null} */
            readonly defaultChunkingStrategy?: "default" | "markdown-heading" | "legal-article" | "regulatory-section" | "csv-row-grouped" | "email-thread" | "semantic" | null;
            readonly description?: string;
            readonly name?: string;
        };
        readonly UpdateWorkflowRequest: {
            readonly defaultCollectionId?: string | null;
            readonly description?: string;
            readonly graph?: {
                readonly edges: readonly {
                    readonly animated?: boolean;
                    readonly data?: {
                        readonly [key: string]: unknown;
                    };
                    readonly id: string;
                    readonly label?: string;
                    readonly source: string;
                    readonly sourceHandle?: string;
                    readonly target: string;
                    readonly targetHandle?: string;
                    readonly type?: string;
                }[];
                readonly nodes: readonly {
                    readonly data: {
                        readonly config: {
                            readonly [key: string]: unknown;
                        };
                        readonly label: string;
                    };
                    readonly height?: number;
                    readonly id: string;
                    readonly position: {
                        readonly x: number;
                        readonly y: number;
                    };
                    readonly type: string;
                    readonly width?: number;
                }[];
                readonly viewport?: {
                    readonly x: number;
                    readonly y: number;
                    readonly zoom: number;
                };
            };
            readonly isActive?: boolean;
            readonly name?: string;
            readonly variables?: readonly {
                readonly defaultValue?: unknown;
                readonly description?: string;
                readonly name: string;
                readonly required?: boolean;
                /** @enum {string} */
                readonly type: "string" | "number" | "boolean" | "object" | "array" | "any" | "message" | "messages" | "documents" | "embedding";
            }[];
        };
        readonly ValidationResult: {
            readonly errors: readonly {
                readonly edgeId?: string;
                readonly message: string;
                readonly nodeId?: string;
                readonly type: string;
            }[];
            readonly valid: boolean;
            readonly warnings: readonly {
                readonly message: string;
                readonly nodeId?: string;
                readonly type: string;
            }[];
        };
        readonly Workflow: {
            readonly createdAt: string;
            readonly defaultCollectionId: string | null;
            readonly description: string | null;
            readonly graph: {
                readonly edges: readonly {
                    readonly animated?: boolean;
                    readonly data?: {
                        readonly [key: string]: unknown;
                    };
                    readonly id: string;
                    readonly label?: string;
                    readonly source: string;
                    readonly sourceHandle?: string;
                    readonly target: string;
                    readonly targetHandle?: string;
                    readonly type?: string;
                }[];
                readonly nodes: readonly {
                    readonly data: {
                        readonly config: {
                            readonly [key: string]: unknown;
                        };
                        readonly label: string;
                    };
                    readonly height?: number;
                    readonly id: string;
                    readonly position: {
                        readonly x: number;
                        readonly y: number;
                    };
                    readonly type: string;
                    readonly width?: number;
                }[];
                readonly viewport?: {
                    readonly x: number;
                    readonly y: number;
                    readonly zoom: number;
                };
            };
            readonly id: string;
            readonly isActive: boolean;
            readonly name: string;
            readonly updatedAt: string;
            readonly variables: readonly {
                readonly defaultValue?: unknown;
                readonly description?: string;
                readonly name: string;
                readonly required?: boolean;
                /** @enum {string} */
                readonly type: "string" | "number" | "boolean" | "object" | "array" | "any" | "message" | "messages" | "documents" | "embedding";
            }[] | null;
        };
        readonly WorkflowListItem: {
            readonly createdAt: string;
            readonly description: string | null;
            readonly id: string;
            readonly isActive: boolean;
            readonly lastExecutedAt: string | null;
            readonly lastExecutionStatus: string | null;
            readonly name: string;
            readonly nodeCount: number;
            readonly updatedAt: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    readonly "agents.list": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description List of agents */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": readonly components["schemas"]["Agent"][];
                };
            };
        };
    };
    readonly "agents.create": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CreateAgentRequest"];
            };
        };
        readonly responses: {
            /** @description Agent created */
            readonly 201: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Agent"];
                };
            };
            /** @description Invalid request or collection not found */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Agent limit exceeded */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "deepResearch.cancel": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly agentId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Cancelled */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No active deep research found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    readonly "deepResearch.status": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly agentId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Execution status */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No execution found */
            readonly 204: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    readonly "deepResearch.stream": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly agentId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description SSE stream */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No running execution */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    readonly "agents.get": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Agent details */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Agent"];
                };
            };
            /** @description Agent not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.delete": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Agent deleted */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly permanent: boolean;
                        readonly success: boolean;
                    };
                };
            };
            /** @description Agent not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.update": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["UpdateAgentRequest"];
            };
        };
        readonly responses: {
            /** @description Agent updated */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Agent"];
                };
            };
            /** @description Invalid request or collection not found */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Agent not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.chatStream": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["AgentChatRequest"];
            };
        };
        readonly responses: {
            /** @description SSE stream of chat chunks */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "text/event-stream": string;
                };
            };
            /** @description Agent not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.generate": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["GenerateAgentRequest"];
            };
        };
        readonly responses: {
            /** @description Generated agent configuration */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["GeneratedAgentConfig"];
                };
            };
            /** @description Invalid request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Generation failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.listSkills": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description List of agent skills */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": readonly components["schemas"]["AgentSkill"][];
                };
            };
        };
    };
    readonly "agents.createSkill": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CreateAgentSkillRequest"];
            };
        };
        readonly responses: {
            /** @description Agent skill created */
            readonly 201: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["AgentSkill"];
                };
            };
            /** @description Not allowed */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.deleteSkill": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Agent skill deleted */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly success: boolean;
                    };
                };
            };
            /** @description Not allowed */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "agents.updateSkill": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["UpdateAgentSkillRequest"];
            };
        };
        readonly responses: {
            /** @description Agent skill updated */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["AgentSkill"];
                };
            };
            /** @description Not allowed */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Agent skill not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "chat.send": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["ChatRequest"];
            };
        };
        readonly responses: {
            /** @description Chat response with sources */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ChatResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ChatErrorResponse"];
                };
            };
            /** @description Chat failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ChatErrorResponse"];
                };
            };
        };
    };
    readonly "chat.stream": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["ChatRequest"];
            };
        };
        readonly responses: {
            /** @description SSE stream */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ChatErrorResponse"];
                };
            };
        };
    };
    readonly "chat.streamProgressive": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["ChatRequest"];
            };
        };
        readonly responses: {
            /** @description SSE stream with stage, enhancement, sources, chunk, and metrics events */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ChatErrorResponse"];
                };
            };
        };
    };
    readonly "collections.list": {
        readonly parameters: {
            readonly query?: {
                /** @description Set to 'true' to include public collections (Pro+ plans only) */
                readonly includePublic?: string;
                /** @description Set to 'true' to include shared collections (Pro+ plans only) */
                readonly includeShared?: string;
            };
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description List of collections */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": readonly components["schemas"]["Collection"][];
                };
            };
        };
    };
    readonly "collections.create": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CreateCollectionRequest"];
            };
        };
        readonly responses: {
            /** @description Collection created */
            readonly 201: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Collection"];
                };
            };
            /** @description Invalid request or collection already exists */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.setRagConfig": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly collectionId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["RAGConfigInput"];
            };
        };
        readonly responses: {
            /** @description Updated RAG configuration */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["RAGConfigResponse"];
                };
            };
            /** @description Invalid configuration */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["RAGConfigErrorResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["RAGConfigErrorResponse"];
                };
            };
        };
    };
    readonly "collections.get": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Collection details */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Collection"];
                };
            };
            /** @description Plan does not allow access to this collection */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.delete": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Collection deleted */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly permanent: boolean;
                        readonly success: boolean;
                    };
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.update": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["UpdateCollectionRequest"];
            };
        };
        readonly responses: {
            /** @description Collection updated */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Collection"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.chunks": {
        readonly parameters: {
            readonly query?: {
                readonly limit?: number;
                readonly offset?: number | null;
                readonly sourceType?: "document" | "web" | "dataset";
                readonly type?: "text" | "image";
            };
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Paginated list of chunks */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ChunksList"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.documents": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Collection documents with their ingestion reports */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CollectionDocumentsResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CollectionDocumentsError"];
                };
            };
        };
    };
    readonly "evaluations.list": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Recent evaluation summaries */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly evaluations: readonly components["schemas"]["EvaluationSummary"][];
                    };
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["EvaluationError"];
                };
            };
        };
    };
    readonly "evaluations.create": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CreateEvaluationRequest"];
            };
        };
        readonly responses: {
            /** @description Evaluation queued */
            readonly 201: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CreatedEvaluation"];
                };
            };
            /** @description Invalid evaluation request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["EvaluationError"];
                };
            };
            /** @description Collection or parent evaluation not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["EvaluationError"];
                };
            };
            /** @description An evaluation is already in progress */
            readonly 409: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["EvaluationConflict"];
                };
            };
        };
    };
    readonly "collections.insights": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Collection insights */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CollectionInsights"];
                };
            };
            /** @description Collection or insights not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.regenerateInsights": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Regenerated insights */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CollectionInsights"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Insights generation failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.qualityReport": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Collection quality report */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CollectionQualityReport"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.search": {
        readonly parameters: {
            readonly query: {
                /** @description JSON-encoded array of filter definitions: [{field, operator, value}] */
                readonly filters?: string;
                readonly limit?: number;
                readonly q: string;
                readonly sourceType?: "document" | "web" | "dataset";
                readonly type?: "text" | "image";
            };
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Search results */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["SearchResults"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "collections.stats": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Collection statistics */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CollectionStats"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "dataChat.send": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": {
                    readonly [key: string]: unknown;
                };
            };
        };
        readonly responses: {
            /** @description Successful response */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly [key: string]: unknown;
                    };
                };
            };
            /** @description Invalid request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly code?: string;
                        readonly error: string;
                    };
                };
            };
            /** @description Forbidden, policy denied, or rollout flag disabled */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly code?: string;
                        readonly error: string;
                    };
                };
            };
        };
    };
    readonly "dataChat.precheck": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": {
                    readonly [key: string]: unknown;
                };
            };
        };
        readonly responses: {
            /** @description Successful response */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly [key: string]: unknown;
                    };
                };
            };
            /** @description Invalid request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly code?: string;
                        readonly error: string;
                    };
                };
            };
            /** @description Forbidden, policy denied, or rollout flag disabled */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly code?: string;
                        readonly error: string;
                    };
                };
            };
        };
    };
    readonly "evaluations.get": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly evaluationId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Full evaluation detail including per-question results */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["EvaluationDetail"];
                };
            };
            /** @description Evaluation not found in the active scope */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["EvaluationDetailError"];
                };
            };
        };
    };
    readonly "ingestion.crawl": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CrawlSiteRequest"];
            };
        };
        readonly responses: {
            /** @description Successfully crawled and ingested website */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["CrawlResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Crawl failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.crawlSelectedAsync": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CrawlSelectedPagesRequest"];
            };
        };
        readonly responses: {
            /** @description Crawl started */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingIngestResponse"];
                };
            };
            /** @description Invalid request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Crawl failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.crawlAsync": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["StreamingCrawlRequest"];
            };
        };
        readonly responses: {
            /** @description Crawl started, use SSE endpoint to track progress */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingIngestResponse"];
                };
            };
            /** @description Multimodal feature requires Pro plan */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Internal server error */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.dataset": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["IngestDatasetRequest"];
            };
        };
        readonly responses: {
            /** @description Successfully ingested dataset */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["IngestResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Ingestion failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.datasetAsync": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["StreamingDatasetRequest"];
            };
        };
        readonly responses: {
            /** @description Dataset ingestion started, use SSE endpoint to track progress */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingIngestResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Internal server error */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.discover": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["DiscoverSiteRequest"];
            };
        };
        readonly responses: {
            /** @description Pages discovered */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["DiscoverResponse"];
                };
            };
            /** @description Discovery failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.document": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["IngestDocumentRequest"];
            };
        };
        readonly responses: {
            /** @description Successfully ingested document */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["IngestResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Ingestion failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.file": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "multipart/form-data": {
                    readonly collectionId: string;
                    /**
                     * @description Enable multimodal embeddings (Jina CLIP v2). Requires Pro plan or higher. Pass 'true' to enable.
                     * @example true
                     */
                    readonly enableMultimodal?: string;
                    /** Format: binary */
                    readonly file?: string;
                    /**
                     * @description Ingestion mode: 'documents' (default), 'tabular', or 'web'
                     * @example documents
                     */
                    readonly mode?: string;
                };
            };
        };
        readonly responses: {
            /** @description Successfully ingested file */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["IngestResponse"];
                };
            };
            /** @description No file provided */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Ingestion failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.fileAsync": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "multipart/form-data": {
                    readonly collectionId: string;
                    /**
                     * @description Enable multimodal embeddings (Jina CLIP v2). Requires Pro plan or higher. Pass 'true' to enable.
                     * @example true
                     */
                    readonly enableMultimodal?: string;
                    /** Format: binary */
                    readonly file?: string;
                };
            };
        };
        readonly responses: {
            /** @description Job started, use SSE endpoint to track progress */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingIngestResponse"];
                };
            };
            /** @description No file provided */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Multimodal feature requires Pro plan */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
            /** @description Internal server error */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["StreamingErrorResponse"];
                };
            };
        };
    };
    readonly "ingestion.url": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["IngestUrlRequest"];
            };
        };
        readonly responses: {
            /** @description Successfully ingested URL content */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["IngestResponse"];
                };
            };
            /** @description Invalid request body */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Collection not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Ingestion failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    readonly "collections.listPublic": {
        readonly parameters: {
            readonly query?: {
                readonly minTier?: "pro" | "scale" | "enterprise";
                readonly q?: string;
            };
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description List of public collections */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly items: readonly components["schemas"]["PublicCollectionSummary"][];
                    };
                };
            };
        };
    };
    readonly "collections.getPublic": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly slug: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Public collection metadata */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["PublicCollectionDetail"];
                };
            };
            /** @description No public collection at this slug */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["PublicCollectionError"];
                };
            };
        };
    };
    readonly "workflows.list": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description List of workflows */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": readonly components["schemas"]["WorkflowListItem"][];
                };
            };
        };
    };
    readonly "workflows.create": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path?: never;
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["CreateWorkflowRequest"];
            };
        };
        readonly responses: {
            /** @description Workflow created */
            readonly 201: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Workflow"];
                };
            };
            /** @description Invalid request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Feature not available on plan */
            readonly 403: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.get": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Workflow details */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Workflow"];
                };
            };
            /** @description Workflow not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.delete": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Workflow deleted */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly permanent: boolean;
                        readonly success: boolean;
                    };
                };
            };
            /** @description Workflow not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.update": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["UpdateWorkflowRequest"];
            };
        };
        readonly responses: {
            /** @description Workflow updated */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Workflow"];
                };
            };
            /** @description Invalid request */
            readonly 400: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Workflow not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.execute": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: {
            readonly content: {
                readonly "application/json": components["schemas"]["ExecuteRequest"];
            };
        };
        readonly responses: {
            /** @description Execution result */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ExecutionResult"];
                };
            };
            /** @description Workflow not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
            /** @description Execution failed */
            readonly 500: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.listExecutions": {
        readonly parameters: {
            readonly query?: {
                readonly limit?: number;
            };
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description List of executions */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": readonly components["schemas"]["Execution"][];
                };
            };
        };
    };
    readonly "workflows.validate": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly id: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Validation result */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["ValidationResult"];
                };
            };
            /** @description Workflow not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.getExecution": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly executionId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Execution details */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Execution"];
                };
            };
            /** @description Execution not found */
            readonly 404: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    readonly "workflows.cancelExecution": {
        readonly parameters: {
            readonly query?: never;
            readonly header?: never;
            readonly path: {
                readonly executionId: string;
            };
            readonly cookie?: never;
        };
        readonly requestBody?: never;
        readonly responses: {
            /** @description Cancellation result */
            readonly 200: {
                headers: {
                    readonly [name: string]: unknown;
                };
                content: {
                    readonly "application/json": {
                        readonly cancelled: boolean;
                    };
                };
            };
        };
    };
}
