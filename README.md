# IgnitionRAG SDK

[![CI](https://github.com/IgnitionAI/sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/IgnitionAI/sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ignitionai/sdk.svg)](https://www.npmjs.com/package/@ignitionai/sdk)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Official open-source SDKs and signed public API contracts for IgnitionRAG deployments.

IgnitionRAG itself is licensed software. This repository contains client libraries only; it does not contain the product server, administration CLI, widgets, deployment tooling, customer configuration, or private MCP implementations.

## TypeScript

```bash
bun add @ignitionai/sdk@next
# or npm install @ignitionai/sdk@next
```

The current public release is `0.3.0-rc.3` under the npm `next` tag. The
unqualified install command remains on the stable `0.2.x` line until `0.3.0` is
promoted to `latest`.

```ts
import { IgnitionAI } from "@ignitionai/sdk";

const ignition = new IgnitionAI({
  baseURL: "https://rag.example.com",
  apiKey: process.env.IGNITION_API_KEY,
});

const collections = await ignition.collections.list();
```

See the [TypeScript SDK guide](./typescript/README.md) for server, browser, streaming, workflow and deep-research examples.

## Repository layout

- `typescript/` — the supported TypeScript SDK.
- `contracts/` — signed, versioned public API artifacts and trusted verification keys.
- `examples/` — minimal runtime smoke examples.
- `docs/` — compatibility and release documentation.

The Python SDK may be added later. It is not part of the current support commitment.

## Security

API keys are server-side credentials. Browser applications must use `@ignitionai/sdk/browser` with a delegated token provider. See [SECURITY.md](./SECURITY.md) to report a vulnerability privately.

## License

SDK source code is released under the [MIT License](./LICENSE). This license does not grant rights to the private IgnitionRAG product.
