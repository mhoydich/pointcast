# Open Channel — first playable edition

User direction: build something from https://block.xyz/dessa, then “ok yah lets try, on pointcast.”

Route: `/open-channel/`; machine sibling `/open-channel.json`; app shelf; Block 0766. Original authored scenes, two choices per beat, twelve endings. No inference, API calls, secrets, external dependencies, or Dessa model. Optional browser speech synthesis; opt-in browser speech recognition understands explicit one/two commands. It is turn-based, not full-duplex. All scene sessions and notes remain in tab memory; export downloads text.

## Dessa boundary

Read Block’s first-party page on 2026-10-25. It describes a full-duplex speech model trained from human conversation and claims local inference on a MacBook Pro M4 Max or better. At this check the Download control was a placeholder, launch links were coming soon, and the page invited a small group of safety researchers to apply. No public developer protocol, model package, distribution license, tool calling, or persona-control interface was verified. Do not present the browser demo as Dessa or a quality benchmark.

A future integration needs actual access and documentation first. Evaluate audio transport, cancellation, echo handling, supported context/persona controls, license, local hardware, and deployment restrictions from that release. The current engine API is app-owned; it is not a claimed Dessa adapter.

## Verification

Seven focused tests passed: all twelve endings, invalid input, exact voice commands, exported content, per-scene notes, stale narration callbacks, and microphone errors/cancellation. Independent code review passed after timer cleanup and microphone-on-collapse fixes. Real browser checks passed for a full ending, scene switching, narration start/stop, note entry, and initiating transcript download. The 390px iframe layout was visually checked in the browser; this is not a physical phone test. `npm run build:bare` is the compilation gate. Microphone permission and audio quality still need a physical-device check; automated mocks verify lifecycle handling, not sound quality.

Release via `scripts/deploy.sh` after independent review and PR merge. No separate Worker or model service.
