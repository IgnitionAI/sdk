import type { BaseClient } from "../client.js";
import type {
  WidgetAnalytics,
  WidgetConfig,
  WidgetCreateParams,
  WidgetCreateResult,
  WidgetKeyResult,
  WidgetUpdateParams,
  ManagedWidgetConfig,
  ManagedWidgetCreateParams,
  ManagedWidgetUpdateParams,
  ManagedWidgetCreateResult,
} from "../types.js";
import { managedWidgetContracts } from "./managed-contracts.js";

class ManagedWidgets {
  constructor(private readonly client: BaseClient) {}

  async list(): Promise<ManagedWidgetConfig[]> {
    const data = await this.client.request<unknown>("GET", "/widgets");
    const widgets = data && typeof data === "object" && Array.isArray((data as { widgets?: unknown[] }).widgets)
      ? (data as { widgets: unknown[] }).widgets : [];
    return widgets.map(managedWidgetContracts.present);
  }

  async get(id: string): Promise<ManagedWidgetConfig> {
    return managedWidgetContracts.present(await this.client.request<unknown>("GET", `/widgets/${encodeURIComponent(id)}`));
  }

  async create(params: ManagedWidgetCreateParams): Promise<ManagedWidgetCreateResult> {
    const value = await this.client.request<unknown>("POST", "/widgets", {
      body: managedWidgetContracts.serializeCreate(params),
    });
    const result = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return {
      widget: managedWidgetContracts.present(result.widget),
      widgetKey: typeof result.widgetKey === "string" ? result.widgetKey : "",
      embedCode: typeof result.embedCode === "string" ? result.embedCode : "",
    };
  }

  async update(id: string, params: ManagedWidgetUpdateParams): Promise<ManagedWidgetConfig> {
    return managedWidgetContracts.present(await this.client.request<unknown>("PUT", `/widgets/${encodeURIComponent(id)}`, {
      body: managedWidgetContracts.serializeUpdate(params),
    }));
  }

  async delete(id: string): Promise<void> {
    await this.client.requestRaw("DELETE", `/widgets/${encodeURIComponent(id)}`);
  }

  async regenerateKey(id: string): Promise<WidgetKeyResult> {
    const value = await this.client.request<unknown>("POST", `/widgets/${encodeURIComponent(id)}/regenerate-key`, { body: "{}" });
    const result = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return { widgetKey: typeof result.widgetKey === "string" ? result.widgetKey : "", embedCode: typeof result.embedCode === "string" ? result.embedCode : "" };
  }

  async analytics(id: string, period: "7d" | "30d" | "90d" = "30d"): Promise<WidgetAnalytics> {
    const data = await this.client.request<unknown>("GET", `/widgets/${encodeURIComponent(id)}/analytics?period=${period}`);
    return managedWidgetContracts.presentAnalytics(data);
  }
}

export class Widgets {
  readonly managed: ManagedWidgets;

  constructor(private readonly client: BaseClient) {
    this.managed = new ManagedWidgets(client);
  }

  async list(): Promise<WidgetConfig[]> {
    const data = await this.client.request<{ widgets: WidgetConfig[] }>(
      "GET",
      "/widgets",
    );
    return data.widgets;
  }

  async get(id: string): Promise<WidgetConfig> {
    return this.client.request<WidgetConfig>("GET", `/widgets/${id}`);
  }

  async create(params: WidgetCreateParams): Promise<WidgetCreateResult> {
    return this.client.request<WidgetCreateResult>("POST", "/widgets", {
      body: JSON.stringify(params),
    });
  }

  async update(id: string, params: WidgetUpdateParams): Promise<WidgetConfig> {
    return this.client.request<WidgetConfig>("PUT", `/widgets/${id}`, {
      body: JSON.stringify(params),
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.requestRaw("DELETE", `/widgets/${id}`);
  }

  async regenerateKey(id: string): Promise<WidgetKeyResult> {
    return this.client.request<WidgetKeyResult>(
      "POST",
      `/widgets/${id}/regenerate-key`,
      { body: "{}" },
    );
  }

  async analytics(
    id: string,
    period: "7d" | "30d" | "90d" = "30d",
  ): Promise<WidgetAnalytics> {
    return this.client.request<WidgetAnalytics>(
      "GET",
      `/widgets/${id}/analytics?period=${period}`,
    );
  }
}
