import { appendFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PACKAGE_NAME = "@ignitionai/sdk";
const EXPECTED_REPOSITORY = "IgnitionAI/sdk";
const EXPECTED_AUDIENCE = "npm:registry.npmjs.org";
const EXPECTED_SUBJECT = `repo:${EXPECTED_REPOSITORY}:environment:npm`;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing GitHub OIDC runtime variable: ${name}`);
  return value;
}

function decodeClaims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("GitHub returned a malformed OIDC token");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

function assertClaim(claims: Record<string, unknown>, name: string, expected: string): void {
  if (claims[name] !== expected) {
    throw new Error(`Unexpected OIDC ${name}: ${String(claims[name])}`);
  }
}

const requestUrl = new URL(required("ACTIONS_ID_TOKEN_REQUEST_URL"));
requestUrl.searchParams.set("audience", EXPECTED_AUDIENCE);
const oidcResponse = await fetch(requestUrl, {
  headers: { Authorization: `Bearer ${required("ACTIONS_ID_TOKEN_REQUEST_TOKEN")}` },
});
if (!oidcResponse.ok) {
  throw new Error(`GitHub OIDC request failed with HTTP ${oidcResponse.status}`);
}
const oidcPayload = await oidcResponse.json() as { value?: string };
if (!oidcPayload.value) throw new Error("GitHub OIDC response did not include a token");

const claims = decodeClaims(oidcPayload.value);
assertClaim(claims, "aud", EXPECTED_AUDIENCE);
assertClaim(claims, "repository", EXPECTED_REPOSITORY);
assertClaim(claims, "repository_visibility", "public");
assertClaim(claims, "runner_environment", "github-hosted");
assertClaim(claims, "sub", EXPECTED_SUBJECT);
const workflowRef = String(claims.job_workflow_ref ?? claims.workflow_ref ?? "");
if (!workflowRef.includes(`${EXPECTED_REPOSITORY}/.github/workflows/release.yml@`)) {
  throw new Error(`Unexpected OIDC workflow reference: ${workflowRef}`);
}

const exchangeUrl = new URL(
  `/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(PACKAGE_NAME)}`,
  "https://registry.npmjs.org",
);
const exchangeResponse = await fetch(exchangeUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${oidcPayload.value}`,
    Accept: "application/json",
  },
});
if (exchangeResponse.status !== 201) {
  const errorBody = (await exchangeResponse.text()).slice(0, 1_000);
  throw new Error(`npm OIDC exchange failed with HTTP ${exchangeResponse.status}: ${errorBody}`);
}
const exchange = await exchangeResponse.json() as { token?: string; expires?: string };
if (!exchange.token || /[\r\n]/.test(exchange.token)) {
  throw new Error("npm OIDC exchange returned an invalid token");
}

console.log(`::add-mask::${exchange.token}`);
const githubEnv = required("GITHUB_ENV");
const npmrcPath = join(required("RUNNER_TEMP"), "ignition-sdk-oidc.npmrc");
await writeFile(
  npmrcPath,
  "registry=https://registry.npmjs.org/\n//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n",
  { mode: 0o600 },
);
await appendFile(
  githubEnv,
  `NODE_AUTH_TOKEN=${exchange.token}\nNPM_CONFIG_USERCONFIG=${npmrcPath}\n`,
);
console.log(`npm OIDC exchange accepted for ${PACKAGE_NAME}; expires=${exchange.expires ?? "unknown"}`);
