# Codex Review: Tonight Stack Agent-Readable Pass

Review basis: `origin/main@a071d42` after the 2026-05-07 stack. This checkout is
currently on a feature branch with a different local `src/pages/archive.astro`,
so archive citations below refer to the shipped `origin/main` file.

Scope: read-only review of Studio publish/read/share, Home v2027 operating mode,
Archive Wave 2, and `/agents.json` integration. No source fixes were made.

## TL;DR

1. High impact: publish the Studio contract where cold agents will find it.
   `/api/studio-publish` GET currently returns only one prose `docs` string, and
   `/agents.json` does not advertise Studio publish/read/share at all. Add a
   JSON Schema or schema-like descriptor, expose it from the endpoint or a
   stable route, and list it in `/agents.json`.

2. High impact: harden Studio publish before broad agent use.
   The endpoint is unauthenticated, CORS-open, accepts up to 8 MB by
   `content-length`, stores records for one year, and has no rate limit. Add a
   smaller machine-publish profile, finite numeric/range checks, per-photo caps,
   quota/rate limiting, and collision-safe IDs.

3. High impact: fix Studio share unfurls and rendering fidelity.
   Share pages point `og:image` to `/studio-og.png`, but no matching asset or
   route exists on `origin/main`. Animated share pages also do not preserve layer
   scale/rotation the way the editor does. Ship either a real generic OG asset
   immediately or a per-composition image route, then align the share renderer
   with Studio's transform variables.

4. Medium impact: expose operating mode as first-class agent data.
   `src/data/operating-mode.json` already declares
   `https://pointcast.xyz/operating-mode.schema.json`, but no public JSON route
   or schema route exists. Add `/operating-mode.json`, add the schema, and
   advertise both in `/agents.json`.

5. Medium impact: bring `/archive.json` up to Archive Wave 2 parity.
   HTML has month markers, jump nav, and three density tiers. JSON only groups
   stripped block entries by month. Add month metadata and tier fields, and
   consider `?since=YYYY-MM` / `?from=YYYY-MM&to=YYYY-MM` for agent slices.

## 1. `/api/studio-publish` POST

### Baseline

- The happy path is clear in code comments: `POST { tpl, bg, filter, anim,
  layers, caption? }` writes to `PC_STUDIO_KV` and returns `{ id, viewUrl,
  remixUrl }` (`functions/api/studio-publish.ts:4`-
  `functions/api/studio-publish.ts:6`). KV binding failure is explicit at 503
  (`functions/api/studio-publish.ts:146`-`functions/api/studio-publish.ts:148`).

- The core enums are closed over Studio values
  (`functions/api/studio-publish.ts:50`-`functions/api/studio-publish.ts:52`),
  and records are `{ id, createdAt, composition }` with one-year TTL metadata
  (`functions/api/studio-publish.ts:162`-`functions/api/studio-publish.ts:173`).

### Agent readability

- A cold agent cannot derive the full request format from GET status.
  The GET response includes only:
  `docs: 'POST { tpl, bg, filter, anim, layers, caption? } ...'`
  (`functions/api/studio-publish.ts:135`-`functions/api/studio-publish.ts:141`).

- Missing from GET status: enum values, layer variants, numeric ranges, limits,
  examples, error reasons, TTL policy, and follow-up read/share URLs. Expand GET
  into a service descriptor and add a canonical schema at
  `/api/studio-publish/schema.json` or `/studio-publish.schema.json`, linked
  from both GET and `/agents.json`.

### Validation gaps

- Numeric fields only check `typeof === 'number'`; they do not require finite
  values or ranges (`functions/api/studio-publish.ts:96`-`functions/api/studio-publish.ts:99`).
  Add `Number.isFinite` and bounds for `x`, `y`, `scale`, and `rotate`.

- Photo validation accepts any string that starts with `data:image/`
  (`functions/api/studio-publish.ts:103`-`functions/api/studio-publish.ts:104`).
  It should enforce allowed MIME types, base64 form, and per-layer byte limits.

- Text validation only requires `value` to be a string
  (`functions/api/studio-publish.ts:106`-`functions/api/studio-publish.ts:108`).
  The Studio UI caps text input at 80 characters (`src/pages/studio.astro:293`-
  `src/pages/studio.astro:299`), but the API does not. Match the UI limit.

- Optional text presentation fields are not validated: `font`, `size`, and
  `color` are in the layer interface (`functions/api/studio-publish.ts:34`-
  `functions/api/studio-publish.ts:38`) but unchecked. Use Studio's font enum
  (`src/pages/studio.astro:75`-`src/pages/studio.astro:80`), size range
  (`src/pages/studio.astro:309`-`src/pages/studio.astro:312`), and color set
  (`src/pages/studio.astro:82`-`src/pages/studio.astro:85`).

- The endpoint accepts `caption`, but the Studio publish client does not send it
  (`src/pages/studio.astro:917`-`src/pages/studio.astro:925`). Either wire it
  through or remove it from the publish schema until Studio has a caption field.

### ID and KV semantics

- ID generation is timestamp plus five base-36 random characters via
  `Math.random()` (`functions/api/studio-publish.ts:72`-
  `functions/api/studio-publish.ts:75`) and there is no collision check before
  `PC_STUDIO_KV.put` (`functions/api/studio-publish.ts:169`-
  `functions/api/studio-publish.ts:173`). Use crypto randomness and retry on hit.

- Records expire after 365 days (`functions/api/studio-publish.ts:170`-
  `functions/api/studio-publish.ts:171`). That is fine if Studio shares are
  intentionally temporary, but the share page, JSON route, and OG metadata should
  say "expires after one year" so agents do not cite them as permanent blocks.

### Abuse / DoS vectors

- The body cap relies on the `content-length` header
  (`functions/api/studio-publish.ts:150`-`functions/api/studio-publish.ts:153`).
  If the header is absent or inaccurate, the code proceeds to `request.json()`
  (`functions/api/studio-publish.ts:155`-`functions/api/studio-publish.ts:157`).
  Cloudflare has platform caps, but the application-level 8 MB cap is bypassable
  as written.

- The endpoint is CORS-open for POST
  (`functions/api/studio-publish.ts:61`-`functions/api/studio-publish.ts:66`).
  That is good for agent use, but combined with no auth and one-year retention
  it makes the KV namespace a public 8 MB write sink.

- The UI caps uploads at 4 MB (`src/pages/studio.astro:684`-
  `src/pages/studio.astro:690`), but the API allows large data URLs until the
  body limit hits. Consider a machine profile: max body 512 KB, max layers 12,
  no `photo.dataUrl` initially, or hosted photo URLs only. Add rate limiting;
  `PC_RATES_KV` is already documented (`wrangler.toml:67`-`wrangler.toml:84`).

## 2. `/api/studio-block/{id}` GET

### Current behavior

- The endpoint returns `{ id, createdAt, composition }`, validates ID shape, and
  returns JSON 404 as `{ error: 'not-found', id }`
  (`functions/api/studio-block/[id].ts:1`-`functions/api/studio-block/[id].ts:8`,
  `functions/api/studio-block/[id].ts:39`-`functions/api/studio-block/[id].ts:45`).
  That is well-shaped for agents and crawlers that fetch JSON.

### Cache-control

- Current cache is `public, max-age=30, stale-while-revalidate=300`
  (`functions/api/studio-block/[id].ts:19`-`functions/api/studio-block/[id].ts:24`).
  Reasonable for first ship. Since IDs are immutable, a longer 200 cache is also
  safe unless you expect post-publish moderation/deletion to need fast effect.

- Recommendation: return `Last-Modified` sourced from `createdAt` and an `ETag`
  based on the KV value hash. This gives agents and browsers cheap conditional
  GETs without changing the payload.

- HEAD currently returns `new Response(null, { status: 200 })` after the KV get
  (`functions/api/studio-block/[id].ts:44`-`functions/api/studio-block/[id].ts:47`).
  It drops the JSON helper headers, CORS, cache-control, content type, and any
  future validators. Have HEAD share the same headers as GET.

## 3. `/studio/share/{id}` Pages Function

### Escaping and script inlining

- `escapeHtml` covers `&`, `<`, `>`, quotes, and apostrophes
  (`functions/studio/share/[id].ts:62`-`functions/studio/share/[id].ts:69`).
  It is used for title, description, canonical URL, JSON alternate URL, visible
  ID, and metadata (`functions/studio/share/[id].ts:114`-
  `functions/studio/share/[id].ts:128`, `functions/studio/share/[id].ts:232`-
  `functions/studio/share/[id].ts:234`).

- The inline composition JSON is `JSON.stringify(comp).replace(/</g, '\\u003c')`
  (`functions/studio/share/[id].ts:105`-`functions/studio/share/[id].ts:107`).
  That blocks `</script>` breakout. I would still move state to
  `<script type="application/json" id="studio-state">` or a shared serializer.
  The share page does not revalidate KV data, so publish validation is the
  security boundary.

### Rendering fidelity bug

- Studio preserves scale/rotation for animated layers by setting CSS variables
  and transform (`src/pages/studio.astro:532`-`src/pages/studio.astro:542`) and
  using those variables in animation keyframes (`src/pages/studio.astro:1327`-
  `src/pages/studio.astro:1349`).

- Share page keyframes do not use layer scale/rotation variables
  (`functions/studio/share/[id].ts:198`-`functions/studio/share/[id].ts:227`).
  The script only sets inline transform when `state.anim === 'static'`
  (`functions/studio/share/[id].ts:264`-`functions/studio/share/[id].ts:270`).
  Result: non-static share pages drop layer scale/rotation compared with Studio.

- Recommendation: set `--s` and `--r` on each share layer and copy the Studio
  keyframes, or always compose transform with CSS variables.

### Open Graph completeness

- The current tags cover type, title, description, URL, image, and Twitter card
  (`functions/studio/share/[id].ts:117`-`functions/studio/share/[id].ts:125`).

- The image is a generic fallback at `${origin}/studio-og.png`
  (`functions/studio/share/[id].ts:99`-`functions/studio/share/[id].ts:106`).
  I found no `studio-og.png` asset or Studio OG route in `origin/main`; this
  likely makes share unfurls image-less today.

- Ship a real generic asset now if per-composition OG is not ready. Then add
  `/studio/share/{id}/og.png` or `/api/studio-og/{id}.png`. Also add
  `og:site_name`, `og:image:alt`, dimensions, and `twitter:image:alt`; dimensions
  can come from `TPL_DIMS` (`functions/studio/share/[id].ts:44`-
  `functions/studio/share/[id].ts:50`).

### Robots and structured data

- There is no robots directive in the share page head
  (`functions/studio/share/[id].ts:111`-`functions/studio/share/[id].ts:129`).
  Pick a policy explicitly:
  `index,follow,max-image-preview:large` if shares are public artifacts, or
  `noindex,follow` if they are mostly ephemeral private links.

- 404 HTML has status 404 and escapes the ID
  (`functions/studio/share/[id].ts:89`-`functions/studio/share/[id].ts:96`,
  `functions/studio/share/[id].ts:317`-`functions/studio/share/[id].ts:321`).
  Add `<meta name="robots" content="noindex">` to the 404 HTML.

- Add JSON-LD `CreativeWork` on 200 responses. The KV record has `createdAt`
  (`functions/api/studio-publish.ts:162`-`functions/api/studio-publish.ts:167`),
  but the share renderer only passes `parsed.composition`
  (`functions/studio/share/[id].ts:339`-`functions/studio/share/[id].ts:346`).
  HEAD is accepted but returns a full HTML response path
  (`functions/studio/share/[id].ts:313`-`functions/studio/share/[id].ts:353`).
  Mirror GET headers with an empty body for HEAD.

## 4. Home v2027 + `operating-mode.json`

### Current state

- Home imports `src/data/operating-mode.json` at build time
  (`src/pages/index.astro:33`-`src/pages/index.astro:37`) and renders
  `updatedAt`, `updatedBy`, and every `inFlight` row
  (`src/pages/index.astro:142`-`src/pages/index.astro:166`).

- The data file already declares a public schema URL:
  `"https://pointcast.xyz/operating-mode.schema.json"`
  (`src/data/operating-mode.json:1`-`src/data/operating-mode.json:5`).
  No matching schema route or static file exists on `origin/main`.

- No `/operating-mode.json` route exists on `origin/main`; only the source data
  file exists. Agents therefore need to scrape HTML or fetch the repository to
  get the operating-mode state.

### Findings

- Formalize `inFlight` now. The shape is small, stable, and directly operational:
  `id`, `title`, `kind`, `ref`, `url`, `owner`, `stage`
  (`src/pages/index.astro:82`-`src/pages/index.astro:96`).

- Publish `/operating-mode.json` as the canonical runtime surface. Include
  `$schema`, `updatedAt`, `updatedBy`, `note`, `inFlight`, and maybe
  `links.home`, `links.tasks`, `links.agents`.

- Add `/operating-mode.schema.json`. Treat `kind`, `owner`, and `stage` as enums
  so agents do not invent incompatible status labels.

- Tonight's source data is already stale relative to the stated stack: PRs 464,
  467, and 460 are still marked `stage: "review"`
  (`src/data/operating-mode.json:7`-`src/data/operating-mode.json:33`), and
  Archive Wave 2 is still queued
  (`src/data/operating-mode.json:34`-`src/data/operating-mode.json:42`).

- Home's archive teaser also says Wave 2 "lands" in the future even though
  Archive Wave 2 is on `origin/main@a071d42`
  (`src/pages/index.astro:239`-`src/pages/index.astro:249`).

## 5. Archive Wave 2

### HTML behavior

- The shipped HTML implements the stated three-tier model:
  `tierForBlock` returns `full`, `compact`, or `deep`
  (`src/pages/archive.astro:42`-`src/pages/archive.astro:50` on
  `origin/main@a071d42`).

- Month groups carry `key`, labels, blocks, latest/oldest, count, and tier
  (`src/pages/archive.astro:60`-`src/pages/archive.astro:77` on
  `origin/main@a071d42`).

- The rendered month section exposes tier in the class name and month key in
  `data-month` / `id`
  (`src/pages/archive.astro:246`-`src/pages/archive.astro:252` on
  `origin/main@a071d42`).

- The three density renderers are separate:
  full cards (`src/pages/archive.astro:269`-`src/pages/archive.astro:296`),
  compact rows (`src/pages/archive.astro:298`-`src/pages/archive.astro:330`),
  and deep rows (`src/pages/archive.astro:332`-`src/pages/archive.astro:358`),
  all on `origin/main@a071d42`.

- Jump nav and hash routing are present in HTML
  (`src/pages/archive.astro:371`-`src/pages/archive.astro:388`,
  `src/pages/archive.astro:511`-`src/pages/archive.astro:531` on
  `origin/main@a071d42`).

### JSON parity

- `/archive.json` does not yet match the Wave 2 HTML shape. It groups by UTC
  month and returns stripped entries with `id`, `url`, `channel`, `type`,
  `title`, and `timestamp`
  (`src/pages/archive.json.ts:17`-`src/pages/archive.json.ts:33`).

- Missing from JSON: month label, short label, anchor ID, month count,
  latest/oldest summary, group tier, per-block tier, `dek`, HTML href parity,
  and jump-nav metadata.

- The JSON payload only exposes `byMonth` plus broad links
  (`src/pages/archive.json.ts:42`-`src/pages/archive.json.ts:61`).
  That is useful for cadence reasoning, but not equivalent to what HTML shows.

- Recommendation: add a `months` array alongside `byMonth` rather than replacing
  `byMonth`. Agents can then choose stable keyed lookup or ordered month
  traversal.

### Query filters

- `GET` currently takes no request argument and therefore ignores query params
  (`src/pages/archive.json.ts:13`-`src/pages/archive.json.ts:15`).

- A `?since=2026-04` filter is worth adding, but I would make it month-aware:
  `?since=YYYY-MM` for inclusive lower bound and `?from=YYYY-MM&to=YYYY-MM` for
  bounded slices. Agents often need "what changed since my last crawl" more than
  the full archive.

- Keep `/archive.json` full by default. Add `links.examples` with the slice URLs.

## 6. `/agents.json` integration

### Current integration

- `/agents.json` is explicitly intended to map the whole site in one request
  (`src/pages/agents.json.ts:1`-`src/pages/agents.json.ts:11`).

- It advertises `/archive.json` in the JSON endpoint map
  (`src/pages/agents.json.ts:248`-`src/pages/agents.json.ts:257`), but it does
  not advertise `/operating-mode.json`.

- Its API map includes older write/read APIs such as `/api/ping`, `/api/publish`,
  `/api/drop`, `/api/poll`, and `/api/talk`
  (`src/pages/agents.json.ts:316`-`src/pages/agents.json.ts:327`), but does not
  include `/api/studio-publish` or `/api/studio-block/{id}`.

- Its human endpoint map includes `/archive`, `/briefs`, `/explore`, `/wire`,
  and many other surfaces (`src/pages/agents.json.ts:129`-
  `src/pages/agents.json.ts:165`, `src/pages/agents.json.ts:228`-
  `src/pages/agents.json.ts:246`), but does not list `/studio` or
  `/studio/share/{id}`.

- The retrieval order tells agents to use `/agents.json`, `/llms.txt`,
  `/llms-full.txt`, `/areas.json`, `/blocks.json`, and `/feed.json`
  (`src/pages/agents.json.ts:741`-`src/pages/agents.json.ts:756`). It should add
  `/operating-mode.json` once published.

- The CORS inventory omits the new Studio and operating-mode surfaces
  (`src/pages/agents.json.ts:759`-`src/pages/agents.json.ts:772`).

### Recommended additions

- Add `endpoints.human.studio`, `endpoints.human.studioShare`,
  `endpoints.json.operatingMode`, `endpoints.schemas.operatingMode`,
  `endpoints.schemas.studioPublish`, `endpoints.api.studioPublish`, and
  `endpoints.api.studioBlock`. Add a compact `studio` object with `status`,
  `kvBound`, `ttlDays`, `publishableLayerKinds`, `shareUrlTemplate`,
  `remixUrlTemplate`, `readUrlTemplate`, and `agentGuidance`. Add the new routes
  to `cors.applies` once headers are verified.

## Follow-Up Sprint

### PR 1: Studio agent contract and abuse guardrails

- Add `/api/studio-publish/schema.json` or a static schema route.
- Expand GET `/api/studio-publish` into a structured descriptor.
- Validate finite ranges, text/photo fields, ID generation, collision retry, and
  rate limiting.

### PR 2: Studio share metadata and render fidelity

- Ship a real `/studio-og.png` immediately, or route `og:image` to a generated
  per-composition image endpoint.
- Preserve animated layer scale/rotation by copying Studio's CSS variable
  transform model into the share function.
- Add robots policy, JSON-LD `CreativeWork`, `og:image:*` details, Twitter alt,
  `Last-Modified`, and correct HEAD behavior.

### PR 3: Agent discovery surfaces

- Publish `/operating-mode.json` and `/operating-mode.schema.json`.
- Update `/agents.json` with Studio, Studio schema, Studio share/read templates,
  and operating-mode links.
- Extend `/archive.json` with Wave 2 month/tier metadata and slice examples.
