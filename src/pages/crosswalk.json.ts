/**
 * /crosswalk.json - machine-readable manifest for Crosswalk, the Frogger
 * for the El Segundo strand on PointCast (thread 4 of 5 after Breakwater).
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { W, H, COLS, ROWS, ROW_KINDS, TOWER_COLS, LANE_SPECS, VEHICLES, paceForStage } from '../lib/crosswalk/field.mjs';
import { SCORE, LIVES, DIAL_NOTES } from '../lib/crosswalk/rules.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Crosswalk',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/crosswalk',
  image: 'https://pointcast.xyz/images/crosswalk/og.png',
  intent: 'A lane-crossing arcade game in the shape of Frogger, set on a street in El Segundo: sidewalk, five lanes of traffic, median, bike path, sand, and four lifeguard towers to reach before the clock runs out, with a street that answers your mood.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired, rendered modern. Thread 4 of 5 sibling games after Breakwater.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art, and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Frogger (Konami, 1981; Sega/Gremlin in arcades) is referenced as the shape this tribute follows.',
  },
  game: {
    genre: 'lane crossing / Frogger-like',
    field: { width: W, height: H, columns: COLS, rows: ROWS, rowKinds: ROW_KINDS, towerColumns: TOWER_COLS },
    lanes: Object.values(LANE_SPECS).map((l) => ({ row: l.row, name: l.name, vehicle: VEHICLES[l.kind].name, direction: l.dir > 0 ? 'right' : 'left', speed: l.speed, slots: l.slots })),
    lanesNote: 'Speeds are logical pixels per second at stage 1 before the mood multiplier. Directions reverse on every odd stage.',
    scoring: { ...SCORE, rule: `${SCORE.hop} per new row reached; a tower pays ${SCORE.tower} plus ${SCORE.perSecond} per unused second; the beach ball adds ${SCORE.ball}; all four towers add ${SCORE.stage}.` },
    clock: { stage1Seconds: paceForStage(0).timer, perStage: 'two seconds shorter each stage, never under 18', moodNote: 'DRIFT lengthens the clock, RUSH shortens it a little.' },
    lives: LIVES,
    extraLifeEvery: SCORE.extraEvery,
    pace: [0, 1, 2, 3].map((s) => paceForStage(s)),
    hazards: ['hit by a vehicle', 'the clock runs out', 'hopping into the water between towers'],
    beachBall: 'On RUSH a beach ball appears on the sand; carry it to a tower for the bonus.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    events: { paddle: 'each safe hop forward', brick: 'each lane cleared', loss: 'a hit, a splash or a timeout', wave: 'all four towers filled' },
    meaning: {
      DAWN: 'warming up: cool palette, slow major arpeggio, an ordinary street',
      FLOW: 'a long run of safe hops: bright palette, the music opens up',
      RUSH: 'high energy: hot palette, raster bars, faster lanes, tighter gaps, beach ball on the sand',
      DRIFT: 'after hits: softened palette, thinner traffic, wider gaps, a longer clock, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, unlimitedLives: d.unlimitedBalls, note: DIAL_NOTES[d.id] })),
      note: 'The dial sets the baseline the game relaxes toward. Safe hops push energy up, hits pull calm down, time restores it. The model is shared with Breakwater unchanged.',
    },
    gameSide: ['lane speed', 'traffic density', 'crossing clock', 'music tempo and scale', 'palette temperature', 'particle density', 'raster bars', 'beach ball'],
    memory: 'The session mood tape and the last energy are kept in this browser under crosswalk:v1 and the next session starts most of the way back. On leaving after a game, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town carries it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, bands: m.bands })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime',
    voices: 'Square, triangle and sawtooth oscillators with short envelopes. The C64 mode adds a resonant low-pass sweep in the SID spirit; the 800XL mode keeps raw squares with a noise burst, in the POKEY spirit.',
    music: 'A generative arpeggiator with a walking bass over a four-chord loop. Tempo and scale follow the mood: major at DAWN, bright at FLOW, minor at RUSH, sparse at DRIFT.',
    sfx: 'A hop blip that rises with every row crossed, a two-tone horn on a hit, a splash, a three-beat timeout, a four-note fanfare at a tower, a longer run when all four fill.',
    startsOn: 'first tap or key, per browser autoplay rules',
    haptics: 'short vibration on forward hops, towers and hits where supported',
  },
  controls: {
    touch: 'Swipe anywhere on the field to hop in that direction, or tap above, below, left or right of the beach-goer.',
    keyboard: 'Arrows or W A S D hop, Space starts or resumes, P pauses, F toggles full screen, M toggles sound, C toggles the CRT overlay, 1 and 2 switch machines, 3 cycles the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference lowers particles and stops raster movement', 'a polite live region announces towers, hits and stages', 'no sound is required to play', 'touch hints say SWIPE or TAP, not key names'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of the original ROM text.',
    'El Segundo is the setting, not a map: the lanes are a cartoon of the street between the town and the sand.',
  ],
  links: {
    human: 'https://pointcast.xyz/crosswalk',
    json: 'https://pointcast.xyz/crosswalk.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-crosswalk-notes.md',
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
