/**
 * /soft-landing.json - machine-readable manifest for Soft Landing, the
 * Atari 800XL and Commodore 64 flavored lunar lander on PointCast.
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { LIMITS, SCORING } from '../lib/soft-landing/landing.mjs';
import { PAD_KINDS, RUSH_PAD, MIN_PAD } from '../lib/soft-landing/skyline.mjs';
import { DEFAULT_ENV, FUEL_START, FUEL_REFUND, LANDER } from '../lib/soft-landing/physics.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Soft Landing',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/soft-landing',
  image: 'https://pointcast.xyz/images/soft-landing/og.png',
  intent: 'A lunar-lander arcade game with 1980s innocence: a vector skyline, a small ship with a little fuel, pads that pay more the narrower they are, and a mood the game and the player keep together.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired, rendered modern. Thread 3 of the five games built in parallel after Breakwater.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art, and synthesized sound. No ROMs, no emulation, no copyrighted sprites or recordings. Machine names are referenced as tributes. The pixel font, palettes and mood model are shared with Breakwater.',
  },
  game: {
    genre: 'lunar lander',
    field: { width: 288, height: '384 to 480 by viewport', hud: 32, lander: LANDER },
    physics: { ...DEFAULT_ENV, units: 'logical field pixels per second (squared); y grows downward', note: 'Gravity is multiplied by the mood speed response; RUSH adds a crosswind.' },
    landing: { limits: LIMITS, rule: 'Both feet on a pad, falling no faster than vy, drifting no faster than vx, within angle radians of level.' },
    pads: { kinds: PAD_KINDS, rush: RUSH_PAD, minimumWidth: MIN_PAD, note: 'Widths are scaled by the mood paddle response (DRIFT widens, RUSH narrows). The five-times pad appears only in RUSH.' },
    scoring: { ...SCORING, rule: 'multiplier times base, plus the soft bonus for a truly gentle touch, plus fuel left divided by fuelPer. CALM has no fuel to count.' },
    fuel: { start: { calm: 'unlimited', play: FUEL_START.play, rush: FUEL_START.rush }, refundPerMultiplier: FUEL_REFUND, note: 'The main engine burns fuelRate per second, the side jets tiltFuel. An empty tank falls.' },
    landers: 3,
    skyline: 'Seeded polyline with three pads (four in RUSH). Each landing brings a new one; after a crash the same skyline returns with the pads rebuilt at the current mood width.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    meaning: {
      DAWN: 'warming up: cool palette, slow major arpeggio, slightly wide pads',
      FLOW: 'a run of good landings: bright palette, the music opens up, a breath of wind',
      RUSH: 'high energy: hot palette, raster bars, faster tempo, a crosswind, a narrow five-times pad',
      DRIFT: 'after a crash: softened palette and gravity, wider pads, sparse notes',
    },
    events: { paddle: 'a controlled burn that leaves the lander slower', brick: 'every hundred units of altitude descended', loss: 'a crash', wave: 'a landing' },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, unlimitedFuel: d.unlimitedBalls, note: d.id === 'calm' ? 'Unlimited fuel; a crash never ends the game.' : d.id === 'play' ? `Three landers, ${FUEL_START.play} fuel.` : `Starts hot, ${FUEL_START.rush} fuel.` })),
      note: 'The dial sets the baseline the game relaxes toward. Burns and descent push energy up, crashes pull calm down, time restores it.',
    },
    gameSide: ['gravity', 'crosswind', 'pad width', 'music tempo and scale', 'palette temperature', 'exhaust density', 'raster bars', 'the five-times pad'],
    memory: 'The session mood tape and the last energy are kept in this browser under soft-landing:v1 and the next session starts most of the way back. After a game, on leaving, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town carries it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, bands: m.bands })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime, after the first tap or key',
    roar: 'A looping noise bed through a low-pass filter whose gain and cutoff follow the throttle. The C64 mode makes the filter resonant, in the SID spirit; the 800XL mode keeps it raw, in the POKEY spirit.',
    cues: 'A low sine rumble with a filtered thump on landing, a descending sawtooth slide with a noise burst on a crash, a high-pass tick when a side jet fires, a rising blip every hundred units of descent, a short chord on a landing.',
    music: 'A generative eighth-note arpeggiator over a four-chord loop, slower than Breakwater. Tempo and scale follow the mood: major at DAWN, lydian-bright at FLOW, minor at RUSH, sparse at DRIFT.',
    haptics: 'short vibration on landings and crashes where supported',
  },
  controls: {
    touch: 'Hold the middle third of the field to burn; hold the left or right third to tilt. A finger that slides between thirds changes what it does.',
    keyboard: 'Up or Space burns, Left/Right or A/D tilt, P pauses, F toggles full screen, M toggles sound, C toggles the CRT overlay, 1 and 2 switch machines, 3 cycles the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference steadies the flame, cuts particles and stops the raster bars', 'a polite live region announces landings, crashes and the dial', 'no sound is required to play', 'the instruments turn red when a speed or the attitude would not survive a landing'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of the original ROM text.',
    'The physics are arcade physics in field pixels, not a simulation of any real vehicle.',
  ],
  links: {
    human: 'https://pointcast.xyz/soft-landing',
    json: 'https://pointcast.xyz/soft-landing.json',
    breakwater: 'https://pointcast.xyz/breakwater',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-soft-landing-notes.md',
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
