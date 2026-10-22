# Small Shrines audio audit — 2026-10-20

Inspected repository base: `ab5124a36a7f8e63fdeef63a75686e565eba0f8f`. Scope: existing Nouns/Drum synthesis, samples, ambient rooms, sequencers, control/lifecycle patterns, and accessible associated source docs. Existing experiences are preserved; this release changes none of their audio.

## Reuse decision

Small Shrines uses new, original, sample-free Web Audio in `src/lib/small-shrines-audio.ts`. Silence is the initial state. Four opt-in choices are Tide (filtered generated noise), Warm Drone (two quiet sine notes a fifth apart), Bowl (three decaying sine partials every 7.2 seconds), and Soft Pulse (one gently falling sine drum every 2.1 seconds). These are synthesized approximations, not field recordings or recordings of an acoustic bowl.

The most suitable existing design patterns are the bounded source ownership and compressor in Nouns Drum Club, quiet fifth/LFO palette in Co Games, and the gesture/timeout/cancellation model in STARJAM. The implementation is purpose-built so it does not inherit unrelated game logic, remote drum events, or timers from older rooms. It fetches no audio, calls no paid service, and relies on no third-party sample license.

## Existing options examined

| Surface/source | Available audio | Decision / provenance |
| --- | --- | --- |
| `src/lib/nouns-drum-club-audio.ts`, `nouns-drum-club-score.ts`, `nouns-drum-club-ui.ts` | 36 procedural pads: kick/snare/clap/hats/toms/rim/shaker/tambourine, bass, mallets, chords, sparkle; compressor, bounded voices, volume/mute/stop/dispose; 16-step tempo/swing sequencer | Strong reusable ownership pattern. No recorded samples. Full game instrument/sequencer is unnecessarily large for a quiet shrine. |
| `src/lib/co-games-audio.ts` | Drift/Gentle/Playful palettes; low sine fifths with slow modulation, small generated-noise and tone effects | Best quiet-drone reference. Uses gesture unlock, visibility handling and bounded effects. Small Shrines uses an original restrained two-note arrangement. |
| `src/lib/nouns-flow-audio.ts`, `nouns-flow-media.ts` | Procedural STARJAM instruments and finite local media, explicit speaker test, timeout/cancellation/interruption logic | Best activation reference. Small Shrines uses independent context ownership to avoid late-resume races. |
| `public/audio/starjam/manifest.json` and local `.m4a` assets | Twelve 35-second songs at three paces across four worlds; welcome/hit/clear cues | Manifest explicitly says locally synthesized, no samples/paid APIs, `loop:false`. Suitable finite music but stylistically busier than shrine sound. Not relabeled as ambient loops. |
| `src/lib/bellflower.mjs`, `bellflower-audio.ts` | Bronze arrival, Paper lantern, Water glass, Ember bowl, Soft signal, Element chord, Stone choir, Night lantern, Thresholds, Garden resonance; generated noise/convolution/partials | Useful timbre vocabulary. Older engine tracks gain/voice ends rather than all active sources; do not transplant its lifecycle unchanged. No externally fetched samples in the inspected engine. |
| `src/pages/drum.astro` | Taiko-style sine/noise thumps, bell/shaker-like voices, networked room sounds | Original procedural options already on main. Its general interaction priming and remote room playback are outside this page's explicit Play-only model. |
| Historical sound-pack commit `3164da78` (`codex/drum-sound-packs-20260610`) | Taiko / trap / jazz / lo-fi remappings of five procedural voices; filters, envelopes, partials, noise; local preference buttons | Inspected committed source from Git. This switcher is absent from current main. “Packs” here are synthesis parameter sets, not downloadable sampled recordings. No historical changes are imported. The old Documents worktree read stalled and was cancelled; committed source was readable. |
| `src/pages/drum-jam.astro` | Six-part multiplayer kick/snare/hat/bass/lead/shaker with 16-step patterns | Useful sequencer pattern, but room networking and dense rhythm are unrelated to this quiet experience. |
| `src/pages/drum-tide.astro` | Filtered-noise tide and slow panning | Useful texture reference. Static review confirms recursive `panSweep` and `brightenSweep` timeouts without tracked cancellation in Stop. Not reused. This is a source finding, not a reproduced production bug. |
| `src/pages/drum-bath.astro`, `drum-aurora-v2.astro` | Sustained drones, fifths and LFO modulation with slow animated scenes | Texture references; inspected source lacks complete source/timer disposal matching this release's requirements. Not transplanted. |
| `src/pages/drum-meditate.astro`, Drum bell/zen/mantra/shrine families | Synthesized bell/pulse cues and timed rituals; `drum-shrine.ts` rotates a Noun | Kept existing experiences intact. Small Shrines does not require synchronized breathing, breathing holds or remote counters. |
| `src/pages/elemental-shrine.astro`, `src/assets/shrines/elemental-shrine/soundscape-provenance.json` | Existing 30-second ElevenLabs Sound Effects loop plus interactive shrine | Provenance records generator, prompt, source/encoded hashes and public deployment note. It does not establish this account's license entitlement. Not reused or regenerated. Source catch sets persistent `audioFailed`; Small Shrines instead permits retry after a failed Play. |
| `src/lib/moods-soundtracks.ts` | Spotify/YouTube embeds | Remote players, not reusable local licensed audio. Unneeded account/network dependencies; not embedded or downloaded. |
| `public/chime/chime-demo.wav`, `src/pages/chime.astro` | 5.48-second generated HELLO/ACK data packet demonstration | A protocol test sound, unsuitable for ambient reuse. |
| Historical `docs/audit-2026-05-10-audio.md` at `3164da78` | Earlier cast/music/drum audit, including iOS suspension and schedule cancellation concerns | Historical guidance only, not evidence that those older findings still reproduce on current main. |

Repository-wide filename and source search found 93 current Drum/audio files with AudioContext/oscillator/buffer-source/media constructors. The above table covers the relevant distinct synthesis, media, ambient and sequencer families; this is not a claim to have listening-tested all 93 implementations. Current local audio-file inventory contains STARJAM assets, the existing Elemental Shrine track and Chime demo. No separate current sampled Drum pack was found.

## Lifecycle and controls

- No context is created during construction, preferences, page load, or return from a hidden tab. `start(mode)` must be called from the page's explicit user activation.
- Start invokes browser `resume()` synchronously in that activation, then waits at most 2.5 seconds. Stop, another Start, hiding, navigation or disposal invalidate the attempt. Failure can be retried.
- Every playback session owns its context, source/node sets, timer and activation timeout. Stop synchronously disconnects every graph and calls `close()`. Late resolution of an old resume cannot reconnect or start its sources.
- Volume is finite and clamped 0–1, initial 35%; overall master scaling is 0.28 and individual sounds are restrained. Mute and zero volume set master gain to zero immediately. These digital limits are not hearing-safety guarantees for arbitrary speaker/headphone output levels.
- Pulse/Bowl have one tracked timer and at most six active voices. After a delayed timer, a single new sound is scheduled from the current time; missed beats are not replayed. No network or sample download happens.
- Hidden pages, `pagehide` and `astro:before-swap` stop playback; returning does not restart it. Disposal removes lifecycle listeners. The parent page owns accessible labels, keyboard buttons, visual reduced-motion behavior and the meditation timer.

## Validation and remaining checks

`node --test tests/small-shrines-audio.test.mjs`: 10 passing tests cover initial silence, all four modes, rapid Start/Stop, pending mode replacement, late resume, timeout/retry, volume/mute, hidden/pagehide/Astro stop, interruption/dispose, bounded percussion and rejected resume.

`node node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --lib ES2022,DOM src/lib/small-shrines-audio.ts`: passed.

An independent read-only source reviewer found no actionable lifecycle or resource-management findings in the engine and focused tests.

These tests use a fake AudioContext and JSDOM. They establish lifecycle/state behavior, not actual speaker output. Desktop browser start/stop, keyboard controls, visual integration, and production loading belong to the release checks. Actual iPhone/Safari touch, hardware listening, silent-switch behavior, Bluetooth routing, and long-duration listening remain unverified. Browser interruption handling fails closed and asks for another explicit Play.
