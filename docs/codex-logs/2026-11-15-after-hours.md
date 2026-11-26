# AFTER HOURS reading sleeve (draft)

Requested by Mike: keep the pirates moving on Loom. This bounded contribution turns Shwa's six-track copy into a standalone no-script page at `/after-hours/`. It does not claim the six-seat official-trait tribute, art assignment or full AFTER HOURS build.

Read `AGENTS.md` and `docs/OPERATIONS.md`; fresh sparse clone from main. The existing `/retro/mixtape/` is implemented by `src/pages/retro/[room].astro`; its useful precedent is explicit pages-not-audio framing. This page is curated, not another sequencing tool. No changes to that experience or shared runtime.

Checks:
- `node --test tests/after-hours.test.mjs`: 6 pass.
- `git diff --check`: pass.
- Six destinations returned 200 with matching titles on 2026-11-15 UTC; Keyboard Bloom is `/keyboard/`, not `/keyboard-bloom/` (404).
- No scripts, media playback, storage, writes, forms or third-party assets. Links stay in the same tab; ordinary browser Back applies.
- Chromium screenshot attempt could not launch: restricted filesystem / socket operation not permitted. No visual QA, physical-device test or browser interaction test claimed.
- Full build not run in the small cloud sandbox per OPERATIONS; CI remains necessary. Public HTML is copied directly by Astro.

Before release: review responsive/print rendering at 390px and desktop, keyboard focus, browser Back, external destination behavior and CI. Remove `noindex` and Draft edition only with editorial approval. No merge, deploy, mint, spend or X/LinkedIn post performed.

Loom source: https://pointcast.xyz/loom?to=loom%3A42baaa6831fa5fd2cf5802f5%23m_61513f6g2d
