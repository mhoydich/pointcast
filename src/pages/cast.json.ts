import type { APIRoute } from 'astro';
import {
  PRIZE_CAST_FIRST_DRAW_PLACEHOLDER,
  PRIZE_CAST_PENDING_MESSAGE,
  getPrizeCastContractAddress,
  getPrizeCastSnapshot,
  getPrizeCastTzktUrl,
} from '../lib/prize-cast';

export const GET: APIRoute = async () => {
  const snapshot = await getPrizeCastSnapshot();
  const kt1 = getPrizeCastContractAddress();

  const payload = snapshot.live
    ? {
        name: 'Prize Cast',
        status: snapshot.fetchError ? 'degraded' : 'live',
        contract: {
          mainnet: kt1,
          tzktUrl: getPrizeCastTzktUrl(kt1),
        },
        tvlMutez: snapshot.tvlMutez,
        tvlTez: snapshot.tvlTez,
        principalMutez: snapshot.principalMutez,
        principalTez: snapshot.principalTez,
        prizePoolMutez: snapshot.prizePoolMutez,
        prizePoolTez: snapshot.prizePoolTez,
        participantCount: snapshot.participantCount,
        accumulatedSince: snapshot.accumulatedSince,
        nextDrawAt: snapshot.nextDrawAt,
        drawCadenceBlocks: snapshot.drawCadenceBlocks,
        last10Winners: snapshot.winners,
        fetchError: snapshot.fetchError,
      }
    : {
        name: 'Prize Cast',
        status: 'pending_contract',
        contract: {
          mainnet: '',
          tzktUrl: null,
        },
        message: PRIZE_CAST_PENDING_MESSAGE,
        nextDrawAt: snapshot.nextDrawAt,
        last10Winners: [],
        placeholder: {
          pastWinners: PRIZE_CAST_FIRST_DRAW_PLACEHOLDER,
        },
      };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=30',
    },
  });
};
