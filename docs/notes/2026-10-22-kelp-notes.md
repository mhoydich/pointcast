# Kelp research note: Nibbler and the home-computer snake listings

Filed 2026-10-22 by Claude Code for Kelp, thread 2 of 5 on Michael
Hoydich's games brief. This note records what the game borrows from the
1982 arcade Nibbler and from the snake games that ran on home computers in
the late 1970s and 1980s, and where each fact came from. Everything below
was checked by web search on 2026-10-22; page fetches were blocked by the
session's network policy, so the facts come from search result extracts of
the pages listed under Sources. Anything marked *from memory* was not
independently verified in this session and should be treated as
background, not as a citation.

## Blockade (1976), where the trail came from

Gremlin Industries released Blockade in November 1976, a two-player game in
which each player steers an arrow that leaves a solid trail; the aim is to
outlast the other player without hitting a wall or either trail. Lane Hauck
and Ago Kiss built it; Hauck reportedly started from a random-walk idea
from physics and then forbade the arrow from revisiting a square, which is
the trail. It debuted at the 1976 Music Operators of America show in
Chicago, took 3,000 orders at its first showing, and was cloned quickly
(Atari's Surround among them). The snake genre traces to it, and the Tron
light-cycle sequence echoes it. Kelp keeps the one rule that matters from
Blockade: the strand is a trail, and the trail is as deadly as the wall.

## Nibbler (1982), the single-player version

Rock-Ola, a jukebox and pinball company that made arcade games in the early
1980s, released Nibbler in late 1982 (Wikipedia gives October 29, 1982 for
North America; arcade-history gives December 1982). Japanese distribution
went to Taito. The player steers a snake through an enclosed maze with a
4-way joystick; it grows longer with every item eaten; there are no
enemies, and a life is lost only when the snake bites itself; a maze is
cleared by eating everything on screen; there are 32 mazes, which repeat
with color changes; food is worth more on later stages and the time left on
the stage timer is paid as a bonus. A remake's notes add that Nibbler does
not stop at corners and that the timer speeds up when the snake goes too
long without eating, which may or may not match the arcade original.

Nibbler's lasting claim is its score counter: it is widely credited as the
first game with a nine-digit score, so it could pass one billion where
other games rolled over at 100,000 or 1,000,000. Rock-Ola offered a cabinet
to the first player to reach a billion; Tim McVey did it with
1,000,042,270 points in January 1984 (sources give January 15, and
Ottumwa, Iowa, declared January 28, 1984 Tim McVey Day). The documentary
Man vs. Snake covers the chase. Nibbler is also cited as the basis for the
QBasic Nibbles that shipped with MS-DOS.

What Kelp takes from Nibbler: a single strand on an enclosed field; growth
per item; a stage cleared by a quota (a target length here, rather than
clearing every item); a new obstacle pattern per stage; the snake restarting
the stage after a collision; food worth more on later stages; a cabinet-row
score readout. What it leaves: the 32 hand-drawn mazes (Kelp has seven
patterns that cycle, two of them spelled from the pixel font), the stage
timer, and the nine-digit counter (six digits, like Breakwater's).

## The home-computer listings

**Worm (1978).** The first known home-computer snake, by Peter Trefonas for
the TRS-80, published by CLOAD magazine in 1978, with versions by the same
author for the Commodore PET and Apple II following. A single player, a
growing worm, a wall; the shape every later listing kept.

**Snake Byte (1982).** Chuck Sommerville's game for the Apple II, published
by Sirius Software in 1982, released the same year for Atari 8-bit
computers and on cartridge for the VIC-20, with a Commodore 64 version in
1983. The snake eats apples; each apple eaten makes another appear and the
snake grows; eating ten apples without hitting a wall or the body opens a
door to the next level; three lives, one more on leaving a level; bars on
each side of the screen move inward and add three apples to the quota if
they reach the top before an apple is eaten. COMPUTE! reviewed the VIC, 64,
Apple and Atari versions in March 1984. Kelp's quota per stage, its extra
life and its "every plankton eaten makes another appear" rule are the
Snake Byte shape.

**Worm of Bemer (1984).** COMPUTE! issue 47, April 1984, page 74, by
Stephen D. Fultz: a type-in in which a worm named Nerm crosses eleven rooms
of Bemer Castle eating magic mushrooms; five mushrooms in a room open the
exit; four lives. Written for the Atari, with versions included for the
VIC-20, Commodore 64, TI-99/4A and IBM PC/PCjr. This is the type-in shape
Mike's brief points at: one listing, several machines, each with its own
character set and colors doing the same thing. Kelp's two machine modes are
that idea on one page.

**Sssnake!!! (1986).** Antic, October 1986, Chet Walters' Game of the Month
type-in in Atari BASIC, "one of the fastest-moving BASIC action games" of
its time, for any 8-bit Atari with 32K, listing name SNAKE.BAS. Antic ran
one type-in game per issue; ANALOG Computing was its rival on the Atari
side. No 1983 or 1984 Antic or ANALOG snake type-in turned up in this
session's searches.

**Later.** *From memory:* Nibbles (QBasic, with MS-DOS 5 in 1991) and Nokia's
Snake (1997) are the two versions most people have played; neither was
consulted for Kelp beyond their shared rule set.

## What the game does with all this

| Element | Kelp |
| --- | --- |
| Field | 24 x 32 cells, portrait, the frame is the wall (Blockade, Nibbler) |
| Growth | one segment per plankton, two per golden plankton (Worm, Snake Byte) |
| Stage | cleared at a target length, 12 then +4 per stage; the next stage stands a new rock pattern (Nibbler's mazes, Snake Byte's quota) |
| Patterns | open, posts, bars, nameplate, reef, gates, counter; nameplate and counter are 3x5 font glyphs at three cells per pixel with a doorway cut through enclosed loops |
| Lives | three, one more every third stage; a collision restarts the stage with a fresh strand (Nibbler, Snake Byte); none on CALM |
| Score | 10 x stage per plankton, x1.5 at FLOW, x2 at RUSH, x3 for golden; six-digit readout |
| Machines | the two Breakwater tributes: Atari 800XL Graphics 0 blue, Commodore 64 blue in a light-blue border, each with its boot screen (the type-in's many-machines idea) |
| Sound | one note per plankton climbing a pentatonic with the strand's length, a thud on collision, a slow swell arpeggiator whose tempo and scale follow the mood |

## Sources

- Nibbler (video game): https://en.wikipedia.org/wiki/Nibbler_(video_game)
- Nibbler at arcade-history: https://www.arcade-history.com/game/1769/
- Nibbler at StrategyWiki: https://strategywiki.org/wiki/Nibbler
- Arcade Blogger, "Nibbler: The Billion Point Arcade Game": https://arcadeblogger.com/2016/07/01/nibbler-the-billion-point-arcade-game/
- Vic Nibbler notes (a remake; rules may differ): https://rawg.io/games/vic-nibbler
- Blockade (video game): https://en.wikipedia.org/wiki/Blockade_(video_game)
- Gremlin Industries: https://en.wikipedia.org/wiki/Gremlin_Industries
- Snake (video game genre): https://en.wikipedia.org/wiki/Snake_(video_game_genre)
- Snake Byte: https://en.wikipedia.org/wiki/Snake_Byte
- COMPUTE! issue 46, March 1984, Snake Byte review: https://www.atarimagazines.com/compute/issue46/045_1_REVIEWS_Snake_Byte_For_VIC_64_Apple_And_Atari.php
- COMPUTE! issue 47, April 1984, Worm of Bemer: https://atarimagazines.com/compute/issue47/109_1_Worm_Of_Bemer.php
- Antic, October 1986, Sssnake!!!: https://www.atarimagazines.com/v5n6/sssnake.php
- Antic (magazine): https://en.wikipedia.org/wiki/Antic_(magazine)
- Type-in program: https://en.wikipedia.org/wiki/Type-in_program
