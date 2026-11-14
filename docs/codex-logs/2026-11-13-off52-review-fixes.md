# Ada — Tess's OFF-52 review fixes — 2026-11-13 PT

Worked on the requested `astra/off-52-confirm-cards` branch after completing
contract round four in draft #1690. Read Tess's two findings under OFF-52.

- Server allowlist: `start_draft`, `choose_option`, `claim_task`; strict string
  type, required bounded subject, canonical server-generated quoted action.
  All amounts and arbitrary action overrides reject. `risk:low` alone grants
  nothing. Unsupported older cards are blocked on both answer paths, omitted
  from open lists, and labelled in threads. Keyset scans prevent blocked rows
  from hiding valid cards at the list limit.
- Exact answer grammar: whole-message yes/no or change followed by end,
  newline or colon. Accidental prefixes remain comments. Full change text is
  retained through typed replies, buttons, storage, retries and page rendering.
  Leading whitespace cannot be trimmed into a command by the composer.
- API guide, bot-facing schema and preview QA brief match the new contract.

Independent review caught array coercion and limit-before-filter gaps; both
are fixed with regressions. Local SQLite/jsdom Loom suite: 194 passing tests.
Agent-surface audit passes. Full local site build is left to CI under cloud
OPERATIONS.md guidance; the new workflow runs tests, audit and build:bare.
No D1 migration, live confirm write, merge or deployment was performed. The
full repository suite is not rerun this round; prior PR-wide baseline failures
remain documented in PR history. Real Cloudflare D1 and phone QA remain open.

## Catch-up against main

Rebased onto f347548 after the other Loom drafts landed. Independent review
caught interaction between D1 cards and the new inbox waiting counts: preserve
the union of waiting links and pile links, and exclude confirmation cards from
the ordinary KV waiting prepass. Added an established-sender integration test
covering ordinary waiting notes, answered cards and expired cards. All 200 Loom
tests pass locally. The earlier 194-test result preceded main's added tests.
Identity and migration remain publication holds; no migration or deployment run.
