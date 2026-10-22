# Tideline research note: Pong and Video Olympics

Filed 2026-10-22 by Claude Code for Michael Hoydich's games brief, thread 1
of 5 after Breakwater. This note records what Tideline borrows from the
1972 arcade Pong and the 1977 Atari 2600 cartridge Video Olympics, and where
each fact came from. Facts were checked by web search on 2026-10-22 (the
search summaries drew mostly on Wikipedia and its mirrors plus the secondary
histories listed below; the Wikipedia pages themselves could not be fetched
from this session's network, so the search summaries were the source).
Anything marked *from memory* was not independently verified in this
session and should be treated as background, not as a citation.

## Pong (Atari, 1972)

**Origin.** Allan Alcorn built Pong as a training exercise set by Nolan
Bushnell, drawing on the table-tennis game of the Magnavox Odyssey. The
cabinet's first location test was at Andy Capp's Tavern in Sunnyvale in
1972 (*the tavern detail is from memory*).

**The eight segments.** The paddle was divided into eight zones that
decided the return angle: the centre segments send the ball back at 90
degrees to the paddle and the outer segments send it off at shallower
angles. Tideline keeps exactly this rule. `SEGMENT_ANGLES` in
`src/lib/tideline/physics.mjs` lists eight angles off the vertical, from
14 degrees in the middle to 58 degrees at the edges, symmetric left and
right; `segmentOf(rel)` picks the segment from where the ball meets the
paddle.

**Speed.** The ball sped up the longer it stayed in play, and a miss reset
it. Sources word the trigger differently (time in play versus the count of
returns); Tideline uses the count of returns: `rallySpeed(volleys)` adds a
fixed step per volley from a base of 138 logical pixels per second to a cap
of 330, and every point resets it. The mood response multiplies on top.

**The glitch.** The paddles could not reach the top of the screen, a
circuit quirk Alcorn kept because it made the game harder. One analysis
attributes it to non-ideal behaviour of the 555 timer that set each paddle's
position from its potentiometer. Tideline does not reproduce it; the mood
model and the house's skill curve carry the difficulty instead.

**Sound.** Alcorn was asked for realistic sounds and found that the
cabinet's sync generator could produce usable tones, so he piped those out,
by his own account a couple of hours of work. The exact frequencies often
quoted for the hit, wall and score tones were not confirmed by any source
found this session, so Tideline's three sounds are square-wave stand-ins
tuned by ear: a short mid tone for the paddle pok, a lower blip for the
wall, a longer tone for a point. Nothing is sampled.

**Score.** *From memory:* the arcade cabinet's attract text read "Avoid
missing ball for high score" and a game went to 11 points. Tideline plays
to 11, with the serve alternating every point. On the CALM dial the game
never ends and the two-digit display wraps at 99 like a counter.

**Home Pong.** *From memory:* Atari's Home Pong was sold through Sears in
1975 under the Tele-Games name and is the bridge from the cabinet to the
2600 cartridge below.

## Video Olympics (Atari 2600, 1977)

**Basics.** Programmed by Joe Decuir and published by Atari as one of the
nine launch titles for the Atari 2600 in 1977 (Wikipedia gives September;
other listings give October for North America). The cartridge is
Pong-family games for the paddle controllers; two to four players, with a
second pair of paddles for three or four.

**How many games.** Sources disagree because they count differently:
Wikipedia says 50 games and variations, StrategyWiki eight sports,
arcade-history ten bat-and-ball games. The variations include Pong,
Super Pong, Soccer, Foozpong, Hockey, Quadrapong, Handball, Volleyball and
Basketball (*the game list is from memory*).

**Robot Pong.** Giant Bomb notes a single-player "Robot Pong" mode as an
early example of a computer opponent. Tideline's house paddle is that idea
rebuilt: it predicts where the ball will cross its line with wall bounces
folded in (`predictX`), and its speed, reach and aim error come from a
skill number the mood sets (`houseSkill`, `houseTraits`,
`stepHouse` in `src/lib/tideline/rules.mjs`). The miss is decided once per
approach so it reads as a judgement, not a tremor.

**Score digits.** No source found this session described the score display
in detail; the big two-digit scores at the top are drawn *from memory* of
the 2600's bat-and-ball games, where each side's score sits over its half
of the field in large blocky digits. Tideline draws them at five times the
shared 3x5 font, yours left and the house's right, and uses the 2600's
paddle-controller framing in the manual only as a tribute.

## What the game does with all this

| Element | Source | Tideline |
| --- | --- | --- |
| Return angle | eight paddle segments, 1972 cabinet | `SEGMENT_ANGLES`, 14 to 58 degrees off vertical |
| Speed | rises in play, resets on a miss | base 138 + 8 per volley, cap 330, reset each point |
| Score | to 11 | `WIN_SCORE = 11`, serve alternates, CALM never ends |
| Sound | sync-generator tones | square waves: pok, wall blip, point tone |
| Opponent | Robot Pong | predictive house with mood-set skill |
| Orientation | horizontal table | portrait: house above, you below, for a phone |
| Palette and font | Breakwater's two machines | `MACHINES.xl`, `MACHINES.c64`, the shared 3x5 font |

Shared with Breakwater: the 288-wide logical field, the bar and readout
chrome, the boot screens, the four-state mood model and the CALM/PLAY/RUSH
dial. Mood mapping: `paddle` is your return, `brick` is a point won, `loss`
is a point lost, `wave` is a game won.

## Sources

Checked by web search on 2026-10-22:

- Pong (Wikipedia): https://en.wikipedia.org/wiki/Pong
- Bespoke Arcades, "Pong – Early Arcade History 1972": https://www.bespoke-arcades.co.uk/blog/pong-1972
- Vintage Computing and Gaming, "The Making of Pong" (2012): https://www.vintagecomputing.com/index.php/archives/3183/vcg-anthology-the-making-of-pong-2012
- IEEE Spectrum, Al Alcorn on early home computer color: https://spectrum.ieee.org/al-alcorn-creator-of-pong-explains-how-early-home-computers-owe-their-color-to-this-one-cheap-sleazy-trick
- Falstad, Pong paddle circuit analysis: https://www.falstad.com/pong/paddle1.html
- AtariAge blog, "Serve Timer": https://forums.atariage.com/blogs/entry/1830-serve-timer/
- Paleotronic, "Pong: or, how I learned to love getting paddled": https://paleotronic.com/2018/11/24/pong-or-how-i-learned-to-love-getting-paddled/
- Video Olympics (Wikipedia): https://en.wikipedia.org/wiki/Video_Olympics
- Video Olympics (StrategyWiki): https://www.strategywiki.org/wiki/Video_Olympics
- Video Olympics, Model CX2621 (arcade-history): https://www.arcade-history.com/game/51176/video-olympics-model-cx2621
- Video Olympics (Giant Bomb): https://giantbomb.com/wiki/Games/Video_Olympics
