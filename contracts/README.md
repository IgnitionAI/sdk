# Public contract trust

`trusted-keys.json` contains only Ed25519 public verification keys. The matching
private key is held by the protected IgnitionRAG product repository release
environment and is never copied into this SDK source tree.

The `sdk-contract-2026-07` public-key file fingerprint is:

```text
SHA-256 55d614bbda241a5438c4eedba70674b7c8ff8988781781b96bc4fbfb962266f2
```

Release contract artifacts must be signed, must use a trusted key ID and must
have a monotonically increasing release sequence. Unsigned artifacts are
accepted only by explicitly opted-in local development commands.
