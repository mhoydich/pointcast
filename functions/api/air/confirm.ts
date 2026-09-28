/**
 * POST /api/air/confirm — "Still 1–4 waiting?" Yes, Changed, or Can't say.
 *
 * { reportId, verdict: 'still'|'changed'|'cant', device, code? }
 * → 200 { ok, onsite, reading, today, award, claim, next: 'report' | null }
 *   `onsite` is false when the confirm counts for nothing: no valid code, or
 *   the reporter's own network without a different signed-in account.
 *   `next` is 'report' after 'changed': show the four buttons.
 *   400 own-report | bad-* · 404 not-found · 409 already-confirmed (with reading)
 *   410 expired (past the decay window of the report, or of its newest
 *   on-site "still", whichever is later) · 429 · 503
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
// @ts-ignore — plain module shared with the tests
import { parseConfirm } from '../../_lib/air-kinds.mjs';
import { confirmReport, fail, readPost, unavailable, type AirEnv, type ParsedConfirm } from '../../_lib/air-store.ts';

export const onRequestPost: PagesFunction<AirEnv> = async ({ request, env, waitUntil }) => {
  const read = await readPost(request);
  if ('refused' in read) return read.refused;
  const parsed = parseConfirm(read.body) as ParsedConfirm | { reason: string };
  if ('reason' in parsed) return fail(parsed.reason);
  if (!env.AUTH_DB) return unavailable();
  try {
    return await confirmReport(request, env, env.AUTH_DB, AIR_CONFIG, parsed, Date.now(), waitUntil);
  } catch {
    return unavailable();
  }
};
