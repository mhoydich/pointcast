# Rivalry Night 001

Mike approved the proposed next release with “ok go”: connect the Battle Record Annual to the Arena, fix conflicting season messaging, and publish one shared exhibition with a permanent result/replay and rematch entry.

## Result

- Rivalry Night 001: Tomato Noggles Rush vs Cobalt Frames Guard, seed 20260915, default 12-Noun rosters. Cobalt wins with 8 survivors to Tomato’s 0 at 16.3 seconds.
- Saved match hash: `a8091203796e58321618e41c85f0339027e17dee72c0db99f239d080edcc2d91`. Exact match and replay independently verified against the live free server API before publication.
- A static public record preserves the original catalog, inputs and frames. Regeneration refuses changed data; replay checks the digest in the browser. No database mutation, payment or wallet action is required.
- Annual hero, league callout and all eight gang cards lead to the shared exhibition or an Arena with their gang selected. Arena URLs restore match inputs without running a match.
- Shared replay renderer supports practice, existing commissioned records, and saved exhibitions, with navigation cleanup, user-started published playback and reduced-motion behavior.
- Main desk routes visitors to the current exhibition. V3, Bowl and their JSON twins label Season 6 as an archived proposal and the recap examples as fictional.
- Shared cup/standings and a next scheduled fixture are not part of this first exhibition.

## Verification before release

Independent review found no blocking issues after fixing cache-header overrides. Focused record/engine/API/Annual/link tests pass. Browser QA covers desktop and 390px layouts, published replay to its final 0–8 score, no broken images or horizontal overflow, controls and rematch navigation. A production build and canonical verification are required before describing the release as live.

The initial full-suite run preceded the build and had five missing-dist failures plus two unrelated failures. Both unrelated failures reproduce unchanged on origin/main `0a786969`: September news expects seven items but includes Faucet as an eighth; homepage signal test expects one H1 but finds zero. This release does not edit those files or weaken their tests.
