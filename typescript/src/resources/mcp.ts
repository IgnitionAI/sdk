import type { BaseClient } from "../client.js";
import type {
  McpPrompt,
  McpResource,
  McpPromptContent,
  McpResourceContent,
  McpTestResult,
} from "../types.js";

/**
 * @deprecated MCP lifecycle and execution remain deployment-owned. This
 * compatibility surface is retained for 0.2.x consumers but is not part of
 * the recommended public SDK API.
 */
export class Mcp {
  constructor(private client: BaseClient) {}

  async prompts(agentId: string): Promise<McpPrompt[]> {
    return this.client.request<McpPrompt[]>(
      "GET",
      `/agents/${agentId}/mcp/prompts`
    );
  }

  async resources(agentId: string): Promise<McpResource[]> {
    return this.client.request<McpResource[]>(
      "GET",
      `/agents/${agentId}/mcp/resources`
    );
  }

  async getPrompt(
    agentId: string,
    params: { server: string; name: string; arguments?: Record<string, string> }
  ): Promise<McpPromptContent> {
    return this.client.request<McpPromptContent>(
      "POST",
      `/agents/${agentId}/mcp/prompts/get`,
      { body: JSON.stringify(params) }
    );
  }

  async readResource(
    agentId: string,
    params: { server: string; uri: string }
  ): Promise<McpResourceContent> {
    return this.client.request<McpResourceContent>(
      "POST",
      `/agents/${agentId}/mcp/resources/read`,
      { body: JSON.stringify(params) }
    );
  }

  async testServer(params: {
    url: string;
    token?: string;
  }): Promise<McpTestResult> {
    return this.client.request<McpTestResult>("POST", "/agents/test-mcp", {
      body: JSON.stringify(params),
    });
  }
}
