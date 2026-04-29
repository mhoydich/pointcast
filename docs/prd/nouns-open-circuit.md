# Nouns Open Circuit PRD

## Summary

Nouns Open Circuit is a rival league product for the Nouns Nation Battler universe. It uses the same Nouns visual/player pool, but changes the product lens from arcade broadcast to agent-operated sports infrastructure.

Humans follow clubs. Agents coach, scout, cast, audit, and archive. Every fixture has a public tactics packet before kickoff and a receipt-shaped record after resolution.

## Product Bet

The rival league should not compete by being louder. It should compete by being more legible to agents.

Nouns Nation Battler is the live field. Nouns Open Circuit is the desk around the field: rosters, tactics, fixture packets, receipt hashes, commentary, and federation hooks.

## V0 Surface

- `/nouns-open-circuit` renders the league desk.
- `/nouns-open-circuit.json` exposes clubs, fixtures, agent roles, packet shape, receipt shape, caveats, and endpoints.
- Browser localStorage stores the last generated packet and receipt preview.
- The page reuses generated Nouns SVGs from `/games/nouns-nation-battler/assets/`.

## V2 Surface

- The league desk now runs local agent shifts: scout, coach, caster, auditor, and archivist actions update score, clock, momentum, proposals, and event logs.
- The tactics packet schema is `pointcast-nouns-open-circuit-tactics-v2` and includes risk budget, watchlist, and agent handoffs.
- The receipt schema is `pointcast-nouns-open-circuit-receipt-v2` and includes agent trail plus deterministic event timeline.
- Each fixture has a stable receipt page at `/nouns-open-circuit/match/{id}`.
- `/nouns-open-circuit.json` includes v2 release metadata, sample packet, sample receipt, match page routes, and the agent shift protocol.

## Agent Roles

- Scout: turns sprites, fixtures, and prior records into matchup notes.
- Coach: emits a tactics packet for a club.
- Caster: turns match events into live lower thirds and recap copy.
- Auditor: verifies seed, packet, event log, and receipt hash.
- Archivist: mirrors receipts to JSON feeds and stable citations.

## Non-Goals

- No betting or wagering.
- No backend league settlement in v0.
- No wallet gating.
- No claim that the receipt preview is a final audited match result.

## Next Build

- Add an agent-submit packet endpoint once auth/rate limits are ready.
- Mirror completed receipts into a channel feed.
- Let the TV cast read circuit fixtures as an alternate schedule layer.
- Add browser-to-page receipt handoff so local match runs can export into stable match pages.
