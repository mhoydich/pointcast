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
`teach`, `group_buy`, `report`, `broadcast`, `moderation`.

## Reputation (derived, never stored)

Per handle: counts by status, `keptRate = kept / (kept + broken)`, and `brier`,
the mean of `(confidence − outcome)²` over resolved pledges that stated a
confidence (kept = 1, broken = 0). Lower Brier is better calibrated.

## Who writes what

- The elsegundo.xyz buying lab is the writer of record for pledges, signals,
  withdrawals and lab contributions. Writes go through its own MCP at
  `https://elsegundo.xyz/mcp/desk` (`post_pledge`, `post_signal`, `withdraw`,
  `contribute`, among 12 tools). PointCast never writes across sites.
- PointCast reads it through `trading_desk_read` (`DESK_MIRROR_URL`, default
  `https://elsegundo.xyz/api/v1/buying-lab`): `view=book` passes through the
  lab's own book (`GET <base>`), `view=ledger` normalizes
  `GET <base>/ledger?limit=100`, and `view=reputation` with a handle passes
  through `GET <base>/record?handle=`. Without a handle it counts a board from
  the ledger. The lab keeps its last 3000 events, so open entries come from
  its book, not from the ledger.
- PointCast contributions keep their own tools; `contribute_paths` maps each to
  this vocabulary, and names the lab's MCP tools for desk routes.

## Mapping from the buying lab's ledger events

| lab event field | here |
| --- | --- |
| `type`: `pledge` \| `signal` \| `contribution` | `kind` |
| `type`: `withdraw` | `kind` from the event's `kind`, `status: withdrawn`, `withdraws: true`; it carries the `id` of the pledge or signal it cancels, and `pairWithdrawals()` folds it into that entry |
| `by` | `actor` |
| `confidence` 0–100 integer | `confidence` / 100 (so 1 means 1%) |
| `item` + `tier` | `target { type: edition, id: "item:tier" }` |
| `place` | `target { type: place }` |
| no side (the lab has no asks yet) | a priced pledge or signal is `side: bid` |
| `kind` on a contribution | `contributionType`: `place-data` → `data`, `group-buy-host` → `group_buy`, `bonfire-host` → `host`, `skill-night-teach` → `teach`; `correction`, `review`, `art`, `code`, `moderation` as is |
| `status`: `pending` / `not-yet` / `accepted` | `open` / `declined` / `accepted`; `hidden` rows are never mirrored |
| `note`, else `title` | `body` |
| `at` | `createdAt` |

`site` is set to `elsegundo.xyz` on every mirrored row. Nicknames only, and no
money anywhere.

`normalizeEntry()` also accepts a few older aliases (`who`, `note`, `at`,
`via`, `itemId`) so a renamed field degrades to missing instead of failing.
