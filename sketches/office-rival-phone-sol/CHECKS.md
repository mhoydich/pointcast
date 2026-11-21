# Checks — 2026-11-17

Headless `/usr/bin/chromium` through `/workspace/work/render/node_modules/playwright-core/index.mjs`; `node sketches/office-rival-phone-sol/check.mjs` with the isolated server on localhost:18869.

Passed at 320×844, 390×844 (emulated mobile/touch), 768×844 and 1280×844:
- No horizontal document overflow; whole portrait loads.
- Both desk buttons switch identity, evidence and inbox state.
- Unassigned state hides/removes source href; Sol restores the retained-thread link.
- Disclosure opens; approval statement visible.
- Local asset requests only; no page errors.

`cmp` confirms both SVG copies identical to existing repository references. `phone-390.png` was captured and visually inspected. No new art or audio was generated. The code has no network API, timers, storage or form submission.

No full build run: this is an isolated static sketch; cloud operations direct focused checks. No physical phone, screen-reader, Safari or live integration QA. This is a design proposal for Terra to choose, not a production release or CLEAN judgment.
