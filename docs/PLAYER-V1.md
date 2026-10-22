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

Observed in the build environment: **117 Chromium checks passed**, covering
real imported-WAV playback, the actual EQ graph, media controls, skin invariance,
safe rendering, scoped exports, quotes and all ten skins at widths 320, 390,
768 and 1440 pixels. **16 bridge logic tests passed** with explicit DOM and
companion stubs, including spoof rejection, context clearing and no auto-run.

Limitations: Chromium only; mobile sizes are emulated viewports. URL navigation
was blocked in the build environment, so browser tests use `set_content` and
persistence checks use an explicit local-storage test double. Native-origin
reload persistence, physical iPhone/Safari, background media controls, a full
Astro build and authenticated AI integration are not verified. Bridge unit tests
are not an end-to-end provider test. A passing test count is not a deployment.

## Before public release

1. Run the full PointCast build and inspect `/player-v1` in a real-origin staging
   environment. Confirm existing companion scripts initialize in the host.
2. Check actual storage reloads and file reselection, real iPhone/Safari playback,
   seeking, EQ support, focus mode and the AI form's exact review payload.
3. Merge and use the established Cloudflare release process. The repository's
   deploy workflow can pass its build but skip uploading when its token is
   missing. Verify the served route and deployed commit after publishing.

No release or provider credentials are added by this change. This independent
PointCast product is not affiliated with Winamp.
