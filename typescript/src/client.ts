import type { ClientOptions } from "./types.js";
import {
  castError,
  APIConnectionError,
  APIConnectionTimeoutError,
  RequestCancelledError,
  ConfigurationError,
  IgnitionAIError,
  SecurityError,
  type APIError,
} from "./errors.js";
import { VERSION } from "./version.js";

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export interface RequestOptions {
  method?: string;
  body?: string | FormData;
  headers?: Record<string, string>;
  timeout?: number;
  /** If true, skip JSON content-type header (for FormData) */
  multipart?: boolean;
  /** Abort only this HTTP transport. Remote jobs require their explicit cancel endpoint. */
  signal?: AbortSignal;
}

export class BaseClient {
  readonly apiKey: string | undefined;
  readonly baseURL: string;
  readonly maxRetries: number;
  readonly timeout: number;
  private readonly _fetch: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;
  private readonly tokenProvider: ClientOptions["tokenProvider"];

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.tokenProvider = options.tokenProvider;

    if (this.apiKey && this.tokenProvider) {
      throw new ConfigurationError(
        "Configure either apiKey or tokenProvider, not both."
      );
    }
    if (!this.apiKey && !this.tokenProvider) {
      throw new ConfigurationError(
        "Authentication is required. Pass apiKey or tokenProvider. Trusted runtimes may use IgnitionAI.fromEnv()."
      );
    }

    this.baseURL = this._normalizeBaseURL(options.baseURL);
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 60_000;
    this._fetch = options.fetch ?? globalThis.fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  buildURL(path: string): string {
    return `${this.baseURL}/api${path}`;
  }

  buildHeaders(extra?: Record<string, string>, multipart?: boolean): Record<string, string> {
    if (!this.apiKey) {
      throw new ConfigurationError(
        "buildHeaders() is unavailable with tokenProvider authentication; make a request instead."
      );
    }
    return this._headersForToken(this.apiKey, extra, multipart);
  }

  private _headersForToken(
    token: string,
    extra?: Record<string, string>,
    multipart?: boolean,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "User-Agent": `ignitionai-ts/${VERSION}`,
      ...this.defaultHeaders,
      ...extra,
    };
    if (!multipart) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  private async _buildRequestHeaders(
    extra?: Record<string, string>,
    multipart?: boolean,
  ): Promise<Record<string, string>> {
    const token = this.tokenProvider ? await this.tokenProvider() : this.apiKey;
    if (!token || token.trim().length === 0) {
      throw new ConfigurationError("The configured authentication provider returned an empty token.");
    }
    return this._headersForToken(token, extra, multipart);
  }

  /**
   * Make a JSON request and return the parsed response.
   */
  async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this._requestWithRetry(method, path, options);
    return (await response.json()) as T;
  }

  /**
   * Make a request and return the raw Response (for streaming).
   */
  async requestRaw(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<Response> {
    return this._requestWithRetry(method, path, options);
  }

  private async _requestWithRetry(
    method: string,
    path: string,
    options?: RequestOptions,
    retriesLeft?: number
  ): Promise<Response> {
    retriesLeft = retriesLeft ?? this.maxRetries;

    const reqTimeout = options?.timeout ?? this.timeout;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, reqTimeout);
    const abortFromCaller = () => controller.abort(options?.signal?.reason);
    options?.signal?.addEventListener("abort", abortFromCaller, { once: true });
    if (options?.signal?.aborted) abortFromCaller();

    try {
      const url = this.buildURL(path);
      const headers = await this._buildRequestHeaders(options?.headers, options?.multipart);

      const response = await this._fetch(url, {
        method,
        headers,
        body: options?.body,
        signal: controller.signal,
        redirect: "manual",
      });

      clearTimeout(timer);

      if (response.ok) {
        return response;
      }

      if (response.status >= 300 && response.status < 400) {
        throw new SecurityError(
          "IgnitionRAG refused an authenticated HTTP redirect to prevent credential forwarding."
        );
      }

      // Parse error
      const errorHeaders = this._extractHeaders(response);
      let body: Record<string, unknown>;
      try {
        body = (await response.json()) as Record<string, unknown>;
      } catch {
        body = { error: response.statusText };
      }

      const error = castError(response.status, body, errorHeaders);

      if (
        retriesLeft > 0 &&
        RETRYABLE_STATUS_CODES.has(response.status) &&
        this._canRetry(method, options?.headers)
      ) {
        const delay = this._retryDelay(
          this.maxRetries - retriesLeft,
          errorHeaders
        );
        await this._sleep(delay);
        return this._requestWithRetry(method, path, options, retriesLeft - 1);
      }

      throw error;
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof IgnitionAIError) {
        throw err;
      }

      if (err instanceof DOMException && err.name === "AbortError") {
        if (options?.signal?.aborted) {
          throw new RequestCancelledError();
        }
        if (timedOut && retriesLeft > 0 && this._canRetry(method, options?.headers)) {
          const delay = this._retryDelay(this.maxRetries - retriesLeft);
          await this._sleep(delay);
          return this._requestWithRetry(method, path, options, retriesLeft - 1);
        }
        throw new APIConnectionTimeoutError();
      }

      // Network error
      if (retriesLeft > 0 && this._canRetry(method, options?.headers)) {
        const delay = this._retryDelay(this.maxRetries - retriesLeft);
        await this._sleep(delay);
        return this._requestWithRetry(method, path, options, retriesLeft - 1);
      }

      throw new APIConnectionError(
        err instanceof Error ? err.message : "Unknown connection error",
        err instanceof Error ? err : undefined
      );
    } finally {
      clearTimeout(timer);
      options?.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  private _canRetry(method: string, headers?: Record<string, string>): boolean {
    const normalized = method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(normalized)) return true;
    return Object.keys(headers ?? {}).some(
      (name) => name.toLowerCase() === "idempotency-key",
    );
  }

  private _retryDelay(
    attempt: number,
    headers?: Record<string, string>
  ): number {
    if (headers?.["retry-after"]) {
      const seconds = parseInt(headers["retry-after"], 10);
      if (!isNaN(seconds)) return seconds * 1000;
    }

    // Exponential backoff: 500ms, 1s, 2s, 4s... capped at 8s
    const base = 500;
    const maxDelay = 8000;
    const delay = Math.min(base * Math.pow(2, attempt), maxDelay);
    // Add ±25% jitter
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return delay + jitter;
  }

  private _extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _normalizeBaseURL(value: string): string {
    if (!value || value.trim().length === 0) {
      throw new ConfigurationError(
        "baseURL is required and must point to your IgnitionRAG deployment."
      );
    }
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new ConfigurationError("baseURL must be an absolute HTTP(S) URL.");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new ConfigurationError("baseURL must use HTTP or HTTPS.");
    }
    if (url.username || url.password || url.search || url.hash) {
      throw new ConfigurationError(
        "baseURL cannot contain credentials, query parameters, or a fragment."
      );
    }
    return value.replace(/\/+$/, "");
  }
}
