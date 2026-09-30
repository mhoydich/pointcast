/**
 * /api/catan/tables — the Hex & Harbor meetup board.
 *
 * GET  → { ok, tables (soonest first), count } · ?city= substring filter · ?id= one table
 * POST { title, city, venue, when, seats, edition, pace, host, note?, link? }
 *      → { ok, table, hostKey } — hostKey is shown once; it cancels the table.
 *
 * Open to people and agents alike. Budget: 3 new tables per IP per 10 minutes.
 */
import { validateTable } from '../../../src/lib/catan.ts';
import {
  catanJson, catanOptions, loadTables, overBudget, publicTable, randomId, randomSecret, readBody, saveTables,
  type CatanEnv, type StoredTable,
} from '../../_lib/catan-store.ts';
import { sha256Hex } from '../../../src/lib/catan.ts';

export const onRequestOptions = catanOptions;

export const onRequestGet: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: true, tables: [], count: 0, note: 'store offline' });
  const url = new URL(request.url);
  const tables = await loadTables(env.VISITS);
  const id = url.searchParams.get('id');
  if (id) {
    const t = tables.find((x) => x.id === id);
    return t ? catanJson({ ok: true, table: publicTable(t) }) : catanJson({ ok: false, error: 'no such table (it may have finished)' }, 404);
  }
  const city = (url.searchParams.get('city') || '').trim().toLowerCase();
  const list = tables.filter((t) => !city || t.city.toLowerCase().includes(city)).map(publicTable);
  return catanJson({ ok: true, count: list.length, tables: list });
};

export const onRequestPost: PagesFunction<CatanEnv> = async ({ request, env }) => {
  if (!env.VISITS) return catanJson({ ok: false, error: 'the table store is offline' }, 503);
  const body = await readBody(request);
  if (!body) return catanJson({ ok: false, error: 'send a JSON object' }, 400);
  const v = validateTable(body);
  if (!v.ok) return catanJson(v, 400);
  if (await overBudget(env.VISITS, request, 'host', 3)) {
    return catanJson({ ok: false, error: 'easy, builder — three new tables per ten minutes' }, 429);
  }
  const hostKey = `hk_${randomSecret().slice(0, 24)}`;
  const table: StoredTable = {
    ...v.table,
    id: randomId(4),
    created: new Date().toISOString(),
    seated: [v.table.host],
    hostKeyHash: await sha256Hex(`catan-hostkey:${hostKey}`),
  };
  const tables = await loadTables(env.VISITS);
  tables.push(table);
  tables.sort((a, b) => a.when.localeCompare(b.when));
  await saveTables(env.VISITS, tables);
  return catanJson({ ok: true, table: publicTable(table), hostKey, note: 'Keep hostKey: POST /api/catan/cancel {id, hostKey} removes the table.' }, 201);
};
