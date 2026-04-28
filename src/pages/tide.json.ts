/**
 * /tide.json — agent-readable manifest of the /tide room.
 *
 * Serves the palette catalog + interactive surface metadata so agents
 * (LLM crawlers, indexers, Magpie/Sparrow readers) can render or
 * describe /tide without parsing HTML.
 */
import type { APIRoute } from 'astro';

const PALETTES = [
  { id: 'daybreak',  name: 'DAYBREAK',  hex: { sky: '#FFD4C2', water: '#F4A78D', foam: '#FFE9D8', orb: '#FFB496', wave1: '#E08F73', wave2: '#C4715A', wave3: '#AA5443' }, dark: false, dek: 'pearl pink · soft peach · lavender mist' },
  { id: 'crystal',   name: 'CRYSTAL',   hex: { sky: '#BFEFEC', water: '#7FE5DC', foam: '#F4FBFA', orb: '#FFFFFF', wave1: '#5DCBC0', wave2: '#3FA89C', wave3: '#1F8579' }, dark: false, dek: 'aquamarine · soft cyan · white foam' },
  { id: 'kelp',      name: 'KELP',      hex: { sky: '#9FB28A', water: '#5C7A4E', foam: '#E0D4B8', orb: '#D9C46E', wave1: '#3F5E33', wave2: '#2A4424', wave3: '#1A2E18' }, dark: false, dek: 'sage canopy · deep green · amber kelp' },
  { id: 'coral',     name: 'CORAL',     hex: { sky: '#FFC4B0', water: '#FF8675', foam: '#FFE0D6', orb: '#FFEEC2', wave1: '#E76B5C', wave2: '#C4493D', wave3: '#9B2D24' }, dark: false, dek: 'coral pink · dusty rose · lavender' },
  { id: 'abyss',     name: 'ABYSS',     hex: { sky: '#1E2D5C', water: '#0A1F3A', foam: '#2EC4B6', orb: '#88E0D4', wave1: '#0E2548', wave2: '#06162D', wave3: '#020912' }, dark: true,  dek: 'midnight indigo · abyssal navy · phosphor teal' },
  { id: 'storm',     name: 'STORM',     hex: { sky: '#5A6470', water: '#2C2E33', foam: '#FFE15D', orb: '#FFE15D', wave1: '#1E2025', wave2: '#16181C', wave3: '#0C0E12' }, dark: true,  dek: 'slate · charcoal · lightning' },
  { id: 'lagoon',    name: 'LAGOON',    hex: { sky: '#A0E6DC', water: '#2EC4B6', foam: '#F5DEA8', orb: '#F5DEA8', wave1: '#26A89C', wave2: '#188076', wave3: '#0F5C55' }, dark: false, dek: 'turquoise · teal · warm sand' },
  { id: 'nighttide', name: 'NIGHTTIDE', hex: { sky: '#3A0E5C', water: '#0E1845', foam: '#FF1493', orb: '#FF69B4', wave1: '#3D1276', wave2: '#1F1054', wave3: '#0A0830' }, dark: true,  dek: 'electric magenta · hot pink · deep ocean' },
];

const CLOCK_TIME_RANGES = [
  { from: '00:00', to: '05:00', palette: 'abyss' },
  { from: '05:00', to: '08:00', palette: 'daybreak' },
  { from: '08:00', to: '11:00', palette: 'crystal' },
  { from: '11:00', to: '14:00', palette: 'lagoon' },
  { from: '14:00', to: '17:00', palette: 'kelp' },
  { from: '17:00', to: '20:00', palette: 'coral' },
  { from: '20:00', to: '22:00', palette: 'storm' },
  { from: '22:00', to: '24:00', palette: 'nighttide' },
];

export const GET: APIRoute = async () => {
  const body = {
    surface: '/tide',
    description: 'A minimal water-led color room. Eight palettes, three SVG wave layers with parallax, drifting sun-or-moon orb, rising foam, optional Web Audio waves. Tap to cycle.',
    url: 'https://pointcast.xyz/tide',
    interactions: {
      tap: 'Tap anywhere except settings and footer to cycle to the next palette.',
      keyboard: {
        'Space / Enter / ArrowRight': 'next palette',
        'ArrowLeft': 'previous palette',
        'M': 'cycle scene',
        'C': 'capture a fresh custom palette (random hue, persisted as a 9th palette in cycle)',
        'Escape': 'restore hidden UI',
      },
      hash: 'URL hash selects palette and optional scene: #abyss or #abyss/mystify. Hash updates on cycle.',
      autoCycle: 'Default 90s; configurable to 30s, 5m, or never via settings drawer.',
      audio: 'Optional Web Audio. Three soundscapes: drift (filtered brown-noise + LFO + sine pad on root+fifth), chimes (random just-intoned pentatonic tones), bubbles (pitch-modulated sine pops through bandpass). Auto-mutes when tab loses focus and restores on return without flipping the user toggle.',
      moments: 'Save the current palette + scene + soundscape + dwell time to localStorage (pc:tide:moments). Viewable at /tide/moments.',
    },
    scenes: [
      { id: 'waves',     name: 'WAVES',     description: 'Sky + parallax-morphed wave layers + foam. The default.' },
      { id: 'starfield', name: 'STARFIELD', description: 'Warp-speed canvas particles flowing toward the viewer, palette-tinted.' },
      { id: 'mystify',   name: 'MYSTIFY',   description: 'After-dark style polylines with bouncing points + history-trail fade.' },
      { id: 'bounce',    name: 'BOUNCE',    description: 'DVD-logo-style palette-tinted wordmark bouncing across the viewport. Color cycles on each wall hit, soft flash on corner hits.' },
      { id: 'pipes',     name: 'PIPES',     description: 'After-Dark style maze of growing palette-tinted pipes drawn on a grid. Pipes turn at 12% chance per cell, die on collision, respawn until the grid fills, then slowly fades and restarts.' },
    ],
    soundscapes: [
      { id: 'drift',    name: 'DRIFT',    description: 'Filtered brown-noise + LFO breath + sine pad on root + fifth. Tuned per palette.' },
      { id: 'chimes',   name: 'CHIMES',   description: 'Random soft pentatonic tones at just-intoned ratios from palette root. 900ms-4.1s intervals.' },
      { id: 'bubbles',  name: 'BUBBLES',  description: 'Pitch-swept sine pops through a bandpass filter. 350ms-2.55s intervals.' },
      { id: 'granular', name: 'GRANULAR', description: 'Overlapping 60-180ms sine/triangle grains around palette root with slow LFO pitch drift and just-intonation detune. Quiet sine pad bed for body. ~5-12 grains per second.' },
    ],
    palettes: PALETTES,
    clockDefault: {
      timezone: 'America/Los_Angeles',
      ranges: CLOCK_TIME_RANGES,
    },
    storage: {
      'pc:tide:last':        'last visited palette id',
      'pc:tide:mode':        'last scene (waves|starfield|mystify|bounce|pipes)',
      'pc:tide:soundscape':  'last soundscape (drift|chimes|bubbles|granular)',
      'pc:tide:custom':      'JSON palette object captured via C key (id=custom, slotted as 9th palette)',
      'pc:tide:audio':       '"1" or "0" — audio toggle',
      'pc:tide:volume':      'float 0..1 — audio volume',
      'pc:tide:motion':      '"1" or "0" — animations on',
      'pc:tide:autoMs':      'number — auto-cycle interval ms (0 = never)',
      'pc:tide:ui':          '"1" or "0" — UI visible',
      'pc:tide:moments':     'JSON array of saved moment objects (cap 50)',
    },
    companion: {
      '/tide':           'the room',
      '/tide.json':      'this manifest',
      '/tide/moments':   'saved moments viewer',
      '/bath':           'companion (button-y, Spotify, mood selector)',
      '/meditate':       'companion (still room, breathing)',
      '/pace':           'companion (movement room, BPM)',
    },
    version: 4,
    versions: {
      v1: 'shipped 2026-04-28 — palettes, parallax waves, orb, foam, tap-to-cycle, 90s drift',
      v2: 'shipped 2026-04-28 — Web Audio synth, ripples, hash sync, settings drawer, aurora, wave morph, grain, moments save',
      v3: 'shipped 2026-04-28 — three classic-screensaver scenes (WAVES/STARFIELD/MYSTIFY) + three varied soundscapes (DRIFT/CHIMES/BUBBLES). M-key cycles scene. Hash carries scene (#abyss/mystify).',
      v4: 'shipped 2026-04-28 — BOUNCE scene (DVD-logo classic, palette-cycles on wall hits, corner-hit flash) + tab-blur auto-mute (audio fades out when tab loses focus, restores on return without flipping the user toggle) + PIPES scene (After-Dark maze of growing palette-tinted pipes on a grid) + GRANULAR soundscape (overlapping short sine/triangle grains with LFO pitch drift) + C key to capture a fresh random custom palette as a 9th cycle entry.',
    },
    license: 'CC0',
    source: 'https://github.com/mhoydich/pointcast/blob/main/src/pages/tide.astro',
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
