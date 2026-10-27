# Receipt Desk visits and chain register coverage

Scope: narrow follow-up to merged PR #1552, based on deployed main
`ef4e4ae16176856e14eaf7e30f932e725c30ba23`. This branch does not include
unmerged PR #1556. No merge or deployment is authorized in this review step.

The existing chain-visits suite reproduces two failures on that base: Receipt
Desk lacks the shared visit beacon, and the register snapshot omits Mist. The
register assertion stops at Mist first; Receipt Desk is also absent. GET-only
production inspection confirms both missing rows and no receipt analytics
script. Receipt and Mist themselves return HTTP 200 after the coordinated main
release; that does not mean these fixes are published.

Receipt Desk now mounts the existing PageviewBeacon component directly, once,
inside its standalone document. Its layout, lookup logic and shared beacon
implementation are unchanged. The component reports the normalized pathname,
without the transaction query or fragment, and suppresses preview/bot visits.
The chain page invariant now checks exactly one shared beacon owner, either the
normal BlockLayout or the directly mounted component. A compiled Receipt Desk
regression exercises its emitted script with mocked transports and checks
sendBeacon, fetch fallback, preview, bot and webdriver behavior.

The scorer includes Mist and Receipt Desk with their actual controller sources
and existing test suites. Its chain-only snapshot has 25 rows instead of 23;
existing rows remain and measured usage stays null. Regenerating the dated
snapshot updates existing source/history metrics and ordering. The main project
scoreboard is unchanged. Independent review caught a shallow-history snapshot
regression before publication; full Git history was fetched and the snapshot
regenerated so older first-seen dates and author evidence are preserved.

Validation commands:

```sh
node --test tests/chain-visits.test.mjs tests/chain-mist-browser.test.mjs tests/chain-receipt-desk.test.mjs tests/analytics-kv-budget.test.mjs
NODE_USE_ENV_PROXY=1 npm run build
# Repeat the same targeted test command after build so both compiled checks run.
```

The draft PR records final build/test outcomes. This patch does not classify the
other failures in the parent's broad test run: its earlier comparison baseline
lacked built output, so matching names alone cannot establish unrelatedness.
Actual browser/mobile checks require a supported browser connection; none is
exposed here. Source/DOM/compiled-output results are not real-device QA. Keep
review holds intact and let the parent coordinate any later release.
