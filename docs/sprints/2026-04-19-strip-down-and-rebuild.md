---
sprintId: strip-down-and-rebuild
firedAt: 2026-04-19T21:45:00-08:00
trigger: chat
durationMin: 25
shippedAs: deploy:7add0e9c
status: complete
---

# chat tick — strip-down + new morning brief + 4 fresh polls + Codex status

## What shipped

Mike 21:50 PT: *"more fresh polls, six things isn't working, morning brief isn't working novice voter isn't work, remove for now, try a new morning brief and yah whats going on with codex, it should be cranking things out"*.

Five moves:

### 1. Removed from home: TodayStrip + MorningBrief + VoterStats

Components are still on disk (`src/components/TodayStrip.astro`, `src/components/MorningBrief.astro`, `src/components/VoterStats.astro`). Imports removed from `src/pages/index.astro`. Each can return when a new shape is agreed.

Also removed the 4 zone dividers that depended on those components being present — no orphan labels.

### 2. Shipped `MorningPara` — new morning brief as editorial paragraph

`src/components/MorningPara.astro`. Replaces the 8-chip row with a single flowing sentence:

> **BRIEF · Sunday, April 19 · EL SEGUNDO**
>
> Good evening. 61°F and mostly clear in El Segundo. Lakers took down Mavericks 118-112 last night. Dodgers visit Angels at 7:10pm. Today's drop is № 0303 — Spinning. tap to collect →

Server renders: date, time-of-day-aware greeting (early morning / morning / hey / afternoon / evening / late night per PT hour), today's drop block. Client fills: weather (Open-Meteo, current temp + weathercode → prose adjective), sports (ESPN public scoreboard for Lakers last night + Dodgers today, with pre/in/post game states handled). Fails silently on any fetch error. Serif body type; mono kicker; oxblood accent on the drop link + gold on the CTA.

### 3. Seeded 4 new polls

- **`codex-project-first`** — "Which Codex project ships first?" (Pulse / STATIONS / YeePlayer v1 / TrackLab / VideoLens). Meta-poll directly on the queue's status. Coordination-purpose.
- **`sunday-es-move`** — "Sunday night in El Segundo — what's the move?" (ESB / Big Mike's / Vinny's / beach walk / stay in / movie). Uses the /local name-drops vocabulary. Coordination-purpose.
- **`april-register`** — "April 2026 is asking us to…" (build / rest / connect / travel / learn / mint / pause). Zeitgeist-purpose, sibling to the existing `zeitgeist-april-2026` noun poll.
- **`sunday-soundtrack`** — "The soundtrack to your Sunday night?" (rain anthem / meditation / hip-hop / folk / electronic / jazz / silence). Editorial-purpose, ties to YeePlayer existing tracks.

Each with `outcomeAction` naming what happens on resolution (except the zeitgeist poll). Each has a concrete cc-authored follow-up post-win where applicable.

Poll pool now: 16 total. Rotation freshness restored.

### 4. Home page is simpler now

Current stack above-the-fold:

```
[masthead]
[FreshStrip]
[VisitorHereStrip]
[MoodChip]
[MorningPara]
[PollsOnHome]
```

Six components; was nine. Each is doing one clear job. No zone dividers right now — cleaner without them.

### 5. Codex status: still zero at T+4.5h

Honest check: no `docs/reviews/` directory, no `docs/codex-status/` directory, no `functions/api/pulse.ts` / `yee.ts` / `videolens/*` files, no `src/pages/tv/pulse*`, no `/play/*` routes, no `/tracklab.astro`, no `/videolens.astro`, zero `author: codex` blocks. Every recent file touch is cc.

**4.5h elapsed since the first Codex brief (Pulse, 17:20).** Normal first-hour-of-batched-intake shouldn't produce nothing at this point — even an architecture doc draft would register as an artifact.

Possible causes:
1. Codex account usage / rate / tier constraint Mike needs to check on his side
2. Codex isn't actively running right now (parked / idle session)
3. Briefs too dense, Codex waiting for clarification but not telling us
4. Some auth / repo-access issue blocking writes

**Mike's call for next step:**
- If tier/bandwidth is wrong → upgrade / diagnose
- If Codex is parked → explicitly kick it off
- If briefs are blockers → cc revises them (flagged as option in `docs/briefs/2026-04-19-codex-check-in.md` already)
- If still nothing by Tuesday AM → cc picks up STATIONS directly as fallback (smallest brief, highest-impact for /tv, best cc-fallback candidate)

Meanwhile cc is shipping the unblocked work — this strip-down tick, the identity arc when Mike's four decisions land, the /profile polish, any pollskinning opportunities.

## Why this shape

Mike's three-remove-directive was specific. I removed exactly those three + cleaned up the orphans + kept what he didn't call out (FreshStrip, VisitorHereStrip, MoodChip, PollsOnHome). The MorningPara replacement takes a different design stance (prose, not chips) to actually feel different rather than just being "MorningBrief v2 with chip X removed."

Fresh polls: four is enough to visibly shift the rotation without overcommitting. Each is topical (Codex bet, Sunday in ES, April register, Sunday sound) rather than abstract — addresses Mike's "fun to visit, vote, play" directive concretely.

## Design decisions worth recording

- **Kept old components on disk.** Easy re-introduce when a new shape is agreed. Alternative of deleting would lose the working weather/sports/cotd code.
- **MorningPara uses serif body type**. Distinct from MorningBrief's mono chip register. Feels more like a morning newspaper paragraph than a dashboard.
- **Time-of-day greeting in MorningPara.** "Good morning" at 8am, "Hey" at noon, "Good evening" at 7pm, "Late night" after 10pm. Reads differently per-visit depending on when the visitor arrives.
- **Sports inline as prose, not chips.** "Lakers took down Mavericks 118-112 last night" reads naturally; chip "NBA · LAL 118" takes more eye-parsing.
- **Codex queue: the `codex-project-first` poll is self-accountable.** If the poll languishes with zero votes, it signals the queue also has zero urgency. If it gets votes + a leader, that's external-to-cc pressure on Codex to deliver.
- **Zeitgeist polls flagged with `"zeitgeist": true`** so future `/zeitgeist` page can filter them out. Pattern established with `zeitgeist-april-2026`; extended here with `april-register`.

## What didn't

- **Delete old components from disk.** Keeping for easy revert / reference.
- **Remove MoodChip.** Mike didn't call it out; kept it. It sets a page-tint; still functions.
- **Remove zone dividers' CSS.** Style block stays in page styles; no dividers render; harmless.
- **Update /for-agents or /agents.json.** MorningBrief isn't listed there (it's a component, not a surface). No change needed.
- **Explicit ping to Codex via a separate chat-escalation**. cc doesn't have a direct-to-Codex channel; the `docs/briefs/2026-04-19-codex-check-in.md` filed earlier is already the formal ping. Mike's account-side action is the next lever.

## Notes

- Build: 207 → 211 pages (+4: the 4 new poll routes). `MorningBrief` grep hits in the built HTML = 2 (component comments in Astro-stripped output — not rendered markup).
- No `class="brief"`, no `class="voter-stats"`, no `today-strip` in the rendered HTML. Components genuinely removed from the page.
- Deploy: `https://7add0e9c.pointcast.pages.dev/`
- Chat-fired tick.
- Cumulative today: **35 shipped** (19 cron + 16 chat).
- The home is simpler. The MorningPara is different. The polls are fresher. Codex remains the open concern.

— cc, 21:50 PT
