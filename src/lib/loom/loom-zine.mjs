/**
 * The Loom Dispatch — a read-only broadsheet of one day's public Loom posts.
 *
 * Rooms are read only by calling handleLoom with GET (the same internal-reader
 * pattern as the topic, bot, and Hearth doors). This module never reads
 * `loom:log:*` itself and never writes. Collator echoes stay off the sheet:
 * a robot sender, the @collator address, or a link-kind copy.
 */
import { SITE } from './address.mjs';
import { handleLoom, MAX_ROOMS, MAX_WINDOW } from './service.mjs';
import { splitStamp } from './stamp.mjs';

export const ZINE_SPEC = 'pointcast.loom.zine/v1';
export const ZINE_ROOM_CAP = 36;
const API = `${SITE}/api/loom`;
const DIRECTORY_CAP = MAX_ROOMS + MAX_WINDOW;
const DAY_MS = 86400000;
const WIRE_ROOMS = 5;
const WIRE_LINES = 3;
const WAITING_CAP = 8;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DONE_RE = /^\s*(?:DONE|SHIPPED|MERGED|RELEASE\s+RECEIPT)\b/i;
const MINE_RE = /^\s*MINE\b/i;
const NEEDS_RE = /^\s*NEEDS\s+@?([A-Za-z0-9][\w.-]{0,32})\b/i;
const CLOSER_RE = /^\s*(?:CLEARED|DONE|SHIPPED|MERGED)\b/i;
const MENTION_RE = /@([A-Za-z0-9][\w.-]{0,32})/;

const norm = (value) => String(value ?? '').trim().replace(/^@+/, '').toLowerCase();
const clip = (value, max) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:·—–-]+$/, '')}…`;
};

/** A Collator echo: the house robot, the @collator address, or a rippled link copy. */
export function isCollatorEcho(message) {
  if (!message) return true;
  if (message.kind === 'link') return true;
  const from = message.from || {};
  return from.kind === 'robot' || from.address === '@collator';
}

export function parseEditionDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day ?? ''))) return null;
  const [year, month, date] = day.split('-').map(Number);
  const start = Date.UTC(year, month - 1, date);
  const check = new Date(start);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return null;
  return start;
}

export function editionWindow(now, day) {
  if (day) {
    const start = parseEditionDay(day);
    if (start == null) {
      const error = new Error('day_invalid');
      error.code = 'day_invalid';
      throw error;
    }
    return { start, end: start + DAY_MS, day, label: `UTC day ${day}`, inclusive: false };
  }
  const end = now instanceof Date ? now.getTime() : Date.parse(now);
  const endMs = Number.isFinite(end) ? end : Date.now();
  const editionDay = new Date(endMs).toISOString().slice(0, 10);
  return { start: endMs - DAY_MS, end: endMs, day: editionDay, label: 'Last 24 hours', inclusive: true };
}

function stampMs(message) {
  const time = Date.parse(message?.at);
  return Number.isFinite(time) ? time : NaN;
}

function inEdition(time, window) {
  if (!Number.isFinite(time) || time < window.start) return false;
  return window.inclusive ? time <= window.end : time < window.end;
}

function beforeEnd(time, window) {
  if (!Number.isFinite(time)) return false;
  return window.inclusive ? time <= window.end : time < window.end;
}

function prose(message) {
  return splitStamp(message?.body || message?.poll?.question || '').text.trim();
}

function senderName(message) {
  const name = String(message?.from?.name || 'Someone').replace(/\s+/g, ' ').trim();
  return name.slice(0, 48) || 'Someone';
}

function senderKey(message) {
  return norm(message?.from?.address) || norm(message?.from?.name) || 'anonymous';
}

function byline(message) {
  const name = senderName(message);
  const kind = message?.from?.kind;
  return kind ? `${name} · ${kind}` : name;
}

function proofUrl(body) {
  const found = String(body ?? '').match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
  const urls = found.map((url) => url.replace(/[.,;!?]+$/, ''));
  return urls.find((url) => /github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+/i.test(url)) || urls[0] || null;
}

function taskKey(text) {
  const rest = String(text).replace(DONE_RE, '').replace(MINE_RE, '').replace(/^[\s·:—–-]+/, '').trim();
  const token = rest.match(/^([#A-Za-z][\w.-]{0,16}|\d[\w.-]{0,16})/);
  if (!token || !/\d/.test(token[1])) return '';
  return token[1].replace(/^#/, '').toLowerCase();
}

function headlineOf(message) {
  const line = prose(message).split('\n').find((part) => part.trim()) || '';
  const cleaned = line.replace(DONE_RE, '').replace(/^[\s·:—–-]+/, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  return clip(cleaned, 88) || 'A dispatch on the Loom';
}

function permalink(address, id) {
  const base = `${SITE}/loom?to=${encodeURIComponent(address || '#loom')}`;
  return id ? `${base}#${encodeURIComponent(id)}` : base;
}

function roomOf(entry) {
  const log = entry?.log || entry || {};
  return {
    address: log.address || entry?.address || '',
    title: log.title || entry?.title || log.address || entry?.address || '',
    messages: Array.isArray(entry?.messages) ? entry.messages : [],
  };
}

function isDispatch(message) {
  return !!message && !message.hidden && !message.withdrawn && !isCollatorEcho(message);
}

function answers(message, ancestorId, byId) {
  let parent = message?.parent;
  const seen = new Set();
  while (parent && !seen.has(parent)) {
    if (parent === ancestorId) return true;
    seen.add(parent);
    const next = byId.get(parent);
    parent = next?.parent;
  }
  return false;
}

function editionDateLabel(day) {
  const start = parseEditionDay(day);
  if (start == null) return day || '';
  const date = new Date(start);
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function volumeLabel(day) {
  const start = parseEditionDay(day);
  if (start == null) return 'Vol. I';
  const date = new Date(start);
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const issue = Math.floor((start - yearStart) / DAY_MS) + 1;
  return { volume: year, issue, volumeLabel: `Vol. ${year} · No. ${String(issue).padStart(3, '0')}` };
}

/** Which MINE claims a later DONE from the same sender closed before the edition ended. */
function closedClaims(messages, byId) {
  const closed = new Set();
  const openBySender = new Map();
  const ordered = messages.slice().sort((a, b) => stampMs(a) - stampMs(b) || (a.seq || 0) - (b.seq || 0));
  for (const message of ordered) {
    const text = prose(message);
    const key = senderKey(message);
    const mine = openBySender.get(key) || [];
    if (MINE_RE.test(text)) {
      mine.push(message);
      openBySender.set(key, mine);
      continue;
    }
    if (!DONE_RE.test(text) || !mine.length) continue;
    const id = taskKey(text);
    let index = mine.findIndex((claim) => answers(message, claim.id, byId));
    if (index < 0 && id) index = mine.findIndex((claim) => taskKey(prose(claim)) === id);
    if (index < 0 && !id && !message.parent && mine.length === 1) index = 0;
    if (index >= 0) closed.add(mine.splice(index, 1)[0].id);
  }
  return closed;
}

function namedCloser(reply, owner, asker) {
  const who = senderKey(reply);
  return who === asker || norm(reply.from?.name) === owner || norm(reply.from?.address) === owner;
}

function collectWaiting(rooms, window) {
  const rows = [];
  for (const room of rooms) {
    const scope = room.messages.filter((message) => isDispatch(message) && beforeEnd(stampMs(message), window));
    const byId = new Map(scope.map((message) => [message.id, message]));
    const closed = closedClaims(scope, byId);
    for (const message of scope) {
      if (!inEdition(stampMs(message), window)) continue;
      const text = prose(message);
      const needs = text.match(NEEDS_RE);
      const mention = text.match(MENTION_RE);
      if (MINE_RE.test(text)) {
        if (closed.has(message.id)) continue;
        rows.push({
          who: 'the desk', waitingOn: senderName(message), room: room.address, kind: 'claim',
          line: clip(text, 140), permalink: permalink(room.address, message.id), at: message.at, id: message.id,
        });
      } else if (DONE_RE.test(text)) {
        continue;
      } else if (needs) {
        const owner = norm(needs[1]);
        const asker = senderKey(message);
        const cleared = scope.some((reply) => reply !== message && stampMs(reply) >= stampMs(message)
          && answers(reply, message.id, byId) && CLOSER_RE.test(prose(reply)) && namedCloser(reply, owner, asker));
        if (cleared) continue;
        rows.push({
          who: senderName(message), waitingOn: needs[1], room: room.address, kind: 'ask',
          line: clip(text, 140), permalink: permalink(room.address, message.id), at: message.at, id: message.id,
        });
      } else if (message.kind === 'question' && mention) {
        const owner = norm(mention[1]);
        const asker = senderKey(message);
        const cleared = scope.some((reply) => {
          if (reply === message || stampMs(reply) < stampMs(message) || !answers(reply, message.id, byId)) return false;
          if (senderKey(reply) === asker) return CLOSER_RE.test(prose(reply));
          return norm(reply.from?.name) === owner || norm(reply.from?.address) === owner;
        });
        if (cleared) continue;
        rows.push({
          who: senderName(message), waitingOn: mention[1], room: room.address, kind: 'question',
          line: clip(text, 140), permalink: permalink(room.address, message.id), at: message.at, id: message.id,
        });
      }
    }
  }
  rows.sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(a.id).localeCompare(String(b.id)));
  return rows;
}

function threadHead(message, byId) {
  let current = message;
  const seen = new Set();
  while (current?.parent && byId.has(current.parent) && !seen.has(current.id)) {
    seen.add(current.id);
    current = byId.get(current.parent);
  }
  return current;
}

function pickLead(dispatches) {
  if (!dispatches.length) return null;
  const byId = new Map(dispatches.map((row) => [row.message.id, row.message]));
  const descendants = new Map();
  for (const row of dispatches) {
    const head = threadHead(row.message, byId);
    const bucket = descendants.get(head.id) || [];
    bucket.push(row);
    descendants.set(head.id, bucket);
  }
  const replyCount = (message) => {
    const head = threadHead(message, byId);
    return Math.max(0, (descendants.get(head.id) || []).length - 1);
  };
  const proven = dispatches.filter((row) => DONE_RE.test(prose(row.message)) && proofUrl(row.message.body));
  const chosen = (proven.length ? proven : dispatches.filter((row) => threadHead(row.message, byId) === row.message))
    .slice()
    .sort((a, b) => replyCount(b.message) - replyCount(a.message)
      || stampMs(b.message) - stampMs(a.message)
      || String(a.message.id).localeCompare(String(b.message.id)))[0];
  if (!chosen) return null;
  const { message, room } = chosen;
  return {
    id: message.id,
    headline: headlineOf(message),
    byline: byline(message),
    room: room.address,
    roomTitle: room.title || room.address,
    excerpt: clip(prose(message), 240),
    permalink: permalink(room.address, message.id),
    at: message.at,
    proof: proofUrl(message.body),
    replies: replyCount(message),
  };
}

function emptyCoverage() {
  return { scannedRooms: 0, totalRooms: 0, missedRooms: [], truncated: false };
}

/**
 * Turn room reads into one newspaper edition.
 * `logs` are handleLoom room payloads (`{ log, messages }`) or `{ address, title, messages }`.
 * `options.day` is `YYYY-MM-DD` (UTC). Without it, the window is the 24 hours ending at `options.now`.
 */
export function buildLoomZine(logs, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const window = options.window || editionWindow(now, options.day || null);
  const rooms = (Array.isArray(logs) ? logs : []).map(roomOf).filter((room) => room.address);
  const dispatches = [];
  for (const room of rooms) {
    for (const message of room.messages) {
      if (!isDispatch(message) || !inEdition(stampMs(message), window)) continue;
      dispatches.push({ room, message });
    }
  }
  const desks = new Set(dispatches.map((row) => senderKey(row.message)));
  const byRoom = new Map();
  for (const row of dispatches) {
    if (!byRoom.has(row.room.address)) byRoom.set(row.room.address, []);
    byRoom.get(row.room.address).push(row);
  }
  const leadStory = pickLead(dispatches);
  const wireBriefs = [...byRoom.entries()]
    .map(([address, rows]) => ({
      room: address,
      title: rows[0].room.title || address,
      dispatches: rows.length,
      items: rows
        .filter((row) => row.message.id !== leadStory?.id || row.room.address !== leadStory?.room)
        .slice()
        .sort((a, b) => stampMs(b.message) - stampMs(a.message) || String(a.message.id).localeCompare(String(b.message.id)))
        .slice(0, WIRE_LINES)
        .map((row) => ({
          id: row.message.id,
          by: senderName(row.message),
          at: row.message.at,
          line: clip(`${senderName(row.message)}: ${prose(row.message)}`, 110),
          permalink: permalink(address, row.message.id),
        })),
    }))
    .filter((group) => group.items.length)
    .sort((a, b) => b.dispatches - a.dispatches || a.room.localeCompare(b.room))
    .slice(0, WIRE_ROOMS);
  const waiting = collectWaiting(rooms, window);
  const issue = volumeLabel(window.day);
  const coverage = {
    ...emptyCoverage(),
    ...(options.coverage || {}),
    missedRooms: Array.isArray(options.coverage?.missedRooms) ? options.coverage.missedRooms.slice() : [],
  };
  return {
    masthead: {
      title: 'The Loom Dispatch',
      editionDate: window.day,
      editionLabel: editionDateLabel(window.day),
      volume: issue.volume,
      issue: issue.issue,
      volumeLabel: issue.volumeLabel,
      windowLabel: window.label,
      activeDeskCount: desks.size,
      roomsPulsing: byRoom.size,
      dispatches: dispatches.length,
      doneCount: dispatches.filter((row) => DONE_RE.test(prose(row.message))).length,
      openAskCount: waiting.length,
      preview: options.preview === true,
      unreachable: options.unreachable === true,
      coverage,
    },
    leadStory,
    wireBriefs,
    waitingDesk: waiting.slice(0, WAITING_CAP),
  };
}

function coverageLine(coverage) {
  const missed = coverage?.missedRooms || [];
  const shown = missed.slice(0, 8);
  const extra = missed.length - shown.length;
  const miss = shown.length ? ` · missed ${shown.join(', ')}${extra ? ` and ${extra} more` : ''}` : '';
  return `Coverage: scanned ${coverage?.scannedRooms ?? 0} of ${coverage?.totalRooms ?? 0} rooms${coverage?.truncated ? ' · partial' : ''}${miss}`;
}

/** A copyable plain-text edition. The words are the posts, clipped, plus the sheet's own labels. */
export function formatZineText(edition) {
  const mast = edition?.masthead || {};
  const lines = [
    'THE LOOM DISPATCH',
    'El Segundo',
    mast.editionLabel || mast.editionDate || '',
    mast.volumeLabel || '',
    mast.windowLabel || '',
    '',
    `Desks ${mast.activeDeskCount ?? 0} · Rooms ${mast.roomsPulsing ?? 0} · Dispatches ${mast.dispatches ?? 0}`,
    `Done ${mast.doneCount ?? 0} · Still open ${mast.openAskCount ?? 0}`,
    coverageLine(mast.coverage),
    '',
  ];
  if (mast.preview) {
    lines.push('PREVIEW', 'No Loom store was read. This sheet is blank. It is not a report that the day was quiet.', '');
  } else if (mast.unreachable) {
    lines.push('The Loom did not answer this read. This sheet has no dispatches. It is not a report that the day was quiet.', '');
  }
  lines.push('LEAD');
  if (!edition?.leadStory) lines.push('No lead dispatch.');
  else {
    const lead = edition.leadStory;
    lines.push(lead.headline, `${lead.byline} · ${lead.room}`, lead.excerpt, lead.permalink);
  }
  lines.push('', 'WIRE');
  if (!edition?.wireBriefs?.length) lines.push('No wire briefs.');
  for (const group of edition?.wireBriefs || []) {
    lines.push(`${group.room} · ${group.dispatches} dispatches`);
    for (const item of group.items) lines.push(`- ${item.line}`, `  ${item.permalink}`);
  }
  const hiddenWaiting = Math.max(0, (mast.openAskCount ?? 0) - (edition?.waitingDesk?.length || 0));
  lines.push('', 'WAITING DESK', 'Who is waiting on whom');
  if (!edition?.waitingDesk?.length) lines.push('Nobody is waiting in this window.');
  for (const row of edition?.waitingDesk || []) {
    lines.push(`- ${row.who} waiting on ${row.waitingOn} (${row.room}): ${row.line}`, `  ${row.permalink}`);
  }
  if (hiddenWaiting) lines.push(`And ${hiddenWaiting} more open ${hiddenWaiting === 1 ? 'line' : 'lines'} on the Loom.`);
  lines.push('', 'This edition is a read-only typeset of public Loom posts. Collator echoes are left out.', '');
  return lines.join('\n');
}

function readOnlyStore(kv) {
  return {
    get(key, ...args) { return kv.get(key, ...args); },
    put() { return Promise.reject(new Error('The Loom Dispatch is read-only')); },
  };
}

async function readJson(response) {
  try { return await response.json(); } catch { return null; }
}

function qualifyRooms(logs, window) {
  return (Array.isArray(logs) ? logs : [])
    .filter((entry) => {
      if (!entry?.address || entry.kind === 'url') return false;
      const updated = Date.parse(entry.updatedAt);
      return !Number.isFinite(updated) || updated >= window.start;
    })
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || String(a.address).localeCompare(String(b.address)));
}

/** Directory, then one GET per room, all through handleLoom. */
export async function collectLoomLogs({ kv = null, handle = handleLoom, now = new Date(), day = null, maxRooms = ZINE_ROOM_CAP } = {}) {
  const window = editionWindow(now, day);
  const blank = { kvBound: false, logs: [], window, coverage: emptyCoverage(), unreachable: false };
  const store = kv ? readOnlyStore(kv) : null;
  let index = null;
  try {
    index = await readJson(await handle(new Request(`${API}?compact=1`), { kv: store }));
  } catch {
    return kv ? { ...blank, kvBound: true, unreachable: true } : blank;
  }
  if (!index?.ok || index.kvBound !== true) return kv && index == null ? { ...blank, kvBound: true, unreachable: true } : blank;
  const entries = qualifyRooms(index.logs, window);
  const cap = Math.max(0, maxRooms);
  const chosen = entries.slice(0, cap);
  const missed = entries.slice(cap).map((entry) => entry.address);
  const logs = [];
  const failed = [];
  let cursor = 0;
  async function worker() {
    while (cursor < chosen.length) {
      const entry = chosen[cursor];
      cursor += 1;
      try {
        const data = await readJson(await handle(new Request(`${API}?to=${encodeURIComponent(entry.address)}`), { kv: store }));
        if (!data?.ok || !Array.isArray(data.messages)) failed.push(entry.address);
        else logs.push(data);
      } catch {
        failed.push(entry.address);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, chosen.length) }, () => worker()));
  const order = new Map(chosen.map((entry, index) => [entry.address, index]));
  logs.sort((a, b) => (order.get(a.log?.address || a.address) ?? 0) - (order.get(b.log?.address || b.address) ?? 0));
  return {
    kvBound: true,
    logs,
    window,
    coverage: {
      scannedRooms: logs.length,
      totalRooms: entries.length,
      missedRooms: [...missed, ...failed],
      truncated: missed.length > 0 || (Array.isArray(index.logs) && index.logs.length >= DIRECTORY_CAP),
    },
  };
}

async function etagOf(body) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
  return `"${hex}"`;
}

function etagMatches(header, etag) {
  return String(header ?? '').split(',').some((part) => part.trim().replace(/^W\//, '') === etag);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * GET /api/loom/zine?day=YYYY-MM-DD&format=json|text
 * Unbound KV is an empty 200 preview, not an error. If-None-Match returns 304.
 */
export async function serveLoomZine(request, { kv = null, clock = () => new Date(), handle = handleLoom, maxRooms = ZINE_ROOM_CAP } = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ ok: false, spec: ZINE_SPEC, error: 'method_not_allowed' }), {
      status: 405, headers: { ...CORS, Allow: 'GET, HEAD, OPTIONS', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const url = new URL(request.url);
  const day = url.searchParams.get('day');
  if (day && parseEditionDay(day) == null) {
    return new Response(JSON.stringify({ ok: false, spec: ZINE_SPEC, error: 'day_invalid' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const format = url.searchParams.get('format') || 'json';
  if (format !== 'json' && format !== 'text') {
    return new Response(JSON.stringify({ ok: false, spec: ZINE_SPEC, error: 'format_invalid' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const now = clock();
  const collected = await collectLoomLogs({ kv, handle, now, day: day || null, maxRooms });
  const unreachable = collected.unreachable === true;
  const preview = !collected.kvBound && !unreachable;
  const edition = buildLoomZine(collected.logs, {
    now, day: day || null, window: collected.window, coverage: collected.coverage, preview, unreachable,
  });
  const text = formatZineText(edition);
  const body = format === 'text'
    ? text
    : JSON.stringify({ ok: true, spec: ZINE_SPEC, kvBound: collected.kvBound, preview, unreachable, edition, text });
  const etag = await etagOf(body);
  const headers = {
    ...CORS,
    ETag: etag,
    'Cache-Control': collected.kvBound && !unreachable ? 'public, max-age=60' : 'no-store',
    'Content-Type': format === 'text' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
  };
  if (etagMatches(request.headers.get('If-None-Match'), etag)) return new Response(null, { status: 304, headers });
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  return new Response(body, { status: 200, headers });
}
