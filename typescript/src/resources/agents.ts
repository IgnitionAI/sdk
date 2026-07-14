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
} from "../types.js";

export class Agents {
  constructor(private client: BaseClient) {}

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
