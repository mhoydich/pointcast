/**
 * /sandcastle.json - machine-readable manifest for Sandcastle, the Missile
 * Command tribute on Cabinet Row (wave two of the Breakwater games).
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { W, H_MIN, H_MAX, BRIGADE_X, CASTLE_X, SAND_PER_BRIGADE, REBUILD_EVERY, POINTS, BURST, RUSH, roundPlan } from '../lib/sandcastle/shore.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Sandcastle',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/sandcastle',
  image: 'https://pointcast.xyz/images/sandcastle/og.png',
  intent: 'An innocent missile-defense game: six sandcastles and three bucket brigades on a beach, thin wave lines running down from the sea, and sand bursts that open and close to stop them.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired style, rendered modern. Then "set up 5 new threads to create more" and "keep going". Sandcastle is one of the five wave-two Cabinet Row threads.',
  tribute: 'Missile Command, Atari arcade, 1980, designed by Dave Theurer. Named as a tribute only; no art, sound or code is taken from it.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, vector art, and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Machine and game names are referenced as tributes.',
  },
  game: {
    genre: 'missile defense / shoot-em-up',
    field: { width: W, height: [H_MIN, H_MAX], castles: CASTLE_X.length, brigades: BRIGADE_X.length },
    sandPerBrigadePerRound: SAND_PER_BRIGADE,
    burst: { radius: BURST.radius, openSeconds: BURST.grow, holdSeconds: BURST.hold, closeSeconds: BURST.shrink, rule: 'Any wave line whose head enters an open burst stops.' },
    scoring: {
      waveLineStopped: POINTS.line,
      rogueWaveStopped: POINTS.rogue,
      castleStandingAtRoundEnd: POINTS.castle,
      sandLeftAtRoundEnd: POINTS.sand,
      multiplier: 'x1 on rounds 1 and 2, then one more every second round, to x6; it multiplies every score.',
    },
    rebuildEvery: REBUILD_EVERY,
    rebuildNote: 'A castle earned every 10,000 points goes up on an empty plot at the end of the round.',
    rounds: [1, 2, 3, 5, 8].map((n) => { const p = roundPlan(n); return { round: n, waveLines: p.count, speed: p.speed, splitChance: p.split, multiplier: p.multiplier }; }),
    hazards: 'A wave line that reaches a castle washes it away; one that reaches a bucket empties it until the next round. Some lines split partway down.',
    end: 'The game ends when the last castle is washed away and no rebuilt castle is waiting, except on CALM.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    events: { paddle: 'each wave line stopped', brick: 'three or more stopped by one burst', loss: 'a castle washed away', wave: 'a round ended with every castle standing' },
    meaning: {
      DAWN: 'warming up: cool lines, slow major arpeggio, slightly wider bursts',
      FLOW: 'a run of saves: bright lines, the music opens up',
      RUSH: `high energy: hot lines, border raster bars, faster tempo, more splits (+${RUSH.split}) and a ${RUSH.rogue} chance per volley of a rogue wave at ${RUSH.rogueSpeed}x speed`,
      DRIFT: 'after a castle falls: slower wave lines, bursts up to 1.35x wider, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, endless: d.unlimitedBalls })),
      note: 'The dial sets the baseline the game relaxes toward. CALM rebuilds every castle at the end of every round and never ends the game.',
    },
    gameSide: ['wave line speed', 'burst size', 'music tempo and scale', 'line palette', 'particle density', 'raster bars', 'splits and rogue waves'],
    memory: 'The session mood tape and the last energy are kept in this browser (localStorage sandcastle:v1) and the next session starts most of the way back. After a game, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town and Cabinet Row carry it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime',
    voices: 'Square, triangle and sawtooth oscillators and filtered noise. The C64 mode adds a resonant low-pass sweep in the SID spirit; the 800XL mode keeps raw squares with a noise bite, in the POKEY spirit.',
    music: 'A generative 16th-note arpeggiator over a four-chord loop; tempo and scale follow the mood.',
    sfx: 'Each stopped line plays a pentatonic note by where it was stopped, rising with the chain. Throw, burst, chain, castle, bucket, split, rogue and tally cues are separate voices.',
    startsOn: 'first tap or key, per browser autoplay rules',
  },
  controls: {
    pointer: 'Tap or click where a wave line is heading; the nearest brigade with sand throws there.',
    keyboard: 'Arrows or W/A/S/D move the crosshair, Space throws from the nearest brigade, 1, 2 and 3 throw from the left, middle and right brigade, P pauses, F full screen, M sound, C scanlines, X switches machines, Z turns the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference keeps burst colors still, stops the sea and the raster bars, and softens flashes', 'a polite live region announces rounds, castles and bonuses', 'no sound is required to play'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
  ],
  links: {
    human: 'https://pointcast.xyz/sandcastle',
    json: 'https://pointcast.xyz/sandcastle.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-sandcastle-notes.md',
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
