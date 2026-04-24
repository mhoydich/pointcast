# PointCast SEO / GEO / LLM Audit

Date: 2026-04-21
Scope: new `/resources` surface plus a fast pass across discovery, crawl, and machine-readable site affordances.

## Executive Read

PointCast is already unusually strong for LLM retrieval: it has `/agents.json`, `/llms.txt`, `/llms-full.txt`, JSON mirrors, RSS/JSON feeds, stripped HTML for AI user agents, and per-block permalinks. The main gap from this pass was discovery drift: the new `/resources` page existed, but the robots comments, LLM docs, global Link headers, and repo surface had not all learned about it yet.

This pass refreshes those signals and records remaining blockers before publishing.

## Changes Made

- Added `/resources` and `/resources.json` to `/llms.txt` and `/llms-full.txt`.
- Added a dedicated LLM/GEO retrieval section to `/llms-full.txt`.
- Added `/resources` and `/resources.json` to `robots.txt` agent entry-point comments.
- Added `sitemap-blocks.xml` as an explicit sitemap in `robots.txt`.
- Added a global HTTP `Link` header for `/resources.json`.
- Added Cloudflare `_headers` CORS/cache rules for `/resources.json`.
- Added `/resources` to the README key surfaces.

## Current Strengths

- `npm run build:bare` passed on 2026-04-21 and generated 554 Astro pages.
- Canonicals and descriptions are handled in `BlockLayout.astro` / `BaseLayout.astro`.
- `/resources` renders a visible human page and machine-readable JSON companion.
- `/resources` includes CollectionPage JSON-LD and item-level `SoftwareApplication` / `LearningResource` entries.
- `/resources.json` is CORS-open from the route handler and now from deploy headers.
- Astro sitemap output includes `https://pointcast.xyz/resources/`.
- The site has multiple LLM-friendly entry points: `/agents.json`, `/for-agents`, `/llms.txt`, `/llms-full.txt`, `/blocks.json`, `/archive.json`, `/feed.json`.
- `robots.txt` explicitly welcomes search and LLM crawlers and points them at the high-signal surfaces.

## Risks / Findings

- Publish automation is blocked locally because the GitHub CLI is not installed (`gh` command missing). The GitHub publish skill expects `gh --version` and auth before pushing/opening a PR.
- The worktree is heavily dirty with unrelated edits. Any publish must stage hunks carefully so the resources/SEO changes do not accidentally ship unrelated work.
- `npm run dev` currently fails with a pre-existing Vite polyfill issue: `exports is not defined` in `node_modules/util/util.js`. `npm run preview` works from the built output.
- Generated HTML audit found 0 pages missing `<title>`, 17 missing meta descriptions, 31 missing canonical links, and 192 missing `og:image` tags. The largest clusters are legacy post HTML files, `/tv/*` station pages, and `/sparrow/*` reading-mode pages.
- Several route families are intentionally experimental and now appear in the sitemap (`/admin/*`, `/auth/`, `/drum/click/`, many lab surfaces). Decide later whether all of them should remain indexable.
- `/resources` currently uses the shared default OG image. A custom resource OG card would improve social unfurls but was left out to avoid generating unrelated image churn.

## Recommended Next Moves

- Install/authenticate `gh` or publish via the existing deployment path, then push only the scoped resources + SEO/GEO/LLM changes.
- After deploy, test `https://pointcast.xyz/resources`, `https://pointcast.xyz/resources.json`, `https://pointcast.xyz/llms.txt`, `https://pointcast.xyz/llms-full.txt`, `https://pointcast.xyz/robots.txt`, and sitemap inclusion.
- Submit or ping changed URLs via the existing search-console/IndexNow flow once the production URL is live.
- Fix the dev-server polyfill error so future browser QA can use Astro dev, not only preview.
- Add a small URL-inventory check that fails the build when `/agents.json`, `/llms.txt`, robots comments, and `_headers` drift from first-class routes.

## Source Notes

- Google Search Central emphasizes crawlable content, useful links, descriptive URLs, sitemaps, and structured data that represents visible page content.
- The llms.txt proposal favors concise Markdown with links to richer LLM-oriented files.
- IndexNow can notify search engines of changed URLs once an ownership key is hosted and configured.
