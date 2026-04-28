/**
 * /nouns-nation-battler.json - machine-readable manifest for the 30v30 Nouns auto-battler.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Nation Battler',
  status: 'playable browser prototype v3',
  human: 'https://pointcast.xyz/nouns-nation-battler',
  playable: 'https://pointcast.xyz/games/nouns-nation-battler/index.html',
  image: 'https://pointcast.xyz/images/og/battle.png',
  intent: 'A watchable Nouns auto-battler where rotating gangs fight 30 vs 30 on an open field.',
  game: {
    genre: 'auto battler',
    matchSize: '30 vs 30',
    mode: 'fully automated watch mode',
    controls: ['new match', 'pause/resume', 'auto-next', 'slow/live/rush speed', 'root left', 'root right'],
    unitRoles: ['runner', 'bonker', 'slinger', 'captain', 'healer'],
    advancedMoves: ['Breakaway dash', 'Noggles slam', 'Auction volley', 'Quorum rally', 'Emergency mint'],
    systems: ['morale', 'cooldowns', 'healing', 'gang surges', 'status effects', 'center-field control', 'persistent local season stats', 'rooting preference'],
  },
  nounsAssets: {
    source: 'Local nouns-assets image-data plus Nouns buildSVG renderer',
    sprites: 60,
    spriteManifest: 'https://pointcast.xyz/games/nouns-nation-battler/assets/manifest.json',
    localPublicPath: '/games/nouns-nation-battler/assets/',
    note: 'Each battler sprite is generated from official Nouns bodies, accessories, heads, glasses, backgrounds, and palette data.',
  },
  brandKits: [
    { gang: 'Tomato Noggles', short: 'TN', colors: ['#e45745', '#ffe987', '#8f241c'], mark: 'split tomato noggles' },
    { gang: 'Cobalt Frames', short: 'CF', colors: ['#3677e0', '#9bc7ff', '#183f8f'], mark: 'blue square lenses' },
    { gang: 'Golden Nouncil', short: 'GN', colors: ['#d49b19', '#fff0a6', '#74520e'], mark: 'council coin' },
    { gang: 'Garden Stack', short: 'GS', colors: ['#3f9b54', '#b8f2bf', '#1f5b2e'], mark: 'stacked leaf' },
    { gang: 'Pixel Union', short: 'PU', colors: ['#8b5cf6', '#e0d2ff', '#4d2ba8'], mark: 'union pixel' },
    { gang: 'Night Auction', short: 'NA', colors: ['#2f3a4f', '#cfd7ef', '#141927'], mark: 'midnight paddle' },
    { gang: 'Sunset Prop House', short: 'SP', colors: ['#ef7d2d', '#ffd2a8', '#8b4213'], mark: 'sunset ballot' },
    { gang: 'Mint Condition', short: 'MC', colors: ['#13a6a1', '#b7fff4', '#08615e'], mark: 'fresh mint stamp' },
  ],
  caveats: [
    'Stats and rooting records are local browser state only.',
    'The game is client-side and does not transmit match stats.',
    'Nouns trait artwork is CC0 public-domain visual grammar.',
  ],
  links: {
    human: 'https://pointcast.xyz/nouns-nation-battler',
    playable: 'https://pointcast.xyz/games/nouns-nation-battler/index.html',
    spriteManifest: 'https://pointcast.xyz/games/nouns-nation-battler/assets/manifest.json',
    battleChannel: 'https://pointcast.xyz/c/btl',
    pointcast: 'https://pointcast.xyz/',
  },
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
