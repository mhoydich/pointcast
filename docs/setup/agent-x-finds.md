# Agent X finds: from a post on X to a free CC0 edition

How the agent wallets (#1905) pick things from X to mint, without paying for X
API access. The plan behind this is Mike's "agents wander X and mint on a
budget" doc (Nov 22, 2026).

## The free path

Nobody here pays for X data. Desks that can already see X post what they find
to the Loom, and the agents decide from the Loom:

1. A desk that reads X (Grok Bot, Kenzo's Grok bot, Codex and other
   ChatGPT-side sessions, the Office Noun and Nouns Money desks) posts a FIND
   card to Loom `#x-finds`.
2. The agent for that beat reads the card, scores it, and replies under it
   with `formatReply()`: `SKIP`, `WAIT`, `WOULD MINT` or `MINTING`.
3. While an agent is in shadow (every agent, until Mike adds it to
   `liveAgents`), nothing is spent.
4. A live agent mints through the signing server
   (`POST /api/agent-wallets/:id/mint`, #1906) into Open Press (#1907).

## FIND card

One find per Loom message:

```
FIND
post: https://x.com/<handle>/status/<id>
beat: office-noun
kind: response | gift | their-work
consent: https://x.com/<same handle>/status/<id>   (their-work only)
tz: <the author's publicly posted tz or .tez>      (gift only)
why: one line
```

- **response**: our own original CC0 art with whole Nouns, linking the post.
- **gift**: a response edition sent to the author's public tz/.tez.
- **their-work**: the author's own piece, only when that same account asked us
  or marked it CC0 in the consent post.

Never copy someone's image or text into a token outside `their-work`.

## Decision

`src/lib/agent-finds.mjs`, policy in `src/data/agent-mint-policy.json`:

1. Card parses (X status link, known beat, kind, why, consent/tz rules).
2. House rules: no price talk, buy talk, predictions, tickers, engagement
   giveaways, noggles on their own, or key material.
3. Score 0-2 on five tests (on beat, nounish, delight, fresh, gift-worthy);
   7 of 10 or better.
4. No mint about the same X account in the last 7 days.
5. Budget against the op ledger, all in mutez:

| Limit | Per agent | Fleet |
| --- | --- | --- |
| Mints a day | 3 | 20 |
| Gifts a day | 5 | 30 |
| Tez a day | 1.5 | 10 |
| Tez a week | 7 | 40 |
| Tez per operation | 0.5 | |
| Balance floor | 15 | |
| Edition size | 1 to 50 | |

A find that fails only a daily or weekly limit gets `WAIT`; anything else that
fails is `SKIP`.

## What Mike controls

- `liveAgents` (empty = everyone in shadow) and every number in the policy
  file. Changes land by PR like anything else.
- Funding the wallets.
- Originating or pausing Open Press.

## Not built yet

- The scheduled job that reads `#x-finds`, calls `decide()` and posts the
  reply (next PR). It needs a server-side Loom read and the #1906 op log as
  the ledger.
- A per-agent allowlist in #1906 so a token can only call Open Press `mint`
  and FA2 `transfer`. #1906 currently also allows `send`.
