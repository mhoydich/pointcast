/**
 * /nouns-wood-chop.json - machine-readable manifest for the Nouns Wood Chop game.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Wood Chop Commons',
  status: 'playable browser prototype',
  human: 'https://pointcast.xyz/nouns-wood-chop',
  image: 'https://pointcast.xyz/images/nouns-wood-chop/pixel-woodlot.svg',
  intent: 'A pixel collect loop for PointCast where visitors chop, collect wood, bank bundles, plant seeds, and unlock local Nouns-themed stamps.',
  relationshipToPointCast: {
    playLayer: 'https://pointcast.xyz/play',
    passport: 'https://pointcast.xyz/passport',
    block: 'https://pointcast.xyz/b/0383',
    role: 'simple repeatable game mechanic for participation, collecting, and local receipts',
  },
  game: {
    genre: 'clicker collection',
    mode: 'single-player local browser state',
    mechanics: [
      'tap or press Space to chop the active pixel tree',
      'each chop spends one energy and adds wood',
      'fast rhythm builds a streak and improves wood yield',
      'tree health reaches zero and the tree falls into extra wood and seeds',
      'bank twelve wood into one bundle',
      'spend seeds to plant a new tree and recover energy',
      'unlock Nouns-themed local stamps at bundle milestones',
    ],
    resources: [
      { id: 'wood', label: 'Wood', unit: 'pieces', source: 'chops and felled trees' },
      { id: 'bundles', label: 'Bundles', unit: 'banked bundles', source: 'twelve wood per bundle' },
      { id: 'seeds', label: 'Seeds', unit: 'seeds', source: 'tree drops and planting loop' },
      { id: 'energy', label: 'Energy', unit: 'chops remaining', source: 'rest, bank bundles, plant seeds' },
    ],
    stamps: [
      { id: 'first-bundle', label: 'First Bundle', unlockBundles: 1 },
      { id: 'commons-carpenter', label: 'Commons Carpenter', unlockBundles: 3 },
      { id: 'noggles-forester', label: 'Noggles Forester', unlockBundles: 5 },
      { id: 'woodlot-keeper', label: 'Woodlot Keeper', unlockBundles: 8 },
    ],
    storage: {
      gameState: 'localStorage: pc:nouns-wood-chop:v1',
      passportStamp: 'localStorage: pc:passport:stamps[nouns-wood-chop]',
    },
  },
  caveats: [
    'Prototype scores, receipts, stamps, and bundles are local browser state only.',
    'No token value, investment promise, or on-chain mint is implied by this playable version.',
    'The route is designed to be Tezos-ready later if PointCast chooses to turn local receipts into formal collectibles.',
  ],
  links: {
    human: 'https://pointcast.xyz/nouns-wood-chop',
    manifest: 'https://pointcast.xyz/nouns-wood-chop.json',
    image: 'https://pointcast.xyz/images/nouns-wood-chop/pixel-woodlot.svg',
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
