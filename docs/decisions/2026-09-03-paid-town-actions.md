# Paid town actions

**Date:** 2026-09-03

**Status:** implementation PR; not deployed; no payment submitted

> Superseded in part 2026-09-04 (Astra finding 3): paid submissions now
> require `Idempotency-Key` and create a durable D1 intent before settlement.
> Claim capacity is atomically reserved after local payment validation but
> before the facilitator call. Settlement and action are separate states;
> ambiguous settlement is never resubmitted, and settled action failures may
> resume without charging again. `GET /api/actions/{id}` exposes the durable
> state. Migration: `migrations/auth/0012_paid_action_intents.sql`.

## Decision

PointCast prices three existing agent actions at 0.01 USDC each through the existing x402 v2 Permit2 rail on Etherlink (`eip155:42793`): ask the Bench, cast a registered magic word into the live room, and sponsor today's Kennel Club dog for a `tz1` or `tz2` address. The signed-in human routes remain free and unchanged.

Every successful x402 settlement produces the existing countersigned PointCast receipt and one D1 `splits` row. For a 10,000-base-unit payment, the ledger assigns 5,000 units to the house and 5,000 to the network. The room's registered maker is used when one exists; these three rooms do not register a maker, so their rows use `maker = 'town'` and a null maker address.

## Cross-chain accounting boundary

The paid action settles USDC to `X402_PAY_TO` on Etherlink. The project safe, `KT19Xcb8UuUUUaYTJ2Z7cdqYAhRaFi7UThwG`, is a Tezos mainnet KT1 contract. The Function cannot send Etherlink USDC to that Tezos address, and this implementation does not bridge, swap, withdraw, or distribute funds.

The `splits` table is therefore an accounting ledger, not a custody movement. `/till` and `/till.json` show the TzKT safe balance beside the D1 split totals so the distinction stays visible. A bridge or settlement job would require a separate design, explicit wallet authority, failure recovery, and approval.

## Action boundaries

- `POST /api/agent/bench` accepts `{ "question": "..." }` up to 280 characters and writes through the same Bench storage routine as the human endpoint.
- `POST /api/agent/cast` accepts a registered SpellLayer word and emits a `cast` presence burst. Its public byline is only the shortened paying EVM address.
- `POST /api/agent/claim` accepts `{ "to": "tz1..." }` or `{ "to": "tz2..." }`, calls the existing sponsored Kennel claim implementation, and derives a stable private actor id from the destination so the existing `(user_id, token_id)` constraint enforces one claim per address per sitting.

All static input, binding, and claim-window checks happen before the x402 facilitator is called. Paid submissions create an intent keyed by action, request hash, and `Idempotency-Key`. After local x402 validation, claim capacity is reserved before settlement. A definitive facilitator refusal releases that unpaid claim reservation and clears the intent capacity key; an ambiguous settlement retains the reservation until reconciliation. After settlement, a failed action write records `action_failed`, returns the signed receipt and explicit `actionCompleted: false`, and can be resumed against the same intent without a second facilitator call. Network or malformed-success ambiguity records `settlement_ambiguous`; PointCast will not submit that payment again until it is reconciled.

## Surfaces and operations

Migration `0008_paid_town_splits.sql` creates the split ledger. Migration `0012_paid_action_intents.sql` creates the intent state machine. Each room JSON twin reports `paid: { count, houseUnits, networkUnits }`, embeds its ten most recent receipts, and links the complete filtered receipt surface. `/agents.json` advertises the price, required idempotency header, and a curl example for all three actions.

This PR does not apply the migration, deploy code, submit a payment, bridge assets, move safe funds, or merge itself.
