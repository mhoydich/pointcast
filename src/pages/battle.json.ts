/**
 * /battle.json — machine-readable Nouns Battler state.
 *
 * Because the actual battle is client-side + localStorage, the build-time
 * feed surfaces only the invariants: today's Card of the Day, the
 * deterministic stat derivation formula (as doc + reference to the lib
 * file), type matchup table, stance rules. Agents can reproduce any
 * battle from two seed ids.
 */
import type { APIRoute } from 'astro';
import { BATTLER_TYPES, seedToStats } from '../lib/battler/stat-derivation';

const CARD_OF_THE_DAY = 137;

export const GET: APIRoute = async () => {
  const card = seedToStats(CARD_OF_THE_DAY);

  const payload = {
    $schema: 'https://pointcast.xyz/BLOCKS.md#battler',
    channel: 'BTL',
    url: 'https://pointcast.xyz/battle',
    cardOfTheDay: {
      seedId: CARD_OF_THE_DAY,
      stats: card,
      nounImage: `https://noun.pics/${CARD_OF_THE_DAY}.svg`,
    },
    rules: {
      format: 'best-of-3',
      stances: ['STRIKE', 'GUARD', 'FOCUS'],
      stanceMatchups: {
        STRIKE: 'beats FOCUS',
        FOCUS: 'beats GUARD',
        GUARD: 'beats STRIKE',
      },
      types: BATTLER_TYPES,
      typeMatchups: {
        WATER: 'beats BEAM',
        BEAM: 'beats ARMOR',
        ARMOR: 'beats WILD',
        WILD: 'beats WATER',
        FEAST: 'neutral vs. all',
      },
      statFormula: {
        ATK: '50 + head-contrib + accessory-contrib ± 2 (body parity)',
        DEF: '50 + body-contrib + bg-contrib',
        SPD: '50 + glasses-contrib - 0.5 * body-contrib',
        FOC: '50 + accessory-contrib + (glasses % 7 === 0 ? +8 : 0)',
        HP: '80 + DEF * 0.4',
        clamp: 'all stats [1, 99]',
      },
      source: 'https://github.com/MikeHoydich/pointcast/blob/main/src/lib/battler/stat-derivation.ts',
    },
    docs: {
      design: 'https://github.com/MikeHoydich/pointcast/blob/main/docs/codex-logs/2026-04-17-nouns-battler-design.md',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
