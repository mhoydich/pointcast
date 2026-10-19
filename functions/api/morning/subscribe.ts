/**
 * POST /api/morning/subscribe {email, source?} — the Morning Edition by email,
 * step one of a double opt-in (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5.2).
 *
 * Stores a pending edition_subscribers row and answers 202. When the
 * MORNING_DAILY service binding and MORNING_INTERNAL_KEY exist it asks the
 * morning-daily Worker to send the confirmation now ('check-email'); without
 * them the row waits and the Worker mails it later ('on-list'). A row is
 * never deleted because mail is off. The answer is the same shape for an
 * address that is already confirmed, and never carries the email.
 *
 * 403 bad-origin · 415 · 413 · 400 bad-json | invalid-email · 429 email-rate-limited
 * | ip-rate-limited · 503 store-unavailable | rate-limit-not-configured
 */
import { readSessionFromRequest } from '../auth/session.ts';
import { enforceEmailRateLimit, type EmailAuthEnv } from '../auth/email/_shared.ts';
import { fail, json, readPost, unavailable, type AirEnv } from '../../_lib/air-store.ts';
import { handoffConfirm, recordSignup, signupBody, type MorningMailEnv } from '../../_lib/morning-mail-store.ts';
// @ts-ignore — plain module shared with the Worker and the tests
import { normalizeEmail, parseSource } from '../../_lib/edition-mail.mjs';

type Env = AirEnv & EmailAuthEnv & MorningMailEnv;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const post = await readPost(request);
  if ('refused' in post) return post.refused;
  const input = (post.body && typeof post.body === 'object' ? post.body : {}) as { email?: unknown; source?: unknown };
  const email: string | null = normalizeEmail(input.email);
  if (!email) return fail('invalid-email', 400);
  const source: string = parseSource(input.source);
  const db = env.AUTH_DB;
  if (!db) return unavailable();

  const ip = request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
  const rate = await enforceEmailRateLimit(env, email, ip);
  if (rate.allowed === false) {
    if (rate.reason === 'rate-limit-not-configured') return fail(rate.reason, 503, { retryAfter: rate.retryAfterSeconds });
    return json({ ok: false, reason: rate.reason, retryAfter: rate.retryAfterSeconds }, 429, { 'Retry-After': String(rate.retryAfterSeconds) });
  }

  let userId: string | null = null;
  try { userId = (await readSessionFromRequest(request, env))?.user.userId ?? null; } catch { /* a broken session is nobody */ }

  try {
    await recordSignup(db, { email, source, userId, now: Date.now() });
  } catch {
    return unavailable();
  }

  const mailOn = await handoffConfirm(env, email);
  return json(signupBody(mailOn), 202);
};
