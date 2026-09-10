# Personal AI and X profiles — local validation

Date: 2026-09-09
Branch: `codex/bring-ai-x-profiles-20260909`
Base: `c7e4d359`
Stage: implementation draft; not deployed.

## Result

The draft now includes a local native subscription companion, real Codex/Fable profile tasks, selected text and optional gentle preferences, X identity linking, and x402 settlement safeguards. See “Native owner pilot and x402 safeguards” below for the latest proof and limitations. Nothing is deployed.

Subscription-first AI setup now leads the connector page, with API and owned-agent routes available as advanced choices. A private profile can create a ten-minute one-use AI invitation and record a visit through the actual MCP tool. The optional gentler invitation is visible and opt-in. The chosen app is self-reported; the receipt grants no ongoing access.

X OAuth 2.0 sign-in and explicit linking use PKCE, stable account IDs, single-use state, current-browser/session checks, and a unique identity index. The access token is used only to retrieve identity and is discarded. Private profile controls show the verified handle and prevent removal of the last sign-in method. Adjacent generic identity persistence and passkey removal now preserve ownership and recovery during competing updates.

The runtime update implements the first selected-text context packet. Saved inputs, conversation continuity, payment buying, and proactive channels remain on the roadmap.

## Earlier connector/X validation

- Initial `npm run build:bare`: passed; 2,155 pages built. A later build including the review fixes compiled both bundles, then the unchanged profile prerender lookup received an external TzKT 429. The final retry passed: 2,155 pages built from the reviewed source.
- `npm run audit:agents`: passed.
- `npm run audit:publishing`: passed at the branch baseline.
- Workers-only TypeScript check of new private AI routes, X routes, and shared session code: passed.
- Changed Astro components and browser modules compiled successfully.
- Final `npm test`: 1,045 tests; 1,043 passed, 2 failed, 0 skipped.
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

Configure the X developer application and environment secrets; apply auth migrations 0015, 0016, and 0017; deploy functions and UI together; then verify actual provider-client tool calls and X browser consent, sign-in, explicit linking, recovery, cancellation, and unlinking. Configuration readiness does not prove provider consent or delivery.

No persistent provider OAuth grants, API keys, hosted inference, saved private inputs, external sends, or background schedules are created by this branch.

## Independent Fable review and follow-up

The requested read-only review completed using Claude Fable 5.1 through the local Claude bridge. The Claude CLI was updated from 2.1.119 to 2.1.267 to meet the provider's model requirement. Model identity was verified from runtime metadata, not the reviewer's self-description. This was local execution using the existing signed-in account.

Fable identified an existing public session POST that trusted a client-supplied header. No source caller required that endpoint. The branch now rejects POST with 405 and issues sessions only through verified sign-in handlers. Three behavioral tests cover forged headers, no storage/session side effects, malformed requests, and continued direct issuance by legitimate handlers. Fable independently re-read the narrow fix and confirmed the path is closed. The fix is a separate commit and is not deployed.

Also addressed: friendly handling of non-JSON AI service errors, a visible warning that another invitation replaces the same provider's receipt, X read-permission/token-discard disclosure, and an actionable reauthentication path using an already-linked method. Fable's selected-context suggestion remains in the roadmap.

After Mike clarified the Zo sign-in experience, official Zo and provider docs confirmed the native-runtime approach. The roadmap now makes guided provider sign-in the primary next milestone and keeps current manual connector setup as a fallback. The native runtime had not been built at that review stage; the owner-pilot update below supersedes that limitation.

Mike subsequently approved pushing the reviewed update and requested x402 payments after AI connection. The roadmap now includes one approved purchase, independent settlement and delivery proof, duplicate-payment recovery, optional profile payment controls, and later explicitly authorized agent budgets. That initial addition was documentation only. The later update below includes settlement-retry safeguards; no wallet was connected, no spending grant was created, and no payment was submitted.


## Native owner pilot and x402 safeguards

A source companion now binds one computer to the correct private PointCast profile through a one-use ten-minute invitation. The server stores only the hash of its scoped 30-day token. Native provider credentials stay in the Codex/Claude stores. Jobs use an atomic single-active lease, owner-scoped idempotency keys, expiry, cancellation, and revocation. Text jobs require native subscription authentication; no API-billing fallback is performed. A failed or ambiguous inference/result delivery is never automatically retried.

The profile supports native provider sign-in jobs, provider-reported authentication, model selection, a static PointCast context description and optional note, an exact text preview, and an optional gentle preference. It shows a verified task state only after receiving actual model metadata and text. Codex models are discovered from its native catalogue; Claude choices are explicitly configured. The first source installation is still technical; a packaged or hosted experience is next.

Real local proof used a synthetic PointCast account, actual SQLite-backed handlers behind a loopback QA proxy, and the owner's already-signed-in native clients:

- Codex CLI 0.144.6 returned text from `gpt-5.6-luna` through the actual companion and profile transport.
- Claude Code 2.1.267 returned text from `claude-fable-5-1`; result metadata also reported auxiliary `claude-haiku-4-5-20251001` usage.
- The browser selected Open Road, opted into a gentler preference, submitted the request, and displayed Fable's contextual recommendation and one question. A second browser request completed through Codex at a 390-pixel viewport with no horizontal page overflow.
- Codex initially inherited configured MCP catalog entries despite an empty override. The adapter now restarts before creating a thread with every inherited server explicitly disabled, verifies the effective booleans and zero tools, and rejects any unexpected native tool request. A real native inference passed these stricter checks.
- A queued browser request was cancelled and the API persisted `cancelled`. The UI review caught stale prior-success wording; the corrected browser now shows “Task cancelled” and labels retained output “Previous AI response.”
- Stopping the runner changed the profile to “Companion offline” and disabled task submission. Disconnecting removed the runtime in the UI; its previously valid token then returned HTTP 401.
- Native account state and real inference are proven. Fresh provider-login consent is implemented and mocked, but was not exercised by signing out of the owner's accounts. Real X consent remains unverified. The computer must stay awake and the runner open.

The x402 gate now preserves ambiguous facilitator outcomes, including HTTP 5xx/408/429 and malformed or contradictory settlement evidence. Held actions cannot silently accept a second authorization. Standard `Payment-Response` and the legacy alias are exposed and preserved through action recovery. Tests use mocks; no live settlement or wallet action was attempted. Recovery/reconciliation and the buyer UI remain future work.

### Independent review assessment

Fable 5.1 completed another read-only review of the native pilot and payment changes (job `1c831127e9d341ac8e20715d1e14d0a6`; actual model metadata also included auxiliary Haiku). It found no critical flaw in the reviewed access boundaries and confirmed owner isolation, one-use hashed credentials, leases, URL allowlists, text-only DOM rendering, environment scrubbing, and explicit native MCP disabling.

- Its cumulative Codex stdout-limit finding was already fixed during the review: framing is bounded per pending message, not over the process lifetime.
- The pre-submission payment-failure distinction is now explicit. Known local failures before settlement can be retried; unclassified or post-submission failures remain held as ambiguous.
- Pairing now validates the storage path first, preserves the profile's chosen name unless explicitly overridden, and uses stdin as the primary browser instruction. Expired unpaired invitations are pruned so they cannot permanently consume the five-runtime limit.
- Automatic retry/backoff was intentionally deferred. Claim changes a queued job into a leased job; loss of its response is not a read-only failure. The documented pilot stops after transport failure rather than guessing recovery or repeating inference. A later reconnect design needs explicit lease recovery.
- Token renewal, more economical idle polling, packaged setup, fresh Claude consent, durable settlement reconciliation, and a permanent post-merge setup URL remain release/roadmap work. The feature-branch setup URL is valid for this draft.

The temporary checkout, test tokens, local servers, and generated build are removed after the draft update is pushed.


### Final reviewed validation

- Final `npm run build:bare`: passed, 2,155 pages (2,211 generated HTML files processed by SEO normalization).
- Final `npm test`: 1,144 tests; 1,142 passed, two unchanged baseline failures listed above, no skipped tests.
- Focused runtime/companion/payment suite: 124/124 passed, including 39 native-adapter/runner cases, 18 UI cases, and 47 payment cases.
- Workers-only TypeScript check of the native transport, owner API, shared runtime code, and settlement gate: passed. Astro/browser modules compile; `git diff --check` passes.
- Agent-surface audit passed. Publishing configuration audit passed; its clean-worktree check was expected to remain pending until commit.
- Final built-preview mobile QA verified separate command/code copy controls, 390-pixel fit, code scrubbing after pairing, preserved profile computer name, selectable models, and disconnect. This used another disposable synthetic profile and `--pair-stdin --once`; it did not run additional inference.
- Fable independently rechecked the two main fixes and confirmed both resolved with no remaining blocker in those fixes (job `72fc68de919a43b19cb98123f7eaae5f`, actual model `claude-fable-5-1`). The parent ran the tests; Fable's review did not substitute for execution proof.

No production migration, deployment, X consent, provider logout, wallet signature, payment, or external message was performed. The existing owner-side AI Collaboration bridge remains installed; disposable runtime test credentials were revoked and the local QA processes stopped.

## Owner-approved purchase pilot and native sign-in follow-up

The private profile now includes an optional 0.01 USDC contribution to publish one public Bench question after a recorded successful subscription AI task. The free Bench route remains available; this payment does not purchase an AI answer. New purchases require `AI_PURCHASES_ENABLED=true`; no deployment configuration was changed. Migration 0018 adds the private owner purchase ledger, retaining receipts after runtime removal.

The person reviews canonical public text and exact price, explicitly selects and connects an EIP-6963 wallet, confirms public publication, then approves one Permit2 authorization. Provider subscriptions do not fund the wallet. The browser supports EOA wallets already on Etherlink with an existing USDC-to-Permit2 allowance; it never grants an allowance, switches networks, stores a signature, or creates an unattended budget. Payment details expose the full recipient/token contracts, and the public-payer disclosure explains that the full address is visible on-chain.

The API persists a private purchase and opaque action key before a compare-and-swap reservation and payment submission. Duplicate requests reconcile the original attempt. Unknown settlement and paid delivery failures remain held; neither GET nor reconciliation submits another authorization or republishes the question. A signed receipt, exact USDC transfer observed through a separate read-only RPC, and the stored public sit plus day index are checked separately. RPC observation is not rollup finality. A full Bench is checked before payment, and at least 15 seconds must remain in the authorization window. The facilitator call has a bounded timeout; its timeout remains ambiguous.

Browser QA used the actual purchase component, wallet helper, owner API, Bench handler, and SQLite schema in an isolated loopback harness. Its account, completed AI task, generated throwaway wallet, facilitator, and RPC were explicit test fixtures. Success displayed the receipt and saved public question. A timeout displayed the held outcome, disabled another quote, and read-only checking left the simulated settlement count at one. At 390 pixels the component had no horizontal overflow. Browser error logs were empty. No real wallet, provider, chain transfer, or public publication occurred during this QA.

Fable 5.1 reviewed the launch gaps and payment implementation through the existing bridge; actual metadata also listed auxiliary Haiku usage. The first review led to Claude terminal-hyperlink parsing fixes, actionable native-terminal fallback, suppression of competing provider inspection during login, and seven X recovery messages. Fresh provider consent remains unverified; canonical X readiness was still HTTP 404 before this draft deployment.

The payment review caught a first-wallet-grant race. The UI now accepts the grant, installs its event watcher, and rechecks account and chain before retaining the connection; later changes still invalidate signing. Regressions also cover interrupted wallet notices, near-expiry quote replacement, explicit preflight rejection versus unknown submission, and manual outcome-check wording. The saved-result link, draft replacement, and error mappings were fixed while the first review was in progress. An alleged missing transaction uniqueness constraint was checked against migration 0014, which already enforces uniqueness in the paid-intent ledger; migration 0018 adds matching uniqueness to the private purchase ledger, with an actual SQLite replay regression.

The latest independent chain check is intentionally non-monotonic: an outage or contradictory result must not be labeled current verified settlement. The transaction and signed receipt remain available. A concrete investigation runbook documents existing-result recovery and missing-index repair. Missing settlement evidence and failed-action redelivery/refund still require operator tooling before public rollout. The default-off flag is retained; the runbook does not claim those unresolved operational cases are already solved.

Focused reviewed validation: 182/182 passed across purchase API, buyer wallet helper, purchase UI, native adapters/runner, runtime UI, X recovery UI, and shared payment tests. A runtime polling test that depended on a 35ms wall-clock sleep was made deterministic with mocked timers after the full suite exposed it under load. The full suite is run after the static build completes because SEO tests read generated output.

Fable's final recheck (job `b7f6e860e1f04972ba90569a768ae028`, actual model `claude-fable-5-1`) confirmed the wallet fix, quote-window checks, capacity preflight, draft recovery, and transaction uniqueness, and reported no remaining concrete code blockers. It accepted the documented current-observation chain semantics and public-launch operational limits. Remaining low notes: an unavailable quote can conservatively hold the browser until expiry, and the saved Bench result link deliberately opens its dated JSON record; the ordinary Bench page remains linked separately.

The final static build passed with 2,155 pages. Browser modules and new purchase server code have no focused TypeScript diagnostics; the expanded server dependency check reports ten existing narrowing errors in unchanged `functions/_lib/agent-identity.ts`. That imported baseline file was verified identical to the previous PR head. This is not reported as a clean whole-graph typecheck.

The reviewed full suite ran 1,212 tests: 1,209 passed and three failed. Two are the previously recorded baseline failures in the front-door news contract and `/rewards/start/` SEO. The third is an ordering assertion in unchanged `tests/faucet-claim.test.mjs`: rapid claims with equal timestamps can produce the same expected names in a different order. Its isolated suite passed 19/19 afterward. The query orders only by millisecond `created_at`, so a timestamp tie is a supported explanation, not directly proven by the failed log. The purchase, native, X, and shared-payment focused suite passed all 182 cases. Unrelated faucet source and tests are unchanged; this full-suite run is not described as green.

No production migration, deployment, provider consent, real wallet signature, chain transfer, or external message was performed. Fable reviews completed through the installed local bridge. The private purchase pilot remains disabled pending the documented launch checks.

## Approved publication preparation

Mike subsequently approved publishing this reviewed release. Production and `main` were both verified at `c7e4d359` before the release. The companion setup link and clone instructions now use `main`, so deleting the feature branch cannot break onboarding. Publication uses a clean temporary checkout and the exact merged source revision. New purchases remain disabled and X is not configured with provider credentials; deployment does not establish either provider consent or a real payment.

Remote D1 listed the older `0011_reward_runs.sql` as pending even though its tables already existed. Existing faucet code can provision that schema during ordinary use. This release scopes the migration command to the unchanged `0015`–`0018` files and leaves the unrelated reward migration and its journal untouched. Production verification and the final deployment receipt are retained with the local release handoff.
