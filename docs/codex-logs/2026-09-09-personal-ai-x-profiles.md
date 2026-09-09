# Personal AI and X profiles — local validation

Date: 2026-09-09
Branch: `codex/bring-ai-x-profiles-20260909`
Base: `c7e4d359`
Stage: implementation draft; not deployed.

## Result

Subscription-first AI setup now leads the connector page, with API and owned-agent routes available as advanced choices. A private profile can create a ten-minute one-use AI invitation and record a visit through the actual MCP tool. The optional gentler invitation is visible and opt-in. The chosen app is self-reported; the receipt grants no ongoing access.

X OAuth 2.0 sign-in and explicit linking use PKCE, stable account IDs, single-use state, current-browser/session checks, and a unique identity index. The access token is used only to retrieve identity and is discarded. Private profile controls show the verified handle and prevent removal of the last sign-in method. Adjacent generic identity persistence and passkey removal now preserve ownership and recovery during competing updates.

The roadmap describes selected informational inputs, the first personal context packet, conversation continuity, and later proactive channels as proposed work.

## Validation

- `npm run build:bare`: passed; 2,155 pages built.
- `npm run audit:agents`: passed.
- `npm run audit:publishing`: passed at the branch baseline.
- Workers-only TypeScript check of new private AI routes, X routes, and shared session code: passed.
- Changed Astro components and browser modules compiled successfully.
- Final `npm test`: 1,039 tests; 1,037 passed, 2 failed, 0 skipped.
- `git diff --check`: passed.

Remaining suite failures are outside the changed feature:

1. `front-door-september.test.mjs` expects seven named news items, while unchanged baseline data contains eight including Faucet.
2. `seo-onpage.test.mjs` reports multiple H1 elements and a noindex/sitemap mismatch on unchanged `/rewards/start/`.

The initial build caught a connector-catalog regression: a dependent send sheet still required the named Cursor entry. Compatibility was restored and a runtime test added before the successful full build. The manifest test was updated to include the newly imported visit tool; generated discovery now advertises all 59 tools.

## Browser and handler proof

Used a temporary local QA proxy, in-memory SQLite, and a synthetic account. No real user account or provider credential was used.

- Opened private profile and connector setup at desktop and 390-pixel mobile widths.
- Created an opt-in gentle invitation in the UI.
- Consumed it through the actual bundled MCP handler and confirmed the private receipt on refresh.
- Verified repeat consumption fails and the confirmed invitation text clears.
- Checked connector copy feedback and the X-not-configured state.
- Browser error log was empty for the observed connector flow.
- Fixed the dynamically generated Remove button styling after mobile inspection; recompiled the component.

Automated tests additionally exercise owner isolation, CSRF/body limits, concurrent invitation consumption, expiry/regeneration/removal, late UI responses after sign-out, X ownership conflicts, and concurrent removal of identity methods.

## Release requirements

Configure the X developer application and environment secrets; apply auth migrations 0015 and 0016; deploy functions and UI together; then verify actual provider-client tool calls and X browser consent, sign-in, explicit linking, recovery, cancellation, and unlinking. Configuration readiness does not prove provider consent or delivery.

No persistent provider OAuth grants, API keys, hosted inference, saved private inputs, external sends, or background schedules are created by this branch.
