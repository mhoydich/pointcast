# Breakwater research note: Commodore 64 and Atari 800XL

Filed 2026-10-22 by Claude Code for Michael Hoydich's Breakwater brief
("atari commodore inspired style modern", "research commodore 64, atari
800xl"). This note records what the game borrows from each machine and
where each fact came from. Hardware figures were checked by web search on
2026-10-22; anything marked *from memory* was not independently verified in
this session and should be treated as background, not as a citation.

## Commodore 64 (1982)

**Video.** The VIC-II chip has a fixed 16-color palette. The C64-Wiki color
page gives, among others, black `#000000`, white `#FFFFFF`, red `#880000`,
cyan `#AAFFEE` and light grey `#BBBBBB` (the bright "VICE default" values).
The power-on screen is the blue background with a light-blue border and
light-blue text, the `READY.` prompt and the blinking block cursor. Modern
"accurate" palettes (Pepto / Colodore) render that blue as roughly
`#3E31A2` and the light blue as roughly `#7C70DA`; Breakwater's C64 mode
uses those two because they read as the machine on a modern display and
sit well behind bricks. *From memory:* 320×200 hi-res, 160×200 multicolor,
eight hardware sprites, raster interrupts, which is why demo-scene raster
bars and fast-loader border stripes are a C64 signature; the game's RUSH
mood paints scrolling bars in the border and the wave reload flickers the
border like a turbo loader.

**Sound.** The MOS 6581 SID has three voices, each with its own oscillator
and its own ADSR envelope generator. Waveforms per voice: triangle,
sawtooth, variable-width pulse and noise, with combined waveforms possible
when several are selected. A shared filter offers low-pass, band-pass and
high-pass outputs, and the chip supports ring modulation and oscillator
sync. The later 8580 revision differs mainly in filter behavior and
combined-waveform results. Breakwater's C64 mode sends every voice through
a resonant low-pass sweep (frequency falling across the note) and uses a
triangle bass under a pulse lead, a small nod to that filter.

**Text and boot.** The famous banner is `**** COMMODORE 64 BASIC V2 ****`
followed by `64K RAM SYSTEM  38911 BASIC BYTES FREE` and `READY.`, then a
typed `LOAD"NAME",8,1` and `RUN` (device 8 is the 1541 disk drive). The game
boots with `**** POINTCAST 64 BASIC V2 ****` and the same shape of lines:
a tribute with PointCast wording, not a copy of the ROM text.

**Breakout on the C64.** *From memory:* Arkanoid (Imagine, 1987), Krakout
(Gremlin, 1987) and Traz are the well-known block breakers on the machine.
Breakwater does not borrow art or sound from any of them.

## Atari 800XL (1983)

**Machine.** MOS 6502C at 1.79 MHz NTSC (1.77 MHz PAL), 64 KB RAM, with the
custom chips ANTIC (display lists and video), GTIA (color output and
player/missile graphics) and POKEY (sound, keyboard, paddles and serial
I/O). Sources differ on the ROM split (16 KB OS plus 8 KB BASIC, or 16 KB
plus 4 KB) and on production years (1983 is the commonly given launch,
with some sources listing 1982 to 1985). Atari BASIC is built in, so the
machine powers up to a `READY` prompt.

**Color.** The GTIA palette is 16 hues by 16 luminance steps, usually
quoted as 256 colors, with 128 distinct luminances in practice because
consecutive luminance pairs render the same. Maximum resolution 320×192;
the 800XL added graphics modes over the 800 (16 versus 12).

**Graphics 0, the default text mode.** Atari 8-bit machines power up in
Graphics 0. A Hi-Res magazine article from November 1983 describes the
startup screen as a blue background, light-blue letters and a black
border; default colors are loaded into the color registers at power-on and
on every GRAPHICS command. Breakwater's 800XL mode is exactly that trio:
blue field `#2545A8`, light-blue text `#A9B9F5`, black border.

**Sound.** POKEY provides four voices. *From memory:* each voice has an
8-bit frequency divider and a distortion setting drawn from polynomial
counters, which is where the buzzy, slightly noisy Atari timbre comes from;
POKEY also reads the paddle potentiometers, so a paddle controller is the
native breakout control on this machine. Breakwater's 800XL mode keeps raw
square waves with a short noise burst on each brick, a stand-in for that
distortion.

**Why it matters here.** Mike's own history is on the Atari side: Death
Star BBS ran on an Atari 130XE, the 800XL's sibling, documented at
`/atari-bbs`. The 800XL is the default machine in Breakwater for that
reason, with the C64 one tap away.

## Breakout itself

Breakout (Atari, released 13 May 1976) was designed by Steve Wozniak from
concepts by Nolan Bushnell and Steve Bristow, influenced by Pong. The wall
is eight rows of bricks in four colors, two rows each; from the bottom,
yellow, green, orange, red, scoring 1, 3, 5 and 7 points. Ball speed steps
up after four hits, after twelve hits, and on contact with the orange and
red rows; the paddle halves after the ball breaks through to the top wall.
Three turns to clear two screens; maximum 896 points. Super Breakout (1978)
added multiple balls and game variations. Breakwater keeps the row colors,
the point values and the speed rule, skips the paddle halving (the mood
model handles difficulty instead), and borrows the second-ball idea for its
RUSH state.

## What the game does with all this

| Element | 800XL mode | C64 mode |
| --- | --- | --- |
| Field / border / text | blue / black / light blue | blue / light blue / light blue |
| Boot | `READY`, `RUN "D:BREAKWATER"`, SIO-style beeps | `**** POINTCAST 64 BASIC V2 ****`, `LOAD"BREAKWATER",8,1`, border stripes |
| Lead voice | square, 4-cent detune, noise bite on bricks | square through a resonant low-pass sweep |
| Bass | square | triangle |
| Nameplate wave | spells `XL` | spells `64` |

Shared: a 3×5 pixel font written for the page, 14×8 bricks, the arcade's
scoring and speed rule, scanline overlay (switchable), raster bars by mood.

## Sources

- MOS Technology VIC-II: https://en.wikipedia.org/wiki/MOS_Technology_VIC-II
- C64-Wiki, Color: https://www.c64-wiki.com/wiki/color
- MOS Technology 6581 (SID): https://en.wikipedia.org/wiki/MOS_Technology_6581
- All About Circuits on the SID: https://www.allaboutcircuits.com/news/the-mos-6581-sid-giving-the-commodore-64-its-voice/
- Atari 800XL technical page: https://gury.atari8.info/tech/atari800xl.php
- Atari 800XL at valoroso.it: https://valoroso.it/en/atari-800xl
- Atari 800XL at computersmuseum.com: https://computersmuseum.com/?p=4183
- 8bitworkshop Atari 8-bit platform notes: https://8bitworkshop.com/docs/platforms/atari8/index.html
- Hi-Res, November 1983, "Graphic Evidence": https://www.atarimagazines.com/hi-res/v1n1/graphicevidence.php
- Antic, April 1987, new owners guide: https://atarimagazines.com/v5n12/NewOwners.php
- A.N.A.L.O.G. issue 69, color registers: https://atarimagazines.com/analog/issue69/color_set.php
- Breakout (video game): https://en.wikipedia.org/wiki/Breakout_(video_game)
- Super Breakout at StrategyWiki: https://strategywiki.org/wiki/Super_Breakout
