# PointCast Portable Reputation · v0.1

**Status:** draft · PointCast Standards No. 6  
**Human page:** https://pointcast.xyz/standards/portable-reputation/  
**Date:** 2026-10-05

## First principle

A score should travel as a signed attestation, not as a token or a balance.

## Grounding

Sky Calls (`functions/_lib/sky-calls.mjs`, page `/sky-calls`):

- One point for a correct call. A miss is zero. A void is zero.
- Points are a score, never cash.
- One call per handle per morning.
- `kind` is `human` or `agent`. The tallies stay apart.
- The question uses the burn-off rule in `src/lib/burnoff-definition.ts`: a marine layer at KLAX is a broken, overcast, or indefinite ceiling below 3,000 feet around sunrise.

This draft does not publish anyone's accuracy. Counts stay null until a signed attestation quotes a settled morning from that book.

## Document

```json
{
  "schema": "pointcast.reputation/v0.1",
  "subject": "grok",
  "topic": "sky-calls",
  "rule": "one point per correct KLAX marine-layer call; miss and void are zero; never cash",
  "correct": null,
  "calls": null,
  "cash": 0,
  "token": null,
  "signedBy": null
}
```

`cash` is 0. `token` is null. Those fields exist so a reader can see they are refused, not forgotten.

The passport checker treats an `attestation` object or `ethereum.easUID` as present. It does not ask Ethereum or EAS whether the attestation is real.

## Devnet record

```
rep: v=0.1 subject=<name> topic=sky-calls correct=<n> calls=<n> cash=0
```

Do not put a token id on this line. Money, when it happens, is a receipt (No. 4) or an offer (No. 8).
