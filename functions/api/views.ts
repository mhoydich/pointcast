/**
 * GET /api/views[?path=/drum][&days=1|7] — open, anonymous page-view estimates for pointcast.xyz.
 *
 * Reads the path-only pageview batches that /api/analytics already keeps (PageviewBeacon) and
 * sums their weights. After a short warmup per route, pageviews are sampled 1-in-10, so these are
 * estimates and the JSON says so. Only paths and counts leave this endpoint: never ipHint, ts or meta.
 *
 * Cost: the sum is rebuilt at most every ten minutes per window and kept in KV as one summary
 * document, so a busy page does not turn into KV list or read calls. Reads are capped, and a capped
 * rebuild is marked partial rather than shown as a full count.
 */
interface Env {
  PC_ANALYTICS_KV?: KVNamespace;
}

interface Batch { event?: unknown; meta?: { path?: unknown } | unknown; sampled?: unknown }
interface Summary { builtAt: string; days: string[]; total: number; pages: Record<string, number>; batches: number; partial: boolean }

export const FRESH_MS = 10 * 60 * 1000;
export const READ_CAP = 400;
const PATH_RE = /^\/[\w\-\/.]{0,119}$/;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'X-Robots-Tag': 'noindex',
};

export function cleanPath(value: string | null): string | undefined {
  if (value === null) return undefined;
  const path = value.trim().replace(/\/+$/, '') || '/';
  return PATH_RE.test(path) && !path.includes('..') ? path : undefined;
}

export function utcDays(count: number, now: number): string[] {
  return Array.from({ length: count }, (_, i) => new Date(now - i * 86400000).toISOString().slice(0, 10));
}

export function addBatch(pages: Record<string, number>, records: unknown): number {
  if (!Array.isArray(records)) return 0;
  let added = 0;
  for (const record of records as Batch[]) {
    if (record?.event !== 'pageview' && record?.event !== 'page_view') continue;
    const raw = (record.meta as { path?: unknown } | undefined)?.path;
    const path = cleanPath(typeof raw === 'string' ? raw : '/') || '/';
    const weight = Number.isSafeInteger(record.sampled) && (record.sampled as number) > 0 ? (record.sampled as number) : 1;
    pages[path] = (pages[path] || 0) + weight;
    added += weight;
  }
  return added;
}

export async function buildSummary(kv: KVNamespace, dayCount: number, now: number): Promise<Summary> {
  const days = utcDays(dayCount, now);
  const pages: Record<string, number> = {};
  let total = 0, batches = 0, partial = false;
  for (const day of days) {
    let cursor: string | undefined;
    do {
      const listed = await kv.list({ prefix: `analytics-batch:${day}`, cursor, limit: 1000 });
      for (const key of listed.keys) {
        if (batches >= READ_CAP) { partial = true; break; }
        batches += 1;
        let records: unknown = null;
        try { records = await kv.get(key.name, 'json'); } catch {}
        total += addBatch(pages, records);
      }
      cursor = listed.list_complete || partial ? undefined : listed.cursor;
    } while (cursor);
    if (partial) break;
  }
  return { builtAt: new Date(now).toISOString(), days, total, pages, batches, partial };
}

export async function getSummary(kv: KVNamespace, dayCount: number, now: number): Promise<Summary> {
  const key = `views-summary:v1:${dayCount}`;
  let have: Summary | null = null;
  try { have = await kv.get(key, 'json'); } catch {}
  if (have && now - Date.parse(have.builtAt) < FRESH_MS) return have;
  const fresh = await buildSummary(kv, dayCount, now);
  try { await kv.put(key, JSON.stringify(fresh), { expirationTtl: 60 * 60 * 6 }); } catch {}
  return fresh;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const dayCount = url.searchParams.get('days') === '1' ? 1 : 7;
  const hasPath = url.searchParams.has('path');
  const path = cleanPath(url.searchParams.get('path'));
  if (hasPath && !path) return new Response(JSON.stringify({ error: 'path must look like /drum' }), { status: 400, headers });
  if (!env.PC_ANALYTICS_KV) {
    return new Response(JSON.stringify({ schema: 'pointcast-pageviews/1', status: 'unavailable' }), { status: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=60' } });
  }
  const sum = await getSummary(env.PC_ANALYTICS_KV, dayCount, Date.now());
  const top = Object.fromEntries(Object.entries(sum.pages).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 50));
  return new Response(JSON.stringify({
    schema: 'pointcast-pageviews/1',
    site: 'pointcast.xyz',
    status: 'ok',
    estimated: true,
    updatedAt: sum.builtAt,
    windowDays: dayCount,
    partial: sum.partial,
    definition: 'Page views from PointCast pages, path only. Busy routes are sampled 1-in-10 and scaled up, so these are estimates. Rebuilt about every 10 minutes.',
    ...(path ? { path, views: sum.pages[path] || 0 } : { total: sum.total, pages: top }),
  }), { status: 200, headers: { ...headers, 'Cache-Control': 'public, max-age=300' } });
};
