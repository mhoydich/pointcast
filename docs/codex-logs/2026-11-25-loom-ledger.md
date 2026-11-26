# V2-4: read-only Loom ledger

Sol (Codex, Mike's iMac), 2026-11-25. Draft for Fable to review, based on
`astra/hearth-person-card-20261123` at `fc368447d` (PR 1927 plus its 60-second cache).
Claim: `loom:9eb9f12e3794b516eebfaade#m_5o1k605r6j`, replying to V2-4 on
`m_4e6261443m`.

## Behavior

- `/loom/ledger` uses HearthLayout and hearth.css, one row per contributing
  handle, sorted by closed cards, then latest token report, then handle.
- People receive their operator-linked bots' contributions, matching person-card
  ownership. Other bots keep a standalone row. Person handles link to their cards.
- `hearth-contributions.mjs` holds the existing explicit-actual token parser,
  approximation labels, folded-post filtering and reopened-task reconciliation.
  Person cards use the extracted implementation with unchanged behavior. The
  ledger uses separate name/address attribution maps so ambiguous claimants do
  not credit two handles. Nothing is counted from free-form DONE prose alone.
- Tokens remain the latest qualifying report, never a sum or lifetime total.
  Missing/zero figures and empty handles are omitted. Shared cards may credit
  more than one contributor; the page explains this and omits a grand total.
- One bounded read-only batch reads existing #efficiency, #officenoun-tasks and
  #ledger rooms, including older source rooms. The existing Hearth API folds
  stored logs without writing them. Ledger cache keys are separate from person
  and activity reads, with the same 60-second edge lifetime. Unavailable batches
  are not cached; trimmed/incomplete history remains disclosed.

## Validation

- `node --test tests/loom*.test.mjs`: 376 passed, none failed or skipped.
- Fixture coverage includes human/operator aliases, bots, duplicate/reopened and
  multipart cards, approximation labels, invalid actuals, absent empty handles,
  ambiguous names, partial reads and retry behavior.
- The real Astro page and HearthLayout are compiled/rendered in memory using
  the copied dependencies; JSDOM checks sections, links, positive-only figures,
  source receipts, history warnings, retry and escaped content.
- Cache tests check hits through 59,999 ms, refresh at 60,000 ms, mode isolation,
  failures and absence of Loom KV writes. Existing person-card tests pass.
- Independent review found and verified fixes for identity alias collisions.
  A comparison against the original person-card implementation also returned
  identical results across mixed fixtures and six name variants.
- Current public room data read at 2026-11-25T21:12:55Z yields **@mike: 10 closed
  cards; latest report about 140,000 tokens**. Token receipt:
  `loom:4b5eed04230a4ab57bf900bc#m_1t65300o3o` (2026-11-22). Closed cards: OFF-1,
  OFF-20, OFF-22, OFF-26, OFF-52, OFF-54, OFF-55, OFF-58, OFF-59, OFF-65.
  An ambiguous historical OFF-36 attribution is omitted. This is local code
  evaluated against live public input, not a deployed-page check.

No install, build, dist output, deployment, migration, wallet/contract change or
Loom storage mutation. Only the requested claim/completion replies are posted.
