/**
 * Agent Front Desk. Visitors for /front-desk/agents, stored in VISITS KV
 * under front-desk:day: and front-desk:visit:. Same store as /api/grok/inbox
 * and /api/sky-calls.
 *
 * A check-in is a passport, a minimal {name, operator, purpose}, or a person
 * with {handle, kind:'human'}. The passport is scored with the checker in
 * src/lib/passport-check.mjs. The assigned level is the one the checker can
 * reach, which may be lower than the level written on the document.
 *
 * GET reads the day's book and does not write. Secrets are refused, not stored.
 * The company field is a honeypot, same as the grok inbox.
 */

import {
  attestationPresent,
  canonicalPassport,
  checkKeySigned,
  classifyPassportLine,
  parsePassportLines,
  scorePassport,
  sha256Hex,
  stableStringify,
  validatePassport,
} from '../../src/lib/passport-check.mjs';

export const DESK_SCHEMA = 'pointcast.front-desk/v0.1';
export const RECEIPT_SCHEMA = 'pointcast.agent-receipt/v0.1';
export const STAMP_SCHEMA = 'pointcast.provenance/v0.1';
export const PASSPORT_SCHEMA = 'pointcast.agent-passport/v0.1';
export const LEVELS = ['self-declared', 'key-signed', 'operator-vouched', 'registered-onchain'];
export const TZ = 'America/Los_Angeles';
const DEVNET = 'https://pointcast-devnet.mhoydich.workers.dev';
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const VISIT_RE = /^fd[a-z0-9]{8}$/;
const TTL_SEC = 8 * 24 * 3600;
const MAX_VISITS = 200;
const MAX_BODY = 20_000;
const SECRET_KEY = /private|secret|password|token|authorization|api[-_]?key|credential/i;

export function pacificDay(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

export function cleanLine(raw, max) {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function fail(status, error, extra = {}) {
  return { ok: false, status, error, ...extra };
}

export function containsSecret(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 8) return false;
  for (const [key, child] of Object.entries(value)) {
    if (key !== 'publicKey' && SECRET_KEY.test(key)) return true;
    if (typeof child === 'string' && /BEGIN [A-Z ]*PRIVATE KEY/.test(child)) return true;
    if (containsSecret(child, depth + 1)) return true;
  }
  return false;
}

function newId(prefix, alphabetLength) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(alphabetLength);
  crypto.getRandomValues(bytes);
  let id = prefix;
  for (const byte of bytes) id += alphabet[byte % alphabet.length];
  return id;
}

function dayKey(date) {
  return `front-desk:day:${date}`;
}

function visitKey(id) {
  return `front-desk:visit:${id}`;
}

async function readIndex(kv, date) {
  const raw = await kv.get(dayKey(date));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => VISIT_RE.test(id)) : [];
  } catch {
    return [];
  }
}

async function readRecord(kv, id) {
  if (!VISIT_RE.test(id)) return null;
  const raw = await kv.get(visitKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !VISIT_RE.test(parsed.id)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function publicVisit(record) {
  return {
    id: record.id,
    created_at: record.created_at,
    date: record.date,
    kind: record.kind,
    name: record.name,
    operator: record.operator,
    purpose: record.purpose,
    level: record.level,
    claimed: record.claimed,
    passportHash: record.passportHash,
    checks: record.checks,
    stamp: record.stamp,
    receipt: record.receipt,
  };
}

function emptyCounts() {
  return {
    all: 0,
    human: 0,
    agent: 0,
    levels: {
      'self-declared': 0,
      'key-signed': 0,
      'operator-vouched': 0,
      'registered-onchain': 0,
    },
  };
}

function countsOf(visitors) {
  const counts = emptyCounts();
  counts.all = visitors.length;
  for (const visitor of visitors) {
    if (visitor.kind === 'human') counts.human += 1;
    if (visitor.kind === 'agent') counts.agent += 1;
    if (counts.levels[visitor.level] != null) counts.levels[visitor.level] += 1;
  }
  return counts;
}

/** Read one Pacific day. Does not write, even when an index id has expired. */
export async function listDay(kv, date) {
  if (!kv || !DAY_RE.test(date)) return [];
  const ids = await readIndex(kv, date);
  const visitors = [];
  for (const id of ids) {
    const record = await readRecord(kv, id);
    if (record) visitors.push(publicVisit(record));
  }
  visitors.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return visitors;
}

export async function publicBoard(kv, date, now = Date.now()) {
  const day = date || pacificDay(now);
  if (!DAY_RE.test(day)) return fail(400, 'date must be YYYY-MM-DD');
  const visitors = kv ? await listDay(kv, day) : [];
  return {
    ok: true,
    status: 200,
    schema: DESK_SCHEMA,
    date: day,
    timezone: TZ,
    kvBound: Boolean(kv),
    counts: countsOf(visitors),
    visitors,
    note: kv
      ? 'Who is in town on this Pacific date. A level is what the passport checker could reach. A handle is a claim.'
      : 'VISITS KV is not bound. The board is empty and this read wrote nothing.',
    checkin: {
      method: 'POST',
      url: 'https://pointcast.xyz/api/front-desk',
      agent: '{ name, operator, purpose } or { passport }',
      human: '{ handle, kind: "human" }',
      honeypot: 'company must be empty',
    },
  };
}

function minimalPassport(body, when) {
  const operator = typeof body.operator === 'string'
    ? { name: cleanLine(body.operator, 80) }
    : body.operator;
  return {
    schema: PASSPORT_SCHEMA,
    name: cleanLine(body.name, 64),
    operator,
    purpose: cleanLine(body.purpose, 280),
    capabilities: Array.isArray(body.capabilities) && body.capabilities.length
      ? body.capabilities
      : ['visit'],
    consent: Array.isArray(body.consent) && body.consent.length
      ? body.consent
      : ['label-as-bot'],
    level: 'self-declared',
    updated: when,
  };
}

async function scoreDoc(doc, opts) {
  const errors = validatePassport(doc);
  if (errors.length) return fail(400, errors[0], { errors });
  const keySigned = await checkKeySigned(doc);
  const attestation = attestationPresent(doc);
  let devnet = 'not-consulted';
  let records = [];
  const needsChain = doc.level === 'registered-onchain' || Boolean(doc.devnet);
  if (Array.isArray(opts.records)) {
    records = opts.records;
    devnet = opts.devnet || 'supplied';
  } else if (needsChain && typeof opts.loadRecords === 'function') {
    const loaded = await opts.loadRecords(doc);
    records = Array.isArray(loaded?.records) ? loaded.records : [];
    devnet = loaded?.devnet || 'read';
  }
  const score = scorePassport(doc, errors, keySigned, attestation, records);
  if (!score.valid || !LEVELS.includes(score.reached)) {
    return fail(400, 'the passport did not reach a level', { errors });
  }
  return {
    ok: true,
    kind: 'agent',
    name: cleanLine(doc.name, 64),
    operator: cleanLine(doc.operator?.name, 80),
    purpose: cleanLine(doc.purpose, 280),
    level: score.reached,
    claimed: typeof doc.level === 'string' ? doc.level : null,
    passportHash: await sha256Hex(canonicalPassport(doc)),
    checks: {
      keySigned: keySigned.ok === true,
      attested: attestation.present === true,
      devnet,
      keyNote: keySigned.ok === true
        ? 'An ed25519 signature matched the canonical passport.'
        : 'No ed25519 signature was verified.',
    },
  };
}

function prepareHuman(body) {
  const handle = cleanLine(body.handle || body.name, 32);
  if (!/^[a-z0-9][a-z0-9._ -]{1,31}$/i.test(handle)) {
    return fail(400, 'handle is 2–32 letters, numbers, spaces, dots, underscores, or hyphens');
  }
  const purpose = cleanLine(body.purpose, 280);
  return {
    ok: true,
    kind: 'human',
    name: handle,
    operator: handle,
    purpose: purpose || 'In town.',
    level: 'self-declared',
    claimed: null,
    passportHash: null,
    checks: { keySigned: false, attested: false, devnet: 'not-a-passport', keyNote: 'A person checked in with a handle.' },
  };
}

async function prepare(body, when, opts) {
  if (!opts.forceAgent && body.kind === 'human') return prepareHuman(body);
  if (body.kind != null && body.kind !== 'agent' && body.kind !== 'human') {
    return fail(400, 'kind must be agent or human');
  }
  let doc = body.passport;
  if (typeof doc === 'string') {
    try {
      doc = JSON.parse(doc);
    } catch {
      return fail(400, 'passport must be JSON');
    }
  }
  if (doc && typeof doc === 'object') {
    if (containsSecret(doc)) return fail(400, 'do not send secrets');
    return scoreDoc(doc, opts);
  }
  if (body.name || body.operator || body.purpose) return scoreDoc(minimalPassport(body, when), opts);
  return fail(400, 'send a passport, {name, operator, purpose}, or {handle, kind:"human"}');
}

async function makeStamp(visit) {
  const madeBy = visit.kind === 'human'
    ? [{ kind: 'person', name: visit.name, role: 'visitor' }]
    : [
      { kind: 'agent', name: visit.name, role: 'visitor' },
      { kind: 'person', name: visit.operator, role: 'operator' },
    ];
  const stamp = {
    schema: STAMP_SCHEMA,
    artifact: `https://pointcast.xyz/front-desk/agents/#${visit.id}`,
    madeBy,
    wordsOf: visit.kind === 'human' ? 'person' : 'agent',
    humanApproved: false,
    c2pa: null,
  };
  stamp.contentHash = await sha256Hex(stableStringify(stamp));
  return stamp;
}

function makeReceipt(visit) {
  const receipt = {
    schema: RECEIPT_SCHEMA,
    id: newId('rcpt_', 8),
    agent: visit.kind === 'agent' ? visit.name : null,
    operator: visit.operator,
    action: 'front_desk_checkin',
    when: visit.created_at,
    inputs: {
      kind: visit.kind,
      claimedLevel: visit.claimed,
    },
    result: {
      level: visit.level,
      visitId: visit.id,
      devnet: visit.checks?.devnet ?? null,
    },
    passportHash: visit.passportHash,
    signature: { status: 'pending' },
  };
  if (visit.kind === 'human') {
    receipt.person = visit.name;
    receipt.note = 'A person checked in with a handle. This is a visit record in the receipt shape, not an agent act.';
  }
  return receipt;
}

async function findSame(kv, date, kind, name) {
  const needle = name.toLowerCase();
  for (const id of await readIndex(kv, date)) {
    const record = await readRecord(kv, id);
    if (record && record.kind === kind && String(record.name).toLowerCase() === needle) return record;
  }
  return null;
}

/**
 * Check someone in. `opts.forceAgent` is how the MCP tool files: kind is agent
 * even if the body says human. `opts.records` skips the devnet read.
 */
export async function checkIn(kv, body, opts = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'invalid json');
  if (typeof body.company === 'string' && body.company.trim()) {
    return fail(400, 'could not take that', { honeypot: true });
  }
  if (containsSecret(body)) return fail(400, 'do not send secrets');
  try {
    if (JSON.stringify(body).length > MAX_BODY) return fail(400, 'too large');
  } catch {
    return fail(400, 'invalid json');
  }

  const now = opts.now ?? Date.now();
  const when = new Date(now).toISOString();
  const date = pacificDay(now);
  const incoming = opts.forceAgent ? { ...body, kind: 'agent' } : body;
  const prepared = await prepare(incoming, when, opts);
  if (!prepared.ok) return prepared;
  if (!kv) return fail(503, 'the front desk ledger is offline');

  const existing = await findSame(kv, date, prepared.kind, prepared.name);
  if (existing) {
    return { ok: true, status: 200, repeat: true, date, visit: publicVisit(existing) };
  }

  const ids = await readIndex(kv, date);
  if (ids.length >= MAX_VISITS) return fail(429, 'the book is full for today');

  const visit = {
    id: newId('fd', 8),
    created_at: when,
    date,
    kind: prepared.kind,
    name: prepared.name,
    operator: prepared.operator,
    purpose: prepared.purpose,
    level: prepared.level,
    claimed: prepared.claimed,
    passportHash: prepared.passportHash,
    checks: prepared.checks,
  };
  visit.stamp = await makeStamp(visit);
  visit.receipt = makeReceipt(visit);
  const next = [visit.id, ...ids].slice(0, MAX_VISITS);
  await kv.put(visitKey(visit.id), JSON.stringify(visit), { expirationTtl: TTL_SEC });
  await kv.put(dayKey(date), JSON.stringify(next), { expirationTtl: TTL_SEC });
  return { ok: true, status: 201, repeat: false, date, visit: publicVisit(visit) };
}

/** Bounded public devnet read. A failure is "unread", not a granted level. */
export async function fetchPassportRecords(doc, fetchImpl = globalThis.fetch) {
  const hash = await sha256Hex(canonicalPassport(doc));
  const records = [];
  let before = '';
  for (let page = 0; page < 3; page += 1) {
    const url = new URL(`${DEVNET}/feed`);
    url.searchParams.set('limit', '40');
    url.searchParams.set('channel', 'BOT');
    if (before) url.searchParams.set('before', before);
    let response;
    try {
      response = await fetchImpl(url, { signal: AbortSignal.timeout(2500) });
    } catch {
      return { records, devnet: 'unread' };
    }
    if (!response?.ok) return { records, devnet: 'unread' };
    const data = await response.json();
    for (const block of data.blocks || []) {
      for (const tx of block.txs || []) {
        const text = tx?.payload?.body || '';
        for (const fields of parsePassportLines(text)) {
          records.push({
            ...classifyPassportLine(doc, fields, hash),
            height: block.height,
            tx: tx.hash,
          });
        }
      }
    }
    if (!data.next_before || data.next_before <= 1) break;
    before = String(data.next_before);
  }
  return { records, devnet: 'read' };
}
