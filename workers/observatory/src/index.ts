/**
 * pointcast-observatory cron worker — the Agent-Web Observatory scanner.
 *
 * Runtime shape (happy path):
 *   hourly cron → load roster from OBSERVATORY KV →
 *   (first run of the UTC day: merge seeds + VISITS-log operator domains) →
 *   scan the OBS_BATCH_SIZE least-recently-scanned domains (9 fixed probes
 *   each, robots.txt first with an opt-out short-circuit) → score, diff,
 *   write. Batch selection is oldest-first, so a roster larger than one
 *   day's capacity degrades to a slower round-robin instead of starving
 *   the tail. Monday 16:00 UTC cron → weekly rollup from index + events.
 *
 * Ethics, enforced in code:
 *   · Only the 9 conventional discovery paths are ever fetched — no page
 *     content, no crawling beyond the fixed probe set.
 *   · robots.txt is fetched FIRST; a blanket Disallow ('/' or '/*') or an
 *     explicit pointcast-observatory block ends the scan for that domain.
 *   · Identifying UA with a link to the methodology page; the UA token and
 *     the opt-out matcher share one constant (OBSERVATORY_UA_TOKEN).
 *   · Each domain is scanned at most once per UTC day.
 *   · Bodies are read capped at 128 KB; records keep a 16-hex content-hash
 *     prefix and a ≤280-char sample, never full bodies.
 *
 * All evolving logic (rubric, validators, seeds, diffing) lives in
 * src/lib/observatory-score.mjs + observatory-seeds.mjs — shared with
 * `node --test` and bundled here by wrangler's esbuild.
 */

import {
  PROBES,
  validateProbeBody,
  scoreProbes,
  parseRobotsAiDirectives,
  extractHopDomains,
  diffScans,
} from '../../../src/lib/observatory-score.mjs';
import {
  OBSERVATORY_SEEDS,
  CRAWLER_OPERATOR_DOMAINS,
  OBSERVATORY_UA,
  MAX_DOMAINS,
  MAX_DISCOVERED,
  MAX_HOPS_PER_SCAN,
} from '../../../src/lib/observatory-seeds.mjs';
import { getISOWeekId } from '../../../src/lib/iso-week.mjs';

export interface Env {
  OBSERVATORY: KVNamespace;
  VISITS?: KVNamespace;
  OBS_BATCH_SIZE?: string;
  OBS_OPS_TOKEN?: string;
}

// ─── KV keys ─────────────────────────────────────────────────────────────────

const KEY_INDEX = 'obs:index';
const KEY_EVENTS = 'obs:events';
const domainKey = (domain: string) => `obs:domain:${domain}`;
const weeklyKey = (week: string) => `obs:weekly:${week}`;

const MAX_EVENTS = 500;
const MAX_HISTORY = 60;
const BODY_CAP = 128 * 1024;
const PROBE_TIMEOUT_MS = 10_000;
const SAMPLE_CAP = 280;

interface IndexRow {
  domain: string;
  source: 'seed' | 'visit' | 'hop';
  category?: string;
  score: number;
  groups: string[];
  lastScanDay: string | null;
  optedOut: boolean;
}

// ─── Small helpers ───────────────────────────────────────────────────────────

const todayUTC = (now: number) => new Date(now).toISOString().slice(0, 10);

async function sha256Prefix(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/** Read a response body into one preallocated buffer, hard-capped. */
async function readCapped(res: Response, cap: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const buf = new Uint8Array(cap);
  let offset = 0;
  while (offset < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    const take = Math.min(value.length, cap - offset);
    buf.set(value.subarray(0, take), offset);
    offset += take;
  }
  try {
    await reader.cancel();
  } catch {
    /* stream may already be closed */
  }
  return new TextDecoder().decode(buf.subarray(0, offset));
}

interface ProbeFetch {
  ok: boolean;
  status: number;
  contentType: string;
  body: string;
  bytes: number;
  error?: string;
}

async function probeUrl(url: string): Promise<ProbeFetch> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': OBSERVATORY_UA, Accept: 'text/plain, application/json, application/xml, text/xml, */*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const body = await readCapped(res, BODY_CAP);
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type') ?? '',
      body,
      bytes: body.length,
    };
  } catch (err) {
    return { ok: false, status: 0, contentType: '', body: '', bytes: 0, error: String(err) };
  }
}

/** The one probe-record shape, used for robots.txt and the other 8 alike. */
async function probeRecord(result: ProbeFetch, expect: string) {
  const servedValid = validateProbeBody(expect, result.body, result.contentType, result.ok);
  return {
    status: result.status,
    ok: result.ok,
    servedValid,
    contentType: result.contentType,
    bytes: result.bytes,
    hash: servedValid && result.body ? await sha256Prefix(result.body) : null,
    sample: servedValid && result.body ? result.body.slice(0, SAMPLE_CAP) : undefined,
  };
}

// ─── Scan batch ──────────────────────────────────────────────────────────────

/** Merge seeds + AI-crawler operators into the roster. Existing seed rows
 *  get their category refreshed so the seeds file stays the source of truth.
 *  Returns true when the roster changed. */
async function discoverDomains(env: Env, index: IndexRow[]): Promise<boolean> {
  let changed = false;
  const byDomain = new Map(index.map((row) => [row.domain, row]));

  for (const seed of OBSERVATORY_SEEDS) {
    const existing = byDomain.get(seed.domain);
    if (existing) {
      if (existing.category !== seed.category) {
        existing.category = seed.category;
        changed = true;
      }
      continue;
    }
    if (index.length >= MAX_DOMAINS) break;
    const row: IndexRow = {
      domain: seed.domain,
      source: 'seed',
      category: seed.category,
      score: 0,
      groups: [],
      lastScanDay: null,
      optedOut: false,
    };
    byDomain.set(seed.domain, row);
    index.push(row);
    changed = true;
  }

  if (!env.VISITS) return changed;
  try {
    const log = (await env.VISITS.get('log', 'json')) as Array<{ type?: string }> | null;
    for (const entry of log ?? []) {
      if (index.length >= MAX_DOMAINS) break;
      const operator = entry.type ? (CRAWLER_OPERATOR_DOMAINS as Record<string, string>)[entry.type] : undefined;
      if (!operator || byDomain.has(operator)) continue;
      const row: IndexRow = { domain: operator, source: 'visit', score: 0, groups: [], lastScanDay: null, optedOut: false };
      byDomain.set(operator, row);
      index.push(row);
      changed = true;
    }
  } catch {
    // Discovery is best-effort; the seed roster alone keeps the census alive.
  }
  return changed;
}

interface ScanOutcome {
  record: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
  hops: string[];
}

async function scanDomain(row: IndexRow, prev: any, now: number, knownDomains: Set<string>): Promise<ScanOutcome> {
  const base = `https://${row.domain}`;
  const day = todayUTC(now);
  const probes: Record<string, unknown> = {};
  let agentsBody: string | null = null;

  const robotsFetch = await probeUrl(`${base}/robots.txt`);
  const robots = parseRobotsAiDirectives(robotsFetch.body);
  const optedOut = robots.blocksAll || robots.blocksObservatory;
  probes.robotsAi = await probeRecord(robotsFetch, 'robots-ai');

  if (!optedOut) {
    for (const probe of PROBES) {
      if (probe.id === 'robotsAi') continue;
      const result = await probeUrl(base + probe.path);
      const record = await probeRecord(result, probe.expect);
      probes[probe.id] = record;
      if (record.servedValid && (probe.id === 'agentsJson' || probe.id === 'wellKnownAgents') && !agentsBody) {
        agentsBody = result.body;
      }
    }
  }

  const { score, breakdown } = scoreProbes(probes as any);

  const history: Array<{ day: string; score: number }> = Array.isArray(prev?.history) ? [...prev.history] : [];
  if (history[history.length - 1]?.day !== day) history.push({ day, score });
  else history[history.length - 1] = { day, score };
  while (history.length > MAX_HISTORY) history.shift();

  const record = {
    domain: row.domain,
    source: row.source,
    category: row.category,
    firstSeen: prev?.firstSeen ?? new Date(now).toISOString(),
    lastScanAt: new Date(now).toISOString(),
    lastScanDay: day,
    optedOut,
    robots,
    probes,
    score,
    breakdown,
    history,
  };

  // 'domain-added' is emitted exactly once per domain: on its first scan.
  // (Hop discoveries are NOT announced at roster-push time — that would
  // double-count them here and in the weekly newDomains list.)
  const events: Array<Record<string, unknown>> = prev
    ? diffScans(prev, record, now)
    : [{ t: now, day, domain: row.domain, kind: 'domain-added', detail: `joined the census via ${row.source}` }];

  // Strict one-hop: only seed/visit domains expand, and only from a valid agents.json.
  const hops =
    !optedOut && agentsBody && (row.source === 'seed' || row.source === 'visit')
      ? extractHopDomains(agentsBody, row.domain, knownDomains, MAX_HOPS_PER_SCAN)
      : [];

  return { record, events, hops };
}

export async function runScanBatch(env: Env, now = Date.now()): Promise<{ scanned: string[]; day: string }> {
  const day = todayUTC(now);
  const batchSize = Math.max(1, parseInt(env.OBS_BATCH_SIZE ?? '4', 10) || 4);

  const index = ((await env.OBSERVATORY.get(KEY_INDEX, 'json')) as IndexRow[] | null) ?? [];

  // First run of a new UTC day: refresh the roster from seeds + visit log.
  const firstRunOfDay = index.length === 0 || !index.some((row) => row.lastScanDay === day);
  const rosterChanged = firstRunOfDay ? await discoverDomains(env, index) : false;

  // Oldest-first, never twice in one UTC day. A roster bigger than the
  // day's capacity (24 crons × batch) round-robins fairly instead of
  // starving whatever sits past the daily cutoff.
  const batch = index
    .filter((row) => row.lastScanDay !== day)
    .sort((a, b) => (a.lastScanDay ?? '').localeCompare(b.lastScanDay ?? '') || a.domain.localeCompare(b.domain))
    .slice(0, batchSize);

  if (batch.length === 0 && !rosterChanged) {
    // Quiet hour after the roster is fully covered — no KV writes at all.
    return { scanned: [], day };
  }

  const knownDomains = new Set(index.map((row) => row.domain));
  const allEvents: Array<Record<string, unknown>> = [];
  const scanned: string[] = [];
  const hopCount = index.filter((row) => row.source === 'hop').length;
  let hopBudget = Math.max(0, Math.min(MAX_DISCOVERED - hopCount, MAX_DOMAINS - index.length));

  // Prev records are independent — fetch them together, probe politely after.
  const prevs = await Promise.all(batch.map((row) => env.OBSERVATORY.get(domainKey(row.domain), 'json')));

  for (let i = 0; i < batch.length; i++) {
    const row = batch[i];
    const { record, events, hops } = await scanDomain(row, prevs[i], now, knownDomains);

    await env.OBSERVATORY.put(domainKey(row.domain), JSON.stringify(record));
    row.score = record.score as number;
    row.groups = Object.entries(record.breakdown as Record<string, { earned: number }>)
      .filter(([, g]) => g.earned > 0)
      .map(([group]) => group);
    row.lastScanDay = day;
    row.optedOut = record.optedOut as boolean;
    allEvents.push(...events);
    scanned.push(row.domain);

    for (const hop of hops) {
      if (hopBudget <= 0) break;
      hopBudget--;
      knownDomains.add(hop);
      index.push({ domain: hop, source: 'hop', score: 0, groups: [], lastScanDay: null, optedOut: false });
      // No event here — the hop's own first scan announces it (see scanDomain).
    }
  }

  if (allEvents.length > 0) {
    const existing = ((await env.OBSERVATORY.get(KEY_EVENTS, 'json')) as Array<Record<string, unknown>> | null) ?? [];
    const merged = [...allEvents.reverse(), ...existing].slice(0, MAX_EVENTS);
    await env.OBSERVATORY.put(KEY_EVENTS, JSON.stringify(merged));
  }

  await env.OBSERVATORY.put(KEY_INDEX, JSON.stringify(index));

  console.log(`[observatory] scanned ${scanned.length} domains (${scanned.join(', ') || 'none'}) — roster ${index.length}`);
  return { scanned, day };
}

// ─── Weekly rollup ───────────────────────────────────────────────────────────

export async function runWeeklyRollup(env: Env, now = Date.now()): Promise<{ week: string }> {
  const week = getISOWeekId(new Date(now));
  const weekAgo = now - 7 * 86400000;

  const index = ((await env.OBSERVATORY.get(KEY_INDEX, 'json')) as IndexRow[] | null) ?? [];
  const events = ((await env.OBSERVATORY.get(KEY_EVENTS, 'json')) as Array<any> | null) ?? [];
  const windowEvents = events.filter((e) => typeof e.t === 'number' && e.t >= weekAgo);

  const scored = index.filter((row) => row.lastScanDay !== null);
  const scores = scored.map((row) => row.score).sort((a, b) => a - b);
  const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const medianScore = scores.length ? scores[Math.floor(scores.length / 2)] : 0;

  const surfaceAdoption: Record<string, number> = {};
  for (const row of scored) {
    for (const group of row.groups ?? []) surfaceAdoption[group] = (surfaceAdoption[group] ?? 0) + 1;
  }

  // Movers: net score delta per domain across the week's score-changed events.
  const deltas = new Map<string, { prev: number; next: number }>();
  for (const e of [...windowEvents].reverse()) {
    if (e.kind !== 'score-changed') continue;
    const existing = deltas.get(e.domain);
    if (!existing) deltas.set(e.domain, { prev: e.prevScore, next: e.newScore });
    else existing.next = e.newScore;
  }
  const movers = [...deltas.entries()]
    .map(([domain, { prev, next }]) => ({ domain, prev, next, delta: next - prev }))
    .filter((m) => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 10);

  const rollup = {
    week,
    generatedAt: new Date(now).toISOString(),
    totals: {
      domains: index.length,
      scanned: scored.length,
      avgScore,
      medianScore,
      surfaceAdoption,
      optedOut: index.filter((row) => row.optedOut).length,
    },
    topTen: [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((row) => ({ domain: row.domain, score: row.score, category: row.category ?? null })),
    movers,
    newDomains: windowEvents.filter((e) => e.kind === 'domain-added').map((e) => e.domain),
    eventCount: windowEvents.length,
  };

  await env.OBSERVATORY.put(weeklyKey(week), JSON.stringify(rollup));
  await env.OBSERVATORY.put('obs:weekly:latest', week);
  const weeklyIndex = ((await env.OBSERVATORY.get('obs:weekly:index', 'json')) as string[] | null) ?? [];
  if (!weeklyIndex.includes(week)) {
    weeklyIndex.unshift(week);
    await env.OBSERVATORY.put('obs:weekly:index', JSON.stringify(weeklyIndex));
  }

  console.log(`[observatory] weekly rollup ${week} — ${rollup.totals.scanned}/${rollup.totals.domains} scanned, avg ${avgScore}`);
  return { week };
}

// ─── Entry points ────────────────────────────────────────────────────────────

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === '0 16 * * 1') {
      ctx.waitUntil(runWeeklyRollup(env).catch((err) => console.error('[observatory] rollup failed:', err)));
    } else {
      ctx.waitUntil(runScanBatch(env).catch((err) => console.error('[observatory] scan failed:', err)));
    }
  },

  /** Ops-only surface for on-demand runs during verification. Public reads
   *  live on pointcast.xyz (functions/api/observatory/*), not here. */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

    if (request.method === 'POST' && (url.pathname === '/ops/scan' || url.pathname === '/ops/rollup')) {
      if (!env.OBS_OPS_TOKEN) return json({ error: 'ops-not-configured' }, 503);
      const auth = request.headers.get('Authorization') ?? '';
      if (auth !== `Bearer ${env.OBS_OPS_TOKEN}`) return json({ error: 'unauthorized' }, 401);
      try {
        const result = url.pathname === '/ops/scan' ? await runScanBatch(env) : await runWeeklyRollup(env);
        return json({ ok: true, ...result });
      } catch (err) {
        return json({ ok: false, error: String(err) }, 500);
      }
    }

    return json({
      name: 'pointcast-observatory',
      what: 'Agent-Web Observatory scanner — autonomous census of the agent-readable web',
      census: 'https://pointcast.xyz/api/observatory',
      methodology: 'https://pointcast.xyz/agent-observatory',
    });
  },
};
