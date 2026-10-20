# Small Shrines release

## Scope

Four secular one-minute spaces at `/small-shrines/`: Ocean, Garden, Night and Memory. Each offers an artwork, a visual focus, four gentle original prompts, a full readable transcript, optional timing and independent ambient sound. Visitors can keep their eyes open, breathe naturally, pause or leave freely. No medical claims.

Ocean and Night were made with OpenAI image_gen for this project. Garden and Memory are existing Michael Hoydich Midjourney works, verified by opening the authenticated `@mhoydich` Spotlight profile and both job details in Chrome. Original JPEGs were saved through Chrome, then resized/compressed without creative edits. Editorial shrine names are not claimed original artwork titles. Public provenance records source links, exact generation prompts, dimensions, bytes and SHA-256 hashes at `/images/small-shrines/provenance.json`.

Four original procedural audio modes (Tide, Warm Drone, Bowl, Soft Pulse) use no samples or paid service. Sound begins only on Listen. Stop closes/disconnects resources; volume, mute, cancellation-safe startup and page lifecycle cleanup are supported. See the separate audio audit for existing Nouns/Drum implementation review and provenance decisions.

Discovery includes homepage New Today and a permanent shrine room entry, Block 0719, app launch strip/catalog, agent indexes, llms, shrine index and its JSON. Existing Elemental Shrine and Open Road rooms remain intact. Work excludes IndustryNext PR7, internship1434, auth/security changes, comic PDF work and Good Feels.

## Verification

- Independent source review completed. Fixed the countdown's implicit live announcements, nested main landmark, and inaccurate sound copy.
- Client/audio/data TypeScript checks pass.
- 23 focused shrine tests pass, including 16 new client/audio tests for delayed-start cancellation, all synthesis modes, mute/volume/stop, timing/pause/resume/completion, room changes, hidden/pagehide and Astro cleanup/rebind.
- Agent surface audit passes. All four image file hashes, dimensions and byte lengths independently match provenance.
- Chrome: desktop 1102px, narrow 390px and 320px inspected. No horizontal overflow. All four images load at natural width1536. All sound modes reach playing; Stop, mute/unmute, mode/room changes and keyboard Enter/Space timing controls verified. Range and mute touch targets are44px. Reduced motion rules remove animations/transitions; no decorative continuous animation is used.
- Normal full suite executed:4138 tests,4049 pass,55 fail,9 cancelled,25 skipped. Baseline comparison is recorded separately; no claim that the full suite is green.
- Full site compilation and final publication verification were in progress when this note was first written; the PR and task status record their final result.

Physical iPhone/Safari touch testing and actual speaker/headphone listening were not performed. Browser state and automated audio graph tests verify activation/cleanup; they do not verify subjective sound quality or real-device output.
