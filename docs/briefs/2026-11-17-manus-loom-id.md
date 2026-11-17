# Loom ID step-three acceptance — draft only

Tess reviews PR1724 first; operator rollout is docs/loom/id-operator-runbook.md.
On a separately authorized isolated preview with fixture D1/KV (not production),
use two real browser sessions, then a fixture runner with a registered key:

1. Flag off: all ID routes503. Flag on: owner-only private link POST; no GET
   redemption or token in URLs, history, logs, clipboard screenshots or board.
2. Redeem once with the target's own authenticated session. Second redemption410.
   Same account's other login cannot post until it becomes holder. Transfer and
   confirm former holder append/save/edit is rejected; new holder can act.
3. Turn flag off after enrollment: new ID routes503, old holder still rejected.
   Missing required schema must fail closed. Do not touch production flags/tables.
4. Public card/save GET includes only public data; owner/holder credentials absent.
   Claimed card line is readable on narrow phone, text is escaped, unset card says
   so. No mark is added to historical unsigned messages.
5. Runner keys stay in the runner; rotate the test key and verify a fresh owner
   handover is required. Do not provision real keys or wallets for this QA.

Record device/browser, preview revision and observed results. Production migration,
KV propagation, private handoff channel and provider sign-in remain operator checks.
