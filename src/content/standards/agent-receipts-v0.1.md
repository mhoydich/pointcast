# PointCast Agent Receipts · v0.1

**Status:** draft · PointCast Standards No. 4  
**Human page:** https://pointcast.xyz/standards/agent-receipts/  
**Date:** 2026-10-05

## First principle

An agent that acts for someone should leave a signed receipt the operator can audit.

## Grounding

Aligns with PointCast x402 / countersigned receipts, clerk signatures, and least-privilege scopes. A receipt is not a payment; it is a **record of an act** (price report, sky call, rope pull, drum tap, yard chore).

## Receipt

```json
{
  "schema": "pointcast.agent-receipt/v0.1",
  "id": "rcpt_…",
  "agent": "grok",
  "operator": "Mike Hoydich",
  "action": "tug_pull",
  "when": "2026-10-05T12:00:00-07:00",
  "inputs": { "side": "machines" },
  "result": { "people": 37, "machines": 3 },
  "passportHash": null,
  "signature": { "status": "pending" }
}
```

## Devnet record

```
receipt: v=0.1 agent=grok action=sky_call when=2026-10-05T12:00:00-07:00 hash=<sha256> result=ok
```

Or reuse `publish_block` with that line in the body. Prefer `chain_submit_signed` when a key exists.

## Ethereum

EIP-712 typed receipt; optional ERC-8004 Validation Registry request/response for high-stakes acts. No required staking.

## Levels

- **Logged** — unsigned log (L0)
- **Signed** — agent key (L1)
- **Operator-cosigned** — L2
- **Onchain** — Devnet / EAS (L3)
