import { readSessionFromRequest } from '../auth/session.ts';
import {
  body,
  failure,
  id,
  json,
  MeError,
  ownOrigin,
  text,
  type MeEnv,
  type MeSessionReader,
} from './_library.ts';
export async function handleReport(
  request: Request,
  env: MeEnv,
  readSession: MeSessionReader = readSessionFromRequest,
): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, reason: 'method-not-allowed' }, 405);
  try {
    if (!ownOrigin(request)) throw new MeError(403, 'cross-site');
    const session = await readSession(request, env);
    if (!session) throw new MeError(401, 'unauthorized');
    if (!env.AUTH_DB) throw new MeError(503, 'unavailable');
    const data = await body(request);
    if (!['collection', 'profile'].includes(String(data.type)))
      throw new MeError(400, 'invalid-type');
    const resource = id(data.id),
      reason = text(data.reason, 500, true),
      userId = session.user.userId;
    const now = new Date().toISOString(),
      since = new Date(Date.now() - 86400000).toISOString();
    const result = await env.AUTH_DB.prepare(
      `INSERT OR IGNORE INTO me_reports(id,resource_type,resource_id,reason,reporter_id,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM me_reports WHERE reporter_id=? AND created_at>?)<20`,
    )
      .bind(crypto.randomUUID(), data.type, resource, reason, userId, now, userId, since)
      .run();
    if (!result.meta.changes) {
      const existing = await env.AUTH_DB.prepare(
        'SELECT id FROM me_reports WHERE resource_type=? AND resource_id=? AND reporter_id=?',
      )
        .bind(data.type, resource, userId)
        .first();
      if (!existing) throw new MeError(429, 'report-limit', 'Please try again tomorrow.');
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export const onRequest: PagesFunction<MeEnv> = ({ request, env }) => handleReport(request, env);
