# Office project drawer · Shwa pilot

Draft, public-safe, read-only. One project: OFF-57/B, the Loom's reported task status.

The isolated sketch now also powers `src/pages/office/project.astro`, a real read-only
`/office/project/` route. It does not change the `/office` integration, its dependencies,
the live Loom, or any database. The PR is still draft and the route is not deployed.

## Use

From the repository root: `python3 -m http.server 8000`, then open
`http://localhost:8000/sketches/office-project-drawer-shwa/`.

The project card opens a native modal drawer. Escape/Close returns to the project.
The saved public report is available without contacting Loom. Optional Refresh makes
one credential-free GET, with an 8-second timeout and no automatic polling. Closing
aborts a pending read. Failure retains the saved snapshot and says so.

## Reuse, not a second state machine

- #1722's existing server-side `messages[].taskStatus` is the reported-state source.
  This sketch only selects OFF-57's B part. It does not parse or write reports.
- The test imports the existing `public/loom-task-status.mjs` implementation and
  verifies the multipart contract: part B done does not close the entire project.
- #1569 inspired the evidence-card layout and explicit check times. Its October
  project statuses are not copied. Its current draft should not be merged merely
  to provide this sketch.
- #1784 and the Office integration continue to own their existing files. No shared
  UI, dependency locks, declarations or release controls are edited here.

## Evidence and limitations

`project.json` is a minimal allowlisted public snapshot. Its report is dated by the
source reply, not by the time someone fetched it. A four-day-old report therefore
stays stale after Refresh. The separate evidence object records Shwa's GitHub
connector inspection of PR #1722's merge state and exact head. This is a manual
checked record, not a cryptographically authenticated identity or approval.

CI, production commit and physical-device checks are deliberately unknown. The
model cannot infer those from DONE, MINE, merged, or verified-sender fields. Checked
merge evidence expires after 24 hours. Missing, invalid or future UTC times fail
closed. A future integration should keep each evidence source separately dated,
not add an automatic action to this read-only UI.

All content is rendered as text, with a narrow evidence-link allowlist. Never add
private tasks, chat URLs, local paths, credentials, edit tokens, personal details or
approval payloads to this snapshot. The public report adapter discards extra API
fields and message bodies. No wallets, signing, spending, merge or deploy controls.

## Checks

`node --test sketches/office-project-drawer-shwa/model.test.mjs`

Nine focused tests pass: strict UTC, stale evidence, merge≠release, missing evidence,
URL safety, actual #1722 multipart reuse, missing/wrong-room reports, report/evidence
separation, and missing/nonboolean merge flags. `node --check` passes for app/model scripts.

Chromium UI QA was attempted twice, including the permitted elevated retry. The
container denied its singleton socket (`Operation not permitted`), so no screenshot,
layout pass, physical phone test or heard-audio claim is made. Full Astro build was
not run, per cloud-memory guidance; the exact new route compiles in a minimal Astro 6.1.6 fixture, not the full site.
Before integrating, visually check 390px and desktop, keyboard focus/Escape,
close-during-refresh, repeated refresh, failed refresh, scrolling and links.

Coordination claim: https://pointcast.xyz/loom?to=loom%3A0c4fe73d9b7a2a11f5f75e2b%23m_3r1o713268

DOM-only mocked-network QA also passes with jsdom 26.1.0:
`node sketches/office-project-drawer-shwa/dom-check.mjs` (or set `DRAWER_JSDOM`
to an installed jsdom package). Covers open/close/reopen, duplicate-click
suppression, success/failure refresh, close-abort and focus return. Native dialog
methods are shimmed, so this does not replace the blocked real-browser checks.

## Integrated route

The production route imports the sketch's shared CSS and app module, embedding only
the reviewed public JSON with `<` escaped to prevent script termination. It does
not fetch a nonexistent relative project.json. The standalone sketch retains its
local JSON fallback. All sources are still explicitly dated; this route has no
server/API secrets or database dependencies.

`DRAWER_ASTRO=/path/to/astro/bin/astro.mjs node sketches/office-project-drawer-shwa/check-route.mjs`
compiles the exact route and checks its output/bundled script/embedded JSON. The
focused GitHub workflow also runs the model and mocked DOM tests. Visual QA and
independent release review remain separate gates.
