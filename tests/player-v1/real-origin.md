# Player v1 real-origin verification

`real-origin.cjs` starts a localhost-only static HTTP server, opens the actual app URL in headless Chromium, and verifies real browser storage and actual media decoding. It does not use `set_content`, an audio stub, or a localStorage double. It makes no dependency or media downloads.

Prerequisites:

- Node.js and the `playwright` Node package.
- Playwright Chromium, or set `CHROMIUM_PATH` to an installed Chrome/Chromium executable.
- A local playable MP3 longer than one second supplied with `PLAYER_QA_MP3`. Use an original or otherwise permitted fixture. Alternatively set `LAMEJS_SCRIPT` to a local trusted `lame.all.js` encoder; the runner then generates an original eight-second 440 Hz MP3. The WAV fixture is always generated locally.

Run from the repository root:

```sh
PLAYER_QA_MP3=/absolute/path/to/test-tone.mp3 \
CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node tests/player-v1/real-origin.cjs
```

If Playwright is installed outside ordinary Node resolution, set `PLAYWRIGHT_MODULE` to its absolute package directory. `PLAYER_PROJECT_ROOT` can override the source checkout. `PLAYER_QA_OUT` can select an output directory; otherwise a unique directory under the system temporary folder is created. The final JSON contains the tested source SHA-256 hashes, actual browser version, individual checks, observed requests, and limits. Keep the reports and desired screenshots, then delete the temporary output directory.

Coverage includes actual playback of all three synthesized studies and imported WAV/MP3 files; EQ graph, transport, seek, mute and volume; native reload/reselection/reset; metadata-only exports; malformed imports and literal text rendering; exact AI brief export; quote expiry and approval-time input revalidation; all ten skins and exact still-canvas invariance; keyboard/modal focus; real PNG capture; reduced motion; drag/drop and analyser response; four viewport widths at 100% and 130% text; enlarged-text scene/control overlap and skin-title clipping.

The suite uses a controlled `Date.now` offset only to exercise five-minute quote expiry without waiting five minutes. That does not substitute for native persistence or media tests.

Limits: desktop headless Chromium, emulated mobile viewport dimensions, local HTTP rather than Cloudflare staging, no physical iPhone/Safari or background Media Session test, no subjective audibility assessment, and no authenticated provider execution. A passing run is not a deployment or a physical-device certification.
