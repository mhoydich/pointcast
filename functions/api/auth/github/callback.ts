import { OAUTH_STATE_TTL_SECONDS, secureEqual } from '../_oauth.ts';
import {
  IdentityConflictError, consumeAuthState, hasFreshAuthentication, issueSession,
  readAuthState, readSessionFromRequest, upsertUserForIdentity, withSessionCookie,
} from '../session.ts';
import {
  GITHUB_CALLBACK_PATH, GITHUB_STATE_PREFIX, githubBrowserToken, githubCookie,
  githubIdentity, githubJson, githubReady, githubRedirect, type GitHubStateRecord,
} from './_shared.ts';

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ request, env }) => {
  let returnTo = '/me';
  const fail = (reason: string) => githubRedirect(request, returnTo, 'auth_error', reason);
  if (!await githubReady(env)) return fail('github-not-configured');
  const url = new URL(request.url);
  const state = url.searchParams.get('state') ?? '';
  const browserToken = githubBrowserToken(request);
  if (url.protocol !== 'https:' || !/^[A-Za-z0-9_-]{43}$/u.test(state)
    || !/^[A-Za-z0-9_-]{43}$/u.test(browserToken)) return fail('github-state-invalid');
  try {
    const auth = { AUTH_DB: env.AUTH_DB };
    const pending = await readAuthState<GitHubStateRecord>(auth, `${GITHUB_STATE_PREFIX}${state}`);
    if (!pending) return fail('github-state-expired');
    // Check the browser before consuming the flow: a forwarded callback URL
    // must not sign a different browser into the initiating user's GitHub.
    if (pending.origin !== url.origin || typeof pending.browserToken !== 'string'
      || !await secureEqual(browserToken, pending.browserToken)) return fail('github-state-invalid');
    const flow = await consumeAuthState<GitHubStateRecord>(auth, `${GITHUB_STATE_PREFIX}${state}`);
    if (!flow) return fail('github-state-expired');
    returnTo = flow.returnTo;
    const age = Date.now() - Date.parse(flow.createdAt);
    if (!Number.isFinite(age) || age < 0 || age > OAUTH_STATE_TTL_SECONDS * 1000) return fail('github-state-expired');
    if (!/^[A-Za-z0-9_-]{64}$/u.test(flow.codeVerifier)
      || (flow.intent !== 'login' && flow.intent !== 'link')) return fail('github-state-invalid');
    const current = await readSessionFromRequest(request, env);
    if ((current?.session.sessionToken ?? null) !== flow.sessionToken
      || (current?.user.userId ?? null) !== flow.currentUserId) return fail('github-session-changed');
    if (flow.intent === 'link' && (!current || !await hasFreshAuthentication(env, current.session))) return fail('github-fresh-sign-in-required');
    if (url.searchParams.has('error')) return fail('github-denied');
    const code = url.searchParams.get('code');
    if (!code || code.length > 2048) return fail('github-missing-callback');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID!, client_secret: env.GITHUB_CLIENT_SECRET!, code,
        redirect_uri: `${flow.origin}${GITHUB_CALLBACK_PATH}`, code_verifier: flow.codeVerifier,
      }),
    });
    const token = await githubJson(tokenResponse);
    if (!tokenResponse.ok || typeof token.access_token !== 'string' || !token.access_token
      || typeof token.token_type !== 'string' || token.token_type.toLowerCase() !== 'bearer') return fail('github-token-failed');
    // An existing OAuth grant may carry broader scopes. Reject it rather than
    // silently accepting repository, email, or offline permissions for sign-in.
    if (typeof token.scope !== 'string' || token.scope.trim() !== '') return fail('github-scope-mismatch');
    const profileResponse = await fetch('https://api.github.com/user', {
      redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json',
        'User-Agent': 'PointCast-Authentication', 'X-GitHub-Api-Version': '2026-03-10',
      },
    });
    if (!profileResponse.ok) { await profileResponse.body?.cancel(); return fail('github-profile-failed'); }
    const identity = githubIdentity(await githubJson(profileResponse));
    if (!identity) return fail('github-profile-failed');
    // Stable provider ID is the only account lookup. No email-based linking,
    // provider token storage, repository calls, or broadcaster role grants.
    const user = await upsertUserForIdentity(auth, identity, {
      currentUserId: flow.intent === 'link' ? flow.currentUserId : null,
    });
    const session = await issueSession(auth, user.userId);
    const response = withSessionCookie(githubRedirect(request, returnTo, 'auth', flow.intent === 'link' ? 'github-linked' : 'github'), session);
    response.headers.append('Set-Cookie', githubCookie('', 0));
    return response;
  } catch (error) {
    if (error instanceof IdentityConflictError) return fail('github-already-linked');
    return fail('github-verification-failed');
  }
};
