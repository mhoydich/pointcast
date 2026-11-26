/**
 * GET /api/communicator/me  (session) -> { ok, profile|null, tier, games, messages }  your own full profile.
 * PUT /api/communicator/me  (session) availability, venues, consent, channels, ladders[ladder].declared, display only.
 *   Any contact field -> 400 contact-not-editable; contact.email comes from the verified email identity.
 */
import schedule from '../../../src/data/courts-schedule.json';
import { getMe, putMe } from '../../_lib/communicator-http.ts';
import { venuesFromSchedule, type CommunicatorEnv } from '../../_lib/communicator-store.ts';

export const onRequestGet: PagesFunction<CommunicatorEnv> = async ({ request, env }) =>
  getMe({ request, env, venues: venuesFromSchedule(schedule) });
export const onRequestPut: PagesFunction<CommunicatorEnv> = async ({ request, env }) =>
  putMe({ request, env, venues: venuesFromSchedule(schedule) });
