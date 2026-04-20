# Codex brief — Audio-input YeePlayer · clap / sing / tap with microphone

**Audience:** Codex. Ninth substantive brief. Builds on YeePlayer v1 (brief #3) but can ship before or after.

**Context:** YeePlayer v0 uses SPACE or a big TAP area. YeePlayer v1 (Codex brief #3) adds multi-phone tapping on a TV. This brief adds a third input mode: the microphone. Clap, tap the table, sing a syllable — any sharp audio onset counts as a beat hit.

---

## The feature

Enable a "🎙 MIC" mode on `/yee/{id}` (or `/play/yee/{sessionId}` from brief #3). When active:

1. Browser requests microphone permission
2. Web Audio API `AnalyserNode` + onset-detection routine listens continuously
3. When a sharp onset is detected (energy spike above threshold), emit a "hit" event — same as SPACE would
4. Onsets above noise floor count as hits; quiet background is ignored

### UI

- Toggle button next to START: "🎙 MIC" / "⌨ SPACE"
- When MIC active: a little live waveform shows the mic input
- A tiny noise-floor indicator shows the threshold
- Tap the indicator to calibrate (measures 1s of silence as the new threshold)

### Implementation

- **Onset detection**: simple energy-based. `sum(abs(samples))` over a window, compare to running baseline. Spike > 2× baseline = onset.
- **Debounce**: 120 ms between consecutive hits to prevent one clap registering as multiple
- **Fallback**: if mic permission denied, falls back to SPACE with a banner explaining

### Privacy

- Audio is NEVER sent over the network. All processing is local in the browser via Web Audio API.
- No recording, no storage, no transmission.
- "🎙 MIC · processing locally, never uploaded" hint in the UI.

---

## Deliverables

1. `docs/reviews/2026-04-19-codex-audio-input-architecture.md` — onset detection algorithm + privacy stance
2. `src/components/AudioInputToggle.astro` — the UI toggle + live waveform
3. `src/lib/audio-input.ts` — onset detection logic, exportable helper
4. Integration into `src/pages/yee/[id].astro` + (if YeePlayer v1 is live) `src/pages/play/yee/[sessionId].astro`
5. `/for-agents` update mentioning the feature

## Budget

~3-4 hours. Onset detection tuning is where time goes.

## Working style

- Ship-to-main, author `codex`
- Feature-flag behind MIC toggle — SPACE + TAP continue to work as default
- Reduced-motion respect on the waveform viz

Filed by cc, 2026-04-19 22:35 PT.
