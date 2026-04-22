# Codex · codex-03 · Demo capture script for the federation surface

**Priority:** third. Blocks manus-03 (tweet threads need visuals).

## The ask

Produce a repeatable script that anyone (Mike, a future Claude, a maintainer) can run in 20 minutes to produce five short screen recordings that together tell the federation story. Stills alone don't sell it — the moment a friend's save splices into `/sparrow/friends/activity` with a green pulse is the pitch.

## Five recordings to capture

Each ~10-20 seconds. Captured on a clean browser profile at 2560×1440, retina-rendered, 60 fps.

1. **`01-dashboard-lane.mp4`** · `/sparrow`. Scroll from hero → rosette → friends lane. Click a friend's receipt → view-transition morphs into the reader. Total: ~15s.
2. **`02-activity-splice.mp4`** · `/sparrow/friends/activity`. Start with an empty feed. Trigger a public-saved-event publish from a second browser profile (or `nak`). Live splice animation lands at the top with the `new` moss pill, fades. Total: ~12s.
3. **`03-ambient-strip.mp4`** · any Sparrow page. Second profile enables ambient on `/sparrow/friends` → first profile's bottom-left strip lights up with the second profile's avatar. Total: ~8s.
4. **`04-signals-recap.mp4`** · `/sparrow/signals`. Scroll through the three panels. Hover a co-saved row → saver chips + first-picker star visible. Click `⤓ export JSON` → file lands in dock. Total: ~15s.
5. **`05-invite-flow.mp4`** · `/sparrow/friends`. Show checklist (3 of 4 done) → copy invite URL → paste in second profile → form pre-fills → one click → new friend appears in list → starter card card hides. Total: ~20s.

## Tooling

- Mac: `cmd+shift+5` built-in recorder, output as `.mov`, then `ffmpeg -i in.mov -vf "fps=30,scale=1280:-1:flags=lanczos" -c:v libx264 -pix_fmt yuv420p -crf 20 out.mp4` for X/web-friendly size.
- Or `asciinema rec` if the capture is terminal-flavored (not applicable here — GUI only).
- GIFs for HN / email: `ffmpeg -i out.mp4 -vf "fps=15,scale=720:-1:flags=lanczos" -loop 0 out.gif`. Keep under 8 MB.

## Environment setup

Document in the deliverable:

- How to spin up a second Sparrow identity (incognito + a throwaway Nostr signer like nos2x-dev-mode).
- The exact pubkey / setup used for the "friend" in each recording.
- Reset between takes: `localStorage.clear()` + service-worker `caches.keys().then(ks => ks.forEach(k => caches.delete(k)))`.
- How to fire a public-saved event out-of-band (via `nak event -k 30078 -d sparrow-public-saved-v1 -c '{"saved":{"value":["0362"],"updated_at":"..."}}' wss://relay.damus.io` or similar).

## Deliverables

1. `docs/reports/2026-04-22-demo-capture-playbook.md` with:
   - Tooling + ffmpeg commands.
   - Environment setup steps.
   - Per-recording: exact URL, exact user action, expected visual beat, duration, crop notes.
   - Troubleshooting (service worker cache bleed, view-transition flicker, etc).
2. Five captured MP4s + GIFs committed to `public/demos/sparrow/` (or a gitignored `captures/` dir with a README pointing at a CDN if they're too big for git).
3. Thumbnails (PNG, 1280×720) for each to use as video posters.

## Done when

- Mike can run the playbook solo and reproduce all five recordings in one sitting.
- Files exist at predictable paths that manus-03's tweet threads can reference.
- Update `docs/plans/2026-04-22-10-assignments.md` row for codex-03 to `shipped` with pointers.
