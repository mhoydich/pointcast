/**
 * Guides Intake — bot data collection + intern feedback layer for PointCast
 * Guides. See docs/specs/guides-intake.md. Everything lands pending; a human
 * reviewer (X-Guides-Admin) accepts, asks for changes or declines with written
 * feedback; the submitter follows along with a private receipt.
 *
 * Storage (KV, prefix `gi:`):
 *   gi:item:<id>               the full item (never the raw receipt)
 *   gi:index                   ids, newest first, capped at MAX_INDEX
 *   gi:receipt:<sha256(receipt)>  id
 *   gi:summary                 { id: [status, guide] } for every indexed item
 *   gi:accepted                public view of accepted items, newest first, capped at MAX_PUBLIC
 * Public reads cost two KV gets; the review queue loads at most MAX_QUEUE items.
 */
export const SPEC = 'pointcast.guides-intake/v1';
export const MAX_INDEX = 1000;
export const MAX_PUBLIC = 100;
export const MAX_QUEUE = 100;
export const TITLE_MAX = 120;
export const BODY_MAX = 2000;
export const NOTE_MAX = 1500;
export const DATA_MAX_BYTES = 8000;
export const MAX_SOURCE_URLS = 5;
export const KINDS = ['tip', 'correction', 'resource', 'schedule', 'result', 'dataset', 'assignment-work'];
export const CONTRIBUTOR_KINDS = ['agent', 'intern', 'reader', 'contributor'];
export const STATUSES = ['pending', 'accepted', 'needs-changes', 'declined'];
export const REVIEW_STATUSES = ['accepted', 'needs-changes', 'declined'];
export const AGENT_SOURCE_KINDS = ['correction', 'resource', 'dataset', 'schedule', 'result'];
export const RUBRIC_KEYS = ['useful', 'sourced', 'clear', 'safe'];

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /\+?\d[\d\s().-]{8,}\d/;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Guides-Admin, PointCast-Agent-Id, PointCast-Agent-Timestamp, PointCast-Agent-Signature',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
const fail = (error, status = 400, extra = {}) => json({ ok: false, spec: SPEC, error, ...extra }, status);

class IntakeError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
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

function hasPrivate(text) { return EMAIL.test(text) || PHONE.test(text); }

function cleanUrls(raw) {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length > MAX_SOURCE_URLS) throw new IntakeError('too_many_source_urls');
  const out = [];
  for (const entry of list) {
    let u;
    try { u = new URL(String(entry ?? '').trim()); } catch { throw new IntakeError('source_url_invalid'); }
    if (u.protocol !== 'https:' || u.username || u.password || u.toString().length > 600) throw new IntakeError('source_url_invalid');
    const href = u.toString();
    if (!out.includes(href)) out.push(href);
  }
  return out;
}

function cleanData(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object') throw new IntakeError('data_invalid');
  const text = JSON.stringify(raw);
  if (new TextEncoder().encode(text).length > DATA_MAX_BYTES) throw new IntakeError('data_too_large', 413);
  return JSON.parse(text);
}

function checkText(title, body, data) {
  if (title.length < 4) throw new IntakeError('title_too_short');
  if (body.length < 20) throw new IntakeError('body_too_short');
  if (hasPrivate(`${title}\n${body}\n${data ? JSON.stringify(data) : ''}`)) throw new IntakeError('privacy');
}

function checkAgentRules(contributor, kind, sourceUrls) {
  if (contributor.kind !== 'agent') return;
  if (kind === 'assignment-work') throw new IntakeError('agents_cannot_submit_assignment_work');
  if (AGENT_SOURCE_KINDS.includes(kind) && sourceUrls.length < 1) throw new IntakeError('source_required');
}

function validateContributor(raw, verifiedAgent) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const name = clean(c.name, 60);
  if (!name) throw new IntakeError('contributor_name_required');
  const kind = verifiedAgent ? 'agent' : String(c.kind ?? '');
  if (!CONTRIBUTOR_KINDS.includes(kind)) throw new IntakeError('contributor_kind_invalid');
  if (hasPrivate(`${name} ${clean(c.model, 60)} ${clean(c.operator, 60)}`)) throw new IntakeError('privacy');
  return { name, kind, model: clean(c.model, 60) || null, operator: clean(c.operator, 60) || null, verified: !!verifiedAgent };
}

function cleanRubric(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'object') throw new IntakeError('rubric_invalid');
  const out = {};
  for (const key of RUBRIC_KEYS) {
    const n = Number(raw[key]);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new IntakeError('rubric_invalid');
    out[key] = n;
  }
  return out;
}

function publicItem(item) {
  const { revisions, feedback, ...rest } = item;
  return { ...rest, feedback: feedback.slice(-1) };
}

const itemKey = (id) => `gi:item:${id}`;
const receiptKey = async (receipt) => `gi:receipt:${await sha(receipt)}`;

async function findByReceipt(kv, receipt) {
  const r = clean(receipt, 64);
  if (!r) return null;
  const id = await readJson(kv, await receiptKey(r), null);
  return id ? readJson(kv, itemKey(id), null) : null;
}

/** Keep the compact summary and the public accepted list in step with an item. */
async function touch(kv, item, { isNew = false } = {}) {
  if (isNew) {
    const index = await readJson(kv, 'gi:index', []);
    const next = [item.id, ...index.filter((x) => x !== item.id)];
    const dropped = next.slice(MAX_INDEX);
    await writeJson(kv, 'gi:index', next.slice(0, MAX_INDEX));
    const summary = await readJson(kv, 'gi:summary', {});
    for (const id of dropped) delete summary[id];
    summary[item.id] = [item.status, item.guide];
    await writeJson(kv, 'gi:summary', summary);
  } else {
    const summary = await readJson(kv, 'gi:summary', {});
    if (summary[item.id]) { summary[item.id] = [item.status, item.guide]; await writeJson(kv, 'gi:summary', summary); }
  }
  const accepted = await readJson(kv, 'gi:accepted', []);
  const rest = accepted.filter((x) => x.id !== item.id);
  const next = item.status === 'accepted' ? [publicItem(item), ...rest].slice(0, MAX_PUBLIC) : rest;
  if (next.length !== accepted.length || item.status === 'accepted') await writeJson(kv, 'gi:accepted', next);
}

function isAdmin(request, adminKey) {
  return !!adminKey && safeEqual(request.headers.get('X-Guides-Admin') ?? '', adminKey);
}

export async function handleGuidesIntake(request, { kv = null, clock = () => new Date(), limit = async () => true, verifiedAgent = null, adminKey = '', guides = [], assignments = [] } = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  const url = new URL(request.url);
  try {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const receipt = url.searchParams.get('receipt');
      if (receipt !== null) {
        const item = await findByReceipt(kv, receipt);
        return item ? json({ ok: true, spec: SPEC, item }) : fail('receipt_not_found', 404);
      }
      if (url.searchParams.get('queue')) {
        if (!isAdmin(request, adminKey)) return fail('admin_required', 401);
        const summary = await readJson(kv, 'gi:summary', {});
        const ids = (await readJson(kv, 'gi:index', [])).filter((id) => ['pending', 'needs-changes'].includes(summary[id]?.[0])).slice(0, MAX_QUEUE);
        const items = (await Promise.all(ids.map((id) => readJson(kv, itemKey(id), null)))).filter(Boolean).reverse();
        return json({ ok: true, spec: SPEC, items });
      }
      const guide = clean(url.searchParams.get('guide'), 80);
      const summary = await readJson(kv, 'gi:summary', {});
      const counts = { pending: 0, accepted: 0, needsChanges: 0, declined: 0, byGuide: {} };
      for (const [status, g] of Object.values(summary)) {
        if (status === 'pending') counts.pending += 1;
        else if (status === 'accepted') counts.accepted += 1;
        else if (status === 'needs-changes') counts.needsChanges += 1;
        else if (status === 'declined') counts.declined += 1;
        const row = (counts.byGuide[g] ??= { accepted: 0, pending: 0 });
        if (status === 'accepted') row.accepted += 1;
        else if (status === 'pending') row.pending += 1;
      }
      const accepted = (await readJson(kv, 'gi:accepted', [])).filter((i) => !guide || i.guide === guide);
      return json({ ok: true, spec: SPEC, kvBound: !!kv, counts, accepted });
    }

    if (request.method !== 'POST') return fail('method_not_allowed', 405);
    if (!kv) return fail('store_unbound', 503);
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 24_576) return fail('body_too_large', 413);
    let body;
    try { body = JSON.parse((await request.text()).slice(0, 24_576)); } catch { return fail('json_invalid'); }
    if (!body || typeof body !== 'object') return fail('json_invalid');
    const action = String(body.action ?? 'submit');
    const now = clock().toISOString();

    if (action === 'submit') {
      if (!await limit('guides-intake:submit')) return fail('rate_limited', 429);
      const guide = String(body.guide ?? '');
      if (guide !== 'network' && !guides.includes(guide)) throw new IntakeError('guide_unknown');
      const assignment = body.assignment === undefined || body.assignment === null || body.assignment === '' ? null : String(body.assignment);
      if (assignment !== null && !assignments.includes(assignment)) throw new IntakeError('assignment_unknown');
      const kind = String(body.kind ?? '');
      if (!KINDS.includes(kind)) throw new IntakeError('kind_invalid');
      const consent = body.consent;
      if (!consent || consent.noPrivateInfo !== true || consent.humanReview !== true) throw new IntakeError('consent_required');
      const contributor = validateContributor(body.contributor, verifiedAgent);
      const title = clean(body.title, TITLE_MAX);
      const text = clean(body.body, BODY_MAX);
      const sourceUrls = cleanUrls(body.sourceUrls);
      const data = cleanData(body.data);
      checkText(title, text, data);
      checkAgentRules(contributor, kind, sourceUrls);

      const id = `gi_${randomId(5)}`;
      const receipt = randomId(12);
      const item = { id, spec: SPEC, guide, assignment, kind, title, body: text, sourceUrls, data, contributor, status: 'pending', feedback: [], revisions: 0, createdAt: now, updatedAt: now };
      await writeJson(kv, itemKey(id), item);
      await writeJson(kv, await receiptKey(receipt), id);
      await touch(kv, item, { isNew: true });
      return json({ ok: true, spec: SPEC, id, receipt, status: 'pending', check: `/api/guides/intake?receipt=${receipt}` }, 201);
    }

    if (action === 'revise') {
      if (!await limit('guides-intake:revise')) return fail('rate_limited', 429);
      const item = await findByReceipt(kv, body.receipt);
      if (!item) return fail('receipt_not_found', 404);
      if (item.status !== 'needs-changes') return fail('not_revisable', 409);
      const next = { ...item };
      if (body.title !== undefined) next.title = clean(body.title, TITLE_MAX);
      if (body.body !== undefined) next.body = clean(body.body, BODY_MAX);
      if (body.sourceUrls !== undefined) next.sourceUrls = cleanUrls(body.sourceUrls);
      if (body.data !== undefined) next.data = cleanData(body.data);
      checkText(next.title, next.body, next.data);
      checkAgentRules(next.contributor, next.kind, next.sourceUrls);
      next.status = 'pending';
      next.revisions = item.revisions + 1;
      next.updatedAt = now;
      await writeJson(kv, itemKey(item.id), next);
      await touch(kv, next);
      return json({ ok: true, spec: SPEC, id: next.id, status: next.status, revisions: next.revisions });
    }

    if (action === 'review') {
      if (!isAdmin(request, adminKey)) return fail('admin_required', 401);
      const item = await readJson(kv, itemKey(String(body.id ?? '')), null);
      if (!item) return fail('item_not_found', 404);
      const status = String(body.status ?? '');
      if (!REVIEW_STATUSES.includes(status)) throw new IntakeError('status_invalid');
      const note = clean(body.note, NOTE_MAX);
      if (note.length < 10) throw new IntakeError('note_required');
      const rubric = cleanRubric(body.rubric);
      item.feedback.push({ at: now, status, note, rubric });
      item.status = status;
      item.updatedAt = now;
      await writeJson(kv, itemKey(item.id), item);
      await touch(kv, item);
      return json({ ok: true, spec: SPEC, item });
    }

    return fail('action_unknown');
  } catch (error) {
    if (error instanceof IntakeError) return fail(error.message, error.status);
    return fail('intake_unavailable', 500);
  }
}
