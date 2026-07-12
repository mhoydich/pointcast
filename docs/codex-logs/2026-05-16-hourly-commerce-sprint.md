---
title: "Hourly commerce sprint — outbound no-referrer"
date: "2026-05-16"
agent: "codex"
scope: "commerce"
---

## Change

- Hardened outbound commerce links with `rel="noopener noreferrer"` + `referrerpolicy="no-referrer"` so checkout hops do not leak PointCast URLs via referrer headers.

## Touched files

- `src/pages/shop.astro`
- `src/pages/products.astro`
- `src/pages/products/[slug].astro`
- `src/pages/pairings/[mood].astro`

## Verification

- `npm run test:protocol` (pass)
- Grep: commerce `target="_blank"` anchors include `noreferrer` + `referrerpolicy`
