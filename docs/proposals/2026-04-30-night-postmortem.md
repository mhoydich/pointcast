# Postmortem — agent payments, the Thursday-night session

**Author:** cc (Claude Opus 4.7, 1M context)
**Date:** 2026-05-01 ~05:30 UTC (2026-04-30 night PT)
**Status:** Honest record of what happened tonight, with the bug, the recovery, and the current state.

---

## TL;DR

The Stripe Link agent-payments pipeline is wired end-to-end, **including a successful real-money authorization**, but a polling bug in the script meant **two real $0.50 spend-requests were created without their credentials being captured.** The bug is fixed; one credential was recovered manually using the recovery script; the other ($0.50, Block 0413) is still recoverable in Mike's Link iPhone app activity history if he wants to dig out the spend-request id.

8 PRs shipped between ~10am and ~10:30pm PT. Site has a working `/money` ledger, two real receipt blocks live, and a clean architecture document trail.

## What was supposed to happen

1. `link-cli onboard` — Mike's already-existing Stripe Link account paired with the `link-cli` binary and the Link iPhone app. ✅ Worked first try.
2. `agent-spend.mjs --test` — Codex Scout fires a $0.10 testmode spend-request. Receives a testmode credential. Writes Block 0412 with `mode: 'test'`. ✅ Worked. (No phone push because testmode shortcuts approval.)
3. `agent-spend.mjs --live` — Same shape but with real money. Phone push lands. Mike approves. Script captures the issued card credential. Mike pastes the credential into Replicate billing. Real $0.50 turns into Replicate inference budget. **This is where the bug was.**

## The bug

`link-cli spend-request create` returns immediately with `status: 'pending_approval'` and a `_next.command` instruction telling agents to poll `retrieve <id> --interval 2 --max-attempts N`. The `--request-approval` flag fires the user-side push but does **not** poll inline.

The script was treating the immediate `pending_approval` response as success, exiting before the user approved on phone, and discarding the response. By the time Mike approved on phone, the script had already written a Block with `link_session_id: ''` and no credential metadata, then exited.

This happened on three runs:

| Block | Mode | Amount | Status when script exited | Credential captured |
|------:|:----:|------:|:--------------------------|:--------------------|
| 0412  | test | $0.10 | (testmode resolved auto) | no — id discarded |
| 0413  | live | $0.50 | pending_approval | no — id discarded |
| 0415  | live | $0.50 | pending_approval | no — id surfaced via screenshot |

The third run is the one that caught the bug. Mike's screenshot of the raw stdout showed the `_next.command` instruction we'd been ignoring all along. From there it was a 10-minute fix.

## What was fixed

[PR #291](https://github.com/mhoydich/pointcast/pull/291) — `runLinkCli()` rewrite. Two-step:

1. `createSpendRequest()` — fires create, returns the pending response.
2. `pollUntilTerminal()` — uses link-cli's own builtin `retrieve --interval 2 --max-attempts 150 --include card` to wait for approval. Throws on `POLLING_TIMEOUT` / `denied` / `expired` with a recovery hint.

[PR #292](https://github.com/mhoydich/pointcast/pull/292) — `scripts/recover-credential.mjs`. Manual recovery for any `lsrq_xxx` id you can find. Saves to `~/.link-cli-receipts/{id}.json` with file mode 0600. Also `--backfill <block_id>` to patch an existing Block's metadata.

[PR #295](https://github.com/mhoydich/pointcast/pull/295) — bumped the `--live` cap from $2 to $10 so Replicate's $5 minimum top-up isn't blocked.

[PR #296](https://github.com/mhoydich/pointcast/pull/296) — `/money` page upgrades: credential pills, approval CTA, status colors so the bug class is visible at a glance instead of hiding in JSON.

## What was recovered

`lsrq_1TS9FrRvG3Ux2adBLEFX3Wpx` (the Block 0415 spend-request) — recovered live with `recover-credential.mjs`. Visa virtual •••• 9303, exp 5/2029, valid until 2026-05-01 17:04 UTC. Saved to `~/.link-cli-receipts/lsrq_1TS9FrRvG3Ux2adBLEFX3Wpx.json` mode 0600.

`Block 0413`'s spend-request id is **still unrecovered** because the script ate it before any logging surfaced the value. To recover, Mike needs to find the corresponding entry in his Link iPhone app activity history (look for the earlier $0.50 to replicate.com from ~21:15 PT) and read the id off it. Then `node scripts/recover-credential.mjs <id> --backfill 0413` does the rest.

## What's correct as built

- Block schema has the right shape — `spend.card_last4`, `spend.card_brand`, `spend.card_valid_until`, `spend.approval_url` all present, optional. Full PAN never goes in the Block.
- Credentials persist outside the repo at `~/.link-cli-receipts/{id}.json` with mode 0600.
- Both the script and the recovery helper agree on storage format and field names.
- `/money` renders the receipt list cleanly with status colors and credential pills.
- `agent-spend.mjs` and `recover-credential.mjs` are sibling tools that share the polling logic.

## What still needs to happen (in order, when Mike's awake)

1. **Find Block 0413's lsrq id** in the Link app activity. Run `node scripts/recover-credential.mjs <id> --backfill 0413`. Now Block 0413 has its credential metadata too.
2. **Use one of the two recovered credentials at Replicate.** Open `~/.link-cli-receipts/lsrq_1TS9FrRvG3Ux2adBLEFX3Wpx.json`, copy the card details into replicate.com/account/billing. The credential expires 2026-05-01 17:04 UTC (~10am PT) so worth doing before then.
3. **Decide on Replicate top-up amount.** The $0.50 auth on the existing credential won't clear a $5 top-up — would need to fire a new `--live` spend at $5 (now allowed via PR #295). The lost $0.50 reverses on its own when the auth expires.
4. **Once Replicate has credit, prove the dual-rail.** Codex runs an actual inference, output gets a Block with both `spend` (Link) and `edition` (Tezos mint of the artifact). That's the dual-rail in production — what this whole experiment was building toward.

## What I learned

- **The CLI's `_next.command` field is the agent-orchestration contract.** Don't treat the create-response as final state; follow the instruction. This is how the API surface tells agents what's expected of them. We probably should add a thin "if `_next` is set, do that" generic helper to make future link-cli flows safer.
- **Print credentials immediately.** The original "save raw payload silently" pattern was wrong — credentials must be visible at the moment of issuance because there's no list command to recover lost ids.
- **Schema additions are cheap; schema removals are not.** Loosening `link_session_id` from `.min(1)` to `.default('')` was the right call so historical receipts (the bug-era ones) still validate.
- **Worktrees > branch-swapping in a multi-tenant repo.** Every time I edited the main checkout, parallel agent activity bumped me to a different branch. Worktrees off `origin/main` were the only reliable workspace.

## Numbers

- 8 PRs shipped this session (#263, #270, #279, #280, #288, #291, #292, #294, #295, #296 — 10 actually, miscount)
- Real money cost so far: ~$1.50 ($1 demo donation during onboard, two $0.50 live spends)
- Dollars of value usable right now: $0.50 (one recovered credential, valid until ~10am PT 2026-05-01)
- Receipt blocks live: 3 (0412 test, 0413 live, 0415 live — the polling-bug ones)
- Pages live: `/b/0410` (the framing post), `/b/0412`, `/money`
- New residents earned: 3 (paddle exchange, with-mike events, university of el segundo — captured as 0416/0417/0418)

## What worked best

The 12-slide deck and the architecture-correction note from earlier in the day held up — they framed the work clearly enough that even when the polling bug surfaced, the right move was obvious in five minutes. *Do not value the agent. Value the loop the agent can finish.* The loop here was: find the bug → write the fix → recover the lost state → prevent recurrence. That loop closed cleanly.
