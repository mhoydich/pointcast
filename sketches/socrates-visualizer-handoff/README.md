# OFF-54 B — additive handoff for Ada's PR1713

Shwa, Mike's AI agent. Draft only. No merge/deploy, no live writes, no duplicated game/portrait implementation.

Inspected PR1713 head `93f1235cbedcc7ebe619047874235d23c879cd0a`, which already integrates Sid's PR1714 portraits. The art supplier is Sid (not Tess). Read current #socratestag: Ada is refining the Apple-like shell and inviting Daniel's feedback. Do not overwrite her shell or simulate Daniel's reply.

This replaces the initial standalone rehearsal direction with a compact additive flame-side trail. Uses Ada's state event, her existing Hearth Kit, and Sid's same approved portrait map. Six last retained quotes; safe text rendering; self-declared handles always visible. No new art, duplicated media, game authority, network request or POST. No mock players in the integration.

## Exact integration (Ada applies to her current branch)
1. Copy `public/socrates-tag/visualizer*.{mjs,css}` and `tests/socrates-visualizer.test.mjs` from this bundle.
2. Add to the page head, after site.css:
   `<link rel="stylesheet" href="/socrates-tag/visualizer.css">`
3. Add below the existing hero (not inside the aspect-ratio clipped fire):
   `<section id="flame-trail" aria-label="Reported thought chain"></section>`
4. Load visualizer BEFORE client.mjs so it hears initial refresh:
   `<script type="module" src="/socrates-tag/visualizer.mjs"></script>`
5. In client's existing `socrates-state` detail append `portraits`:
   `detail:{...state,checkedAt:checked,portraits}`
6. In refresh catch, immediately after `checked=0`, dispatch:
   `document.dispatchEvent(new CustomEvent('socrates-read-failed'));`
   This avoids an active-looking highlight for up to 120 seconds following a failed refresh. Timer independently removes highlights on expiry/staleness.

No changes to Ada's rules, forms, write behavior, source receipts, manifest or adjudication. Paused/reduced-motion flame remains Ada's existing implementation. Sound remains disabled, matching A, rather than introducing unnecessary audio risk. No animation, canvas, external libraries or additional periodic network reads.

## Checks
`node --test tests/socrates-visualizer.test.mjs`: 10 passing focused tests. JS syntax passes. Manual code review verifies DOM textContent, local-allowlisted SVG paths, no model matching (Sid/Silas remain distinct), no fabricated unknown portraits, no fetch/POST/audio starts.
Browser/runtime/layout tests NOT run: environment Chromium socket restriction, no bypass attempted this round. Ada has a working browser check and should run it. Full build belongs to PR CI per repo OPERATIONS.md. Preview previous round was composition, NOT runtime evidence.

## Review before publish
- Test latest A head, not only pinned head above, as Ada is actively revising the shell.
- Phone/desktop: trail scroll contained, source links focusable, no horizontal page overflow.
- Fresh, stale, expired and attention fixtures. Failed read immediately removes active border.
- Initial event order and manifest reload repaint; no network writes from B.
- This displays a retained record, never declares someone out or admitted.

Accessible source handoff: this directory is isolated under `sketches/socrates-visualizer-handoff/` in a draft PR. It is not wired into any route and does not change Ada's branch. Ada owns B and can choose whether to copy the files using the integration steps above. Nothing is live; no merge/deploy authorized.

Run focused tests from this directory: `node --test tests/socrates-visualizer.test.mjs`. Rechecked PR1713 on 2026-11-14: still draft at the pinned head above. All ten tests and both module syntax checks passed again.
