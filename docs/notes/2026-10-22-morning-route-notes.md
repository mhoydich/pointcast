# Morning Route research note: Paperboy (Atari Games, 1985)

Filed 2026-10-22 by Claude Code for Morning Route (`/morning-route`, Block
0747), one of the five wave-two threads on Cabinet Row, directed by Michael
Hoydich. This note records what the game borrows from Paperboy and where
each fact came from. Facts marked *checked* were confirmed by web search on
2026-10-22. Anything marked *from memory* was not checked this session and
is background, not a citation.

## The original

- **Who and when.** *Checked:* Wikipedia credits John Salwitz, Dave Ralston,
  Russel Dawe and Carl Bedard. Ralston pitched the idea at a 1983 Atari
  brainstorming session, and Salwitz was at first reluctant to join it.
  Sources disagree on the date: Wikipedia gives February 1985 in Europe and
  April 1985 in North America, while the title screen reads 1984. Morning
  Route says 1985, as Cabinet Row's `row.mjs` does.
- **Hardware.** *Checked:* the first game on Atari's System 2 board (DEC T11
  main CPU with a 6502 sub-processor).
- **Cabinet.** *Checked:* a bicycle handlebar controller with throw buttons
  on the grips. Morning Route's version is a drag to steer and a tap on the
  right half of the field to throw; on a keyboard, the arrows and Space.
- **Structure.** *Checked:* one week of deliveries, Monday to Sunday. A
  missed delivery or a damaged subscriber house costs that subscriber; a
  perfect day wins back a non-subscriber. *From memory:* the screen scrolls
  diagonally in a three-quarter view, papers come from bundles on the
  route, there is a training course at the end of each day, and the day
  ends with a map that shows subscribers lost and gained.

Salwitz gave a Classic Game Postmortem on Paperboy at GDC 2019 (GDC Vault,
below). It was not watched for this note.

## What Morning Route keeps, and what it changes

| Paperboy | Morning Route |
| --- | --- |
| A week, Monday to Sunday | A week of 16-house days that loops, a little faster each time |
| Subscribers and non-subscribers | Lit houses with a lit porch and a mailbox; dark houses |
| Papers run out, bundles refill | 10 in the bag each morning, bundles of 5 on the road, 20 at most |
| Mailbox worth more than the doorstep | Porch 100, mailbox 250 |
| Vandalism of non-subscriber houses scores | Removed. A paper on a dark house is a miss and scores nothing |
| Losing subscribers | Removed. The report card grades the day instead; a perfect day earns a bonus and an extra rider |
| Hostile street (cars, dogs that chase, breakdancers, a tornado) | Gentle: sprinklers that come and go, bins, a dog that only sits, a car backing out, skateboarders |
| Diagonal three-quarter scroll | Portrait top-down: the street scrolls down the field while the rider rides up it |
| Training course | RUSH's short ramp lane with stars to catch in the air |

The mood mapping follows the shared model in `src/lib/breakwater/mood.mjs`:
a porch delivery is `paddle`, a mailbox is `brick`, a fall is `loss`, a
finished day is `wave`. The mood response sets street speed, target size,
obstacle and bundle spacing, music tempo and scale, the palette and
particle density.

## Originality

No Paperboy characters, names, sprites, music, text or level layouts are
used. Every figure in `src/lib/morning-route/sprites.mjs` is a short list of
plain rects drawn for this game, every color comes from the shared Atari
800XL and Commodore 64 palettes, and the music is a generated oom-pah bass
and a two-phrase tune written for this page. The Morning Edition is
PointCast's own 6:45 AM paper (`/morning`).

## Sources checked 2026-10-22

- Wikipedia, "Paperboy (video game)": https://en.wikipedia.org/wiki/Paperboy_(video_game)
- Arcade History, Paperboy: https://www.arcade-history.com/game/1935/
- Thumbsticks, John Salwitz on making Paperboy: https://www.thumbsticks.com/john-salwitz-making-of-atari-paperboy/
- StrategyWiki, Paperboy: https://strategywiki.org/wiki/Paperboy
- GDC Vault, Classic Game Postmortem: Paperboy (John Salwitz, 2019): https://gdcvault.com/play/1025733/Classic-Game-Postmortem-Paperboy
