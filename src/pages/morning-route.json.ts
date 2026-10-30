/**
 * /morning-route.json - machine-readable manifest for Morning Route, the
 * Paperboy-style paper-route game on PointCast's Cabinet Row.
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { W, DAYS, HOUSES_PER_DAY, PAPERS_START, PAPERS_MAX, BUNDLE_PAPERS, RIDERS_START, SCORE, MOOD_FOR_EVENT, HAZARDS } from '../lib/morning-route/route.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Morning Route',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/morning-route',
  image: 'https://pointcast.xyz/images/morning-route/og.png',
  intent: 'A paper-route arcade game with 1980s innocence: an El Segundo street at 6:45 AM, when the PointCast Morning Edition comes out, a bag of papers, lit porches and dark ones, and a street that answers your mood.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, joy of the compute and flow, mood state symbiosis, mobile and full screen, audio visual multimedia, Atari and Commodore inspired style modern; then "set up 5 new threads to create more" and "keep going". Morning Route is one of the five wave-two threads on Cabinet Row.',
  after: { title: 'Paperboy', maker: 'Atari Games', year: 1985, note: 'Inspired by the idea only. No characters, names, sprites, music or text from the original are used.' },
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, rect-drawn sprites and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Machine names are referenced as tributes.',
  },
  game: {
    genre: 'paper-route arcade',
    field: { width: W, height: '384 to 480, portrait', scroll: 'the street scrolls down the field while the rider moves up it' },
    street: 'Road on the left, curb, sidewalk, then lawns and houses on the right. Subscribers have lit windows, a lit porch and a mailbox; non-subscribers are dark.',
    day: { houses: HOUSES_PER_DAY, days: DAYS, papersAtStart: PAPERS_START, papersMax: PAPERS_MAX, bundle: BUNDLE_PAPERS, note: 'Between 8 and 12 subscribers a day. A week loops, a little faster each time.' },
    scoring: { porch: SCORE.porch, mailbox: SCORE.mailbox, star: SCORE.star, bundle: SCORE.bundle, perfectDay: `${SCORE.perfect} + ${SCORE.perfectPerDay} per day number`, miss: 'a paper on a non-subscriber house or porch scores nothing and counts as a miss' },
    riders: RIDERS_START,
    extraRider: 'A perfect day (every subscriber delivered) earns an extra rider on PLAY and RUSH.',
    obstacles: HAZARDS,
    obstaclesNote: 'Gentle: sprinklers that come and go, trash bins, a friendly dog that just sits in the way, a car backing out of its driveway, skateboarders rolling down the road. A bump is a fall; the rider gets up after a moment.',
    reportCard: 'Each day ends with a report card in the 3x5 pixel font: delivered, porches, mailboxes, misses, crashes, stars, bonus, score and a grade from A+ to D.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    events: MOOD_FOR_EVENT,
    meaning: {
      DAWN: 'warming up: dewy lawns, bouncy major tune, targets slightly larger',
      FLOW: 'five porches in a row without a fall: bright lawns, the music opens up',
      RUSH: 'high energy: faster street, tighter targets, raster bars, a short bonus ramp lane with stars to catch in the air',
      DRIFT: 'after a crash: slower street, wider gaps between obstacles, sooner bundles, larger targets, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, crashesEndRoute: !d.unlimitedBalls })),
      note: 'The dial sets the baseline the game relaxes toward. CALM never ends the route.',
    },
    gameSide: ['street speed', 'obstacle spacing', 'target size (generosity)', 'bundle spacing', 'music tempo and scale', 'palette', 'particle density', 'raster bars', 'ramp lane'],
    memory: 'The session mood tape and the last energy are kept in this browser (localStorage morning-route:v1). After a ride, the current label is written to the sitewide pc:mood key so the town and Cabinet Row carry it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime, started by the first tap or key',
    music: 'A generated oom-pah bass and a two-phrase square-wave tune over a four-chord loop; tempo and scale follow the mood.',
    sfx: 'Throw whoosh, porch thump, a two-note bell for a mailbox, a buzz for a miss, a rising run for a bundle, a honk for a car, a friendly arf, a tumble for a fall, a fanfare for a finished day.',
  },
  controls: {
    touch: 'Drag anywhere to steer; drag up to speed up, down to slow down; tap the right half of the field to throw. Two thumbs work.',
    keyboard: 'Left/Right or A/D steer, Up/Down or W/S speed, Space throws, P pauses, F full screen, M sound, C scanlines, 1 and 2 switch machines, 3 turns the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference stills the border, the sprinkler sweep and the blinking prompts and softens flashes', 'a polite live region announces deliveries, falls and report cards', 'no sound is required to play'],
  caveats: ['Scores, settings and the mood tape are browser-local only.', 'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.'],
  links: {
    human: 'https://pointcast.xyz/morning-route',
    json: 'https://pointcast.xyz/morning-route.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-morning-route-notes.md',
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
