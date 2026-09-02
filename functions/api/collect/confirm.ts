import type { AuthIdentity } from '../../../src/lib/auth/types';
import {
  COLLECT_CONFIRM_TTL_SECONDS,
} from '../../../src/lib/collect-email.ts';
import {
  IdentityConflictError,
  consumeAuthState,
  issueSession,
  readSessionFromRequest,
  upsertUserForIdentity,
  withSessionCookie,
} from '../auth/session.ts';
import {
  collectConfirmKey,
  requireCollectDb,
  validBearerToken,
  type CollectConfirmState,
  type CollectEnv,
} from './_shared.ts';

function redirect(request: Request, key: string, value: string): Response {
  const target = new URL('/collect', request.url);
  target.searchParams.set(key, value);
  return Response.redirect(target.toString(), 302);
}

export const onRequestGet: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const db = requireCollectDb(env);
  if (!db) return redirect(request, 'collect_error', 'not-configured');
  const token = new URL(request.url).searchParams.get('token') ?? '';
  if (!validBearerToken(token)) return redirect(request, 'collect_error', 'confirmation-invalid');
  const state = await consumeAuthState<CollectConfirmState>(env, await collectConfirmKey(token));
  if (!state) return redirect(request, 'collect_error', 'confirmation-expired-or-used');
  const issuedAt = Date.parse(state.issuedAt);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > COLLECT_CONFIRM_TTL_SECONDS * 1000) {
    return redirect(request, 'collect_error', 'confirmation-expired-or-used');
  }

  const subscriber = await db.prepare('SELECT token FROM subscribers WHERE email = ?')
    .bind(state.email)
    .first<{ token: string }>();
  if (!subscriber) return redirect(request, 'collect_error', 'subscriber-not-found');
  const active = state.currentUserId ? await readSessionFromRequest(request, env) : null;
  const currentUserId = active?.user.userId === state.currentUserId ? state.currentUserId : null;
  const identity: AuthIdentity = {
    provider: 'email',
    id: state.email,
    name: 'Kennel Club collector',
    verifiedAt: new Date().toISOString(),
  };

  try {
    const user = await upsertUserForIdentity(env, identity, { currentUserId });
    await db.prepare(`
      UPDATE subscribers
      SET status = 'confirmed', user_id = ?, confirmed_at = COALESCE(confirmed_at, ?)
      WHERE email = ?
    `).bind(user.userId, new Date().toISOString(), state.email).run();
    const session = await issueSession(env, user.userId);
    const target = new URL('/collect', request.url);
    target.searchParams.set('confirmed', '1');
    target.searchParams.set('claim', '1');
    return withSessionCookie(Response.redirect(target.toString(), 302), session);
  } catch (error) {
    return redirect(
      request,
      'collect_error',
      error instanceof IdentityConflictError ? 'email-already-linked' : 'confirmation-failed',
    );
  }
};
