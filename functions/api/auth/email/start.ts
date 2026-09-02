import {
  authJson,
  consumeAuthState,
  hasAuthStorage,
  readSessionFromRequest,
  writeAuthState,
} from '../session.ts';
import {
  EMAIL_FROM,
  EMAIL_TOKEN_TTL_SECONDS,
  createEmailToken,
  emailReturnTo,
  emailTokenKey,
  enforceEmailRateLimit,
  magicEmail,
  magicLink,
  normalizeEmail,
  type EmailAuthEnv,
  type EmailMagicState,
} from './_shared.ts';

export const onRequestPost: PagesFunction<EmailAuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, provider: 'email', reason: 'auth-storage-not-configured' }, { status: 503 });
  }
  if (!env.SEND_EMAIL) {
    return authJson({
      ok: false,
      provider: 'email',
      reason: 'email-sign-in-not-configured',
      message: 'Email sign-in is not configured yet.',
    }, { status: 503 });
  }

  let body: { email?: unknown; returnTo?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  if (!email) return authJson({ ok: false, reason: 'invalid-email' }, { status: 400 });

  const ip = request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
  const rate = await enforceEmailRateLimit(env, email, ip);
  if (rate.allowed === false) {
    return authJson({ ok: false, reason: rate.reason, retryAfterSeconds: rate.retryAfterSeconds }, {
      status: rate.reason === 'rate-limit-not-configured' ? 503 : 429,
      headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  const current = await readSessionFromRequest(request, env);
  const token = createEmailToken();
  const key = await emailTokenKey(token);
  const state: EmailMagicState = {
    email,
    returnTo: emailReturnTo(body.returnTo),
    currentUserId: current?.user.userId ?? null,
    issuedAt: new Date().toISOString(),
  };
  await writeAuthState(env, key, state, EMAIL_TOKEN_TTL_SECONDS);

  const link = magicLink(token);
  const content = magicEmail(link);
  try {
    await env.SEND_EMAIL.send({
      to: email,
      from: { email: EMAIL_FROM, name: 'PointCast' },
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  } catch (error) {
    await consumeAuthState(env, key);
    console.error(JSON.stringify({
      message: 'email magic-link send failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return authJson({ ok: false, reason: 'email-send-failed' }, { status: 502 });
  }

  return authJson({
    ok: true,
    provider: 'email',
    message: 'Check your email for a sign-in link.',
    expiresInSeconds: EMAIL_TOKEN_TTL_SECONDS,
  }, { status: 202 });
};
