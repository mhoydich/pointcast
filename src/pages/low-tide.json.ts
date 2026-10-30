/**
 * /low-tide.json - machine-readable manifest for Low Tide, the Kaboom!-style
 * catching game on PointCast's Cabinet Row.
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { WAVE_COUNTS, MAX_BUCKETS, BUCKET_EVERY, GOLD_POINTS, W, H_MIN, H_MAX, waveSpec } from '../lib/low-tide/tide.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Low Tide',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/low-tide',
  image: 'https://pointcast.xyz/images/low-tide/og.png',
  intent: 'Kaboom! (Activision, 1981, designed by Larry Kaplan for the Atari 2600 paddle) made gentle: a gull drops shells, a stack of buckets catches them, and the tide takes what you miss.',
  direction: 'Brief by Michael Hoydich, 2026-10-22, for PointCast games: "80s innocence, joy of the compute and flow, mood state symbiosis, mobile and full screen, audio visual multimedia, Atari and Commodore inspired style modern." One of five wave-two Cabinet Row games.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    after: 'Kaboom! (Activision, 1981), designed by Larry Kaplan',
    note: 'Original code, art, and synthesized sound. No Activision art, names or characters; no ROMs, no emulation, no recordings. Machine names are referenced as tributes.',
  },
  game: {
    genre: 'catching game',
    field: { width: W, height: { min: H_MIN, max: H_MAX } },
    waves: WAVE_COUNTS.map((count, i) => {
      const s = waveSpec(i);
      return { wave: i + 1, shells: count, pointsPerCatch: s.points, fallSpeed: s.fall, dropInterval: Number(s.interval.toFixed(2)), gullSpeed: s.gull };
    }),
    afterLastWave: 'Every later wave drops the last count at the last speed, eight points a catch.',
    buckets: MAX_BUCKETS,
    bucketBackEvery: BUCKET_EVERY,
    miss: 'The tide washes the missed shell and the rest of that wave away, the bottom bucket is lost, and the gull starts the previous wave again. With no buckets left the game ends.',
    goldenShell: `In RUSH, now and then a golden shell worth ${GOLD_POINTS} times a normal catch.`,
    control: 'Absolute, like a paddle: the buckets follow the finger or mouse x directly. Arrows or A/D also move them.',
    localBestScore: true,
    saveKey: 'low-tide:v1',
  },
  moodSymbiosis: {
    labels: LABELS,
    events: { paddle: 'each catch', brick: 'each completed wave', loss: 'a miss', wave: 'a wave caught without a miss' },
    meaning: {
      DAWN: 'warming up: cool shells, slow major arpeggio, slightly wide buckets',
      FLOW: 'a long run of catches: bright shells, the music opens up',
      RUSH: 'the gull flies faster, raster bars, faster tempo, golden shells',
      DRIFT: 'after a miss: slower shells, wider buckets, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, bucketsNeverLost: d.unlimitedBalls })),
      note: 'The dial sets the baseline the game relaxes toward. CALM loses no buckets and never ends.',
    },
    gameSide: ['shell fall speed, drop rate and gull speed', 'bucket width', 'music tempo and scale', 'shell and border palette', 'splash particle density', 'golden shells'],
    memory: 'The mood tape and last energy are kept in this browser; after a game, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet), which Cabinet Row reads.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime',
    catch: 'Every catch plays the next note of a rising run within the wave, the signature sound of the original, synthesized here as a pentatonic climb in the current mood scale.',
    miss: 'A soft wash of low-passed noise that swells and recedes, the tide.',
    music: 'A generative arpeggiator over a four-chord loop; tempo and scale follow the mood.',
    startsOn: 'first tap or key, per browser autoplay rules',
  },
  controls: {
    pointer: 'Move the mouse or drag on the field; the buckets follow. Tap or click to start a wave.',
    keyboard: 'Left/Right or A/D move, Space starts a wave, P pauses, F full screen, M sound, C scanlines, 1 and 2 switch machines, 3 cycles the dial.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced motion stops the ripples and border bars and dims flashes', 'a polite live region announces waves, misses and buckets', 'no sound is required to play'],
  caveats: ['Scores, settings and the mood tape are browser-local only.', 'The palettes are tributes chosen to read on modern displays, not chip-accurate output.'],
  links: {
    human: 'https://pointcast.xyz/low-tide',
    json: 'https://pointcast.xyz/low-tide.json',
    cabinetRow: 'https://pointcast.xyz/cabinet-row',
    breakwater: 'https://pointcast.xyz/breakwater',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-low-tide-notes.md',
    games: 'https://pointcast.xyz/games/',
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
