/** One SQLite Durable Object per invitation room. Private Notes never enter this service. */
import { DurableObject } from 'cloudflare:workers';
import {
  MAX_BODY_BYTES,
  MAX_PASSAGES,
  ROOM_ID_PATTERN,
  parsePassageInput,
} from './contract';

interface Env {
  KEYBOARD_STUDIO: DurableObjectNamespace<KeyboardStudioRoom>;
}

interface PassageRow {
  id: string;
  name: string;
  text: string;
  at: number;
}

function json(value: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

async function boundedJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error('invalid-body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error('body-too-large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('invalid-json');
  }
}

export class KeyboardStudioRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Synchronous setup completes before this instance handles requests.
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS passages (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        text TEXT NOT NULL,
        client_id TEXT NOT NULL UNIQUE,
        at INTEGER NOT NULL
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const room = new URL(request.url).searchParams.get('room');
    if (!room || !ROOM_ID_PATTERN.test(room)) return json({ error: 'invalid-room' }, 400);

    if (request.method === 'GET') {
      const latest = this.ctx.storage.sql.exec<{ latest: number }>(
        'SELECT COALESCE(MAX(seq), 0) AS latest FROM passages',
      ).one().latest;
      const etag = `"${latest}"`;
      if (request.headers.get('if-none-match') === etag) {
        return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': 'no-store' } });
      }
      const passages = this.ctx.storage.sql.exec<PassageRow>(
        'SELECT id, name, text, at FROM passages ORDER BY seq ASC LIMIT ?',
        MAX_PASSAGES,
      ).toArray();
      return json({ room, passages }, 200, { ETag: etag });
    }

    if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
      return json({ error: 'expected-json' }, 415);
    }

    let raw: unknown;
    try {
      raw = await boundedJson(request);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'invalid-body' },
        error instanceof Error && error.message === 'body-too-large' ? 413 : 400);
    }
    const input = parsePassageInput(raw);
    if (!input) return json({ error: 'invalid-passage', limits: { name: 32, text: 3000 } }, 400);

    // `clientId` is one submission's idempotency key. A network retry returns
    // the original passage, even if the room has since reached capacity.
    const prior = this.ctx.storage.sql.exec<PassageRow>(
      'SELECT id, name, text, at FROM passages WHERE client_id = ?', input.clientId,
    ).toArray()[0];
    if (prior) {
      if (prior.name !== input.name || prior.text !== input.text) return json({ error: 'client-id-conflict' }, 409);
      return json({ room, passage: prior }, 200);
    }

    // A room has one serial execution point; no await separates capacity check and insert.
    const count = this.ctx.storage.sql.exec<{ count: number }>('SELECT COUNT(*) AS count FROM passages').one().count;
    if (count >= MAX_PASSAGES) return json({ error: 'room-full', limit: MAX_PASSAGES }, 409);

    const passage: PassageRow = { id: crypto.randomUUID(), name: input.name, text: input.text, at: Date.now() };
    this.ctx.storage.sql.exec(
      'INSERT INTO passages (id, name, text, client_id, at) VALUES (?, ?, ?, ?, ?)',
      passage.id, passage.name, passage.text, input.clientId, passage.at,
    );
    return json({ room, passage }, 201);
  }
}

// Direct access to the host Worker is disabled; Pages binds to the class by script_name.
export default {
  fetch(): Response {
    return json({ error: 'not-found' }, 404);
  },
};
