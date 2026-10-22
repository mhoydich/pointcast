/**
 * /driftwood.json - machine-readable manifest for Driftwood, Asteroids on the
 * water, the fifth of the five sibling games that followed Breakwater.
 */
import type { APIRoute } from 'astro';
import { MACHINES } from '../lib/breakwater/waves.mjs';
import { DIALS, LABELS } from '../lib/breakwater/mood.mjs';
import { SIZES, BIRD_POINTS, FIELD_CLEAR_POINTS, FIELD_W, FIELD_TOP, FIELD_H_MIN, FIELD_H_MAX, BOAT, FLARE, fieldCount } from '../lib/driftwood/field.mjs';
import { EXTRA_BOAT_EVERY } from '../lib/driftwood/sim.mjs';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Driftwood',
  status: 'playable browser game',
  human: 'https://pointcast.xyz/driftwood',
  image: 'https://pointcast.xyz/images/driftwood/og.png',
  intent: 'Asteroids on the water: a small boat on a dark field, driftwood logs that split big to medium to small, wrap at every edge, inertia with no friction, a limited flare rate and a tide bird for bonus points. The field answers your mood.',
  direction: 'Brief by Michael Hoydich, 2026-10-22: 80s innocence, the joy of the compute and flow, mood-state symbiosis, mobile and full screen, audio-visual multimedia, Atari and Commodore inspired, rendered modern. Then: "set up 5 new threads to create more". Driftwood is thread 5 of 5, stacked on Breakwater.',
  credits: {
    director: 'Michael Hoydich',
    build: 'Claude Code, 2026-10-22',
    note: 'Original code, art, and synthesized sound. No ROMs, no emulation, no copyrighted shapes or recordings. Machine names are referenced as tributes.',
  },
  game: {
    genre: 'multidirectional shooter / asteroids',
    field: { width: FIELD_W, top: FIELD_TOP, height: [FIELD_H_MIN, FIELD_H_MAX], wraps: 'every edge, one period for every body; bodies near an edge are drawn on both sides and collide across the seam', friction: 0 },
    scoring: {
      big: SIZES.big.points, medium: SIZES.medium.points, small: SIZES.small.points, tideBird: BIRD_POINTS, fieldClear: FIELD_CLEAR_POINTS,
      rule: 'The arcade numbers: 20, 50, 100 for the three log sizes, 200 for the bird. Big splits into two medium, medium into two small, small is cleared.',
    },
    fields: { opening: fieldCount(0), rule: 'Four big logs on the first field, one more each field, up to ten, plus one or two more when the mood reads FLOW or RUSH. Logs drift faster on later fields.' },
    boat: { turnRate: BOAT.turnRate, thrust: BOAT.thrust, maxSpeed: BOAT.maxSpeed, hitRadius: 5, boats: 3, extraBoatEvery: EXTRA_BOAT_EVERY },
    flares: { speed: FLARE.speed, life: FLARE.life, cooldown: FLARE.cooldown, maxLive: FLARE.maxLive, note: 'Flares carry the boat velocity. DRIFT raises the rate.' },
    tideBird: { points: BIRD_POINTS, rule: 'Crosses the field now and then on PLAY and RUSH; often in RUSH; never in CALM unless the mood reads RUSH. Shoot it for 200; touching it costs a boat.' },
    shield: 'A short shield at every field start and after every loss; DRIFT makes it four seconds. CALM has no game over: a collision resets the boat with a shield.',
    localBestScore: true,
  },
  moodSymbiosis: {
    labels: LABELS,
    meaning: {
      DAWN: 'warming up: cool lines, a slow heartbeat, the bird rare',
      FLOW: 'a long run of hits: brighter lines, border bars, the heartbeat opens up, one more log on the next field',
      RUSH: 'high energy: glow on every line, hot border bars, a fast heartbeat, two more logs on the next field, the bird often',
      DRIFT: 'after a loss: softened lines, logs slowed, a four-second shield, a faster flare rate, the heartbeat thin',
    },
    events: { paddle: 'a flare hit', brick: 'a small log cleared, or the bird', loss: 'a collision', wave: 'a cleared field' },
    playerSide: {
      dial: Object.values(DIALS).map((d) => ({ id: d.id, label: d.label, baseline: d.baseline, cap: d.cap, noGameOver: d.unlimitedBalls })),
      note: 'The dial sets the baseline the game relaxes toward. Hits push energy up, collisions pull calm down, time restores it. Shared with Breakwater: the same mood model, the same four labels.',
    },
    gameSide: ['log drift speed', 'shield length and flare rate', 'heartbeat tempo and scale', 'line color and glow', 'spark density', 'border raster bars', 'log count on the next field', 'tide bird frequency'],
    memory: 'The session mood tape and the last energy are kept in this browser under driftwood:v1 and the next session starts most of the way back. After a game, the current label is written to the sitewide pc:mood key (chill, flow, hype, quiet) so the town carries it.',
  },
  machines: Object.values(MACHINES).map((m) => ({ id: m.id, name: m.name, year: m.year, soundChip: m.chip, prompt: m.prompt, field: m.field, border: m.border, text: m.text, note: 'Lines are stroked in the text color on a night-darkened version of the field color.' })),
  audio: {
    engine: 'Web Audio API, synthesized at runtime, started by the first tap or key',
    heartbeat: 'Two alternating low notes, one half-note apart in time, the way the 1979 cabinet kept time. The interval follows the mood tempo (92 to 162 BPM) and the pair of notes follows the mood scale.',
    sfx: 'A short noise burst per flare, a low filtered crunch per split (deeper for bigger logs), a bright tick for a cleared small log, a low rumble while pushing, a warble while the bird is on the water, a falling saw and noise on a collision.',
    machines: 'The C64 mode runs every voice through a resonant low-pass sweep in the SID spirit; the 800XL mode keeps raw squares and adds a noise bite to the heartbeat, in the POKEY spirit.',
    haptics: 'short vibration on hits and collisions where supported',
  },
  controls: {
    touch: 'The left third of the water turns left, the right third turns right, the lower middle pushes, a tap in the upper middle fires (held, it keeps firing at the limited rate). The field names the zones for the first three games.',
    keyboard: 'Left/Right or A/D turn, Up or W pushes, Space fires, P pauses, F toggles full screen, M toggles sound, C toggles the CRT overlay, 1 and 2 switch machines, 3 cycles the dial.',
    fullscreen: 'The FULL button uses the Fullscreen API on the stage element. iOS Safari lacks it for pages, so the stage fills the viewport instead.',
    mobile: 'Portrait first, 100dvh stage, touch-action none on the field, pauses when the tab is hidden, held controls release on blur.',
  },
  accessibility: ['CRT scanlines can be switched off', 'reduced-motion preference stills the water lines, the raster bars and the wake flicker and dims the sparks', 'a polite live region announces fields, boats and the bird', 'no sound is required to play'],
  caveats: [
    'Scores, settings and the mood tape are browser-local only.',
    'The machine palettes are tributes chosen to read on modern displays, not chip-accurate output.',
    'The boot screens are affectionate tributes with PointCast wording, not copies of the original ROM text.',
    'The RUSH glow turns itself off for the session after three slow frame-rate readings in a row, so a slow phone keeps its frame rate.',
  ],
  links: {
    human: 'https://pointcast.xyz/driftwood',
    json: 'https://pointcast.xyz/driftwood.json',
    research: 'https://github.com/mhoydich/pointcast/blob/main/docs/notes/2026-10-22-driftwood-notes.md',
    breakwater: 'https://pointcast.xyz/breakwater',
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
