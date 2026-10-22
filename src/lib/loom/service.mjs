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
 * v2 adds three things on top of v1:
 *   - Storage goes through a store (store.mjs). With the LOOM Durable Object
 *     bound, every log is its own object: appends are serialised (no lost
 *     writes) and pushed live over /api/loom/live. Without it, the v1 KV
 *     layout still works.
 *   - Sealed messages (seal.mjs): end-to-end encrypted DMs to an inbox whose
 *     owner published a key with {action:"key"}. The envelope is public; the
 *     content is not.
 *   - Peers: another site that serves /.well-known/loom.json can introduce
 *     itself with {action:"peer", node}. The Loom fetches the card, checks it
 *     names the same origin, and lists the peer in its own card.
 */
import { AddressError, SITE, addressKey, extractAddresses, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';
import { MAX_OPS, emptyLog, publicOp } from './log.mjs';
import { checkEnvelope, checkPublicKey, fingerprint, keyId } from './seal.mjs';
import { kvStore } from './store.mjs';

export { MAX_OPS };
export const SPEC = 'pointcast.loom/v2';
export const MAX_INDEX = 300;
export const MAX_OUTBOX = 200;
export const MAX_PEERS = 200;
export const MAX_KEYS = 8;
export const BODY_MAX = 2000;
const KINDS = new Set(['note', 'question', 'claim', 'answer', 'image', 'poll', 'link']);
const SENDER_KINDS = new Set(['human', 'agent']);
/** Address kinds that are somebody's inbox, and so can hold sealed messages. */
export const INBOX_KINDS = new Set(['handle', 'agent', 'wallet', 'did']);
const RIPPLE_MAX = 4;
const ACTIONS = new Set(['append', 'edit', 'withdraw', 'plus', 'vote', 'hide', 'key', 'peer']);

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
      { op: 'append', id: 'm_seedsealed', kind: 'note', from: COLLATOR, parent: 'm_seedwelcome', body: 'Public by default, sealed when you need it. Publish a key for your inbox and people can send you sealed messages: everyone can see that something arrived, only you can read it. The key never leaves your browser.' },
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
const excerpt = (s, n = 140) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const SEALED_LINE = 'sealed message';

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
  const entry = { address: log.address, key: log.key, kind: log.kind, label: log.label, title: log.title, updatedAt: log.updatedAt, count: folded.count,
    last: { name: op.from?.name, kind: op.from?.kind, body: op.sealed ? SEALED_LINE : excerpt(op.body, 120) } };
  await store.pushList('index', entry, { keyField: 'key', cap: MAX_INDEX });
}

async function touchOutbox(store, from, record) {
  const sender = from.address || `@${from.name.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'anon'}`;
  await store.pushList(`out:${await addressKey(sender)}`, record, { cap: MAX_OUTBOX });
}

function publicView(log, { since = 0, live = false } = {}) {
  const folded = fold(log.ops);
  const ops = log.ops.filter((op) => op.seq > since).map(publicOp);
  return {
    log: { address: log.address, key: log.key, kind: log.kind, label: log.label, title: log.title, createdAt: log.createdAt, updatedAt: log.updatedAt,
      reply: `loom:${log.key}#<message id>`, url: `${SITE}/loom?to=${encodeURIComponent(log.address)}`, trimmedBefore: log.trimmedBefore ?? null, seed: !!log.seed,
      live: live ? `wss://pointcast.xyz/api/loom/live?to=${encodeURIComponent(log.address)}` : null, sealable: INBOX_KINDS.has(log.kind) },
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
      object: { type: m.media ? 'Image' : 'Note', id: `loom:${log.key}#${m.id}`, published: m.at, updated: m.editedAt ?? undefined,
        ...(m.sealed ? { summary: 'Sealed message (end-to-end encrypted; see sealed in the JSON view)' } : { content: m.body }),
        inReplyTo: m.parent ? `loom:${log.key}#${m.parent}` : log.address, url: m.media?.url, tag: [...m.tags, ...m.mentions].map((name) => ({ type: name.startsWith('@') ? 'Mention' : 'Hashtag', name })) },
    })),
  };
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

// ── sealed inboxes: the key directory ─────────────────────────────────────
const keysName = async (address) => `keys:${await addressKey(address)}`;
function publicKeys(record) {
  if (!record) return null;
  const current = record.keys.find((k) => k.kid === record.current) ?? record.keys.at(-1);
  return { address: record.address, trust: record.trust, updatedAt: record.updatedAt,
    current: { kid: current.kid, fingerprint: fingerprint(current.kid), publicKey: current.publicKey, at: current.at },
    keys: record.keys.map((k) => ({ kid: k.kid, fingerprint: fingerprint(k.kid), publicKey: k.publicKey, at: k.at })) };
}
async function usablePublicKey(jwk) {
  if (!checkPublicKey(jwk)) return false;
  try { await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []); return true; } catch { return false; }
}

/**
 * {action:"key", address, publicKey, token?} — publish or rotate the key that
 * sealed messages to `address` are encrypted to. An agent: address needs a
 * signed request from that agent. Any other inbox is trust-on-first-use: the
 * first publisher gets a keyToken, and only that token can rotate the key.
 */
async function publishKey(store, body, verifiedAgent, now) {
  const target = parseAddress(body.address);
  if (!INBOX_KINDS.has(target.kind)) throw new AddressError('key_address_not_an_inbox');
  if (target.address === '@collator') throw new AddressError('from_name_reserved');
  if (target.kind === 'agent' && target.address !== `agent:${verifiedAgent}`) return fail('key_needs_agent_signature', 403);
  if (!await usablePublicKey(body.publicKey)) throw new AddressError('key_invalid');
  const publicKey = { kty: 'EC', crv: 'P-256', x: body.publicKey.x, y: body.publicKey.y };
  const kid = await keyId(publicKey);
  const name = await keysName(target.address);
  const record = await store.getRecord(name);
  let token = null;
  let next;
  if (!record) {
    token = target.kind === 'agent' ? null : randomId(16);
    next = { address: target.address, trust: target.kind === 'agent' ? 'verified-agent' : 'first-use', tokenHash: token ? await sha(token) : null,
      keys: [{ kid, publicKey, at: now }], current: kid, createdAt: now, updatedAt: now };
  } else {
    const byAgent = target.kind === 'agent' && target.address === `agent:${verifiedAgent}`;
    const byToken = record.tokenHash && safeEqual(await sha(String(body.token ?? '')), record.tokenHash);
    if (!byAgent && !byToken) return fail('key_claimed', 403, { hint: 'This inbox already has a key. Rotating it needs the keyToken from the first publish.' });
    const keys = record.keys.some((k) => k.kid === kid) ? record.keys : [...record.keys, { kid, publicKey, at: now }];
    next = { ...record, keys: keys.slice(-MAX_KEYS), current: kid, updatedAt: now };
  }
  const saved = await store.putRecord(name, next, record?.version ?? 0);
  if (!saved.ok) return fail('key_conflict_retry', 409);
  return json({ ok: true, spec: SPEC, address: target.address, kid, fingerprint: fingerprint(kid), ...(token ? { keyToken: token } : {}), keys: publicKeys(saved.record) }, record ? 200 : 201);
}

/** Every kid must be a key published for the inbox or for the sender, and at least one for the inbox. */
async function checkSealedRecipients(store, envelope, inboxAddress, fromAddress) {
  const inbox = await store.getRecord(await keysName(inboxAddress));
  if (!inbox) throw new AddressError('sealed_inbox_has_no_key');
  const sender = fromAddress && fromAddress !== inboxAddress ? await store.getRecord(await keysName(fromAddress)).catch(() => null) : null;
  const inboxKids = new Set(inbox.keys.map((k) => k.kid));
  const known = new Set([...inboxKids, ...(sender?.keys ?? []).map((k) => k.kid)]);
  if (!envelope.to.some((t) => inboxKids.has(t.kid))) throw new AddressError('sealed_not_for_this_inbox');
  if (!envelope.to.every((t) => known.has(t.kid))) throw new AddressError('sealed_unknown_kid');
}

// ── peers: /.well-known/loom.json ─────────────────────────────────────────
/** This node's card, served at /.well-known/loom.json. */
export function nodeCard({ peers = [], live = false } = {}) {
  return {
    spec: SPEC,
    node: SITE,
    name: 'PointCast',
    api: `${SITE}/api/loom`,
    live: live ? `wss://pointcast.xyz/api/loom/live?to=<address>` : null,
    human: `${SITE}/loom`,
    protocol: `${SITE}/loom.json`,
    embed: `${SITE}/loom/embed.js`,
    features: ['append', 'reply', 'ripple', 'playback', 'activitystreams', 'sealed', ...(live ? ['live'] : [])],
    handshake: { method: 'POST', url: `${SITE}/api/loom`, body: { action: 'peer', node: 'https://your.site' },
      note: 'Serve your own /.well-known/loom.json (spec pointcast.loom/vN, node = your origin, api on your origin), then POST. We fetch your card, check it, and list you here.' },
    peers: peers.map(({ node, name, spec, api, verifiedAt }) => ({ node, name, spec, api, verifiedAt })),
  };
}

const PRIVATE_HOST = /^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.lan|.*\.home\.arpa)$/i;
function peerOrigin(raw) {
  let u;
  try { u = new URL(String(raw ?? '')); } catch { throw new AddressError('peer_node_invalid'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) throw new AddressError('peer_node_https_origin');
  const host = u.hostname.toLowerCase();
  if (!host.includes('.') || PRIVATE_HOST.test(host) || /^[\d.]+$/.test(host) || host.startsWith('[')) throw new AddressError('peer_node_host');
  if (`https://${host}` === SITE || host === 'www.pointcast.xyz') throw new AddressError('peer_self');
  return `https://${host}`;
}
async function readCapped(res, max) {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw new AddressError('peer_card_too_large'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { all.set(c, at); at += c.byteLength; }
  return new TextDecoder().decode(all);
}

/** {action:"peer", node} — fetch the node's card, check it, list it. */
async function handshake(store, body, fetcher, now) {
  const origin = peerOrigin(body.node);
  let res;
  try {
    res = await fetcher(`${origin}/.well-known/loom.json`, { redirect: 'manual', headers: { Accept: 'application/json', 'User-Agent': 'PointCast-Loom/2 (+https://pointcast.xyz/loom.json)' }, signal: AbortSignal.timeout(5000) });
  } catch { return fail('peer_unreachable', 502); }
  if (res.status !== 200) return fail('peer_card_missing', 502, { status: res.status });
  let card;
  try { card = JSON.parse(await readCapped(res, 65_536)); } catch (error) { if (error instanceof AddressError) throw error; return fail('peer_card_invalid', 502); }
  if (!card || typeof card !== 'object' || !/^pointcast\.loom\/v\d{1,3}$/.test(String(card.spec))) return fail('peer_card_spec', 502);
  let node, api;
  try { node = new URL(String(card.node)).origin; api = new URL(String(card.api), origin); } catch { return fail('peer_card_invalid', 502); }
  if (node !== origin || api.origin !== origin || api.protocol !== 'https:') return fail('peer_card_origin_mismatch', 502);
  const existing = ((await store.getList('peers')) ?? []).find((p) => p.node === origin);
  const peer = { node: origin, name: clean(card.name, 60) || new URL(origin).hostname, spec: card.spec, api: api.toString().slice(0, 300), verifiedAt: now, firstSeenAt: existing?.firstSeenAt ?? now };
  await store.pushList('peers', peer, { keyField: 'node', cap: MAX_PEERS });
  return json({ ok: true, spec: SPEC, peer, card: nodeCard({ peers: [], live: !!store.pushes }) }, existing ? 200 : 201);
}

// ── the request handler ───────────────────────────────────────────────────
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
  let draft;
  if (body.sealed !== undefined && body.sealed !== null) {
    if (!INBOX_KINDS.has(log.kind)) throw new AddressError('sealed_needs_an_inbox');
    if (clean(body.body, 10) || body.media || body.poll) throw new AddressError('sealed_plaintext_not_allowed');
    let sealed;
    try { sealed = checkEnvelope(body.sealed); } catch (error) { throw new AddressError(error.message); }
    await checkSealedRecipients(store, sealed, log.address, from.address);
    draft = { op: 'append', id: `m_${randomId(5)}`, from, parent, kind: 'sealed', body: '', sealed, cites: [], tags: [], mentions: [], tokenHash: await sha(token) };
  } else {
    const message = validateMessage(body);
    const { mentions, topics } = extractAddresses(message.body);
    draft = { op: 'append', id: `m_${randomId(5)}`, from, parent, ...message, tags: topics.slice(0, 8), mentions: mentions.slice(0, 8), tokenHash: await sha(token) };
  }
  const title = body.title ? clean(body.title, 90) || null : null;
  const first = await store.appendOps(log.key, initFor(log), [draft], now, { title });
  const op = first.ops[0];
  let current = first.log;
  let reached = [];
  if (!draft.sealed) {
    const rippled = await ripple(store, current, op, now);
    reached = rippled.reached;
    if (rippled.collated) current = (await store.appendOps(log.key, initFor(current), [rippled.collated], now)).log;
  }
  await touchIndex(store, current, op);
  await touchOutbox(store, from, { to: current.address, key: current.key, id: op.id, at: now, body: draft.sealed ? SEALED_LINE : excerpt(op.body, 120) });
  return json({ ok: true, spec: SPEC, message: publicOp(op), address: `loom:${current.key}#${op.id}`, log: current.address, editToken: token, reached }, 201);
}

/**
 * @param {Request} request
 * @param {{ store?: object|null, kv?: object|null, clock?: () => Date, limit?: (bucket: string) => Promise<boolean>,
 *   verifiedAgent?: string|null, adminKey?: string, fetcher?: typeof fetch }} options
 */
export async function handleLoom(request, { store = undefined, kv = null, clock = () => new Date(), limit = async () => true, verifiedAgent = null, adminKey = '', fetcher = (...a) => fetch(...a) } = {}) {
  if (store === undefined) store = kv ? kvStore(kv) : null;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  const url = new URL(request.url);
  const status = { kvBound: !!store, storage: store?.kind ?? null, live: !!store?.pushes };
  try {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const to = url.searchParams.get('to');
      const from = url.searchParams.get('from');
      const key = url.searchParams.get('key');
      if (to) {
        const target = parseAddress(to);
        const log = target.kind === 'reply' ? await loadLogByKey(store, target.logKey) : await loadLog(store, target.address);
        if (!log) return fail('log_not_found', 404);
        if (url.searchParams.get('format') === 'as2') return json(asActivityStreams(log), 200, { 'Content-Type': 'application/activity+json; charset=utf-8' });
        const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
        return json({ ok: true, spec: SPEC, ...status, ...publicView(log, { since, live: status.live }) });
      }
      if (from) {
        const sender = parseAddress(from);
        const out = store ? (await store.getList(`out:${await addressKey(sender.address)}`)) ?? [] : [];
        return json({ ok: true, spec: SPEC, ...status, from: sender.address, sent: out });
      }
      if (key) {
        const target = parseAddress(key);
        const record = store && INBOX_KINDS.has(target.kind) ? await store.getRecord(await keysName(target.address)) : null;
        return json({ ok: true, spec: SPEC, ...status, address: target.address, sealable: INBOX_KINDS.has(target.kind), keys: publicKeys(record) });
      }
      if (url.searchParams.has('peers')) {
        const peers = store ? (await store.getList('peers')) ?? [] : [];
        return json({ ok: true, spec: SPEC, ...status, peers: nodeCard({ peers }).peers });
      }
      const stored = store ? (await store.getList('index')) ?? [] : [];
      const seeds = [];
      for (const address of Object.keys(SEEDS)) {
        const k = await addressKey(address);
        if (!stored.some((e) => e.key === k)) { const s = seedLog(address, k); seeds.push({ address, key: k, kind: s.kind, label: s.label, title: s.title, updatedAt: s.updatedAt, count: s.ops.length, last: { name: COLLATOR.name, kind: 'robot', body: excerpt(s.ops.at(-1).body, 120) } }); }
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
    if (length > 32_768) return fail('body_too_large', 413);
    let body;
    try { body = JSON.parse((await request.text()).slice(0, 32_768)); } catch { return fail('json_invalid'); }
    if (!body || typeof body !== 'object') return fail('json_invalid');
    const action = String(body.action ?? 'append');
    if (!ACTIONS.has(action)) return fail('action_unknown');
    const now = clock().toISOString();

    if (action === 'append') return await append(store, request, body, { verifiedAgent, limit, now });
    if (action === 'key') {
      if (!await limit('loom:key')) return fail('rate_limited', 429);
      return await publishKey(store, body, verifiedAgent, now);
    }
    if (action === 'peer') {
      if (!await limit('loom:peer')) return fail('rate_limited', 429);
      return await handshake(store, body, fetcher, now);
    }

    const target = parseAddress(body.to);
    const log = target.kind === 'reply' ? await loadLogByKey(store, target.logKey) : await loadLog(store, target.address);
    const id = target.kind === 'reply' ? target.parent : String(body.id ?? '');
    const original = log?.ops.find((op) => op.op === 'append' && op.id === id);
    if (!original) return fail('message_not_found', 404);

    let next;
    if (action === 'edit' || action === 'withdraw') {
      if (!original.tokenHash || !safeEqual(await sha(String(body.token ?? '')), original.tokenHash)) return fail('edit_token_invalid', 403);
      if (action === 'edit') {
        if (original.sealed) return fail('sealed_cannot_be_edited');
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
