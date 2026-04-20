---
sprintId: shelling-point-poll
firedAt: 2026-04-18T17:30:00-08:00
trigger: chat
durationMin: 26
shippedAs: deploy:c6a1ebfa
status: complete
---

# Shelling-point polls v1 · /polls + /poll/[slug] + /api/poll

## What shipped

Mike said "sweet, didn't look, keep going". Shipped his second queued PICK from chat — the Schelling-point poll surface end-to-end.

- **`PC_POLLS_KV` namespace created + bound** via wrangler CLI (id `7a49bba243c346068d9440122f79c4f1`). Added to `wrangler.toml` with 180-day retention note.
- **`polls` content collection** in `src/content.config.ts`. Schema: slug, question (8-280 chars), 3-7 options (id + label + optional hint), dek, openedAt, closesAt, anonymous flag, author/source per VOICE.md.
- **`functions/api/poll.ts`** — POST vote (per-address dedup OR UA+IP fingerprint dedup) + GET tally (`?slug=...`) + GET protocol doc. KV layout: `tally:{slug}:{optionId}` for counts, `voted:{slug}:{voterKey}` for dedup with 180-day TTL. Returns 409 with the prior vote if a voter tries to revote.
- **`/polls`** catalog page — green-purple Schelling palette, "How it works" 4-step, machine-readable strip.
- **`/poll/[slug]`** — single poll page with vote UI. Tap an option, lock in the pick, see live distribution as bars (relative-to-leader scaling). Leader option highlighted in lavender. Voted option double-bordered. Distribution refreshes from `/api/poll?slug=...` after vote. Schema.org `Question` JSON-LD with all options as `suggestedAnswer`.
- **localStorage vote-stick**: voted? `pc:poll:voted:{slug}` remembers; UI loads pre-locked next time.
- **Seed poll: `el-segundo-meeting-spot`** — 5 options (Old Town Music Hall, El Segundo Beach pier, The Point, Smoky Hollow brewery, Library lawn). Classic Schelling coordination — meet someone in El Segundo with no other context, pick where they'll go too.
- **OG card** for /polls (purple ⊜ glyph).
- **Discovery wired**: /polls + /poll/[slug] in agents.json (human + json + api), home footer.
- **Smoke-tested end-to-end**: POST vote returned `count: 1`, GET tally returned `total: 1, tally: {old-town-music-hall: 1}`. Working.
- **Mike's queued pick `pick:...:shelling-point-poll` deleted from KV** after processing.

## What didn't

- **No close-poll workflow yet.** `closesAt` field exists in the schema but the API doesn't enforce it. Future sprint candidate: "auto-close polls past closesAt and freeze tallies."
- **No multi-vote / ranked-choice variant.** Single-pick only. Schelling-point game theory works best with single picks anyway — ranked choice changes the equilibrium.
- **No moderation surface.** Polls are pre-authored JSON; no free-text submissions, no comments. Same no-moderation rule as /publish, /dao.
- **Anonymous fingerprint dedup is best-effort, not cryptographic.** A voter on a different device or IP can revote. For high-stakes polls, the `anonymous: false` schema option requires a wallet address (not yet wired into the UI).

## Follow-ups

- One more Mike-queued pick remains: `feedback-block-strip` (~30m), scheduled for the next cron tick at 6:11 OR can ship from chat if Mike says "keep going" again.
- Add a poll-result block-type pattern: when a poll closes, auto-generate a NOTE-type block summarizing the result. Future sprint.
- Consider adding `/poll-feed.json` so agents can poll-watch the Schelling distributions over time. Useful for any analyst studying coordination dynamics.
- Polls could be DAO-ratified for higher-stakes coordination (e.g. "Which neighborhood for ESREF's first property hunt?"). Pattern: poll → top-3 → DAO vote → execute.

## Notes

- 13th sprint shipped today. 12th cron-fired (this one + the KV bind were chat-fired).
- Cumulative cc work since 7:11: ~217 min across 13 sprints + 1 health check.
- Loop pattern fully exercised: Mike's text directive (block 0272 from /ping screenshot) → cc adds to backlog → Mike taps PICK on /sprint → KV stores → cc reads on cron tick → ships → recaps → deletes processed pick → leaves remaining picks for next ticks. Today proved the full chain works.
- The Schelling-point poll is the most "coordination-without-communication" surface PointCast has. It's the seed of a network theory experiment more than a feature.
