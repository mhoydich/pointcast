/** Private member shelf. D1 rollout: legacy -> pause/drain -> 1. */
import { readSessionFromRequest } from './auth/session.ts';
import {
  editD1Keep, ensureKeepsMigrated, hasKeepsMigration, importD1Keeps,
  importLegacyKeeps, KEEPS_CAP, KEEPS_PREFIX, KeepsError, listD1Keeps,
  readLegacyKeeps, type KeepsEnv,
} from './me/_keeps-store.ts';
export { normalizeKeep, type Keep } from './me/_keeps-store.ts';

type SessionReader = (request: Request, env: KeepsEnv) => Promise<{ user: { userId: string } } | null>;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

function sameSite(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return false;
  const site = request.headers.get('Sec-Fetch-Site');
  return site ? site === 'same-origin' || site === 'none' : Boolean(origin);
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new KeepsError('invalid-json', 400);
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_000_000) { await reader.cancel(); throw new KeepsError('body-too-large', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('object required');
    return body as Record<string, unknown>;
  } catch { throw new KeepsError('invalid-json', 400); }
}

export async function handleKeeps(request: Request, env: KeepsEnv, readSession: SessionReader = readSessionFromRequest): Promise<Response> {
  if (!['GET', 'POST', 'DELETE', 'PATCH'].includes(request.method)) return json({ ok: false, reason: 'method-not-allowed' }, 405);
  if (request.method !== 'GET' && !sameSite(request)) return json({ ok: false, reason: 'cross-site' }, 403);
  if (request.method !== 'GET' && env.ME_KEEPS_D1 === 'pause') return json({ ok: false, reason: 'writes-paused' }, 503);
  let current: Awaited<ReturnType<SessionReader>>;
  try { current = await readSession(request, env); } catch { return json({ ok: false, reason: 'session-unavailable' }, 503); }
  if (!current) return json({ ok: false, reason: 'unauthorized' }, 401);
  const userId = current.user.userId;
  try {
    const useD1 = env.ME_KEEPS_D1 === '1' || await hasKeepsMigration(env, userId);
    const db = useD1 ? await ensureKeepsMigrated(env, userId) : null;
    const list = () => db ? listD1Keeps(db, userId) : readLegacyKeeps(env, userId);
    if (request.method === 'GET') return json({ ok: true, userId, importProtocol: 2, keeps: await list(), cap: KEEPS_CAP, storage: db ? 'd1' : 'legacy' });
    const body = await readBody(request);
    if ('expectedUserId' in body && body.expectedUserId !== userId) throw new KeepsError('account-changed', 409);
    let imported = {};
    if (request.method === 'DELETE') {
      if (typeof body.id !== 'string' || !body.id || body.id.length > 700) throw new KeepsError('invalid-id', 400);
      const hasVersion = 'version' in body, hasItemId = 'expectedItemId' in body;
      if ((hasVersion && (!Number.isSafeInteger(body.version) || Number(body.version) < 1)) ||
        (hasItemId && (typeof body.expectedItemId !== 'string' || !body.expectedItemId || body.expectedItemId.length > 80))) throw new KeepsError('invalid-delete', 400);
      if (db) {
        const result = await db.prepare(`DELETE FROM me_keeps WHERE user_id = ? AND id = ?${hasVersion ? ' AND version = ?' : ''}${hasItemId ? ' AND item_id = ?' : ''}`)
          .bind(userId, body.id, ...(hasVersion ? [body.version] : []), ...(hasItemId ? [body.expectedItemId] : [])).run();
        if ((hasVersion || hasItemId) && !result.meta.changes) throw new KeepsError('conflict', 409);
      }
      else {
        if (hasVersion || hasItemId) throw new KeepsError('conflict', 409);
        const items = (await readLegacyKeeps(env, userId)).filter((item) => item.id !== body.id);
        await env.VISITS!.put(KEEPS_PREFIX + userId, JSON.stringify({ items, updatedAt: new Date().toISOString() }));
      }
    } else if (request.method === 'PATCH') {
      if (!db) throw new KeepsError('edits-not-enabled');
      await editD1Keep(db, userId, body);
    } else imported = db ? await importD1Keeps(db, userId, body) : await importLegacyKeeps(env, userId, await readLegacyKeeps(env, userId), body);
    return json({ ok: true, userId, importProtocol: 2, keeps: await list(), cap: KEEPS_CAP, ...imported });
  } catch (error) {
    return json({ ok: false, userId, reason: error instanceof KeepsError ? error.reason : 'storage-unavailable' }, error instanceof KeepsError ? error.status : 503);
  }
}
export const onRequest: PagesFunction<KeepsEnv> = ({ request, env }) => handleKeeps(request, env);
