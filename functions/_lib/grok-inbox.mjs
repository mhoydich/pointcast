/**
 * Grok inbox. Public pings for the /grok page, stored in VISITS KV
 * (the same namespace as /api/letters and /api/wire) under grok:inbox:.
 *
 * There is no shared profanity list in this repo. Text is cleaned the
 * same way as /api/wire: control characters stripped, whitespace collapsed,
 * length capped. Links are refused, same idea as the Want Ads board.
 *
 * Answers: POST /api/grok/inbox/:id/answer with
 * Authorization: Bearer $GROK_INBOX_TOKEN
 * Set that in Cloudflare Pages → Settings → Environment variables, encrypted.
 * Do not commit a value. Until it is set, the /grok page treats a grok
 * devnet post whose title or body contains "re: ping <id>" as the reply.
 */

export const TEXT_MAX = 280;
export const REPLY_MAX = 500;
export const HANDLE_MAX = 24;
export const KINDS = ['ping', 'question', 'game', 'sky'];
const INDEX_KEY = 'grok:inbox:index';
const MAX_PINGS = 80;
const TTL_SEC = 90 * 24 * 3600;
const ID_RE = /^g[a-z0-9]{8}$/;

export function cleanLine(raw, max) {
  return String(raw || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function newPingId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = 'g';
  for (const byte of bytes) id += alphabet[byte % alphabet.length];
  return id;
}

export function parseIncoming(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'invalid json' };
  if (typeof body.company === 'string' && body.company.trim()) {
    return { ok: false, error: 'could not take that', honeypot: true };
  }
  const kind = body.kind;
  if (!KINDS.includes(kind)) return { ok: false, error: 'kind must be ping, question, game, or sky' };
  const text = cleanLine(body.text, TEXT_MAX);
  if (!text) return { ok: false, error: 'write a line' };
  if (text.length > TEXT_MAX) return { ok: false, error: '280 characters' };
  if (/https?:\/\/|www\./i.test(text)) return { ok: false, error: 'no links in a ping' };
  const handleRaw = cleanLine(body.handle, HANDLE_MAX);
  const handle = handleRaw ? handleRaw : null;
  if (handle && !/^[a-z0-9][a-z0-9 -]{0,23}$/i.test(handle)) {
    return { ok: false, error: 'handle is letters, numbers, spaces, and hyphens' };
  }
  let sky = null;
  if (kind === 'sky') {
    sky = body.sky === 'yes' || body.sky === 'no' ? body.sky : null;
    if (!sky) return { ok: false, error: 'sky call needs a yes or no for the marine layer' };
  }
  return { ok: true, kind, text, handle, sky };
}

export function publicPing(record) {
  return {
    id: record.id,
    created_at: record.created_at,
    handle: record.handle,
    kind: record.kind,
    text: record.text,
    status: record.status,
    sky: record.sky,
    reply_text: record.reply_text,
    devnet_tx: record.devnet_tx,
  };
}

export function replyMarker(id) {
  return `re: ping ${id}`;
}

export function matchDevnetReply(text, id) {
  if (!ID_RE.test(id) || typeof text !== 'string') return false;
  return new RegExp(`re:\\s*ping\\s+${id}\\b`, 'i').test(text);
}

function recordKey(id) {
  return `grok:inbox:${id}`;
}

async function readIndex(kv) {
  const raw = await kv.get(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => ID_RE.test(id)) : [];
  } catch {
    return [];
  }
}

async function readRecord(kv, id) {
  const raw = await kv.get(recordKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !ID_RE.test(parsed.id)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function listPings(kv, status = 'all') {
  const ids = await readIndex(kv);
  const records = [];
  const keep = [];
  for (const id of ids) {
    const record = await readRecord(kv, id);
    if (!record) continue;
    keep.push(id);
    if (status === 'all' || record.status === status) records.push(publicPing(record));
  }
  records.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return records;
}

export async function savePing(kv, fields) {
  const record = {
    id: newPingId(),
    created_at: new Date().toISOString(),
    handle: fields.handle,
    kind: fields.kind,
    text: fields.text,
    status: 'open',
    sky: fields.sky,
    reply_text: null,
    devnet_tx: null,
    answered_at: null,
  };
  const ids = [record.id, ...(await readIndex(kv))].slice(0, MAX_PINGS);
  await kv.put(recordKey(record.id), JSON.stringify(record), { expirationTtl: TTL_SEC });
  await kv.put(INDEX_KEY, JSON.stringify(ids));
  return publicPing(record);
}

export async function answerPing(kv, id, reply) {
  if (!ID_RE.test(id)) return { ok: false, status: 404, error: 'no such ping' };
  const record = await readRecord(kv, id);
  if (!record) return { ok: false, status: 404, error: 'no such ping' };
  const replyText = cleanLine(reply.reply_text, REPLY_MAX);
  if (!replyText) return { ok: false, status: 400, error: 'reply_text is required' };
  const tx = cleanLine(reply.devnet_tx, 80);
  record.reply_text = replyText;
  record.devnet_tx = tx || null;
  record.status = 'answered';
  record.answered_at = new Date().toISOString();
  await kv.put(recordKey(record.id), JSON.stringify(record), { expirationTtl: TTL_SEC });
  return { ok: true, status: 200, ping: publicPing(record) };
}

export function tokensMatch(given, expected) {
  if (!expected || !given) return false;
  const len = Math.max(given.length, expected.length);
  let diff = given.length === expected.length ? 0 : 1;
  for (let i = 0; i < len; i += 1) {
    diff |= (given.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function bearerToken(header) {
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header || '');
  return match ? match[1] : '';
}
