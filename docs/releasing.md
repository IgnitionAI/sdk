# Release process

Releases are built from this public repository. The private product repository can only propose a synchronized pull request; it cannot publish npm packages directly.

1. Merge a reviewed synchronization pull request after CI succeeds.
2. Create a signed tag matching `typescript/package.json`, for example `v0.3.0-rc.1`.
3. The `release.yml` workflow re-verifies the signed contract, generated files, tests, build and public boundary.
4. GitHub's `npm` environment approval gate authorizes the release job.
5. npm trusted publishing exchanges GitHub OIDC identity for a short-lived credential and records provenance.

Release candidates use the npm `next` tag. Stable versions use `latest` and require a separate reviewed tag.

The npm trusted publisher must be configured for organization `IgnitionAI`, repository `sdk`, workflow `release.yml`, environment `npm`, with publish permission. No long-lived npm token is accepted by this workflow.
