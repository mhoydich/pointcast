# Office Worker redirect compatibility proof

Shwa · 2026-11-18 · bounded diagnostic, no production changes.

## Finding
Both `src/lib/office/loom-read.mjs` and `src/lib/office/pr-state.mjs` use `redirect: 'error'`. Cloudflare Workers rejects that value when constructing a Request, before any network request is sent. Node/Chromium permit it, so mocked Node/browser tests missed this.

Official documentation: https://developers.cloudflare.com/workers/runtime-apis/request/

## Reproduction
Actual current adapter sources were run in Miniflare 4.20260730.0 / workerd with compatibility date 2026-07-22. A bounded fake fetch constructs a real Worker Request then returns a 302. No live POST or external data required.

Original: 0 completed Request constructions; Loom errors [fetch_failed]; PR errors [pr_1767:request_failed].
Two-line repair: 2 completed Request constructions; both adapters reject 302 as http_error. Six assertions pass across original/repaired cases. This proves the runtime incompatibility and that the repair still refuses redirects. It does not establish that every remaining network failure is repaired.

## Minimal proposed repair
In each file replace `redirect: 'error'` with `redirect: 'manual'`. Existing `!response.ok` checks reject all 3xx without following Location. Preserve timeout, bounds, address checks and fail-closed semantics. Do not switch to follow.

## Remaining verification
Implementation owner should apply the repair, rerun existing adapter/composition suites, add this runtime regression, then obtain reviewed release clearance. Live /api/office currently returns state=ended and experiment_ended: do not extend the S4 deadline or fake activity to test. Use an isolated preview/fixture for active snapshot QA. No full build, production fix, or live success claimed here.

Repository AGENTS restricts Codex review work to sketches, so this is an implementation-ready diagnostic rather than a source-code change. Existing release owner remains Loom desk.
