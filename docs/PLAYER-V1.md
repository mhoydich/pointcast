# PointCast Player v1.0.0

Local-player beta: actual audio playback and ten skins, not a screenshot UI.
The feature is additive. It does not change the homepage, old prototypes,
existing Layers button, authentication implementation or deployment workflow.

## Routes and files

- `/player-v1`: Astro host with an isolated player iframe and export-only AI brief instructions.
- `/player-v1/app.html`: dependency-free player, without an account requirement.
- `/player-v1.json`: machine-readable capabilities and validation boundaries.
- `public/player-v1/{player.css,player.js,host-bridge.js}`: static assets.

These are intended routes in this change, not a claim that it is already live.

## Implemented

Local-file picker and drag/drop, play/pause/stop, seek, previous/next, shuffle,
repeat, playlist reorder/filter/remove, JSON list import/export and missing-file
reconnection. Three original 32-second PCM sound studies are synthesized locally.

One persistent HTML media source feeds ten real Web Audio equalizer filters,
-12 dB headroom, a compressor, master gain and a live analyser. Presets, bypass,
volume and mute change real graph values. Media Session hooks are feature-detected.

Four new appearance editions: Chrome 2028, Tokyo Nights, Quiet Living and Light
Works. The original six remain as lightweight token presets: Sparrow, Harbor,
Paper Machine, Terminal '88, Gallery and Playroom. Skin switching does not change
the sound, visual scene, selected notes or print quote.

Three original procedural scenes, actual spectrum/waveform visualization,
focus mode, PNG capture and reduced-motion handling. Timestamped private notes,
workspace presets and explicit selected-context AI brief export are included.

Commerce is only a fictional print-quote rehearsal. It checks scene/quantity,
five-minute expiry and approval-time validity. Listening settings and skins do
not invalidate a print quote. No real merchant, taxes, shipping, license for
music, payment, inventory, redemption or order is provided.

## Privacy and storage

Audio files remain on the device and are never uploaded or persisted. A saved
playlist remembers metadata, not audio bytes; reselect original files after a
reload to reconnect them by name, byte size and last-modified timestamp.

Notes and settings use `pointcast.player.v1` in browser local storage when
available. This is not encrypted storage or cloud sync. Reset touches only this
key. The player accepts at most 100 tracks and 250 MB per imported file.

The standalone app makes no external calls and has `connect-src 'none'`.
There are no external fonts, framework imports, trackers or microphone access.
Skin imports use a fixed allowlist; no executable CSS, scripts or remote URLs.
A skin preset exports appearance only. Workspace exports contain settings only.

## AI brief export — public-beta fallback

The public beta offers **Prepare/export AI brief**. Live handoff is disabled in
both the player and host, and the JSON twin reports `prepare-and-export-only`.
The host does not load the player companion bridge or embed a player-specific
AI review form. Shared site tools remain independent of the player.

The player previews the exact exported text. Track title and checked notes are
excluded unless separately selected. Audio and credentials are never included.
No provider call or task runs from the player. Existing host-bridge source and
its security tests remain for a later reviewed integration; passing those unit
tests does not enable the public feature.

Enabling handoff later requires actual staging-origin verification of sign-out,
unpaired, offline, timeout and ready states, plus one harmless authorized draft
through the real companion. The sequence must remain prepare, preview, explicit
handoff, companion review, then explicit Run. Validate the final companion prompt
including its wrapper against the runtime limit before enabling handoff.

## Reproduce tests

```sh
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/player-v1/regression.py
node tests/player-v1/host-bridge.test.mjs
```

Set `CHROMIUM_PATH=/path/to/chromium` to use a system browser. The browser suite
assembles the three static files inline and writes results into ignored
`tests/player-v1/artifacts/`. The bridge suite writes its own ignored report.

## Release validation — 2026-10-22

The original suite passes **117 Chromium checks**, with inline content and an
explicit storage double. **16 bridge unit checks** pass with simulated companion
DOM; that bridge remains disabled in the public beta.

**227 real-origin Chromium checks and 80 mobile/focus layout cases pass.**
The separate [real-origin suite](../tests/player-v1/real-origin.md) uses actual
HTTP navigation, browser localStorage, generated WAV and actual MP3 files. It
covers native reload/reselection/reset, actual audio and EQ, ten skins, private
notes, scoped exports, quote validation, safe imports, keyboard, PNG capture,
reduced motion and enlarged text. Its JSON report records exact asset hashes.

Desktop Safari smoke checks on a localhost origin verified original-study and
local MP3 playback, a skin change during playback, skin restoration after reload,
and the expected original-file reconnection state. This was a native Safari UI
check, not Playwright WebKit or an iPhone claim.

Independent code review identified and verified fixes for reset restoring
previously deleted data, unnamed dialogs, ineffective text scaling and mobile
scene/control overlap. The enlarged mobile focus view may scroll vertically;
its fixed mini transport remains available.

Physical iPhone/Safari, real Cloudflare staging, authenticated AI execution and
production deployment are not yet verified. A static host test cannot certify
Cloudflare Functions. No live AI capability is advertised by this release.

## Publication gates

1. Run `npm run build:bare`, both original suites and the real-origin suite on
   the release candidate. Record the tested commit and source fingerprints.
2. Verify the built host and export-only mode, actual storage and file
   reselection, and physical iPhone/Safari behavior. Keep unavailable checks
   explicitly pending; never turn viewport emulation into a device claim.
3. After release checks and review, merge and use `scripts/deploy.sh` per
   `docs/OPERATIONS.md`. Verify actual deployment metadata and served assets.
4. After the player is live, add one Player entry to the existing app registry,
   inspect the homepage and Layers control, and file the town-inspector report
   in a follow-up PR.

No release or provider credentials are added by this change. This independent
PointCast product is not affiliated with Winamp.
