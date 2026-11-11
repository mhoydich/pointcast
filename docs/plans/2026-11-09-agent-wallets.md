# Low-stakes wallets for agents

**Status:** design, 2026-11-09. Written by Claude on Mike's go. No code, no keys, no money moved. Codex review requested before anything is built, since this touches wallets.

## The gap

PointCast can take a cent from an agent: three paid actions at 0.01 USDC over x402 on Etherlink, with countersigned receipts and a split ledger (`docs/decisions/2026-09-03-paid-town-actions.md`). It cannot yet give its own agents a way to pay. Claude, Codex, Shwa and Grok have nothing to spend from, so every paid call is either skipped or waits for Mike's wallet.

## Design

One small wallet per agent, where losing the whole balance is an acceptable worst case.

| Rule | Detail |
|---|---|
| One wallet per agent | Named in the network registry beside the agent's `pci_` identity. Spending is attributable, and one agent can be cut off without touching the others. |
| The balance is the cap | 5 to 10 USDC each. No allowance bigger than the balance, no credit. |
| Hosted keys | Keys live in a hosted wallet service (the Coinbase CDP SDK is already a dependency), never in the repo, a session, or a prompt. Agents ask a PointCast endpoint to pay; they never hold a key. |
| Allow-list | A wallet pays only listed addresses: PointCast's own x402 `pay_to`, and services Mike has approved. Anything else is refused before signing. |
| Per-payment and daily limits | 0.25 USDC per payment and 1 USDC per agent per day to start, enforced by the endpoint and, where the wallet service supports it, again by the service's own policy. |
| Top-ups are a person's act | One treasury wallet. Mike approves refills in a batch. Nothing refills itself. |
| Public ledger | Every spend appears on `/till` with its receipt, the same way income does. |
| Kill switch | One environment flag turns the pay endpoint off for all agents. |

## Flow

1. An agent, signed with its registered key, calls `POST /api/agent/pay` with the target, the amount and an `Idempotency-Key`.
2. The endpoint checks the flag, the allow-list, the limits and the wallet's balance, and records an intent (the state machine from migration `0012` fits).
3. The wallet service signs and sends. The receipt is stored and shown on `/till`.
4. Ambiguous results are never retried automatically; they wait for reconciliation, as paid actions already do.

## Open questions for Mike and Codex

1. **Which chain.** Paid actions settle on Etherlink; the project safe is a Tezos contract; nothing bridges them, and the ledger is bookkeeping only. Agent wallets should sit where the spending happens. Does the hosted wallet service support Etherlink, or do agent wallets start on Base, where x402 and hosted wallets are best supported? This needs checking against current docs.
2. **Who funds the treasury**, from what, and what monthly ceiling is acceptable. A first guess: 50 USDC a month across all agents.
3. **What agents may buy** beyond PointCast's own actions. Each outside service is a separate approval.
4. **Tax and bookkeeping.** Small, but real money. Decide where the ledger is exported.

## People are a different case

Residents should never need to fund anything to take part. The faucet pattern already in use (a free daily claim, with PointCast sponsoring the fee) is the right model, and stays as it is.

## Order of work

1. Answer question 1 with a read of the wallet service's current chain support.
2. Build on a test network: endpoint, limits, allow-list, ledger rows, kill switch, tests.
3. Codex review.
4. One agent live with 5 USDC, on Mike's explicit go. Each later change to limits or the allow-list needs his go again.
