/**
 * GET /api/communicator/ledger/:ladder.json  (public, Cache-Control max-age=60)
 * -> { ok, ladder, generatedAt, entries (confirmed only), ratings (publicRating per handle) }
 */
import { getLedger } from '../../../_lib/communicator-http.ts';
import type { CommunicatorEnv } from '../../../_lib/communicator-store.ts';

export const onRequestGet: PagesFunction<CommunicatorEnv> = async ({ request, env, params }) =>
  getLedger({ request, env, venues: [] }, String(params.ladder || ''));
