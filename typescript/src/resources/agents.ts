import type { BaseClient } from "../client.js";
import type {
  Agent,
  AgentCreateParams,
  AgentSkill,
  AgentSkillCreateParams,
  AgentSkillUpdateParams,
  AgentUpdateParams,
  AgentGenerateParams,
  AgentGenerateResult,
  ManagedAgent,
  ManagedAgentCreateParams,
  ManagedAgentUpdateParams,
} from "../types.js";
import { presentManagedAgent, serializeManagedAgent } from "./managed-contracts.js";

class ManagedAgents {
  constructor(private readonly client: BaseClient) {}

  async list(): Promise<ManagedAgent[]> {
    const data = await this.client.request<unknown>("GET", "/agents");
    const agents = Array.isArray(data) ? data : Array.isArray((data as { agents?: unknown[] } | null)?.agents)
      ? (data as { agents: unknown[] }).agents : [];
    return agents.map(presentManagedAgent);
  }

  async get(id: string): Promise<ManagedAgent> {
    return presentManagedAgent(await this.client.request<unknown>("GET", `/agents/${encodeURIComponent(id)}`));
  }

  async create(params: ManagedAgentCreateParams): Promise<ManagedAgent> {
    return presentManagedAgent(await this.client.request<unknown>("POST", "/agents", {
      body: serializeManagedAgent(params, true),
    }));
  }

  async update(id: string, params: ManagedAgentUpdateParams): Promise<ManagedAgent> {
    return presentManagedAgent(await this.client.request<unknown>("PATCH", `/agents/${encodeURIComponent(id)}`, {
      body: serializeManagedAgent(params as Record<string, unknown>),
    }));
  }

  async delete(id: string): Promise<{ success: boolean; permanent?: boolean }> {
    const value = await this.client.request<unknown>("DELETE", `/agents/${encodeURIComponent(id)}`);
    const result = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return { success: result.success === true, ...(typeof result.permanent === "boolean" ? { permanent: result.permanent } : {}) };
  }
}

export class Agents {
  readonly managed: ManagedAgents;

  constructor(private client: BaseClient) {
    this.managed = new ManagedAgents(client);
  }

  async list(): Promise<Agent[]> {
    const data = await this.client.request<Agent[] | { agents: Agent[] }>(
      "GET",
      "/agents"
    );
    return Array.isArray(data) ? data : data.agents;
  }

  async get(id: string): Promise<Agent> {
    return this.client.request<Agent>("GET", `/agents/${id}`);
  }

  async create(params: AgentCreateParams): Promise<Agent> {
    return this.client.request<Agent>("POST", "/agents", {
      body: JSON.stringify(params),
    });
  }

  async update(id: string, params: AgentUpdateParams): Promise<Agent> {
    return this.client.request<Agent>("PATCH", `/agents/${id}`, {
      body: JSON.stringify(params),
    });
  }

  async delete(
    id: string,
    force?: boolean
  ): Promise<{ success: boolean; permanent?: boolean }> {
    const query = force ? "?force=true" : "";
    return this.client.request("DELETE", `/agents/${id}${query}`);
  }

  async listSkills(): Promise<AgentSkill[]> {
    return this.client.request<AgentSkill[]>("GET", "/agents/skills");
  }

  async createSkill(params: AgentSkillCreateParams): Promise<AgentSkill> {
    return this.client.request<AgentSkill>("POST", "/agents/skills", {
      body: JSON.stringify(params),
    });
  }

  async updateSkill(
    id: string,
    params: AgentSkillUpdateParams,
  ): Promise<AgentSkill> {
    return this.client.request<AgentSkill>("PATCH", `/agents/skills/${id}`, {
      body: JSON.stringify(params),
    });
  }

  async deleteSkill(id: string): Promise<{ success: boolean }> {
    return this.client.request("DELETE", `/agents/skills/${id}`);
  }

  async generate(params: AgentGenerateParams): Promise<AgentGenerateResult> {
    return this.client.request<AgentGenerateResult>(
      "POST",
      "/agents/generate",
      { body: JSON.stringify(params) }
    );
  }
}
