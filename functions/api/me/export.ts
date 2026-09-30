import { readSessionFromRequest } from '../auth/session.ts';
import {
  collectionView,
  failure,
  json,
  owner,
  profileView,
  type CollectionRow,
  type MeEnv,
  type MeSessionReader,
  type ProfileRow,
} from './_library.ts';
export async function handleExport(
  request: Request,
  env: MeEnv,
  readSession: MeSessionReader = readSessionFromRequest,
): Promise<Response> {
  if (request.method !== 'GET') return json({ ok: false, reason: 'method-not-allowed' }, 405);
  try {
    const { db, userId } = await owner(request, env, readSession);
    const [items, cols, profile] = await Promise.all([
      db
        .prepare('SELECT data_json,item_id,version FROM me_keeps WHERE user_id=?')
        .bind(userId)
        .all<{ data_json: string; item_id: string; version: number }>(),
      db.prepare('SELECT * FROM me_collections WHERE user_id=?').bind(userId).all<CollectionRow>(),
      db.prepare('SELECT * FROM me_profiles WHERE user_id=?').bind(userId).first<ProfileRow>(),
    ]);
    const live = new Set(items.results.map((item) => item.item_id));
    const response = json({
      schema: 'pointcast-me-export-v1',
      exportedAt: new Date().toISOString(),
      keeps: items.results.map((k) => ({
        ...JSON.parse(k.data_json),
        itemId: k.item_id,
        version: k.version,
      })),
      collections: cols.results.map((r) => ({
        ...collectionView(r, live),
        publishedSnapshot: r.published_json ? JSON.parse(r.published_json) : null,
      })),
      profile: profile
        ? {
            ...profileView(profile),
            publishedSnapshot: profile.published_json ? JSON.parse(profile.published_json) : null,
          }
        : null,
    });
    response.headers.set('Content-Disposition', 'attachment; filename="pointcast-me.json"');
    return response;
  } catch (e) {
    return failure(e);
  }
}
export const onRequest: PagesFunction<MeEnv> = ({ request, env }) => handleExport(request, env);
