# Release sprint — v2.2 → public launch

**Window:** 2026-04-20 (Mon) through ~2026-04-27 (Mon) · 7 focus days.
**Owner:** Mike + cc + Codex + Manus.
**Author:** cc, filed 2026-04-19 21:00 PT per Mike's 20:55 PT directive: *"set up the next sprint, create a big development and release sprint, check on codex, get manus working, start to also think about a go to market strategy, jump right in go."*

---

## Summary

Today shipped **31 improvements** in a single session — identity arc kickoff (`/profile` v0, VisitorHereStrip, TELL panel, visitor.ts lib), broadcast mode (`/tv` with daily drop / live polls / presence constellation), daily ritual (`/today` + `/today.json` + FreshStrip routing), 100-mile lens (`/local` + `/local.json`), mood primitive arc complete (atlas + filters + atlas-JSON + 7 TodayStrip chips including TERM). Five substantive Codex briefs filed (Pulse, STATIONS, YeePlayer v1, TrackLab, VideoLens). Mood/Voice/companions/schema primitives all landed.

The next 7 days move from "cc shipping in isolation" to **public launch-ready**.

---

## Phase 1 — Identity arc (Mon 04-20, ~1 day cc-time)

**Goal:** A visitor who connects a wallet on any device sees the same profile, history, and state as they would on any other. Server-side memory replaces localStorage-only.

**Gated on Mike's 4 identity decisions** (chat 2026-04-19 20:05 PT pending):
1. URL: `/profile` (✓ defaulted — dashboard shipped 20:58), `/you`, `/me`?
2. Non-wallet visitors: profile page or connect-required?
3. Handle/name override visible publicly, or private?
4. Sequencing: server-sync first, or more polish on `/profile` client-only first?

**Tasks (cc, after decisions land):**
- [ ] Create `PC_IDENTITY_KV` namespace via `wrangler kv namespace create`.
- [ ] Write `functions/api/identity/log.ts` — POST endpoint accepting `{ action, data }` + session header, writes keyed on wallet-address-or-session.
- [ ] Modify every client-side `localStorage.setItem('pc:*', ...)` call to also POST to `/api/identity/log` when wallet is connected.
- [ ] Update `/profile` to fetch from `/api/identity/{address}.json` on wallet-connect; merge remote with local on first sync.
- [ ] `/api/identity/{address}.json` read endpoint — returns aggregated log for that wallet.
- [ ] Masthead wallet chip → link to `/profile`, render "Hello {name} · {N votes}" when wallet matches a known handle.
- [ ] Specific Mike-address → `Hello Mike`. Default wallet → short form. Agent UA → name.

**Deliverables:** Profile page syncs across devices. Dashboard reflects real activity history. Wallet = identity.

**Budget:** 2-3 ticks cc-time.

---

## Phase 2 — Codex delivery (Tue-Wed 04-21/22, ~2 days Codex-time)

**Status check on 5 briefs filed 2026-04-19 17:20-18:15 PT:**

| # | Brief | Budget | Deliverables expected | Current status |
|---|-------|--------|----------------------|----------------|
| 1 | Pulse (tap-tempo mini-game) | 2-4h | Architecture doc + DO + TV page + phone controller | ⏳ No artifacts yet (as of 21:00 PT) |
| 2 | STATIONS mode on /tv | 2-4h | Arch doc + SSG/SSR decision + station coords + weather proxy | ⏳ No artifacts yet |
| 3 | YeePlayer v1 multiplayer | 3-5h | Arch doc + DO (or share base w/ Pulse) + /tv/yee/[id] + phone controller | ⏳ No artifacts yet |
| 4 | TrackLab (YouTube → beats) | 4-8h | Arch doc + /tracklab UI + onset detection + save-as-block endpoint | ⏳ No artifacts yet |
| 5 | VideoLens (analysis API) | 6-10h | Arch doc + /api/videolens + panel component + demo on 0262 | ⏳ No artifacts yet |

**Check-in plan:**
- **Tue 04-20 morning:** cc checks `docs/reviews/` + `functions/api/` for any Codex artifacts. If 0/5 landed: chat Mike to verify Codex is actively working / tier isn't throttling / tasks aren't stuck.
- **If 1-2/5 landed by Tue PM:** continue queue, cc reviews + merges.
- **If 3+/5 landed by Wed:** celebrate + start re-stocking (track authoring follow-ups, /glossary.json machine mirror, mood-editor UI).

**Codex-priority re-ordering for Mike to confirm:**
The original filing order was Pulse → STATIONS → YeePlayer v1 → TrackLab → VideoLens. If Codex has limited bandwidth, cc recommends:
1. **STATIONS** first (smallest scope, highest immediate visible impact on /tv)
2. **VideoLens** (unlocks content enrichment on every WATCH block)
3. **Pulse** (novel multiplayer primitive, pairs well with STATIONS on /tv)
4. **YeePlayer v1** (builds on Pulse's DO)
5. **TrackLab** (largest scope, best done when Codex has unblocked time)

**cc role during Codex work:**
- Review any Codex PRs within a tick of being opened
- Keep shipping unblocked cc work (identity arc, /profile polish, content) in parallel
- Not pre-empt Codex's files; if cc needs to ship something adjacent, coordinate in chat

---

## Phase 3 — Manus reactivation (Mon-Tue 04-20/21)

**Manus brief from this morning:** `docs/briefs/2026-04-19-manus-platform-matrix.md`. Status: no artifacts yet in `docs/manus/`.

**New Manus queue (filed as sibling briefs):**

### Manus M-1 — Complete the platform matrix (started 04-19)
Original scope: rows for Apple TV / Roku / Google TV / Android TV / Fire TV / Samsung / LG / Chromecast / AirPlay / game consoles. Due: by Tue 04-21 EOD.

### Manus M-2 — Cloudflare Email Routing setup
Execute `docs/setup/email-pointcast.md` Step 1 (CF Email Routing, ~10 min dashboard work):
- Enable Email Routing on pointcast.xyz
- Create addresses: `hello@`, `mike@`, `claude@`, optional `*@` catch-all
- All route to `mhoydich@gmail.com`
- Verify Gmail destination, log any blockers
- Due: by Mon 04-20 EOD.

### Manus M-3 — Resend account + DNS verification
Step 2 of the same playbook. Signup, add domain, add MX/SPF/DKIM records to Cloudflare DNS, generate API key, bind as `RESEND_API_KEY` Pages secret.
Due: by Tue 04-21 EOD.

### Manus M-4 — Launch-day ops checklist
Before public launch (Phase 4 launch-day, target Fri 04-24):
- Verify GSC + Bing Webmaster Tools property ownership for pointcast.xyz
- Submit sitemap to both
- Submit to IndexNow (already wired, just run)
- Verify Farcaster Frame unfurls correctly on Warpcast for `/`, `/b/0320`, `/drum`, `/battle`
- Verify Twitter card unfurls on x.com for same URLs
- Verify iMessage LinkPresentation renders the og image
- Check analytics / event tracking (if any) is live and collecting

Due: by Thu 04-23 EOD.

**Manus brief file:** `docs/briefs/2026-04-19-manus-launch-ops.md` (cc files alongside this plan).

---

## Phase 4 — Go-to-market (Wed-Mon 04-22 to 04-27)

See dedicated doc: `docs/gtm/2026-04-19-draft.md` (cc files alongside this plan).

**Headline positioning:** PointCast is **the first agent-native living broadcast** — a site where AI agents, humans, and crypto-native creators congregate around daily rituals (daily drop, live polls, broadcast mode) with identity and memory that carries across visits.

**Five launch wedges:**
1. **Agent-native**: GPTBot / ClaudeBot / PerplexityBot / Atlas / Google-Extended all get a stripped-HTML variant + `/agents.json` manifest. First-mover credibility.
2. **Daily ritual**: `/today` daily drop + HELLO presence points + 7-chip TodayStrip rotation = reason to return.
3. **Communal broadcast**: `/tv` with AirPlay / Chromecast / HDMI paths → phone-as-controller primitive. Novel shape.
4. **Crypto-native**: Visit Nouns FA2 on Tezos mainnet (0-1199, free mint, gas only). Part of the nouns-verse economy.
5. **Local + commerce tie**: El Segundo anchor + `shop.getgoodfeels.com` routed commerce. Real-place rooting.

**Launch moments (in order):**
- **04-22 Wed:** Soft launch on Farcaster (Warpcast) with a Frame cast of `/tv`. Target: first 25 visitors via cast.
- **04-23 Thu:** X/Twitter launch thread showcasing TodayStrip + VisitorHereStrip + identity arc. Target: 100 visitors.
- **04-24 Fri:** Product Hunt launch ("PointCast — a living broadcast where agents and humans congregate daily"). Target: 500 visitors + top-5 of the day.
- **04-25 Sat:** Nouns community post (prop.house or nouns.camp) with Visit Nouns FA2 framing. Target: 50 Visit Noun mints.
- **04-26 Sun:** HackerNews Show HN: "An agent-native website where AI crawlers get their own profile pages." Target: front page or bust.
- **04-27 Mon:** Week-one retro + /sprints public update.

**Success metrics:** see GTM doc.

---

## Phase 5 — Measurement + iteration (ongoing after 04-27)

**Metrics Mike can see at a glance:**
- `/now.json` — current visitor count (already live via presence WS)
- `/profile` — per-visitor activity (just shipped)
- `/sprints` — cc's shipment log (already live)
- Future: `/metrics.json` — aggregated site metrics (visitors/day, HELLO distribution, polls participation, drops collected aggregate). One tick when Mike wants it.

**Iteration cadence:** Continue the hourly :11 cron for cc ticks. Codex + Manus get their own check-in cadence (Mon + Wed + Fri email status via the forthcoming email pipeline).

---

## Risks + mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Codex ships 0/5 by Wed | Medium | Mike diagnoses tier/throttle; cc can implement 1-2 of the briefs directly if Codex is unavailable |
| Manus doesn't execute email ops | Medium | Mike runs the playbook himself (~10 min); email launch slips to Phase 5 if needed |
| Identity arc needs schema changes that ripple | Low | Additive-only design; old localStorage stays as write-through cache |
| Public launch traffic overwhelms presence DO | Low | DO is rate-limited; degrades gracefully; `/tv` and `/profile` tested offline |
| Good Feels compliance flag on a platform (e.g. Apple TV store) | Low (no native launch Phase 4) | Web-first strategy sidesteps entirely |
| Rotation-algorithm bug on daily drop (mid-day shift) | Known | Mike greenlights option 1/2/3 from today's retro; cc ships within a tick |

---

## What success looks like by Mon 04-27

- `/profile` syncs across 2+ devices for at least one tester (Mike)
- At least 2/5 Codex briefs shipped and merged
- Email pipeline live (incoming + outgoing)
- Public launch completed across 5 channels
- Visitor count ≥ 100 unique across the week
- At least 1 non-Mike wallet connects and completes a daily drop
- `/for-agents` surfaces every new endpoint shipped in the sprint
- One sprint-recap block authored by cc naming what actually landed

---

## Dependencies + unblocks

**Blocks this sprint can be started on right now (Mike doesn't need to decide anything):**
- Phase 2 (Codex check-in Tue AM)
- Phase 3 Manus M-1 (platform matrix completion)
- Phase 4 GTM draft refinement

**Blocks waiting on Mike:**
- Phase 1 identity arc (4 decisions)
- Phase 4 launch dates (confirm or adjust 04-22 through 04-27)
- Rotation algorithm choice (keep sequential / KV-lock / hash-shuffle)
- Zone redesign (4 decisions from earlier chat)

---

## Filing

This plan lives at `docs/plans/2026-04-20-release-sprint.md`.

Sibling artifacts filed in the same tick:
- `docs/gtm/2026-04-19-draft.md` — go-to-market thinking
- `docs/briefs/2026-04-19-manus-launch-ops.md` — Manus's next task queue
- `docs/briefs/2026-04-19-codex-check-in.md` — Codex status-check + priority re-ordering
- `src/content/blocks/0321.json` — public announcement

— cc, 2026-04-19 21:00 PT, sprint `release-sprint-plan`

---

## Progress update — 2026-04-20 10:40 PT

Twelve hours into the sprint. Material progress worth recording.

### What actually shipped overnight + morning

- **Brief #2 STATIONS** — Codex shipped end-to-end (arch doc + 15 per-station routes + weather proxy + /tv 3-mode integration). Cross-platform big-screen broadcast live.
- **Brief #6 Presence DO upgrade** — Codex shipped the enriched-broadcast DO + the verify-pass PresenceBar patch (caught a 90-second-timeout regression in its own review). 7 files, +996 -231.
- **Brief #7 /here congregation page** — cc + Codex split. Codex wrote the snapshot endpoint + DO refactor; cc wrote HereGrid.astro + here.astro + for-nodes.astro + nodes registry. First feature delivered via MCP.
- **Presence DO finally bound** — the companion Worker `pointcast-presence` deployed. 3 new files in `workers/presence/`, root wrangler.toml updated, `functions/api/presence.ts` pruned. `/api/presence/snapshot` now returns real DO data.
- **Codex MCP integration online** — `codex mcp-server` via `~/Library/Application Support/Claude/claude_desktop_config.json`. `mcp__codex__codex` + `mcp__codex__codex-reply` are live tools. Brief #7 was the first feature built through it.
- **Multiplayer primitive** — `src/lib/multiplayer.ts` (base class + helpers for Pulse + YeePlayer v1 to extend). Codex aborted mid-turn; cc wrote it directly.
- **Editorial content** — blocks 0320 / 0321 / 0322 / 0323 (cc-voice pace+identity+codex-status+overnight-ship retros) and 0324 (Mike's Collab Clock directive, which turned out to already be wired via `/clock/[id]` route). New: 0325 (Kimi K2.6 field note), 0326 (Qwen 3.6 Max preview note), 0327 (presence DO online milestone).
- **New polls** — `how-to-contribute` (6 paths: node / guest block / federate / local / compute / polls), `ai-lineup-vibe` (model-combination preferences), plus `late-night-register` from overnight.
- **Removed Taner** from collaborators.ts per Mike's directive; updated codex + manus intros to current reality.
- **/for-nodes shipped** as the public "become a node" landing page. Registry (cc + codex + mike as initial nodes) + the 2-line agent-broadcast snippet + moderation-via-namespace-isolation explanation.
- **/collabs updated** — new "Ways to contribute" section with 6 concrete paths (broadcast as a node, guest block, federate, host local, donate compute, seed polls). Replaces the "TBD" energy with actual doors.

### Phase 2 status — Codex delivery revised

Original plan: 5 briefs by Wed 04-22. Reality: **2/10 shipped end-to-end (STATIONS + Presence DO), Brief #7 /here shipped with hybrid delivery, 7 briefs queued**. Codex queue now:

| # | Brief | Status | Notes |
|---|-------|--------|-------|
| 1 | Pulse tap-tempo | Queued | Depends on multiplayer.ts (shipped this morning). |
| 2 | STATIONS | ✅ shipped | Live at /tv/*. |
| 3 | YeePlayer v1 | Queued | Same dep as #1. |
| 4 | TrackLab | Queued | YouTube → beats. Substantial scope. |
| 5 | VideoLens | Queued | Largest. Maybe pivot to a concrete demo on block 0262. |
| 6 | Presence DO upgrade | ✅ shipped | Via Brief #6 + DO-worker deploy. |
| 7 | /here congregation | ✅ shipped | UI + backend + companion worker. |
| 8 | Multiplayer primitive | ✅ shipped | cc wrote base class; Codex will extend for Pulse/YeePlayer. |
| 9 | Audio-input YeePlayer | Queued | Mic onset detection. Good Pulse follow-up. |
| 10 | Analytics + share cards | Queued | Launch-ops infrastructure. |

**MCP pattern learned:** 60s timeout ceiling. Work around it by (a) lowering `model_reasoning_effort` to medium, (b) one-file-per-turn with self-contained prompts, (c) cc takes UI + client-state, Codex takes backend refactors. Writes persist even on MCP timeout — cc verifies via filesystem, fires next turn.

**What's missing for Codex-at-full-blast** (per Mike's 10:30 PT ask):

1. **Parallel MCP sessions** — multiple `codex()` calls fire concurrently. Risk: file conflicts. Mitigation: scope each session to disjoint paths OR run each in a git worktree. Worth experimenting.
2. **Queue file** — `docs/queue/codex.json` with status (ready/in-flight/shipped) per brief. cc pops one per tick; no mental-state drift between sessions.
3. **Brief sizing discipline** — the MCP timeout means "one atomic deliverable per brief" works better than "one full feature per brief." Sub-briefs like "write functions/api/foo.ts to do X" land in one MCP turn; "ship /foo end-to-end" doesn't.
4. **Automated verify** — Codex's step-5 verify pattern (self-diff-check) works when asked. Make it default: every Codex brief ends with a cc-dispatched "re-read your diff + respond with any regression you find" turn.
5. **Deploy bundling** — I currently build+deploy after every Codex ship. Could bundle 2-3 briefs into one deploy if I'm sure they're scoped cleanly.

### Phase 3 status — Manus ops

Manus hasn't fired this morning. Briefs filed at `docs/briefs/2026-04-19-manus-launch-ops.md` remain the queue. Mike will dispatch when he's in Manus chat. Cc can't drive Manus programmatically — it's Mike-initiated. Worth sending Mike a reminder to kick M-1 (platform matrix).

### Phase 4 — launch-week dates pending

Mike hasn't confirmed the Tue 04-22 → Mon 04-27 cadence. If today (Mon 04-20) was supposed to be Phase 1 identity-arc day, identity-arc actual work is behind — the morning ended up chasing Codex MCP setup + presence DO deploy instead. Not a bad trade: MCP + live presence both unblock phase 3+4 work that depended on them.

### Bucket of smaller asks from today's chat

- World clock / `/clock/{id}` — turned out to already exist. Block 0324 (Mike's) uses it. Route `/clock/0324` renders. Referenced from `/collabs`.
- "Definitive AI models resource" — blocks 0325 + 0326 are v0. Next step: a dedicated `/models` page aggregating across Claude / Codex / Kimi / Qwen / Gemini / GLM / DeepSeek / Llama / Grok. Candidate for a cc-only sprint (research + design + ship) or a Codex brief.
- Jason note — holding per Mike. No send until aligned.
- Whimsical extension — needs Whimsical desktop app installed. Pending Mike.

### Revised near-term target

Sub-goals for the next ~12h:
- Identity arc kickoff (Phase 1) — cc starts the KV binding + log endpoint, pending Mike's 4 decisions.
- Codex Brief #1 Pulse — first feature to extend multiplayer.ts. Good test of cc-scaffold / Codex-extend pattern.
- /models page — definitive AI resource. Can ship in one focused tick.
- Whimsical fix (Mike installs app, cc verifies).

— cc, 2026-04-20 10:45 PT (progress appended to release-sprint plan)
