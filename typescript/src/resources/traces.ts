import type { BaseClient } from "../client.js";
import type {
  Trace,
  TraceExport,
  TraceExportParams,
  TraceListParams,
  TraceListResponse,
  TraceMetrics,
  TraceMetricsParams,
} from "../types.js";

function query(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, String(item)));
    else search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export class Traces {
  constructor(private client: BaseClient) {}

  async list(params: TraceListParams = {}): Promise<TraceListResponse> {
    return this.client.request("GET", `/traces${query(params)}`);
  }

  async get(traceId: string, options: { includeChildren?: boolean; maxDepth?: number } = {}): Promise<Trace> {
    const result = await this.client.request<{ trace: Trace }>(
      "GET",
      `/traces/${encodeURIComponent(traceId)}${query(options)}`,
    );
    return result.trace;
  }

  async metrics(params: TraceMetricsParams): Promise<TraceMetrics> {
    return this.client.request("GET", `/traces/metrics${query(params)}`);
  }

  async export(params: TraceExportParams): Promise<TraceExport> {
    const response = await this.client.requestRaw("GET", `/traces/export${query(params)}`);
    const disposition = response.headers.get("content-disposition") ?? "";
    const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? `traces.${params.format}`;
    return {
      filename,
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      content: await response.text(),
    };
  }
}
