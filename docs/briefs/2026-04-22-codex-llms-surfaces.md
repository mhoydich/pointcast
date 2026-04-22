# Codex · codex-04 · `/sparrow/llms.txt` + `/federation-llms.txt` surfaces

**Priority:** fourth. Small but ships reach to crawlers immediately.

## Why

Anthropic, OpenAI, Perplexity, and a growing set of LLM agents respect `llms.txt` files as a concise, human-curated summary of a domain. PointCast already has `/llms.txt` and `/llms-full.txt` at the root. Sparrow's federation surface is novel enough that it deserves its own agent-front-door — a crawler landing on `/sparrow` should know in one parse that this is a reader with a federation layer, not just another static site.

## Two files to ship

### `/sparrow/llms.txt`

Plain-text, ≤ 4 KB, Markdown-subset. Describes:

1. What Sparrow is in one paragraph.
2. The seven routes that matter (`/sparrow`, `/sparrow/ch/<slug>`, `/sparrow/b/<id>`, `/sparrow/saved`, `/sparrow/friends`, `/sparrow/friends/activity`, `/sparrow/signals`).
3. The machine-readable twins (`/sparrow.json`, `/sparrow/feed.xml`, `/sparrow/api/latest.json`, `/sparrow/federation.json`).
4. The federation layer in two sentences: public saved-list via kind-30078 + ephemeral presence via kind-20078, both on a relay pool documented in `/sparrow/federation.json`.
5. Where to find the full manifest and the roadmap: `/sparrow.json` and `/sparrow/about`.

Model it on the existing `/llms.txt` at the repo root — study its voice first.

### `/federation-llms.txt` (top-level, sibling of `/llms.txt`)

Narrower, focused on just the federation protocol Sparrow speaks. For a Nostr client or an agent that wants to interop with Sparrow without rendering its UI:

1. Event kinds Sparrow publishes (20078 presence, 30078 saved-list public, 30078 saved-list private-NIP-44, kind 7 reactions).
2. Tag conventions (`d: sparrow-public-saved-v1`, `d: sparrow-reader-state-v1`, `t: sparrow-presence`, `r: <block-url>`).
3. Payload shapes for each kind with minimal JSON examples.
4. Link to `/sparrow.json#nostr` for the full contract.

## Both files

- Must be static (Astro API routes or static assets in `public/`).
- Must carry `Cache-Control: public, max-age=900` minimum.
- Must be plain-text (`Content-Type: text/plain; charset=utf-8`).
- Must link to each other + the JSON manifest for machine-traversal.

## Deliverables

1. `src/pages/sparrow/llms.txt.ts` (or `public/sparrow/llms.txt` if you prefer static).
2. `src/pages/federation-llms.txt.ts` (likewise).
3. A small addition to the canonical `/llms.txt` linking to both new surfaces.
4. Bump `/sparrow.json` routes to include `llms_txt: '/sparrow/llms.txt'` + `federation_llms_txt: '/federation-llms.txt'`.

## Style notes

- Human-first. An AI reading this should learn, not parse a JSON-in-disguise.
- Paste-ready examples over abstract descriptions.
- No marketing copy. The HN short draft (codex-02) is the marketing surface. This is the utility surface.

## Done when

- Both files exist, return 200 with `text/plain`.
- `curl https://pointcast.xyz/sparrow/llms.txt | wc -c` returns < 4000.
- `curl -I https://pointcast.xyz/federation-llms.txt` has a long max-age.
- Update `docs/plans/2026-04-22-10-assignments.md` row for codex-04.
