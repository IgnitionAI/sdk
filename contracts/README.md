# Public contract trust

`trusted-keys.json` contains only Ed25519 public verification keys. The private
signing material for the current contract is stored only as repository-level
GitHub Actions secrets in the private IgnitionRAG product repository and is
never copied into this SDK source tree. The synchronizer is manually dispatched
and runs the compatibility guard; no protected Actions environment is claimed.

The following fingerprints are SHA-256 of the ASCII bytes of each Base64-encoded
32-byte raw Ed25519 public key, without a trailing newline:

- `sdk-contract-2026-07`: `55d614bbda241a5438c4eedba70674b7c8ff8988781781b96bc4fbfb962266f2`
- `sdk-contract-2026-11`: `8f51ed1dd2078f9c0458b6724b6a2f1436270fc1c1fca073b57165814735197a`

On 2026-11-08 the product owner explicitly authorized adding
`sdk-contract-2026-11` without a transition signature from the previous key.
This is an owner-approved trust-root bootstrap, not a cryptographic transition
signed by `sdk-contract-2026-07`. Both public keys remain trusted so the
immutable 2026.07 contract archive continues to verify byte for byte.

Release contract artifacts must be signed, must use a trusted key ID and must
have a monotonically increasing release sequence. Unsigned artifacts are
accepted only by explicitly opted-in local development commands.
