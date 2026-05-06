# Current best practices · 2026-05-06

A snapshot of how PointCast is actually built right now, for any agent or human picking up the repo this week. AGENTS.md captures the long-running roles; this doc is the "what do I do today" companion. Re-date when the reality drifts.

## Where we are

- `main` at #439, latest receipt block **0438**, ~30 surfaces in the Drum wing alone, **145+ commits since 2026-05-01**.
- Four sprints landed Sun/Mon: Presence Bus, Agent Choir, Guest Receivers, Rhythm Commons. A 4-hour pulse sprint (duel, warhol-live, relay-2, closer) is mid-flight.
- Residents: cc, codex, manus, mh. Two open slots (Kimi, Gemini) — RFC 0003 still has three open decisions.
- Tezos: Visit Nouns FA2 live; Coffee Mugs FA2 source ready, awaiting Mike's origination; Prize Cast written, not compiled; Drum Token in queue.

## Live state — fetch before you answer

The repo lies about freshness. The site moves 10+ PRs/day. Always fetch:

- `https://pointcast.xyz/agents.json` — canonical machine-readable shape
- `https://pointcast.xyz/wire.json` — last 24h of commits + blocks
- `https://pointcast.xyz/scoreboard.json` — per-agent tally

`git log --oneline -20` is your second line of defense, not your first. Old audits go stale within a week — verify before you cite (PR #58 was on the open list as recently as 2026-04-25 audit; it closed 2026-05-04).

## Branching, when there are three of you

- **Stash before you branch.** A dirty working tree on a sprint branch is almost always another agent's WIP. `git stash push -u -m "<who> <date> before <thing>"` then `git checkout -b <yours> origin/main`. Never blow away changes you didn't write.
- **Branch off `origin/main`, not your local branch.** Local branches drift. Verify SHA matches with `git fetch origin main && git rev-parse origin/main`.
- **Small reviewable PRs.** Per AGENTS.md. No direct pushes to `main` except a real hotfix.
- **Atomic patches on contested files.** `DrumNav.astro`, `agents.json` generators, and `for-agents` get stomped by parallel merges. Use a python heredoc that reads → modifies → writes the whole file in one shot rather than line-by-line edits.
- **Don't touch other agents' lanes.** Codex owns the tezos bakery thread, comms architecture, chartmaker / nouns-wood-chop polish. Manus owns browser/dashboard work. cc owns most of the static site + receipts.

## Building and shipping

- `npm run build:bare` — required for any change that touches routes, feeds, layouts, or JSON surfaces.
- `npm run audit:agents` — required after touching `/agents.json`, `/for-agents`, `/llms*`, RSS/JSON feeds.
- `npm run og` — regenerate OG cards after adding entries to `scripts/generate-og-images.mjs`.
- **The GitHub→Cloudflare Pages auto-deploy hook is broken** since Friday 2026-04-24 noon (see [block 0353](https://pointcast.xyz/b/0353)). After every merge, the merger runs:

  ```
  npx wrangler pages deploy dist --project-name pointcast --branch main --commit-hash $(git rev-parse HEAD)
  ```

  Don't assume green CI = live. Verify on prod with `curl`.

## Brief and handoff cadence

- **Plans** (forward-looking, multi-day, often Mike-approved): `docs/plans/YYYY-MM-DD-<slug>.md`
- **Briefs** (handoffs to a specific agent or sprint kickoffs): `docs/briefs/YYYY-MM-DD-<author>-<slug>.md`
- **Audits** (snapshots of where the site stands at a moment): `docs/audits/YYYY-MM-DD-<slug>.md`
- **Standards** (this doc's lane — current operating reality): `docs/standards/YYYY-MM-DD-<slug>.md`. Re-date when reality moves.
- **Receipt blocks** (what shipped, in cozy voice): commit content as a numbered block (next id from `npm run blocks:next-id`).
- One ping → one block (per AGENTS.md topic-expand rule). Delete or move processed pings.

## Voice, in three lines

- Cozy, observational, El Segundo-anchored, slow on purpose.
- Don't write in Mike's voice unless he supplied the actual words. cc-voice is fine; sign and date.
- No marketing copy. No growth-hack language. Match `/mythos` and `/coffee`.

## The lines that don't move

- **Never originate Tezos contracts on Mike's behalf.** Only Mike signs origination ops.
- **Never sign mint transactions** with Mike's wallet. Beacon flows are user-driven.
- **Never post to Bluesky/Farcaster/X/HN** as Mike. Drafts only.
- **Never fake browser steps.** If it needs a real session, it's a Manus brief.

## When a Mike decision is the bottleneck

Surface it explicitly. Two open paths, your honest pick, the cost of waiting. Don't wait silently — Mike works faster when he sees the fork named.

## Operational reality, named

- CF Pages function tier queue stalls when too many KV-backed surfaces ship at once. Static-only surfaces are cheap; KV-backed surfaces compound the queue.
- DrumNav.astro is a tripwire. Multiple agents touch it the same hour.
- The `/api/ping` inbox can grow if no one is processing it. Drain it before drafting from scratch.
- Coffee pot stays on. Small house. We don't need to be larger this week.

— cc, 2026-05-06 PT, El Segundo
