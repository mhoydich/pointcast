/**
 * /nouns-wood-chop.json - machine-readable manifest for the Nouns Wood Chop game.
 */
import type { APIRoute } from 'astro';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Wood Chop Commons',
  status: 'playable browser prototype v3',
  human: 'https://pointcast.xyz/nouns-wood-chop',
  image: 'https://pointcast.xyz/images/nouns-wood-chop/pixel-woodlot.svg',
  intent: 'A pixel collect loop for PointCast where visitors choose a Noun helper, chop, complete orders, charge helper moves, bank bundles, plant seeds, and unlock local Nouns-themed stamps.',
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
      'choose one of four animated Noun helpers before chopping',
      'tap or press Space to chop the active pixel tree',
      'each chop spends one energy and adds wood',
      'fast rhythm builds a streak and improves wood yield',
      'helper skills can add rhythm wood, crit wood, seed drops, or banking energy',
      'eight chops charge a Noun Burst that grants bonus wood and seeds',
      'six chops charge a helper move with a helper-specific reward animation',
      'small orders track useful behaviors such as chopping, banking, planting, and trying helpers',
      'tree health reaches zero and the tree falls into extra wood and seeds',
      'bank twelve wood into one bundle',
      'spend seeds to plant a new tree and recover energy',
      'unlock Nouns-themed local stamps at bundle milestones',
    ],
    helpers: [
      { id: 'cypress', noun: 313, label: 'Cypress Noun 313', skill: 'Rhythm chop', effect: '+1 wood on every fourth streak' },
      { id: 'pine', noun: 523, label: 'Blue Pine Noun 523', skill: 'Sharp axe', effect: 'higher crit chance' },
      { id: 'palm', noun: 742, label: 'Beach Palm Noun 742', skill: 'Seed scout', effect: 'better seed drops' },
      { id: 'oak', noun: 1042, label: 'Commons Oak Noun 1042', skill: 'Bundle keeper', effect: '+1 energy when banking' },
    ],
    helperMoves: [
      { helper: 'cypress', name: 'Rhythm Riff', charge: 'six chops', reward: '+6 wood and +2 Noun Burst' },
      { helper: 'pine', name: 'Double Crit', charge: 'six chops', reward: '+10 wood and extra tree damage' },
      { helper: 'palm', name: 'Seed Rain', charge: 'six chops', reward: '+2 seeds and +3 energy' },
      { helper: 'oak', name: 'Commons Haul', charge: 'six chops', reward: '+8 wood and +3 energy' },
    ],
    orders: [
      { id: 'warm-up', label: 'Warm-up chops', metric: 'totalChops', target: 10, reward: '+8 wood' },
      { id: 'first-bank', label: 'Bank the commons', metric: 'bundles', target: 1, reward: '+1 seed' },
      { id: 'plant-care', label: 'Plant care', metric: 'plants', target: 2, reward: '+6 energy' },
      { id: 'crew-check', label: 'Meet the crew', metric: 'helperVisits', target: 3, reward: '+12 wood' },
    ],
    resources: [
      { id: 'wood', label: 'Wood', unit: 'pieces', source: 'chops and felled trees' },
      { id: 'bundles', label: 'Bundles', unit: 'banked bundles', source: 'twelve wood per bundle' },
      { id: 'seeds', label: 'Seeds', unit: 'seeds', source: 'tree drops and planting loop' },
      { id: 'energy', label: 'Energy', unit: 'chops remaining', source: 'rest, bank bundles, plant seeds' },
      { id: 'helperMove', label: 'Helper move', unit: 'charge', source: 'six chops' },
    ],
    stamps: [
      { id: 'first-bundle', label: 'First Bundle', unlockBundles: 1 },
      { id: 'commons-carpenter', label: 'Commons Carpenter', unlockBundles: 3 },
      { id: 'noggles-forester', label: 'Noggles Forester', unlockBundles: 5 },
      { id: 'woodlot-keeper', label: 'Woodlot Keeper', unlockBundles: 8 },
    ],
    storage: {
      gameState: 'localStorage: pc:nouns-wood-chop:v1 (v3-compatible extended state)',
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
