# Driftwood research note: Asteroids and its home ports

Filed 2026-10-22 by Claude Code for Michael Hoydich's five-thread games
brief ("set up 5 new threads to create more", after Breakwater). Driftwood
is thread 5 of 5: Asteroids on the water. This note records what the game
borrows from the 1979 arcade original and what the home ports changed, and
where each fact came from. Facts were checked by web search on 2026-10-22;
the pages themselves could not be fetched from this session (DNS is denied
by the network policy), so each item rests on the search result snippets
for the source named. Anything marked *from memory* was not independently
checked and should be read as background, not as a citation.

## The arcade original (Atari, 1979)

**Credits.** Designed by Lyle Rains and Ed Logg, programmed by Logg; some
sources add Dominic Walsh as co-programmer or co-designer. The hardware
was developed by Wendi Allen (then Howard Delman) and had been used for
Lunar Lander before Asteroids, which is why those two games share a
sibling feel; Soft Landing, thread 3 of this row, is the Lunar Lander.
Asteroids became Atari's best-selling arcade game, with more than 70,000
cabinets sold.

**Display and field.** A vector display (the Digital Vector Generator), a
two-dimensional field that wraps around in both axes. The player's ship
turns, thrusts and fires; asteroids drift through; flying saucers, large
and small, cross and shoot back. Driftwood keeps the wrap on every edge,
the inertia with no friction, and the turn/thrust/fire control, and draws
everything as stroked outlines so a modern canvas reads as a vector tube.

**Scoring.** The arcade and the Atari 2600 and 7800 manuals agree on the
rock values: large 20, medium 50, small 100. Saucers are 200 (large) and
1,000 (small); the 7800 cartridge also lists 500 for another player's
ship and a bonus ship every 10,000 points, and the 2600 manual notes a
five-digit score that rolls over at 100,000. Driftwood keeps 20, 50 and
100 for the three log sizes, uses 200 for its one saucer stand-in, the
tide bird, adds 100 for a cleared field, and gives an extra boat every
2,000 points because its scores run lower than the arcade's.

**Difficulty.** Logg's account, paraphrased in secondary sources: as the
score climbs the saucer fires faster and more accurately up to a cap, and
past 40,000 only the small saucer appears. Driftwood has no counterfire;
its difficulty is the log count (four on the first field, one more each
field, capped) and the drift speed, with the mood adding logs on FLOW and
RUSH and slowing them on DRIFT.

**Sound.** The board had no sound chip. The soundtrack is a two-tone
electronic "heartbeat" that quickens as the asteroid density falls, with
thrust, fire, explosion and saucer effects alongside; one secondary source
says Allen wired thirteen effects by hand. Driftwood's heartbeat is two
alternating low notes a half-note apart in time, and the interval follows
the mood tempo rather than the log count, so the player's own state sets
the pace; the shot is a noise burst, the split a low filtered crunch, the
bird a warble.

**Asteroids Deluxe (1981).** *From memory:* the sequel added a shield in
place of hyperspace and a "killer satellite" that broke into pieces.
Driftwood has a shield (short at every field start and after a loss, four
seconds in DRIFT) and no hyperspace.

## Home ports

**Atari 2600 (1981).** Programmed by Brad Stewart. Early 1981 previews drew
a mixed reaction, so Atari developed bank switching, which let the console
treat the cartridge as two 4 KB banks for 8 KB in all; the Centre for
Computing History calls it the first Atari game to use the technique to
double the ROM. The vector look was out of reach, so the port is raster,
with the famous flicker; two cartridge revisions exist, one with a
copyright title screen that Stewart did not write. *From memory:* the
2600 version's rocks are solid colored blobs, and the flicker comes from
multiplexing the two hardware sprites across many objects.

**Atari 400/800 (1981), cartridge CXL4013.** Programmed by Tod Frye. A user
review on Atarimania notes that it does not recreate the arcade's vector
graphics and so has a different feel, and that it looks choppy. This is
the port Mike's own machine family would have played; Driftwood's 800XL
mode is the default for that reason, with the C64 one tap away.

**Atari 7800.** Developed by General Computer Corporation, listed as 1984
on the prototype page (where it was first called 3-D Asteroids), on sale
by 1987 to 1988: an A.N.A.L.O.G. review from April 1988 describes it as
raster rather than vector, with colorful shaded rocks. The 7800 manual
gives the same point values as the arcade plus the bonus ship at 10,000.

**Atari 5200.** A prototype exists (Hidden Palace lists it); the cartridge
was never released.

**Commodore 64.** No official Atari release: one review of a ZX81 clone
remarks that no home computer received an official port, which left the
field to small publishers. On the C64 the known ones are Rockball (Roklan,
1983, unreleased when Roklan collapsed, preserved later), an unofficial
Asteroids by Jesper Brinkkjaer and Tommy Tamsen (1984, rejected by Atari
and released by Tamsen almost forty years on), and Smasheroids (Scott
Elder, Loadstar #72, 1990). Driftwood borrows nothing from any of them;
the C64 mode is the machine's light blue on a night version of its blue
field, with the SID-spirit filter sweep from Breakwater.

## What the game does with all this

| Element | Arcade 1979 | Driftwood |
| --- | --- | --- |
| Field | vector, wraps both axes | 288-wide canvas, stroked outlines, wraps every edge |
| Rocks | three sizes, split in two | logs: jagged elongated polygons, big to medium to small |
| Points | 20 / 50 / 100, saucers 200 / 1,000 | 20 / 50 / 100, tide bird 200, field clear 100 |
| Ship | turn, thrust, fire, hyperspace, no friction | turn, push, fire, shield, no friction |
| Shots | limited on screen | five flares in the air, four a second |
| Sound | heartbeat quickens with density | heartbeat quickens with the mood tempo |
| Difficulty | saucer aim, rock count | log count and drift, steered by the mood |
| Lives | bonus ship at 10,000 | extra boat at 2,000; CALM has no game over |

Shared with Breakwater: the 3x5 pixel font, the two machine palettes and
boot screens, the mood model with its four labels and three-position dial,
the bar and readout chrome, and the engineering rules from its review
(gesture-gated audio, hidden-tab music stop, clamped scheduler, key
filtering, reduced motion, fixed readout height, fullscreen fallbacks,
held-input reset on blur).

## Sources

- Asteroids (video game), Wikipedia: https://en.wikipedia.org/wiki/Asteroids_(video_game)
- Arcade Blogger, "Atari Asteroids: Creating a Vector Arcade Classic": https://arcadeblogger.com/2018/10/24/atari-asteroids-creating-a-vector-arcade-classic/
- Asteroids at Giant Bomb (heartbeat, saucer behavior): https://giantbomb.com/wiki/Games/Asteroids
- Asteroids arcade edition at VideoGameGeek (heartbeat): https://videogamegeek.com/videogameversion/93775/arcade-edition
- Asteroids, Atari 2600 model CX2649 at Arcade History (point values): https://www.arcade-history.com/game/50217/asteroids-model-cx2649
- Asteroids, Atari 7800 model CX7802 at Arcade History (point values, bonus ship): https://www.arcade-history.com/game/50117/asteroids-model-cx7802
- Asteroids for Atari 2600 manual notes (score rollover): https://www.sentex.ca/~ajy/asteroids.html
- Asteroids for Atari 2600 at Retro Games Now (bank switching, Brad Stewart): https://www.retrogamesnow.co.uk/?p=494
- Asteroids at the Centre for Computing History (first bank-switched Atari game): https://www.computinghistory.org.uk/det/358/Asteroids/
- Asteroids 2600 at AtariProtos (two revisions, title screen): https://www.atariprotos.com/2600/software/asteroids/asteroids.htm
- Asteroids, Atari 400/800 at Atarimania (Tod Frye, CXL4013): https://www.atarimania.com/game-atari-400-800-xl-xe-asteroids_352.html
- Asteroids 7800 at AtariProtos (GCC, 1984, 3-D Asteroids): https://www.atariprotos.com/7800/software/asteroids/asteroids.htm
- A.N.A.L.O.G. issue 59, April 1988, 7800 Asteroids review: https://atarimagazines.com/analog/issue59/video_game_asteroids.php
- Atari 7800, Wikipedia (GCC, launch dates): https://en.wikipedia.org/wiki/Atari_7800
- Asteroids (Atari 5200 prototype) at Hidden Palace: https://hiddenpalace.org/Asteroids_(Atari_5200_prototype)
- Rockball (Roklan, C64) at Games That Weren't: https://gamesthatwerent.com/gtw64/rockball
- Asteroids by Brinkkjaer and Tamsen (C64, 1984) at Games That Weren't: https://gamesthatwerent.com/gtw64/asteroids
- Smasheroids (C64, Loadstar 1990) at LaunchBox: https://gamesdb.launchbox-app.com/games/details/150394-smasheroids
- Asteroids (ZX81 clone) at MobyGames, on the lack of official computer ports: https://www.mobygames.com/game/zx81/asteroids__/mobyrank
- Breakwater research note (the two machines): docs/notes/2026-10-22-breakwater-c64-atari-800xl.md
