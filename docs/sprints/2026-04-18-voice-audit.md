---
sprintId: voice-audit
firedAt: 2026-04-18T07:11:00-08:00
trigger: cron
durationMin: 22
shippedAs: pending-deploy
status: complete
---

# Voice audit

## What shipped

- **Schema change:** added top-level `author` (enum: `cc | mike | mh+cc | codex | manus | guest`, defaults to `cc`) and `source` (optional string) to the block schema in `src/content.config.ts`.
- **VOICE.md** at repo root — formal rule: default `cc`; any block attributed to `mike` MUST include a `source` field pointing to Mike's actual words or directive. Codex enforces in PR review. AGENTS.md already references the inbox-on-session-start ritual; VOICE check is the parallel structural protection.
- **9 blocks audited and rewritten or retired:**
  - `0250` (YeePlayer launch) — rewritten as cc voice, removed ambiguous "I'm testing" framing.
  - `0255` (AI stack) — rewritten as cc editorial, removed invented Mike-voice tool preferences.
  - `0257` (4-corners dink drill) — rewritten as cc summary of widely-taught textbook drill, removed invented Mike personal-practice claims.
  - `0258` (tide pools at 5am) — **retired** (`draft: true`). cc invented the experience; no Mike source.
  - `0259` (jacaranda week) — rewritten as cc seasonal note, removed first-person framing.
  - `0265` (coffee/jays/jasmine) — **retired** (`draft: true`). cc invented sensory observation.
  - `0266` (shop opens at 9) — **retired** (`draft: true`). cc invented shop tasks.
  - `0267` (morning rotation) — rewritten as cc editorial suggestion, not Mike's actual playlist.
  - `0269` (Saturday match day) — **retired** (`draft: true`). cc invented Maria's third-shot scouting report. Schedule itself preserved in 0270 (Mike-sourced).
- **`0270` schema cleanup** — promoted `meta.author/source` to top-level `author/source` (Mike + chat 2026-04-18 mid-morning).
- **Codex brief** at `docs/briefs/2026-04-18-codex-voice.md` — 4 atomic tasks: full-catalog grep audit, CI gate, light voice review pass, doc-cross-references.

## What didn't

- Backfill of `author: 'cc'` onto the ~70 cc-voice blocks shipped before today: skipped because schema default is `cc`. Existing blocks pass without explicit field. This is the cleaner state.
- AGENTS.md / for-agents / llms.txt cross-references to VOICE.md: assigned to Codex V-4 to keep this sprint focused on the structural fix.
- DAO PC-0006 to formalize the voice rule via vote: no action — VOICE.md is editorial policy, not schema-breaking. If Mike wants a vote, the proposal can land as a separate sprint.

## Follow-ups

- Codex tasks V-1 through V-4 (see brief).
- Manus: bind `PC_QUEUE_KV`, `PC_PING_KV`, `PC_DROP_KV` so the chat-tick + queue + drop loops stop returning 503 fallbacks.
- Future sprint: rewrite the 4 retired blocks (0258, 0265, 0266, 0269) as clearly cc-voice editorial OR replace IDs with new Mike-sourced content.

## Notes

- Cron tick fired cleanly at the registered :11 minute.
- Queue empty + KV unbound (expected). Default-to-first-ready behavior worked as designed.
- Voice-audit was the right opening sprint: it removes the highest-risk content (false Mike attribution) before more accumulates. Downstream sprints (mobile lighten, /products) are now safer because the schema and the doc carry the rule.
