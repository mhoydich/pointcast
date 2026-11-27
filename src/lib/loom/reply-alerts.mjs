/**
 * Loom reply alerts — a read-only, low-token wakeup for one handle.
 *
 * Given logs the caller already has, collect three kinds of alert:
 *   reply    a message whose parent was written by the handle (name, @address, or operator)
 *   mention  a direct @handle in the prose (not in a quote or a code span)
 *   inbox    an open ask or card sitting in the handle's own inbox (@handle)
 *
 * This is not For You (`GET /api/loom?for=NAME`, `/loom/for/NAME`). For You
 * builds three piles — people, NEEDS your yes, arrivals — plus activity.replies
 * inside a multi-day window. Alerts is the short machine wakeup: JSON or one
 * line per alert (`format=text`), a `since` cursor, and an ETag/304. Collator
 * echoes are left out. It does not call buildPiles.
 *
 * Reads go through handleLoom, the same way the Hearth server readers do:
 * a source function is the D1 reader (atomicReader after the storage cutover);
 * a KV binding is read with internal GETs. This module does not touch storage keys.
 * The directory scan is capped at ALERT_LOG_CAP rooms. The inbox is always
 * read. scannedRooms, totalRooms, missedRooms, and truncated say what the cap
 * left out. Nothing here writes.
 */
import { handleLoom } from './service.mjs';
import { SITE, extractAddresses, parseAddress } from './address.mjs';
import { normHandle } from './for-you.mjs';
import { fold } from './fold.mjs';

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;
export const ALERT_LOG_CAP = 24;
export const ALERT_READ_CONCURRENCY = 6;
const API = 'https://pointcast.xyz/api/loom';
const HANDLE = /^[a-z0-9][a-z0-9_.-]{0,31}$/;
const CLOSER = /^\s*(?:CLEARED|DONE|CLOSED|SHIPPED)\b/i;
const FENCED_CODE = /```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)/g;
const INLINE_CODE = /`[^`\n]*`/g;
const QUOTED_LINE = /^[ \t]*(?:>|&gt;)[^\n]*(?:\n|$)/gm;
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

/** Name, @address, or operator. Operator is case-insensitive via normHandle. */
function sameHandle(from, handle) {
  if (!from || !handle) return false;
  return normHandle(from.name) === handle || normHandle(from.address) === handle || normHandle(from.operator) === handle;
}

/** Collator housekeeping and ripple copies. A real note that @mentions someone stays. */
function collatorEcho(message) {
  const from = message?.from;
  if (from?.kind === 'robot') return true;
  if (String(from?.address ?? '').trim().toLowerCase() === '@collator') return true;
  return message?.kind === 'link';
}

/** Prose only: drop fenced code, inline code, and lines that start with `>`. */
function mentionProse(body) {
  return String(body ?? '').replace(FENCED_CODE, ' ').replace(INLINE_CODE, ' ').replace(QUOTED_LINE, ' ');
}

function mentionsHandle(message, handle) {
  if (!handle) return false;
  const prose = mentionProse(message.body);
  if (extractAddresses(prose).mentions.some((item) => normHandle(item) === handle)) return true;
  // An explicit mentions[] entry still counts when the body never wrote the
  // handle. A handle that appears only inside a quote or a code span does not.
  const listed = Array.isArray(message.mentions) ? message.mentions : [];
  if (!listed.some((item) => normHandle(item) === handle)) return false;
  const inRaw = extractAddresses(message.body).mentions.some((item) => normHandle(item) === handle);
  return !inRaw;
}

function needsHandle(message, handle) {
  const line = mentionProse(message.body).split('\n').find((part) => part.trim()) ?? '';
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
      if (!owner || collatorEcho(message) || sameHandle(message.from, owner)) continue;
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
  const note = result?.truncated
    ? `note: scanned ${result.scannedRooms} of ${result.totalRooms} rooms, missed ${result.missedRooms}\n`
    : '';
  if (!alerts.length) return `loom alerts ${who}: 0\n${note}`;
  const lines = alerts.map((alert) => {
    const name = clip(alert.from?.name || 'someone', 24);
    const where = alert.address || alert.label || '';
    const kind = alert.kind ? ` ${alert.kind}` : '';
    return `${alert.reason} ${name} ${where}${kind} ${clip(alert.excerpt, 64)} ${alert.replyAddress} ${alert.permalink}`;
  });
  return `loom alerts ${who}: ${alerts.length}\n${lines.join('\n')}\n${note}`;
}

function roomCoverage({ scannedRooms = 0, totalRooms = 0, logs = 0 } = {}, kvBound = false) {
  const missedRooms = Math.max(0, totalRooms - scannedRooms);
  return {
    kvBound,
    scannedRooms,
    totalRooms,
    missedRooms,
    truncated: missedRooms > 0,
    scanned: { logs, directory: scannedRooms, directoryCap: ALERT_LOG_CAP, totalRooms, missedRooms },
  };
}

/**
 * Hearth's read slot: a function is the authoritative reader (the atomic D1
 * reader after cutover). A KV binding is read by handleLoom's own GET.
 * There is no second storage path and no direct key read.
 */
function loomRead(source) {
  if (typeof source === 'function') return source;
  return (request) => handleLoom(request, { kv: source });
}

async function loomGet(read, query) {
  try {
    const response = await read(new Request(`${API}${query}`));
    if (!response?.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function pickRooms(entries, inboxAddress, sinceMs) {
  const byAddress = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || typeof entry !== 'object') continue;
    const address = typeof entry.address === 'string' ? entry.address : '';
    if (!address || address === inboxAddress) continue;
    const prev = byAddress.get(address);
    if (!prev || String(entry.updatedAt ?? '') > String(prev.updatedAt ?? '')) byAddress.set(address, entry);
  }
  let rooms = [...byAddress.values()];
  if (sinceMs != null) {
    rooms = rooms.filter((entry) => {
      const updated = timeOf(entry.updatedAt);
      return updated == null || updated > sinceMs;
    });
  }
  rooms.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
  return rooms;
}

function viewToLog(view, address, { inbox = false } = {}) {
  if (!view || view.ok === false) return null;
  const log = view.log && typeof view.log === 'object' ? view.log : {};
  if (!Array.isArray(view.ops) && !Array.isArray(view.messages)) return null;
  return {
    address: typeof log.address === 'string' && log.address ? log.address : address,
    key: typeof log.key === 'string' ? log.key : '',
    label: typeof log.label === 'string' ? log.label : null,
    ...(inbox ? { inbox: true } : {}),
    ...(Array.isArray(view.ops) ? { ops: view.ops } : { messages: view.messages }),
  };
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
 * Read the handle's inbox plus the newest directory rooms through handleLoom.
 * `source` is a reader function or a KV binding. Unbound or unreadable storage
 * yields an empty alert list — never a throw, never a write.
 * At most ALERT_LOG_CAP directory rooms are opened. scannedRooms / totalRooms /
 * missedRooms / truncated report the cap.
 */
export async function readLoomAlerts(source, { handle, since = null, limit = DEFAULT_LIMIT } = {}) {
  const owner = normalizeLoomHandle(handle);
  const empty = collectReplyAlerts({ handle: owner, logs: [], since, limit });
  const usable = typeof source === 'function' || (source && typeof source.get === 'function');
  if (!owner || !usable) return { ...empty, ...roomCoverage({}, false) };
  const read = loomRead(source);
  const inboxAddress = `@${owner}`;
  const sinceMs = empty.since ? timeOf(empty.since) : null;
  const directory = await loomGet(read, '?compact=1');
  const rooms = pickRooms(directory?.logs, inboxAddress, sinceMs);
  const picked = rooms.slice(0, ALERT_LOG_CAP);
  const logs = [];
  const inbox = viewToLog(await loomGet(read, `?to=${encodeURIComponent(inboxAddress)}`), inboxAddress, { inbox: true });
  if (inbox) logs.push(inbox);
  const loaded = await readInOrder(picked, (entry) => loomGet(read, `?to=${encodeURIComponent(entry.address)}`).then((view) => viewToLog(view, entry.address)));
  for (const log of loaded) if (log) logs.push(log);
  const result = collectReplyAlerts({ handle: owner, logs, since, limit });
  return { ...result, ...roomCoverage({ scannedRooms: picked.length, totalRooms: rooms.length, logs: logs.length }, true) };
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
 * `handle` is an alias for `for`. Missing both is 400. Unbound storage is an
 * empty 200. If-None-Match against the body ETag is 304.
 * `source` is the Hearth reader slot (a function, or a KV passed to handleLoom).
 * `kv` is the same slot when the caller has not wrapped it yet.
 */
export async function handleLoomAlerts(request, { kv = null, source = null } = {}) {
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
  const result = await readLoomAlerts(source ?? kv, { handle: owner, since: sinceRaw || null, limit });
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
