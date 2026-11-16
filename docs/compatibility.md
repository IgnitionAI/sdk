# Compatibility policy

IgnitionRAG exposes a contract identity through `/api/meta`. Signed archives are
verified separately before SDK generation and public synchronization. Metadata
identifies a deployment; it is not itself a signed archive.

- The current SDK supports the current public contract and the immediately previous contract version.
- A changed digest under the current version is rejected as a protocol error.
- The previous revision is admitted by version and advertised capabilities; its
  digest is not compared with the current revision digest.
- Missing or disabled capabilities are reported explicitly; they are not silently redirected to another service.
- Contract artifacts are verified with the public keys in `contracts/trusted-keys.json`.

Upgrade the deployment or SDK when the compatibility check reports an unsupported contract version.

## Live SDK diagnostic

From `typescript/`, run `bun run test:live` with `IGNITION_BASE_URL` and
`IGNITION_API_KEY` supplied through the environment. Keep credentials out of
shell history and committed files. The command uses the checked-out SDK and
only sends GET requests, with retries disabled and a 15-second request timeout.

It checks deployment compatibility, collection details and documents,
evaluation details, agents, skills, research status, workflows and execution
details. Output contains check labels and outcomes, never resource contents,
identifiers or API credentials. Any failed compatibility, HTTP or response
shape check produces a nonzero exit status, while the remaining checks continue.
Missing fixtures and unavailable insights are reported as `NOT PROVEN`.

Run again with a group-bound key for group coverage. To probe collection
isolation, set `IGNITION_FORBIDDEN_COLLECTION_IDS` to comma-separated IDs of
known private collections in the other space. Only 403 or 404 counts as a
successful denial. Shared/public collections are unsuitable fixtures. Without
these fixtures, isolation is explicitly `NOT PROVEN`; successful resource
reads alone do not prove tenancy isolation.

A zero exit status covers only the checks exercised. This diagnostic does not
validate chat/streaming, ingestion, writes, workflow execution or cancellation.
Contract identities must still come from the official signed synchronization;
do not change the accepted version or digest merely to make a live check pass.

## Migration to 2026.11

The prepared TypeScript candidate is `1.0.0`. Its current contract is
`2026.11`; `2026.10` and `2026.09` remain accepted older revisions. `ingest.file` now returns
`AsyncIngestResult` — wait with `getJob` / `streamJob`. The sync HTTP route
`POST /api/ingest/file` is license-only. Deployment-specific crawler limits
remain enforced, but no longer change the versioned schema identity.
Upgrade the SDK before deploying `2026.11`. This source preparation is neither
a signed release nor an npm publication. The official workflow must sign and
verify the archive, regenerate the TypeScript identity and wire types and pass public synchronization
before release. Personal evaluation reads also require the server workspace
scope correction; upgrading the client alone does not fix the deployed 400.

Revision `2026.11` regenerates the integrated public schemas, including optional
ingestion chunking configuration. The current digest remains strict; older
revision admission does not assert equivalent digests or qualify every operation.
No deprecated revision is removed and no existing signed archive is rewritten.
