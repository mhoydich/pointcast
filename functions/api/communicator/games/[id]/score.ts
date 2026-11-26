/**
 * POST /api/communicator/games/:id/score  { sides: [[handle..],[handle..]], scoreA, scoreB }  (session; a player in the game)
 * -> { ok, game, ledger: [{id,status}], sent, held, refused } · 409 bad-state · 403 not-your-game · 401 · 503
 */
import { postScore } from '../../../../_lib/communicator-flow.ts';
import type { FlowEnv } from '../../../../_lib/communicator-flow.ts';

export const onRequestPost: PagesFunction<FlowEnv> = async ({ request, env, params }) =>
  postScore({ request, env }, String(params.id || ''));
