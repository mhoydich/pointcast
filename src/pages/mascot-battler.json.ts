import type { APIRoute } from 'astro';
import {
  MASCOT_ARENAS,
  MASCOT_BATTLER,
  MASCOT_CARDS,
  MASCOT_CLASSES,
} from '../lib/mascot-battler';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...MASCOT_BATTLER,
  methodology: {
    locality: 'Editorial score for how specifically the mascot identity belongs to its home landscape and civic context.',
    legacy: 'Editorial score for accumulated football and institution memory.',
    myth: 'Editorial score for symbolic force, story, strangeness, and mascot-specific tradition.',
    form: 'Deterministic score derived from PointCast 25 Board 000 rank: max(46, 96 - rank × 2).',
    balance: 'Editorial play-balance score that keeps multiple deck strategies viable.',
    battle:
      'Three deterministic rounds compare place, lore, and Saturday force. Conference chemistry, creature instinct, arena weather, class edges, and a small set of published signature abilities modify the base scores.',
  },
  classes: MASCOT_CLASSES,
  arenas: MASCOT_ARENAS,
  cards: MASCOT_CARDS,
  sources:
    'Every card includes an official athletics source URL and PointCast check date. PointCast 25 current-form evidence is adjacent at /25 and /25.json.',
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
