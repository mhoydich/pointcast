interface FunnelEnv {
  PC_ANALYTICS_KV: KVNamespace;
}

const FUNNEL_EVENTS = ['landing', 'join', 'relay', 'copy', 'email', 'x', 'tezos_rooms'] as const;
type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
type FunnelCounter = Record<FunnelEvent, number>;
const FUNNEL_SOURCES = [
  'pointcast_home',
  'pointcast_strip',
  'pointcast_ad',
  'industrynext',
  'allworthy',
  'passportz',
  'rally',
  'common_hours',
  'wordpress',
  'tumblr',
  'press',
  'share_kit',
  'direct',
  'other',
  'legacy',
] as const;
type FunnelSource = (typeof FUNNEL_SOURCES)[number];
type FunnelSourceReport = Record<FunnelSource, FunnelCounter>;

const EVENT_PREFIX = 'networkfunnel:';
const RETENTION_DAYS = 90;
const MAX_REPORT_EVENTS = 20_000;
const MAX_BODY_BYTES = 512;

function json(payload: unknown, status = 200, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function blankCounter(): FunnelCounter {
  return {
    landing: 0,
    join: 0,
    relay: 0,
    copy: 0,
    email: 0,
    x: 0,
    tezos_rooms: 0,
  };
}

function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === 'string' && (FUNNEL_EVENTS as readonly string[]).includes(value);
}

function isFunnelSource(value: unknown): value is FunnelSource {
  return typeof value === 'string' && (FUNNEL_SOURCES as readonly string[]).includes(value);
}

function blankSourceReport(): FunnelSourceReport {
  return Object.fromEntries(FUNNEL_SOURCES.map((source) => [source, blankCounter()])) as FunnelSourceReport;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeWindowDays(url: URL): number {
  const requested = Number.parseInt(url.searchParams.get('days') || '30', 10);
  if (!Number.isFinite(requested)) return 30;
  return Math.max(1, Math.min(RETENTION_DAYS, requested));
}

export const onRequestPost: PagesFunction<FunnelEnv> = async (context) => {
  if (!context.env.PC_ANALYTICS_KV) {
    return json({ ok: false, reason: 'analytics-unbound' }, 503);
  }

  if (context.request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return json({ ok: false, reason: 'cross-site' }, 403);
  }

  if (context.request.headers.get('DNT') === '1') {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  if (!context.request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, reason: 'content-type' }, 415);
  }

  let rawBody: string;
  try {
    rawBody = await context.request.text();
  } catch {
    return json({ ok: false, reason: 'invalid-body' }, 400);
  }

  const bodyBytes = new TextEncoder().encode(rawBody).byteLength;
  if (bodyBytes < 2 || bodyBytes > MAX_BODY_BYTES) {
    return json({ ok: false, reason: 'body-size' }, 413);
  }

  let body: { event?: unknown; source?: unknown };
  try {
    body = JSON.parse(rawBody) as { event?: unknown; source?: unknown };
  } catch {
    return json({ ok: false, reason: 'invalid-json' }, 400);
  }

  if (!isFunnelEvent(body.event)) {
    return json({ ok: false, reason: 'invalid-event' }, 400);
  }
  const source: FunnelSource = isFunnelSource(body.source) ? body.source : 'other';

  const now = new Date();
  const key = `${EVENT_PREFIX}${isoDay(now)}:${body.event}:${source}:${now.getTime()}:${crypto.randomUUID()}`;
  context.waitUntil(
    context.env.PC_ANALYTICS_KV.put(key, '', {
      expirationTtl: RETENTION_DAYS * 24 * 60 * 60,
    }),
  );

  return json({ ok: true }, 201);
};

export const onRequestGet: PagesFunction<FunnelEnv> = async (context) => {
  if (!context.env.PC_ANALYTICS_KV) {
    return json({ ok: false, reason: 'analytics-unbound' }, 503);
  }

  const windowDays = safeWindowDays(new URL(context.request.url));
  const generatedAt = new Date();
  const start = new Date(generatedAt);
  start.setUTCDate(start.getUTCDate() - (windowDays - 1));
  const startDay = isoDay(start);
  const totals = blankCounter();
  const sourceReport = blankSourceReport();
  const byDay = new Map<string, FunnelCounter>();
  let scanned = 0;
  let cursor: string | undefined;
  let truncated = false;

  do {
    const page = await context.env.PC_ANALYTICS_KV.list({ prefix: EVENT_PREFIX, limit: 1000, cursor });
    for (const record of page.keys) {
      scanned += 1;
      if (scanned > MAX_REPORT_EVENTS) {
        truncated = true;
        break;
      }

      const [day, event, sourcePart] = record.name.slice(EVENT_PREFIX.length).split(':');
      if (!day || day < startDay || !isFunnelEvent(event)) continue;
      const source: FunnelSource = isFunnelSource(sourcePart) ? sourcePart : 'legacy';
      totals[event] += 1;
      sourceReport[source][event] += 1;
      const dayCounter = byDay.get(day) || blankCounter();
      dayCounter[event] += 1;
      byDay.set(day, dayCounter);
    }

    if (truncated || page.list_complete) break;
    cursor = page.cursor;
  } while (cursor);

  const daily = [...byDay.entries()]
    .map(([date, events]) => ({ date, events }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const sources = Object.fromEntries(
    FUNNEL_SOURCES
      .map((source) => {
        const events = sourceReport[source];
        return [source, {
          total: Object.values(events).reduce((sum, count) => sum + count, 0),
          events,
        }] as const;
      })
      .filter(([, report]) => report.total > 0),
  );

  return json({
    generatedAt: generatedAt.toISOString(),
    windowDays,
    retentionDays: RETENTION_DAYS,
    status: 'live',
    truncated,
    totalEvents: Object.values(totals).reduce((sum, count) => sum + count, 0),
    events: totals,
    sources,
    daily,
    participantCounter: 'https://pointcast.xyz/api/network-el-segundo/participants',
    methodology: {
      landing: 'Campaign wrapper remained visible for one second; deduplicated once per browser session.',
      action: 'A deliberate click or tap on the named join or relay control.',
      source: 'A bounded campaign label supplied by PointCast links; raw referrers and arbitrary URL values are never stored.',
      privacy: 'No IP, user agent, cookie, wallet, referrer, or visitor identifier is stored with funnel events.',
      caveat: 'Counts are browser events, not unique people. Automation that runs page JavaScript can be counted.',
    },
  }, 200, 'public, max-age=30, stale-while-revalidate=60');
};
