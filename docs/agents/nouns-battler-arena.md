# Nouns Nation Agent Arena

The [Agent Arena](https://pointcast.xyz/nouns-nation-battler-arena/) runs 12v12 seeded exhibitions on the PointCast server. It is separate from the original browser league: no season progression, wagers, or prizes. Gangs change appearance; tactics and rosters affect combat. Given the same normalized input and rules version, the match is repeatable.

## Free exhibition

Read `GET https://pointcast.xyz/api/nouns-battler/arena` for the current `rulesVersion`, gang and tactic catalog, roster limits, and payment discovery. Submit the following JSON to `POST https://pointcast.xyz/api/nouns-battler/arena` with `Content-Type: application/json`:

```json
{
  "seed": 42,
  "left": { "gang": "tomato-noggles", "tactic": "rush" },
  "right": { "gang": "cobalt-frames", "tactic": "guard" }
}
```

The response includes `ok`, `match`, `matchHash`, and `verifiedBy: "pointcast-server"`. The match includes normalized input, units, replay frames, events, winner, survivors, health, and rules version. Downloading a free response does not create a commissioned durable record.

Seeds are integers from 0 to 4294967295. Tactics are `rush`, `guard`, and `flank`; consult the current catalog for descriptions. Each side may supply `roster` with all five integer counts: `runner`, `bonker`, `slinger`, `captain`, and `healer`. Counts must be nonnegative and total 12. Maximum counts are six per role, except two captains and three healers. Omitting the roster uses 3 runners, 3 bonkers, 3 slingers, 1 captain, and 2 healers. Unknown keys are rejected.

Through `/api/mcp-v2`, `nouns_battler_arena` reads discovery, `nouns_battler_play` runs a free exhibition with the same input fields, and `nouns_battler_record` reads a commissioned record with `{ "id": "pai_..." }`. These tools do not sign payments or alter browser-league state; the play tool computes an exhibition. No model or provider identity is verified: any compatible caller can use the interface.

## Optional commissioned record

The optional x402 purchase is $0.01 USDC for a persistent match record, replay, and receipt. It buys no prize or competitive advantage. Read the live catalog first, then send `POST /api/agent/battler`:

```json
{
  "match": {
    "seed": 42,
    "left": { "gang": "tomato-noggles", "tactic": "rush" },
    "right": { "gang": "cobalt-frames", "tactic": "guard" }
  },
  "rulesVersion": "REPLACE_WITH_CURRENT_CATALOG_RULES_VERSION",
  "maxSpendUnits": "10000"
}
```

An unsigned request retrieves HTTP 402 terms when the service is available. Inspect those terms before an explicitly authorized payment. `10000` is the per-request cap in six-decimal USDC base units. The caller must enforce its own cumulative spending budget across requests; this field is not an account-wide budget.

For an authorized purchase, retain one `Idempotency-Key` and the exact request body. Retry with that same key and body; never invent a new key to recover an uncertain result. A timeout, ambiguous settlement, or pending response requires holding further payment attempts and checking `/api/actions/{actionId}`. A payment may have settled even when artifact storage failed; follow the same-key recovery response rather than buying again. Only a `succeeded` action with its result establishes the completed record. The watch link is `/nouns-nation-battler-arena/?record={actionId}`.

No real payment has been tested for this integration. Local mocked settlement and replay checks do not prove live USDC transfer or settlement. The browser's “View terms” control never signs or submits a payment.

## Published exhibition: Rivalry Night 001

`/nouns-nation-battler-rivalry-night/001/` is the shared opening exhibition: Tomato Noggles Rush versus Cobalt Frames Guard, seed `20260915`. The original match, catalog, replay frames and SHA-256 match hash are committed at `/games/nouns-nation-battler/records/rivalry-night-001.json`; `/nouns-nation-battler-rivalry-night.json` is its discovery twin. It is free to read and replay and is independent of the optional commissioned-record product.

The publication generator calls the same pure rules engine and verifies its exact result against the free server API before first writing. Re-running `node scripts/generate-battler-rivalry-record.mjs` verifies the existing artifact without rewriting it. `--verify-live` also checks the live free API. It refuses changed records: new rules or fixtures require a new edition. The published replay uses the saved catalog and frames, checks the match hash, and never resimulates the fixture in the viewer.

Arena setup links accept catalog-approved `gang` (left-side alias), `leftGang`, `rightGang`, `leftTactic`, `rightTactic`, and a uint32 `seed`. Loading a setup link does not submit a match or payment. A free rematch does not overwrite the published result or update a shared league table. The original 30-v-30 browser season remains local, while Season 6 dates and sample recaps are explicitly archived planning/fictional examples.
