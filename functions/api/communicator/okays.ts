/**
 * POST /api/communicator/okays  { kind: 'request'|'invite'|'remind'|'score'|'confirm-score', targetGame? }  (session, tier 1)
 * -> { ok, okay: { id, expiresAt } }  The person's own okay for a bot's action on their behalf; good for 10 minutes.
 * 400 bad-json|bad-request · 401 · 409 profile-required · 503 db-not-bound
 */
import schedule from '../../../src/data/courts-schedule.json';
import { postOkay } from '../../_lib/communicator-http.ts';
import { venuesFromSchedule, type CommunicatorEnv } from '../../_lib/communicator-store.ts';

export const onRequestPost: PagesFunction<CommunicatorEnv> = async ({ request, env }) =>
  postOkay({ request, env, venues: venuesFromSchedule(schedule) });
