import { OAUTH_STATE_TTL_SECONDS, secureEqual } from '../_oauth.ts';
import {
  IdentityConflictError, consumeAuthState, hasFreshAuthentication, issueSession,
  readSessionFromRequest, withSessionCookie,
} from '../session.ts';
import {
  X_CALLBACK_PATH, X_STATE_PREFIX, XAccountLinkedError, saveXIdentity,
  xBrowserToken, xReady, xCookie, xIdentity, xRedirect, type XStateRecord,
} from './_shared.ts';

interface XToken { access_token?: unknown; token_type?: unknown }

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ request, env }) => {
  let returnTo = '/me';
  const fail = (reason: string) => xRedirect(request, returnTo, 'auth_error', reason);
  if (!await xReady(env)) return fail('x-not-configured');
  const url = new URL(request.url);
  const state = url.searchParams.get('state') ?? '';
  const browserToken = xBrowserToken(request);
  // Verify the browser binding before consuming state so a callback URL cannot
  // sign a different browser into the attacker's account or consume its flow.
  if (!/^[a-zA-Z0-9_-]{43}$/u.test(state) || !/^[a-zA-Z0-9_-]{43}$/u.test(browserToken)) {
    return fail('x-state-invalid');
  }
  try {
    // Atomic DELETE RETURNING is mandatory for X; do not use the KV fallback.
    const stateRow = await env.AUTH_DB.prepare('SELECT payload FROM oauth_states WHERE state = ? AND expires_at > ?')
      .bind(`${X_STATE_PREFIX}${state}`, Date.now()).first<{ payload: string }>();
    if (!stateRow) return fail('x-state-expired');
    const pending = JSON.parse(stateRow.payload) as XStateRecord;
    if (pending.origin !== url.origin || !await secureEqual(browserToken, pending.browserToken)) {
      return fail('x-state-invalid');
    }
    const flow = await consumeAuthState<XStateRecord>({ AUTH_DB: env.AUTH_DB }, `${X_STATE_PREFIX}${state}`);
    if (!flow) return fail('x-state-expired');
    returnTo = flow.returnTo;
    const age = Date.now() - Date.parse(flow.createdAt);
    if (!Number.isFinite(age) || age < 0 || age > OAUTH_STATE_TTL_SECONDS * 1000) return fail('x-state-expired');
    const current = await readSessionFromRequest(request, env);
    if ((current?.session.sessionToken ?? null) !== flow.sessionToken
      || (current?.user.userId ?? null) !== flow.currentUserId) return fail('x-session-changed');
    if (flow.intent === 'link' && (!current || !await hasFreshAuthentication(env, current.session))) {
      return fail('x-fresh-sign-in-required');
    }
    if (url.searchParams.has('error')) return fail('x-denied');
    const code = url.searchParams.get('code');
    if (!code || code.length > 2048) return fail('x-missing-callback');
    const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({ code, grant_type: 'authorization_code',
        redirect_uri: `${flow.origin}${X_CALLBACK_PATH}`, code_verifier: flow.codeVerifier }),
    });
    const token: XToken = await tokenResponse.json<XToken>().catch(() => ({}));
    if (!tokenResponse.ok || typeof token.access_token !== 'string' || !token.access_token
      || token.token_type?.toString().toLowerCase() !== 'bearer') return fail('x-token-failed');
    const profileResponse = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url', {
      headers: { Authorization: `Bearer ${token.access_token}` },
      redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
    if (!profileResponse.ok) return fail('x-profile-failed');
    const identity = xIdentity(await profileResponse.json().catch(() => null));
    if (!identity) return fail('x-profile-failed');
    // Tokens never enter users, sessions, logs, or browser responses. This grant
    // is identity verification only, with no offline, posting, or DM permission.
    const user = await saveXIdentity(env.AUTH_DB, identity, flow.intent === 'link' ? flow.currentUserId : null);
    const session = await issueSession(env, user.userId);
    const response = withSessionCookie(xRedirect(request, returnTo, 'auth', flow.intent === 'link' ? 'x-linked' : 'x'), session);
    response.headers.append('Set-Cookie', xCookie('', 0));
    return response;
  } catch (error) {
    if (error instanceof IdentityConflictError) return fail('x-already-linked');
    if (error instanceof XAccountLinkedError) return fail('x-account-already-linked');
    return fail('x-verification-failed');
  }
};
