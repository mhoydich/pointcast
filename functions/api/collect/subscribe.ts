import {
  authJson,
  consumeAuthState,
  readSessionFromRequest,
  writeAuthState,
} from '../auth/session.ts';
import {
  createEmailToken,
  enforceEmailRateLimit,
  normalizeEmail,
} from '../auth/email/_shared.ts';
import {
  COLLECT_CONFIRM_TTL_SECONDS,
  COLLECT_EMAIL_FROM,
  COLLECT_TIME_ZONE,
  confirmationEmail,
  confirmationUrl,
} from '../../../src/lib/collect-email.ts';
import {
  collectConfirmKey,
  createSubscriberToken,
  requireCollectDb,
  type CollectConfirmState,
  type CollectEnv,
  type SubscriberRow,
} from './_shared.ts';

export const onRequestPost: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const db = requireCollectDb(env);
  if (!db) return authJson({ ok: false, reason: 'collect-db-not-configured' }, { status: 503 });
  if (!env.SEND_EMAIL) {
    return authJson({ ok: false, reason: 'collect-email-not-configured' }, { status: 503 });
  }

  let body: { email?: unknown; tz?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  if (!email) return authJson({ ok: false, reason: 'invalid-email' }, { status: 400 });
  const tz = typeof body.tz === 'string' && body.tz.length <= 64
    ? body.tz
    : COLLECT_TIME_ZONE;
  const ip = request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
  const rate = await enforceEmailRateLimit(env, email, ip);
  if (rate.allowed === false) {
    return authJson({ ok: false, reason: rate.reason, retryAfterSeconds: rate.retryAfterSeconds }, {
      status: rate.reason === 'rate-limit-not-configured' ? 503 : 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  const current = await readSessionFromRequest(request, env);
  const prior = await db.prepare(`
    SELECT email, user_id, status, token, created_at, confirmed_at, last_sent_day, tz
    FROM subscribers WHERE email = ?
  `).bind(email).first<SubscriberRow>();
  const subscriberToken = prior?.status === 'unsubscribed'
    ? createSubscriberToken()
    : prior?.token ?? createSubscriberToken();
  const createdAt = prior?.created_at ?? new Date().toISOString();
  const nextStatus = prior?.status === 'confirmed' ? 'confirmed' : 'pending';

  await db.prepare(`
    INSERT INTO subscribers (email, user_id, status, token, created_at, confirmed_at, last_sent_day, tz)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      user_id = COALESCE(subscribers.user_id, excluded.user_id),
      status = excluded.status,
      token = excluded.token,
      tz = excluded.tz
  `).bind(
    email,
    current?.user.userId ?? prior?.user_id ?? null,
    nextStatus,
    subscriberToken,
    createdAt,
    prior?.confirmed_at ?? null,
    prior?.last_sent_day ?? null,
    tz,
  ).run();

  const confirmToken = createEmailToken();
  const state: CollectConfirmState = {
    email,
    currentUserId: current?.user.userId ?? null,
    issuedAt: new Date().toISOString(),
  };
  const key = await collectConfirmKey(confirmToken);
  await writeAuthState(env, key, state, COLLECT_CONFIRM_TTL_SECONDS);
  const content = confirmationEmail(confirmationUrl(confirmToken));
  try {
    await env.SEND_EMAIL.send({
      to: email,
      from: { email: COLLECT_EMAIL_FROM, name: 'PointCast Kennel Club' },
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  } catch (error) {
    await consumeAuthState(env, key);
    console.error(JSON.stringify({
      message: 'collect confirmation send failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return authJson({ ok: false, reason: 'confirmation-send-failed' }, { status: 502 });
  }

  return authJson({
    ok: true,
    status: 'pending-confirmation',
    message: 'Check your email and confirm dog-a-day delivery.',
  }, { status: 202 });
};
