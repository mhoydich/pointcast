/**
 * /breakwater.json - machine-readable manifest for Breakwater, the
 * Atari 800XL and Commodore 64 flavored breakout game on PointCast.
 */
import type { APIRoute } from 'astro';
import { MACHINES, PATTERNS, COLS, ROWS, BAND_POINTS } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Breakwater',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/breakwater',
  image: 'https://pointcast.xyz/images/breakwater/og.png',
  intent: 'A breakout-style arcade game with 1980s innocence: the joy of the compute, a wall that answers your mood, and two home-computer tributes to choose from.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, start with something very breakout, think through mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired, rendered modern.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art, and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Machine names are referenced as tributes.',
  },
  game: {
    genre: 'breakout / block breaker',
    field: { width: 288, height: 384, columns: COLS, rows: ROWS },
    scoring: { ...BAND_POINTS, rule: 'Two rows each of red, orange, green and yellow from the top, as in the 1976 arcade original.' },
    speedRule: 'Faster after the fourth and twelfth hit of a wave, and on first contact with the orange and red rows. The mood response multiplies on top.',
    balls: 3,
    extraBallEvery: 400,
    waves: PATTERNS,
    wavesNote: 'Patterns cycle; each cycle starts a little faster. The nameplate wave spells the chosen machine.',
    multiball: 'A second ball appears once per wave when the mood reads RUSH during a long rally.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    meaning: {
      DAWN: 'warming up: cool palette, slow major arpeggio, slightly wide paddle',
      FLOW: 'a long rally: bright palette, the music opens up, standard paddle',
      RUSH: 'high energy: hot palette, raster bars, faster tempo, second ball possible',
      DRIFT: 'after losses: softened palette, wider paddle, slower ball, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, unlimitedBalls: d.unlimitedBalls, note: d.blurb })),
      note: 'The dial sets the baseline the game relaxes toward. Rallies push energy up, lost balls pull calm down, time restores it.',
    },
    gameSide: ['ball speed', 'paddle width', 'music tempo and scale', 'palette temperature', 'particle density', 'raster bars', 'second ball'],
    memory: 'The session mood tape and the last energy are kept in this browser and the next session starts most of the way back. On leaving, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town carries it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, bands: m.bands })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime',
    voices: 'Square, triangle and sawtooth oscillators with short envelopes. The C64 mode adds a resonant low-pass sweep in the SID spirit; the 800XL mode keeps raw squares with a noise burst, in the POKEY spirit.',
    music: 'A generative 16th-note arpeggiator over a four-chord loop. Tempo and scale follow the mood: major at DAWN, lydian-bright at FLOW, minor at RUSH, sparse at DRIFT.',
    sfx: 'Each brick plays a pentatonic note by column, so clearing a row left to right plays a run. Paddle, wall, loss, wave-clear and extra-ball cues are separate voices.',
    startsOn: 'first tap or key, per browser autoplay rules',
    haptics: 'short vibration on brick hits and losses where supported',
  },
  controls: {
    pointer: 'Move the mouse or drag anywhere on the field to steer the paddle. Tap or click to launch.',
    keyboard: 'Left/Right or A/D steer, Space launches, P pauses, F toggles full screen, M toggles sound, C toggles the CRT overlay, 1 and 2 switch machines, 3 cycles the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference lowers particles and raster movement', 'a polite live region announces wave and ball events', 'no sound is required to play'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of the original ROM text.',
  ],
  links: {
    human: 'https://pointcast.xyz/breakwater',
    json: 'https://pointcast.xyz/breakwater.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-breakwater-c64-atari-800xl.md',
    atariMuseum: 'https://pointcast.xyz/atari-bbs',
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
