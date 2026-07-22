interface Env {
  PC_ANALYTICS_KV?: KVNamespace;
}

type AdEvent = 'impression' | 'click';

interface AdMetricBody {
  event?: unknown;
  adId?: unknown;
}

interface Counter {
  impressions: number;
  clicks: number;
}

const EVENT_PREFIX = 'admetric:';
const RETENTION_DAYS = 90;
const MAX_REPORT_EVENTS = 20_000;
const AD_ID_PATTERN = /^PC-[A-Z0-9-]{3,48}$/;

function json(payload: unknown, status = 200, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeWindowDays(url: URL): number {
  const requested = Number.parseInt(url.searchParams.get('days') || '30', 10);
  if (!Number.isFinite(requested)) return 30;
  return Math.max(1, Math.min(RETENTION_DAYS, requested));
}

function blankCounter(): Counter {
  return { impressions: 0, clicks: 0 };
}

function withCtr(counter: Counter): Counter & { ctr: number } {
  return {
    ...counter,
    ctr: counter.impressions > 0 ? counter.clicks / counter.impressions : 0,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PC_ANALYTICS_KV) {
    return json({ ok: false, reason: 'analytics-unbound' }, 503);
  }

  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite === 'cross-site') {
    return json({ ok: false, reason: 'cross-site' }, 403);
  }

  if (request.headers.get('DNT') === '1') {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  let body: AdMetricBody;
  try {
    body = await request.json<AdMetricBody>();
  } catch {
    return json({ ok: false, reason: 'invalid-json' }, 400);
  }

  const event = body.event;
  const adId = body.adId;
  if ((event !== 'impression' && event !== 'click') || typeof adId !== 'string' || !AD_ID_PATTERN.test(adId)) {
    return json({ ok: false, reason: 'invalid-event' }, 400);
  }

  const now = new Date();
  const key = `${EVENT_PREFIX}${isoDay(now)}:${adId}:${event}:${now.getTime()}:${crypto.randomUUID()}`;
  await env.PC_ANALYTICS_KV.put(key, '', { expirationTtl: RETENTION_DAYS * 24 * 60 * 60 });

  return json({ ok: true }, 201);
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const windowDays = safeWindowDays(new URL(request.url));
  const generatedAt = new Date();
  const start = new Date(generatedAt);
  start.setUTCDate(start.getUTCDate() - (windowDays - 1));
  const startDay = isoDay(start);

  if (!env.PC_ANALYTICS_KV) {
    return json({
      generatedAt: generatedAt.toISOString(),
      windowDays,
      retentionDays: RETENTION_DAYS,
      status: 'unbound',
      truncated: false,
      totals: withCtr(blankCounter()),
      ads: [],
      daily: [],
    }, 200, 'public, max-age=30');
  }

  const byAd = new Map<string, Counter>();
  const byDay = new Map<string, Counter>();
  const totals = blankCounter();
  let cursor: string | undefined;
  let scanned = 0;
  let truncated = false;

  do {
    const page = await env.PC_ANALYTICS_KV.list({ prefix: EVENT_PREFIX, limit: 1000, cursor });
    for (const record of page.keys) {
      scanned += 1;
      if (scanned > MAX_REPORT_EVENTS) {
        truncated = true;
        break;
      }

      const [day, adId, event] = record.name.slice(EVENT_PREFIX.length).split(':');
      if (!day || day < startDay || !AD_ID_PATTERN.test(adId || '') || (event !== 'impression' && event !== 'click')) continue;

      const adCounter = byAd.get(adId) || blankCounter();
      const dayCounter = byDay.get(day) || blankCounter();
      adCounter[event === 'impression' ? 'impressions' : 'clicks'] += 1;
      dayCounter[event === 'impression' ? 'impressions' : 'clicks'] += 1;
      totals[event === 'impression' ? 'impressions' : 'clicks'] += 1;
      byAd.set(adId, adCounter);
      byDay.set(day, dayCounter);
    }

    if (truncated || page.list_complete) break;
    cursor = page.cursor;
  } while (cursor);

  const ads = [...byAd.entries()]
    .map(([adId, counter]) => ({ adId, ...withCtr(counter) }))
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.adId.localeCompare(b.adId));
  const daily = [...byDay.entries()]
    .map(([date, counter]) => ({ date, ...withCtr(counter) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return json({
    generatedAt: generatedAt.toISOString(),
    windowDays,
    retentionDays: RETENTION_DAYS,
    status: 'live',
    truncated,
    methodology: {
      impression: 'Creative was at least 50% visible for one second; deduplicated per creative, page, and browser session.',
      click: 'A click on a measured creative.',
      privacy: 'No IP, user agent, cookie, wallet, or visitor identifier is stored with ad events.',
      caveat: 'Counts are browser events, not unique people. Automation that runs page JavaScript can be counted.',
    },
    totals: withCtr(totals),
    ads,
    daily,
  }, 200, 'public, max-age=60, stale-while-revalidate=120');
};
