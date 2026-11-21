# Where to put a word from the mint

The [Nouns Money desk](https://pointcast.xyz/loom?to=loom%3Acf41d135c8ff2ace12f59c78%23m_3h143a3m1i) asked six PointCast rooms where they could show a silent, immediately skippable art note. These are the placements checked on November 20, 2026.

| Room | What a visitor is doing | Where the card fits |
| --- | --- | --- |
| [Loom directory](https://pointcast.xyz/loom/#directory) | Browsing public thread rows that refresh while the page is open | This draft slips “Somebody left this.” between the first and second rows of All. It stays dismissed when the directory refreshes or the visitor changes filters. |
| [Nouns Nation Battler](https://pointcast.xyz/nouns-nation-battler/) and [Battler TV](https://pointcast.xyz/nouns-nation-battler-tv/) | Playing or watching a match | This draft shows “The prize money.” when a winner has been recorded. Next Match and Replay work immediately. TV’s four existing sports cards keep their slots. With Auto Next on, the next match clears the art after the game's usual 3.2 seconds. |
| [El Segundo daily briefing](https://elsegundo.xyz/daily/) | Reading headlines, events and community links, then copying the daily draft | A companion change for the briefing editor places the sandwich card after the Learn section, before the shareable draft. The editorial listings and copied text exclude the house ad. |
| [Nouns Drum Club](https://pointcast.xyz/nouns/drum-club/) | Playing an instrument or looping a sequence | There is no automatic track change. The visitor's explicit Stop action is a natural point for “Paid in full.” The generic stop routine also fires at teardown, so it is the wrong hook. |
| [Shortwave](https://pointcast.xyz/shortwave) | Reading a feed that refreshes under several filters | A labelled aside could sit between two Everyone posts. Keep it outside the post records, saved casts and counts, and remember dismissal across refreshes. |
| [College Football magazine](https://pointcast.xyz/25/magazine/) | Reading the issue linked as “The magazine” in the homepage rack | A static page break after the table of contents would preserve article links and page numbering. The bare /magazine/ path returned 404. |

The two PointCast cards link to the live [Nouns Money mint](https://nounsmoney.xyz/). HOUSE 01 is a presentation proof, separate from the daily issue numbers. Both cards show “Art, no cash value.” They make no audio or tracking requests.

## Source locations

- [Loom directory renderer](../../src/pages/loom/index.astro)
- [Battler match finish and TV interstitials](../../public/games/nouns-nation-battler/app.js)
- [Drum Club transport](../../src/lib/nouns-drum-club-ui.ts)
- [Shortwave feed](../../src/pages/shortwave.astro)
- [Magazine rack](../../src/components/HomeMagazineRack.astro) and [issue contents](../../src/pages/25/magazine/index.astro)
