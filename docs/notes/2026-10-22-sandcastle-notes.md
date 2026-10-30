# Sandcastle research note: Missile Command (Atari, 1980)

Filed 2026-10-22 by Claude Code for Sandcastle, a wave-two Cabinet Row game
directed by Michael Hoydich. This note records what the game borrows from
the original and where each fact came from. Web searches were run on
2026-10-22; direct page fetches of Wikipedia and the 6502 disassembly site
failed from this environment (DNS), so facts below come from the search
results' summaries of those pages. Anything marked *single source* or *from
memory* should be treated as background, not as a citation.

## The original

**What it is.** Missile Command is a 1980 Atari arcade game designed by Dave
Theurer, who designed Tempest the following year. The player defends six
cities from incoming missiles by firing anti-ballistic missiles from three
bases. Sources disagree on the month: one gives June 1980, another July 1980
for North American arcades. (Wikipedia, arcade-history.com, Arcade Museum.)

**Layout.** Three bases (named Alpha, Delta and Omega) with six cities, three
on either side of the middle base. Home versions had fewer bases because of
hardware limits. (Wikipedia via search; Pixelated Arcade.)

**Controls.** A trackball moves a crosshair; three buttons fire from the left,
middle or right base. (Search summaries of the arcade-history and Arcade
Museum entries.) Sandcastle keeps that shape: a crosshair, Space for the
nearest brigade, and 1, 2 and 3 for the left, middle and right.

**Ammunition.** Ten anti-ballistic missiles per base per wave; a base hit by
an incoming missile loses its remaining stock for that wave and is useless
until the next one. (arcade-history.com, StrategyWiki.) Sandcastle: ten
handfuls of sand per brigade per round; a bucket reached by a wave line is
empty until the next round.

**Bonuses.** Bonus points for every city standing and every missile left at
the end of a wave. (StrategyWiki, arcade-history.) The per-unit values were
*not* confirmed by any source this session; Sandcastle's 100 per castle and 5
per handful are its own numbers.

**Multiplier.** Starts at 1x and rises by 1x every second level, to 6x, and
applies to both target and bonus values. (Wikipedia via search.) Sandcastle
uses the same rule.

**Bonus cities.** A city rebuilt every N points, where N is set by DIP
switches in the cabinet; 10,000 is the commonly cited default, though one
source mentions 10,000 or 12,000. (6502 disassembly project via search,
StrategyWiki.) Sandcastle rebuilds a castle every 10,000 points, placed at
the end of the round as in the original.

**Splitting and smart bombs.** Attack missiles can split into several
warheads (MIRVs) without warning; smart bombs can dodge explosions and have to
be hit directly or deluged. (Search summaries.) Sandcastle keeps the split
and, on RUSH only, a fast rogue wave in place of the smart bomb. It never
dodges: the game is meant to be innocent.

**Hardware.** A MOS 6502 at 1.25 MHz and one Atari POKEY for sound, mono.
(Pixelated Arcade tech specs, arcade-history.) That POKEY is the same family
of sound chip as the Atari 800XL's, which is why the 800XL mode's raw square
voices suit this cabinet.

**Explosions.** Defensive explosions grow, hold and shrink, and any incoming
missile whose head enters one is destroyed. *From memory*: the expanding and
contracting fireball and its color cycling are the most recognizable thing
on the screen. No source this session described the timing, so Sandcastle's
burst (0.5 s open, 0.25 s hold, 0.6 s close, 15 px radius on a 288 px field)
was tuned by play, not copied.

**Mood of the original.** One trivia source says the working title was
"Armageddon" and that the subject gave its designer stress dreams about cities
being destroyed (*single source*, a trivia site, not an interview). That is
the thing Sandcastle deliberately turns around: the cities are sandcastles,
the missiles are wave lines from the sea, and losing is a castle washed away.

## What Sandcastle does not take

No art, sound, code, ROM, text or name beyond the tribute in the notes. The
font, the beach, the castles, the music and the palettes are the Cabinet Row
family's own, from `src/lib/breakwater/`.

## Sources checked 2026-10-22

- Missile Command, Wikipedia: https://en.wikipedia.org/wiki/Missile_Command
- Missile Command, arcade-history.com: https://www.arcade-history.com/game/1644/missile-command
- Missile Command gameplay, StrategyWiki: https://strategywiki.org/wiki/Missile_Command/Gameplay
- Missile Command disassembly project: https://6502disassembly.com/va-missile-command/
- Missile Command, Pixelated Arcade: https://pixelatedarcade.com/games/missile-command and tech specs https://pixelatedarcade.com/games/missile-command/techspecs
- Missile Command, Museum of the Game: https://arcade-museum.com/Videogame/missile-command
- Arcade Nostalgia: Missile Command quiz, FunTrivia: https://www.funtrivia.com/quiz/videogames/arcade-nostalgia-missile-command-424003.html
