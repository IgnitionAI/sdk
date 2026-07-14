# Compatibility policy

IgnitionRAG exposes a signed public contract through `/api/meta`. The SDK verifies the contract version and digest before relying on deployment capabilities.

- The current SDK supports the current public contract and the immediately previous contract version.
- A changed digest under an unchanged version is rejected as a protocol error.
- Missing or disabled capabilities are reported explicitly; they are not silently redirected to another service.
- Contract artifacts are verified with the public keys in `contracts/trusted-keys.json`.

Upgrade the deployment or SDK when the compatibility check reports an unsupported contract version.
