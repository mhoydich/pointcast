import type { APIRoute } from 'astro';
import { SCALES, VOICES, AMBIENCE, KEY_SOUNDS } from '../scripts/takes-audio.mjs';

const payload = {
  name: 'TAKES',
  kind: 'browser writing tool',
  canonical: 'https://pointcast.xyz/takes/',
  description: 'A writing desk for alternate takes: keep several versions of a word, sentence or paragraph in place, audition them with synthesized tones, dim text back and stash cuts in an overflow. Inspired by the “alternative control” idea Jason Fried showed with his Write_On editor; independent and not affiliated.',
  format: {
    name: 'Takes Markdown',
    mediaType: 'text/markdown',
    inlineTake: '{{original | alternate | >chosen}} — the first option is the original; a leading > marks the showing take',
    dim: '((text pushed back but kept))',
    paragraphTakes: '::: takes\\nversion one\\n+++ >\\nversion two (chosen)\\n:::',
    overflow: 'Everything after a line reading "--- overflow ---" is the stash, one item per blank-line-separated paragraph.',
    cleanExport: 'The File panel downloads either the full Takes Markdown or clean Markdown with only the chosen takes.',
  },
  audio: {
    engine: 'Web Audio, synthesized in the browser; no samples are downloaded',
    rule: 'Alternates ring high and climb the chosen scale; returning to the original plays a low tone. Paragraph takes play a two-note chord.',
    instruments: VOICES,
    scales: Object.fromEntries(Object.entries(SCALES).map(([k, v]) => [k, v.name])),
    ambience: AMBIENCE,
    typingSounds: KEY_SOUNDS,
    controls: ['volume', 'key', 'register', 'ring length', 'brightness', 'reverb', 'room size', 'echo', 'stereo spread', 'human touch'],
  },
  style: {
    themes: ['midnight', 'paper', 'dusk', 'phosphor', 'riso', 'ink', 'fog'],
    typefaces: ['IBM Plex Mono', 'JetBrains Mono', 'Courier Prime', 'Newsreader', 'Literata', 'Inter', 'Atkinson Hyperlegible'],
    underlines: ['editor’s pen (seeded, slightly wavy)', 'double pen', 'highlighter', 'straight', 'dotted', 'none'],
    textures: ['grain', 'paper', 'stars', 'scan lines', 'none'],
    presets: ['editors-pen', 'beach-house', 'night-terminal', 'manuscript', 'riso-zine', 'deep-focus'],
  },
  boundaries: {
    storage: 'browser localStorage only',
    accounts: false,
    upload: false,
    network: 'none after page load (fonts from Google Fonts)',
    ai: false,
  },
  methods: ['GET'],
  sideEffects: 'none',
};

export const GET: APIRoute = () => new Response(JSON.stringify(payload, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
