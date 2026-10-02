# Pocket Rocks — September 29, 2026

Mike requested: “create collectible digital rocks on pointcast”. This change adds a complete native collecting room at `/rocks` with a structured field guide at `/rocks.json`.

Ten geology-inspired families produce individual procedural specimens from a stable unsigned 32-bit seed and family identifier. The viewer loads Three.js on demand, supports dragging and keyboard/button rotation, and falls back to deterministic illustrated SVG. Rocks can be kept in a browser-local cabinet, featured, shared by URL, or exported as SVG. Cabinets support JSON export/import, metadata validation, duplicate removal, a 500-specimen bound, and reconciliation across tabs. Storage failures remain recoverable through export.

Discovery is integrated into the homepage project shelf, Apps, Play, Block 0651, agent endpoints, both LLM guides, the discovery sitemap, and the shared Cabinet and Provenance Ledger. The existing Block schema and channels are unchanged. The room is isolated from global auth/session, presence, ads, and analytics.

Validation: 10 library tests and 8 production-client tests pass. The client tests exercise the real source and canonical library with only the GPU viewer boundary mocked. Native browser checks at 390 and 1280 pixels verified no horizontal overflow, all ten families, full-pocket completion, reload persistence, valid shared identity, and a visible genuine 3D specimen. No console errors were observed. Independent review fixed cross-tab collection loss, specimen accessibility names, small-text contrast, context-loss controls, stale clipboard callbacks, and initialization cleanup. The full PointCast build passed remotely at dd4b3dd; a final exact-source build is part of preview preparation. Shared Cabinet and Provenance Ledger scripts passed integration checks for canonical counts, IDs and dates, malformed and forged records, storage events, legacy collections, and proof export. The first sandboxed build attempt failed because an existing TzKT route needs network access.

This is preview and draft-PR work. Production publication remains subject to the existing AGENTS.md requirement: “Merge to `main` — X review + MH approval.” Source is prepared on `codex/pocket-rocks-20260929`; no contract, payment, wallet, or data-service changes are involved.


## Release review — October 2, 2026

Reviewed PR head `bdb39c581d8350143c4615570e46814b7eac0f45` against main `c9f0f102b6bd74c03f33c0f7194f12e79cfe8d06`. Shared Cabinet and Provenance Ledger integration is present and normalizes Rocks metadata through the canonical library. No data-loss, forged-metadata, seed-zero, or discovery regression was found.

Visual QA found that the generic button font reset overrode the family-card font size, causing long geology names to overlap adjacent cards on phones. The scoped CSS fix gives those cards a readable 12px font and uses a mobile grid with a 96px minimum card width. No homepage data, tests, or unrelated feature source was edited.

All 20 Rocks tests pass. The combined affected suite has 28 passes and two inherited failures in `tests/home-new-today.test.mjs`: `launch notes stay out of front-door-news.json while the strip shows them` (the fresh `/apis` duplicate in front-door news), and `the strip list is data: dated, linked, and tied to real blocks` (overlong copy beginning with Tiger Balm in new-today data). Both are unchanged by this PR. The agent-surface audit passed.

The fixed integration build with current main completed at `2026-10-02T00:06:35Z`: 2,758 pages in 119.82 seconds, with metadata normalization for 2,812 HTML files. It uses the operations-approved `npm run build:bare`. Its exact staged source tree, before this documentation entry, was `c522755822a9bb7487b90fea172e6204c190eaba`. Log: `/tmp/pointcast-rocks-review-fixed-build-20261001.log`.

Isolated headless Google Chrome on Mike's Mac (software WebGL) passed final interaction and text-bound checks at 320, 375, 390, and 1280 pixels. Eleven collected specimens covered every family; favorites and reload state persisted, cabinet JSON and SVG downloads worked, zero-seed sharing retained identity, and the shared Cabinet and Provenance Ledger each showed eleven normalized Rocks receipts. No page exceptions occurred. QA result: `/tmp/pointcast-rocks-fixed-20261001-qa.json`.

The supplied preview `https://6529cc91.pointcast.pages.dev/rocks/` passes Rocks interactions at 390 and 1280 pixels, but its shared `/cabinet/` and `/provenance-ledger/` routes return 404. Those integration routes were verified in the complete local build; both existing production routes return 200. The CSS fix is local and is not included in that preview.

The supported Mac publication route successfully deployed current main earlier today, according to the shared deployment marker and log. After approval, publication must merge the reviewed PR first and use `scripts/deploy.sh`, which fetches and publishes current `origin/main`. No push, remote merge, deployment, migration, or credential change was performed during this review.
