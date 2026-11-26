/**
 * GET /api/communicator/games/:id  (session; the host or a player on the roster)
 * -> { ok, game }  Names, never contacts. 404 not-found · 403 not-your-game · 401 · 503
 */
import schedule from '../../../../src/data/courts-schedule.json';
import { getGameRoute } from '../../../_lib/communicator-http.ts';
import { venuesFromSchedule, type CommunicatorEnv } from '../../../_lib/communicator-store.ts';

export const onRequestGet: PagesFunction<CommunicatorEnv> = async ({ request, env, params }) =>
  getGameRoute({ request, env, venues: venuesFromSchedule(schedule) }, String(params.id || ''));
