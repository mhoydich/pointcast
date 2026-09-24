# Layers Radio — acoustic spike (stage B)

Local browser send/listen harness for the Layers Radio PRD. Not wired into
`pc-layers.js`, not built by Astro (`sketches/` is outside `public/` and
`src/`), not deployed. Production Radio stays off until the acceptance gates
in `Documents/Codex/2026-09-24/can/outputs/layers-radio-build-review.md` pass.

## What is here

| File | Purpose |
|---|---|
| `vendor/ggwave-0.4.0/` | Pinned ggwave build + MIT license. Hashes in `PIN.md`. |
| `radio-frame.mjs` | v1 frame codec (13-byte header, optional noun, ≤32 UTF-8 bytes, max 47), strict validation, sequence keeper with alias rotation on wrap, bounded dedup on (alias, id), token-bucket limiter. Seven moods preserved with motif/overlay notes. |
| `radio-frame.test.mjs` | 13 `node:test` cases: round-trips, 32/33-byte boundary, every rejection rule, surrogate pairs (mixed valid + unpaired), two-tab sequence coordination, dedup, wrap, limiter. |
| `radio-controller.mjs` | Send / Preview / Listen state machine with every browser primitive injected. Serialized mic requests with generation guard, self-echo guard, receive pipeline (validate → dedup → limits). |
| `radio-controller.test.mjs` | 11 cases with a deferred `getUserMedia` stub: Stop / Escape / hidden while pending discards the late grant and stops its tracks, serialized requests, stop → restart with a late first grant, denial + retry, preview never encodes or plays modem audio, honest send states, mutual exclusion, echo guard, receive pipeline, motif plans. |
| `radio-motifs.mjs` | Pure motif plans for the seven moods (Preview and future receiver motifs). No modem fields. |
| `measure.mjs` | Encodes the golden fixtures with ggwave, measures waveform duration per protocol, software-loopback decodes. Writes `fixtures/`. |
| `fixtures/frames.json` | Final byte-level frames (hex) for each fixture. |
| `fixtures/measurements.json` | Durations, peaks and loopback results. |
| `index.html` | Browser harness on top of the controller: mood row, optional note with byte budget, Send (Preparing → Playing → Broadcast played), Preview (local motif + wash only), Software loopback, Listen (mic only on click), Stop / Esc teardown, last-10 inbox tagged unverified. |

Run:

```bash
node --test --test-timeout=8000 sketches/radio-spike/radio-frame.test.mjs sketches/radio-spike/radio-controller.test.mjs
node sketches/radio-spike/measure.mjs
python3 -m http.server 4531 -d sketches/radio-spike   # then open http://localhost:4531/
```

## Measured (ggwave 0.4.0, 48 kHz, 1024 samples/frame, volume 25)

Raw burst only. The product adds a call-sign melody before it. Software
loopback is codec evidence, not a room test.

| Fixture | Bytes | audible normal | audible fast | audible fastest |
|---|---|---|---|---|
| mood only (Calm) | 13 | 2.027 s ✓ | 1.579 s ✓ | 1.131 s ✗ |
| mood only (Goodnight) | 13 | 2.027 s ✓ | 1.579 s ✓ | 1.131 s ✗ |
| mood + noun | 15 | 2.219 s ✓ | 1.707 s ✓ | 1.195 s ✗ |
| mood + "game on" | 20 | 2.795 s ✓ | 2.091 s ✓ | 1.387 s ✓ |
| mood + "love 💛🌊" | 26 | 3.179 s ✓ | 2.347 s ✓ | 1.515 s ✓ |
| mood + 32-byte text | 45 | 4.907 s ✓ | 3.499 s ✓ | 2.091 s ✓ |
| mood + noun + 32-byte text (max, 47) | 47 | 5.099 s ✓ | 3.627 s ✓ | 2.155 s ✓ |

Findings:

- **Audible fast is the spike default.** Every fixture loops back exactly, 1.58 s for a mood and 3.63 s for the largest frame, inside the PRD's 5 s text target with room for a call sign.
- **Audible fastest fails on 13 to 15 byte frames.** The decoder returns one junk byte (`00` or `03`) instead of the frame, consistently across 44.1/48 kHz, 512/1024 samples per frame, 128/480/1024-sample callback chunks and with or without lead-in silence. So it is a codec property of short payloads in this build, not a buffering artifact. The frame validator rejects the junk (`length`), which is the reason strict validation runs before anything else. Fastest stays out of the primary UI, as the review brief asked.
- **Audible normal fits mood-only in 2.0 s** and the 47-byte frame in 5.1 s, just over the text target. Keep it as the fallback if fast proves unreliable on real devices.
- Encoded output must be copied out of WASM memory immediately (Chime lesson); the harness and `measure.mjs` both slice the buffer.

## Contract points implemented in the harness

- Sender vocabulary is Preparing → Playing → Broadcast played. No Delivered, no receiver assumed, no ACK.
- Send needs a click and no mic. Listen requests the mic only when pressed; `echoCancellation`, `noiseSuppression` and `autoGainControl` are requested off and the actual track settings are logged.
- Stop, Esc (also from the text field), page hidden and pagehide stop playback, clear the cooldown, stop every mic track, disconnect the processor and free the decoder. Reopening creates fresh nodes.
- The mic is never routed to the speakers (processor output is zeroed) and never recorded or uploaded. Decoded text is inserted with `textContent` only.
- Self-echo suppression covers the whole burst plus 250 ms after playback completes. Sends serialize through complete playback then an 800 ms cooldown.
- Receive path: validate → dedup on (alias, id), 256 entries → global limiter (1/s, burst 4) → per-alias limiter (0.5/s, burst 3) → inbox of 10, tagged RECEIVED · UNVERIFIED.
- Alias is 4 random bytes in `localStorage`, with a visible reset. The message id wraps at 65535 and the alias rotates. Allocation is read-modify-write on the shared store on every `take()`, so two tabs of the same browser never hand out the same (alias, id) in sequence and both follow a reset or rotation; a `storage` listener refreshes the shown alias. The residual race is two tabs calling `take()` in the same instant, which is the storage layer's window, not the codec's.
- Text validation scans every surrogate code unit: a high must be followed by a low, a low must follow a high. "😀 + lone high surrogate" is rejected, not silently turned into U+FFFD.
- Preview plays only the mood's local motif from `radio-motifs.mjs` plus a colour wash. It never encodes a frame or touches the modem path (controller test 6 pins this).
- Listen serializes permission requests and tags each with a generation. Stop, Escape, page hidden and pagehide bump the generation; a grant that resolves afterwards has every track stopped and is never attached (controller tests 1, 3, 5).

## Oversight findings addressed (2026-09-24)

1. Pending `getUserMedia` could not be cancelled → generation guard + serialized requests in `radio-controller.mjs`, tests 1–5.
2. Preview played the modem waveform at lower gain → Preview is motif-only via `playMotif`, test 6.
3. Two tabs shared alias + sequence 0 → coordinated allocation through the store, frame test 21.
4. Surrogate check accepted mixed valid + unpaired → per-pair scan `isWellFormed`, frame test 20.
- `NOUN_MAX` is 1199 for the spike (Visit Nouns seed range). The PRD leaves it to be frozen with the schema.

## Not done here, on purpose

- No transient mood overlay or motifs on the receiver, no integration with `pc-layers.js` (stage C/D).
- No AudioWorklet yet; the spike uses ScriptProcessorNode for the mic tap. The product path should move to a worklet.
- No two-device room test. Loopback proves the codec, nothing about air. Stage B closes only after real two-device trials in both directions at 1 m, then 2 m and 5 m.
