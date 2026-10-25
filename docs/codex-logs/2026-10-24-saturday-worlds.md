# Saturday, slightly elsewhere.

Authorized Saturday October 24, 2026 visual feature at `/saturday-worlds/`, with a complete static contact sheet at `/saturday-worlds/contact-sheet/`. Six editorial chapters select 24 images from two explicitly requested Midjourney V8.2 batches made that day in Pacific time. The publication does not import the historical private library.

## Scope and provenance

- 100 Pacific Common Futures coastal images.
- 100 South Bay Worlds scene images.
- 160 advertising images representing 40 distinct ad concepts: 40 selected representatives and 120 alternate variations.
- 90 original jobs, four images each; 360 unique original file hashes and decoded images.
- 720 local WebP derivatives: a display image and thumbnail per original. All source files remain untouched.
- Public manifest contains only allowlisted image identifiers, titles, categories, dimensions, relative public image URLs, exact campaign copy, generation job IDs, timestamps and source/pixel hashes. It excludes prompts, private source descriptions, local paths, account/plan metadata and archive internals.

Every place, product and campaign is labeled speculative AI-generated artwork. Exact advertising copy accompanies each ad; generated lettering is not authoritative. Nouns Money imagery makes no financial promise, investment solicitation or official endorsement.

## Interaction and performance

The main journey has chapter navigation, progress, reduced-motion controls and a random-view detour. The complete archive has combined search, category and brand filters, incremental 24-image rendering, a keyboard lightbox and four-variation navigation. Direct image hash links, Close/Escape/backdrop dismissal and browser Back/Forward retain page navigation. A separate fully static contact sheet exposes every optimized image without JavaScript.

There are no added APIs, functions, databases, analytics, generation requests, music, subscriptions or remote transformation services. Fonts, scripts and images are local. Display WebPs total 64,837,492 bytes (median 178,166; maximum 463,074). Thumbnails total 6,437,622 bytes (median 16,937; maximum 49,870). The full collection is loaded only as the visitor explores. Initial hero uses responsive image candidates; all other editorial/gallery images are lazy-loaded with dimensions.

Discovery is one bounded homepage New today entry and an archive feature link. No block ID is allocated or repurposed. Collect, Signature Studio and held PR #1540 are unchanged.

## Validation and release

`node --test tests/saturday-worlds*.test.mjs tests/home-new-today.test.mjs tests/collect-goals.test.mjs tests/collect-goals-client.test.mjs tests/collect-desk.test.mjs tests/signature-studio.test.mjs`

The image integrity suite decodes all 720 WebPs, checks 360 source hashes, 90 complete variant groups, exact category counts, creation dates, stripped metadata, link coverage, size budgets and all 24 curated selections. Interaction tests cover combined filtering, pagination, browser history, direct hash links, repeated clicks, keyboard controls and reduced motion. Browser QA and application build precede the authorized release through `scripts/deploy.sh`. Deployment receipt and exact live revision are reported after publication, not inferred from a green GitHub build.
