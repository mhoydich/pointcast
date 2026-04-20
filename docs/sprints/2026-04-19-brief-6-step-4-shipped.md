---
sprintId: brief-6-step-4-shipped
firedAt: 2026-04-20T05:11:00-08:00
trigger: cron
durationMin: 21
shippedAs: deploy:9c1f96d5
status: complete
---

# 05:11 tick — Brief #6 step 4 shipped (docs) + deploy

## What shipped

Codex's step 4 (docs refresh) landed end-to-end this tick. Three approval dialogs in sequence, then Codex moved to step 5 (verify).

### Approvals chain

1. `for-agents.astro +22 -0` — human-readable manifest updated with presence contract + privacy callout
2. `agents.json.ts +43 -0` — machine manifest's `endpoints.api.presenceProtocol` object with transport / query / clientMessages / broadcast / cap / privacy
3. `2026-04-19-codex-presence-do-architecture.md +90 -0` — architecture review doc

### Codex now in step 5 (verify)

Log: *"I'm in verification mode now: reading the actual diffs and doing non-build checks so we catch any wire-shape or inline-script mistakes before I touch git."*

Running:
- `git diff -- functions/api/presence.ts src/components/VisitorHereStrip src/pages/tv.astro src/pages/for-agents src/pages/agents.json.ts`
- `git diff --check --` (catches whitespace / line-ending issues)

**Total: 6 files changed · +957 -226.**

### cc role this tick

- Approved 3 dialogs via computer-use
- Ran build: `227 → 228 pages built` (the +1 page is actually the new poll from last tick, staying in the count)
- Spot-checked `/agents.json`: presenceProtocol object has all 6 expected keys with matching privacy text
- Deployed: `https://9c1f96d5.pointcast.pages.dev`

## Where Brief #6 stands

- ✓ **Step 1 DO rewrite**: `functions/api/presence.ts` — identity-enriched broadcast
- ✓ **Step 2 VisitorHereStrip**: ghost slots render real-noun images when sessions arrive + TELL panel sends WS update messages
- ✓ **Step 3 /tv constellation**: dots → real noun avatars with hoverable mood chips, aggregate count preserved
- ✓ **Step 4 docs**: /for-agents + /agents.json presenceProtocol + architecture doc in-repo
- 🟡 **Step 5 verify**: in flight (non-build diff checks running now)

Codex will either complete with a clean verify (and either attempt or skip git commit based on sandbox permissions), or flag a wire-shape bug and patch it before closing.

## What didn't

- **Functional browser test** of the new constellation. Build passes. DO code is backwards-compatible by design. Live behavior validated when real visitors connect (and when Mike loads the site next).
- **Git commit**. Same as STATIONS — waiting on Mike's call re cc committing as codex.
- **Kick off next Codex brief (#7 /here or #8 multiplayer primitive)**. Not this tick. Waiting for Brief #6 to fully close.

## Observations

- Codex's verification approach is principled: git diff + diff --check (whitespace pass) without attempting `npm run build` (sandbox limit respected). Delegating build to cc is the working pattern.
- The presenceProtocol block in /agents.json is rich enough that an agent can self-document the WS client: it lists the 3 client message types (`identify`, `update`, `ping`), the broadcast shape with sample values, the 50-visitor cap, and the privacy rule. Good manifest-native documentation.
- Total Codex delivery on Brief #6 so far: 6 files, ~2h 45m elapsed. Budget was 3-4h; on schedule.

## Notes

- Build: 228 pages (unchanged — same as last tick; no new routes this tick).
- Deploy: `https://9c1f96d5.pointcast.pages.dev/agents.json` (to verify the new presenceProtocol section).
- Cumulative: **43 shipped** (25 cron + 19 chat). Tick count; the "ship" this tick is deploy-of-Codex-step-4.
- Next cron 06:11. Likely: check Codex step 5 result, maybe kick off #7 if Brief #6 fully closed.

— cc, 05:32 PT (2026-04-20)
