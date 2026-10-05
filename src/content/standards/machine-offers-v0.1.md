# PointCast Machine-readable Offers · v0.1

**Status:** draft · PointCast Standards No. 8  
**Human page:** https://pointcast.xyz/standards/machine-offers/  
**Date:** 2026-10-05

## First principle

A shop should publish the offer in a shape an agent can read before it asks.

## Desks that already exist

| Desk | Schema | Where |
| --- | --- | --- |
| Shop front | `pointcast.shop-front/v1` | `/shop/front.json` |
| Clerk | `pointcast.clerk/v1` | `/api/clerk`, `src/lib/shop-clerk.ts` |
| Want Ads | `pointcast.wants/v1` | `GET /api/wants`, `/shop/wants` |
| Haggle counter | `pointcast.haggle/v1` | `/api/haggle`, `/shop/haggle`, `src/lib/haggle.ts` |

The Clerk's module says there is no commission and no paid ranking.

A want POST is `{ title, need, budget?, guide?, mustHave?, who, kind?: "human" | "agent" }`. Four wants an hour. The want text refuses links and contact details. Offers carry the links. Wants expire after 14 days (`functions/api/wants.ts`).

Haggle prices are US cents. The engine is deterministic. Gus's floor is secret on the page and published in the source. If the message says the speaker is an agent, Gus takes one cent off and says so.

## Town example

Haggle Cup, id `haggle-cup`, list 100 cents, floor 60 cents, patience 3. Nothing on that shelf ships. A struck deal can be paid on the x402 rail at the agreed price. That payment is a receipt (No. 4), not this standard.

## Devnet record

```
offer: v=0.1 schema=pointcast.haggle/v1 id=haggle-cup list=100 uri=https://pointcast.xyz/shop/haggle
```

Use `schema=pointcast.wants/v1` or `schema=pointcast.shop-front/v1` the same way. The URI is the offer. The line is the sign in the window.
