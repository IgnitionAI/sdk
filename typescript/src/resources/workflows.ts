import type { BaseClient } from "../client.js";
import type {
  Workflow,
  WorkflowCreateParams,
  WorkflowExecution,
  WorkflowExecutionResult,
  WorkflowListItem,
  WorkflowUpdateParams,
  WorkflowValidationResult,
} from "../types.js";

export class Workflows {
  constructor(private readonly client: BaseClient) {}

  async list(): Promise<WorkflowListItem[]> {
    return this.client.request<WorkflowListItem[]>("GET", "/workflows");
  }

  async get(id: string): Promise<Workflow> {
    return this.client.request<Workflow>("GET", `/workflows/${id}`);
  }

  async create(params: WorkflowCreateParams): Promise<Workflow> {
    return this.client.request<Workflow>("POST", "/workflows", {
      body: JSON.stringify(params),
    });
  }

  async update(id: string, params: WorkflowUpdateParams): Promise<Workflow> {
    return this.client.request<Workflow>("PATCH", `/workflows/${id}`, {
      body: JSON.stringify(params),
    });
  }

  async delete(id: string): Promise<{ success: boolean; permanent: boolean }> {
    return this.client.request("DELETE", `/workflows/${id}`);
  }

  async validate(id: string): Promise<WorkflowValidationResult> {
    return this.client.request<WorkflowValidationResult>(
      "POST",
      `/workflows/${id}/validate`,
      { body: "{}" },
    );
  }

  async execute(
    id: string,
    params: { input?: Record<string, unknown> } = {},
  ): Promise<WorkflowExecutionResult> {
    return this.client.request<WorkflowExecutionResult>(
      "POST",
      `/workflows/${id}/execute`,
      { body: JSON.stringify(params) },
    );
  }

  async listExecutions(
    workflowId: string,
    options: { limit?: number } = {},
  ): Promise<WorkflowExecution[]> {
    const query = options.limit === undefined ? "" : `?limit=${options.limit}`;
    return this.client.request<WorkflowExecution[]>(
      "GET",
      `/workflows/${workflowId}/executions${query}`,
    );
  }

  async getExecution(executionId: string): Promise<WorkflowExecution> {
    return this.client.request<WorkflowExecution>(
      "GET",
      `/workflows/executions/${executionId}`,
    );
  }

  /** Cancels the remote execution. Aborting an HTTP request does not call this method. */
  async cancelExecution(executionId: string): Promise<{ success: boolean }> {
    return this.client.request(
      "DELETE",
      `/workflows/executions/${executionId}`,
    );
  }
}
