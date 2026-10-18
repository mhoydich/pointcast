/**
 * Morning Edition mail, Pages side: the edition_subscribers rows behind
 * /api/morning/subscribe, /confirm and /unsubscribe, the handoff to the
 * morning-daily Worker, and the plain page the unsubscribe route answers with
 * (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5).
 *
 * Every statement is one string literal followed by .bind(. Nothing here logs
 * an address or returns one: callers get a state name, a boolean or a status
 * code. A signup never deletes a row, whether or not mail is on; the Worker
 * sends the confirm mail later for rows that have none yet.
 */
// @ts-ignore — plain module shared with the Worker and the tests
import { SIGNUP_COPY, TOKEN_RE, escapeHtml, newToken } from './edition-mail.mjs';

export type MorningMailEnv = {
  AUTH_DB?: D1Database;
  /** Service binding to the morning-daily Worker; absent until that Worker is deployed. */
  MORNING_DAILY?: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
  MORNING_INTERNAL_KEY?: string;
};

/** What a signup did to the row: 'confirmed' wrote nothing, 'pending' left a live row alone. */
export type SignupOutcome = 'confirmed' | 'pending' | 'reset' | 'reopened' | 'created';

const HANDOFF_URL = 'https://morning-daily.internal/send-confirm';
const HANDOFF_TIMEOUT_MS = 8_000;

/* ---------- subscribe ---------- */

type StateRow = { status: string; confirm_expires_at: number | null };

/**
 * The §5.2 step 5 state machine. Throws on any D1 error (the route answers 503).
 * confirmed: nothing. pending: a lapsed confirm link is cleared so the Worker
 * sends a fresh one; a live one stays. unsubscribed: back to pending under a
 * new unsubscribe token. none: a new pending row.
 */
export async function recordSignup(
  db: D1Database,
  o: { email: string; source: string; userId: string | null; now: number },
): Promise<SignupOutcome> {
  const row = await db.prepare('SELECT status, confirm_expires_at FROM edition_subscribers WHERE email = ?')
    .bind(o.email).first<StateRow>();
  if (row?.status === 'confirmed') return 'confirmed';
  if (row?.status === 'pending') {
    if (row.confirm_expires_at !== null && row.confirm_expires_at !== undefined && row.confirm_expires_at < o.now) {
      await db.prepare("UPDATE edition_subscribers SET confirm_hash = NULL, confirm_expires_at = NULL, confirm_sent_at = NULL WHERE email = ? AND status = 'pending'").bind(o.email).run();
      return 'reset';
    }
    return 'pending';
  }
  if (row?.status === 'unsubscribed') {
    await db.prepare("UPDATE edition_subscribers SET status = 'pending', token = ?, source = ?, unsubscribed_at = NULL, confirm_hash = NULL, confirm_expires_at = NULL, confirm_sent_at = NULL, confirmed_at = NULL, last_sent_day = NULL WHERE email = ?").bind(newToken(), o.source, o.email).run();
    return 'reopened';
  }
  // OR IGNORE: two signups for one address landing together make one row.
  await db.prepare("INSERT OR IGNORE INTO edition_subscribers (email, status, token, source, user_id, created_at) VALUES (?, 'pending', ?, ?, ?, ?)").bind(o.email, newToken(), o.source, o.userId, o.now).run();
  return 'created';
}

/**
 * Ask the morning-daily Worker to send the confirm mail now. True when mail is
 * on: the Worker sent it, sent one under a minute ago, or (for an address that
 * is already confirmed, where it sends nothing) answered "not pending", which
 * it only does after checking its mail sender. False for no binding or key, a
 * throw, a non-2xx, or anything else. The only thing ever logged is the status.
 */
export async function handoffConfirm(env: MorningMailEnv, email: string): Promise<boolean> {
  const key = env.MORNING_INTERNAL_KEY;
  if (!env.MORNING_DAILY || typeof key !== 'string' || key === '') return false;
  try {
    const res = await env.MORNING_DAILY.fetch(HANDOFF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Morning-Key': key },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(HANDOFF_TIMEOUT_MS),
    });
    if (res.status < 200 || res.status > 299) {
      console.warn(JSON.stringify({ message: 'morning confirm handoff failed', status: res.status }));
      return false;
    }
    const body = (await res.json().catch(() => null)) as { sent?: unknown; reason?: unknown } | null;
    if (body?.sent === true) return true;
    return body?.sent === false && (body.reason === 'recent' || body.reason === 'not-pending');
  } catch {
    console.warn(JSON.stringify({ message: 'morning confirm handoff failed', status: 'error' }));
    return false;
  }
}

export const signupBody = (mailOn: boolean) => {
  const status = mailOn ? 'check-email' : 'on-list';
  return { ok: true, status, message: SIGNUP_COPY[status] };
};

/* ---------- confirm ---------- */

/** True when a pending row held this confirm hash and the link had not lapsed; the row is now confirmed. */
export async function confirmByHash(db: D1Database, hash: string, now: number): Promise<boolean> {
  const row = await db.prepare("UPDATE edition_subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, ?), confirm_hash = NULL, confirm_expires_at = NULL WHERE confirm_hash = ? AND status = 'pending' AND confirm_expires_at > ? RETURNING status").bind(now, hash, now).first<{ status: string }>();
  return row !== null && row !== undefined;
}

/* ---------- unsubscribe ---------- */

export const validToken = (t: unknown): t is string => typeof t === 'string' && TOKEN_RE.test(t);

export async function tokenExists(db: D1Database, token: string): Promise<boolean> {
  const row = await db.prepare('SELECT status FROM edition_subscribers WHERE token = ?').bind(token).first<{ status: string }>();
  return row !== null && row !== undefined;
}

export async function unsubscribeByToken(db: D1Database, token: string, now: number): Promise<void> {
  await db.prepare("UPDATE edition_subscribers SET status = 'unsubscribed', unsubscribed_at = ?, confirm_hash = NULL, confirm_expires_at = NULL WHERE token = ?").bind(now, token).run();
}

/** The plain page the unsubscribe route answers with (chrome as in functions/api/collect/unsubscribe.ts). `inner` is trusted HTML built here. */
export function unsubscribePage(heading: string, status: number, inner = ''): Response {
  const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Morning Edition email</title><body style="margin:0;background:#f6efe5;color:#171717;font:18px/1.5 Arial,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:28px;border:1px solid #171717;background:#fff"><p style="font:12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a2432">PointCast · Morning Edition</p><h1>${escapeHtml(heading)}</h1>${inner}<p><a href="/morning">Back to the Morning Edition</a></p></main></body></html>`;
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** The GET page: one POST form. The token was checked against TOKEN_RE, so it is safe in an attribute. */
export function unsubscribeForm(token: string): Response {
  const action = `/api/morning/unsubscribe?t=${escapeHtml(token)}`;
  const inner = `<form method="post" action="${action}"><p><button type="submit" style="font:inherit;padding:10px 16px;border:1.5px solid #171717;background:#fff;cursor:pointer">Unsubscribe from the Morning Edition</button></p></form>`;
  return unsubscribePage('Stop the Morning Edition email?', 200, inner);
}
