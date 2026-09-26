/**
 * KeyboardSignal — one keyboard, every source.
 *
 * The keyboard sibling of the drum's DrumCounter. Every note played on a
 * PointCast keyboard surface, a page running /keyboard.js, a Claude artifact,
 * a script or an agent lands on one global counter and is tallied by source
 * (kind, app, place). Unlike a drum beat, a note can carry a pitch, so the
 * object also keeps the town's pitch-class histogram: the chord PointCast is
 * playing today.
 *
 * Only aggregates and short note lists are stored. No text, no IPs, no
 * sessions. Typing surfaces send unpitched keystroke counts, never the keys.
 *
 * POST /            { notes?: number[] (MIDI 0-127, ≤64), count?: 0-200, source }
 *                   → { ok, globalTotal, notes, keys, source, id }
 * GET  /            → summary (totals, kinds, sources, places, days, pitch, recent)
 * GET  /?since=<id> → { latestId, phrases } newer than id, oldest first
 * GET  /?league=1[&week=YYYY-MM-DD] → weekly app standings (capped per day)
 */
import { DurableObject } from 'cloudflare:workers';

export const SIGNAL_KINDS = ['pointcast', 'embed', 'standalone', 'artifact', 'agent', 'other'] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
export interface SignalSource {
  kind: SignalKind;
  app: string;
  place: string | null;
}

export const MAX_NOTES_PER_POST = 64;
export const MAX_KEYS_PER_POST = 200;
const MAX_SOURCE_ROWS = 2000;
const MAX_PLACE_ROWS = 500;
const RECENT_PHRASES = 120;
const SIGNAL_DAYS = 90;
const LIVE_WINDOW_MS = 120_000;
export const LEAGUE_DAILY_CAP = 5000;
const LEAGUE_ROWS = 50;

function slug(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw.toLowerCase().trim().replace(/[^a-z0-9._/:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
}

export function normalizeSource(raw: unknown): SignalSource {
  const input = raw && typeof raw === 'object' ? (raw as { kind?: unknown; app?: unknown; place?: unknown }) : {};
  const kind = SIGNAL_KINDS.includes(input.kind as SignalKind) ? (input.kind as SignalKind) : 'other';
  return { kind, app: slug(input.app, 48) || 'unknown', place: slug(input.place, 32) || null };
}

/** Whole MIDI numbers 0–127, at most 64; anything else is dropped. */
export function normalizeNotes(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const value of raw) {
    if (out.length >= MAX_NOTES_PER_POST) break;
    const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    if (Number.isInteger(n) && n >= 0 && n <= 127) out.push(n);
  }
  return out;
}

export function normalizeKeys(raw: unknown): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : 0;
  return Math.max(0, Math.min(MAX_KEYS_PER_POST, n));
}

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function weekBounds(week: string | null, now: number): { start: string; end: string } {
  const base = week && /^\d{4}-\d{2}-\d{2}$/.test(week) && !Number.isNaN(Date.parse(`${week}T00:00:00Z`))
    ? new Date(`${week}T00:00:00Z`)
    : new Date(now);
  const monday = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

interface PhraseRow {
  id: number;
  at: number;
  kind: string;
  app: string;
  place: string | null;
  notes: string;
  keys: number;
  [key: string]: string | number | null;
}

function phrase(row: PhraseRow) {
  let notes: number[] = [];
  try { notes = JSON.parse(row.notes); } catch { /* stored by us; never malformed */ }
  return { id: row.id, at: row.at, kind: row.kind, app: row.app, place: row.place, notes, keys: row.keys };
}

export class KeyboardSignal extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS kb_meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS kb_sources (
        kind TEXT NOT NULL, app TEXT NOT NULL, total INTEGER NOT NULL, hits INTEGER NOT NULL,
        first_at INTEGER NOT NULL, last_at INTEGER NOT NULL, PRIMARY KEY (kind, app)
      );
      CREATE TABLE IF NOT EXISTS kb_places (place TEXT PRIMARY KEY, total INTEGER NOT NULL, last_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS kb_days (day TEXT NOT NULL, kind TEXT NOT NULL, total INTEGER NOT NULL, PRIMARY KEY (day, kind));
      CREATE TABLE IF NOT EXISTS kb_app_days (
        day TEXT NOT NULL, kind TEXT NOT NULL, app TEXT NOT NULL, total INTEGER NOT NULL, hits INTEGER NOT NULL,
        last_at INTEGER NOT NULL, PRIMARY KEY (day, kind, app)
      );
      CREATE TABLE IF NOT EXISTS kb_pitch (pc INTEGER PRIMARY KEY, total INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS kb_pitch_days (day TEXT NOT NULL, pc INTEGER NOT NULL, total INTEGER NOT NULL, PRIMARY KEY (day, pc));
      CREATE TABLE IF NOT EXISTS kb_octaves (oct INTEGER PRIMARY KEY, total INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS kb_recent (
        id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, kind TEXT NOT NULL, app TEXT NOT NULL,
        place TEXT, notes TEXT NOT NULL, keys INTEGER NOT NULL
      );
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const since = url.searchParams.get('since');
      if (since !== null) return json(this.since(Number(since) || 0));
      if (url.searchParams.get('league') === '1') return json(this.league(url.searchParams.get('week')));
      return json(this.summary());
    }
    if (request.method !== 'POST') return json({ ok: false, reason: 'method-not-allowed' }, 405);

    let body: { notes?: unknown; count?: unknown; source?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ ok: false, reason: 'bad-body' }, 400);
    }
    const notes = normalizeNotes(body?.notes);
    const keys = normalizeKeys(body?.count);
    if (notes.length + keys === 0) return json({ ok: false, reason: 'no-notes' }, 400);
    const source = normalizeSource(body?.source);
    const id = this.record(notes, keys, source, Date.now());
    return json({ ok: true, globalTotal: this.meta('total'), notes: notes.length, keys, source, id });
  }

  private meta(key: string): number {
    const row = this.ctx.storage.sql.exec<{ value: number }>('SELECT value FROM kb_meta WHERE key = ?', key).toArray()[0];
    return row ? row.value : 0;
  }

  private bump(key: string, by: number) {
    this.ctx.storage.sql.exec(
      'INSERT INTO kb_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = value + excluded.value',
      key, by,
    );
  }

  /** One serial write; no await between reads and inserts. Returns the phrase id. */
  record(notes: number[], keys: number, source: SignalSource, now: number): number {
    const sql = this.ctx.storage.sql;
    const total = notes.length + keys;
    const day = utcDay(now);
    const { kind } = source;
    let { app, place } = source;

    this.bump('total', total);
    if (notes.length) this.bump('pitched', notes.length);

    const known = sql.exec('SELECT 1 FROM kb_sources WHERE kind = ? AND app = ?', kind, app).toArray().length > 0;
    if (!known && sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM kb_sources').one().n >= MAX_SOURCE_ROWS) app = 'overflow';
    sql.exec(
      `INSERT INTO kb_sources (kind, app, total, hits, first_at, last_at) VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT(kind, app) DO UPDATE SET total = total + excluded.total, hits = hits + 1, last_at = excluded.last_at`,
      kind, app, total, now, now,
    );
    if (place) {
      const knownPlace = sql.exec('SELECT 1 FROM kb_places WHERE place = ?', place).toArray().length > 0;
      if (!knownPlace && sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM kb_places').one().n >= MAX_PLACE_ROWS) place = 'elsewhere';
      sql.exec(
        `INSERT INTO kb_places (place, total, last_at) VALUES (?, ?, ?)
         ON CONFLICT(place) DO UPDATE SET total = total + excluded.total, last_at = excluded.last_at`,
        place, total, now,
      );
    }
    sql.exec(
      `INSERT INTO kb_days (day, kind, total) VALUES (?, ?, ?)
       ON CONFLICT(day, kind) DO UPDATE SET total = total + excluded.total`,
      day, kind, total,
    );
    sql.exec(
      `INSERT INTO kb_app_days (day, kind, app, total, hits, last_at) VALUES (?, ?, ?, ?, 1, ?)
       ON CONFLICT(day, kind, app) DO UPDATE SET total = total + excluded.total, hits = hits + 1, last_at = excluded.last_at`,
      day, kind, app, total, now,
    );

    const pcs = new Array<number>(12).fill(0);
    const octs = new Map<number, number>();
    for (const n of notes) {
      pcs[n % 12]++;
      const oct = Math.floor(n / 12) - 1;
      octs.set(oct, (octs.get(oct) ?? 0) + 1);
    }
    pcs.forEach((count, pc) => {
      if (!count) return;
      sql.exec('INSERT INTO kb_pitch (pc, total) VALUES (?, ?) ON CONFLICT(pc) DO UPDATE SET total = total + excluded.total', pc, count);
      sql.exec(
        'INSERT INTO kb_pitch_days (day, pc, total) VALUES (?, ?, ?) ON CONFLICT(day, pc) DO UPDATE SET total = total + excluded.total',
        day, pc, count,
      );
    });
    for (const [oct, count] of octs) {
      sql.exec('INSERT INTO kb_octaves (oct, total) VALUES (?, ?) ON CONFLICT(oct) DO UPDATE SET total = total + excluded.total', oct, count);
    }

    sql.exec(
      'INSERT INTO kb_recent (at, kind, app, place, notes, keys) VALUES (?, ?, ?, ?, ?, ?)',
      now, kind, app, place, JSON.stringify(notes), keys,
    );
    const id = sql.exec<{ id: number }>('SELECT MAX(id) AS id FROM kb_recent').one().id;
    sql.exec('DELETE FROM kb_recent WHERE id <= ?', id - RECENT_PHRASES);

    const oldest = utcDay(now - SIGNAL_DAYS * 86_400_000);
    sql.exec('DELETE FROM kb_days WHERE day < ?', oldest);
    sql.exec('DELETE FROM kb_app_days WHERE day < ?', oldest);
    sql.exec('DELETE FROM kb_pitch_days WHERE day < ?', oldest);
    return id;
  }

  private pitchRow(rows: Array<{ pc: number; total: number }>): number[] {
    const out = new Array<number>(12).fill(0);
    for (const r of rows) if (r.pc >= 0 && r.pc < 12) out[r.pc] = r.total;
    return out;
  }

  summary(now = Date.now()) {
    const sql = this.ctx.storage.sql;
    const today = utcDay(now);
    const globalTotal = this.meta('total');
    const pitched = this.meta('pitched');
    const latest = sql.exec<{ id: number | null }>('SELECT MAX(id) AS id FROM kb_recent').one().id ?? 0;
    const todayRows = sql.exec<{ total: number }>('SELECT COALESCE(SUM(total), 0) AS total FROM kb_days WHERE day = ?', today).one();
    return {
      globalTotal,
      pitched,
      unpitched: Math.max(0, globalTotal - pitched),
      kinds: sql.exec(
        'SELECT kind, SUM(total) AS total, SUM(hits) AS hits, COUNT(*) AS apps FROM kb_sources GROUP BY kind ORDER BY total DESC',
      ).toArray(),
      sources: sql.exec(
        `SELECT kind, app, total, hits, first_at AS firstAt, last_at AS lastAt
         FROM kb_sources ORDER BY total DESC, app ASC LIMIT 60`,
      ).toArray(),
      places: sql.exec('SELECT place, total, last_at AS lastAt FROM kb_places ORDER BY total DESC, place ASC LIMIT 30').toArray(),
      days: sql.exec('SELECT day, kind, total FROM kb_days ORDER BY day ASC, kind ASC').toArray(),
      pitchClasses: this.pitchRow(sql.exec<{ pc: number; total: number }>('SELECT pc, total FROM kb_pitch').toArray()),
      octaves: sql.exec('SELECT oct, total FROM kb_octaves ORDER BY oct ASC').toArray(),
      today: {
        day: today,
        total: todayRows.total,
        pitchClasses: this.pitchRow(
          sql.exec<{ pc: number; total: number }>('SELECT pc, total FROM kb_pitch_days WHERE day = ?', today).toArray(),
        ),
      },
      live: sql.exec(
        `SELECT kind, app, SUM(keys) + SUM(json_array_length(notes)) AS notes, MAX(at) AS lastAt
         FROM kb_recent WHERE at >= ? GROUP BY kind, app ORDER BY lastAt DESC`,
        now - LIVE_WINDOW_MS,
      ).toArray(),
      latestId: latest,
      recent: sql.exec<PhraseRow>(
        'SELECT id, at, kind, app, place, notes, keys FROM kb_recent ORDER BY id DESC LIMIT 40',
      ).toArray().map(phrase),
    };
  }

  since(after: number) {
    const sql = this.ctx.storage.sql;
    const latest = sql.exec<{ id: number | null }>('SELECT MAX(id) AS id FROM kb_recent').one().id ?? 0;
    // A reader far behind (or from a reset object) gets the newest 40, not a flood.
    const floor = Math.max(after, latest - 40);
    const phrases = sql.exec<PhraseRow>(
      'SELECT id, at, kind, app, place, notes, keys FROM kb_recent WHERE id > ? ORDER BY id ASC LIMIT 40',
      floor,
    ).toArray().map(phrase);
    return { latestId: latest, phrases };
  }

  league(week: string | null, now = Date.now()) {
    const { start, end } = weekBounds(week, now);
    const rows = this.ctx.storage.sql.exec(
      `SELECT kind, app, SUM(MIN(total, ${LEAGUE_DAILY_CAP})) AS points, SUM(total) AS notes, SUM(hits) AS hits,
              COUNT(*) AS days, MAX(last_at) AS lastAt
       FROM kb_app_days WHERE day >= ? AND day <= ?
       GROUP BY kind, app ORDER BY points DESC, lastAt DESC LIMIT ${LEAGUE_ROWS}`,
      start, end,
    ).toArray();
    return { week: { start, end }, dailyCap: LEAGUE_DAILY_CAP, standings: rows };
  }
}
