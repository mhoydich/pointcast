import type { AuthIdentity, AuthRole } from '../../../../src/lib/auth/types';
import { appendResult, secureEqual } from '../_oauth.ts';
import {
  IdentityConflictError,
  authJson,
  consumeAuthState,
  hasAuthStorage,
  issueSession,
  readSessionFromRequest,
  upsertUserForIdentity,
  withSessionCookie,
} from '../session.ts';
import {
  EMAIL_TOKEN_TTL_SECONDS,
  emailTokenKey,
  type EmailAuthEnv,
  type EmailMagicState,
} from './_shared.ts';

function callbackRedirect(request: Request, returnTo: string, key: string, value: string): Response {
  const target = appendResult(returnTo, key, value);
  return Response.redirect(new URL(target, request.url).toString(), 302);
}

export const onRequestGet: PagesFunction<EmailAuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) {
    return authJson({ ok: false, provider: 'email', reason: 'auth-storage-not-configured' }, { status: 503 });
  }
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!/^[A-Za-z0-9_-]{40,128}$/u.test(token)) {
    return callbackRedirect(request, '/me', 'auth_error', 'email-link-invalid');
  }

  const state = await consumeAuthState<EmailMagicState>(env, await emailTokenKey(token));
  if (!state) return callbackRedirect(request, '/me', 'auth_error', 'email-link-expired-or-used');
  const issuedAt = Date.parse(state.issuedAt);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > EMAIL_TOKEN_TTL_SECONDS * 1000) {
    return callbackRedirect(request, state.returnTo, 'auth_error', 'email-link-expired-or-used');
  }

  const identity: AuthIdentity = {
    provider: 'email',
    id: state.email,
    name: state.email,
    verifiedAt: new Date().toISOString(),
  };
  const broadcasterEmail = env.POINTCAST_BROADCAST_EMAIL?.trim().toLowerCase() ?? '';
  const roles: AuthRole[] = broadcasterEmail && await secureEqual(state.email, broadcasterEmail)
    ? ['broadcaster']
    : [];
  const current = state.currentUserId
    ? await readSessionFromRequest(request, env)
    : null;
  const linkToUserId = current?.user.userId === state.currentUserId
    ? state.currentUserId
    : null;

  try {
    const user = await upsertUserForIdentity(env, identity, {
      // Never link on the strength of the email token alone. The callback must
      // still carry the exact session that initiated an account-linking flow;
      // otherwise a forwarded link signs in the email owner independently.
      currentUserId: linkToUserId,
      roles,
    });
    const session = await issueSession(env, user.userId);
    return withSessionCookie(
      callbackRedirect(request, state.returnTo, 'auth', 'email'),
      session,
    );
  } catch (error) {
    if (error instanceof IdentityConflictError) {
      return callbackRedirect(request, state.returnTo, 'auth_error', 'email-already-linked');
    }
    return callbackRedirect(request, state.returnTo, 'auth_error', 'email-sign-in-failed');
  }
};
