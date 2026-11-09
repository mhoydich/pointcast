/**
 * POST /api/communicator/games/:id/invite  (session tier 2, the host only; a consent-effect send)
 * Records the host's okay, invites the game's stored candidates (consent re-checked), queues Messages, hands them to the adapter.
 * -> { ok, game, sent, held, refused } · 409 consent-required|bad-state · 403 not-your-game · 401 · 503
 */
import { postInvite } from '../../../../_lib/communicator-flow.ts';
import type { FlowEnv } from '../../../../_lib/communicator-flow.ts';

export const onRequestPost: PagesFunction<FlowEnv> = async ({ request, env, params }) =>
  postInvite({ request, env }, String(params.id || ''));
