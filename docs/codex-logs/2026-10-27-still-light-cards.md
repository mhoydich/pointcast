# Still Light and Remembering — release handoff

Michael requested moving the prayer altar work onto PointCast, then clarified simple 2D mobile cards, interactive candles, peaceful bell/gong audio, 25 new artworks including fishing scenes, customizable bereavement cards, sharable images, digital-prayer research and a scoped shared prayer counter. Creative credit requested: Michael × Terra 6.1.

## Source and integration

- Repository: https://github.com/mhoydich/pointcast
- Branch: `codex/still-light-mobile-cards-20261027`
- Combined base: `ef4e4ae16176856e14eaf7e30f932e725c30ba23` (includes Sunny Side games).
- Existing prayer rooms remain; `/prayer-altars` gains links to these two rooms. No games or deployment-script source is changed. Unrelated draft/review holds remain intact.
- The earlier ChatGPT Site is a separate publication. It does not prove these PointCast routes are live.

## Experiences

- `/still-light/`: mobile candle, water and prayer cards; 25 artwork choices; optional gentle procedural bell/gong/bowl/chime; silence and motion controls; page-local name.
- `/remembering/`: occasion, intention, six authored messages, optional name/memory, 25 artworks, a candle and stoppable bell. Exact text preview and intentional copy/share; local PNG preparation/download and separate native image-share tap. Image exports reflow whitespace while preserving words. Input stays page-local unless deliberately shared/saved/copied.
- 25 distinct generated images, each with 1024×1536 and 480×720 WebP versions. Image generation used the available image generator. These are original AI-generated interpretations across graphic, watercolor, textile, collage, mosaic, patterned and fishing themes; no claim of endorsement or original work by named artists.
- `/api/prayer-overview`: approximate cumulative prayer actions and current-ISO-week drum altar tributes separately. The existing KV counters can lose concurrent updates; the API does not claim uniqueness or combine overlapping/incompatible totals. Unbound or failing storage reports unavailable.
- MCP `/api/mcp` tool `prayer_overview`: read-only aggregate view. No identifiers or recent entries. Fixed same-origin request, redirect rejection, timeout. New cards contribute only through a separate explicit button; no personal text is sent and uncertain POST outcomes are not retried.
- Research: `docs/notes/2026-10-27-still-light-digital-prayer.md`.

## Release state

Not live. No Cloudflare deployment credentials or authenticated deploy-machine connection are available in this environment. Existing GitHub access is authorized. A recent Pages workflow explicitly skipped deployment because its Cloudflare API token was absent. No credentials, services or security settings were created or changed. No deployment lock was bypassed.

Browser tools are unavailable in this session. Static mobile/accessibility review and DOM/audio-mock tests do not establish actual Safari/iPhone layout, audible quality, canvas rendering or native share-sheet behavior. Keep the PR draft until those checks and release access are available.

## Deployment handoff

1. On the existing authorized deployment machine, fetch `origin/main` and this branch, preserve newer changes, complete browser/mobile checks on the final combined tree, review and merge this PR. Preserve all unrelated holds.
2. Use only `scripts/deploy.sh` (default arguments) from the repository; it fetches current main, uses the existing shared lock and dedicated deployment worktree, runs the full build and integrity gates, and uploads. Do not use a manual Wrangler upload or an alternative lock path.
3. Run `npm run audit:publishing` and verify actual responses/served fingerprints for `/still-light/`, `/remembering/`, their JS/CSS and all 50 image assets, `/api/prayer-overview`, and the read-only MCP tool. Confirm the prior prayer rooms and `/games/` remain intact. Do not submit a test prayer to production just to check counts.
4. A merge or green workflow is not proof of publication. Report the verified live source SHA and URLs only after these checks.

Intended live URLs:
- https://pointcast.xyz/still-light/
- https://pointcast.xyz/remembering/
- https://pointcast.xyz/api/prayer-overview
- https://pointcast.xyz/api/mcp (tool: prayer_overview)

## Completed validation

- `NODE_USE_ENV_PROXY=1 npm run build`: passed on the final combined source, 3,765 Astro pages; SEO normalized 3,882 HTML files and game downloads prepared. The proxy variable uses the existing authorized network proxy; an initial run without Node proxy support failed on a remote fetch.
- 45 focused/regression tests passed: `tests/still-light.test.mjs`, `tests/remembering.test.mjs`, `tests/prayer-overview.test.mjs`, `tests/prayer-ledger.test.mjs`, `tests/prayer-playback.test.mjs`, `tests/prayer-evening-audio.test.mjs`, `tests/game-library.test.mjs`, `tests/sunny-side-games.test.mjs`.
- `npm run audit:agents`: passed.
- Built HTML: one main and one h1 per new page, correct canonical/portrait image metadata, 25 choices on each page, existing local JS/CSS/image references. All 50 built artwork files match source SHA-256, and full/small dimensions are 1024×1536 / 480×720.
- Independent static accessibility/privacy/audio/MCP review completed; identified issues were fixed. Real browser/mobile and audible QA remain blocked, not passed.
- No branch diff in games or the deployment script.
