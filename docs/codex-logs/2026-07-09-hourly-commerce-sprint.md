---
title: "Hourly commerce sprint — agent checkout routing"
date: "2026-07-09"
agent: "codex"
scope: "commerce"
---

## Change

- Added a normalized `checkoutRouting` object to `/shop.json`, `/products.json`, and `/api/products.jsonl` so agents can read outbound checkout mode, no-PII policy, host, provider, rel, and referrer policy per product.
- Added catalog `freshness` metadata to the aggregate JSON feeds, including latest/oldest visible product dates and the hidden-product policy for draft or unavailable PointCast merch.

## Verification

- `npm run good-feels:sync -- --dry-run --limit 3` (pass)
- `npm run build:bare` (pass; existing warnings for optional content dirs, unresolved shrine images, prerendered request headers, chunk size)
- Generated endpoint smoke: parsed `.dist-build/shop.json`, `.dist-build/products.json`, and `.dist-build/api/products.jsonl`; verified matching product counts, routing fields, outbound-only/no-PII policy, and no unavailable PointCast merch leakage.
