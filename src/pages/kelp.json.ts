/**
 * /kelp.json - machine-readable manifest for Kelp, the Atari 800XL and
 * Commodore 64 flavored snake game on PointCast (thread 2 of 5 on the
 * 2026-10-22 games brief).
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { COLS, ROWS, PATTERNS, START_LENGTH, HAVEN } from '../lib/kelp/grid.mjs';
import { BASE_VALUE, GOLDEN_MULT, EXTRA_LIFE_EVERY, BASE_TICK, MIN_TICK, targetLength } from '../lib/kelp/strand.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Kelp',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/kelp',
  image: 'https://pointcast.xyz/images/kelp/og.png',
  intent: 'A snake game with 1980s innocence: a kelp strand grows across a portrait grid by eating plankton, the frame is the wall, each stage stands a new rock pattern, and the game keeps a mood with the player.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired, rendered modern. Thread 2 of 5 after Breakwater; siblings are Tideline, Soft Landing, Crosswalk and Driftwood.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art, and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Machine names are referenced as tributes. The pixel font, palettes and mood model are shared with Breakwater.',
  },
  game: {
    genre: 'snake / nibbler',
    field: { width: 288, height: 396, columns: COLS, rows: ROWS, haven: HAVEN },
    strand: { startLength: START_LENGTH, growthPerPlankton: 1, growthPerGolden: 2, turnQueue: 2 },
    scoring: { plankton: `${BASE_VALUE} x stage number, x1.5 at FLOW, x2 at RUSH`, golden: `${GOLDEN_MULT}x a plankton, only in RUSH, times out`, stageClear: 'the strand reaches the target length' },
    targets: Array.from({ length: 8 }, (_, i) => ({ stage: i + 1, length: targetLength(i) })),
    stages: PATTERNS,
    stagesNote: 'Patterns cycle. The nameplate spells the chosen machine and the counter spells the stage number, both from the 3x5 pixel font at three cells per pixel, with a doorway cut through any enclosed loop. The mood density thins a pattern; it never adds rocks.',
    tick: { baseSeconds: BASE_TICK, minimumSeconds: MIN_TICK, rule: 'Faster each stage, multiplied by the mood speed, 30% faster for a short boost after a golden plankton.' },
    lives: 3,
    extraLifeEveryStages: EXTRA_LIFE_EVERY,
    collision: 'The frame, a rock or the strand itself costs a life and the next strand starts over at the start length on the same stage. On CALM there are no lives; a collision only trims the strand.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    mapping: { paddle: 'each plankton eaten in an unbroken run', brick: 'each plankton', loss: 'a collision', wave: 'a stage clear' },
    meaning: {
      DAWN: 'warming up: cool palette, slow major arpeggio, the strand bands hold still',
      FLOW: 'an unbroken run: bright palette, the bands cycle, plankton worth half again as much',
      RUSH: 'high energy: hot palette, raster bars, faster ticks, golden plankton worth triple that speeds you up',
      DRIFT: 'after collisions: softened palette, slower ticks, thinner rocks next stage, a shorter strand on the next life',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, noLives: d.unlimitedBalls })),
      note: 'The dial sets the baseline the game relaxes toward. Plankton push energy up, collisions pull calm down, time restores it.',
    },
    gameSide: ['tick rate', 'plankton value', 'obstacle density', 'start length', 'music tempo and scale', 'palette temperature and band cycling', 'particle density', 'raster bars', 'golden plankton'],
    memory: 'The session mood tape and the last energy are kept in this browser under kelp:v1 and the next session starts most of the way back. After a game, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town carries it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, bands: m.bands, raster: m.raster })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime, started by the first tap or key',
    voices: 'Square and triangle oscillators with short envelopes. The C64 mode adds a resonant low-pass sweep in the SID spirit; the 800XL mode keeps raw squares with a noise burst, in the POKEY spirit.',
    music: 'A slow eighth-note swell over a four-chord loop, two bars per chord. Tempo and scale follow the mood: major at DAWN, lydian-bright at FLOW, minor at RUSH, sparse at DRIFT.',
    sfx: 'Each plankton plays one short note that climbs a pentatonic scale with the strand\'s length, an octave every five plankton. A low thud on collision. Golden plankton, stage clear and extra life are separate cues.',
    haptics: 'short vibration on plankton and collisions where supported',
  },
  controls: {
    touch: 'Swipe anywhere on the field to turn; keep the finger down and swipe again to turn again. Tap to start, to skip the boot, and to resume.',
    keyboard: 'Arrows or W A S D turn (the first one starts the swim), Space starts, P pauses, F toggles full screen, M toggles sound, C toggles the CRT overlay, 1 and 2 switch machines, 3 cycles the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference stops band cycling and raster movement and lowers particles', 'a polite live region announces stage, life and collision events', 'no sound is required to play'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of the original ROM text.',
  ],
  links: {
    human: 'https://pointcast.xyz/kelp',
    json: 'https://pointcast.xyz/kelp.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-kelp-notes.md',
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
