/**
 * /lighthouse.json - machine-readable manifest for Lighthouse, Simon as a
 * lighthouse lens at night, a wave-two game in the Breakwater family.
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { LAMPS, midiToHz } from '../lib/lighthouse/lens.mjs';
import { SPEED_STEPS, FLASH_ON, BASE_WINDOW, EIGHTH } from '../lib/lighthouse/game.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Lighthouse',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/lighthouse',
  image: 'https://pointcast.xyz/images/lighthouse/og.png',
  intent: 'A memory game after Simon (Milton Bradley, 1978; designed by Ralph Baer and Howard Morrison), drawn as a lighthouse lens at night: four lamps, a growing sequence of light and tone, and a mood the player and the game keep together.',
  direction: 'Michael Hoydich\'s 2026-10-22 brief for PointCast games: "80s innocence, joy of the compute and flow, mood state symbiosis, mobile and full screen, audio visual multimedia, Atari and Commodore inspired style modern", then "set up 5 new threads to create more" and "keep going". Lighthouse is one of five wave-two threads.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art, and synthesized sound. No ROMs, no emulation, no recordings. Simon and the machine names are referenced as tributes.',
  },
  family: { lobby: 'https://pointcast.xyz/cabinet-row', first: 'https://pointcast.xyz/breakwater', shared: ['3x5 pixel font', 'Atari 800XL and Commodore 64 palettes', 'mood model'] },
  game: {
    genre: 'memory / follow the sequence',
    after: { name: 'Simon', year: 1978, publisher: 'Milton Bradley', designers: ['Ralph H. Baer', 'Howard J. Morrison'] },
    field: { width: 288, height: '384 to 480, taller on tall phones' },
    lamps: LAMPS.map((l, i) => ({ position: i + 1, id: l.id, band: l.band, note: l.note, midi: l.midi, hz: Number(midiToHz(l.midi).toFixed(2)), keys: [l.arrow, l.letter, l.digit] })),
    tones: 'E, A, C sharp and the E an octave above: an A major chord, after Simon\'s four bugle-like tones (E, C sharp, A, E). Square waves on the 800XL, triangle waves on the C64.',
    sequence: 'The light plays a sequence; the player repeats it; the light adds one lamp at random and plays it all again.',
    speedRule: `Playback speeds up after the ${SPEED_STEPS.map((n) => `${n}th`).join(', ')} step of a sequence, as on Simon. Seconds per flash by tier: ${FLASH_ON.join(', ')}, multiplied by the mood.`,
    responseWindow: `About ${BASE_WINDOW} seconds per lamp before the mood bends it; it restarts with each correct press.`,
    miss: 'A wrong lamp or a slow answer sounds a low buzz and blinks the lamp that was due. On PLAY and RUSH the game ends; on CALM the same sequence replays.',
    best: 'The longest sequence repeated, kept in this browser.',
    freePlay: 'FREE turns the lens into a four-note instrument: hold a lamp to sound it, slide between lamps for a run. Free play is not a game: it records no best and does not hand a mood to the town.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    events: { paddle: 'each correct press', brick: 'each completed sequence', loss: 'a miss', wave: `every ${EIGHTH}th step reached (sequences of 8, 16, 24 ...)` },
    meaning: {
      DAWN: 'warming up: a little more time to answer, cool palette, slow major arpeggio',
      FLOW: 'a clean run: brighter lamps, the music opens up',
      RUSH: 'high energy: faster playback, lamps dark between flashes, tighter window, raster bars, more sparks',
      DRIFT: 'after a miss: slower playback, a longer response window, softened palette, sparse notes',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, noGameOver: d.unlimitedBalls })),
      note: 'The dial sets the baseline the game relaxes toward. On CALM a miss replays the same sequence and the game never ends.',
    },
    gameSide: ['playback speed', 'response window (generosity)', 'lamp brightness between flashes', 'music tempo and scale', 'palette', 'spark density', 'beam brightness', 'raster bars'],
    memory: 'The session mood tape and the last energy are kept in this browser and the next session starts most of the way back. After a game, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town and Cabinet Row carry it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, lamps: m.bands })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime; starts on the first tap or key, per browser autoplay rules',
    lamps: 'One held oscillator per lamp; in a game a tap sounds for a beat, in free play the note lasts as long as the finger.',
    miss: 'Two detuned square waves near 43 Hz under a low-pass filter: a low buzz.',
    music: 'A quiet generative arpeggio in A under the lens, ducked while the light plays and the player answers. Tempo and scale follow the mood.',
    haptics: 'short vibration on correct presses and misses where supported',
  },
  controls: {
    pointer: 'Tap or click a lamp. Tap anywhere to start.',
    keyboard: 'Arrow keys, W D S A, or 1 2 3 4 clockwise from the top play the lamps. Space starts, P pauses, F full screen, M sound, C scanlines, X switches machines, Z turns the dial, T free play.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  storage: { key: 'lighthouse:v1', fields: ['best', 'machine', 'dial', 'sound', 'crt', 'mood'] },
  accessibility: ['every lamp has a key', 'a polite live region announces turns, misses and the lamp that was due', 'CRT scanlines can be switched off', 'reduced-motion preference stops the beam sweep and softens flashes', 'colors are paired with positions and tones, so the game does not depend on telling colors apart'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The tones approximate Simon\'s chord with square or triangle oscillators; they are not measured from a unit.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
  ],
  links: {
    human: 'https://pointcast.xyz/lighthouse',
    json: 'https://pointcast.xyz/lighthouse.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-lighthouse-notes.md',
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
