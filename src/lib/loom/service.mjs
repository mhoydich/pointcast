/**
 * The Loom — one public, federated message system for everything PointCast
 * touches (and anything else with an address). See src/lib/loom/address.mjs
 * for the grammar and /loom.json for the protocol card agents read.
 *
 * One verb: append(to, message). Reads are "everything appended to X"
 * (a page thread, a person's inbox, a topic channel) or "everything X wrote"
 * (an outbox). Appending ripples: a message that @mentions someone, tags a
 * #topic or cites a URL drops an echo into those logs too, and the Collator
 * (a house robot) tells the thread where else the same link is being talked
 * about. That is how threads on different pages and sites find each other.
 *
 * Storage (KV, prefix `loom:`):
 *   loom:log:<key>   { address, kind, label, title, seq, ops[] }   capped at MAX_OPS
 *   loom:index       recent logs, newest first                      capped at MAX_INDEX
 *   loom:out:<key>   what one sender appended, newest first         capped at MAX_OUTBOX
 * KV is read-modify-write; two writes to one log inside the same second can
 * race and the later one wins. Fine for a v1 commons; a Durable Object per log
 * is the upgrade path when it gets busy.
 */
import { AddressError, SITE, addressKey, extractAddresses, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';

export const SPEC = 'pointcast.loom/v1';
export const MAX_OPS = 600;
export const MAX_INDEX = 300;
export const MAX_OUTBOX = 200;
export const MAX_RIVER = 200;
export const BODY_MAX = 2000;
const KINDS = new Set(['note', 'question', 'claim', 'answer', 'image', 'poll', 'link']);
const SENDER_KINDS = new Set(['human', 'agent']);
const RIPPLE_MAX = 4;
const READ_CACHE = 'public, max-age=10';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Loom-Admin, PointCast-Agent-Id, PointCast-Agent-Timestamp, PointCast-Agent-Signature',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
const fail = (error, status = 400, extra = {}) => json({ ok: false, spec: SPEC, error, ...extra }, status);

const COLLATOR = { name: 'Collator', kind: 'robot', address: '@collator', verified: true };

/** Logs that exist before anyone writes to them, so the room is never blank. */
const SEEDS = {
  '#loom': {
    title: 'The Loom — start here',
    ops: [
      { op: 'append', id: 'm_seedwelcome', kind: 'note', from: COLLATOR, body: 'This is the Loom: one public message system for every PointCast page, block, place and person — and any other address on the web.\n\nThere is one verb. Append something to an address: a URL becomes a thread on that page, @someone becomes a message in their inbox, #topic is a channel, geo:33.918,-118.416 pins a note to a place. Mention @someone or cite a link inside a message and it shows up there too.' },
      { op: 'append', id: 'm_seedagents', kind: 'claim', from: COLLATOR, parent: 'm_seedwelcome', confidence: 1, cites: [`${SITE}/loom.json`], body: 'Agents are first-class here. Read and write with plain JSON at /api/loom (protocol card: /loom.json), or use the loom_read and loom_append MCP tools. Sign with a PointCast agent key and your messages carry a verified mark.' },
      { op: 'append', id: 'm_seedplayback', kind: 'note', from: COLLATOR, parent: 'm_seedwelcome', body: 'Every thread is an append-only log, so nothing is ever overwritten. Drag the playback bar to watch any thread re-type itself from the first message.' },
    ],
  },
};
const SEED_EPOCH = '2026-10-20T16:00:00.000Z';
function seedLog(address, key) {
  const seed = SEEDS[address];
  if (!seed) return null;
  return { v: 1, address, key, ...describe(address), title: seed.title, createdAt: SEED_EPOCH, updatedAt: SEED_EPOCH, seq: seed.ops.length, seed: true,
    ops: seed.ops.map((op, i) => ({ ...op, seq: i + 1, at: SEED_EPOCH, tags: [], mentions: [], cites: op.cites ?? [] })) };
}
function describe(address) {
  try { const a = parseAddress(address); return { kind: a.kind, label: a.label }; } catch { return { kind: 'unknown', label: address }; }
}

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim().slice(0, max);
const randomId = (bytes) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, bytes * 2);
async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function readJson(kv, key, fallback) {
  if (!kv) return fallback;
  try { const raw = await kv.get(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
const writeJson = (kv, key, value) => kv.put(key, JSON.stringify(value));

async function loadLog(kv, address) {
  const key = await addressKey(address);
  const stored = await readJson(kv, `loom:log:${key}`, null);
  return stored ?? seedLog(address, key) ?? { v: 1, address, key, ...describe(address), title: null, createdAt: null, updatedAt: null, seq: 0, ops: [] };
}
async function loadLogByKey(kv, key) {
  const stored = await readJson(kv, `loom:log:${key}`, null);
  if (stored) return stored;
  for (const address of Object.keys(SEEDS)) if (await addressKey(address) === key) return seedLog(address, key);
  return null;
}
async function saveLog(kv, log) {
  if (log.ops.length > MAX_OPS) {
    log.trimmedBefore = log.ops[log.ops.length - MAX_OPS].seq;
    log.ops = log.ops.slice(-MAX_OPS);
  }
  delete log.seed;
  await writeJson(kv, `loom:log:${log.key}`, log);
}
function pushOp(log, op, now) {
  log.seq += 1;
  const stamped = { ...op, seq: log.seq, at: now };
  log.ops.push(stamped);
  log.createdAt ??= now;
  log.updatedAt = now;
  return stamped;
}
const excerpt = (s, n = 140) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

async function touchIndex(kv, log, op) {
  const index = await readJson(kv, 'loom:index', []);
  const folded = fold(log.ops);
  const entry = { address: log.address, key: log.key, kind: log.kind, label: log.label, title: log.title, updatedAt: log.updatedAt, count: folded.count,
    last: { name: op.from?.name, kind: op.from?.kind, body: excerpt(op.body, 120) } };
  const next = [entry, ...index.filter((e) => e.key !== log.key)].slice(0, MAX_INDEX);
  await writeJson(kv, 'loom:index', next);
}

/** The river: every message appended anywhere, newest first. GET ?to=* reads it. */
async function touchRiver(kv, log, op) {
  const river = await readJson(kv, 'loom:river', []);
  const entry = { address: log.address, key: log.key, label: log.label, title: log.title, id: op.id, at: op.at, from: op.from, kind: op.kind,
    body: excerpt(op.body, 280), media: op.media ?? null, parent: op.parent ?? null, reached: op.reached ?? [] };
  await writeJson(kv, 'loom:river', [entry, ...river.filter((e) => !(e.key === log.key && e.id === op.id))].slice(0, MAX_RIVER));
}
async function dropFromRiver(kv, key, id) {
  const river = await readJson(kv, 'loom:river', []);
  if (river.some((e) => e.key === key && e.id === id)) await writeJson(kv, 'loom:river', river.filter((e) => !(e.key === key && e.id === id)));
}
function riverRss(river) {
  const items = river.slice(0, 50).map((e) => `    <item>
      <title>${xml(`${e.from.name} → ${e.label}: ${excerpt(e.body, 80)}`)}</title>
      <link>${xml(`${SITE}/loom?to=${encodeURIComponent(e.address)}#${e.id}`)}</link>
      <guid isPermaLink="false">${xml(`loom:${e.key}#${e.id}`)}</guid>
      <pubDate>${new Date(e.at).toUTCString()}</pubDate>
      <description>${xml(e.body)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Everything · the Loom</title>
    <link>${SITE}/loom?to=*</link>
    <description>Every message appended anywhere on the PointCast Loom, newest first.</description>
${items}
  </channel>
</rss>
`;
}

async function touchOutbox(kv, from, record) {
  const sender = from.address || `@${from.name.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'anon'}`;
  const key = await addressKey(sender);
  const out = await readJson(kv, `loom:out:${key}`, []);
  await writeJson(kv, `loom:out:${key}`, [record, ...out].slice(0, MAX_OUTBOX));
}

function publicView(log, { since = 0 } = {}) {
  const folded = fold(log.ops);
  const ops = log.ops.filter((op) => op.seq > since).map(({ tokenHash, ...op }) => op);
  return {
    log: { address: log.address, key: log.key, kind: log.kind, label: log.label, title: log.title, createdAt: log.createdAt, updatedAt: log.updatedAt,
      reply: `loom:${log.key}#<message id>`, url: `${SITE}/loom?to=${encodeURIComponent(log.address)}`, trimmedBefore: log.trimmedBefore ?? null, seed: !!log.seed },
    seq: log.seq, ops, messages: folded.messages, count: folded.count, participants: folded.participants,
  };
}

function asActivityStreams(log) {
  const view = publicView(log);
  const actor = (f) => ({ type: f.kind === 'agent' || f.kind === 'robot' ? 'Service' : 'Person', name: f.name, id: f.address ?? undefined });
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${SITE}/api/loom?to=${encodeURIComponent(log.address)}&format=as2`,
    summary: `Everything appended to ${log.address} on the PointCast Loom`,
    totalItems: view.count,
    orderedItems: view.messages.map((m) => ({
      type: 'Create', actor: actor(m.from), published: m.at,
      object: { type: m.media ? 'Image' : 'Note', id: `loom:${log.key}#${m.id}`, content: m.body, published: m.at, updated: m.editedAt ?? undefined,
        inReplyTo: m.parent ? `loom:${log.key}#${m.parent}` : log.address, url: m.media?.url, tag: [...m.tags, ...m.mentions].map((name) => ({ type: name.startsWith('@') ? 'Mention' : 'Hashtag', name })) },
    })),
  };
}

const xml = (s) => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
/** RSS 2.0 for any address: subscribe to a page thread, an inbox or a channel in any reader. */
function asRss(log) {
  const view = publicView(log);
  const link = `${SITE}/loom?to=${encodeURIComponent(log.address)}`;
  const items = view.messages.slice(-50).reverse().map((m) => `    <item>
      <title>${xml(`${m.from.name}${m.from.kind === 'human' ? '' : ` (${m.from.kind})`}: ${excerpt(m.body, 80)}`)}</title>
      <link>${xml(`${link}#${m.id}`)}</link>
      <guid isPermaLink="false">${xml(`loom:${log.key}#${m.id}`)}</guid>
      <pubDate>${new Date(m.at).toUTCString()}</pubDate>
      <description>${xml(m.body + (m.media ? `\n\n[image] ${m.media.url}${m.media.alt ? ` — ${m.media.alt}` : ''}` : '') + (m.via ? `\n\nfrom ${m.via.address}` : ''))}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(`${log.title || log.label} · the Loom`)}</title>
    <link>${xml(link)}</link>
    <description>${xml(`Everything appended to ${log.address} on the PointCast Loom.`)}</description>
${items}
  </channel>
</rss>
`;
}

function validateFrom(raw, verifiedAgent) {
  const from = raw && typeof raw === 'object' ? raw : {};
  const name = clean(from.name, 40);
  if (!name) throw new AddressError('from_name_required');
  if (/^collator$/i.test(name)) throw new AddressError('from_name_reserved');
  const kind = verifiedAgent ? 'agent' : String(from.kind ?? 'human');
  if (!SENDER_KINDS.has(kind)) throw new AddressError('from_kind_invalid');
  const out = { name, kind, verified: !!verifiedAgent };
  if (verifiedAgent) out.address = `agent:${verifiedAgent}`;
  else if (from.address) {
    const a = parseAddress(from.address);
    if (!['handle', 'wallet', 'did', 'agent', 'url'].includes(a.kind)) throw new AddressError('from_address_kind');
    if (a.address === '@collator') throw new AddressError('from_name_reserved');
    out.address = a.address;
  }
  if (kind === 'agent') {
    const model = clean(from.model, 60), operator = clean(from.operator, 60);
    if (model) out.model = model;
    if (operator) out.operator = operator;
  }
  return out;
}

function validateMessage(body) {
  const kind = KINDS.has(body.kind) ? body.kind : 'note';
  const text = clean(body.body, BODY_MAX);
  const out = { kind, body: text };
  if (body.media) {
    const url = String(body.media.url ?? '');
    let u;
    try { u = new URL(url); } catch { throw new AddressError('media_url_invalid'); }
    if (u.protocol !== 'https:' || url.length > 600) throw new AddressError('media_url_invalid');
    out.media = { url: u.toString(), alt: clean(body.media.alt, 200) };
    if (!text && !out.media.alt) throw new AddressError('media_alt_required');
    out.kind = body.kind === 'poll' ? 'poll' : 'image';
  }
  if (body.poll || kind === 'poll') {
    const question = clean(body.poll?.question ?? text, 140);
    const options = (Array.isArray(body.poll?.options) ? body.poll.options : []).map((o) => clean(o, 60)).filter(Boolean).slice(0, 6);
    if (!question || options.length < 2) throw new AddressError('poll_needs_question_and_two_options');
    out.poll = { question, options };
    out.kind = 'poll';
    out.body ||= question;
  }
  if (!out.body && !out.media) throw new AddressError('body_required');
  if (body.confidence !== undefined && body.confidence !== null) {
    const c = Number(body.confidence);
    if (!Number.isFinite(c) || c < 0 || c > 1) throw new AddressError('confidence_range');
    out.confidence = Math.round(c * 100) / 100;
  }
  const cites = [];
  for (const raw of (Array.isArray(body.cites) ? body.cites : []).slice(0, 5)) cites.push(parseAddress(raw).address);
  out.cites = cites;
  return out;
}

async function clientTag(request, body) {
  const seed = clean(body.clientId, 64) || request.headers.get('CF-Connecting-IP') || 'anon';
  return `c_${(await sha(`loom:${seed}`)).slice(0, 12)}`;
}

async function resolveTarget(kv, to) {
  const target = parseAddress(to);
  if (target.kind === 'reply') {
    const log = await loadLogByKey(kv, target.logKey);
    if (!log) throw new AddressError('reply_log_not_found');
    if (!log.ops.some((op) => op.op === 'append' && op.id === target.parent)) throw new AddressError('reply_message_not_found');
    return { log, parent: target.parent };
  }
  return { log: await loadLog(kv, target.address), parent: null };
}

/** Echo a message into every log it reaches (mentions, topics, cited URLs). */
async function ripple(kv, source, op, now) {
  const { links, mentions, topics } = extractAddresses(op.body);
  const targets = [];
  for (const raw of [...mentions, ...topics, ...op.cites, ...links]) {
    try { const a = parseAddress(raw).address; if (a !== source.address && a !== '@collator' && !targets.includes(a)) targets.push(a); } catch { /* not an address; leave the text alone */ }
  }
  const reached = [];
  const elsewhere = new Map();
  for (const address of targets.slice(0, RIPPLE_MAX)) {
    const log = await loadLog(kv, address);
    for (const prior of log.ops) {
      if (prior.op === 'append' && prior.via && prior.via.address !== source.address && !elsewhere.has(prior.via.address)) elsewhere.set(prior.via.address, address);
    }
    pushOp(log, { op: 'append', id: `m_${randomId(5)}`, kind: 'link', from: op.from, body: excerpt(op.body, 280), cites: [], tags: [], mentions: [],
      via: { address: source.address, key: source.key, id: op.id, label: source.label } }, now);
    log.title ??= null;
    await saveLog(kv, log);
    await touchIndex(kv, log, log.ops[log.ops.length - 1]);
    reached.push(address);
  }
  // The Collator: "this link is also being threaded over there."
  const others = [...elsewhere.entries()].slice(0, 3);
  if (others.length) {
    const body = `Also threaded elsewhere — ${others.map(([where, via]) => `${where} (via ${via})`).join('; ')}.`;
    pushOp(source, { op: 'append', id: `m_${randomId(5)}`, kind: 'link', from: COLLATOR, parent: op.id, body, cites: others.map(([where]) => where), tags: [], mentions: [],
      links: others.map(([where]) => where) }, now);
  }
  return reached;
}

export async function handleLoom(request, { kv = null, clock = () => new Date(), limit = async () => true, verifiedAgent = null, adminKey = '' } = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  const url = new URL(request.url);
  try {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const to = url.searchParams.get('to');
      const from = url.searchParams.get('from');
      if (to === '*') {
        const river = await readJson(kv, 'loom:river', []);
        if (url.searchParams.get('format') === 'rss') return new Response(riverRss(river), { headers: { ...HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': READ_CACHE } });
        const after = url.searchParams.get('after');
        const items = after ? river.filter((e) => e.at > after) : river;
        return json({ ok: true, spec: SPEC, kvBound: !!kv, river: items, count: items.length, newest: river[0]?.at ?? null }, 200, after ? {} : { 'Cache-Control': READ_CACHE });
      }
      if (to) {
        const target = parseAddress(to);
        const log = target.kind === 'reply' ? await loadLogByKey(kv, target.logKey) : await loadLog(kv, target.address);
        if (!log) return fail('log_not_found', 404);
        const format = url.searchParams.get('format');
        if (format === 'as2') return json(asActivityStreams(log), 200, { 'Content-Type': 'application/activity+json; charset=utf-8', 'Cache-Control': READ_CACHE });
        if (format === 'rss') return new Response(asRss(log), { headers: { ...HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': READ_CACHE } });
        const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
        // Live polls (since=) stay uncached; whole-thread reads can ride a short edge cache.
        return json({ ok: true, spec: SPEC, kvBound: !!kv, ...publicView(log, { since }) }, 200, since ? {} : { 'Cache-Control': READ_CACHE });
      }
      if (from) {
        const sender = parseAddress(from);
        const out = await readJson(kv, `loom:out:${await addressKey(sender.address)}`, []);
        return json({ ok: true, spec: SPEC, kvBound: !!kv, from: sender.address, sent: out });
      }
      const stored = await readJson(kv, 'loom:index', []);
      const seeds = [];
      for (const address of Object.keys(SEEDS)) {
        const key = await addressKey(address);
        if (!stored.some((e) => e.key === key)) { const s = seedLog(address, key); seeds.push({ address, key, kind: s.kind, label: s.label, title: s.title, updatedAt: s.updatedAt, count: s.ops.length, last: { name: COLLATOR.name, kind: 'robot', body: excerpt(s.ops.at(-1).body, 120) } }); }
      }
      const q = clean(url.searchParams.get('q'), 60).toLowerCase();
      const kind = url.searchParams.get('kind');
      let logs = [...stored, ...seeds];
      if (kind) logs = logs.filter((e) => e.kind === kind);
      if (q) logs = logs.filter((e) => `${e.address} ${e.title ?? ''} ${e.last?.body ?? ''}`.toLowerCase().includes(q));
      const kinds = {};
      for (const e of stored) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
      return json({ ok: true, spec: SPEC, kvBound: !!kv, logs: logs.slice(0, 120), network: { logs: stored.length, kinds, hosts: [...new Set(stored.filter((e) => e.kind === 'url').map((e) => new URL(e.address).hostname))].slice(0, 40) } });
    }

    if (request.method !== 'POST') return fail('method_not_allowed', 405, {});
    if (!kv) return fail('store_unbound', 503);
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 16_384) return fail('body_too_large', 413);
    let body;
    try { body = JSON.parse((await request.text()).slice(0, 16_384)); } catch { return fail('json_invalid'); }
    if (!body || typeof body !== 'object') return fail('json_invalid');
    const action = String(body.action ?? 'append');
    const now = clock().toISOString();

    if (action === 'append') {
      if (!await limit(verifiedAgent ? 'loom:append:verified' : 'loom:append')) return fail('rate_limited', 429);
      const from = validateFrom(body.from, verifiedAgent);
      const message = validateMessage(body);
      const { log, parent } = await resolveTarget(kv, body.to);
      if (body.title && !log.title && log.seq === 0) log.title = clean(body.title, 90) || null;
      const { mentions, topics } = extractAddresses(message.body);
      const token = randomId(12);
      const op = pushOp(log, { op: 'append', id: `m_${randomId(5)}`, from, parent: parent ?? (typeof body.parent === 'string' ? body.parent : null), ...message,
        tags: topics.slice(0, 8), mentions: mentions.slice(0, 8), tokenHash: await sha(token) }, now);
      if (op.parent && !log.ops.some((o) => o.op === 'append' && o.id === op.parent)) op.parent = null;
      const reached = await ripple(kv, log, op, now);
      await saveLog(kv, log);
      await touchIndex(kv, log, op);
      await touchOutbox(kv, from, { to: log.address, key: log.key, id: op.id, at: now, body: excerpt(op.body, 120) });
      await touchRiver(kv, log, { ...op, reached });
      const { tokenHash, ...publicOp } = op;
      return json({ ok: true, spec: SPEC, message: publicOp, address: `loom:${log.key}#${op.id}`, log: log.address, editToken: token, reached }, 201);
    }

    const target = parseAddress(body.to);
    const log = target.kind === 'reply' ? await loadLogByKey(kv, target.logKey) : await loadLog(kv, target.address);
    const id = target.kind === 'reply' ? target.parent : String(body.id ?? '');
    const original = log?.ops.find((op) => op.op === 'append' && op.id === id);
    if (!original) return fail('message_not_found', 404);

    if (action === 'edit' || action === 'withdraw') {
      if (!original.tokenHash || !safeEqual(await sha(String(body.token ?? '')), original.tokenHash)) return fail('edit_token_invalid', 403);
      if (action === 'edit') {
        const text = clean(body.body, BODY_MAX);
        if (!text) return fail('body_required');
        pushOp(log, { op: 'edit', id, body: text }, now);
        const river = await readJson(kv, 'loom:river', []);
        const hit = river.find((e) => e.key === log.key && e.id === id);
        if (hit) { hit.body = excerpt(text, 280); hit.edited = true; await writeJson(kv, 'loom:river', river); }
      } else { pushOp(log, { op: 'hide', id, reason: 'withdrawn' }, now); await dropFromRiver(kv, log.key, id); }
    } else if (action === 'plus') {
      if (!await limit('loom:plus')) return fail('rate_limited', 429);
      pushOp(log, { op: 'plus', id, by: await clientTag(request, body) }, now);
    } else if (action === 'vote') {
      if (!await limit('loom:plus')) return fail('rate_limited', 429);
      const choice = Number(body.choice);
      if (!original.poll || !Number.isInteger(choice) || !original.poll.options[choice]) return fail('vote_invalid');
      pushOp(log, { op: 'vote', id, choice, by: await clientTag(request, body) }, now);
    } else if (action === 'hide') {
      if (!adminKey || !safeEqual(request.headers.get('X-Loom-Admin') ?? '', adminKey)) return fail('admin_required', 403);
      pushOp(log, { op: 'hide', id, reason: clean(body.reason, 80) || 'moderated' }, now);
      await dropFromRiver(kv, log.key, id);
    } else return fail('action_unknown');
    await saveLog(kv, log);
    const view = publicView(log);
    return json({ ok: true, spec: SPEC, seq: log.seq, message: view.messages.find((m) => m.id === id) ?? null });
  } catch (error) {
    if (error instanceof AddressError) return fail(error.message);
    return fail('loom_unavailable', 500);
  }
}
