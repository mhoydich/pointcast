/**
 * /api/catan/seat — take or give up a seat at a hosted table.
 * POST { id, handle, leave? } → { ok, table }
 * Budget: 12 seat changes per IP per 10 minutes. The host cannot leave
 * their own table (cancel it instead).
 */
import { cleanHandle } from '../../../src/lib/catan.ts';
import {
  catanJson, catanOptions, loadTables, overBudget, publicTable, readBody, saveTables, type CatanEnv,
} from '../../_lib/catan-store.ts';

export const onRequestOptions = catanOptions;

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the table store is offline' }, 503);
  const body = await readBody(request, 1024);
  if (!body) return catanJson({ ok: false, error: 'send a JSON object' }, 400);
  const handle = cleanHandle(body.handle);
  if (!handle || /(https?:\/\/|www\.)/i.test(handle)) return catanJson({ ok: false, error: 'handle is required (32 characters max, no links)' }, 400);
  if (await overBudget(env.VISITS, request, 'seat', 12)) return catanJson({ ok: false, error: 'too many seat changes; try again in a few minutes' }, 429);
  const tables = await loadTables(env.VISITS);
  const t = tables.find((x) => x.id === String(body.id ?? ''));
  if (!t) return catanJson({ ok: false, error: 'no such table (it may have finished)' }, 404);
  const has = t.seated.some((s) => s.toLowerCase() === handle.toLowerCase());
  if (body.leave) {
    if (!has) return catanJson({ ok: false, error: 'that handle is not seated here' }, 404);
    if (handle.toLowerCase() === t.host.toLowerCase()) return catanJson({ ok: false, error: 'the host holds the table; cancel it with your hostKey instead' }, 409);
    t.seated = t.seated.filter((s) => s.toLowerCase() !== handle.toLowerCase());
  } else {
    if (has) return catanJson({ ok: true, table: publicTable(t), note: 'already seated' });
    if (t.seated.length >= t.seats) return catanJson({ ok: false, error: 'the table is full' }, 409);
    t.seated.push(handle);
  }
  await saveTables(env.VISITS, tables);
  return catanJson({ ok: true, table: publicTable(t) });
};
