# Sea Glass research note: Q*bert (Gottlieb, 1982)

Filed 2026-10-22 by Claude Code for the Sea Glass thread of Michael
Hoydich's PointCast games brief. This note records what Sea Glass borrows
from the 1982 arcade game, what it changes, and where each fact came from.
Facts were checked by web search on 2026-10-22 (the Wikipedia and StrategyWiki
pages themselves could not be fetched from this environment, so the search
summaries of those pages are the source). Anything marked *from memory* was
not independently verified in this session.

## The original

- **Maker and people.** Gottlieb (D. Gottlieb & Co., then a Columbia
  Pictures company) released Q*bert in 1982. Jeff Lee drew the character and
  the pyramid, inspired by M. C. Escher; Warren Davis developed and programmed
  the game. It was developed under the working name *Cubes*, and the
  color-changing tops came late: Ron Waxman, Gottlieb's vice president of
  engineering, suggested that landing on a cube should change its color.
- **The pyramid.** 28 cubes, drawn isometric, which is seven rows of one to
  seven. The player starts on top. Each stage ends when every top shows the
  target color. The game runs nine levels of four rounds.
- **Rules by level.** Level 1 changes a cube in one landing. Level 2 needs two
  landings, through an intermediate color. Level 3 changes a cube on every
  landing: jump on a finished cube and it goes back to the start color. Later
  levels combine the two. Scoring: 15 points for the intermediate color and
  25 for the target color, per the arcade guides and the Atari 5200 manual.
- **Hazards and helpers.** Red balls drop from the top and bounce down; Coily,
  the snake, chases the player; Slick and Sam turn cubes back; Ugg and
  Wrongway run along the cube sides. Flying discs at the pyramid's sides carry
  the player back to the top, and a Coily that follows the player off the edge
  falls. Jumping off the pyramid costs a life.
- **Controls.** A single four-way joystick mounted diagonally, rotated 45
  degrees by Davis, so each push is one of the four hops.
- **Home ports.** Parker Brothers published the 1983 home versions, among them
  the Atari 2600 (a six-row pyramid, without Ugg and Wrongway), the Commodore
  64 and the Atari 8-bit computers (a cartridge by Daniel Small). On those
  machines the player holds an ordinary joystick on the diagonal, and a 1984
  Electronic Games review called that out.

## What Sea Glass keeps

- 28 cubes in seven rows, isometric, diagonal hops only, the target-color goal.
- One landing, two landings through a middle step, and the toggle rule, in
  that order, and the 15 / 25 scoring.
- Something that falls down the pyramid at random (bubbles), something that
  chases (the gull), side platforms that return the player to the top
  (lifebuoys), and the lure: a chaser that follows the player off the edge.
- A clear bonus that grows with each pyramid, and a small bonus per unused side
  platform (*from memory* for the arcade; Sea Glass uses 1000 + 250 per
  pyramid and 50 per buoy).

## What Sea Glass changes

- Setting: the shore. A hermit crab, sand that becomes sea glass, bubbles, a
  gull and lifebuoys. Every sprite, sound and word is original; there is no
  Q*bert character, no speech balloon, no Coily, and no Gottlieb art.
- Controls: on touch, the quadrant of the field you tap is the direction; on a
  keyboard Q, E, A, D sit where the diagonals sit, and the arrows are turned 45
  degrees (up = up-right) the way a home joystick was held.
- Mood: the cabinet's shared model (DAWN, FLOW, RUSH, DRIFT). Each cube turned
  is a "paddle" event, each finished row a "brick", a fall or hazard a "loss",
  a cleared pyramid a "wave". DRIFT slows the hazards and sends the gull away;
  a RUSH dial adds a bubble and brings the two-landing pyramids sooner; CALM
  has no game over.
- No cube-reverting enemies and no side-runners: Sea Glass keeps one random
  hazard and one chaser so the board reads at phone size.

## Sources checked this session

- Wikipedia, "Q*bert": https://en.wikipedia.org/wiki/Q*bert
- StrategyWiki, "Q*bert/Gameplay": https://strategywiki.org/wiki/Q*bert/Gameplay
- Killer List of Videogames / Museum of the Game: https://www.arcade-museum.com/Videogame/q-bert
- Raspberry Pi / Wireframe 42, "Recreate Q*bert's cube-hopping action": https://www.raspberrypi.com/news/recreate-qberts-cube-hopping-action-wireframe-42/
- Atari 5200 Q*bert manual (scoring): https://archive.org/stream/Atari5200Manuals_201812/Q-bert%20%28USA%29_djvu.txt
- AtariAge, Atari 2600 Q*bert manual: https://atariage.com/2600/manuals_old/qbert.html
- Atarimania, Atari 8-bit Q*bert (Parker Brothers, 1983, Daniel Small): https://www.atarimania.com/game-atari-400-800-xl-xe-qbert_4204.html
- C64-Wiki, "Q*bert": https://www.c64-wiki.com/wiki/Q*bert

Related: [Breakwater's note on the two machines](2026-10-22-breakwater-c64-atari-800xl.md), and
[Cabinet Row](https://pointcast.xyz/cabinet-row), the lobby for every game in this family.
