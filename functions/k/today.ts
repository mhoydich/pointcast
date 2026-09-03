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

/**
 * A bare /k/today is the short link the room prints ("/k/today →"), and it is
 * meant to land on the plate that is sitting right now. Pages prefers this
 * static route over functions/k/[slug].ts, so that redirect has to live here
 * too — otherwise the room's own link drops visitors on an invalid-daily-link
 * error. Resolved per request, never at build; the import is deferred so this
 * module stays loadable without JSON import attributes.
 */
async function todaySittingRedirect(request: Request): Promise<Response> {
  const { losAngelesDate, sittingOfTheDay } = await import('../../src/lib/kennel-club');
  const sitting = sittingOfTheDay(losAngelesDate());
  return Response.redirect(new URL(`/kennel-club/${sitting.slug}`, request.url).toString(), 302);
}

export const onRequestGet: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  if (!token) return todaySittingRedirect(request);
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

