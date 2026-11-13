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
 * Storage goes through a store (store.mjs). With AUTH_DB bound and migration
 * 0035 applied, every op is a row in D1 and an append is one atomic INSERT,
 * so concurrent writers never overwrite each other; the directory and
 * outboxes are queries over those rows. Without it, the v1 KV layout (one
 * read-modify-write value per log) still works, and stays readable after the
 * switch: each thread is imported on its first new write.
 */
import { AddressError, SITE, addressKey, extractAddresses, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';
import { MAX_OPS, emptyLog, excerpt, publicOp, senderAddress } from './log.mjs';
import { kvStore } from './store.mjs';

export { MAX_OPS };
export const SPEC = 'pointcast.loom/v1';
export const MAX_INDEX = 300;
export const MAX_OUTBOX = 200;
export const BODY_MAX = 2000;
const KINDS = new Set(['note', 'question', 'claim', 'answer', 'image', 'poll', 'link']);
const SENDER_KINDS = new Set(['human', 'agent']);
const RIPPLE_MAX = 4;
const ACTIONS = new Set(['append', 'edit', 'withdraw', 'plus', 'vote', 'hide']);
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

async function loadLog(store, address) {
  const key = await addressKey(address);
  const stored = store ? await store.getLog(key) : null;
  return stored ?? seedLog(address, key) ?? emptyLog(address, key, describe(address));
}
async function loadLogByKey(store, key) {
  const stored = store ? await store.getLog(key) : null;
  if (stored) return stored;
  for (const address of Object.keys(SEEDS)) if (await addressKey(address) === key) return seedLog(address, key);
  return null;
}
/**
 * What a store needs to create a log it does not hold yet. A log read from the
 * store itself travels without its ops (the store already has them); a seed or
 * a log imported from the v1 KV archive travels whole, once.
 */
const initFor = (log) => (log.seed || log.archived ? log : { ...log, ops: [] });

async function touchIndex(store, log, op) {
  const folded = fold(log.ops);
  const entry = { address: log.address, key: log.key, kind: log.kind, label: log.label, title: log.title, updatedAt: log.updatedAt, seq: log.seq, count: folded.count,
    last: { name: op.from?.name, kind: op.from?.kind, body: excerpt(op.body, 120) } };
  await store.pushList('index', entry, { keyField: 'key', cap: MAX_INDEX });
}

async function touchOutbox(store, from, record) {
  await store.pushList(`out:${await addressKey(senderAddress(from))}`, record, { cap: MAX_OUTBOX });
}

function publicView(log, { since = 0 } = {}) {
  const folded = fold(log.ops);
  const ops = log.ops.filter((op) => op.seq > since).map(publicOp);
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

async function resolveTarget(store, to) {
  const target = parseAddress(to);
  if (target.kind === 'reply') {
    const log = await loadLogByKey(store, target.logKey);
    if (!log) throw new AddressError('reply_log_not_found');
    if (!log.ops.some((op) => op.op === 'append' && op.id === target.parent)) throw new AddressError('reply_message_not_found');
    return { log, parent: target.parent };
  }
  return { log: await loadLog(store, target.address), parent: null };
}

/**
 * Echo a message into every log it reaches (mentions, topics, cited URLs).
 * Returns the addresses reached and, when the same link is already threaded
 * elsewhere, the Collator's note for the source thread (not yet appended).
 */
async function ripple(store, source, op, now) {
  const { links, mentions, topics } = extractAddresses(op.body);
  const targets = [];
  for (const raw of [...mentions, ...topics, ...op.cites, ...links]) {
    try { const a = parseAddress(raw).address; if (a !== source.address && a !== '@collator' && !targets.includes(a)) targets.push(a); } catch { /* not an address; leave the text alone */ }
  }
  const reached = [];
  const elsewhere = new Map();
  for (const address of targets.slice(0, RIPPLE_MAX)) {
    const before = await loadLog(store, address);
    for (const prior of before.ops) {
      if (prior.op === 'append' && prior.via && prior.via.address !== source.address && !elsewhere.has(prior.via.address)) elsewhere.set(prior.via.address, address);
    }
    const echo = { op: 'append', id: `m_${randomId(5)}`, kind: 'link', from: op.from, body: excerpt(op.body, 280), cites: [], tags: [], mentions: [],
      via: { address: source.address, key: source.key, id: op.id, label: source.label } };
    const { log, ops } = await store.appendOps(before.key, initFor(before), [echo], now);
    await touchIndex(store, log, ops[0]);
    reached.push(address);
  }
  // The Collator: "this link is also being threaded over there."
  const others = [...elsewhere.entries()].slice(0, 3);
  const collated = others.length ? { op: 'append', id: `m_${randomId(5)}`, kind: 'link', from: COLLATOR, parent: op.id,
    body: `Also threaded elsewhere — ${others.map(([where, via]) => `${where} (via ${via})`).join('; ')}.`,
    cites: others.map(([where]) => where), tags: [], mentions: [], links: others.map(([where]) => where) } : null;
  return { reached, collated };
}

async function append(store, request, body, { verifiedAgent, limit, now }) {
  if (!await limit(verifiedAgent ? 'loom:append:verified' : 'loom:append')) return fail('rate_limited', 429);
  const from = validateFrom(body.from, verifiedAgent);
  const { log, parent: replyParent } = await resolveTarget(store, body.to);
  const parent = replyParent ?? (typeof body.parent === 'string' && log.ops.some((o) => o.op === 'append' && o.id === body.parent) ? body.parent : null);
  const token = randomId(12);
  const message = validateMessage(body);
  const { mentions, topics } = extractAddresses(message.body);
  const draft = { op: 'append', id: `m_${randomId(5)}`, from, parent, ...message, tags: topics.slice(0, 8), mentions: mentions.slice(0, 8), tokenHash: await sha(token) };
  // A title only names a thread nobody has written to yet.
  const title = body.title && log.seq === 0 ? clean(body.title, 90) || null : null;
  const first = await store.appendOps(log.key, initFor(log), [draft], now, { title, sender: senderAddress(from) });
  const op = first.ops[0];
  let current = first.log;
  const rippled = await ripple(store, current, op, now);
  if (rippled.collated) current = (await store.appendOps(log.key, initFor(current), [rippled.collated], now)).log;
  await touchIndex(store, current, op);
  await touchOutbox(store, from, { to: current.address, key: current.key, id: op.id, at: now, body: excerpt(op.body, 120) });
  return json({ ok: true, spec: SPEC, message: publicOp(op), address: `loom:${current.key}#${op.id}`, log: current.address, editToken: token, reached: rippled.reached }, 201);
}

/**
 * @param {Request} request
 * @param {{ store?: object|null, kv?: object|null, clock?: () => Date, limit?: (bucket: string) => Promise<boolean>,
 *   verifiedAgent?: string|null, adminKey?: string }} options
 */
export async function handleLoom(request, { store = undefined, kv = null, clock = () => new Date(), limit = async () => true, verifiedAgent = null, adminKey = '' } = {}) {
  if (store === undefined) store = kv ? kvStore(kv) : null;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  const url = new URL(request.url);
  const status = { kvBound: !!store, storage: store?.kind ?? null };
  try {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const to = url.searchParams.get('to');
      const from = url.searchParams.get('from');
      if (to) {
        const target = parseAddress(to);
        const log = target.kind === 'reply' ? await loadLogByKey(store, target.logKey) : await loadLog(store, target.address);
        if (!log) return fail('log_not_found', 404);
        const format = url.searchParams.get('format');
        if (format === 'as2') return json(asActivityStreams(log), 200, { 'Content-Type': 'application/activity+json; charset=utf-8', 'Cache-Control': READ_CACHE });
        if (format === 'rss') return new Response(asRss(log), { headers: { ...HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': READ_CACHE } });
        const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
        // Live polls (since=) stay uncached; whole-thread reads can ride a short edge cache.
        return json({ ok: true, spec: SPEC, ...status, ...publicView(log, { since }) }, 200, since ? {} : { 'Cache-Control': READ_CACHE });
      }
      if (from) {
        const sender = parseAddress(from);
        const out = store ? (await store.getList(`out:${await addressKey(sender.address)}`)) ?? [] : [];
        return json({ ok: true, spec: SPEC, ...status, from: sender.address, sent: out });
      }
      const stored = store ? (await store.getList('index')) ?? [] : [];
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
      return json({ ok: true, spec: SPEC, ...status, logs: logs.slice(0, 120), network: { logs: stored.length, kinds, hosts: [...new Set(stored.filter((e) => e.kind === 'url').map((e) => new URL(e.address).hostname))].slice(0, 40) } });
    }

    if (request.method !== 'POST') return fail('method_not_allowed', 405, {});
    if (!store) return fail('store_unbound', 503);
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 16_384) return fail('body_too_large', 413);
    let body;
    try { body = JSON.parse((await request.text()).slice(0, 16_384)); } catch { return fail('json_invalid'); }
    if (!body || typeof body !== 'object') return fail('json_invalid');
    const action = String(body.action ?? 'append');
    if (!ACTIONS.has(action)) return fail('action_unknown');
    const now = clock().toISOString();

    if (action === 'append') return await append(store, request, body, { verifiedAgent, limit, now });

    const target = parseAddress(body.to);
    const log = target.kind === 'reply' ? await loadLogByKey(store, target.logKey) : await loadLog(store, target.address);
    const id = target.kind === 'reply' ? target.parent : String(body.id ?? '');
    const original = log?.ops.find((op) => op.op === 'append' && op.id === id);
    if (!original) return fail('message_not_found', 404);

    let next;
    if (action === 'edit' || action === 'withdraw') {
      if (!original.tokenHash || !safeEqual(await sha(String(body.token ?? '')), original.tokenHash)) return fail('edit_token_invalid', 403);
      if (action === 'edit') {
        const text = clean(body.body, BODY_MAX);
        if (!text) return fail('body_required');
        next = { op: 'edit', id, body: text };
      } else next = { op: 'hide', id, reason: 'withdrawn' };
    } else if (action === 'plus') {
      if (!await limit('loom:plus')) return fail('rate_limited', 429);
      next = { op: 'plus', id, by: await clientTag(request, body) };
    } else if (action === 'vote') {
      if (!await limit('loom:plus')) return fail('rate_limited', 429);
      const choice = Number(body.choice);
      if (!original.poll || !Number.isInteger(choice) || !original.poll.options[choice]) return fail('vote_invalid');
      next = { op: 'vote', id, choice, by: await clientTag(request, body) };
    } else if (action === 'hide') {
      if (!adminKey || !safeEqual(request.headers.get('X-Loom-Admin') ?? '', adminKey)) return fail('admin_required', 403);
      next = { op: 'hide', id, reason: clean(body.reason, 80) || 'moderated' };
    } else return fail('action_unknown');
    const { log: saved } = await store.appendOps(log.key, initFor(log), [next], now);
    const view = publicView(saved);
    return json({ ok: true, spec: SPEC, seq: saved.seq, message: view.messages.find((m) => m.id === id) ?? null });
  } catch (error) {
    if (error instanceof AddressError) return fail(error.message);
    return fail('loom_unavailable', 500);
  }
}
