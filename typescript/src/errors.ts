export class IgnitionAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IgnitionAIError";
  }
}

export class ConfigurationError extends IgnitionAIError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class SecurityError extends IgnitionAIError {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

export class ProtocolError extends IgnitionAIError {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolError";
  }
}

export class UnsupportedContractVersionError extends ProtocolError {
  constructor(
    readonly receivedVersion: string,
    readonly supportedVersions: readonly string[],
  ) {
    super(
      `Unsupported IgnitionRAG contract version ${receivedVersion}. Supported versions: ${supportedVersions.join(", ")}.`,
    );
    this.name = "UnsupportedContractVersionError";
  }
}

export class ContractDigestMismatchError extends ProtocolError {
  constructor(
    readonly expectedDigest: string,
    readonly receivedDigest: string,
  ) {
    super(
      `IgnitionRAG contract digest does not match the SDK declaration (expected ${expectedDigest}, received ${receivedDigest}).`,
    );
    this.name = "ContractDigestMismatchError";
  }
}

export class APIError extends IgnitionAIError {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly code?: string;
  readonly requestId?: string;

  constructor(
    status: number,
    message: string,
    headers: Record<string, string>,
    code?: string
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.headers = headers;
    this.code = code;
    this.requestId = headers["x-request-id"];
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string, headers: Record<string, string>) {
    super(401, message, headers, "authentication_error");
    this.name = "AuthenticationError";
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export class PermissionError extends APIError {
  readonly feature?: string;
  readonly upgradeRequired?: string;
  readonly upgradeUrl?: string;
  readonly limit?: string;
  readonly current?: number;
  readonly max?: number;
  readonly details?: Record<string, unknown>;
  readonly reasonCode?: string;
  readonly requiredPlanId?: string;
  readonly collectionId?: string;
  readonly accessTier?: string;
  readonly publisherOrgId?: string | null;

  constructor(
    message: string,
    headers: Record<string, string>,
    body?: Record<string, unknown>
  ) {
    super(403, message, headers, (body?.code as string) ?? "permission_error");
    this.name = "PermissionError";
    const details = asRecord(body?.details);
    this.feature = body?.feature as string | undefined;
    this.upgradeRequired = body?.upgradeRequired as string | undefined;
    this.upgradeUrl = body?.upgradeUrl as string | undefined;
    this.limit = body?.limit as string | undefined;
    this.current = body?.current as number | undefined;
    this.max = body?.max as number | undefined;
    this.details = details;
    this.reasonCode = (details?.code as string | undefined) ?? this.code;
    this.requiredPlanId = (body?.requiredPlanId ??
      details?.requiredPlanId) as string | undefined;
    this.collectionId = (body?.collectionId ??
      details?.collectionId) as string | undefined;
    this.accessTier = (body?.accessTier ??
      details?.accessTier) as string | undefined;
    this.publisherOrgId = (body?.publisherOrgId ??
      details?.publisherOrgId) as string | null | undefined;
  }
}

export class CapabilityDisabledError extends PermissionError {
  constructor(message: string, headers: Record<string, string>, body: Record<string, unknown>) {
    super(message, headers, body);
    this.name = "CapabilityDisabledError";
  }
}

export class CapabilityNotLicensedError extends PermissionError {
  constructor(message: string, headers: Record<string, string>, body: Record<string, unknown>) {
    super(message, headers, body);
    this.name = "CapabilityNotLicensedError";
  }
}

export class ForbiddenIdentityError extends PermissionError {
  constructor(message: string, headers: Record<string, string>, body: Record<string, unknown>) {
    super(message, headers, body);
    this.name = "ForbiddenIdentityError";
  }
}

export class NotFoundError extends APIError {
  constructor(message: string, headers: Record<string, string>) {
    super(404, message, headers, "not_found");
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends APIError {
  constructor(message: string, headers: Record<string, string>) {
    super(400, message, headers, "bad_request");
    this.name = "BadRequestError";
  }
}

export class RateLimitError extends APIError {
  readonly retryAfter?: number;

  constructor(message: string, headers: Record<string, string>) {
    super(429, message, headers, "rate_limit_error");
    this.name = "RateLimitError";
    const ra = headers["retry-after"];
    if (ra) {
      const parsed = parseInt(ra, 10);
      if (!isNaN(parsed)) this.retryAfter = parsed;
    }
  }
}

export class InternalServerError extends APIError {
  constructor(
    status: number,
    message: string,
    headers: Record<string, string>
  ) {
    super(status, message, headers, "internal_server_error");
    this.name = "InternalServerError";
  }
}

export class APIConnectionError extends IgnitionAIError {
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "APIConnectionError";
    this.cause = cause;
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  constructor() {
    super("Request timed out");
    this.name = "APIConnectionTimeoutError";
  }
}

export class RequestCancelledError extends APIConnectionError {
  constructor() {
    super("Request cancelled by caller");
    this.name = "RequestCancelledError";
  }
}

/**
 * Map an HTTP error response to the appropriate typed error.
 */
export function castError(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string>
): APIError {
  const message =
    (body.error as string) ?? (body.message as string) ?? "Unknown error";

  switch (status) {
    case 400:
      return new BadRequestError(message, headers);
    case 401:
      return new AuthenticationError(message, headers);
    case 403:
      if (body.code === "FEATURE_DISABLED") {
        return new CapabilityDisabledError(message, headers, body);
      }
      if (
        body.code === "FEATURE_NOT_AVAILABLE" ||
        asRecord(body.details)?.code === "LICENSE_MISSING"
      ) {
        return new CapabilityNotLicensedError(message, headers, body);
      }
      return new ForbiddenIdentityError(message, headers, body);
    case 404:
      return new NotFoundError(message, headers);
    case 429:
      return new RateLimitError(message, headers);
    default:
      if (status >= 500) {
        return new InternalServerError(status, message, headers);
      }
      return new APIError(status, message, headers);
  }
}
