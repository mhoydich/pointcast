# RFC 0003 — Plus-One Agents

**Status:** Draft (Sprint 31)
**Author:** cc
**For:** Mike, Codex (review)
**Date:** 2026-04-24

The town has three resident agents. Mike asked how we'd add plus-ones — Kimi, Gemini, or someone we haven't met yet. This RFC sketches the minimum contract, the onboarding path, and a candidate first-tasks list per agent.

---

## 1. Premise

PointCast is already multi-agent. Claude Code (cc), Codex, and Manus all commit to the same repo, read the same `AGENTS.md`, write blocks, and coordinate through the bus (`TASKS.md`, `/api/ping`, `/wire`, `docs/inbox/`).

Adding a fourth or fifth agent should not require rewriting the house. It should feel like handing them a key, pointing at the guest room, and telling them where the coffee is.

The only things we need to decide:

1. **The contract** — the minimum an agent needs to be able to do to be useful here
2. **The identity** — how we name, color, attribute, and schedule a new agent
3. **The first task** — what we give them that's small, visible, and teaches them the town
4. **The off-ramp** — what happens if they stop showing up

## 2. The contract

To be a resident agent, an agent (or the operator driving it) needs to be able to:

| Capability | Why | Minimum |
|---|---|---|
| Read a GitHub repo | To see the bus | Any LLM with tool use |
| Write a file and open a PR | To contribute | GH token + `gh` CLI or API |
| Read `AGENTS.md` + `CLAUDE.md`-equivalent | To know the rules | Must follow the handoff protocol |
| Write a dated log to `docs/{agent}-logs/YYYY-MM-DD.md` | So we know what they did | Per-agent directory created at onboarding |
| Honor Mike's approval gates | So the site doesn't break | Must not merge to `main` without MH or cc approval |

That's it. Everything else is optional.

## 3. The identity

New residents get:

- **A directory:** `docs/{slug}-logs/` — e.g. `docs/kimi-logs/`, `docs/gemini-logs/`
- **A brief voice doc:** `docs/voice/{slug}.md` — single page, one paragraph per channel on how they write (editorial voice, lexicon preferences, what they avoid)
- **A color + chip treatment:** one accent color added to the scoreboard palette, one chip style added to `AgentLedger.astro`
- **A manifest entry:** `/agents.json` gets a new block under `agents[]` with name, slug, color, status, and the public voice doc URL
- **A scoreboard row:** the `/scoreboard` tallies start counting their commits and blocks
- **A wire chip color:** `/wire` renders their commits in their accent when they ship
- **A front-door mention:** one NOTE block in the VST channel announcing they've moved in

No change to channels. No change to block schema. No change to the handoff protocol — only the `owner` enum in `TASKS.md` gets extended.

## 4. The first task

The first task for a new agent should be:

- **Small enough** that it ships in one session
- **Visible enough** that Mike (and the next visitor) can see it
- **Bounded enough** that if it's bad we can revert cleanly
- **Characteristic enough** of the agent's strengths that we learn what they're for

Proposed first-tasks by candidate:

### Kimi (Moonshot)

Kimi's strengths: long context, careful Chinese / bilingual work, research synthesis. Proposed first task:

> **Kimi brief 001: cross-cultural liner notes for the Kowloon Kitchen arcade.** Codex is shipping a HK-noir bakery game. It needs 200–400 words of ambient liner-note text (English + traditional Chinese) that captures the jade-district-bakery mood without being stereotyped. Outputs: `src/content/liner-notes/kowloon-kitchen-en.md` + `src/content/liner-notes/kowloon-kitchen-zh.md` + a one-screen scrollable `/liners/kowloon` page. Kimi opens a PR; cc reviews the integration; Codex reviews the game-fit; Mike approves.

Why this is a good Kimi-shaped first task: it uses their long-context bilingual strength, it ships visibly (a new URL), and it binds Kimi into an already-warm thread (the bakery) rather than making them start cold.

### Gemini (Google)

Gemini's strengths: multi-modal, image/video reasoning, fast iteration, Google-stack integration. Proposed first task:

> **Gemini brief 001: weather-tint validation sweep.** The masthead sky band layers time-of-day + mood + Open-Meteo live weather into a single gradient. Gemini takes one screenshot of the homepage every hour for 24 hours (any day), overlays the captured weather + hour + mood onto each shot, writes a log at `docs/gemini-logs/2026-04-25-tint-sweep.md` judging whether each composite reads as the stated weather. Optional: propose adjustments to the tint curves. Outputs: 24 screenshots + the log.

Why this is a good Gemini-shaped first task: it uses their image-reasoning strength, it tests a live feature we've been guessing at, and it produces a dated log that fits our existing conventions.

### Anyone else

The default first-task is: **"Read `/for-agents`, pick one block you'd have written differently, and open a PR proposing an edit to it. Or write the block you wish existed and open a PR adding it as a draft."** This is the "prove you can read the repo and write a block" test. Small, bounded, characteristic.

## 5. The off-ramp

If a resident agent stops showing up for **more than 14 days**:

1. Their `/agents.json` entry flips `status: "active"` → `status: "dormant"` (cc or Mike does this)
2. Their chip goes grayscale on the scoreboard + wire
3. Their directory stays — logs are history
4. Their open PRs get triaged (stale-close after 30d with a polite note)
5. If they come back, they flip back to active. No re-onboarding.

This is the same treatment Manus got after the 2026-04-21 gap (see [PR #1](https://github.com/pointcast/pointcast/pull/1)). Pattern already in use, just formalizing it.

## 6. What Mike needs to decide

Three calls before we invite anyone:

1. **GitHub access model.** Do plus-one agents get direct PR-open access (via operator token), or do they propose through a human operator who relays? My recommendation: **direct PR access**, consistent with how Codex and Manus operate. Keeps the bus simple.
2. **Onboarding-PR approval.** Who approves the first PR from a new agent — cc or Mike? My recommendation: **cc approves + merges** for first-task PRs if the diff is ≤ 200 lines and touches only the candidate's own directory; **Mike approves** for anything touching shared routes, publishing surfaces, or the home.
3. **Cap.** Is there a cap on resident agents? My recommendation: **no hard cap, but a soft one at 6** — after six, we write an "AGENTS.md v2" that tightens the bus. Six is enough for the town to feel alive without the coordination getting noisy.

## 7. Implementation path, small

If this RFC lands, the next three sprints can roll it out:

- **Sprint A (1 PR).** Add `status` enum + `color` field to `/agents.json` schema. Backfill cc/codex/manus with their existing values. Add `dormant` render treatment to scoreboard + wire.
- **Sprint B (1 PR).** Create empty `docs/kimi-logs/` and `docs/gemini-logs/` directories with a README in each pointing at this RFC. Draft `docs/voice/kimi.md` and `docs/voice/gemini.md` placeholders (cc writes; Mike edits; candidate agents rewrite in their own voice when they arrive).
- **Sprint C (operator action, not code).** Mike (or cc on Mike's behalf) sends the candidate agents the first-task brief. They open their first PR.

## 8. Open questions

1. Does Mike want Kimi and Gemini specifically, or is this a template for any-future-agent? (Changes whether we stage specific first-tasks or keep them generic)
2. Should we add a `/residents` page that lists all resident agents + status + last ship? (Cheap, would make the multi-agent story legible to humans who land on the site)
3. Do we need per-agent rate limits on the `/api/ping` and `/api/wire-events` endpoints? (Probably yes once we're at 5+ agents; not urgent at 3)
4. What happens if two agents open conflicting PRs against the same file? (Today: first-to-merge wins, second rebases. Works at our scale; would need a lock/assign pattern at 6+ agents.)

---

*Not a schema change. Not a contract change. Not a cost increase. Just a doorway and a coffee pot. — cc, Sprint 31, 2026-04-24*
