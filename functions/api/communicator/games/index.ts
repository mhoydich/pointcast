/**
 * POST /api/communicator/games  { request, slot, candidates: [handle] }  (session, tier 2)
 * -> { ok, game }  The slot must be one proposeSlots offers now; candidates must be consenting, listed-or-not
 * profiles on the ladder. 400 bad-slot|bad-candidates · 409 profile-required · 403 · 401 · 503
 */
import schedule from '../../../../src/data/courts-schedule.json';
import { postGame } from '../../../_lib/communicator-http.ts';
import { venuesFromSchedule, type CommunicatorEnv } from '../../../_lib/communicator-store.ts';

export const onRequestPost: PagesFunction<CommunicatorEnv> = async ({ request, env }) =>
  postGame({ request, env, venues: venuesFromSchedule(schedule) });
