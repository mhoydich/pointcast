import { DurableObject } from "cloudflare:workers";

const KEY_GLOBAL = "drum:total";
const KEY_TOP = "drum:top";
const SESSION_PREFIX = "drum:session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const FLUSH_AFTER_TAPS = 50;
const FLUSH_AFTER_MS = 15_000;

interface Env {
  VISITS: KVNamespace;
}

interface TopEntry {
  hash: string;
  nounId: number;
  count: number;
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
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const session = (url.searchParams.get("session") || "").slice(0, 16);
    if (!/^[a-f0-9]{16}$/i.test(session) && session) return json({ ok: false, reason: "bad-session" }, { status: 400 });

    if (request.method === "GET") {
      const globalTotal = await this.globalTotal();
      const yourTotal = session ? await this.sessionTotal(session) : 0;
      return json({ globalTotal, yourTotal });
    }
    if (request.method !== "POST") return json({ ok: false, reason: "method-not-allowed" }, { status: 405 });

    let body: { delta?: unknown; leaderboardHash?: unknown; nounId?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, reason: "bad-body" }, { status: 400 });
    }
    if (!session) return json({ ok: false, reason: "missing-session" }, { status: 400 });
    const delta = typeof body.delta === "number" && Number.isFinite(body.delta)
      ? Math.max(0, Math.min(1000, Math.floor(body.delta)))
      : 0;
    const globalTotal = await this.globalTotal();
    const yourTotal = await this.sessionTotal(session);
    if (delta === 0) return json({ ok: true, globalTotal, yourTotal });

    const nextGlobal = globalTotal + delta;
    const nextSession = yourTotal + delta;
    const leaderboardHash = typeof body.leaderboardHash === "string" && /^[a-f0-9]{8}$/i.test(body.leaderboardHash)
      ? body.leaderboardHash
      : null;
    const nounId = typeof body.nounId === "number" && Number.isInteger(body.nounId)
      ? Math.max(0, Math.min(1199, body.nounId))
      : null;
    this.ctx.storage.sql.exec("UPDATE drum_counter_meta SET value = ? WHERE key = 'global'", nextGlobal);
    this.ctx.storage.sql.exec(
      `UPDATE drum_counter_sessions
       SET total = ?, dirty = 1, leaderboard_hash = COALESCE(?, leaderboard_hash), noun_id = COALESCE(?, noun_id)
       WHERE session_hash = ?`,
      nextSession, leaderboardHash, nounId, session,
    );
    const pending = this.meta("pending") + delta;
    this.setMeta("pending", pending);
    if (pending >= FLUSH_AFTER_TAPS) await this.flush();
    else await this.ctx.storage.setAlarm(Date.now() + FLUSH_AFTER_MS);
    return json({ ok: true, globalTotal: nextGlobal, yourTotal: nextSession });
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
    const writes: Promise<void>[] = [this.env.VISITS.put(KEY_GLOBAL, String(globalTotal))];
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
      if (existing) existing.count = candidate.total;
      else if (current.length < 10 || candidate.total > (current[current.length - 1]?.count ?? 0)) {
        current.push({ hash: candidate.leaderboard_hash, nounId: candidate.noun_id, count: candidate.total });
      }
    }
    return current.sort((a, b) => b.count - a.count).slice(0, 10);
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
