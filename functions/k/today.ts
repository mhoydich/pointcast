import type { AuthIdentity } from '../../src/lib/auth/types';
import {
  issueSession,
  upsertUserForIdentity,
  withSessionCookie,
} from '../api/auth/session.ts';
import {
  findSubscriberByToken,
  requireCollectDb,
  validBearerToken,
  type CollectEnv,
} from '../api/collect/_shared.ts';

function collectRedirect(request: Request, key?: string, value?: string): Response {
  const target = new URL('/collect', request.url);
  target.searchParams.set('claim', '1');
  if (key && value) target.searchParams.set(key, value);
  return Response.redirect(target.toString(), 302);
}

export const onRequestGet: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  if (!validBearerToken(token)) return collectRedirect(request, 'collect_error', 'daily-link-invalid');
  const db = requireCollectDb(env);
  if (!db) return collectRedirect(request, 'collect_error', 'not-configured');
  const subscriber = await findSubscriberByToken(db, token);
  if (!subscriber || subscriber.status !== 'confirmed') {
    return collectRedirect(request, 'collect_error', 'daily-link-invalid');
  }
  const identity: AuthIdentity = {
    provider: 'email',
    id: subscriber.email,
    name: 'Kennel Club collector',
    verifiedAt: subscriber.confirmed_at ?? new Date().toISOString(),
  };
  const user = await upsertUserForIdentity(env, identity);
  if (subscriber.user_id !== user.userId) {
    await db.prepare('UPDATE subscribers SET user_id = ? WHERE email = ?')
      .bind(user.userId, subscriber.email)
      .run();
  }
  const session = await issueSession(env, user.userId);
  return withSessionCookie(collectRedirect(request, 'from', 'daily-email'), session);
};

