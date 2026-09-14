import { OAUTH_STATE_TTL_SECONDS, randomUrlSafeString, safeReturnTo } from './_oauth.ts';
import { authJson, hasFreshAuthentication, readSessionFromRequest, writeAuthState } from './session.ts';
import {
  GITHUB_CALLBACK_PATH, GITHUB_STATE_PREFIX, githubCookie, githubPkceChallenge,
  githubReady, githubRedirect, type GitHubStateRecord,
} from './github/_shared.ts';

export const onRequestGet: PagesFunction<Cloudflare.Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  if (url.searchParams.get('status') === '1') {
    return authJson({ ok: true, provider: 'github', available: await githubReady(env) });
  }
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'));
  const fail = (reason: string) => githubRedirect(request, returnTo, 'auth_error', reason);
  if (!await githubReady(env)) return fail('github-not-configured');
  if (url.protocol !== 'https:') return fail('github-secure-origin-required');
  const intent = url.searchParams.get('intent') ?? 'login';
  if (intent !== 'login' && intent !== 'link') return fail('github-invalid-intent');
  try {
    const current = await readSessionFromRequest(request, env);
    if (intent === 'link' && !current) return fail('github-sign-in-required');
    if (intent === 'link' && current && !await hasFreshAuthentication(env, current.session)) return fail('github-fresh-sign-in-required');
    const state = randomUrlSafeString();
    const browserToken = randomUrlSafeString();
    const codeVerifier = randomUrlSafeString(48);
    const flow: GitHubStateRecord = {
      browserToken, codeVerifier, origin: url.origin, returnTo, intent,
      currentUserId: current?.user.userId ?? null,
      sessionToken: current?.session.sessionToken ?? null, createdAt: new Date().toISOString(),
    };
    // GitHub always uses atomic D1 state consumption; no legacy KV fallback.
    await writeAuthState({ AUTH_DB: env.AUTH_DB }, `${GITHUB_STATE_PREFIX}${state}`, flow, OAUTH_STATE_TTL_SECONDS);
    const target = new URL('https://github.com/login/oauth/authorize');
    target.search = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID!, redirect_uri: `${url.origin}${GITHUB_CALLBACK_PATH}`,
      scope: '', state, code_challenge: await githubPkceChallenge(codeVerifier),
      code_challenge_method: 'S256', prompt: 'select_account',
    }).toString();
    return new Response(null, { status: 302, headers: {
      Location: target.toString(), 'Set-Cookie': githubCookie(browserToken),
      'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer',
    } });
  } catch { return fail('github-start-failed'); }
};
