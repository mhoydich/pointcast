# Offered Light and PointCast Effects — draft review handoff

Michael approved a high-fidelity design board and working Offered Light prototype, then asked Terra to audit earlier PointCast motion/audio and begin reusable effects libraries that can improve over time. This additive draft implements that scope without changing existing games or deploying.

## Source and design

- Repository: https://github.com/mhoydich/pointcast
- Branch: `codex/offered-light-effects-20261027`
- Combined main base: `c756a6208415581e9b91296499088fd91dfe6d99` (includes the latest homepage showcase and block 0767).
- Editable Figma: https://www.figma.com/design/0nyhW3Nq8p0qboex8KqphU?node-id=2-17
- The existing Still Light PR #1555 remains separate and its review hold is not cleared by this work.

Astra produced an editable Figma board with three mobile compositions, named layers, tokens and component instances; the final screenshot was visually inspected. Sol implemented the creator/recipient/export controller. Terra audited prior apps, adapted the audio lifecycle, built visual helpers and independently reviewed cleanup/race behavior. The coordinating thread composed the working scene and playground and integrated the result.

## Added behavior

- `/offered-light-lab/`: three atmospheres, local personal words, candle illumination, touch-positioned water, optional sound, stillness, a quiet recipient preview, exact text preview, local PNG export, prepared-file sharing and save/copy fallbacks. The personal message comes before the ritual controls in the receiving composition.
- `/offered-light-lab/design-board.html`: standalone design reference; it is a proposal, not a screenshot of the running app.
- `/offered-light-lab/effects-lab.html`: actual playground for four reusable helpers.
- `/pointcast-effects/v0.1.0/`: immutable initial library, registry and README. Audio/ripple are implemented; candle/artwork helpers are experimental. Existing apps do not automatically adopt this version.
- `npm run test:pointcast-effects` and `npm run export:offered-light -- <output-directory>` provide repeatable verification and offline exports.

Sharing produces a still image or text, not a persistent interactive gift link. No server, account, prayer count, storage, tracking identity or runtime inference service is added. Names and messages are not sent except through an explicit user-requested share/copy/save operation. The core audio library starts without an AudioContext; sound requires an explicit enable action. No voices or prerecorded samples are added.

The versioning, critique and promotion process is documented in `docs/notes/pointcast-effects-library.md`. Continuous improvement means deliberate experiments and reviewed versions; no automatic background job, self-publishing or cross-app replacement is introduced.

## Verification boundary

Completed on the combined source above:

- `NODE_USE_ENV_PROXY=1 npm run build` passed: 3,767 Astro pages, 3,887 normalized HTML pages, 3,723 unfurls and 140 prepared game downloads.
- 55 focused/regression tests passed, including all 26 library/prototype/playground tests, previous Small Shrines audio/playback and game regression checks. No skips or failures.
- `npm run audit:agents` and `git diff --check` passed.
- Built HTML landmarks and local asset references passed for all three new pages. All 15 non-HTML prototype/library assets match source bytes.
- Offline HTML export and the portable ZIP were generated and checked; the design-board screenshot is from Figma.

Behavior tests cover delayed resume, graph failure, interruption, user-stop fades, late cleanup, bounded audio/ripples, keyboard origins, reduced motion, failed/superseded image loads, exact plain text, recipient preview, PNG invalidation, sharing cancellation, fallback copy/download, extreme line breaks and actual HTML integration. Browser audio, image decoding, Canvas and native sharing are mocked in these tests.

The final Figma board is visually inspected. The working HTML still needs a real-device pass for browser layout, 200%/enlarged text, OS Reduce Motion, VoiceOver, iPhone native sharing/cancellation, PNG visual fidelity and audible comfort/background interruption before production acceptance. No supported browser-control tool is exposed in this environment; no unsupported browser automation was substituted.

No new subscription, purchase, paid external generation, credentials, security settings, merge or release was made. Figma uses Michael's existing plan; the fonts and artwork are stored locally with their applicable font license files.

## Release coordination

This remains a draft, not live. Complete the device pass and independent review, fetch/integrate newer main while preserving other chats' work, and run the full build and relevant tests on the final combined source. Only the coordinating release owner should merge and use the existing `scripts/deploy.sh` lock on the authorized machine. Do not deploy the branch manually or bypass other holds.

After the coordinated release, verify the actual prototype pages, local assets, versioned library and registry, plus the prior prayer rooms and `/games/`. A commit, merged PR or green workflow does not prove the pages are live.
