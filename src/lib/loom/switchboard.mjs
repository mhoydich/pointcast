/**
 * The Loom Switchboard — a read-only graph of who posted where.
 *
 * Rooms are read by calling handleLoom with an internal GET, the same way the
 * topic and bot front doors read. This module never touches `loom:log:*` and
 * never writes. `serveSwitchboard` passes handleLoom a get-only view of KV so
 * a directory backfill inside handleLoom cannot persist.
 *
 * The pure builder (`buildSwitchboardGraph`) is what the tests and the sketch
 * share. When KV is unbound or the directory is only the built-in #loom seed,
 * the API returns `sampleSwitchboard`, a labeled demonstration board.
 */
import { extractAddresses, parseAddress } from './address.mjs';

export const SPEC = 'pointcast.loom.switchboard/v1';
export const SITE = 'https://pointcast.xyz';
export const LIVE_MS = 15 * 60 * 1000;
export const WARM_MS = 6 * 60 * 60 * 1000;
export const DEFAULT_LIMIT = 8;
export const MAX_LIMIT = 24;
export const SNIPPET_MAX = 140;

/** Directory stamp of the built-in #loom seed in service.mjs. A real post moves `updatedAt`. */
const LOOM_SEED_EPOCH = '2026-10-20T16:00:00.000Z';

export const SAMPLE_NOTICE = 'Demonstration board. No Loom store is bound, so these cords are a labeled sample, not traffic from the Loom.';
export const LIVE_NOTICE = 'Read from the Loom. A lamp follows the time of the latest post on the rooms scanned. It does not mean a person is at a desk.';
export const EMPTY_NOTICE = 'The Loom store answered. The rooms scanned had no posts from people or agents.';
export const MISS_NOTICE = 'The Loom store answered, and one or more room reads did not come back. Nothing on this board was invented to fill the gap.';

const LAMP_RANK = { waiting: 0, live: 1, warm: 2, idle: 3 };
const LAMP_WORD = { live: 'Live', warm: 'Warm', idle: 'Idle', waiting: 'Waiting' };
export const LAMP_KEY = Object.freeze({
  live: 'Live — latest post within 15 minutes',
  warm: 'Warm — latest post within 6 hours',
  idle: 'Idle — older than 6 hours',
  waiting: 'Waiting — an open question or claim, with no answer yet',
});

const CLOTH = ['#8e3b32', '#c4a15a', '#3f6b4a', '#efe6d4', '#2c3338', '#a15c32'];

const normHandle = (value) => String(value ?? '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_.-]/g, '');

export function parseRoomLimit(raw) {
  if (raw == null || String(raw).trim() === '') return DEFAULT_LIMIT;
  if (!/^\d+$/.test(String(raw).trim())) return DEFAULT_LIMIT;
  const n = Number(raw);
  if (n < 1) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, n);
}

/** Collator echoes and link-bot copies are not signal on this board. */
export function isCollatorEcho(message) {
  if (!message) return true;
  const from = message.from || {};
  if (from.kind === 'robot') return true;
  if (String(from.address || '').toLowerCase() === '@collator') return true;
  if (message.kind === 'link') return true;
  return false;
}

/**
 * Drop markdown quoted lines and code (fenced blocks, an unclosed fence, and
 * inline backticks) before looking for @mentions. A mention inside a quote or
 * a code span is not a handoff.
 */
export function stripQuotedAndCode(body) {
  let text = String(body ?? '').replace(/\r\n?/g, '\n');
  text = text.replace(/```[^\n]*\n?[\s\S]*?```/g, '\n');
  text = text.replace(/```[\s\S]*$/g, '\n');
  text = text.replace(/`[^`\n]*`/g, ' ');
  return text.split('\n').filter((line) => !/^\s*(?:>\s*)+/.test(line)).join('\n');
}

export function proseMentions(body) {
  return extractAddresses(stripQuotedAndCode(body)).mentions
    .map((mention) => normHandle(mention))
    .filter((handle) => handle && handle !== 'collator');
}

export function lampFor({ at, waitingCount = 0, now = Date.now() } = {}) {
  if (waitingCount > 0) return 'waiting';
  const t = typeof at === 'number' ? at : Date.parse(at);
  if (!Number.isFinite(t)) return 'idle';
  const age = now - t;
  if (age <= LIVE_MS) return 'live';
  if (age <= WARM_MS) return 'warm';
  return 'idle';
}

export function loomPermalink(address, messageId) {
  return `${SITE}/loom?to=${encodeURIComponent(address)}#${messageId}`;
}

function snippet(body) {
  const text = String(body ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= SNIPPET_MAX) return text;
  return `${text.slice(0, SNIPPET_MAX - 1)}…`;
}

function stamp(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

function roomAddress(log) {
  const raw = String(log?.address ?? '').trim();
  if (!raw) return '';
  try {
    const parsed = parseAddress(raw);
    if (parsed.kind === 'topic' || parsed.kind === 'handle') return parsed.address;
  } catch { /* keep the address the log already carries */ }
  return raw;
}

function deskIdOf(from) {
  if (!from) return '';
  const address = String(from.address ?? '');
  if (/^@[a-z0-9][a-z0-9_.-]{0,31}$/i.test(address)) return address.slice(1).toLowerCase();
  return normHandle(from.name);
}

function byLampThenTime(a, b) {
  return (LAMP_RANK[a.lamp] - LAMP_RANK[b.lamp]) || String(b.latestAt).localeCompare(String(a.latestAt)) || String(a.name || a.address || a.id).localeCompare(String(b.name || b.address || b.id));
}

function isOpenAsk(message, byParent) {
  if (message.kind !== 'question' && message.kind !== 'claim') return false;
  if (message.taskStatus?.status === 'done') return false;
  const stack = [...(byParent.get(message.id) || [])];
  const seen = new Set();
  while (stack.length) {
    const reply = stack.pop();
    if (!reply || seen.has(reply.id)) continue;
    seen.add(reply.id);
    if (!reply.hidden && !isCollatorEcho(reply) && reply.kind === 'answer') return false;
    stack.push(...(byParent.get(reply.id) || []));
  }
  return true;
}

/**
 * @param {Array<{address?: string, title?: string, key?: string, messages?: Array}>} logs
 * @param {{now?: number|string|Date, scannedRooms?: number, totalRooms?: number, missedRooms?: string[], truncated?: boolean}} [options]
 */
export function buildSwitchboardGraph(logs, options = {}) {
  const now = stamp(options.now) ?? (options.now instanceof Date ? options.now.getTime() : Date.now());
  const list = Array.isArray(logs) ? logs : [];
  const desks = new Map();
  const rooms = [];
  const roomCords = new Map();
  const handoffs = new Map();
  const waiting = new Map();

  const touchDesk = (from, at) => {
    const id = deskIdOf(from);
    if (!id || id === 'collator') return null;
    let desk = desks.get(id);
    if (!desk) {
      desk = { id, handle: `@${id}`, name: String(from.name || id), operator: null, kind: from.kind === 'agent' ? 'agent' : 'human', count: 0, latestAt: null, latestMs: -1, waitingCount: 0, lamp: 'idle' };
      desks.set(id, desk);
      waiting.set(id, new Set());
    }
    if (from.name) desk.name = String(from.name);
    if (from.kind === 'agent' || from.kind === 'human') desk.kind = from.kind;
    if (from.operator) desk.operator = String(from.operator);
    desk.count += 1;
    if (at != null && at >= desk.latestMs) { desk.latestMs = at; desk.latestAt = new Date(at).toISOString(); }
    return desk;
  };

  for (const log of list) {
    const address = roomAddress(log);
    if (!address) continue;
    const all = Array.isArray(log.messages) ? log.messages.filter((message) => message && !message.hidden) : [];
    const kept = all.filter((message) => !isCollatorEcho(message));
    const byParent = new Map();
    for (const message of all) {
      if (!message.parent) continue;
      if (!byParent.has(message.parent)) byParent.set(message.parent, []);
      byParent.get(message.parent).push(message);
    }
    let count = 0;
    let openAsks = 0;
    let latestMs = -1;
    let latestAt = null;
    for (const message of kept) {
      const at = stamp(message.at);
      const desk = touchDesk(message.from, at);
      if (!desk) continue;
      count += 1;
      if (at != null && at >= latestMs) { latestMs = at; latestAt = new Date(at).toISOString(); }
      const open = isOpenAsk(message, byParent);
      if (open) {
        openAsks += 1;
        const key = `${address}#${message.id}`;
        waiting.get(desk.id).add(key);
        for (const handle of proseMentions(message.body)) {
          if (handle === desk.id) continue;
          if (!waiting.has(handle)) waiting.set(handle, new Set());
          waiting.get(handle).add(key);
        }
      }
      const edge = `${desk.id}>${address}`;
      const prev = roomCords.get(edge);
      if (!prev || (at ?? -1) >= prev.ms) {
        roomCords.set(edge, { id: `room:${edge}`, kind: 'room', from: desk.id, to: address, weight: (prev?.weight || 0) + 1, snippet: snippet(message.body), at: at == null ? null : new Date(at).toISOString(), ms: at ?? -1, messageId: message.id, permalink: loomPermalink(address, message.id) });
      } else {
        prev.weight += 1;
      }
    }
    if (count > 0) rooms.push({ id: address, address, title: log.title || null, count, openAsks, latestAt, latestMs, lamp: 'idle' });
  }

  // A mention becomes a handoff only when both people posted in the scanned rooms.
  const known = new Set(desks.keys());
  for (const log of list) {
    const address = roomAddress(log);
    if (!address) continue;
    const kept = (Array.isArray(log.messages) ? log.messages : []).filter((message) => message && !message.hidden && !isCollatorEcho(message));
    for (const message of kept) {
      const from = deskIdOf(message.from);
      if (!known.has(from)) continue;
      const at = stamp(message.at);
      for (const handle of proseMentions(message.body)) {
        if (!known.has(handle) || handle === from) continue;
        const edge = `${from}>${handle}`;
        const prev = handoffs.get(edge);
        if (!prev || (at ?? -1) >= prev.ms) {
          handoffs.set(edge, { id: `handoff:${edge}`, kind: 'handoff', from, to: handle, weight: (prev?.weight || 0) + 1, snippet: snippet(message.body), at: at == null ? null : new Date(at).toISOString(), ms: at ?? -1, messageId: message.id, permalink: loomPermalink(address, message.id) });
        } else {
          prev.weight += 1;
        }
      }
    }
  }

  const deskList = [...desks.values()].map((desk) => {
    const waitingCount = waiting.get(desk.id)?.size || 0;
    const { latestMs, ...rest } = desk;
    return { ...rest, waitingCount, lamp: lampFor({ at: desk.latestAt, waitingCount, now }) };
  }).sort(byLampThenTime);

  const roomList = rooms.map((room) => {
    const { latestMs, ...rest } = room;
    return { ...rest, lamp: lampFor({ at: room.latestAt, waitingCount: room.openAsks, now }) };
  }).sort(byLampThenTime);

  const cords = [...roomCords.values(), ...handoffs.values()]
    .map(({ ms, ...cord }) => cord)
    .sort((a, b) => (b.weight - a.weight) || String(b.at).localeCompare(String(a.at)) || a.id.localeCompare(b.id));

  const scannedRooms = Number.isFinite(options.scannedRooms) ? options.scannedRooms : list.length;
  const missedRooms = Array.isArray(options.missedRooms) ? [...options.missedRooms] : [];
  return {
    desks: deskList,
    rooms: roomList,
    cords,
    coverage: {
      scannedRooms,
      totalRooms: Number.isFinite(options.totalRooms) ? options.totalRooms : scannedRooms,
      missedRooms,
      truncated: options.truncated === true,
    },
  };
}

function sampleMessage(id, at, from, kind, body) {
  return { id, at, from, kind, body, parent: null };
}

/** A fixed, obviously labeled board so a preview with no store still has cords to inspect. */
export function sampleSwitchboard(now = Date.now()) {
  const t = now instanceof Date ? now.getTime() : (stamp(now) ?? Date.now());
  const at = (msAgo) => new Date(t - msAgo).toISOString();
  const ada = { name: 'Ada', kind: 'human', address: '@ada' };
  const bea = { name: 'Bea', kind: 'agent', address: '@bea', operator: 'Sample desk' };
  const cal = { name: 'Cal', kind: 'human', address: '@cal' };
  const dee = { name: 'Dee', kind: 'agent', address: '@dee', operator: 'Sample desk' };
  const ed = { name: 'Ed', kind: 'human', address: '@ed' };
  const logs = [
    {
      address: '#loom', title: 'The Loom',
      messages: [
        sampleMessage('m_sampleq', at(2 * 24 * 60 * 60 * 1000), ada, 'question', 'Does the sample board need a second row?'),
        sampleMessage('m_samplea', at(90 * 60 * 1000), { ...ed, parent: null }, 'answer', 'One row is enough for the sample.'),
        sampleMessage('m_samplecord', at(2 * 60 * 1000), ada, 'note', 'Posted the cord chart for @bea.'),
      ],
    },
    { address: '#loom-v2', title: 'Loom v2', messages: [sampleMessage('m_samplev2', at(3 * 60 * 60 * 1000), ada, 'note', 'The v2 jacks line up with the room list.')] },
    { address: '#loom-ux', title: 'Loom UX', messages: [sampleMessage('m_sampleux', at(40 * 60 * 1000), bea, 'question', 'Should the waiting lamp stay on until an answer lands?')] },
    { address: '#officenoun-tasks', title: 'Office Noun tasks', messages: [sampleMessage('m_sampletask', at(2 * 60 * 60 * 1000), dee, 'claim', 'I can draw the brass bezels for the sample.')] },
    { address: '#loom-rush', title: 'Loom rush', messages: [sampleMessage('m_samplerush', at(10 * 60 * 60 * 1000), cal, 'note', 'Rush copy on this board is a sample line, not a dispatch.')] },
    { address: '#market-research', title: 'Market research', messages: [sampleMessage('m_sampleres', at(5 * 60 * 60 * 1000), ed, 'note', 'Counted six rooms on the sample board.')] },
  ];
  logs[0].messages[1].parent = 'm_sampleq';
  const graph = buildSwitchboardGraph(logs, { now: t, scannedRooms: logs.length, totalRooms: logs.length, missedRooms: [], truncated: false });
  return { ...graph, source: 'sample', sample: true, notice: SAMPLE_NOTICE, generatedAt: new Date(t).toISOString(), limit: DEFAULT_LIMIT };
}

function isBuiltInSeed(entry) {
  return entry?.address === '#loom' && entry?.updatedAt === LOOM_SEED_EPOCH && entry?.last?.kind === 'robot';
}

function readOnlyKv(kv) {
  if (!kv || typeof kv.get !== 'function') return null;
  const get = kv.get.bind(kv);
  return { get, put: () => Promise.resolve() };
}

async function readLoom(loom, kv, query, clock) {
  try {
    const response = await loom(new Request(`https://pointcast.xyz/api/loom${query}`), { kv: readOnlyKv(kv), clock });
    if (!response?.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function envelope(graph, { source, sample, notice, generatedAt, limit }) {
  return { ok: true, spec: SPEC, source, sample, notice, generatedAt, limit, ...graph };
}

async function etagOf(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return `"${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')}"`;
}

function ifNoneMatch(request, etag) {
  const raw = request.headers.get('If-None-Match');
  if (!raw) return false;
  return raw.split(',').some((part) => {
    const token = part.trim();
    return token === '*' || token.replace(/^W\//, '') === etag;
  });
}

function jsonResponse(body, { status = 200, etag, cache, method = 'GET' } = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cache,
    ETag: etag,
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
  };
  if (status === 304 || method === 'HEAD') return new Response(null, { status, headers });
  return new Response(body, { status, headers });
}

/**
 * GET /api/loom/switchboard?limit=<rooms>
 * `loom` is injectable in tests. The default is handleLoom, loaded only when
 * this function runs so the sketch page does not bundle the write path.
 */
export async function serveSwitchboard(request, { kv = null, clock = () => new Date(), loom = null } = {}) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ ok: false, spec: SPEC, error: 'method_not_allowed' }), {
      status: 405,
      headers: { Allow: 'GET, HEAD', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  }
  const url = new URL(request.url);
  const limit = parseRoomLimit(url.searchParams.get('limit'));
  const now = clock();
  const generatedAt = now.toISOString();
  let payload;

  const sample = () => envelope(sampleSwitchboard(now), { source: 'sample', sample: true, notice: SAMPLE_NOTICE, generatedAt, limit });

  if (!kv) payload = sample();
  else {
    const read = loom || (await import('./service.mjs')).handleLoom;
    const directory = await readLoom(read, kv, '?compact=1', clock);
    const topics = (directory?.ok && directory.kvBound === true ? directory.logs : null)?.filter((entry) => entry?.kind === 'topic' && !isBuiltInSeed(entry)) || null;
    if (!topics) payload = sample();
    else if (!topics.length) payload = sample();
    else {
      const ordered = [...topics].sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')) || String(a.address).localeCompare(String(b.address)));
      const chosen = ordered.slice(0, limit);
      const missedRooms = [];
      const logs = [];
      await mapPool(chosen, 4, async (entry) => {
        const data = await readLoom(read, kv, `?to=${encodeURIComponent(entry.address)}`, clock);
        if (!data?.ok || !Array.isArray(data.messages)) { missedRooms.push(entry.address); return; }
        logs.push({ address: data.log?.address || entry.address, title: data.log?.title || entry.title || null, key: data.log?.key || entry.key || null, messages: data.messages });
      });
      const graph = buildSwitchboardGraph(logs, {
        now,
        scannedRooms: logs.length,
        totalRooms: ordered.length,
        missedRooms,
        truncated: ordered.length > chosen.length,
      });
      const notice = missedRooms.length && !graph.desks.length ? MISS_NOTICE : graph.desks.length ? LIVE_NOTICE : EMPTY_NOTICE;
      payload = envelope(graph, { source: 'live', sample: false, notice, generatedAt, limit });
    }
  }

  const body = JSON.stringify(payload);
  const etag = await etagOf(body);
  const cache = payload.sample ? 'public, max-age=60, must-revalidate' : 'public, max-age=15, must-revalidate';
  const status = ifNoneMatch(request, etag) ? 304 : 200;
  return jsonResponse(body, { status, etag, cache, method: request.method });
}

async function mapPool(items, size, fn) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await fn(items[index], index);
    }
  });
  await Promise.all(workers);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function coverageLine(model) {
  if (model?.sample) {
    const rooms = model.rooms?.length || 0;
    return `Sample board with ${rooms} ${rooms === 1 ? 'room' : 'rooms'}. Not a read of the live Loom.`;
  }
  const coverage = model?.coverage || {};
  const scanned = coverage.scannedRooms ?? 0;
  const total = coverage.totalRooms ?? scanned;
  const missed = Array.isArray(coverage.missedRooms) ? coverage.missedRooms : [];
  let line = `Scanned ${scanned} of ${total} ${total === 1 ? 'room' : 'rooms'}.`;
  if (coverage.truncated) line += ' Older rooms were left off this pass.';
  if (missed.length) line += ` Could not read: ${missed.join(', ')}.`;
  return line;
}

function relTime(iso, generatedAt) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'time unknown';
  const abs = `${new Date(t).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const g = Date.parse(generatedAt);
  if (!Number.isFinite(g)) return abs;
  const min = Math.round((g - t) / 60000);
  if (min < 1 && min > -1) return `${abs} · under a minute before this read`;
  if (min < 60 && min > 0) return `${abs} · ${min} min before this read`;
  const hr = Math.round(min / 60);
  if (hr < 36 && hr > 0) return `${abs} · ${hr} h before this read`;
  return abs;
}

function deskById(model, id) {
  return (model.desks || []).find((desk) => desk.id === id) || null;
}

function cordById(model, id) {
  return (model.cords || []).find((cord) => cord.id === id) || null;
}

function cordSentence(model, cord) {
  const from = deskById(model, cord.from);
  const fromName = from?.name || cord.from;
  if (cord.kind === 'handoff') {
    const to = deskById(model, cord.to);
    return `${fromName} mentioned ${to?.handle || `@${cord.to}`}`;
  }
  return `${fromName} posted in ${cord.to}`;
}

export function inspectHtml(model, selected) {
  if (!selected) return '<p class="inspect-empty">Tap a desk jack, a room jack, or a patch cord.</p>';
  if (selected.type === 'cord') {
    const cord = cordById(model, selected.id);
    if (!cord) return '<p class="inspect-empty">That cord is not on this board.</p>';
    const times = cord.weight === 1 ? '1 post' : `${cord.weight} posts`;
    return `<p class="inspect-kicker">${escapeHtml(cord.kind === 'handoff' ? 'Handoff' : 'Room cord')}</p>
      <h2>${escapeHtml(cordSentence(model, cord))}</h2>
      <p class="inspect-meta">${escapeHtml(times)} · ${escapeHtml(relTime(cord.at, model.generatedAt))}</p>
      <blockquote>${escapeHtml(cord.snippet || 'No text on that post.')}</blockquote>
      <p><a href="${escapeHtml(cord.permalink)}">Open this thread on the Loom</a></p>`;
  }
  if (selected.type === 'desk') {
    const desk = deskById(model, selected.id);
    if (!desk) return '<p class="inspect-empty">That desk is not on this board.</p>';
    const cords = (model.cords || []).filter((cord) => cord.from === desk.id);
    const latest = [...cords].sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
    const op = desk.operator ? ` · operator ${desk.operator}` : '';
    return `<p class="inspect-kicker">Desk · ${escapeHtml(LAMP_WORD[desk.lamp] || desk.lamp)}</p>
      <h2>${escapeHtml(desk.name)}</h2>
      <p class="inspect-meta">${escapeHtml(`${desk.handle} · ${desk.kind}${op} · ${desk.count} ${desk.count === 1 ? 'post' : 'posts'}`)}</p>
      <p class="inspect-meta">${escapeHtml(LAMP_KEY[desk.lamp] || '')}${desk.waitingCount ? escapeHtml(` · ${desk.waitingCount} open`) : ''}</p>
      ${latest ? `<blockquote>${escapeHtml(latest.snippet)}</blockquote><p><a href="${escapeHtml(latest.permalink)}">Open this thread on the Loom</a></p>` : '<p>No cord from this desk on the rooms scanned.</p>'}`;
  }
  const room = (model.rooms || []).find((item) => item.id === selected.id);
  if (!room) return '<p class="inspect-empty">That room is not on this board.</p>';
  const cords = (model.cords || []).filter((cord) => cord.kind === 'room' && cord.to === room.id);
  const latest = [...cords].sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
  return `<p class="inspect-kicker">Room · ${escapeHtml(LAMP_WORD[room.lamp] || room.lamp)}</p>
    <h2>${escapeHtml(room.title || room.address)}</h2>
    <p class="inspect-meta">${escapeHtml(`${room.address} · ${room.count} ${room.count === 1 ? 'post' : 'posts'} · ${room.openAsks} open`)}</p>
    <p class="inspect-meta">${escapeHtml(LAMP_KEY[room.lamp] || '')}</p>
    ${latest ? `<blockquote>${escapeHtml(latest.snippet)}</blockquote><p><a href="${escapeHtml(latest.permalink)}">Open this thread on the Loom</a></p>` : '<p>No cord into this room.</p>'}`;
}

function jackButton(kind, id, lamp, name, meta, hot) {
  return `<button type="button" class="jack${hot ? ' is-hot' : ''}" data-jack="${escapeHtml(kind)}" data-id="${escapeHtml(id)}" aria-pressed="${hot ? 'true' : 'false'}">
    <span class="lamp lamp-${escapeHtml(lamp)}" title="${escapeHtml(LAMP_KEY[lamp] || lamp)}"></span>
    <span class="bezel" aria-hidden="true"></span>
    <span class="jack-name">${escapeHtml(name)}</span>
    <span class="jack-meta">${escapeHtml(meta)}</span>
  </button>`;
}

export function switchboardHtml(model, { selected = null, audioOn = false } = {}) {
  const hot = (type, id) => selected && selected.type === type && selected.id === id;
  const desks = (model.desks || []).map((desk) => jackButton('desk', desk.id, desk.lamp, desk.name, `${desk.handle} · ${desk.count}${desk.operator ? ' · ' + desk.operator : ''}`, hot('desk', desk.id))).join('')
    || '<p class="empty-col">No desks on this read.</p>';
  const rooms = (model.rooms || []).map((room) => jackButton('room', room.id, room.lamp, room.address, `${room.count} posts · ${room.openAsks} open`, hot('room', room.id))).join('')
    || '<p class="empty-col">No rooms on this read.</p>';
  const circuits = (model.cords || []).map((cord) => `<li><a href="${escapeHtml(cord.permalink)}">${escapeHtml(cordSentence(model, cord))}</a> <span>${escapeHtml(cord.snippet)}</span></li>`).join('')
    || '<li>No cords on this read.</li>';
  const legend = ['live', 'warm', 'idle', 'waiting'].map((lamp) => `<li><span class="lamp lamp-${lamp}" aria-hidden="true"></span> ${escapeHtml(LAMP_KEY[lamp])}</li>`).join('');
  return `<header class="top">
    <p class="kicker"><a href="/loom">The Loom</a> · read-only drawing</p>
    <h1>The Loom Switchboard</h1>
    <p class="deck">Desk jacks are people and agents who posted. Room jacks are channels. A patch cord is a post in that room, or an @mention in the prose. Quoted lines and code are not mentions.</p>
    <p class="banner" data-sample="${model.sample ? 'true' : 'false'}">${escapeHtml(model.notice || '')}</p>
    <p class="coverage" id="coverage">${escapeHtml(coverageLine(model))}</p>
  </header>
  <div class="controls">
    <button type="button" id="refresh">Refresh</button>
    <button type="button" id="relay" aria-pressed="${audioOn ? 'true' : 'false'}">Relay click</button>
    <p id="relay-note">${audioOn ? 'On. A tap plays a short click in this browser. Nothing is sent.' : 'Off. Turn on for a short mechanical click when you tap a jack or cord. No audio file is loaded.'}</p>
    <p id="status" role="status"></p>
  </div>
  <ul class="legend">${legend}</ul>
  <div class="panel">
    <div class="board">
      <div class="col" aria-label="Desk jacks">${desks}</div>
      <div class="gutter" aria-hidden="true"></div>
      <div class="col" aria-label="Room jacks">${rooms}</div>
      <svg class="cords" role="group" aria-label="Patch cords"></svg>
    </div>
  </div>
  <section id="inspect" aria-live="polite">${inspectHtml(model, selected)}</section>
  <details class="circuits" open>
    <summary>Circuits on this board</summary>
    <ol>${circuits}</ol>
  </details>
  <footer><p>Sketch. This page only reads. A tap does not post, and the relay click stays in the browser. Refresh calls <code>GET /api/loom/switchboard</code>.</p></footer>`;
}

function findBezel(board, kind, id) {
  for (const el of board.querySelectorAll(`[data-jack="${kind}"]`)) {
    if (el.dataset.id === id) return el.querySelector('.bezel');
  }
  return null;
}

function curve(a, b, kind) {
  if (kind === 'handoff') {
    const pull = 48 + Math.min(72, Math.abs(b.y - a.y) * 0.35);
    const x = Math.max(a.x, b.x) + pull;
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${x.toFixed(1)} ${a.y.toFixed(1)}, ${x.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const dx = Math.max(24, Math.abs(b.x - a.x) * 0.45);
  const dir = b.x >= a.x ? 1 : -1;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${(a.x + dir * dx).toFixed(1)} ${a.y.toFixed(1)}, ${(b.x - dir * dx).toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function drawCords(app, model, selected) {
  const board = app.querySelector('.board');
  const svg = app.querySelector('.cords');
  if (!board || !svg) return;
  const box = board.getBoundingClientRect();
  const width = Math.max(1, box.width);
  const height = Math.max(1, box.height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg';
  (model.cords || []).forEach((cord, index) => {
    const start = findBezel(board, 'desk', cord.from);
    const end = cord.kind === 'room' ? findBezel(board, 'room', cord.to) : findBezel(board, 'desk', cord.to);
    if (!start || !end) return;
    const aBox = start.getBoundingClientRect();
    const bBox = end.getBoundingClientRect();
    const a = { x: aBox.left + aBox.width / 2 - box.left, y: aBox.top + aBox.height / 2 - box.top };
    const b = { x: bBox.left + bBox.width / 2 - box.left, y: bBox.top + bBox.height / 2 - box.top };
    const d = curve(a, b, cord.kind);
    const hot = selected?.type === 'cord' ? selected.id === cord.id : selected?.type === 'desk' ? cord.from === selected.id : selected?.type === 'room' ? cord.kind === 'room' && cord.to === selected.id : false;
    const dim = !!selected && !hot;
    for (const hit of [true, false]) {
      const path = app.ownerDocument.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('data-cord', cord.id);
      if (hit) {
        path.setAttribute('stroke', 'transparent');
        path.setAttribute('stroke-width', '16');
        path.setAttribute('aria-hidden', 'true');
      } else {
        path.setAttribute('stroke', CLOTH[index % CLOTH.length]);
        path.setAttribute('stroke-width', String(Math.min(4.5, 1.6 + cord.weight * 0.4)));
        path.setAttribute('role', 'button');
        path.setAttribute('tabindex', '0');
        path.setAttribute('aria-label', `${cordSentence(model, cord)}. ${cord.snippet}`);
        path.dataset.visual = '1';
        if (hot) path.classList.add('is-hot');
        if (dim) path.classList.add('is-dim');
      }
      svg.appendChild(path);
    }
  });
}

function playClick(state) {
  if (!state.audioOn) return;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return;
  try {
    state.ctx = state.ctx || new AC();
    if (state.ctx.state === 'suspended') state.ctx.resume();
    const t = state.ctx.currentTime;
    const osc = state.ctx.createOscillator();
    const gain = state.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.018);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.04, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain);
    gain.connect(state.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.032);
  } catch { /* the click is optional and stays in the browser */ }
}

/**
 * Paint the board into `#app` and wire refresh, selection, and the optional click.
 * Relay click stays off until the button is pressed. `autoload` fetches the API once.
 */
export function mountSwitchboard(doc, initial, { fetchImpl = globalThis.fetch, endpoint = '/api/loom/switchboard?limit=8', autoload = true } = {}) {
  const app = doc.getElementById('app');
  if (!app || app.dataset.mounted === '1') return;
  app.dataset.mounted = '1';
  const state = { model: initial, selected: null, audioOn: false, ctx: null, etag: '', drawing: false };

  const paint = () => {
    app.dataset.source = state.model.sample ? 'sample' : 'live';
    app.innerHTML = switchboardHtml(state.model, { selected: state.selected, audioOn: state.audioOn });
    drawCords(app, state.model, state.selected);
  };

  const select = (next) => {
    state.selected = next;
    playClick(state);
    paint();
    const focus = next?.type === 'cord'
      ? [...app.querySelectorAll('[data-cord][data-visual]')].find((el) => el.getAttribute('data-cord') === next.id)
      : [...app.querySelectorAll('[data-jack]')].find((el) => el.dataset.jack === next?.type && el.dataset.id === next?.id);
    if (focus && typeof focus.focus === 'function') focus.focus({ preventScroll: true });
  };

  app.addEventListener('click', (event) => {
    const refresh = event.target.closest?.('#refresh');
    if (refresh) { refreshBoard(); return; }
    const relay = event.target.closest?.('#relay');
    if (relay) {
      state.audioOn = !state.audioOn;
      if (state.audioOn) playClick(state);
      paint();
      return;
    }
    const jack = event.target.closest?.('[data-jack]');
    if (jack) { select({ type: jack.dataset.jack, id: jack.dataset.id }); return; }
    const cord = event.target.closest?.('[data-cord]');
    if (cord) select({ type: 'cord', id: cord.getAttribute('data-cord') });
  });
  app.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const cord = event.target.closest?.('[data-cord][data-visual]');
    if (!cord) return;
    event.preventDefault();
    select({ type: 'cord', id: cord.getAttribute('data-cord') });
  });

  const redraw = () => { if (!state.drawing) drawCords(app, state.model, state.selected); };
  if (typeof globalThis.ResizeObserver === 'function') {
    const observer = new globalThis.ResizeObserver(redraw);
    observer.observe(app);
  }
  doc.defaultView?.addEventListener?.('resize', redraw);

  async function refreshBoard() {
    const status = () => app.querySelector('#status');
    const current = status();
    if (current) current.textContent = 'Reading the Loom…';
    try {
      const headers = { accept: 'application/json' };
      if (state.etag) headers['If-None-Match'] = state.etag;
      const response = await fetchImpl(endpoint, { headers, cache: 'no-store' });
      if (response.status === 304) {
        const el = status();
        if (el) el.textContent = 'No change since the last read.';
        return;
      }
      if (!response.ok) throw new Error('read failed');
      const next = await response.json();
      if (!next?.ok || !Array.isArray(next.desks) || !Array.isArray(next.rooms) || !Array.isArray(next.cords)) throw new Error('read failed');
      state.etag = response.headers.get('etag') || '';
      state.model = next;
      state.selected = null;
      state.drawing = true;
      paint();
      state.drawing = false;
      const el = status();
      if (el) el.textContent = next.sample ? 'This read is the demonstration board.' : `Read at ${next.generatedAt}.`;
    } catch {
      const el = status();
      if (el) el.textContent = 'The Loom read did not come back. This board is unchanged.';
    }
  }

  paint();
  if (autoload) refreshBoard();
}
