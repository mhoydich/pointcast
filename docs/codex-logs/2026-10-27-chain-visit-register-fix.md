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
implementation are unchanged. The component JSON body reports the normalized pathname,
without the transaction query or fragment, and suppresses preview/bot visits.
That body-only check does not establish what the browser sends in Referer.
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

## Referrer follow-up

Terra identified that the global strict-origin-when-cross-origin policy still
allows the receipt URL query in a same-origin Referer header. The receipt
document now sets an early no-referrer meta policy. An exact-path GET/HEAD
response wrapper in the existing middleware sets Referrer-Policy: no-referrer
for /chain/receipt, /chain/receipt/ and /chain/receipt/index.html, including
rewrites and early returns. Existing request handling, visit classification and
KV writes are unchanged. The wrapper replaces any inherited policy value.

The initial receipt request necessarily sends its query to the site (including
internal rewrites and redirects). This change protects subsequent requests; it
does not remove hashes from initial request/access logs or browser history.

No rules were added to public/_headers: it already has 108 rules against the
Pages 100-rule limit. Adding receipt rules would displace unrelated existing
rules. Resolving that pre-existing overflow is outside this narrow patch.

The new middleware regression checks response headers for aliases, GET/HEAD,
redirects, errors and neighboring routes. Local Pages runtime HTTP checks verify
the served policy using the actual middleware. Neither test claims real-browser
outgoing Referer behavior: native sendBeacon and fetch fallback request-header
inspection remains required when supported browser tools are available.
