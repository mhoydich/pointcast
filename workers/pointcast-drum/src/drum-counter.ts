import { DurableObject } from "cloudflare:workers";

const KEY_GLOBAL = "drum:total";
const KEY_TOP = "drum:top";
const SESSION_PREFIX = "drum:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const FLUSH_AFTER_TAPS = 50;
const FLUSH_AFTER_MS = 15_000;

// The drum signal: every beat can say where it came from. Kinds are a closed
// set; app and place are free slugs from the sender, so both tables are capped
// and overflow folds into a shared row instead of growing without bound.
export const SIGNAL_KINDS = ["pointcast", "embed", "standalone", "artifact", "agent", "other"] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];
export interface SignalSource {
  kind: SignalKind;
  app: string;
  place: string | null;
}
const MAX_SOURCE_ROWS = 2000;
const MAX_PLACE_ROWS = 500;
const RECENT_SIGNALS = 60;
const SIGNAL_DAYS = 90;

function slug(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw.toLowerCase().trim().replace(/[^a-z0-9._/:-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);
}

export function normalizeSource(raw: unknown): SignalSource | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as { kind?: unknown; app?: unknown; place?: unknown };
  const kind = SIGNAL_KINDS.includes(input.kind as SignalKind) ? (input.kind as SignalKind) : "other";
  return { kind, app: slug(input.app, 48) || "unknown", place: slug(input.place, 32) || null };
}

interface Env {
  VISITS: KVNamespace;
}

interface TopEntry {
  hash: string;
  nounId: number;
  count: number;
}

interface TopSqlEntry extends TopEntry {
  [key: string]: string | number | null;
}

function json(value: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...init.headers },
  });
}

function countOf(raw: string | null): number {
  return raw ? Number(raw) || 0 : 0;
}

/**
 * One strongly-consistent counter object for the legacy /api/drum surface.
 * SQLite is authoritative; KV is a compatibility mirror flushed in bounded
 * batches so older readers (including the top-ten endpoint) keep working.
 */
export class DrumCounter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS drum_counter_meta (
          key TEXT PRIMARY KEY,
          value INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS drum_counter_sessions (
          session_hash TEXT PRIMARY KEY,
          total INTEGER NOT NULL,
          dirty INTEGER NOT NULL DEFAULT 0,
          leaderboard_hash TEXT,
          noun_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS drum_signal_sources (
          kind TEXT NOT NULL,
          app TEXT NOT NULL,
          total INTEGER NOT NULL,
          hits INTEGER NOT NULL,
          first_at INTEGER NOT NULL,
          last_at INTEGER NOT NULL,
          PRIMARY KEY (kind, app)
        );
        CREATE TABLE IF NOT EXISTS drum_signal_places (
          place TEXT PRIMARY KEY,
          total INTEGER NOT NULL,
          last_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS drum_signal_days (
          day TEXT NOT NULL,
          kind TEXT NOT NULL,
          total INTEGER NOT NULL,
          PRIMARY KEY (day, kind)
        );
        CREATE TABLE IF NOT EXISTS drum_signal_recent (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          at INTEGER NOT NULL,
          kind TEXT NOT NULL,
          app TEXT NOT NULL,
          place TEXT,
          beats INTEGER NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const session = (url.searchParams.get("session") || "").slice(0, 16);
    if (!/^[a-f0-9]{16}$/i.test(session) && session) return json({ ok: false, reason: "bad-session" }, { status: 400 });

    if (request.method === "GET") {
      if (url.searchParams.get("top") === "1") return json({ entries: await this.topEntries() });
      if (url.searchParams.get("signal") === "1") return json(await this.signalSummary());
      const globalTotal = await this.globalTotal();
      const yourTotal = session ? await this.sessionTotal(session) : 0;
      return json({ globalTotal, yourTotal });
    }
    if (request.method !== "POST") return json({ ok: false, reason: "method-not-allowed" }, { status: 405 });

    let body: { delta?: unknown; leaderboardHash?: unknown; nounId?: unknown; source?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, reason: "bad-body" }, { status: 400 });
    }
    const source = normalizeSource(body.source);
    // A tagged signal may be anonymous (an embed or a server with no visitor
    // session); it counts globally and by source but not on the leaderboard.
    if (!session && !source) return json({ ok: false, reason: "missing-session" }, { status: 400 });
    const delta = typeof body.delta === "number" && Number.isFinite(body.delta)
      ? Math.max(0, Math.min(1000, Math.floor(body.delta)))
      : 0;
    const globalTotal = await this.globalTotal();
    const yourTotal = session ? await this.sessionTotal(session) : 0;
    if (delta === 0) return json({ ok: true, globalTotal, yourTotal });

    const nextGlobal = globalTotal + delta;
    const nextSession = session ? yourTotal + delta : 0;
    const leaderboardHash = typeof body.leaderboardHash === "string" && /^[a-f0-9]{8}$/i.test(body.leaderboardHash)
      ? body.leaderboardHash
      : null;
    const nounId = typeof body.nounId === "number" && Number.isInteger(body.nounId)
      ? Math.max(0, Math.min(1199, body.nounId))
      : null;
    // The first request normally hydrates this from KV, but a brand-new
    // namespace has no `global` row to UPDATE. Upsert so the DO, rather than
    // the lagging mirror, remains authoritative from its very first tap.
    this.setMeta("global", nextGlobal);
    if (source) this.recordSignal(source, delta, Date.now());
    if (session) this.ctx.storage.sql.exec(
      `UPDATE drum_counter_sessions
       SET total = ?, dirty = 1, leaderboard_hash = COALESCE(?, leaderboard_hash), noun_id = COALESCE(?, noun_id)
       WHERE session_hash = ?`,
      nextSession, leaderboardHash, nounId, session,
    );
    const pending = this.meta("pending") + delta;
    this.setMeta("pending", pending);
    if (pending >= FLUSH_AFTER_TAPS) await this.flush();
    else await this.ctx.storage.setAlarm(Date.now() + FLUSH_AFTER_MS);
    return json({ ok: true, globalTotal: nextGlobal, yourTotal: nextSession, ...(source ? { source } : {}) });
  }

  private recordSignal(source: SignalSource, beats: number, now: number): void {
    const sql = this.ctx.storage.sql;
    let { kind, app } = source;
    const known = sql.exec("SELECT 1 FROM drum_signal_sources WHERE kind = ? AND app = ?", kind, app).toArray().length > 0;
    if (!known && sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM drum_signal_sources").one().n >= MAX_SOURCE_ROWS) app = "overflow";
    sql.exec(
      `INSERT INTO drum_signal_sources (kind, app, total, hits, first_at, last_at) VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT(kind, app) DO UPDATE SET total = total + excluded.total, hits = hits + 1, last_at = excluded.last_at`,
      kind, app, beats, now, now,
    );
    let place = source.place;
    if (place) {
      const knownPlace = sql.exec("SELECT 1 FROM drum_signal_places WHERE place = ?", place).toArray().length > 0;
      if (!knownPlace && sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM drum_signal_places").one().n >= MAX_PLACE_ROWS) place = "elsewhere";
      sql.exec(
        `INSERT INTO drum_signal_places (place, total, last_at) VALUES (?, ?, ?)
         ON CONFLICT(place) DO UPDATE SET total = total + excluded.total, last_at = excluded.last_at`,
        place, beats, now,
      );
    }
    const day = new Date(now).toISOString().slice(0, 10);
    sql.exec(
      `INSERT INTO drum_signal_days (day, kind, total) VALUES (?, ?, ?)
       ON CONFLICT(day, kind) DO UPDATE SET total = total + excluded.total`,
      day, kind, beats,
    );
    sql.exec("INSERT INTO drum_signal_recent (at, kind, app, place, beats) VALUES (?, ?, ?, ?, ?)", now, kind, app, place, beats);
    sql.exec(`DELETE FROM drum_signal_recent WHERE id <= (SELECT MAX(id) FROM drum_signal_recent) - ?`, RECENT_SIGNALS);
    const oldest = new Date(now - SIGNAL_DAYS * 86_400_000).toISOString().slice(0, 10);
    sql.exec("DELETE FROM drum_signal_days WHERE day < ?", oldest);
  }

  private async signalSummary() {
    const sql = this.ctx.storage.sql;
    const globalTotal = await this.globalTotal();
    const kinds = sql.exec<{ kind: string; total: number; hits: number; apps: number; lastAt: number }>(
      `SELECT kind, SUM(total) AS total, SUM(hits) AS hits, COUNT(*) AS apps, MAX(last_at) AS lastAt
       FROM drum_signal_sources GROUP BY kind ORDER BY total DESC`,
    ).toArray();
    const attributed = kinds.reduce((sum, row) => sum + row.total, 0);
    return {
      globalTotal,
      attributed,
      // Every beat counted before the signal shipped carried no source.
      unattributed: Math.max(0, globalTotal - attributed),
      kinds,
      sources: sql.exec(
        `SELECT kind, app, total, hits, first_at AS firstAt, last_at AS lastAt
         FROM drum_signal_sources ORDER BY total DESC, app ASC LIMIT 60`,
      ).toArray(),
      places: sql.exec(
        "SELECT place, total, last_at AS lastAt FROM drum_signal_places ORDER BY total DESC, place ASC LIMIT 30",
      ).toArray(),
      days: sql.exec("SELECT day, kind, total FROM drum_signal_days ORDER BY day ASC, kind ASC").toArray(),
      recent: sql.exec(
        `SELECT at, kind, app, place, beats FROM drum_signal_recent ORDER BY id DESC LIMIT ${RECENT_SIGNALS}`,
      ).toArray(),
    };
  }

  async alarm(): Promise<void> {
    await this.flush();
  }

  private async globalTotal(): Promise<number> {
    const existing = this.rowValue("global");
    if (existing !== undefined) return existing;
    const legacy = countOf(await this.env.VISITS.get(KEY_GLOBAL));
    this.setMeta("global", legacy);
    return legacy;
  }

  private async sessionTotal(session: string): Promise<number> {
    const row = this.ctx.storage.sql.exec<{ total: number }>(
      "SELECT total FROM drum_counter_sessions WHERE session_hash = ?", session,
    ).toArray()[0];
    if (row) return row.total;
    const legacy = countOf(await this.env.VISITS.get(`${SESSION_PREFIX}${session}`));
    this.ctx.storage.sql.exec(
      "INSERT INTO drum_counter_sessions (session_hash, total) VALUES (?, ?)", session, legacy,
    );
    return legacy;
  }

  private async flush(): Promise<void> {
    const pending = this.meta("pending");
    if (pending <= 0) return;
    const globalTotal = await this.globalTotal();
    const changed = this.ctx.storage.sql.exec<{
      session_hash: string; total: number; leaderboard_hash: string | null; noun_id: number | null;
    }>("SELECT session_hash, total, leaderboard_hash, noun_id FROM drum_counter_sessions WHERE dirty = 1").toArray();
    // A deployment can briefly leave more than one isolate with pending
    // mirror work. KV is last-writer-wins, so never let an older mirror write
    // a smaller global total over a newer one. The DO remains authoritative.
    const mirroredGlobal = Math.max(countOf(await this.env.VISITS.get(KEY_GLOBAL)), globalTotal);
    const writes: Promise<void>[] = [this.env.VISITS.put(KEY_GLOBAL, String(mirroredGlobal))];
    for (const row of changed) {
      writes.push(this.env.VISITS.put(`${SESSION_PREFIX}${row.session_hash}`, String(row.total), { expirationTtl: SESSION_TTL_SECONDS }));
    }
    const top = await this.nextTop(changed);
    if (top) writes.push(this.env.VISITS.put(KEY_TOP, JSON.stringify(top)));
    await Promise.all(writes);
    this.ctx.storage.sql.exec("UPDATE drum_counter_sessions SET dirty = 0 WHERE dirty = 1");
    this.setMeta("pending", 0);
  }

  private async nextTop(changed: Array<{ leaderboard_hash: string | null; noun_id: number | null; total: number }>): Promise<TopEntry[] | null> {
    const candidates = changed.filter((row): row is { leaderboard_hash: string; noun_id: number; total: number } =>
      Boolean(row.leaderboard_hash) && typeof row.noun_id === "number",
    );
    if (!candidates.length) return null;
    let current: TopEntry[] = [];
    try {
      const raw = await this.env.VISITS.get(KEY_TOP);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) current = parsed.filter((entry): entry is TopEntry =>
        typeof entry?.hash === "string" && typeof entry?.nounId === "number" && typeof entry?.count === "number",
      );
    } catch { /* treat malformed legacy data as an empty board */ }
    for (const candidate of candidates) {
      const existing = current.find((entry) => entry.hash === candidate.leaderboard_hash);
      if (existing) existing.count = Math.max(existing.count, candidate.total);
      else if (current.length < 10 || candidate.total > (current[current.length - 1]?.count ?? 0)) {
        current.push({ hash: candidate.leaderboard_hash, nounId: candidate.noun_id, count: candidate.total });
      }
    }
    return current.sort((a, b) => b.count - a.count).slice(0, 10);
  }

  private async topEntries(): Promise<Array<TopEntry & { rank: number }>> {
    const rows = this.ctx.storage.sql.exec<TopSqlEntry>(
      `SELECT leaderboard_hash AS hash, noun_id AS nounId, total AS count
       FROM drum_counter_sessions
       WHERE leaderboard_hash IS NOT NULL AND noun_id IS NOT NULL
       ORDER BY total DESC, session_hash ASC
       LIMIT 10`,
    ).toArray();
    let current: TopEntry[] = [];
    try {
      const raw = await this.env.VISITS.get(KEY_TOP);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) current = parsed.filter((entry): entry is TopEntry =>
        typeof entry?.hash === "string" && typeof entry?.nounId === "number" && typeof entry?.count === "number",
      );
    } catch { /* an unavailable or malformed compatibility mirror is non-fatal */ }
    for (const row of rows) {
      const existing = current.find((entry) => entry.hash === row.hash);
      if (existing) existing.count = Math.max(existing.count, row.count);
      else current.push({ hash: row.hash, nounId: row.nounId, count: row.count });
    }
    return current
      .sort((a, b) => b.count - a.count || a.hash.localeCompare(b.hash))
      .slice(0, 10)
      .map((row, index) => ({ rank: index + 1, ...row }));
  }

  private rowValue(key: string): number | undefined {
    return this.ctx.storage.sql.exec<{ value: number }>("SELECT value FROM drum_counter_meta WHERE key = ?", key).toArray()[0]?.value;
  }

  private meta(key: string): number {
    return this.rowValue(key) ?? 0;
  }

  private setMeta(key: string, value: number): void {
    this.ctx.storage.sql.exec(
      "INSERT INTO drum_counter_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      key, value,
    );
  }
}
