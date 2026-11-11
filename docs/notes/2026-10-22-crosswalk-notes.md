# Crosswalk research note: Frogger and its home ports

Filed 2026-10-22 by Claude Code for Michael Hoydich's five-thread game
brief (thread 4 of 5, after Breakwater). This note records what Crosswalk
borrows from Frogger's shape and where each fact came from. Facts were
checked by web search on 2026-10-22; Wikipedia itself was not reachable
from the build container (its host is denied by the network policy), so
the Wikipedia points below come from search summaries of the article and
should be treated as secondary. Anything marked *from memory* was not
independently verified in this session.

## The 1981 arcade game

**Who made it.** Frogger was developed by Konami and published in arcades
by Sega/Gremlin in North America (Gremlin Industries had been acquired by
Sega in 1978 and traded as Sega/Gremlin afterward). Sega gained exclusive
worldwide manufacturing rights on July 22, 1981; one account says
Sega/Gremlin was wary of the title because an earlier in-house game called
*Frogs* had flopped. Konami took the license back in the mid-1990s.
Sources: Wikipedia's Frogger and Gremlin Industries articles via search,
[Sega Retro](https://segaretro.org/Frogger), [Arcade History (model
GX392)](https://www.arcade-history.com/game/879/frogger-model-gx392),
[Museum of the Game](https://arcade-museum.com/Videogame/frogger).

**The screen.** The lower half is a bi-directional flow of traffic across
five lanes; the upper half is a fast river of logs, turtles and
crocodiles, with otters and snakes as later hazards; five homes sit at the
top. Sources: Wikipedia via search, [All80s](https://www.all80s.co.uk/frogger),
[Exotica, Lost in Translation](https://www.exotica.org.uk/wiki/Lost_In_Translation/Frogger).

**The clock.** Sources disagree on how long a crossing gets: one says 30
seconds per frog, reset whenever a frog is lost or gets home; another
describes the limit as 60 "beats" on the on-screen timer. Crosswalk uses
30 seconds at stage 1, two seconds less per stage, never under 18.

**Scoring.** 10 points per forward hop; 50 for each frog that reaches a
home; 10 per remaining unit of time (Wikipedia says per unused half
second, Codex Gamicus per second); 200 for escorting the lady frog or
eating a fly; 1,000 for filling all five homes; a bonus frog at 20,000
(All80s says at 10K or 20K); the counter caps at 99,990. The game starts
with three, five or seven frogs depending on operator settings. Sources:
Wikipedia via search, [Codex Gamicus](https://gamicus.fandom.com/wiki/Frogger),
All80s, Exotica.

**Sound.** The opening tune is the first verse of the Japanese children's
song *Inu no Omawarisan* (The Dog Policeman); other in-game tunes quote
the anime themes *Hana no Ko Lunlun* and *Araiguma Rascal*, and the
American release adds *Yankee Doodle*. Crosswalk quotes none of them; its
music is an original arpeggiator shared in spirit with Breakwater, and
its hop, horn and fanfare are synthesized on the page.

## Home ports

Between 1982 and 1984 Frogger reached nearly every console and computer on
sale in North America, every port licensed by Sega. The rights were split:
Parker Brothers held the cartridge rights, Sierra On-Line the magnetic
media (cassette and disk) rights, and Sierra sublicensed to developers for
machines it did not usually support.

- **Atari 2600, Parker Brothers.** The best-known version; sold about four
  million cartridges and is among the best-selling 2600 games. Wikipedia's
  release table gives August 1982; StrategyWiki lists 1983.
- **Atari 2600, Starpath/Sierra.** A separate cassette release that needed
  the Starpath Supercharger, one of twelve games officially released in
  that format.
- **Commodore 64.** Both a Parker Brothers cartridge and a Sierra disk or
  cassette release, listed as 1983, and they differ from each other.
- **Atari 8-bit, Sierra, 1982.** StrategyWiki lists a 1982 Atari 8-bit
  release from Sierra; this is the port an 800XL owner would have run.
- **Sierra's other machines.** Apple II, IBM PC, Macintosh, TRS-80 and
  TRS-80 Color Computer.

Sources: Wikipedia via search, [StrategyWiki version
list](https://strategywiki.org/wiki/Frogger/Versions), Sega Retro,
[Pixelated Arcade on The Official Frogger](https://pixelatedarcade.com/product-reviews/the-official-frogger).

## What Crosswalk keeps and what it changes

- **Kept:** the hop grid, the traffic half with five lanes moving both ways
  at different speeds, a safe strip in the middle, homes at the top that
  each take one crossing, a per-crossing clock with a time bonus, points
  for each new row, a bonus carried item worth 200, and a stage bonus for
  filling every home.
- **Changed:** the river is gone. El Segundo's street ends at a bike path
  and the sand, so the upper half is two bike-path lanes, the sand (safe,
  where RUSH leaves a beach ball) and the water, where four lifeguard
  towers are the homes. Water between towers is a splash, in the spirit of
  the arcade's bank between homes. There are four homes, not five, so the
  towers fit the 12-column field at the same 288 width as Breakwater.
- **Mood.** The mood model is Breakwater's, imported unchanged. Each safe
  hop forward is a paddle event, each lane cleared a brick, a hit, splash
  or timeout a loss, four towers a wave. The response drives lane speed,
  traffic density (slots switch only while off screen), the clock, tempo,
  scale, palette and particles.
- **Art.** Every sprite is an 8x8 (the bus 16x8) grid of rects keyed to the
  machine palette, so nothing is traced from the arcade or any port, and
  the same pictures read as Atari or Commodore when the palette changes.
