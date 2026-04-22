# Codex sprint — 4 atomic projects (2 significant + 2 small)

**Author:** cc drafting for Codex (via `mcp__codex__codex` in this Cowork session, or via the full-blast CLI once Mike installs per `docs/setup/codex-full-blast.md`).
**Trigger:** Mike 2026-04-20 19:30 PT: *"create a next sprint with codex taking on a couple of significant and a couple of small projects."*
**Repo branch:** `feat/codex-sprint-{date}` (Codex creates; cc reviews + merges).
**Commit attribution:** `Co-Authored-By: Codex <codex@openai.com>` on every commit in this sprint.
**Compute policy:** low-reasoning fine for the smalls; high-reasoning preferred for the significants. If MCP times out at 60s, **do not assume failure** — check filesystem for expected file, proceed if it landed (this pattern is proven; tonight's PrizeCastChip shipped despite MCP timeout).

Ship order below is priority order. Smalls first = quick dopamine + proven-pattern warm-up; significants second = real build while reasoning budget is loaded.

---

## 1 · SMALL · Agent-skills SHA-256 hash build step

**Why:** `public/.well-known/agent-skills/index.json` has 10 skills each with `"sha256": "placeholder-until-digest-script-lands"`. That's a real bug — Agent Skills Discovery RFC v0.2.0 treats digests as integrity signals. Having placeholders visible in production weakens the isitagentready.com score and violates the spec.

**Deliverable:** `scripts/hash-agent-skills.mjs` (new file)

**Contract:**

```
Input:  public/.well-known/agent-skills/index.json (read current state)
Output: same file with each skill's `sha256` replaced by a real SHA-256 hex
        digest of the content fetched from that skill's `url` (or, for
        websocket skills where fetch doesn't apply, the SHA-256 of the
        URL string itself with a `#note: digest-of-url-not-content` line
        in the file header)
Side:   console.log a summary of skills processed + any fetch failures
```

**Implementation notes:**
- Use Node built-ins only (`node:crypto` for SHA-256, `node:fs`, `node:https` or `globalThis.fetch` if Node 20+).
- Skip WebSocket URLs (skills with `type === 'websocket'`) — hash the URL string instead of trying to fetch.
- Handle fetch failures gracefully — keep the old hash if present, or use URL-string hash as fallback, emit a warning.
- Run order: this script runs MANUALLY for now (add to `package.json` scripts as `hash:skills`). CI integration is a follow-up.

**Success criteria:**
- `node scripts/hash-agent-skills.mjs` runs in <10s.
- `public/.well-known/agent-skills/index.json` now has real hex digests (64 chars each).
- `isitagentready.com` check for agent-skills stops flagging placeholder digests.

**Scope bound:** single file. Do not add dependencies. Do not modify the JSON schema.

---

## 2 · SMALL · `/.well-known/oauth-authorization-server` honest-empty stub

**Why:** isitagentready.com flags `openid-configuration` AND `oauth-authorization-server` as missing. We deliberately skipped `openid-configuration` (would require fake issuer + endpoints = misleading). `oauth-authorization-server` per RFC 8414 lets us ship a parallel to `oauth-protected-resource` — "here's our auth server metadata; we have no auth server, here's the honest answer." Same pattern we used for oauth-protected-resource.

**Deliverable:** `public/.well-known/oauth-authorization-server.json` (new file)

**Contract:** a minimal valid RFC 8414 OAuth Authorization Server Metadata document, with:

- `issuer` — `https://pointcast.xyz`
- `authorization_endpoint`, `token_endpoint`, `jwks_uri` — **omit** (no auth server)
- `grant_types_supported` — empty array `[]`
- `response_types_supported` — empty array `[]`
- `scopes_supported` — empty array `[]`
- `service_documentation` — `https://pointcast.xyz/for-agents`
- A leading `"$comment"` field that explicitly says: "PointCast has no OAuth authorization server. All endpoints are open + CORS-permissive. This metadata is published so agents checking the well-known OAuth discovery paths get a clean 'no auth' answer instead of 404. If auth is ever added, this file will be populated with real endpoints."

**Also edit:**
- `public/_headers` — add a block for `/.well-known/oauth-authorization-server.json` with `Content-Type: application/json; charset=utf-8` + CORS + cache-control (match the pattern used for oauth-protected-resource).

**Success criteria:**
- `curl -sI https://pointcast.xyz/.well-known/oauth-authorization-server.json` returns `200 application/json`.
- File content validates as JSON and has required RFC 8414 fields.
- `isitagentready.com` stops flagging this surface.

**Scope bound:** two files max (the JSON + _headers edit). No Pages Function needed.

---

## 3 · SIGNIFICANT · `/quiz` — daily PointCast-lore quiz primitive

**Why:** Visitor-facing fun. Matches Mike's 2026-04-20 pivot (ping: "drum, collecting, fun, information, learning are to be important if we want people to participate"). One more reason for a visitor to come back tomorrow. Companion surface to `/cards` and `/drum/click`.

**Deliverables:**
1. `src/pages/quiz.astro` (new page)
2. `src/content/quiz/questions.json` (new, a curated pool of ~30 questions about PointCast, El Segundo, Tezos, Nouns, blocks, broadcasting, collaborators, compute ledger, cadence, drum, federated compute — tone: playful + fact-based, not trick questions)
3. Optional: `src/lib/quiz.ts` (shared helpers if the logic gets tight)

**Mechanics:**
- **Daily quiz:** one fresh question per day selected via day-of-year seed from the pool. Same question all day for everyone who visits.
- **4 multiple choice answers**; one correct.
- **Local state:** `pc:quiz:answers` = `Record<date, { qId, choice, correct }>`. `pc:quiz:streak` = consecutive days answered correctly.
- **Flow:** question displays → reader picks → immediate reveal of correct answer + a 1-paragraph "why" explanation → "come back tomorrow for #N+1" + streak badge.
- **Previous questions:** a scrollable list below today's question shows every question the reader has answered locally, with ✓/✗ marks. Wrong answers can be retried (no credit; just learning).

**UX constraints:**
- Mobile-first. Tap targets ≥ 48px.
- Respects `prefers-reduced-motion` (no reveal animation if user prefers).
- Questions bank is append-only; never remove a question that's been answered by anyone (stable `qId`s).
- Answers don't post to any server. Fully local. No leaderboard in v0 (flagged as follow-up).

**Question bank starter (cc will populate 30 questions if Codex asks; for this brief, include at least 10 seeded questions from this set):**

Topic areas:
- PointCast basics (/ping, /compute, /cards, /drum, /collabs)
- Blocks + channels (FD, GF, GDN, SPN; block ID conventions)
- El Segundo local (Waldos origin, Good Feels, local geography)
- Tezos (FA2, objkt, Beacon, Mike's contract KT1...)
- Nouns (CC0, 1200+ supply as of 2026-04, noun.pics CDN)
- Federated compute (signature bands, x402 schema, Gil's compute-is-currency)
- Codex / cc / agents (MCP, Chronicle, atomic briefs)
- Drum (BPM, pentatonic, cookie-clicker upgrade ladder thresholds)

**Integration:**
- Add `QUIZ · DAILY` entry to `src/components/TodayOnPointCast.astro` POOL so it rotates into the home strip.
- Link from `src/pages/contribute.astro` "What you get back" section as a way visitors compound engagement.

**Styling:**
- Match the /cards page palette shape — clean whites + warm accents, subtle color from the quiz's category (tezos questions = violet accent, drum questions = amber, etc.).
- Use `--pc-font-mono` for labels + metadata, `--pc-font-sans` for question body + choices.

**Success criteria:**
- `npx astro build` passes clean.
- Visiting `/quiz` renders today's question with 4 choices.
- Tapping a choice reveals correct answer + explanation + streak update.
- Refresh → same question (not a new one mid-day).
- Next day → new question (date-seeded).
- Answer log visible below today's question, grouped by day.
- Zero network dependencies beyond Astro's static output.

**Scope bound:** 2-3 files. Total under 600 lines. No new dependencies. No server state.

**Reference shape:** look at `src/pages/cards.astro` (shipped 2026-04-20 by cc) for the single-page visitor-fun pattern — similar flow, similar palette, similar localStorage-primary approach.

---

## 4 · SIGNIFICANT · HeroBlock + ActionDrawers for Home Phase 2

**Why:** Approved execution of Option A home rethink (docs/plans/2026-04-20-home-rethink.md). Phase 1 (PulseStrip) shipped tonight; Phase 2 is HeroBlock (one big daily editorial pick) + ActionDrawers (bottom-of-home accordions for ping/drop/polls/contribute). These are the visible moves that make the home read like a newspaper front page instead of a dashboard.

**Deliverables:**
1. `src/components/HeroBlock.astro` (new)
2. `src/components/ActionDrawers.astro` (new)
3. Edits to `src/pages/index.astro` — insert HeroBlock after masthead (above PulseStrip) + ActionDrawers at the bottom of the block grid area

### HeroBlock spec

**Behavior:**
- Renders ONE block as a full-width editorial card.
- Which block? **Daily deterministic pick** from a curated pool (use the same date-seeded Fisher-Yates pattern `src/components/TodayOnPointCast.astro` uses).
- Pool lives inline in `HeroBlock.astro` (array of block IDs); initial pool: `['0336', '0331', '0330', '0328', '0325', '0322', '0320']` — skewed toward hero-worthy long-form blocks.
- Reads full block JSON from `src/content/blocks/{id}.json` at build time via `import.meta.glob`.
- Renders: noun image (large, 120-180px), kicker (channel · type · id), title (big serif), dek (3-4 lines), reading time, author chip, "open →" link to `/b/{id}`.

**Sizing:** ~420px tall on desktop, 280px on mobile. Full-width inside the page container.

**Styling:** match existing BlockCard aesthetic but more editorial-prominent. Subtle warm-paper background (`#fbfaf5`), amber left rule, dek styled as a newspaper lede.

### ActionDrawers spec

**Behavior:**
- Bottom-of-home accordion with 4 expandable drawers: `✎ ping · ✦ drop · ▸ polls · ✦ contribute`.
- Each drawer collapsed by default. Tap title → expand → shows the composer / content inline.
- **✎ ping** — reuse `<PingStrip />` markup inline (it's already composer-shaped — adapt its body into a drawer).
- **✦ drop** — reuse `<DailyDropStrip />` collect button + counter.
- **▸ polls** — inline view of `<PollsOnHome />` (or fallback: a link to `/polls`).
- **✦ contribute** — compact version of `/contribute` Way 01 (pledge composer) + a link out to the full page.

**Styling:** horizontal strip of 4 drawer buttons at collapsed state. Expanding opens the drawer BELOW the button row (stays in place, content flows). Each drawer has its own accent color (ping = amber, drop = green, polls = violet, contribute = blue).

**Mobile:** stack 2×2 on narrow screens.

### index.astro edits

- Insert `<HeroBlock />` after the masthead and BEFORE `<PulseStrip />`.
- Remove the existing `<PingStrip />`, `<DailyDropStrip />`, `<PollsOnHome />` from the inline home flow (they move into ActionDrawers).
- Keep `<NetworkStrip />` (promo), `<ComputeStrip />`, `<TodayOnPointCast />`, `<SportsStrip />` above the grid for now — Phase 3 handles further relocation.
- Insert `<ActionDrawers />` at the very bottom, AFTER the BlockReorder grid + FreshDeck.

**Success criteria:**
- `npx astro build` clean.
- Home renders with HeroBlock visible above the fold (especially on mobile).
- The 4 drawers expand/collapse with their inline content.
- Daily rotation of HeroBlock verified by setting `new Date()` forward a day in devtools.
- Total home scroll to first BlockCard in the grid is < 2 mobile screens (currently ~4 before ActionDrawers absorbed some surfaces).

**Scope bound:** 2 new components, 1 edit to index.astro. Don't touch other strips in this ship. Don't refactor BlockCard. Don't create new routes. Total under 500 lines of Astro across the new files.

---

## Coordination + reporting

1. Codex creates feature branch, commits per-deliverable with `Co-Authored-By: Codex`.
2. After each deliverable lands, Codex echoes `DONE: {file-path}` to signal completion (so the MCP-timeout-don't-trust-return-code pattern has a filesystem marker to check).
3. cc reviews each as it lands, merges or requests tight change (single round only; if something's not right, cc ships the fix directly rather than another round-trip).
4. Each shipped deliverable gets a `ComputeEntry` in `src/lib/compute-ledger.ts` with `collab: 'codex'`, `signature: 'shy'` (hash script + oauth stub) or `'modest'` (HeroBlock) or `'healthy'` (quiz + ActionDrawers — the more multi-file ones).
5. Sprint retro lands at `docs/sprints/{date}-codex-sprint-next.md` when all 4 ships.
6. Ship-queue.ts gets 4 entries transitioning queued → in-flight → shipped in order.

---

## Why this mix

**Smalls first (hash script + oauth stub):** proven-pattern warm-up. Both are single-file atomic specs with clear I/O contracts. Match Codex's strength exactly. Low risk of timeout. Getting two quick wins validates the pipeline before the bigger work.

**Significants second:** /quiz is visitor-facing fun per the pivot — highest visible payoff per line of code. HeroBlock+ActionDrawers executes the approved Home Phase 2 plan — real editorial polish that affects every visitor to the home.

**Why not the autonomous cadence dispatcher?** Per Mike's 2026-04-20 pivot (block 0336): infrastructure is fine where it is; more visitors are the binding constraint. Cadence-tick cron can wait.

**Why not /here-as-a-room?** Touches the presence Durable Object + WebSocket wiring — risky for Codex without live testing. cc ships that directly in a later tick.

— cc, 19:30 PT (2026-04-20) · sprint brief for Codex; four ships; fire in order
