import { readSessionFromRequest } from '../auth/session.ts';
import {
  body,
  failure,
  json,
  MeError,
  newId,
  owner,
  previewToken,
  profileView,
  publicCollection,
  publicUrl,
  text,
  version,
  type MeEnv,
  type MeSessionReader,
  type ProfileDraft,
  type ProfileRow,
} from './_library.ts';

export async function handleProfile(
  request: Request,
  env: MeEnv,
  readSession: MeSessionReader = readSessionFromRequest,
): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method))
    return json({ ok: false, reason: 'method-not-allowed' }, 405);
  try {
    const { db, userId, session } = await owner(request, env, readSession);
    const now = new Date().toISOString();
    const initial: ProfileDraft = {
      name: (session.user.preferredName || 'PointCast member').slice(0, 80),
      bio: '',
      noun: 0,
      links: [],
      featured: [],
    };
    await db
      .prepare(
        'INSERT OR IGNORE INTO me_profiles(user_id,public_id,draft_json,updated_at) VALUES(?,?,?,?)',
      )
      .bind(userId, newId('page'), JSON.stringify(initial), now)
      .run();
    const read = () =>
      db.prepare('SELECT * FROM me_profiles WHERE user_id=?').bind(userId).first<ProfileRow>();
    const row = await read();
    if (!row) throw new MeError(503, 'unavailable');
    if (request.method === 'GET') return json({ ok: true, userId, profile: profileView(row) });
    const input = await body(request);
    const expected = version(input.version);
    if (expected !== row.version)
      throw new MeError(
        409,
        'conflict',
        'Your profile changed elsewhere. Reload before trying again.',
      );
    const old = JSON.parse(row.draft_json) as ProfileDraft;
    let result: D1Result;
    if (input.action === 'update') {
      const links = input.links ?? old.links,
        featured = input.featured ?? old.featured,
        noun = input.noun ?? old.noun;
      if (
        !Array.isArray(links) ||
        links.length > 8 ||
        !Array.isArray(featured) ||
        featured.length > 6 ||
        new Set(featured).size !== featured.length ||
        !Number.isInteger(noun) ||
        Number(noun) < 0 ||
        Number(noun) > 1199
      )
        throw new MeError(400, 'invalid-profile');
      for (const col of featured) {
        if (
          typeof col !== 'string' ||
          !(await db
            .prepare('SELECT id FROM me_collections WHERE user_id=? AND id=?')
            .bind(userId, col)
            .first())
        )
          throw new MeError(400, 'invalid-featured');
      }
      const value: ProfileDraft = {
        name: text(input.name ?? old.name, 80, true),
        bio: text(input.bio ?? old.bio, 280),
        noun: Number(noun),
        links: links.map((link) => {
          if (!link || typeof link !== 'object') throw new MeError(400, 'invalid-link');
          return { label: text(link.label, 60, true), url: publicUrl(link.url) };
        }),
        featured: featured as string[],
      };
      result = await db
        .prepare(
          'UPDATE me_profiles SET draft_json=?,version=version+1,updated_at=? WHERE user_id=? AND version=?',
        )
        .bind(JSON.stringify(value), now, userId, expected)
        .run();
    } else if (input.action === 'unpublish') {
      result = await db
        .prepare(
          'UPDATE me_profiles SET published_json=NULL,published_at=NULL,version=version+1,updated_at=? WHERE user_id=? AND version=?',
        )
        .bind(now, userId, expected)
        .run();
    } else if (input.action === 'preview' || input.action === 'publish') {
      if (row.hidden)
        throw new MeError(403, 'moderated', 'This profile is unavailable for public display.');
      const featured = [];
      for (const collectionId of old.featured) {
        if (
          !(await db
            .prepare('SELECT id FROM me_collections WHERE id=? AND user_id=?')
            .bind(collectionId, userId)
            .first())
        )
          throw new MeError(400, 'invalid-featured');
        try {
          const c = await publicCollection(db, collectionId);
          featured.push({
            title: c.title,
            description: c.description,
            url: c.url,
            count: c.items.length,
          });
        } catch (e) {
          if (e instanceof MeError && e.status === 404)
            throw new MeError(
              409,
              'private-featured',
              'Publish the featured collections before publishing this profile.',
            );
          throw e;
        }
      }
      const preview = { ...old, featured };
      const token = await previewToken({ id: row.public_id, version: expected, value: preview });
      if (input.action === 'preview')
        return json({ ok: true, userId, preview, previewToken: token });
      if (input.previewToken !== token)
        throw new MeError(409, 'preview-changed', 'Preview your profile before publishing.');
      result = await db
        .prepare(
          'UPDATE me_profiles SET published_json=?,published_at=?,version=version+1,updated_at=? WHERE user_id=? AND version=? AND hidden=0',
        )
        .bind(row.draft_json, now, now, userId, expected)
        .run();
    } else throw new MeError(400, 'invalid-action');
    if (!result.meta.changes) throw new MeError(409, 'conflict');
    return json({ ok: true, userId, profile: profileView((await read())!) });
  } catch (e) {
    return failure(e);
  }
}
export const onRequest: PagesFunction<MeEnv> = ({ request, env }) => handleProfile(request, env);
