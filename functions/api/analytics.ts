interface Env {
  PC_ANALYTICS_KV?: KVNamespace;
}

const SAMPLE_RATE = 10;
const WARMUP_PAGEVIEWS_PER_PATH_PER_DAY = 20;
const BATCH_FLUSH_MS = 10_000;
const RETENTION_SECONDS = 60 * 60 * 24 * 90;

interface AnalyticsRecord {
  event: string;
  meta: unknown;
  ts: string;
  ipHint: string;
  sampled?: number;
}

let queuedRecords: AnalyticsRecord[] = [];
let queuedKv: KVNamespace | undefined;
let scheduledFlush: Promise<void> | undefined;
let resolveScheduledFlush: (() => void) | undefined;
let scheduledTimer: ReturnType<typeof setTimeout> | undefined;
let sampleDay = '';
let warmPageviewHits = new Map<string, number>();

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: cors });

export async function flushAnalyticsBatch(): Promise<void> {
  const records = queuedRecords;
  const kv = queuedKv;
  queuedRecords = [];
  queuedKv = undefined;
  const resolve = resolveScheduledFlush;
  resolveScheduledFlush = undefined;
  scheduledFlush = undefined;
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = undefined;
  if (records.length && kv) {
    const ts = records[0]?.ts ?? new Date().toISOString();
    await kv.put(`analytics-batch:${ts}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(records), {
      expirationTtl: RETENTION_SECONDS,
    });
  }
  resolve?.();
}

function enqueueAnalytics(kv: KVNamespace, record: AnalyticsRecord): Promise<void> {
  // Pages Functions keep module state per isolate. A single isolated queue is
  // intentional: it turns many beacons arriving in that isolate into one KV
  // write while waitUntil keeps the ten-second flush alive after each 204.
  if (queuedKv && queuedKv !== kv && queuedRecords.length) void flushAnalyticsBatch();
  queuedKv = kv;
  queuedRecords.push(record);
  if (!scheduledFlush) {
    scheduledFlush = new Promise<void>((resolve) => { resolveScheduledFlush = resolve; });
    scheduledTimer = setTimeout(() => { void flushAnalyticsBatch(); }, BATCH_FLUSH_MS);
  }
  return scheduledFlush;
}

export function resetAnalyticsBatchForTest(): void {
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = undefined;
  queuedRecords = [];
  queuedKv = undefined;
  scheduledFlush = undefined;
  resolveScheduledFlush = undefined;
  sampleDay = '';
  warmPageviewHits = new Map();
}

function retainPageview(path: string): number | null {
  // Keep an initial, unsampled floor for each route in an isolate. This
  // prevents a quiet route from disappearing from the register merely because
  // its first handful of views lost a 1-in-10 draw, without a per-request KV
  // counter. The map resets each UTC day and on isolate eviction.
  const today = new Date().toISOString().slice(0, 10);
  if (sampleDay !== today) {
    sampleDay = today;
    warmPageviewHits = new Map();
  }
  const prior = warmPageviewHits.get(path) ?? 0;
  warmPageviewHits.set(path, prior + 1);
  if (prior < WARMUP_PAGEVIEWS_PER_PATH_PER_DAY) return 1;
  return Math.floor(Math.random() * SAMPLE_RATE) === 0 ? SAMPLE_RATE : null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  let body: { event?: unknown; meta?: unknown; ts?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400, headers: cors });
  }

  const event = typeof body.event === 'string' ? body.event.trim() : '';
  if (!event || event.length > 64) {
    return new Response(null, { status: 400, headers: cors });
  }

  const isPageview = event === 'pageview' || event === 'page_view';
  const meta = body.meta && typeof body.meta === 'object' ? body.meta : undefined;
  const path = isPageview && typeof (meta as { path?: unknown } | undefined)?.path === 'string'
    ? String((meta as { path: string }).path).replace(/[^\w\-\/.]/g, '').slice(0, 120)
    : '';
  const pageviewWeight = isPageview ? retainPageview(path || '/') : undefined;
  if (isPageview && pageviewWeight === null) {
    return new Response(null, { status: 204, headers: { ...cors, 'Cache-Control': 'no-store', 'X-PC-Analytics': 'sampled-out' } });
  }

  const metaJson = meta ? JSON.stringify(meta) : undefined;
  if (metaJson && metaJson.length > 2048) {
    return new Response(null, { status: 413, headers: cors });
  }

  if (!env.PC_ANALYTICS_KV) {
    return new Response(null, { status: 204, headers: cors });
  }

  const ts =
    typeof body.ts === 'string' && !Number.isNaN(Date.parse(body.ts))
      ? new Date(body.ts).toISOString()
      : new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHint = ip.includes('.') ? `${ip.split('.').slice(0, 1).join('.')}.x` : ip.split(':')[0] || '';
  waitUntil(enqueueAnalytics(env.PC_ANALYTICS_KV, {
    event, meta, ts, ipHint, ...(pageviewWeight ? { sampled: pageviewWeight } : {}),
  }));
  return new Response(null, { status: 204, headers: cors });
};
