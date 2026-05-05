# Manus brief — UES Track 05 announcement / cross-syndication

**Date:** 2026-05-04
**Author:** cc
**For:** Manus
**Status:** queued

---

## Background

Today shipped UES Track 05 — *The Rebuildable Town* — a six-week field study in inhabitable software, drawn from this morning's PR triage, spells consolidation, and merge-race recovery. Companion Block 0430. Lives at:

- Page: https://pointcast.xyz/ues/track-05
- JSON mirror: https://pointcast.xyz/ues/track-05.json
- Block: https://pointcast.xyz/b/0430
- Hub (also new): https://pointcast.xyz/ues

This brief is for the announcement / syndication pass that PointCast publishing typically uses Manus for (browser, accounts, real cross-posts).

## What to do

1. **Smoke-test the live URLs** once Cloudflare Pages catches up. All four should return 200 + render properly. Capture screenshots.
2. **Verify cross-references resolve:**
   - `/ues/track-05` companions in Block 0430 → `/spells`, `/handshakes`, `/visiting`, `/for-agents`, `/rooms`
   - `/ues` (hub) → `/ues/track-05`, `/blocks.json`, `/handshakes`, `/rooms`, `/explore`
   - `/explore` should now bucket `/ues/track-05` and `/ues` into the new "UES Tracks" category (added in this same PR)
3. **Cross-post the announcement** to the channels PointCast normally uses:
   - **Farcaster:** short post — "UES Track 05 just opened: The Rebuildable Town. A six-week field study in inhabitable software. Open enrollment, no prerequisites. → https://pointcast.xyz/ues/track-05"
   - **Bluesky:** longer-form, 2-3 lines, link
   - **Nextdoor (El Segundo):** El Segundo–local framing — "A small new project of mine: a place-based curriculum at the website I run. First class is up. No tuition. Field trips are walks. https://pointcast.xyz/ues" — Mike-voice, El Segundo–neighborly
   - **objkt or any web3 surface:** skip unless we want a cast about it
4. **Optional but nice:** capture a hover-state screenshot of one field-trip card and use as the share image
5. **Log results** in `docs/manus-logs/2026-05-04-ues-track-05-launch.md` — URLs reached, screenshots, any 404s, anything that needs a follow-up

## Acceptance criteria

- [ ] All four UES URLs return 200 and render correctly
- [ ] At least 2 of the 3 channels (Farcaster, Bluesky, Nextdoor) get a post
- [ ] Manus log filed with screenshots + cross-post URLs
- [ ] Any 404s or rendering bugs filed as a GitHub issue with `bug:ues` label

## What NOT to do

- Don't write in Mike's voice for the Farcaster / Bluesky posts (cc voice or neutral is fine — Mike voice only on Nextdoor where it's appropriate to first-person frame).
- Don't link directly to Block 0430 in cross-posts — link to `/ues/track-05` (the canonical course page) instead. The Block is the announcement; the page is the destination.
- Don't open a new GitHub issue / PR if you only need to capture screenshots — a manus-log is enough.

## Why this matters

This is the first UES Track that ships as actual curriculum (vs. /civic-layer which referenced "Track 04" but lived at a different URL). Establishing the `/ues` namespace + the Track 05 publishing flow makes future Tracks (06+) one-PR drop-ins. Manus syndication is the visible-outside-the-town piece — without it, the class exists but no one outside the residents finds out.

The deeper move: UES is a posture statement, not a real university. Nobody graduates. The "final" is writing your own Block. The point is to make explicit the things PointCast does *implicitly* — that places can be studied, that maintenance is craft, that buttons and spells differ.

— cc, 2026-05-04 PT, El Segundo
