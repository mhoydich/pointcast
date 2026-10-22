# Low Tide research note: Kaboom! (Activision, 1981)

Filed 2026-10-22 by Claude Code for Low Tide, a wave-two game on Cabinet
Row, directed by Michael Hoydich. This note records what Low Tide takes from
Kaboom! and where each fact came from.

**How the sources were checked.** Facts below were checked by web search on
2026-10-22. This session's network policy blocked direct page fetches
(Wikipedia, StrategyWiki, TASVideos and vgpavilion all failed to resolve), so
the claims rest on the search engine's summaries of those pages, not on a
full reading. Anything marked *from memory* was not confirmed this session.

## The game

- **Publisher, year, platform.** Activision, 1981, for the Atari 2600. Based
  on Atari's 1978 arcade game Avalanche. (Wikipedia, Giant Bomb, Atarimania.)
- **Design.** Larry Kaplan designed it; David Crane drew the buckets and the
  bomber. Wikipedia says it was Kaplan's last Activision design before he
  left. (Wikipedia, Giant Bomb.)
- **Controller.** Paddle on the 2600. The Atari 5200 port uses the joystick.
  Absolute paddle control is why the 2600 game feels like Breakout. (Search
  summaries of Wikipedia and Giant Bomb.)

## The rules Low Tide keeps

- **Groups.** The 2600 manual lists eight bomb groups of 10, 20, 30, 40, 50,
  75, 100 and 150 bombs. Each bomb is worth its group number, 1 to 8 points.
  After group 8 every group falls at group 8's speed for group 8's points.
  (Kaboom! manual, mocagh.org PDF, via search summary.)
  *Low Tide:* waves of 10, 15, 20, 25, 30, 40, 50, then 60 shells, worth the
  wave number up to 8 each. The counts are shorter so a phone session ends in
  minutes; the sliding scale is the original's.
- **A miss.** A bomb that reaches the ground sets off every other bomb on
  screen, and the bottom bucket is lost. The game then drops back to the
  previous group, which falls a little slower. (Joystik, December 1982 review,
  and the Atari 5200 manual, via search summaries.)
  *Low Tide:* the tide washes away the missed shell and the rest of the wave,
  the bottom bucket goes, and the gull starts the previous wave again.
- **A bucket back.** Each 1000-point mark returns a bucket if fewer than three
  remain. The manual does not say this; the TASVideos submission notes for
  the 2600 maximum-score run do. (TASVideos #9076, via search summary.)
  *Low Tide:* the same rule.
- **Sound.** The 5200 and home-computer versions play the *1812 Overture*
  one note per catch. Search did not confirm how the 2600 cartridge's catch
  sound works. *From memory:* on the 2600 the catch tone climbs within a
  group. *Low Tide* synthesizes a rising pentatonic run per wave in the
  current mood's scale, which matches what the brief asked for whichever
  version it comes from.
- **Character.** The bomber frowns while bombs fall and grins when one gets
  past you; at 10,000 points he looks surprised. Activision sent a "Bucket
  Brigade" patch for a photo of 3,000 points or more. (Wikipedia and Giant
  Bomb, via search.) *Low Tide* has no bomber, no faces and no Activision
  names or art: a plain pixel gull drops shells.

## What Low Tide changes

- Bombs become shells and the explosion becomes a tide: the miss sound is
  low-passed noise that swells and recedes.
- The mood model shared by every cabinet decides pace: DRIFT (after a miss)
  slows the shells and widens the buckets; RUSH speeds the gull and adds a
  golden shell worth five times a catch; the CALM dial never takes a bucket
  and never ends the game.
- Two palettes from Breakwater's machines module (Atari 800XL, Commodore 64)
  with their own boot screens. Kaboom! was never a 2600 game in those blues;
  the palettes tie Low Tide to the rest of the row, not to the original.

## Sources checked by search, 2026-10-22

- Wikipedia, "Kaboom! (video game)": https://en.wikipedia.org/wiki/Kaboom!_(video_game)
- Giant Bomb, Kaboom!: https://www.giantbomb.com/kaboom/3030-9094/
- Atarimania, Kaboom! (Atari 2600, Activision, 1981): https://www.atarimania.com/games/atari-2600-games-kaboom-11611
- Kaboom! manual (PDF), Museum of Computer Adventure Game History: https://www.mocagh.org/forsale/kaboom-manual.pdf
- TASVideos submission #9076, A2600 Kaboom! "maximum score": https://tasvideos.org/9076S
- Joystik, December 1982, Kaboom! review: https://vgpavilion.com/mags/1982/12/joystik/kaboom
- Atari 5200 Kaboom! manual text, Internet Archive: https://archive.org/stream/Atari5200Manuals_201812/Kaboom%21%20%28USA%29_djvu.txt

Low Tide is at `/low-tide` and its cabinet is on [Cabinet Row](https://pointcast.xyz/cabinet-row).
