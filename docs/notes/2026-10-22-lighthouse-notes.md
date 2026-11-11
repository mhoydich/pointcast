# Lighthouse research note: Simon (1978)

Filed 2026-10-22 by Claude Code for Lighthouse, a wave-two game in the
Breakwater family directed by Michael Hoydich. This note records what the game
borrows from Simon and where each fact came from. Facts were checked by web
search on 2026-10-22; direct page fetches failed in this session (DNS blocked),
so citations are to search results that quoted the pages. Anything marked
*from memory* was not independently verified and should be treated as
background, not as a citation.

## The machine

**Who and when.** Simon is an electronic memory game invented by Ralph H. Baer
and Howard J. Morrison, working with the toy firm Marvin Glass and Associates,
with software by Lenny Cope. Milton Bradley released it in 1978 and launched it
at Studio 54 on May 15, 1978, with a giant replica over the dance floor. Baer,
Morrison and Cope received a U.S. patent in 1980. The prototype was a
rectangular box; the saucer shape came later. A 1978 unit is in the
Smithsonian's National Museum of American History. (Wikipedia, Smithsonian,
IEEE Spectrum, MeTV.)

**Where it came from.** Baer and Morrison saw Atari's coin-op *Touch Me* at a
1976 trade show, disliked its harsh sounds, and built a version with more
pleasing tones. One student project page calls the coin-op "Follow-Me"; the
other sources say Touch Me, and "Follow Me" appears to have been Simon's own
working title. (Wikipedia, Smithsonian Magazine, PDX student page.)

**The tones.** The sources agree the tones were chosen after a bugle, which
plays only a few notes, but disagree on the notes themselves. One account
(via Wikipedia) gives an A major triad: blue E, yellow C sharp, red A, and
green the E an octave below blue. A reverse-engineering write-up lists
G, C, E, G instead and is vaguer about its own sources. Lighthouse follows the
brief and the first account: E3, A3, C sharp 4 and E4, square waves on the
800XL and triangle waves on the C64, synthesized at runtime.

**The speed rule.** The 1978 Milton Bradley manual (hosted by Hasbro) says that
after the 5th, 9th and 13th signals in a sequence, Simon automatically
increases the tempo; a memory-forum post repeats the same thresholds. The
reverse-engineering page gives tone durations by sequence length with
slightly different breakpoints (1-5, 6-13, 14-31). Lighthouse uses the
manual's 5, 9 and 13: seconds per flash 0.46, 0.34, 0.26 and 0.20, before
the mood stretches or squeezes them.

**The miss.** *From memory:* a wrong button or about three seconds without a
press ends the game with a low "razz" tone, and the original lights the button
that was due. Game 1 is won by repeating 31 signals. Lighthouse keeps a
three-second base window (bent by the mood: longer in DRIFT and DAWN, shorter
in RUSH, a little longer on CALM), a low buzz from two detuned squares near
43 Hz, and a blink on the due lamp. It does not stop at 31.

## What Lighthouse changes

- The quadrants turn 45 degrees so the lamps face north, east, south and west,
  which lets the arrow keys, W D S A and 1 to 4 name them.
- The colors are the machine palette's four bands from Breakwater (green, red,
  yellow, orange) rather than Simon's blue; every lamp is also a position and a
  tone, so the game never depends on telling colors apart.
- The shared mood model drives the timing. Each correct press is `paddle`,
  each finished sequence `brick`, every eighth step `wave`, a miss `loss`.
- CALM never ends the game: a miss replays the same sequence.
- FREE play turns the lens into a four-note instrument, the way people played
  Simon's buttons before starting a game.

## Sources checked this session

- Simon (game), Wikipedia: https://en.wikipedia.org/wiki/Simon_(game)
- Simon Electronic Game, 1978, Smithsonian NMAH: https://www.si.edu/object/nmah_1302005
- Not So Simple Simon, Smithsonian Magazine: https://www.smithsonianmag.com/smithsonian-institution/not-so-simple-simon-proved-young-were-swifter-than-old-180953561/
- Simon history, IEEE Spectrum: https://spectrum.ieee.org/simon-game
- 40 years ago Milton Bradley launched Simon at Studio 54, MeTV: https://metv.com/stories/40-years-ago-today-milton-bradley-launched-its-classic-simon-game-at-studio-54
- Simon 1978 manual, Hasbro: https://www.hasbro.com/common/documents/3f4e2ca0206011ddbd0b0800200c9a66/620962835056900B10D1688756D7BA4A.pdf
- Reverse Engineering an MB Electronic Simon Game, Waiting for Friday: https://www.waitingforfriday.com/?p=586
- Simon hand-held memory game, PDX student project: https://web.pdx.edu/~kherb2/project2-simon-game
- Simon score thread, Art of Memory forum: https://forum.artofmemory.com/t/whats-your-score-on-simon-memory-game/81394
