import { describe, expect, test } from "bun:test";
import {
  castError,
  IgnitionAIError,
  APIError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  BadRequestError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
  APIConnectionTimeoutError,
  CapabilityDisabledError,
  CapabilityNotLicensedError,
  ForbiddenIdentityError,
} from "../src/errors";

const headers = { "x-request-id": "req_123" };

describe("castError", () => {
  test("maps 400 to BadRequestError", () => {
    const err = castError(400, { error: "Invalid params" }, headers);
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Invalid params");
    expect(err.code).toBe("bad_request");
  });

  test("maps 401 to AuthenticationError", () => {
    const err = castError(401, { error: "Invalid API key" }, headers);
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.status).toBe(401);
    expect(err.requestId).toBe("req_123");
  });

  test("maps 403 to PermissionError with plan limit fields", () => {
    const err = castError(
      403,
      {
        error: "Feature not available",
        code: "FEATURE_NOT_AVAILABLE",
        feature: "hybridSearch",
        upgradeRequired: "pro",
        upgradeUrl: "/billing",
      },
      headers
    );
    expect(err).toBeInstanceOf(PermissionError);
    expect((err as PermissionError).feature).toBe("hybridSearch");
    expect((err as PermissionError).upgradeRequired).toBe("pro");
    expect((err as PermissionError).upgradeUrl).toBe("/billing");
  });

  test("maps 403 with limit exceeded fields", () => {
    const err = castError(
      403,
      {
        error: "Plan limit exceeded",
        code: "LIMIT_EXCEEDED",
        limit: "documents",
        current: 100,
        max: 50,
      },
      headers
    );
    expect(err).toBeInstanceOf(PermissionError);
    expect((err as PermissionError).limit).toBe("documents");
    expect((err as PermissionError).current).toBe(100);
    expect((err as PermissionError).max).toBe(50);
  });

  test("maps 403 with public collection access details", () => {
    const err = castError(
      403,
      {
        error: "Collection is read-only for this operation",
        code: "FORBIDDEN",
        status: 403,
        details: {
          code: "COLLECTION_READ_ONLY",
          collectionId: "coll_public",
          requiredPlanId: "pro",
          accessTier: "public-gated",
          publisherOrgId: "org_publisher",
        },
      },
      headers
    );

    expect(err).toBeInstanceOf(PermissionError);
    const permission = err as PermissionError;
    expect(permission.code).toBe("FORBIDDEN");
    expect(permission.reasonCode).toBe("COLLECTION_READ_ONLY");
    expect(permission.collectionId).toBe("coll_public");
    expect(permission.requiredPlanId).toBe("pro");
    expect(permission.accessTier).toBe("public-gated");
    expect(permission.publisherOrgId).toBe("org_publisher");
  });

  test("distinguishes disabled, unlicensed and identity-forbidden capabilities", () => {
    expect(castError(403, {
      error: "Feature is disabled",
      code: "FEATURE_DISABLED",
      flag: "deep_research",
    }, headers)).toBeInstanceOf(CapabilityDisabledError);

    expect(castError(403, {
      error: "IgnitionRAG license is missing or inactive",
      code: "FEATURE_NOT_AVAILABLE",
      details: { code: "LICENSE_MISSING", feature: "license" },
    }, headers)).toBeInstanceOf(CapabilityNotLicensedError);

    expect(castError(403, {
      error: "Forbidden",
      code: "FORBIDDEN",
    }, headers)).toBeInstanceOf(ForbiddenIdentityError);
  });

  test("maps 404 to NotFoundError", () => {
    const err = castError(404, { error: "Collection not found" }, headers);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.status).toBe(404);
  });

  test("maps 429 to RateLimitError", () => {
    const err = castError(
      429,
      { error: "Rate limited" },
      { ...headers, "retry-after": "30" }
    );
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfter).toBe(30);
  });

  test("maps 429 without retry-after header", () => {
    const err = castError(429, { error: "Rate limited" }, headers);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfter).toBeUndefined();
  });

  test("maps 500 to InternalServerError", () => {
    const err = castError(500, { error: "Internal error" }, headers);
    expect(err).toBeInstanceOf(InternalServerError);
    expect(err.status).toBe(500);
  });

  test("maps 502 to InternalServerError", () => {
    const err = castError(502, { error: "Bad gateway" }, headers);
    expect(err).toBeInstanceOf(InternalServerError);
  });

  test("maps unknown status to generic APIError", () => {
    const err = castError(418, { error: "I'm a teapot" }, headers);
    expect(err).toBeInstanceOf(APIError);
    expect(err).not.toBeInstanceOf(BadRequestError);
    expect(err.status).toBe(418);
  });

  test("falls back to 'Unknown error' when no message", () => {
    const err = castError(500, {}, headers);
    expect(err.message).toBe("Unknown error");
  });

  test("uses message field if error field missing", () => {
    const err = castError(400, { message: "Bad input" }, headers);
    expect(err.message).toBe("Bad input");
  });
});

describe("error hierarchy", () => {
  test("all API errors extend IgnitionAIError", () => {
    expect(new AuthenticationError("test", {})).toBeInstanceOf(IgnitionAIError);
    expect(new RateLimitError("test", {})).toBeInstanceOf(IgnitionAIError);
    expect(new NotFoundError("test", {})).toBeInstanceOf(IgnitionAIError);
  });

  test("connection errors extend IgnitionAIError", () => {
    expect(new APIConnectionError("test")).toBeInstanceOf(IgnitionAIError);
    expect(new APIConnectionTimeoutError()).toBeInstanceOf(APIConnectionError);
    expect(new APIConnectionTimeoutError()).toBeInstanceOf(IgnitionAIError);
  });

  test("APIConnectionTimeoutError has correct message", () => {
    expect(new APIConnectionTimeoutError().message).toBe("Request timed out");
  });

  test("APIConnectionError preserves cause", () => {
    const cause = new Error("socket hang up");
    const err = new APIConnectionError("connection failed", cause);
    expect(err.cause).toBe(cause);
  });
});
