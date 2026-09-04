# PointCast agent surfaces audit - 2026-09-04

Branch: `codex/agent-surfaces-20260904`  
Base: `origin/main` at `163b7a0a`

## Baseline commands

`npm run audit:agents` passed. The audit confirmed these source surfaces:

- `src/pages/agents.json.ts`, `/for-agents`, `/agent-kit.md`, and connector discovery
- feed JSON/XML, editions, local, areas, and AI-stack discovery sources
- `public/llms.txt` and `public/llms-full.txt`
- unique human and JSON endpoint keys
- `/for-agents` references to `agents.json`, both llms files, `agent-kit.md`, both feeds, and `areas.json`

The first `npm run build:bare` attempt was rate-limited by TzKT (`429`) while prerendering profile/collect data. A retry completed successfully: Astro built 2,062 pages. The build still reports the pre-existing missing optional content-directory warnings for `projects` and `seeing-the-future`, large-chunk warnings, and the expected GET warning for the POST-only `/api/link/spend` handler.

## Surface findings and changes

- `agents.json`, `/.well-known/agents.json`, and `/.well-known/ai.json` now expose a shared September current-surface registry, a retired-path registry, current Kennel Club, collect, resident/profile, seals, x402, till, post-office, agent-action, and MCP doors, plus contract entries generated from `src/data/contracts.json`.
- The four retired 301 sources are explicitly marked: `/profile`, `/minted`, `/dashboard`, and `/login`. They are not current discovery doors.
- The `.well-known` aliases are real prerendered files. Their dead `_redirects` 200 rewrites were removed because Pages middleware preempts that rewrite path.
- `public/llms.txt` is now a 112-line short index with absolute `https://pointcast.xyz` Markdown links. Historical/editorial context remains in `public/llms-full.txt`, with stale redirect language removed and current machine doors added.
- `public/robots.txt` keeps the public default policy, names the requested AI crawlers with `Allow: /`, restricts only private/parametric paths, and lists the index, discovery, and blocks sitemaps.
- `public/_headers` adds front-door `Link` discovery for `llms.txt`, `agents.json`, and `/.well-known/agents.json`.
- The raw-import page routes for `robots.txt`, `llms.txt`, and `llms-full.txt` were removed. Each now has one static `public/` source of truth.
- No `/agent-readiness` page or `functions/api/agent-readiness.ts` exists in this checkout, so the 12-check readiness endpoint could not be run; no SSRF guard was touched.

## Verification

`tests/agent-surfaces.test.mjs` resolves every absolute PointCast Markdown link in `llms.txt`, every PointCast URL value in the built manifest, and every `DISCOVERY_LINKS` path against `dist/` or the checked-in Functions route set. It also rejects advertised 301 sources, validates current/retired manifest entries and data-backed contract statuses, checks the static single-source rule, and verifies all named AI robots groups and sitemap lines.

Final verification completed: `npm run build:bare` succeeded with 2,062 pages; `node --test tests/agent-surfaces.test.mjs` passed 2/2; and `npm test` passed 920/920. Dist-dependent OG checks are intentionally not part of `build:bare` and were not used as a reason to alter the SEO lane.
