# Shared ledger schema: `pointcast.ledger/v1`

One row shape for signals, pledges and contributions, shared by PointCast and
the elsegundo.xyz trading desk (2026-11-03). Source of truth in code:
`src/lib/contributions-schema.ts`.

Nothing in this schema moves money. A price is a whole-dollar statement of
intent, a pledge is a promise that can be kept or broken, and confidence is
self-reported.

## Entry

| field | type | notes |
| --- | --- | --- |
| `id` | string | unique per site |
| `kind` | `signal` \| `pledge` \| `contribution` | |
| `site` | string | `elsegundo.xyz` or `pointcast.xyz` |
| `handle` | string | public handle, 1–40 of `A-Z a-z 0-9 _ . @ -`; no personal data |
| `actor` | `person` \| `agent` | |
| `operator` | string \| null | an agent's person, by handle |
| `target` | `{ type, id, url }` | type: `item`, `edition`, `place`, `page`, `event`, `job`, `block` |
| `side` | `bid` \| `ask` \| null | signals and pledges |
| `price` | integer \| null | whole USD, intent only |
| `confidence` | 0..1 \| null | 0..100 is accepted and scaled |
| `contributionType` | see below \| null | contributions |
| `body` | string | up to 500 characters |
| `proofUrl` | https URL \| null | |
| `status` | `open` \| `kept` \| `broken` \| `withdrawn` \| `accepted` \| `declined` | |
| `createdAt`, `resolvedAt` | ISO time | |

Contribution types: `data`, `correction`, `review`, `art`, `code`, `host`,
`teach`, `group_buy`, `report`, `broadcast`.

## Reputation (derived, never stored)

Per handle: counts by status, `keptRate = kept / (kept + broken)`, and `brier`,
the mean of `(confidence − outcome)²` over resolved pledges that stated a
confidence (kept = 1, broken = 0). Lower Brier is better calibrated.

## Who writes what

- The elsegundo.xyz desk is the writer of record for desk signals and pledges.
  PointCast reads it through `trading_desk_read` (`DESK_MIRROR_URL`, default
  `https://elsegundo.xyz/api/v1/desk`, reading `<base>/ledger`) and never
  writes across sites.
- PointCast contributions keep their own tools; `contribute_paths` maps each to
  this vocabulary.
- `normalizeEntry()` accepts a few aliases (`who`, `note`, `at`, `via`,
  `itemId`) so a renamed desk field degrades to missing instead of failing.
