# Nouns Drum Club

Mike requested a new full-keyboard, multiplayer Nouns music experience, a dedicated Nouns page, and a homepage module. Astra integrated the instrument and release; Sol built the audio and score engine; Terra extended the existing drum room; Luna built discovery and the Nouns directory.

## Experience

- `/nouns/drum-club/`: 36 keyboard sounds across drums, bass, mallets, chords, and sparkle, with a reactive band made from existing local Nouns SVGs.
- A 16-step editable loop, eight initial lanes, additional sound lanes, three presets, 60–180 BPM, swing, and quantized overdub. Scores persist in the browser and travel in a beat URL. Opening a score never autoplays.
- Opt-in `ndc-` rooms transmit human-played keys and reactions through the existing Cloudflare DrumRoomV2. Sequencer playback and edits remain local. Room status reflects the actual socket/capability handshake. No account, wallet, or microphone.
- Responsive touch pads, three scenes, reduced-motion controls, master volume, and a real audio-output meter. Escape, mute, hidden tabs, and teardown cancel scheduled audio.
- `/nouns/`, a homepage module, Block 0604, JSON twin, app and play catalogs, Drum Directory, sitemap generation, and agent discovery.

## Verification and release gates

Focused coverage tests all 36 sound families, score bounds and round-trips, swing timing, the browser Buffer-polyfill regression, silent mount, keyboard guards, audio cancellation, teardown, large welcome/presence frames, and stale sockets. Worker tests cover peer fanout, legacy-pad isolation, and a 100-connection room, plus existing counters. Worker type generation, typecheck, tests, and deploy dry-run pass.

Browser checks exercised keys, loop playback, overdub, mute, an actual nonzero Web Audio output meter, and a 390-pixel layout with no horizontal document overflow and touch pads wider than 60 pixels. Physical speaker audibility is not established by the output meter.

The broader suite found two unrelated existing failures: Railroad Time refers to absent `src/content/blocks/0601.json`; the global SEO scan flags multiple H1s on `/rewards/start/` and noindex routes in the generated sitemap. Those source files are unchanged in this release. The short LLM index remains within its existing line limit.

Deploy the unchanged-binding `pointcast-drum` Worker before Pages, then run `node scripts/qa-nouns-drum-club-room.mjs https://pointcast.xyz/api/drum/room`. The live probe uses unique rooms, verifies all 36 pad IDs between clients and isolation from a third client, then closes every socket. Canonical page/asset checks must follow the Pages deployment; this checked-in preparation log alone is not evidence of production release.
