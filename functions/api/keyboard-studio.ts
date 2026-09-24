/** Pages entry for signed, invitation-only Keyboard Studio rooms. */

interface Env {
  KEYBOARD_STUDIO?: DurableObjectNamespace;
  KEYBOARD_STUDIO_SIGNING_KEY?: string;
  PC_RATES_KV?: KVNamespace;
}

const ROOM_ID_PATTERN = /^[0-9a-f]{32}$/;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const SIGNING_KEY_PATTERN = /^[0-9a-f]{64}$/i;
const MAX_BODY_BYTES = 12_000;
const encoder = new TextEncoder();

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

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function unhex(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function signingKey(secret: string | undefined): Promise<CryptoKey | null> {
  if (!secret || !SIGNING_KEY_PATTERN.test(secret)) return null;
  try {
    return await crypto.subtle.importKey(
      'raw', unhex(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
    );
  } catch {
    return null;
  }
}

function signedData(room: string): Uint8Array<ArrayBuffer> {
  return encoder.encode('pointcast-keyboard-studio-room:v1:' + room);
}

async function signRoom(key: CryptoKey, room: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, signedData(room))));
}

async function validToken(key: CryptoKey, room: string, token: string | null): Promise<boolean> {
  if (!ROOM_ID_PATTERN.test(room) || !token || !TOKEN_PATTERN.test(token)) return false;
  return crypto.subtle.verify('HMAC', key, unhex(token), signedData(room));
}

// Creation and posting fail closed when the shared rate-limit store cannot be read or written.
async function rateGate(
  request: Request, kv: KVNamespace | undefined, bucket: string, seconds: number, limit: number,
): Promise<Response | null> {
  if (!kv) return json({ error: 'rate-limit-unavailable' }, 503);
  // Cloudflare supplies this header in production. Local previews share one conservative bucket.
  const address = request.headers.get('cf-connecting-ip') || 'local';
  const addressHash = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(address))));
  const windowIndex = Math.floor(Date.now() / (seconds * 1000));
  const key = 'rl:keyboard-studio:' + bucket + ':' + addressHash + ':' + windowIndex;
  try {
    const raw = await kv.get(key);
    const count = raw === null ? 0 : Number(raw);
    if (!Number.isSafeInteger(count) || count < 0) return json({ error: 'rate-limit-unavailable' }, 503);
    if (count >= limit) {
      const retryAfter = seconds - Math.floor(Date.now() / 1000) % seconds;
      return json({ error: 'rate-limited', retryAfter }, 429, { 'Retry-After': String(retryAfter) });
    }
    await kv.put(key, String(count + 1), { expirationTtl: seconds + 60 });
    return null;
  } catch {
    return json({ error: 'rate-limit-unavailable' }, 503);
  }
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const request = ctx.request;
  const url = new URL(request.url);
  const room = url.searchParams.get('room');
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405, { Allow: 'GET, POST' });
  }
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    if ((origin && origin !== url.origin) || (site && site !== 'same-origin' && site !== 'none')) {
      return json({ error: 'same-origin-only' }, 403);
    }
  }

  const key = await signingKey(ctx.env.KEYBOARD_STUDIO_SIGNING_KEY);
  if (!key) return json({ error: 'studio-unavailable' }, 503);

  // A signed capability is issued before the room DO exists. Its first GET may be empty.
  if (request.method === 'POST' && !room && url.searchParams.get('action') === 'create') {
    const limited = await rateGate(request, ctx.env.PC_RATES_KV, 'create', 3600, 6);
    if (limited) return limited;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const id = hex(bytes);
    return json({ room: id, token: await signRoom(key, id) }, 201);
  }

  if (!room || !ROOM_ID_PATTERN.test(room)) return json({ error: 'invalid-room' }, 400);
  if (!await validToken(key, room, url.searchParams.get('token'))) {
    return json({ error: 'invalid-invite' }, 403);
  }

  if (request.method === 'POST') {
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
      return json({ error: 'expected-json' }, 415);
    }
    const contentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json({ error: 'body-too-large' }, 413);
    }
    const limited = await rateGate(request, ctx.env.PC_RATES_KV, 'post', 60, 12);
    if (limited) return limited;
  }

  const studio = ctx.env.KEYBOARD_STUDIO;
  if (!studio) return json({ error: 'studio-unavailable' }, 503);
  try {
    const id = studio.idFromName('keyboard-studio:' + room);
    return await studio.get(id).fetch(request);
  } catch {
    return json({ error: 'studio-unavailable' }, 503);
  }
};
