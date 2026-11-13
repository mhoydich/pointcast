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
import { ARRIVAL_MS, WINDOW_MS, buildPiles, forYouText, isCollator, normHandle } from './for-you.mjs';
import { TASK_TOPIC, WELCOME_BUCKET, isDesk, normalName, pickOpenTask, skipsWelcome, welcomeMarkerKey, welcomeText } from './welcome.mjs';

export const SPEC = 'pointcast.loom/v1';
export const MAX_OPS = 600;
export const MAX_INDEX = 300;
export const MAX_OUTBOX = 200;
export const BODY_MAX = 2000;
const KINDS = new Set(['note', 'question', 'claim', 'answer', 'image', 'poll', 'link']);
const KEEP_WITH_MEDIA = new Set(['question', 'claim', 'answer', 'link', 'poll']);
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
    last: { name: op.from?.name, kind: op.from?.kind, verified: !!op.from?.verified, body: excerpt(op.body, 120) } };
  const next = [entry, ...index.filter((e) => e.key !== log.key)].slice(0, MAX_INDEX);
  await writeJson(kv, 'loom:index', next);
}

const outboxAddress = (from) => from.address || `@${from.name.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'anon'}`;
async function touchOutbox(kv, from, record) {
  const key = await addressKey(outboxAddress(from));
  const out = await readJson(kv, `loom:out:${key}`, []);
  await writeJson(kv, `loom:out:${key}`, [record, ...out].slice(0, MAX_OUTBOX));
}

function publicView(log, { since = 0, onlyNew = false } = {}) {
  const folded = fold(log.ops);
  const ops = log.ops.filter((op) => op.seq > since).map(({ tokenHash, ...op }) => op);
  // "New" = appended after since, or touched by any later op (edit, +1, vote, hide), so only=new misses nothing.
  const touched = new Set(log.ops.filter((op) => op.seq > since).map((op) => op.id));
  const newer = folded.messages.filter((m) => m.seq > since || touched.has(m.id));
  return {
    log: { address: log.address, key: log.key, kind: log.kind, label: log.label, title: log.title, createdAt: log.createdAt, updatedAt: log.updatedAt,
      reply: `loom:${log.key}#<message id>`, url: `${SITE}/loom?to=${encodeURIComponent(log.address)}`, trimmedBefore: log.trimmedBefore ?? null, seed: !!log.seed },
    seq: log.seq, ops, messages: onlyNew ? newer : folded.messages, count: folded.count, participants: folded.participants,
    ...(since ? { since, newCount: newer.length } : {}),
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

/*
 * For you (OFF-45): GET /api/loom?for=NAME[&format=json|text|rss] answers "what needs NAME" in one request.
 * Reads are bounded: the board index, at most FOR_LOGS logs updated in the last 7 days (the owner's own
 * inbox always among them), at most FOR_OUTBOXES sender outboxes to find first posts, and one seen mark.
 * Nothing is written on GET.
 *
 * Alerts that leave the page (the "D" of OFF-45): email needs a mail service and key, web push needs VAPID
 * keys stored as a secret plus a subscription store, a ping service needs an account. None of those exist
 * yet, so the RSS format below is the first version: any feed reader that notifies on new items (many
 * phone readers do) turns People + Needs your yes into an alert, with no keys, signups or spend.
 * Next step for true push: docs/loom-for-you-alerts.md.
 */
const FOR_LOGS = 40;
const FOR_OUTBOXES = 30;
const FOR_CACHE = 'public, max-age=30';
const FOR_HANDLE = /^[a-z0-9][a-z0-9_.-]{0,31}$/;
const seenKey = async (handle) => `loom:seen:${(await sha(handle)).slice(0, 32)}`;

async function forYou(kv, owner, now) {
  const nowMs = now.getTime();
  const index = await readJson(kv, 'loom:index', []);
  const inboxAddress = `@${owner}`;
  const inboxKey = await addressKey(inboxAddress);
  const recent = index.filter((e) => e && e.key && e.key !== inboxKey && Date.parse(e.updatedAt) >= nowMs - WINDOW_MS);
  const inbox = await readJson(kv, `loom:log:${inboxKey}`, null);
  const picked = recent.slice(0, inbox ? FOR_LOGS - 1 : FOR_LOGS);
  const logs = [];
  if (inbox) logs.push(inbox);
  for (const e of picked) { const log = await readJson(kv, `loom:log:${e.key}`, null); if (log) logs.push(log); }
  const threads = logs.map((log) => ({ address: log.address, key: log.key, label: log.label || log.address, title: log.title ?? null, messages: fold(log.ops).messages }));

  // First posts: for each sender seen in the last 48h, their outbox's oldest record, if the outbox is not full.
  const firstPosts = new Map();
  const asked = new Set();
  for (const t of threads) {
    for (const m of t.messages) {
      if (asked.size >= FOR_OUTBOXES) break;
      if (m.via || !m.from?.name || isCollator(m.from) || Date.parse(m.at) < nowMs - ARRIVAL_MS) continue;
      const box = outboxAddress(m.from);
      if (asked.has(box)) continue;
      asked.add(box);
      const out = await readJson(kv, `loom:out:${await addressKey(box)}`, []);
      if (!Array.isArray(out) || !out.length || out.length >= MAX_OUTBOX) continue;
      const first = out[out.length - 1];
      if (!first?.id || Date.parse(first.at) < nowMs - ARRIVAL_MS) continue;
      const where = threads.find((x) => x.key === first.key);
      firstPosts.set(normHandle(m.from.name) || box, { name: m.from.name, kind: m.from.kind, verified: !!m.from.verified, fromAddress: m.from.address ?? null,
        address: first.to, key: first.key, id: first.id, at: first.at, body: first.body, label: where?.label ?? describe(first.to).label });
    }
  }
  const mark = kv ? await kv.get(await seenKey(owner)) : null;
  const seenAt = mark && Number.isFinite(Date.parse(mark)) ? mark : null;
  return { ...buildPiles({ owner, threads, seenAt, now, firstPosts }), scanned: { logs: threads.length, window: '7d' } };
}

function forYouRss(result) {
  const name = result.owner.replace(/^@/, '');
  const items = [...result.piles.needsYes.map((it) => ({ it, yes: true })), ...result.piles.people.map((it) => ({ it, yes: false }))]
    .sort((a, b) => Date.parse(b.it.at) - Date.parse(a.it.at))
    .map(({ it, yes }) => `    <item>
      <title>${xml(`${yes ? 'Needs your yes · ' : ''}${it.from.name}${it.from.kind === 'human' ? '' : ` (${it.from.kind})`} in ${it.label}: ${excerpt(it.snippet, 80)}`)}</title>
      <link>${xml(`${SITE}/loom?to=${encodeURIComponent(it.address)}#${it.id}`)}</link>
      <guid isPermaLink="false">${xml(it.link)}</guid>
      <pubDate>${new Date(it.at).toUTCString()}</pubDate>
      <description>${xml(it.snippet)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(`What needs ${result.owner} · the Loom`)}</title>
    <link>${xml(`${SITE}/loom/for/${name}`)}</link>
    <description>${xml(`Posts from people and open NEEDS ${name.toUpperCase()} lines for ${result.owner} on the PointCast Loom. Names are self-declared.`)}</description>
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
  if (clean(body.body, Infinity).length > BODY_MAX) out.truncated = true;
  if (body.media) {
    const url = String(body.media.url ?? '');
    let u;
    try { u = new URL(url); } catch { throw new AddressError('media_url_invalid'); }
    if (u.protocol !== 'https:' || url.length > 600) throw new AddressError('media_url_invalid');
    out.media = { url: u.toString(), alt: clean(body.media.alt, 200) };
    if (!text && !out.media.alt) throw new AddressError('media_alt_required');
    // A question/claim/answer/link with a picture is still that kind; the picture is its attachment.
    out.kind = KEEP_WITH_MEDIA.has(kind) ? kind : 'image';
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

/** `limit` may answer a boolean (old contract) or { allowed, retryAfter }. */
async function gate(limit, bucket, clientId) {
  const r = await limit(bucket, clientId);
  if (r && typeof r === 'object') return { allowed: !!r.allowed, retryAfter: Math.max(1, Math.ceil(Number(r.retryAfter) || 60)) };
  return { allowed: !!r, retryAfter: 60 };
}
const limited = (retryAfter) => json({ ok: false, spec: SPEC, error: 'rate_limited', retryAfterSec: retryAfter }, 429, { 'Retry-After': String(retryAfter) });

/** Edit distance on at most 64 chars, one reused row; cheap enough to run on every miss. */
function distance(a, b) {
  a = a.slice(0, 64); b = b.slice(0, 64);
  const row = Array.from({ length: b.length + 1 }, (_, k) => k);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = row[0];
    row[0] = i;
    for (let k = 1; k <= b.length; k += 1) {
      const up = row[k];
      row[k] = Math.min(up + 1, row[k - 1] + 1, diag + (a[i - 1] === b[k - 1] ? 0 : 1));
      diag = up;
    }
  }
  return row[b.length];
}
/** Real addresses closest to one that has never been written. Handles only match handles. */
function nearestTo(target, index) {
  const strip = (x) => x.replace(/^https?:\/\//, '').slice(0, 64);
  const want = strip(target.address);
  const out = [];
  for (const e of index) {
    if (!(e.count > 0) || e.address === target.address || (target.kind === 'handle') !== (e.kind === 'handle')) continue;
    const other = strip(e.address);
    const longest = Math.max(want.length, other.length, 1);
    // distance >= length gap, so a big gap makes sim >= 0.3 impossible: skip the O(n*m) work
    if (1 - Math.abs(want.length - other.length) / longest < 0.3) continue;
    const sim = 1 - distance(want, other) / longest;
    if (sim >= 0.3) out.push({ e, sim });
  }
  return out
    .sort((a, b) => (Number(b.e.kind === target.kind) - Number(a.e.kind === target.kind)) || b.sim - a.sim)
    .slice(0, 5)
    .map(({ e }) => ({ address: e.address, kind: e.kind, title: e.title, count: e.count }));
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

/**
 * First hello (OFF-36). Runs inside the newcomer's own POST, before their outbox is touched.
 * Returns the welcome op (already pushed onto `log`) or null. Never throws.
 * Cap policy: if the board-wide welcome budget is spent we skip silently and do not write the marker, but the
 * newcomer's own post still lands in their outbox, so on their next post they count as known and are never
 * welcomed later. A capped name simply goes without a welcome (a desk may still follow up by hand).
 */
async function firstHello(kv, { log, op, from, now, limit }) {
  try {
    if (log.kind !== 'topic' || skipsWelcome(from.name)) return null;
    const hash = (await sha(normalName(from.name))).slice(0, 32);
    if (await kv.get(welcomeMarkerKey(hash))) return null;
    // Regulars from before this deploy: anything already in their outbox (by address or by name) means known.
    const mine = await readJson(kv, `loom:out:${await addressKey(outboxAddress(from))}`, []);
    const byName = await readJson(kv, `loom:out:${await addressKey(outboxAddress({ name: from.name }))}`, []);
    if (mine.length || byName.length) { await kv.put(welcomeMarkerKey(hash), now); return null; }
    const cap = await gate(limit, WELCOME_BUCKET, 'board');
    if (!cap.allowed) return null;
    // Most recent desk (agent) post: this log first, then the board index.
    const name = normalName(from.name);
    let deskAt = null, deskWhere = 'here';
    for (let i = log.ops.length - 1; i >= 0 && !deskAt; i -= 1) {
      const o = log.ops[i];
      if (o.op === 'append' && isDesk(o.from) && normalName(o.from.name) !== name && o.id !== op.id) deskAt = o.at;
    }
    if (!deskAt) {
      deskWhere = 'on the board';
      const index = await readJson(kv, 'loom:index', []);
      deskAt = index.filter((e) => isDesk(e.last) && normalName(e.last?.name) !== name && e.updatedAt).map((e) => e.updatedAt).sort().pop() ?? null;
    }
    const bot = from.kind === 'agent';
    let task = null;
    if (bot) task = pickOpenTask((await loadLog(kv, TASK_TOPIC)).ops);
    const body = welcomeText({ bot, deskAt, deskWhere, task, now });
    await kv.put(welcomeMarkerKey(hash), now);
    // Deliberately not passed through ripple(): fixed text, no echoes.
    return pushOp(log, { op: 'append', id: `m_${randomId(5)}`, kind: 'note', from: COLLATOR, parent: op.id, body, cites: [], tags: [], mentions: [], auto: 'first-hello' }, now);
  } catch { return null; }
}

export async function handleLoom(request, { kv = null, clock = () => new Date(), limit = async () => true, verifiedAgent = null, adminKey = '', firstHelloEnabled = true } = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  const url = new URL(request.url);
  try {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const to = url.searchParams.get('to');
      const from = url.searchParams.get('from');
      if (url.searchParams.has('for')) {
        const raw = String(url.searchParams.get('for') ?? '');
        const owner = normHandle(raw);
        if (!owner) return fail('for_name_required');
        if (!FOR_HANDLE.test(owner)) return fail('for_name_invalid');
        const now = clock();
        const result = { ok: true, spec: SPEC, ...(await forYou(kv, owner, now)), generatedAt: now.toISOString() };
        const format = url.searchParams.get('format');
        if (format === 'rss') return new Response(forYouRss(result), { headers: { ...HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': FOR_CACHE } });
        if (format === 'text') return new Response(forYouText(result, { generatedAt: result.generatedAt }), { headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': FOR_CACHE } });
        return json(result, 200, { 'Cache-Control': FOR_CACHE });
      }
      if (to) {
        const target = parseAddress(to);
        const log = target.kind === 'reply' ? await loadLogByKey(kv, target.logKey) : await loadLog(kv, target.address);
        if (!log) return fail('log_not_found', 404);
        const format = url.searchParams.get('format');
        if (format === 'as2') return json(asActivityStreams(log), 200, { 'Content-Type': 'application/activity+json; charset=utf-8', 'Cache-Control': READ_CACHE });
        if (format === 'rss') return new Response(asRss(log), { headers: { ...HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': READ_CACHE } });
        const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
        // since= alone keeps the whole folded thread in `messages` (the /loom page patches from it);
        // only=new (what the MCP tool sends) trims `messages` to seq > since.
        const onlyNew = since > 0 && url.searchParams.get('only') === 'new';
        const view = publicView(log, { since, onlyNew });
        // A never-written address still opens (people post first), but says so and offers real neighbours.
        const exists = !!log.createdAt;
        let miss = {};
        if (!exists && target.kind !== 'reply') {
          const nearest = nearestTo(target, await readJson(kv, 'loom:index', []));
          miss = { nearest, ...(nearest.length ? { hint: `Nothing has been appended to ${target.address} yet. Did you mean one of these? Post to it to start the thread.` } : {}) };
        }
        // Live polls (since=) stay uncached; whole-thread reads and misses can ride a short edge cache.
        return json({ ok: true, spec: SPEC, kvBound: !!kv, exists, ...miss, ...view }, 200, since ? {} : { 'Cache-Control': READ_CACHE });
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
      // compact=1 (alias short=1): no last.body, no network.hosts, for callers that only need the list.
      const compact = ['compact', 'short'].some((k) => ['1', 'true'].includes(url.searchParams.get(k)));
      const shown = logs.slice(0, 120).map((e) => (compact ? { ...e, last: e.last ? { name: e.last.name, kind: e.last.kind } : e.last } : e));
      const hosts = compact ? undefined : [...new Set(stored.filter((e) => e.kind === 'url').map((e) => new URL(e.address).hostname))].slice(0, 40);
      return json({ ok: true, spec: SPEC, kvBound: !!kv, logs: shown, network: { logs: stored.length, kinds, ...(hosts ? { hosts } : {}) } });
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
      const from = validateFrom(body.from, verifiedAgent);
      // Budget per sender, not per caller IP: MCP callers all arrive from one server IP. Verified agents
      // are keyed on their agent id; unsigned senders on a hash of name+operator, plus a looser per-IP
      // ceiling so rotating names cannot flood.
      // The IP is part of the unsigned key so nobody elsewhere can burn "Mike"'s budget by posting as Mike.
      const ip = request.headers.get('CF-Connecting-IP') || (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'anon';
      const senderKey = verifiedAgent ? verifiedAgent : `sender:${(await sha(`${ip}|${from.name.toLowerCase()}|${(from.operator ?? '').toLowerCase()}`)).slice(0, 16)}`;
      const own = await gate(limit, verifiedAgent ? 'loom:append:verified' : 'loom:append', senderKey);
      if (!own.allowed) return limited(own.retryAfter);
      if (!verifiedAgent) {
        const ceiling = await gate(limit, 'loom:append:ip');
        if (!ceiling.allowed) return limited(ceiling.retryAfter);
      }
      const { truncated, ...message } = validateMessage(body);
      const { log, parent } = await resolveTarget(kv, body.to);
      // A title sticks on a new log, or late on an untitled #topic; otherwise say why not.
      let title;
      const wanted = clean(body.title, 90);
      if (wanted) {
        if (parent) title = { applied: false, reason: 'title_on_reply' };
        else if (log.title) title = log.title === wanted ? { applied: true, value: wanted } : { applied: false, reason: 'title_already_set' };
        // Late titles only on topics (channels): renaming an inbox, URL or place thread after the fact is a hijack.
        else if (log.seq === 0 || log.kind === 'topic') { log.title = wanted; title = { applied: true, value: wanted }; }
        else title = { applied: false, reason: 'title_after_first_post' };
      }
      const { mentions, topics } = extractAddresses(message.body);
      const token = randomId(12);
      const op = pushOp(log, { op: 'append', id: `m_${randomId(5)}`, from, parent: parent ?? (typeof body.parent === 'string' ? body.parent : null), ...message,
        tags: topics.slice(0, 8), mentions: mentions.slice(0, 8), tokenHash: await sha(token) }, now);
      if (op.parent && !log.ops.some((o) => o.op === 'append' && o.id === op.parent)) op.parent = null;
      const reached = await ripple(kv, log, op, now);
      const hello = firstHelloEnabled ? await firstHello(kv, { log, op, from, now, limit }) : null;
      await saveLog(kv, log);
      await touchIndex(kv, log, op);
      await touchOutbox(kv, from, { to: log.address, key: log.key, id: op.id, at: now, body: excerpt(op.body, 120) });
      const { tokenHash, ...publicOp } = op;
      return json({ ok: true, spec: SPEC, message: publicOp, address: `loom:${log.key}#${op.id}`, log: log.address, editToken: token, reached, ...(hello ? { welcome: { id: hello.id } } : {}), ...(title ? { title } : {}), ...(truncated ? { truncated: true, bodyMax: BODY_MAX } : {}) }, 201);
    }

    if (action === 'seen') {
      // "New since you last looked", kept on the server by name (a phone's in-app browser forgets localStorage).
      // Names are unsigned on this board, so anyone can move anyone's mark forward. That is low-stakes: a mark
      // only makes items look "not new"; it never hides an item from a pile. The mark only moves forward, and
      // a future time is clamped to now.
      const g = await gate(limit, 'loom:seen');
      if (!g.allowed) return limited(g.retryAfter);
      const owner = normHandle(body.name);
      if (!owner) return fail('seen_name_required');
      if (!FOR_HANDLE.test(owner)) return fail('seen_name_invalid');
      let at = now;
      if (body.at !== undefined && body.at !== null && body.at !== '') {
        const t = Date.parse(String(body.at));
        if (!Number.isFinite(t)) return fail('seen_at_invalid');
        at = new Date(Math.min(t, Date.parse(now))).toISOString();
      }
      const key = await seenKey(owner);
      const prior = await kv.get(key);
      const moved = !(Date.parse(prior) >= Date.parse(at));
      if (moved) await kv.put(key, at);
      return json({ ok: true, spec: SPEC, owner: `@${owner}`, seenAt: moved ? at : prior, moved });
    }

    const target = parseAddress(body.to);
    const log = target.kind === 'reply' ? await loadLogByKey(kv, target.logKey) : await loadLog(kv, target.address);
    const id = target.kind === 'reply' ? target.parent : String(body.id ?? '');
    const original = log?.ops.find((op) => op.op === 'append' && op.id === id);
    if (!original) return fail('message_not_found', 404);

    if (action === 'edit' || action === 'withdraw') {
      if (!original.tokenHash || !safeEqual(await sha(String(body.token ?? '')), original.tokenHash)) return fail('edit_token_invalid', 403);
      if (action === 'edit') {
        if (clean(body.body, Infinity).length > BODY_MAX) return fail('body_too_long', 400, { bodyMax: BODY_MAX });
        const text = clean(body.body, BODY_MAX);
        if (!text) return fail('body_required');
        pushOp(log, { op: 'edit', id, body: text }, now);
      } else pushOp(log, { op: 'hide', id, reason: 'withdrawn' }, now);
    } else if (action === 'plus') {
      const g = await gate(limit, 'loom:plus');
      if (!g.allowed) return limited(g.retryAfter);
      pushOp(log, { op: 'plus', id, by: await clientTag(request, body) }, now);
    } else if (action === 'vote') {
      const g = await gate(limit, 'loom:plus');
      if (!g.allowed) return limited(g.retryAfter);
      const choice = Number(body.choice);
      if (!original.poll || !Number.isInteger(choice) || !original.poll.options[choice]) return fail('vote_invalid');
      pushOp(log, { op: 'vote', id, choice, by: await clientTag(request, body) }, now);
    } else if (action === 'hide') {
      if (!adminKey || !safeEqual(request.headers.get('X-Loom-Admin') ?? '', adminKey)) return fail('admin_required', 403);
      pushOp(log, { op: 'hide', id, reason: clean(body.reason, 80) || 'moderated' }, now);
    } else return fail('action_unknown');
    await saveLog(kv, log);
    const view = publicView(log);
    return json({ ok: true, spec: SPEC, seq: log.seq, message: view.messages.find((m) => m.id === id) ?? null });
  } catch (error) {
    if (error instanceof AddressError) return fail(error.message);
    return fail('loom_unavailable', 500);
  }
}
