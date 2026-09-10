import { OAUTH_STATE_TTL_SECONDS, randomUrlSafeString, safeReturnTo } from './_oauth.ts';
import { authJson, hasFreshAuthentication, readSessionFromRequest, writeAuthState } from './session.ts';
import {
  X_CALLBACK_PATH, X_SCOPES, X_STATE_PREFIX, pkceChallenge, removeXIdentity,
  xReady, xCookie, xRedirect, type XStateRecord,
} from './x/_shared.ts';

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  if (url.searchParams.get('status') === '1') {
    return authJson({ ok: true, provider: 'x', available: await xReady(env) });
  }
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'));
  if (!await xReady(env)) return xRedirect(request, returnTo, 'auth_error', 'x-not-configured');
  if (url.protocol !== 'https:') return xRedirect(request, returnTo, 'auth_error', 'x-secure-origin-required');
  const intent = url.searchParams.get('intent') ?? 'login';
  if (intent !== 'login' && intent !== 'link') return xRedirect(request, returnTo, 'auth_error', 'x-invalid-intent');
  try {
    const current = await readSessionFromRequest(request, env);
    if (intent === 'link' && !current) return xRedirect(request, returnTo, 'auth_error', 'x-sign-in-required');
    if (intent === 'link' && current && !await hasFreshAuthentication(env, current.session)) {
      return xRedirect(request, returnTo, 'auth_error', 'x-fresh-sign-in-required');
    }
    const state = randomUrlSafeString();
    const browserToken = randomUrlSafeString();
    const codeVerifier = randomUrlSafeString(48);
    const stateRecord: XStateRecord = {
      browserToken, codeVerifier, returnTo, origin: url.origin, intent,
      currentUserId: current?.user.userId ?? null,
      sessionToken: current?.session.sessionToken ?? null,
      createdAt: new Date().toISOString(),
    };
    await writeAuthState(env, `${X_STATE_PREFIX}${state}`, stateRecord, OAUTH_STATE_TTL_SECONDS);
    const target = new URL('https://x.com/i/oauth2/authorize');
    target.search = new URLSearchParams({
      response_type: 'code', client_id: env.X_CLIENT_ID!,
      redirect_uri: `${url.origin}${X_CALLBACK_PATH}`, scope: X_SCOPES, state,
      code_challenge: await pkceChallenge(codeVerifier), code_challenge_method: 'S256',
    }).toString();
    return new Response(null, { status: 302, headers: {
      Location: target.toString(), 'Set-Cookie': xCookie(browserToken),
      'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer',
    } });
  } catch {
    return xRedirect(request, returnTo, 'auth_error', 'x-start-failed');
  }
};

export const onRequestDelete: PagesFunction<Cloudflare.Env> = async ({ request, env }) => {
  if (!env.AUTH_DB) return authJson({ ok: false, reason: 'd1-not-bound' }, { status: 503 });
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return authJson({ ok: false, reason: 'cross-origin-request' }, { status: 403 });
  }
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
    if (!await hasFreshAuthentication(env, current.session)) {
      return authJson({ ok: false, reason: 'fresh-sign-in-required' }, { status: 403 });
    }
    const body = await request.json().catch(() => null) as { id?: unknown } | null;
    if (!body || typeof body.id !== 'string' || !/^\d{1,25}$/u.test(body.id)) {
      return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
    }
    if (!current.user.identities.some((identity) => identity.provider === 'x' && identity.id === body.id)) {
      return authJson({ ok: false, reason: 'x-not-linked' }, { status: 404 });
    }
    if (!await removeXIdentity(env.AUTH_DB, current.user.userId, body.id)) {
      return authJson({ ok: false, reason: 'x-last-sign-in-method' }, { status: 409 });
    }
    return authJson({ ok: true, removed: body.id });
  } catch {
    return authJson({ ok: false, reason: 'x-disconnect-failed' }, { status: 500 });
  }
};
