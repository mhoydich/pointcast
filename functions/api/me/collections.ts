import { readSessionFromRequest } from '../auth/session.ts';
import {
  body,
  collection,
  collectionView,
  failure,
  id,
  json,
  liveKeepIds,
  members,
  MeError,
  newId,
  owner,
  previewToken,
  safePreview,
  selectSnapshot,
  snapshot,
  text,
  version,
  type MeEnv,
  type MeSessionReader,
  type Member,
  type CollectionRow,
} from './_library.ts';

export async function handleCollections(
  request: Request,
  env: MeEnv,
  readSession: MeSessionReader = readSessionFromRequest,
): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method))
    return json({ ok: false, reason: 'method-not-allowed' }, 405);
  try {
    const { db, userId } = await owner(request, env, readSession);
    if (request.method === 'GET') {
      const rows = (
        await db
          .prepare('SELECT * FROM me_collections WHERE user_id=? ORDER BY updated_at DESC,id')
          .bind(userId)
          .all<CollectionRow>()
      ).results;
      const live = await liveKeepIds(db, userId);
      return json({ ok: true, userId, collections: rows.map((row) => collectionView(row, live)) });
    }
    const input = await body(request);
    const now = new Date().toISOString();
    if (input.action === 'create') {
      const collectionId = newId('col');
      const title = text(input.title, 80, true);
      const description = text(input.description ?? '', 500);
      const items = await members(db, userId, input.items ?? [], []);
      try {
        await db
          .prepare(
            'INSERT INTO me_collections(id,user_id,title,description,items_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
          )
          .bind(collectionId, userId, title, description, JSON.stringify(items), now, now)
          .run();
      } catch (e) {
        if (String(e).includes('collection-limit'))
          throw new MeError(409, 'collection-limit', 'You can keep up to 50 collections.');
        throw e;
      }
      return json({
        ok: true,
        userId,
        collection: collectionView(
          await collection(db, userId, collectionId),
          await liveKeepIds(db, userId),
        ),
      });
    }
    const row = await collection(db, userId, id(input.id));
    const expected = version(input.version);
    if (row.version !== expected)
      throw new MeError(
        409,
        'conflict',
        'This collection changed elsewhere. Reload before trying again.',
      );
    if (input.action === 'delete') {
      const result = await db
        .prepare('DELETE FROM me_collections WHERE id=? AND user_id=? AND version=?')
        .bind(row.id, userId, expected)
        .run();
      if (!result.meta.changes) throw new MeError(409, 'conflict');
      return json({ ok: true, userId });
    }
    let result: D1Result;
    if (input.action === 'update') {
      const title = text(input.title ?? row.title, 80, true),
        description = text(input.description ?? row.description, 500);
      const selected =
        input.items === undefined
          ? (JSON.parse(row.items_json) as Member[])
          : await members(db, userId, input.items, JSON.parse(row.items_json));
      result = await db
        .prepare(
          'UPDATE me_collections SET title=?,description=?,items_json=?,version=version+1,updated_at=? WHERE id=? AND user_id=? AND version=?',
        )
        .bind(title, description, JSON.stringify(selected), now, row.id, userId, expected)
        .run();
    } else if (input.action === 'unpublish') {
      result = await db
        .prepare(
          'UPDATE me_collections SET published_json=NULL,published_at=NULL,version=version+1,updated_at=? WHERE id=? AND user_id=? AND version=?',
        )
        .bind(now, row.id, userId, expected)
        .run();
    } else if (input.action === 'preview' || input.action === 'publish') {
      if (row.hidden)
        throw new MeError(403, 'moderated', 'This collection is unavailable for public display.');
      // Validate only selected members: private links can remain in the draft.
      const rawMembers = JSON.parse(row.items_json) as Member[];
      if (!Array.isArray(input.selectedKeepIds)) throw new MeError(400, 'selection-required');
      const selectedRow = {
        ...row,
        items_json: JSON.stringify(
          rawMembers.filter(
            (m) =>
              input.selectedKeepIds instanceof Array && input.selectedKeepIds.includes(m.keepId),
          ),
        ),
      };
      const value = selectSnapshot(await snapshot(db, selectedRow), row, input.selectedKeepIds);
      const token = await previewToken({ id: row.id, version: expected, value });
      if (input.action === 'preview')
        return json({ ok: true, userId, preview: safePreview(value), previewToken: token });
      if (input.previewToken !== token)
        throw new MeError(
          409,
          'preview-changed',
          'Your collection changed. Preview it again before publishing.',
        );
      result = await db
        .prepare(
          'UPDATE me_collections SET published_json=?,published_at=?,version=version+1,updated_at=? WHERE id=? AND user_id=? AND version=? AND hidden=0',
        )
        .bind(JSON.stringify(value), now, now, row.id, userId, expected)
        .run();
    } else throw new MeError(400, 'invalid-action');
    if (!result.meta.changes) throw new MeError(409, 'conflict');
    return json({
      ok: true,
      userId,
      collection: collectionView(
        await collection(db, userId, row.id),
        await liveKeepIds(db, userId),
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
export const onRequest: PagesFunction<MeEnv> = ({ request, env }) =>
  handleCollections(request, env);
