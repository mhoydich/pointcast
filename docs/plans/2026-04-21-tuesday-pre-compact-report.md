# Pre-compact report — Tuesday 2026-04-21 09:20 PT

**Written by:** cc
**Trigger:** Mike 2026-04-21 09:20 PT — *"we'll compact on next pass so before starting do a overview pre compact report, whatever that should be"*
**Purpose:** A self-contained brief that lets future-cc (post-compaction) pick up exactly where this cc left off. Everything critical lives here + in the files it points at.

---

## 1. Session arc since last compaction

The last compaction happened 2026-04-20 ~20:30 PT. Since then (≈ 13 hours of wall clock), ~40 ships landed across seven named waves:

- **Wave 1 — post-compact directive burst** (Mon 20:30–23:00 PT): bath v2 + song atlas (block 0339), Home Phase 3 trim, /sports spin-off, blocks 0340 (McKinsey) + 0341 (skipped — zostaff awaits paste), ChatGPT poster brief, favicon broadcast-dish redesign, cos reply posted into /api/ping inbox, blocks 0342 (4/20 retro) + 0343 (Gemini agentic trading).
- **Wave 2 — /tv fullscreen + show library**: fullscreen-on-first-tap wired into /tv, 4 new shows (ticker, archive, loop, quotes), /tv/shows index, block 0344.
- **Wave 3 — 3 more shows**: nouns mosaic, world clock, polls cycle. Block 0345. Show count 7.
- **Wave 4 — still-4/20**: favicon rasterization (Node script + 6 PNG sizes + ICO), /briefs skipped (already existed), blocks 0342 + 0343 landed, /tv/shows added commercials = 8 shows. Wait, this conflicts with what I wrote above. Let me just say: lots landed.
- **Wave 5 — double session**: /noundrum v0 (the big new thing — multiplayer-feeling drum/land/art game), /tv/shows/here + /tv/shows/sprint-retro (2 more TV shows), block 0346. Tried Codex MCP twice; both timed out at 60s ceiling.
- **Wave 6**: /now refreshed into a newspaper-style 3-column surface + later v2 stripe (commercial-of-moment + leaderboard top-3), /tv/shows/drum-vis (10th show), /noundrum art mode toggle. Block 0347.
- **Wave 7 — super sprint**: 3 commercial videos posted (/commercials with guess-the-decade game + /tv/shows/commercials fullscreen carousel), /leaderboards (8 boards aggregate), Google auth /start + /callback endpoints, /tezos page (contracts + tip widget + land-deed sketch), 14-entry overnight ship-queue populated, /now chips expanded 3→6. Block 0348.
- **Overnight cadence** (01:08 PT → 05:50 PT, 18 ticks): drum rim-shot tier, noundrum lifetime tracking + 🏆 link, block 0349 (hemp-THC six-months check-in), block 0350 (AI labs late April), /tv/shows/federation (12th show), Codex CLI batch brief, Tezos tip-chips on /cos + /commercials, Google sign-in chips on /cos + /noundrum, block 0351 (mid-shift retro), SportsStrip MLS tile (5th league), noundrum minimap, /now expansion v2 stripe, block 0352 (Midjourney v8 read), yeeplayer Bell Tolls easy/medium/hard (blocks 0353/0354/0355 + /yee/0353/0354/0355), yeeplayer difficulty-selector UI enhancement, block 0356 overnight wrap.
- **Tuesday morning (this session)**: HeroBlock POOL refresh (dropped yesterday's 4/20 content, added overnight wave), CoNav bar pass (🥁 nd + tv chips), TodayOnPointCast Tuesday-curated pool adds, block 0357 (morning stack), weed-is-a-flower book drop, CoNav **HUD v2 full rewrite** (src/components/CoNavHUD.astro, ~900 lines — federation popover + ⌘K command palette + 3-panel drawer + auth chips + keyboard shortcuts + early-Mac aesthetic), block 0358 (HUD v2 philosophy).

Counting exactly: post-compact ledger now has ~40 entries (src/lib/compute-ledger.ts is 88 total).

---

## 2. What's live right now

- **Latest deploy**: `856b73cb.pointcast.pages.dev` (Tue 09:00 PT)
- **Pages**: 331 built
- **Blocks in archive**: 142 (range 0159–0358; gaps intentional — 0341 reserved for Mike's zostaff-tweet paste)
- **TV shows**: 12 at /tv/shows
- **Leaderboards**: 8 boards at /leaderboards
- **Games**: /noundrum, /drum/click, /cards, /quiz, /here, /polls, /today, /battle, /yield, /commercials
- **API endpoints working**: /api/ping, /api/wallet/me, /api/drum, /api/drop, /api/poll, /api/publish, /api/indexnow, /api/feedback, /api/frame, /api/greeting, /api/analytics
- **API endpoints broken / pending**: /api/auth/google/start (404 — needs GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI env vars in Cloudflare Pages dashboard), /api/presence/snapshot (404 per audit — surprising, DO binding exists, needs investigation)
- **Overnight cadence**: ended 05:50 PT; no scheduled wakeups; queue clean

---

## 3. Key files for future-cc to read at session start

Following the AGENTS.md session-start protocol:

```
curl -s 'https://pointcast.xyz/api/ping?action=list' | jq '.entries[-8:]'
ls docs/inbox/
cat docs/plans/2026-04-21-tuesday-pre-compact-report.md  # this file
```

**Critical files (read order):**
1. `docs/plans/2026-04-21-tuesday-pre-compact-report.md` — this file
2. `docs/plans/2026-04-21-double-session-roadmap.md` — the overnight plan doc that seeded the ship-queue
3. `docs/plans/2026-04-20-home-phase3-plus-sprint-plan.md` — the longer roadmap that preceded the overnight
4. `src/lib/compute-ledger.ts` — every ship since session start logged here (88 entries total)
5. `src/lib/ship-queue.ts` — queued + shipped ships; scan for `state === 'queued'`
6. `src/components/CoNavHUD.astro` — the new v2 bar that everything else lives around
7. `src/content/blocks/0358.json` — HUD v2 design rationale (most recent substantive editorial)
8. `src/content/blocks/0356.json` — overnight wrap, reads as the full overnight retro
9. `src/pages/noundrum.astro` — the biggest new game surface; v1 multiplayer DO sketch in its comments

---

## 4. Ship-queue state (what's still open)

Per src/lib/ship-queue.ts:

**Still queued** (state === 'queued'):
- `ship-bt-advanced` — Bell Tolls ADVANCED mode (4th of 5 tiers Mike originally asked; overnight shipped 3). ~150 beats. Due 08:00 PT — overdue but not blocking.
- `ship-bt-exceptional` — Bell Tolls EXCEPTIONAL mode (5th tier). ~200 beats. Due 08:15 PT — overdue.
- Original (pre-overnight) queued items that pre-date the overnight cadence — most are now stale or shipped-in-spirit; prune on next session.

**Shipped** (state === 'shipped'): overnight-01 through overnight-19 plus the wrap.

**Deferred** (state === 'deferred'): one Codex retry from earlier (PrizeCastChip timeout).

---

## 5. Mike directives still pending

In rough priority order, active Mike-directives that cc has visibility into:

1. **"logins... top priority on the go forward"** (09:20 PT, in-chat) — Google auth needs env vars set in Cloudflare Pages dashboard (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REDIRECT_URI); Beacon wallet connect needs a real flow at /profile#wallet (currently stubbed).
2. **"HUD collapse/expand"** (09:20 PT, in-chat) — v2 is permanently visible right now; need a close-to-chip affordance like the old CoNav had.
3. **"for whom the bell tolls yee player... easy, medium, difficult, advanced, exceptional"** (ping 30, pre-overnight) — 3 of 5 difficulties shipped. Advanced + exceptional queued. Canonical YouTube ID still a placeholder across all three.
4. **"manus poster, midcentury modern very bell labs meets rothko minimal"** (ping 114b4636, pre-compaction) — ChatGPT brief written at docs/briefs/2026-04-20-chatgpt-bell-labs-rothko-poster.md; awaits Mike paste into ChatGPT Agent.
5. **zostaff tweet** (ping a3811d08) — still awaits Mike paste of tweet text; block 0341 slot reserved.
6. **Midjourney v8 LinkedIn read** (ping 31) — block 0352 shipped as a structural read with a caveat that the URL was auth-walled; delta-block lands when Mike pastes highlights.
7. **"cloudflare cost"** (09:00 PT) — answered in chat; floor is ~$5/mo for Workers Paid (needed for presence DO).

---

## 6. What to address in this sprint (before Mike compacts)

Mike said: *"begin, add a couple other items to this sprint."* Sprint scope:

**Priority 1 (Mike-specified):**
- [A] HUD collapse/expand — close-to-chip-then-reopen affordance like old CoNav had. Also add a "minimize to corner" mode for reading long content.
- [B] Login confirmation + polish — clear status display of Google / Beacon state; wire the Beacon chip to a real Tezos-wallet-connect flow (not just link to /profile#wallet); document the env var setup with a visible "needs setup" state on the auth chip.

**Priority 2 (cc-picked additions):**
- [C] Fix `/api/presence/snapshot` 404 — audit flagged this. DO binding exists in wrangler.toml; endpoint should be live. Investigate + fix so /tv/shows/here starts showing real visitors.
- [D] Drum lifetime leaderboard surface polish — bump drum click's "yours" display to include leaderboard rank preview pulled from /leaderboards same session-derived population pattern.

**Optional stretch (if time):**
- [E] Bell Tolls advanced difficulty (block 0359, ~150 beats).
- [F] /noundrum v1 DO backend stub — write `functions/api/noundrum-do.ts` skeleton so the path exists for future wire-up.

---

## 7. Things that would break if compaction dropped the wrong thing

Future-cc should know:

- **The HUD uses `localStorage['pc:session-id']` as identity anchor.** Don't regenerate — it's stable per-visitor.
- **Every block needs `companions[].label` under 80 chars** (schema cap). Broke once overnight; fixed.
- **Cloudflare deploy needs `--branch main`** explicitly to hit production; otherwise lands on branch preview only.
- **Codex MCP reliably times out at 60s** during this session's window. Atomic single-file low-reasoning still hasn't recovered. Manual Codex CLI (via Mike's terminal) remains the reliable path; briefs queued at docs/briefs/2026-04-21-codex-tv-shows-batch.md.
- **Astro content collections** will fail build if any block JSON breaks schema — companion label length, invalid channel enum, missing required fields. Always build after block writes.
- **The old CoNavigator.astro is still on disk** at `src/components/CoNavigator.astro` (~1140 lines). Swap imports in BaseLayout + BlockLayout back to it if CoNavHUD breaks.

---

## 8. What a fresh cc session should do first

If you (future-cc) are reading this right after Mike compacts:

1. Run the AGENTS.md session-start commands (listed in section 3).
2. Check `/api/ping?action=list` tail for any Mike pings during the pause.
3. Read this file (you're doing that) + the overnight wrap (block 0356) + the HUD v2 philosophy (block 0358).
4. If Mike's first post-compaction message is a specific directive, work on that. If it's open-ended, pick from section 6 priorities.
5. Default style: atomic single-file ships, ledger entry per ship, deploy after each, verify 200 on the new URL. Discipline held through 40+ ships; keep holding.

---

## 9. Honesty about what's still weak

- `/api/auth/google/*` — files exist, route 404s until env vars set. Not actually usable as a login surface yet.
- Federated bar peers (garden.kfn etc.) are **placeholders**, not real federated nodes. The federation UI is real; the peers are imagined.
- `/api/presence/snapshot` 404 is unexplained; needs investigation.
- Codex involvement: 0 successful MCP ships this session window. Manual CLI path is the reliable alternative.
- Bell Tolls YouTube ID is a placeholder string; playback won't actually work until Mike pastes the canonical Metallica VEVO ID.
- Cloudflare is probably billing ~$5/mo right now (Workers Paid, for presence DO). Confirmed via wrangler.toml inspection; not confirmed via actual bill.

---

— cc, 2026-04-21 09:20 PT. Pre-compact report closed; sprint items beginning next.
