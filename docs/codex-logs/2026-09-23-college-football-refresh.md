# College football September refresh

The current college football section was still publishing July preseason rankings. Board 001 now uses results through September 19 and a September 20 AP comparison, checked September 23. PointCast ordering and cases are editorial judgments, distinct from sourced results and the reference poll.

The refresh covers the board, all current team cases, disagreements, receipt book, season ledger, magazine front page, directory ranking order, discovery metadata, homepage cards, and shared department navigation. Five dropped teams retain their existing URLs and opening cases. Older features and game/identity cohorts keep their dates and original seeds.

Board 000's human archive previously imported mutable live data. It now reads its frozen JSON; the original JSON bytes and SHA-256 remain unchanged. Both editions have human and machine snapshots. The receipt book retains all 25 opening claims alongside 25 new claims; claims are not graded from rank movement alone. No intervening weekly boards or automated publishing cadence are implied.

Validation: 57 focused tests passed across the board, directory, magazine, Alabama file, mascot game, 2029 identities, field kit, Song Yard, and coach desks. `scripts/verify-football-refresh.mjs` checks the final build for snapshot integrity, directory/ranking parity, current and retained team URLs, original claims, and internal football links.

Sources are linked in Board 001. Directory institutional data retains its August 12 snapshot date. No payment, wallet, voting, or identity contracts changed.

Rendered verification passed for 83 football HTML pages, every internal football link, 25 current and 5 retained team cases, 50 claims, 266 directory programs, and both snapshots. Browser QA confirmed copy interaction and directory search (SMU resolves to its current rank); phone-width navigation fits. Browser review caught a shared-style contrast collision, fixed by setting each core page’s own background and text colors. Full initial site build completed (2,533 generated pages); release build must use the final merged commit.
