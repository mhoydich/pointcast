/**
 * /tideline.json - machine-readable manifest for Tideline, the Pong-style
 * game on PointCast (thread 1 of 5 after Breakwater).
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { FIELD, SEGMENT_ANGLES } from '../lib/tideline/physics.mjs';
import { WIN_SCORE, SPEED } from '../lib/tideline/rules.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Tideline',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/tideline',
  image: 'https://pointcast.xyz/images/tideline/og.png',
  intent: 'Pong stood on its end: your paddle at the bottom, the house paddle at the top, a ball between them, two big score digits a side, and a house whose skill follows the mood you and the game keep together.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired, rendered modern. Tideline is thread 1 of five games built in parallel after Breakwater.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art and synthesized sound. No ROMs, no emulation, no recordings. Pong (Atari, 1972) and Video Olympics (Atari, 1977) are referenced as tributes.',
  },
  game: {
    genre: 'pong / bat and ball',
    orientation: 'portrait: house paddle at the top, your paddle at the bottom',
    field: { width: FIELD.W, height: `${FIELD.H_MIN} to ${FIELD.H_MAX}`, paddleWidth: FIELD.PADDLE_W, ball: FIELD.BALL },
    scoring: { toWin: WIN_SCORE, rule: 'Rally to 11. Serve alternates every point. A ball past the house is your point; a ball past you is the house\'s.' },
    returnAngle: { segments: SEGMENT_ANGLES.length, degreesOffVertical: SEGMENT_ANGLES, rule: 'Eight segments across each paddle, as on the 1972 cabinet: the middle sends the ball back steeply, the edges send it flat.' },
    speedRule: { base: SPEED.base, perVolley: SPEED.step, max: SPEED.max, unit: 'logical pixels per second', note: 'Speed rises with every volley and resets on a point. The mood response multiplies on top.' },
    house: 'The top paddle predicts where the ball will cross its line, with wall bounces folded in. Its speed, its reach and its aim error all follow a skill number set by the mood: DRIFT eases it, RUSH sharpens it.',
    secondBall: 'Once per game, when the mood reads RUSH in a long rally, a second ball joins. A point is scored when either leaves.',
    calm: 'On the CALM dial no game ends; the digits keep counting and wrap at 99 like a two-digit counter.',
    twoPlayer: 'Optional: the 2UP button hands the top paddle to a second person by touch or mouse in the top half of the field. The house brain steps aside.',
    localRecords: ['longest rally', 'games won'],
  },
  moodSymbiosis: {
    labels: LABELS,
    events: { paddle: 'your return', brick: 'a point you win', loss: 'a point you lose', wave: 'a game you win' },
    meaning: {
      DAWN: 'warming up: cool palette, slow major pulse, a slightly wide paddle, an easy house',
      FLOW: 'a long rally: bright palette, the music opens up, standard paddle, a steadier house',
      RUSH: 'high energy: hot palette, raster bars, faster tempo, a sharp house, second ball possible',
      DRIFT: 'after lost points: softened palette, wider paddle, slower ball, sparse notes, a forgiving house',
    },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, noGameOver: d.unlimitedBalls, note: d.id === 'calm' ? 'No game ends. The digits roll on.' : d.id === 'play' ? 'Rally to 11.' : 'Starts hot. Leans into the second ball.' })),
      note: 'The dial sets the baseline the game relaxes toward. Returns push energy up, lost points pull calm down, time restores it.',
    },
    gameSide: ['ball speed', 'house paddle skill', 'your paddle width', 'music tempo and scale', 'palette temperature', 'particle density', 'raster bars', 'second ball'],
    memory: 'Longest rally, games won, settings and the mood tape are kept in this browser under tideline:v1. After a game has been played, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) on leaving.',
    sharedModel: 'src/lib/breakwater/mood.mjs, unchanged from Breakwater.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, paddle: m.paddle })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime',
    signature: 'The paddle pok. Pong took its three sounds from the cabinet\'s sync generator; Tideline approximates them with square waves: a short mid tone for a paddle hit, a lower blip for the wall, a longer tone for a point. No samples.',
    voices: 'Square and triangle oscillators with short envelopes. C64 mode adds a resonant low-pass sweep in the SID spirit; 800XL mode keeps raw squares with a noise bite, in the POKEY spirit.',
    music: 'A sparse generative pulse over a four-chord loop. Tempo and scale follow the mood: major at DAWN, bright at FLOW, minor at RUSH, soft at DRIFT.',
    startsOn: 'first tap or key, per browser autoplay rules',
    haptics: 'short vibration on returns and points where supported',
  },
  controls: {
    pointer: 'Move the mouse or drag anywhere on the field to steer your paddle. Tap or click to serve when it is your serve.',
    keyboard: 'Left/Right or A/D steer, Space serves, P pauses, F toggles full screen, M toggles sound, C toggles the CRT overlay, 1 and 2 switch machines, 3 cycles the dial, 4 toggles 2UP. In 2UP the top player steers with J/L and serves with I.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference lowers particles and stops raster movement', 'a polite live region announces points and games', 'no sound is required to play'],
  caveats: [
    'Records, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of ROM text.',
    'The sounds approximate Pong\'s tones by ear; the original frequencies came from the cabinet\'s video timing and are not reproduced.',
  ],
  siblings: {
    breakwater: 'https://pointcast.xyz/breakwater',
    note: 'Tideline shares Breakwater\'s pixel font, palettes and mood model, and the same 288-pixel field width, so the games read as one cabinet row.',
  },
  links: {
    human: 'https://pointcast.xyz/tideline',
    json: 'https://pointcast.xyz/tideline.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-tideline-notes.md',
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
