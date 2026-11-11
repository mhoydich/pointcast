# Soft Landing research note: Lunar Lander and its home-computer descendants

Filed 2026-10-22 by Claude Code for Michael Hoydich's games brief (thread 3 of
five: a lunar lander). This note records where the game's rules come from and
what was checked by web search in this session. Anything marked *from memory*
was not independently verified here and is background, not a citation.

## The lineage

**1969, FOCAL on a PDP-8.** The first lunar lander was a text game. Jim Storer
wrote it in the fall of 1969 as a high-school student in Lexington,
Massachusetts, in DEC's FOCAL language on a PDP-8; the file was called
`ROCKET` because filenames were limited to six characters. The player typed a
burn rate every ten seconds and read back altitude, speed and fuel. Storer's
own page preserves the listing. (Sources: Storer, Technologizer's fortieth
anniversary piece, the Wikipedia genre article.)

**1973, BASIC.** David H. Ahl converted the FOCAL program to BASIC and
distributed it through DEC; three variants (`ROCKET`, `ROCKT1`, `ROCKT2`)
appeared in his 1973 book *101 BASIC Computer Games*. Ahl and Steve North later
moved them to Microsoft BASIC under the name Lunar Lander for *Creative
Computing* (1976), which is how the game reached nearly every home computer
with a BASIC prompt, the Atari 400/800 and the Commodore machines included.
The readout of altitude, vertical speed and fuel in Soft Landing's top right
corner is a descendant of that text table.

**1973, Moonlander on the DEC GT40.** Jack Burness wrote a graphical version as
a demo for DEC's GT40 vector terminal, with a light pen for the throttle. It is
the first drawn lander and the direct inspiration for Atari's arcade game.
(Source: Wikipedia, 1979 game article.)

**1979, Atari's Lunar Lander.** Atari's first vector arcade game, released in
August 1979 after the company built a vector engine in the wake of
Cinematronics' *Space Wars*. The view zooms in as the ship nears the ground;
flat landing zones carry a flashing bonus multiplier that is higher for smaller
areas; points depend on landing quality and site difficulty; crashes score by
severity and can cost fuel; a high beep warns when fuel is low; more coins buy
more fuel at any time. About 4,830 cabinets were sold before *Asteroids*
(November 1979) overtook it, and some 300 early *Asteroids* machines shipped in
Lunar Lander cabinets. (Sources: Wikipedia, arcade-history.) Soft Landing
borrows the vector look (stroked lines over the field color), the pads with
multipliers that rise as the pads narrow, and the idea that a landing is judged
on speed and attitude. It does not zoom, it does not sell fuel, and its
multipliers (1x, 2x, 4x, and a 5x sliver in RUSH) are its own.

**1980 to 1982, the home versions.** Adventure International published a
*Lunar Lander* for the TRS-80 (1980) and the Atari 8-bit computers (1981),
advertised as "an arcade game simulation" rather than a port. Commodore
published *Jupiter Lander* (HAL Laboratory) for the VIC-20 in 1981 and the
Commodore 64 in 1982, early enough that some sources call it the first C64
game; it has three pads marked x2, x5 and x10 and three thrusters (left, right
and up), and a hard landing destroys the ship. (Sources: Wikipedia 1980 game
article and Jupiter Lander article, MobyGames, C64-Wiki.) Soft Landing's
three-thruster control scheme and its left/right/up touch thirds follow that
shape. *From memory:* the Atari 8-bit magazines of the early 1980s (ANALOG,
Antic, Compute!) carried type-in landers too; none was checked this session.

## What the game takes from each machine

The two palettes, the 3x5 pixel font, the boot screens and the mood model are
the ones built for Breakwater; see
`docs/notes/2026-10-22-breakwater-c64-atari-800xl.md` for the hardware notes
behind them. New for this game:

- **The engine roar.** A looping noise buffer through a low-pass filter whose
  gain and cutoff follow the throttle. In the C64 mode the filter is resonant,
  a nod to the SID's filter; in the 800XL mode it is raw, as POKEY's noise
  distortions were. Neither chip is emulated.
- **The vector skyline.** Stroked lines, one logical pixel wide, over the field
  blue. On the real machines a "vector" lander on a raster screen was a
  line-drawing routine in BASIC or machine code; here it is a canvas polyline.
- **The instruments.** ALT, HS, VS and FUEL in 3x5 digits, the text-game
  readout kept on screen, with a red warning when a number would not survive
  a landing.

## Rules as built

Gravity 18 units/s² times the mood's speed response, thrust 46 along the ship's
axis, side jets at 2.2 rad/s to a cap of 1.2 rad, fuel 1200 on PLAY and 900 on
RUSH (unlimited on CALM), the engine burning 14 a second. A landing is safe on a
pad with both feet, under 24 units/s down, under 14 sideways, within 0.24 rad of
level. Score is multiplier times 50, plus 25 for a soft touch, plus fuel left
over ten; a landing refunds 100 fuel per multiplier. RUSH adds a crosswind of
2.5 to 6.5 units/s² and the 5x pad; DRIFT softens gravity and widens pads.
All of it is in `src/lib/soft-landing` with tests in `tests/soft-landing.test.mjs`.

## Sources checked 2026-10-22

- https://en.wikipedia.org/wiki/Lunar_Lander_(1979_video_game)
- https://en.wikipedia.org/wiki/Lunar_Lander_(video_game_genre)
- https://en.wikipedia.org/wiki/Lunar_Lander_(1980_video_game)
- https://en.wikipedia.org/wiki/Jupiter_Lander
- https://www.arcade-history.com/game/1417/lunar-lander
- https://www.cs.brandeis.edu/~storer/LunarLander/LunarLander.html
- https://www.technologizer.com/2009/07/19/lunar-lander
- https://www.mobygames.com/game/8786/jupiter-lander
- https://c64-wiki.com/wiki/Jupiter_Lander
