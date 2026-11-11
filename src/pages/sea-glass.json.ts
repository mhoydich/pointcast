/**
 * /sea-glass.json - machine-readable manifest for Sea Glass, the cube-hopping
 * pyramid game on PointCast's Cabinet Row, after Gottlieb's 1982 Q*bert.
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { ROWS, CUBES, DIRS, KEYMAP, RULES, POINTS, EXTRA_EVERY, ruleFor } from '../lib/sea-glass/pyramid.mjs';

const schedule = (dial: string) => Array.from({ length: 12 }, (_, n) => ruleFor(n, dial));

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Sea Glass',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/sea-glass',
  image: 'https://pointcast.xyz/images/sea-glass/og.png',
  intent: 'A cube-hopping pyramid game with 1980s innocence: a hermit crab turns every cube from sand to sea glass while the game and the player keep a mood together.',
  direction: 'Brief by Michael Hoydich, 2026-10-22, for the PointCast games: "80s innocence, joy of the compute and flow, mood state symbiosis, mobile and full screen, audio visual multimedia, Atari and Commodore inspired style modern", then "set up 5 new threads to create more" and "keep going". Sea Glass is one of the five wave-two threads.',
  after: { title: 'Q*bert', maker: 'Gottlieb', year: 1982, designers: ['Warren Davis', 'Jeff Lee'], note: 'Mechanics only. No character, speech balloon, sprite or art from the original is used.' },
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, sprites, and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Game and machine names are referenced as history and tribute.',
  },
  game: {
    genre: 'action puzzle / cube hopper',
    field: { width: 288, height: '384 to 480 (taller on tall phones)', rows: ROWS, cubes: CUBES, projection: 'isometric, 2:1' },
    hops: Object.values(DIRS).map((d) => ({ id: d.id, label: d.label, rowStep: d.dr, columnStep: d.dc })),
    rules: Object.values(RULES).map((r) => ({ id: r.id, label: r.label, landingsPerCube: r.target, landingOnFinishedRevertsIt: r.revert })),
    schedule: { play: schedule('play'), rush: schedule('rush'), note: 'Pyramid n (0-based) plays this rule. CALM follows PLAY; RUSH brings two landings and toggling sooner.' },
    scoring: { ...POINTS, note: 'frost is the step between sand and glass on TWO HOPS pyramids; clear is 1000 plus clearStep per previous pyramid (up to eight); buoyLeft per unused lifebuoy at a clear; lure for drawing the gull off the edge.' },
    lives: 3,
    extraCrabEvery: EXTRA_EVERY,
    hazards: {
      bubble: 'Drops in at the second row and bounces down at random until it rolls off the bottom. Touching one costs a crab.',
      gull: 'Drops in later and hops toward the crab. Touching it costs a crab. Ride a lifebuoy with the gull close behind and it follows you off the edge.',
      falls: 'Hopping off the pyramid costs a crab, unless a lifebuoy floats at that spot.',
    },
    lifebuoys: 'Two per pyramid, one on each side, reached by an up hop off the edge; each carries the crab back to the top once.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    events: { paddle: 'each cube turned toward its target', brick: 'each full row finished', loss: 'a fall or a hazard', wave: 'a pyramid cleared' },
    meaning: {
      DAWN: 'warming up: cool sea glass, slow major arpeggio, a little more room between bubbles',
      FLOW: 'a run of cubes without a slip: brighter glass, the music opens up',
      RUSH: 'high energy: hot palette, raster bars, faster tempo and hazards, one more bubble in a long run',
      DRIFT: 'after losses: slower hazards, the gull flies away and stays away, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, noGameOver: d.unlimitedBalls })),
      note: 'CALM has no game over: a fall puts the crab back on top. RUSH adds a bubble and brings the two-landing rule sooner.',
    },
    gameSide: ['hazard speed', 'spawn generosity', 'gull present or gone', 'bubble count', 'music tempo and scale', 'palette temperature', 'particle density', 'raster bars'],
    memory: 'The session mood tape and the last energy are kept in this browser under sea-glass:v1. After a game was played, leaving writes the current label to the sitewide pc:mood key (chill, flow, hype, quiet) so Cabinet Row and the town carry it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, sand: m.bands.yellow, glass: [m.bands.green, m.raster[4]] })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime, started on the first tap or key',
    sfx: 'Each cube rings a pentatonic note that climbs as the pyramid fills; a finished row plays a chord; a fall is a long falling whistle and a splash; bubbles plip as they bounce; the gull calls twice when it arrives; a lifebuoy plays a rising run.',
    music: 'A generative arpeggiator over a four-chord loop whose tempo and scale follow the mood. The C64 mode adds a resonant low-pass sweep in the SID spirit; the 800XL mode keeps raw squares with a noise bite, in the POKEY spirit.',
  },
  controls: {
    touch: 'Tap the quadrant of the field to hop that way (top-left = up-left, bottom-right = down-right). Hold to keep hopping.',
    keyboard: Object.entries(KEYMAP).map(([key, dir]) => `${key} = ${DIRS[dir].label}`).join(', ') + '. Arrows are turned 45 degrees, as the 1983 home ports turned the joystick. Space starts, P pauses, F full screen, M sound, C scanlines, 1 and 2 machines, 3 dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element, hidden where unsupported (iOS Safari).',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  storage: { key: 'sea-glass:v1', fields: ['best', 'machine', 'dial', 'sound', 'crt', 'mood'], readBy: 'https://pointcast.xyz/cabinet-row' },
  accessibility: ['CRT scanlines can be switched off', 'reduced motion stops scrolling and pulsing effects, keeps flashes faint and drops the screen shake', 'a polite live region announces pyramids, losses and bonuses', 'no sound is required to play'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of the original ROM text.',
  ],
  links: {
    human: 'https://pointcast.xyz/sea-glass',
    json: 'https://pointcast.xyz/sea-glass.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-sea-glass-notes.md',
    cabinetRow: 'https://pointcast.xyz/cabinet-row',
    breakwater: 'https://pointcast.xyz/breakwater',
    games: 'https://pointcast.xyz/games/',
    play: 'https://pointcast.xyz/play',
    pointcast: 'https://pointcast.xyz/',
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
