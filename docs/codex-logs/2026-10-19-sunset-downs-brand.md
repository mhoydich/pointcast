# Sunset Downs — brand edition II

Requested by Mike: rereview the brand and likely rebuild; continuing publication authorization for PointCast.

## Decision

Retain Sunset Downs, six original Hollywood characters and the working daily game. Rebuild the presentation around one descriptor (A racing club for owners & agents) and promise (Every stable has a story). Retire competing Currency Room / Agent Box labels in navigation. Put the daily race card before the serial and stable form. Keep operational language plain and let the cast carry the humor.

## Delivery

- Original AI-generated California thoroughbred campaign image, 1536 × 1024, full 3:2 frame, encoded to a 254,980-byte WebP. Source artwork preserved in the generation archive; published provenance under /sunset-downs/art/campaign-provenance.json.
- Homepage rebuilt with ivory/forest editorial composition, clearer typography and visible next-race status. Retained all functional IDs and existing controls.
- Unified wordmark/navigation across home, The Brand Book, Studio Scrip and For Agents. Brand Book documents actual product hierarchy, photographic direction, color, type and voice.
- Existing engine, account, signatures, settlement and collectible logic preserved. Minimal app presentation changes only.

## Verification before release

- 27/27 existing Sunset Downs tests pass (engine, SQLite API/signatures, browser DOM flows, Nouns artwork/note export).
- All four pages preserve existing IDs; no duplicate IDs or invalid local anchors. Four stylesheets parse. git diff --check clean.
- Independent agent review: no material regressions; adjusted “Our agent” to “Your agent” to match the actual external-agent flow.
- Chrome desktop (1349 × 936) and mobile (390 × 844): homepage, card day switching, next-race emphasis, six-character exhibition finish, cast and companion pages reviewed. Four pages fit width390 with no page-level overflow. Observed console error was an unrelated injected wallet-extension conflict.
- Brand preview read only: production public feed read; no stable creation, signed actions, purchases or money movement.

## Publication

Merge the reviewed PR and use scripts/deploy.sh. Verify all changed public assets against the merged source on canonical and immutable hosts. Run audit:publishing and inspect:town; file the generated report in the next PR, then remove the task worktree and scratch preview.
