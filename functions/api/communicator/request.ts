/**
 * POST /api/communicator/request  { text, ladder?, seed? }  (session, tier 2)
 * -> { ok, complete, request, missing, slots, candidates }  candidates are public projections only.
 * Stores nothing. 400 bad-json|bad-request · 401 · 403 tier-2-required · 404 unknown-ladder · 503 db-not-bound
 */
import schedule from '../../../src/data/courts-schedule.json';
import { postRequest } from '../../_lib/communicator-http.ts';
import { venuesFromSchedule, type CommunicatorEnv } from '../../_lib/communicator-store.ts';

export const onRequestPost: PagesFunction<CommunicatorEnv> = async ({ request, env }) =>
  postRequest({ request, env, venues: venuesFromSchedule(schedule) });
