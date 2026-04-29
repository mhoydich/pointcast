# Day 4 · Block ↔ Lexicon round-trip drift findings

**Filed:** 2026-04-29
**Author:** cc
**Sprint:** 5 (Day 4)
**Source:** `node scripts/roundtrip-blocks.mjs`

## Run summary

```
Block ↔ Lexicon round-trip · RFC 0004 / Sprint 5 Day 4
─────────────────────────────────────────────────────
total blocks scanned: 184
           lossless: 172 (93.5%)
            drifted: 12
```

12 file-based blocks (out of 184 scanned) drift round-trip. **Every drift is
on a Block schema field the RFC 0004 Lexicon does not carry.** No drift is
on a Lexicon field — the converter itself is faithful. The gap is editorial,
not behavioral.

## The four drifting fields

| Field | Block count | Block schema source | RFC 0004 status |
|---|---|---|---|
| `visitor` | 5 | freeform visitor-pass / mood metadata | not in Lexicon — drop or extend |
| `edition` | 1 | Tezos mint metadata (FA2 contract, tokenId, supply, price) | not in Lexicon — likely separate `xyz.pointcast.edition` ref |
| `draft` | 5 | boolean filter flag, in-repo only | intentionally out — not a wire concept |
| `clock` | 1 | clock-block special config (block 0324) | one-off, not in Lexicon |

## Per-block drift

| Block | Drifting path | Notes |
|---|---|---|
| 0207 | `visitor` | early visitor-pass block, freeform metadata |
| 0210 | `edition` | early MINT-type block with edition metadata |
| 0224 | `visitor` | visitor-pass series |
| 0226 | `visitor` | visitor-pass series |
| 0229 | `draft` | hidden draft, never published |
| 0232 | `visitor` | visitor-pass series |
| 0258 | `draft` | hidden draft |
| 0265 | `draft` | hidden draft |
| 0266 | `draft` | hidden draft |
| 0269 | `draft` | hidden draft |
| 0324 | `clock` | the clock-block special |
| 0334 | `visitor` | visitor-pass series |

## Recommendations for RFC 0004 v0.2 or RFC 0006

**Drop in repo, never on the wire — `draft`.** Filter flag for in-repo only.
The Astro getCollection filter (`!data.draft`) already strips drafts before
publish. No Lexicon field needed; document as repo-internal.

**Promote to top-level Lexicon ref — `edition`.** Edition metadata is
genuinely on the wire and matters for federation (tokenId, contract, supply,
price). I'd add a separate Lexicon `xyz.pointcast.edition` and reference it
from the block via `edition` field as a record-link. Two reasons over
inlining: (a) editions are mutable (`minted` count grows) while blocks are
immutable in our convention; (b) editions can sit in their own collection
for indexing.

**Fold into `meta` blob — `visitor` and `clock`.** These are shape-loose
freeform metadata, used by specific block types and surfaces (visitor-pass
series, the clock block). They belong in `meta` rather than as top-level
fields. Lexicon stays clean; converter follows.

## Proposed Lexicon v0.2 deltas

```diff
+ // edition becomes a typed ref-able sub-record
+ "edition": {
+   "type": "ref",
+   "ref": "xyz.pointcast.edition"  // separate Lexicon, sketched in RFC 0006
+ }

  "meta": {
    "type": "object",
    "properties": {
      "location":   { "type": "string" },
      "station":    { "type": "string" },
      "series":     { "type": "string" },
      "topics":     { "type": "string" },
-     "status":     { "type": "string", "knownValues": ["draft", "published", "archived"] }
+     "status":     { "type": "string", "knownValues": ["published", "archived"] },
+     // freeform sub-objects for surface-specific extras
+     "visitor":    { "type": "object" },
+     "clock":      { "type": "object" }
    }
  }

- (no `draft` field — repo-internal only)
```

## What this changes for Phase 1

If we commit Phase 1 dual-publish, the converter needs to grow `edition`
support and the `visitor`/`clock` fold-in. Both are mechanical. The
fundamental learning from Day 4: the Lexicon shape is right; what's
missing is the long-tail richness of what 380+ existing blocks
actually carry.

## Re-running the check

`node scripts/roundtrip-blocks.mjs` from repo root. Exit 0 if all
lossless, 1 otherwise. Plug into pre-commit or CI when Phase 1 is on
the table.

— cc, 2026-04-29, El Segundo
