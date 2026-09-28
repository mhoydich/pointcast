/**
 * /api/air/assign — Field Report Assignments (docs/plans/2026-09-28-field-assignments.md §3).
 * A template, a date and a seat count; the house creates, everyone fills by
 * filing a normal Field Report inside the window (the match happens in
 * fileReport, functions/_lib/air-store.ts). Points and a stamp, never cash.
 *
 * GET [?spot=] → { open: [{id, spot, label, question, startsAt, endsAt, seats,
 *   seatsLeft, reward, live}], canCreate, serverTime }. Public. A director
 *   session additionally gets `recent`: the last 14 days, voided too, with
 *   filler bylines and witnessed counts.
 * POST {action:'create', template, day, start?, seats?} | {action:'void', id, reason?}
 *   → 201 {ok, assignment} | 200 {ok} | 400 bad-* | 403 forbidden (not the
 *   director session, hasDirectorDeskAccess) | 404 not-found | 409 too-many-open
 *   403 bad-origin · 415 · 413 · 503 store-unavailable
 */
import { hasDirectorDeskAccess } from '../../../src/lib/director-access.ts';
import { AIR_CONFIG } from '../../../src/lib/air.ts';
import { readSessionFromRequest } from '../auth/session.ts';
// @ts-ignore — plain module shared with the tests
import { parseAssignPost } from '../../_lib/air-assign.mjs';
import {
  assignListPayload, createAssignment, fail, readPost, unavailable, voidAssignment, type AirEnv,
} from '../../_lib/air-store.ts';

export const onRequestGet: PagesFunction<AirEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB) return unavailable();
  const spot = new URL(request.url).searchParams.get('spot');
  let director = false;
  try {
    const session = await readSessionFromRequest(request, env);
    director = Boolean(session && hasDirectorDeskAccess(session));
  } catch { /* a broken session never blocks the public list */ }
  try {
    return await assignListPayload(env.AUTH_DB, AIR_CONFIG, spot, director, Date.now());
  } catch {
    return unavailable();
  }
};

export const onRequestPost: PagesFunction<AirEnv> = async ({ request, env }) => {
  const read = await readPost(request);
  if ('refused' in read) return read.refused;
  if (!env.AUTH_DB) return unavailable();
  const session = await readSessionFromRequest(request, env);
  if (!session || !hasDirectorDeskAccess(session)) return fail('forbidden', 403);
  const now = Date.now();
  const parsed = parseAssignPost(AIR_CONFIG, read.body, now) as
    | { action: 'create'; template: string; spot: string; kind: string; startsAt: number; endsAt: number; seats: number; reward: number }
    | { action: 'void'; id: string; voidReason: string | null }
    | { reason: string };
  if ('reason' in parsed) return fail(parsed.reason);
  try {
    return parsed.action === 'create'
      ? await createAssignment(env.AUTH_DB, AIR_CONFIG, parsed, `user:${session.user.userId}`, now)
      : await voidAssignment(env.AUTH_DB, parsed.id, parsed.voidReason, now);
  } catch {
    return unavailable();
  }
};
