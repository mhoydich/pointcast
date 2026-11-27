/**
 * Loom reply alerts — a read-only, low-token wakeup for one handle.
 *
 * Given logs the caller already has, or a KV binding, collect three kinds of
 * alert and nothing else:
 *   reply    a message whose parent was written by the handle
 *   mention  a direct @handle in `mentions` or in the body
 *   inbox    an open ask or card sitting in the handle's own inbox (@handle)
 *
 * Storage, read the same way as src/lib/loom/service.mjs (`readJson` there):
 *   loom:log:<key>   { address, key, label, updatedAt, ops[] }
 *   loom:index       recent logs, newest first
 *   loom:rooms       topic and inbox directory
 * This module only calls kv.get. It never puts, never appends, and a missing,
 * unbound, or corrupt value becomes an empty list instead of an error.
 *
 * The directory read is capped (ALERT_LOG_CAP) so one poll stays inside a
 * Workers subrequest budget: two directory gets, the inbox, then at most
 * ALERT_LOG_CAP logs, six at a time.
 */
import { SITE, addressKey, extractAddresses, parseAddress } from './address.mjs';
import { normHandle } from './for-you.mjs';
import { fold } from './fold.mjs';

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;
export const ALERT_LOG_CAP = 24;
export const ALERT_READ_CONCURRENCY = 6;
const HANDLE = /^[a-z0-9][a-z0-9_.-]{0,31}$/;
const LOG_KEY = /^[0-9a-f]{24}$/;
const CLOSER = /^\s*(?:CLEARED|DONE|CLOSED|SHIPPED)\b/i;
const RANK = { reply: 3, inbox: 2, mention: 1 };

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'public, max-age=15',
};

export function clampLimit(value) {
  if (value == null || value === '') return DEFAULT_LIMIT;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  return Math.max(0, Math.min(MAX_LIMIT, Math.floor(n)));
}

/** "@Mike", "mike", " MIKE " → "mike". Blank when nothing address-like remains. */
export function normalizeLoomHandle(input) {
  const handle = normHandle(input);
  return HANDLE.test(handle) ? handle : '';
}

const timeOf = (iso) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

const clip = (value, n) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > n ? `${text.slice(0, n - 1)}…` : text;
};

function sameHandle(from, handle) {
  if (!from || !handle) return false;
  return normHandle(from.name) === handle || normHandle(from.address) === handle;
}

function mentionsHandle(message, handle) {
  if (!handle) return false;
  const listed = Array.isArray(message.mentions) ? message.mentions : [];
  if (listed.some((item) => normHandle(item) === handle)) return true;
  const found = extractAddresses(message.body).mentions;
  return found.some((item) => normHandle(item) === handle);
}

function needsHandle(message, handle) {
  const line = String(message.body ?? '').split('\n').find((part) => part.trim()) ?? '';
  const match = line.match(/^\s*NEEDS\s+@?([A-Za-z0-9][A-Za-z0-9_.-]{0,31})\b/i);
  return !!(match && normHandle(match[1]) === handle);
}

function isAsk(message, handle) {
  if (message.kind === 'ask' || message.kind === 'question') return true;
  if (message.ask === true || (message.ask && typeof message.ask === 'object')) return true;
  return needsHandle(message, handle);
}

function isCard(message) {
  if (message.kind === 'card') return true;
  return !!message.card && typeof message.card === 'object';
}

function isClosed(message, kids) {
  if (message.hidden || message.withdrawn || message.open === false) return true;
  const status = String(message.status ?? message.taskStatus?.status ?? '').toLowerCase();
  if (status === 'closed' || status === 'done' || status === 'cleared') return true;
  const stack = [...(kids.get(message.id) ?? [])];
  const seen = new Set();
  while (stack.length) {
    const reply = stack.pop();
    if (!reply || seen.has(reply.id)) continue;
    seen.add(reply.id);
    if (reply.hidden || reply.withdrawn) continue;
    if (reply.kind === 'answer') return true;
    if (CLOSER.test(String(reply.body ?? ''))) return true;
    const replyStatus = String(reply.taskStatus?.status ?? '').toLowerCase();
    if (replyStatus === 'done' || replyStatus === 'cleared') return true;
    stack.push(...(kids.get(reply.id) ?? []));
  }
  return false;
}

function isInboxAddress(address, handle) {
  if (!handle || typeof address !== 'string' || !address.trim()) return false;
  try {
    const parsed = parseAddress(address);
    return parsed.kind === 'handle' && normHandle(parsed.address) === handle;
  } catch {
    return false;
  }
}

function threadOf(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  let messages = null;
  if (Array.isArray(entry.ops)) {
    try {
      const folded = fold(entry.ops);
      const asks = new Map();
      for (const op of entry.ops) {
        if (op && op.op === 'append' && op.id != null && op.ask != null) asks.set(op.id, op.ask);
      }
      messages = asks.size
        ? folded.messages.map((message) => (asks.has(message.id) ? { ...message, ask: asks.get(message.id) } : message))
        : folded.messages;
    } catch {
      messages = null;
    }
  }
  if (!messages && Array.isArray(entry.messages)) messages = entry.messages;
  if (!Array.isArray(messages)) return null;
  return {
    address: typeof entry.address === 'string' ? entry.address : '',
    key: typeof entry.key === 'string' ? entry.key : '',
    label: typeof entry.label === 'string' ? entry.label : null,
    inbox: entry.inbox === true,
    messages,
  };
}

function locate(thread, message) {
  const via = message.via;
  if (via && typeof via === 'object' && via.id && via.key) {
    return {
      id: String(via.id),
      key: String(via.key),
      address: typeof via.address === 'string' && via.address ? via.address : thread.address,
      echo: true,
    };
  }
  return { id: String(message.id), key: thread.key, address: thread.address, echo: false };
}

function toAlert(thread, message, where, reason) {
  const id = where.id;
  const address = where.address || thread.address || '';
  const key = where.key || thread.key || '';
  return {
    id,
    reason,
    at: typeof message.at === 'string' ? message.at : null,
    seq: Number.isFinite(message.seq) ? message.seq : null,
    kind: message.kind || (isCard(message) ? 'card' : 'note'),
    address,
    key,
    label: thread.label,
    from: {
      name: message.from?.name || 'someone',
      kind: message.from?.kind || 'human',
      address: message.from?.address ?? null,
    },
    excerpt: clip(message.body, 140),
    permalink: `${SITE}/loom?to=${encodeURIComponent(address)}#${encodeURIComponent(id)}`,
    replyAddress: key ? `loom:${key}#${id}` : `loom:#${id}`,
    echo: where.echo,
  };
}

/**
 * Pure extract. `logs` may be stored logs (`ops`) or already-folded threads
 * (`messages`). Hidden and withdrawn messages drop out. Self-authored
 * replies and mentions drop out. One alert per message id; a reply outranks
 * an inbox ask, which outranks a mention.
 */
export function collectReplyAlerts({ handle, logs = [], since = null, limit = DEFAULT_LIMIT } = {}) {
  const owner = normalizeLoomHandle(handle);
  const applied = clampLimit(limit);
  const cursor = since == null || since === '' ? null : timeOf(since);
  const found = new Map();

  const threads = [];
  for (const entry of Array.isArray(logs) ? logs : []) {
    const thread = threadOf(entry);
    if (thread) threads.push(thread);
  }

  for (const thread of threads) {
    const messages = thread.messages.filter((message) => message && typeof message === 'object' && message.id && !message.hidden && !message.withdrawn);
    const byId = new Map(messages.map((message) => [message.id, message]));
    const kids = new Map();
    for (const message of messages) {
      if (!message.parent || !byId.has(message.parent)) continue;
      if (!kids.has(message.parent)) kids.set(message.parent, []);
      kids.get(message.parent).push(message);
    }
    const inbox = thread.inbox || isInboxAddress(thread.address, owner);
    for (const message of messages) {
      if (!owner || sameHandle(message.from, owner)) continue;
      const at = timeOf(message.at);
      if (cursor != null && !(at != null && at > cursor)) continue;
      const parent = message.parent ? byId.get(message.parent) : null;
      const reply = !!(parent && sameHandle(parent.from, owner));
      const mention = mentionsHandle(message, owner);
      const inboxItem = inbox && (isAsk(message, owner) || isCard(message)) && !isClosed(message, kids);
      const reason = reply ? 'reply' : inboxItem ? 'inbox' : mention ? 'mention' : null;
      if (!reason) continue;
      const where = locate(thread, message);
      const alert = toAlert(thread, message, where, reason);
      const prev = found.get(alert.id);
      if (!prev || RANK[reason] > prev.rank || (RANK[reason] === prev.rank && prev.alert.echo && !alert.echo)) {
        found.set(alert.id, { rank: RANK[reason], alert });
      }
    }
  }

  const newest = (a, b) => (timeOf(b.at) ?? -1) - (timeOf(a.at) ?? -1) || (b.seq ?? 0) - (a.seq ?? 0) || String(a.id).localeCompare(String(b.id));
  const all = [...found.values()].map((item) => item.alert).sort(newest);
  const alerts = all.slice(0, applied).map(({ echo, ...alert }) => alert);
  return {
    ok: true,
    for: owner ? `@${owner}` : '',
    since: cursor == null ? null : new Date(cursor).toISOString(),
    limit: applied,
    count: alerts.length,
    total: all.length,
    alerts,
  };
}

/** One concise line per alert, for a bot wakeup that should stay small. */
export function formatReplyAlertsText(result) {
  const who = result?.for || '@';
  const alerts = Array.isArray(result?.alerts) ? result.alerts : [];
  if (!alerts.length) return `loom alerts ${who}: 0\n`;
  const lines = alerts.map((alert) => {
    const name = clip(alert.from?.name || 'someone', 24);
    const where = alert.address || alert.label || '';
    const kind = alert.kind ? ` ${alert.kind}` : '';
    return `${alert.reason} ${name} ${where}${kind} ${clip(alert.excerpt, 64)} ${alert.replyAddress} ${alert.permalink}`;
  });
  return `loom alerts ${who}: ${alerts.length}\n${lines.join('\n')}\n`;
}

async function readJson(kv, key, fallback) {
  if (!kv || typeof kv.get !== 'function') return fallback;
  try {
    const raw = await kv.get(key);
    if (raw == null || raw === '') return fallback;
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function pickDirectory(index, rooms, inboxKey, sinceMs) {
  const byKey = new Map();
  for (const list of [index, rooms]) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const key = typeof entry.key === 'string' ? entry.key : '';
      if (!LOG_KEY.test(key) || key === inboxKey) continue;
      const prev = byKey.get(key);
      if (!prev || String(entry.updatedAt ?? '') > String(prev.updatedAt ?? '')) byKey.set(key, entry);
    }
  }
  let entries = [...byKey.values()];
  if (sinceMs != null) {
    entries = entries.filter((entry) => {
      const updated = timeOf(entry.updatedAt);
      return updated == null || updated > sinceMs;
    });
  }
  entries.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
  return entries.slice(0, ALERT_LOG_CAP);
}

async function readInOrder(items, read) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Math.min(ALERT_READ_CONCURRENCY, items.length);
  if (!workers) return results;
  await Promise.all(Array.from({ length: workers }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await read(items[index]);
    }
  }));
  return results;
}

/**
 * Read the handle's inbox plus the newest directory logs. Unbound KV and
 * unreadable values yield an empty alert list with kvBound false or a
 * shorter scan — never a throw, never a write.
 */
export async function readLoomAlerts(kv, { handle, since = null, limit = DEFAULT_LIMIT } = {}) {
  const owner = normalizeLoomHandle(handle);
  const empty = collectReplyAlerts({ handle: owner, logs: [], since, limit });
  if (!owner || !kv || typeof kv.get !== 'function') {
    return { ...empty, kvBound: false, scanned: { logs: 0, directory: 0, directoryCap: ALERT_LOG_CAP } };
  }
  const inboxAddress = `@${owner}`;
  let inboxKey = '';
  try { inboxKey = await addressKey(inboxAddress); } catch { inboxKey = ''; }
  const sinceMs = empty.since ? timeOf(empty.since) : null;
  const [index, rooms] = await Promise.all([
    readJson(kv, 'loom:index', []),
    readJson(kv, 'loom:rooms', []),
  ]);
  const directory = pickDirectory(index, rooms, inboxKey, sinceMs);
  const logs = [];
  if (inboxKey) {
    const inbox = await readJson(kv, `loom:log:${inboxKey}`, null);
    if (inbox && typeof inbox === 'object' && !Array.isArray(inbox)) {
      logs.push({ ...inbox, key: inbox.key || inboxKey, address: inbox.address || inboxAddress, inbox: true });
    }
  }
  const loaded = await readInOrder(directory, (entry) => readJson(kv, `loom:log:${entry.key}`, null));
  for (const log of loaded) {
    if (log && typeof log === 'object' && !Array.isArray(log)) logs.push(log);
  }
  const result = collectReplyAlerts({ handle: owner, logs, since, limit });
  return { ...result, kvBound: true, scanned: { logs: logs.length, directory: directory.length, directoryCap: ALERT_LOG_CAP } };
}

async function etagOf(body) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `"${hex}"`;
}

function ifNoneMatch(header, etag) {
  if (!header) return false;
  const want = etag.replace(/^W\//, '');
  return header.split(',').some((part) => {
    const token = part.trim();
    if (token === '*') return true;
    return token.replace(/^W\//, '') === want;
  });
}

function json(body, status, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? HEADERS['Cache-Control'] : 'no-store',
      ...extra,
    },
  });
}

/**
 * GET /api/loom/alerts?for=<handle>&since=<iso>&limit=<n>&format=json|text
 * `handle` is an alias for `for`. Missing both is 400. Unbound KV is an
 * empty 200. If-None-Match against the body ETag is 304.
 */
export async function handleLoomAlerts(request, { kv = null } = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' });
  }
  const url = new URL(request.url);
  const hasFor = url.searchParams.has('for');
  const hasHandle = url.searchParams.has('handle');
  if (!hasFor && !hasHandle) return json({ ok: false, error: 'for_required' }, 400);
  const raw = hasFor ? url.searchParams.get('for') : url.searchParams.get('handle');
  if (raw == null || !String(raw).trim()) return json({ ok: false, error: 'for_required' }, 400);
  const owner = normalizeLoomHandle(raw);
  if (!owner) return json({ ok: false, error: 'for_invalid' }, 400);
  const sinceRaw = url.searchParams.get('since');
  if (sinceRaw != null && sinceRaw !== '' && timeOf(sinceRaw) == null) return json({ ok: false, error: 'since_invalid' }, 400);
  const format = url.searchParams.get('format') || 'json';
  if (format !== 'json' && format !== 'text') return json({ ok: false, error: 'format_invalid' }, 400);
  const limit = clampLimit(url.searchParams.has('limit') ? url.searchParams.get('limit') : DEFAULT_LIMIT);
  const result = await readLoomAlerts(kv, { handle: owner, since: sinceRaw || null, limit });
  const body = format === 'text' ? formatReplyAlertsText(result) : JSON.stringify(result);
  const etag = await etagOf(body);
  const headers = {
    ...HEADERS,
    'Content-Type': format === 'text' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    ETag: etag,
  };
  if (ifNoneMatch(request.headers.get('if-none-match'), etag)) return new Response(null, { status: 304, headers });
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  return new Response(body, { status: 200, headers });
}
