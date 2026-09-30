/**
 * /api/catan/cancel — the host removes their table. POST { id, hostKey }.
 */
import { sha256Hex } from '../../../src/lib/catan.ts';
import { catanJson, catanOptions, loadTables, overBudget, readBody, saveTables, type CatanEnv } from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the table store is offline' }, 503);
  const body = await readBody(request, 1024);
  if (!body || typeof body.hostKey !== 'string') return catanJson({ ok: false, error: 'send {id, hostKey}' }, 400);
  if (await overBudget(env.VISITS, request, 'cancel', 10)) return catanJson({ ok: false, error: 'too many attempts' }, 429);
  const tables = await loadTables(env.VISITS);
  const t = tables.find((x) => x.id === String(body.id ?? ''));
  if (!t) return catanJson({ ok: false, error: 'no such table' }, 404);
  if ((await sha256Hex(`catan-hostkey:${body.hostKey}`)) !== t.hostKeyHash) return catanJson({ ok: false, error: 'hostKey does not match' }, 403);
  await saveTables(env.VISITS, tables.filter((x) => x.id !== t.id));
  return catanJson({ ok: true, cancelled: t.id });
};
