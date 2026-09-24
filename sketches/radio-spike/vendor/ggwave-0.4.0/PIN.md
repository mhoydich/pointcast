# ggwave 0.4.0 — pinned vendor copy

- Source: https://registry.npmjs.org/ggwave/-/ggwave-0.4.0.tgz
- Tarball SHA-256: b3e9db57aecc56238bea0343fb6787cd37d02bbeab3b4d33e3f2d4de65b45d62
- ggwave.js SHA-256: f3792b5c185345a35a935ca68a5064b97f979d13fbba0062ff16f6b3b31a6113 (153,955 bytes, WASM embedded as base64)
- LICENSE: MIT, from https://github.com/ggerganov/ggwave/blob/ggwave-v0.4.0/LICENSE
  SHA-256 463a87b0f9e9c23ccf82e4cae3ea50fc4653ed63fca5e3e148f6513cf03d38ae
- The npm tarball ships no LICENSE file; the text above is the upstream tag's LICENSE.
- package.json here only marks the file CommonJS so Node can `require` it inside this ESM repo. The browser loads it as a classic script (global `ggwave_factory`).
- Do not upgrade without re-running fixtures/measure.mjs; frame timings are version-specific.
