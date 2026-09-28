/**
 * GET /courts.json — the open, agent-readable twin of /pickleball: the
 * listed South Bay courts, their sourced facts (each with its source,
 * checked date and confidence — never an UNVERIFIED one dressed as a fact),
 * and the live board readings for the courts that take one. A Pages
 * Function at the site root, like /station.json; there is deliberately no
 * src/pages/courts.json.ts, so this is the only route for the path.
 *
 * No auth, no per-viewer state: every field is either static (the sourced
 * schedule, src/data/courts-schedule.json) or the same public reading every
 * viewer gets from GET /api/air/board. No device or IP hash of any kind
 * leaves here, and no names either: `readings` goes through publicReading()
 * (court-board.mjs), which keeps the value and its strength (label, status,
 * support, age, bars, liveUntil) and drops `bylines`, `crew` and `reportId`.
 * An open feed polled every 30 s must not become a log of when a named person
 * (a card @handle, or a "Guest NNNN" that stays the same per phone) stands at
 * a given court.
 *
 * Cached 30 s at the edge (caches.default, same pattern as
 * functions/api/air/board.ts) so an agent crawl never adds D1 load beyond
 * what the board page itself already causes. CORS is open (`*`): this is a
 * public reference feed, not a session-bound API.
 */
import { boardData } from './_lib/air-board-store.ts';
import { type AirEnv } from './_lib/air-store.ts';
import { COURTS, COURT_SOURCES, EMPTY_CONDITIONS, PRIVATE_COURTS, provenanceLine } from '../src/lib/courts.ts';
import type { Block, Fact, Hours, Reserve } from '../src/lib/courts.ts';
import { AIR_CONFIG } from '../src/lib/air.ts';
import { sunsetAt } from './_lib/court-conditions.ts';
// @ts-ignore — plain module shared with the tests
import { publicReading, showable } from './_lib/court-board.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
};

function shapeFact(f: Fact | null, now: number) {
  if (!f) return null;
  const { show, tag } = showable(f, now) as { show: boolean; tag: string | null };
  if (!show) return null;
  const source = COURT_SOURCES[f.src] ?? null;
  return {
    key: f.key, text: f.text, confidence: f.confidence, tag,
    source: { id: f.src, label: source?.label ?? f.src, url: source?.url ?? null },
    checked: f.checked, provenance: provenanceLine(f),
  };
}

function shapeHours(h: Hours | null, now: number) {
  if (!h) return null;
  const { show, tag } = showable(h, now) as { show: boolean; tag: string | null };
  if (!show) return null;
  return {
    rules: h.rules, else: h.else, conflict: h.conflict ?? null, confidence: h.confidence, tag,
    checked: h.checked, provenance: provenanceLine(h),
  };
}

function shapeBlock(b: Block, now: number) {
  const { show, tag } = showable(b, now) as { show: boolean; tag: string | null };
  if (!show) return null;
  return {
    kind: b.kind, label: b.label, days: b.days, start: b.start, end: b.end, from: b.from, until: b.until, fee: b.fee,
    confidence: b.confidence, tag, checked: b.checked, provenance: provenanceLine(b),
  };
}

function shapeReserve(r: Reserve | null, now: number) {
  if (!r) return null;
  const { show, tag } = showable(r, now) as { show: boolean; tag: string | null };
  if (!show) return null;
  return { label: r.label, url: r.url, confidence: r.confidence, tag, checked: r.checked, provenance: provenanceLine(r) };
}

/**
 * The board's readings without its weather: only `sunset` is needed (it
 * resolves a 'dusk' close, so `status` here matches /api/air/board's), and
 * that is pure math — no AWC or NWS call from an agent crawl.
 */
const sunsetOnly = async (at: Date) => ({ ...EMPTY_CONDITIONS, sunset: sunsetAt(at) });

async function payload(env: AirEnv, now: number) {
  const live = new Map<string, { status: string; readings: { wait: unknown; parking: unknown } }>();
  if (env.AUTH_DB) {
    try {
      const board = await boardData(env, env.AUTH_DB, now, COURTS, AIR_CONFIG, sunsetOnly);
      for (const c of board.courts) {
        live.set(c.id, { status: c.status, readings: { wait: publicReading(c.readings.wait), parking: publicReading(c.readings.parking) } });
      }
    } catch { /* the schedule still answers without D1; live readings are a bonus, not the contract */ }
  }
  return {
    ok: true,
    version: 1,
    serverTime: new Date(now).toISOString(),
    sources: COURT_SOURCES,
    courts: COURTS.map((c) => ({
      id: c.id, name: c.name, short: c.short, city: c.city, shape: c.shape, air: c.air, status: c.status,
      facts: c.facts.map((f) => shapeFact(f, now)).filter((f): f is NonNullable<typeof f> => f != null),
      hours: shapeHours(c.hours, now),
      walkOn: shapeFact(c.walkOn, now),
      blocks: c.blocks.map((b) => shapeBlock(b, now)).filter((b): b is NonNullable<typeof b> => b != null),
      reserve: shapeReserve(c.reserve, now),
      live: live.get(c.id) ?? null,
    })),
    private: PRIVATE_COURTS.map((p) => ({
      id: p.id, name: p.name, city: p.city,
      facts: p.facts.map((f) => shapeFact(f, now)).filter((f): f is NonNullable<typeof f> => f != null),
      hours: shapeHours(p.hours, now),
      reserve: shapeReserve(p.reserve, now),
    })),
  };
}

export const onRequestGet: PagesFunction<AirEnv> = async ({ request, env }) => {
  const cacheUrl = new URL(request.url);
  cacheUrl.search = '';
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const body = await payload(env, Date.now());
  const response = new Response(JSON.stringify(body, null, 2), { status: 200, headers: HEADERS });
  await cache.put(cacheKey, response.clone());
  return response;
};

export const onRequestHead: PagesFunction<AirEnv> = (ctx) => onRequestGet(ctx);
export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: HEADERS });
