import { readSessionFromRequest } from '../auth/session.ts';
import { hasDirectorDeskAccess } from '../../../src/lib/director-access.ts';
import {
  body,
  failure,
  id,
  json,
  MeError,
  ownOrigin,
  type MeEnv,
  type MeSessionReader,
} from './_library.ts';
export async function handleModerate(
  request: Request,
  env: MeEnv,
  readSession: MeSessionReader = readSessionFromRequest,
): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method))
    return json({ ok: false, reason: 'method-not-allowed' }, 405);
  try {
    if (request.method !== 'GET' && !ownOrigin(request)) throw new MeError(403, 'cross-site');
    const session = await readSession(request, env);
    if (!session) throw new MeError(401, 'unauthorized');
    if (!hasDirectorDeskAccess(session)) throw new MeError(403, 'forbidden');
    if (!env.AUTH_DB) throw new MeError(503, 'unavailable');
    if (request.method === 'GET')
      return json({
        ok: true,
        reports: (
          await env.AUTH_DB.prepare(
            'SELECT id,resource_type,resource_id,reason,created_at FROM me_reports ORDER BY created_at DESC LIMIT 100',
          ).all()
        ).results,
      });
    const data = await body(request);
    const resource = id(data.id);
    if (!['hide', 'release'].includes(String(data.action)))
      throw new MeError(400, 'invalid-action');
    const hidden = data.action === 'hide' ? 1 : 0;
    const sql =
      data.type === 'collection'
        ? 'UPDATE me_collections SET hidden=?,published_json=NULL,published_at=NULL,version=version+1 WHERE id=?'
        : data.type === 'profile'
          ? 'UPDATE me_profiles SET hidden=?,published_json=NULL,published_at=NULL,version=version+1 WHERE public_id=?'
          : null;
    if (!sql) throw new MeError(400, 'invalid-type');
    const result = await env.AUTH_DB.prepare(sql).bind(hidden, resource).run();
    if (!result.meta.changes) throw new MeError(404, 'not-found');
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export const onRequest: PagesFunction<MeEnv> = ({ request, env }) => handleModerate(request, env);
