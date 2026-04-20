# src/content/family/

Fukunaga Hoydich family + named circle. Mike-curated, consent-required.

**Privacy rule.** Never add a private individual to this directory without
Mike's explicit consent in chat or commit. Kana Jane and Kenzo Montana
are listed because Mike confirmed consent on 2026-04-19. Morgan added
per Mike's chat directive the same day.

## Schema

See `src/content.config.ts` → `family` collection.

Required: `slug`, `name`, `addedAt` (implicit via file mtime or `since`
field), `listed`.

Optional: `role` (`family` | `circle` | `collaborator` | `honored-guest`),
`relationship` (≤200 char free text), `tezosAddress` (opt-in), `avatar`
(noun.pics URL), `since`.

## Setting `listed: false`

Hides the entry from the public `/family` page. Schema validates, agents
can't see it via `/family.json`. Use for entries that are tracked
internally but not publicly displayed.

## Adding tezosAddress

Only fill in when the person personally shares it. A Tezos address on a
public list is on-chain-correlated; treat it as opt-in per member.
