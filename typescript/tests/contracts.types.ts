import type {
  AgentCreateParams,
  CollectionCreateParams,
  CollectionServedSource,
  ManagedAgentCreateParams,
  ManagedAgentUpdateParams,
  ManagedChatParams,
  ManagedWidgetCreateParams,
  WidgetCreateParams,
} from "../src/index.js";
import { IgnitionAI } from "../src/index.js";

declare const client: IgnitionAI;

const managedChat: ManagedChatParams = {
  collectionId: "collection-id",
  query: "Question",
  maximumMilliCredits: "1000",
};
void client.chat.managed.send(managedChat);
void client.chat.managed.stream(managedChat);
void client.chat.managed.streamProgressive(managedChat);

// @ts-expect-error Managed SaaS chat cannot select a model.
const managedChatWithModel: ManagedChatParams = { collectionId: "collection-id", query: "Question", model: "private" };
// @ts-expect-error Managed SaaS chat cannot select an LLM configuration.
const managedChatWithConfig: ManagedChatParams = { collectionId: "collection-id", query: "Question", llmConfigId: "private" };
void managedChatWithModel;
void managedChatWithConfig;

const managedAgent: ManagedAgentCreateParams = { name: "Support", systemPrompt: "Help" };
void client.agents.managed.create(managedAgent);
const managedAgentUpdate: ManagedAgentUpdateParams = { isActive: false };
void client.agents.managed.update("agent-id", managedAgentUpdate);
// @ts-expect-error Managed agent activation state must be boolean.
const managedAgentUpdateWithInvalidState: ManagedAgentUpdateParams = { isActive: "false" };
void managedAgentUpdateWithInvalidState;
// @ts-expect-error Managed agent activation can only change through update.
const managedAgentCreateWithState: ManagedAgentCreateParams = { name: "Support", isActive: false };
void managedAgentCreateWithState;
// @ts-expect-error Managed agent config has no provider/model fields.
const managedAgentWithModel: ManagedAgentCreateParams = { name: "Support", model: "private" };
// @ts-expect-error Managed agent config has no MCP credentials.
const managedAgentWithMcp: ManagedAgentCreateParams = { name: "Support", mcpServers: [{ name: "mcp", url: "https://example.test", token: "private" }] };
void managedAgentWithModel;
void managedAgentWithMcp;

const managedWidget: ManagedWidgetCreateParams = { name: "Support", type: "agent", agentId: "agent-id" };
void client.widgets.managed.create(managedWidget);
// @ts-expect-error Managed widget config has no LLM settings.
const managedWidgetWithModel: ManagedWidgetCreateParams = { name: "Support", type: "agent", llmModel: "private" };
// @ts-expect-error Managed widget config has no secret escalation target.
const managedWidgetWithEscalation: ManagedWidgetCreateParams = { name: "Support", type: "agent", humanEscalation: { type: "webhook", target: "https://example.test/?token=private" } };
void managedWidgetWithModel;
void managedWidgetWithEscalation;

// Existing licensed/self-hosted contracts remain source-compatible.
const licensedAgent = { name: "Licensed", model: "local-model", llmConfigId: "local-config" };
const explicitLicensedAgent: AgentCreateParams = { name: "Licensed", llmConfigId: "local-config", fallbackLlmConfigId: null, runtimeKind: "byok_api" };
const explicitCollection: CollectionCreateParams = { name: "Private documents", embeddingConfigId: "owned-embedding-config" };
void client.collections.create(explicitCollection);
void client.ingest.file({ collectionId: "collection-id", file: new Blob(), ocrMode: "disabled" });
void client.ingest.url({ collectionId: "collection-id", url: "https://example.com/guide" });
void client.ingest.document({ collectionId: "collection-id", content: "note", filename: "note.txt" });
void client.workflows.create({ name: "Inert fixture", isActive: false });
// @ts-expect-error OCR modes follow the canonical enum.
void client.ingest.file({ collectionId: "collection-id", file: new Blob(), ocrMode: "never" });
// @ts-expect-error Collection creation accepts a string identifier, not null.
void client.collections.create({ name: "Invalid selection", embeddingConfigId: null });
void client.agents.create(explicitLicensedAgent);
void client.agents.update("agent-id", { llmConfigId: null, fallbackLlmConfigId: "fallback-config", runtimeKind: "byok_api" });
// @ts-expect-error The public create contract permits only the BYOK runtime.
void client.agents.create({ name: "Forbidden runtime", runtimeKind: "cli_runtime" });
// @ts-expect-error Managed SaaS agents cannot select a private provider config.
void client.agents.managed.create({ name: "Managed", llmConfigId: "private-config" });
const licensedWidget: WidgetCreateParams = { name: "Licensed", type: "agent", llmModel: "local-model" };
void client.agents.create(licensedAgent);
void client.widgets.create(licensedWidget);

const servedSource: CollectionServedSource = { status: "verified_receipt", officialCorpusQualified: false, sourceRevision: "receipt-r1", sourceTimestamp: null, activatedAt: null };
// @ts-expect-error A verified receipt is not a qualification of the official corpus.
const inventedQualification: CollectionServedSource = { ...servedSource, officialCorpusQualified: true };
void servedSource;
void inventedQualification;
