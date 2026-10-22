/**
 * pointcast-loom — the Loom's Durable Objects (Loom v2).
 *
 * Pages Functions cannot export Durable Object classes, so this Worker hosts
 * `LoomDoc` and the Pages project binds it as LOOM (script_name
 * "pointcast-loom"). functions/api/loom.ts talks to it through doStore() in
 * src/lib/loom/store.mjs; nothing else should.
 *
 * One object per document, addressed by name:
 *   log:<key>   one thread: meta row + one SQLite row per op. Appends are
 *               serialised here, so concurrent writers never lose an op.
 *               Holds the WebSockets of everyone watching the thread and
 *               pushes {type:"ops"} the moment an append lands.
 *   index       the directory (capped list, newest first)
 *   out:<key>   one sender's outbox (capped list)
 *   peers       the peer roll from /.well-known/loom.json handshakes
 *   keys:<key>  one inbox's sealed-message keys (compare-and-set record)
 *
 * Internal protocol (JSON over fetch, ?name=<document name>):
 *   GET  /log                       → { log | null }
 *   POST /log/append  { init, ops, now, title } → { log, ops }   (stamped)
 *   GET  /live        Upgrade: websocket → hello, then ops as they land
 *   GET  /list                      → { list | null }
 *   POST /list/push   { entry, keyField, cap, seed? } → { list } | { needSeed }
 *   GET  /record                    → { record | null }
 *   POST /record/put  { record, expectVersion } → { ok, record } | 409 { ok:false, conflict }
 *
 * The Worker's own fetch handler only answers /status; documents are reached
 * through the binding, never from the internet.
 *
 * Deploy before Pages: `cd workers/loom && npx wrangler deploy`.
 */
import { DurableObject } from 'cloudflare:workers';
// @ts-ignore — plain ESM shared with Pages and the Node tests; bundled by wrangler.
import { publicOp, stampOps, upsertFront } from '../../../src/lib/loom/log.mjs';

interface Env { LOOM: DurableObjectNamespace<LoomDoc> }
type Op = Record<string, unknown> & { seq: number };
type Log = Record<string, unknown> & { key: string; seq: number; ops: Op[]; trimmedBefore?: number };

/** Hard ceiling on watchers per thread; the client falls back to polling past it. */
const MAX_SOCKETS = 1000;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

export class LoomDoc extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS ops (seq INTEGER PRIMARY KEY, op TEXT NOT NULL)');
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private getMeta<T>(k: string): T | null {
    const row = this.sql.exec<{ v: string }>('SELECT v FROM meta WHERE k = ?', k).toArray()[0];
    return row ? (JSON.parse(row.v) as T) : null;
  }
  private setMeta(k: string, v: unknown) {
    this.sql.exec('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)', k, JSON.stringify(v));
  }

  private readLog(): Log | null {
    const meta = this.getMeta<Omit<Log, 'ops'>>('log');
    if (!meta) return null;
    const ops = this.sql.exec<{ op: string }>('SELECT op FROM ops ORDER BY seq').toArray().map((r) => JSON.parse(r.op) as Op);
    return { ...meta, ops } as Log;
  }

  private appendOps(init: Log, ops: Record<string, unknown>[], now: string, title: string | null) {
    return this.ctx.storage.transactionSync(() => {
      let log = this.readLog();
      if (!log) {
        // First write to this thread: adopt the caller's starting point (an empty
        // log, a seed thread, or the thread as it stood in the v1 KV archive).
        log = { ...init, ops: [] } as Log;
        for (const op of init.ops ?? []) this.sql.exec('INSERT OR REPLACE INTO ops (seq, op) VALUES (?, ?)', op.seq, JSON.stringify(op));
        log.ops = [...(init.ops ?? [])];
        delete (log as Record<string, unknown>).seed;
        delete (log as Record<string, unknown>).archived;
      }
      const stamped = stampOps(log, ops, now, { title }) as Op[];
      for (const op of stamped) this.sql.exec('INSERT INTO ops (seq, op) VALUES (?, ?)', op.seq, JSON.stringify(op));
      if (log.trimmedBefore) this.sql.exec('DELETE FROM ops WHERE seq < ?', log.trimmedBefore);
      const { ops: _all, ...meta } = log;
      this.setMeta('log', meta);
      return { log, ops: stamped };
    });
  }

  private broadcast(key: string, seq: number, ops: Op[]) {
    const sockets = this.ctx.getWebSockets();
    if (!sockets.length) return;
    const message = JSON.stringify({ type: 'ops', key, seq, ops: ops.map(publicOp) });
    for (const ws of sockets) {
      try { ws.send(message); } catch { /* a socket that is closing; webSocketClose tidies it */ }
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') ?? '';
    const body = request.method === 'POST' ? await request.json<Record<string, any>>() : {};

    switch (`${request.method} ${url.pathname}`) {
      case 'GET /log':
        return json({ log: this.readLog() });

      case 'POST /log/append': {
        if (!Array.isArray(body.ops) || !body.init || typeof body.now !== 'string') return json({ error: 'bad_request' }, 400);
        const result = this.appendOps(body.init, body.ops, body.now, body.title ?? null);
        this.broadcast(result.log.key, result.log.seq, result.ops);
        return json(result);
      }

      case 'GET /live': {
        if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'websocket_required' }, 426);
        if (this.ctx.getWebSockets().length >= MAX_SOCKETS) return json({ error: 'live_full' }, 503);
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        this.ctx.acceptWebSocket(server);
        const log = this.getMeta<{ key: string; seq: number }>('log');
        server.send(JSON.stringify({ type: 'hello', key: log?.key ?? name.replace(/^log:/, ''), seq: log?.seq ?? 0 }));
        return new Response(null, { status: 101, webSocket: client });
      }

      case 'GET /list':
        return json({ list: this.getMeta('list') });

      case 'POST /list/push': {
        if (!body.entry || typeof body.entry !== 'object') return json({ error: 'bad_request' }, 400);
        const list = this.ctx.storage.transactionSync(() => {
          const current = this.getMeta<unknown[]>('list') ?? (Array.isArray(body.seed) ? body.seed : null);
          if (!current) return null;
          const next = upsertFront(current, body.entry, { keyField: body.keyField ?? null, cap: Math.min(Number(body.cap) || 300, 1000) });
          this.setMeta('list', next);
          return next;
        });
        return json(list ? { list } : { needSeed: true });
      }

      case 'GET /record':
        return json({ record: this.getMeta('record') });

      case 'POST /record/put': {
        const result = this.ctx.storage.transactionSync(() => {
          const current = this.getMeta<{ version?: number }>('record');
          if ((current?.version ?? 0) !== Number(body.expectVersion ?? 0)) return { ok: false, conflict: true, record: current };
          const record = { ...body.record, version: (current?.version ?? 0) + 1 };
          this.setMeta('record', record);
          return { ok: true, record };
        });
        return json(result, result.ok ? 200 : 409);
      }

      default:
        return json({ error: 'not_found' }, 404);
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Watchers only listen. "ping" is answered by the auto-response without
    // waking this object; anything else is ignored.
    if (typeof message === 'string' && message.length > 64) ws.close(1009, 'Watchers only listen');
  }

  async webSocketClose(ws: WebSocket) {
    try { ws.close(1000, 'bye'); } catch { /* already closed */ }
  }

  async webSocketError(ws: WebSocket) {
    try { ws.close(1011, 'error'); } catch { /* already closed */ }
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/status') return json({ ok: true, service: 'pointcast-loom', spec: 'pointcast.loom/v2' });
    return json({ error: 'not_found', note: 'Loom documents are reached through the LOOM binding on pointcast.xyz/api/loom.' }, 404);
  },
} satisfies ExportedHandler<Env>;
