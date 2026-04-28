/**
 * /nouns-nation-battler.json - machine-readable manifest for the 30v30 Nouns league auto-battler.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Nation Battler',
  status: 'playable browser prototype v10 crown rush',
  human: 'https://pointcast.xyz/nouns-nation-battler',
  playable: 'https://pointcast.xyz/games/nouns-nation-battler/index.html',
  tv: 'https://pointcast.xyz/nouns-nation-battler-tv',
  image: 'https://pointcast.xyz/images/og/battle.png',
  intent: 'A watchable Nouns auto-battler where numbered Nouns players and eight rotating gangs play a two-week 30 vs 30 league into a Nouns Bowl final, with scout cards, sim controls, Amplifier Rift and Crown Rush battle types, a 20-poster type-heavy Nouns series, savvy-review TV cast mode, and recaps.',
  game: {
    genre: 'auto battler',
    matchSize: '30 vs 30',
    mode: 'fully automated two-week league watch mode with Open Field, Amplifier Rift, and Crown Rush battle types plus fullscreen savvy-review TV cast',
    controls: ['next match', 'quick sim', 'sim day', 'pause/resume', 'auto-next', 'reset league', 'slow/live/rush speed', 'root left', 'root right', 'click Noun to scout', 'TV keyboard: space pause', 'TV keyboard: N next match', 'TV keyboard: Q quick sim', 'TV keyboard: D sim day', 'TV keyboard: R reset league'],
    league: {
      teams: 8,
      regularSeasonDays: 14,
      matchesPerDay: 4,
      format: 'double round-robin regular season, top four playoffs, Nouns Bowl final',
      persistence: 'localStorage only',
    },
    unitRoles: ['runner', 'bonker', 'slinger', 'captain', 'healer'],
    unitStats: ['visible player number', 'name', 'role', 'hp', 'hits', 'damage', 'healing', 'KOs', 'deaths', 'special moves', 'amplifier triggers'],
    battleTypes: ['Open Field Clash', 'Amplifier Rift', 'Crown Rush'],
    elements: ['Spark', 'Tide', 'Bloom', 'Shade'],
    advancedMoves: ['Breakaway dash', 'Noggles slam', 'Auction volley', 'Quorum rally', 'Emergency mint', 'Element amplifier overload'],
    systems: ['numbered rosters', 'scout cards', 'top performer roster list', 'quick simulation', 'day simulation', 'recent league recaps', 'live match stat leaders', 'fullscreen TV cast', 'watch-party story cards', 'Market Pulse card', 'MVP Watch card', 'Comeback Line card', 'broadcast scoreboard', 'QR handoff', 'keyboard cast controls', 'two-week schedule', 'standings', 'playoff bracket', 'Nouns Bowl champion', 'fan heat', 'morale', 'cooldowns', 'healing', 'gang surges', 'status effects', 'center-field control', 'amplifier rift field', 'elemental affinity lanes', 'amplifier overloads', 'crown rush field', 'center crown control', 'crown pressure pulses', '20-poster type-heavy Nouns series', 'persistent local season stats', 'rooting preference'],
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
    tv: 'https://pointcast.xyz/nouns-nation-battler-tv',
    tvDirect: 'https://pointcast.xyz/games/nouns-nation-battler/index.html?mode=tv',
    crownRush: 'https://pointcast.xyz/games/nouns-nation-battler/index.html?mode=tv&type=crown',
    posters: 'https://pointcast.xyz/nouns-nation-battler-posters',
    posterWall: 'https://pointcast.xyz/games/nouns-nation-battler/posters/',
    spriteManifest: 'https://pointcast.xyz/games/nouns-nation-battler/assets/manifest.json',
    prd: 'https://github.com/mhoydich/pointcast/blob/main/docs/prd/nouns-nation-battler-league.md',
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
