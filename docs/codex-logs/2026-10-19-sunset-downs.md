# Sunset Downs — October 19, 2026

Mike directed a horse-racing version of AI Grand Prix: daily races, recurring Hollywood personalities, entertainment and money, agent-owned stables, a Nouns Money companion, premium equestrian styling and a Ralph Lauren / Polo-inspired style guide. He explicitly authorized PointCast publication. The new game has its own route and preserves the AI practice season.

## Product

- `/sunset-downs/`: an original Hollywood racing-club serial, six authored house characters, a daily story rotation, animated recorded finishes and a separate instant Screen Test exhibition.
- Registered agent identities control one shared stable and one named horse. The owner-facing browser keeps a nonextractable Ed25519 control key in IndexedDB; cross-tab Web Locks prevent key replacement and conflicting writes. The downloadable CLI keeps its own owner-only local key file and serializes writers.
- Three posts daily at noon, 16:00 and 20:00 America/Los_Angeles. The server/database enforce the cutoff. At the first read after post, one random seed and exact entrant snapshot are frozen and the result is recorded once. This is read-through settlement, not an unattended cron.
- 1,000 initial free nontransferable play credits; 50 per entry; top-three finishing positions award 300 / 150 / 75 only to owned horses. House positions do not pay or roll down. Entry fees are removed, not pooled. No cash wagering, wallets, funds, tokens, transfers or redemption.
- `/sunset-downs/money/`: six exact-source Nouns horse identities and 18 Studio Scrip collectibles, editable stable credit, self-contained SVG exports and three-note print sheets. This artwork is separate from the racing balance and has no cash value. Pinned seeds, source provenance and SHA256 manifest accompany the original geometry.
- `/sunset-downs/style/`: the requested standalone printable equestrian style guide, with original SD horseshoe crest, forest/ivory/brass/oxblood/navy palette, type/spacing, programs, stable cards and paper direction. The apparel reference is inspiration, with no borrowed logos or affiliation claim.
- `/sunset-downs/agents/`: owner invitation, current card, protocol and ready CLI/SDK. Reading the card registers no identity or entry. Agent labels are self-described, not verified model or human ownership.

## Verification and review

- 27 focused engine, actual SQLite/Ed25519 API, unit-DOM and original-art tests passed. They cover Los Angeles DST, signed scopes, bounds, immutable fields, all podium awards, concurrent/repeated settlement, commit-time late entry rejection, uncertain commits, safe pending retries, stale profile reads, repeated signup, outages, escaping and exhibition/replay safety.
- A separate local service uses the real registry and racing handlers with ephemeral SQLite, never production data. The browser owner flow created a stable at 1,000, entered once at 950, and preserved the same identity/balance/one entry after reload.
- CLI integration against that local service: initial 1,000; response deliberately lost after entry committed at 950; exact retry returned the original receipt at 950; duplicate entry was rejected; another race left 900. Key file mode 0600 and writer-lock release were verified. Private keys were not printed or sent.
- Independent backend review found a handler-start/database-commit deadline race; the migration now rejects late database commits. UI review found key/profile concurrency issues; cross-tab locking, response generations and explicit retries address them. Real phone-width review found an image intrinsic-size overflow; the artwork is constrained before publication.
- The complete site build, publication, additive migration and live HTTP/asset checks are release gates; post-publication town inspection belongs in a separate next PR under `docs/OPERATIONS.md`.

## Boundaries

No production test stables were created. No mainnet contract, cash market, wallet signature or real payment is part of this release. No newsletter, social post, outbound message or recurring assistant automation was created. Source review proves the scoped game behavior; it does not certify legal ownership, agent identity claims, physical print color or cryptographic fairness.
