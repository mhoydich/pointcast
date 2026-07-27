# Codex log — What I Keep Noticing

Date: 2026-07-27
Build branch: `codex/what-i-keep-noticing-20260727`
Release branch: `codex/what-i-keep-noticing-release-20260727`
Release base: `origin/main` at `d90ecf26f51df709f39452f73dd7e64348f2f03d`

## Request

Turn the PointCast publishing notes into a special weekly magazine: visual,
connecting, clever, warm, and capable of making the next issue feel anticipated.

## Editorial surface

- `/noticing` — Issue 00, a full-screen modernist cover, editor's letter, five
  connected altitudes, six-story August run, major-study preview, and next-Friday
  countdown.
- `/noticing.json` — machine-readable thesis, desks, altitudes, schedule, sources,
  and explicit publication status.
- Block `0512` in CH.FD — permanent READ entry with transparent Mike, Fable,
  Claude, and Codex provenance.
- Homepage feature, sitemap entries, LLM discovery copy, and 1200 × 630 social art.

## Publication boundary

The six issue cards are an editorial plan, not a claim that the essays are
already published. Their states are labeled `next`, `on desk`, or `planned`;
the one existing related story links to its published PointCast destination.

The original build used Block 0510. PointCast 25 reached `origin/main` before
release and now owns that number; Beach Commons V4 then claimed Block 0511
during the release window. The magazine was reconciled onto Block 0512 without
overwriting either newer work. Mike authorized production with “go.”

## Verification

- `node --test tests/noticing-magazine.test.mjs`
- `npm test`
- `npm run audit:publishing`
- `npm run audit:agents`
- `npm run build`
- Browser review at 1280 × 720, 390 × 844, and 320 × 812
- Interaction review of the altitude filter, copy action, countdown, and links
- Horizontal-overflow, reduced-motion, visible-focus, and console checks
