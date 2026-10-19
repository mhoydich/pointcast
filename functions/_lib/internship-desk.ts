import { readSessionFromRequest, type AuthEnv } from '../api/auth/session.ts';
import { hasDirectorDeskAccess } from '../../src/lib/director-access.ts';

export type InternshipDeskEnv = Pick<AuthEnv, 'AUTH_DB'>;
type Kind = 'human' | 'bot';
type TaskStatus = 'todo' | 'doing' | 'ready';
type Status = 'draft' | 'interest_received' | 'review_requested' | 'changes_requested' | 'reviewed';
type Decision = 'changes_requested' | 'reviewed';
interface Payload {
  label: string;
  goal: string;
  botName: string;
  onboarding: boolean[];
  tasks: { understand: TaskStatus; make: TaskStatus; test: TaskStatus };
  evidence: string;
}
interface Review {
  decision: Decision;
  note: string;
  reviewerId: string;
  reviewedAt: string;
  submittedVersion: number;
}
interface Row {
  record_id: string;
  owner_id: string;
  kind: Kind;
  payload_json: string;
  version: number;
  status: Status;
  interest_at: number | null;
  updated_at: number;
  expires_at: number;
  submitted_version: number | null;
  submitted_payload_json: string | null;
  review_json: string | null;
}
type OwnerAction = { action: 'save' | 'interest' | 'request_review' | 'delete'; kind: Kind; recordId: string | null; version: number; payload?: Payload };
type DirectorAction = { ownerId: string; kind: Kind; recordId: string; version: number; decision: Decision; note: string };
type Cursor = { t: number; o: string; k: Kind };

const MAX_BYTES = 8 * 1024;
const HOUR = 3_600_000;
const RETENTION = 90 * 24 * HOUR;
const PAGE_SIZE = 50;
const FIELDS = 'record_id, owner_id, kind, payload_json, version, status, interest_at, updated_at, expires_at, submitted_version, submitted_payload_json, review_json';
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
};

class DeskError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
}
function unavailable(): Response {
  return json({ ok: false, error: 'desk-unavailable', message: 'The private desk is not ready. Nothing is confirmed saved; refresh before retrying.' }, 503, { 'Retry-After': '60' });
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DeskError('invalid-body');
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, expected: string[]) {
  if (Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) throw new DeskError('unknown-or-missing-field');
}
function kind(value: unknown): Kind {
  if (value !== 'human' && value !== 'bot') throw new DeskError('invalid-kind');
  return value;
}
function version(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value >= Number.MAX_SAFE_INTEGER) throw new DeskError('invalid-version');
  return value;
}
function userId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/u.test(value)) throw new DeskError('invalid-owner');
  return value;
}
function recordId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) throw new DeskError('invalid-record-id');
  return value;
}
function text(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string' || value.length > max || value.trim().length < min || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) throw new DeskError('invalid-text');
  const trimmed = value.trim();
  // These fields contain project descriptions, never contact or link fields.
  // This rejects common accidental URLs/emails/phone numbers; it cannot infer
  // every kind of sensitive information, so the UI also asks users to omit it.
  if (/\b(?:https?|mailto|tel|data|javascript):|\b[a-z][a-z\d+.-]*:\/\/|\bwww\.|\b[^\s@]+@[^\s@]+\.[^\s@]+/iu.test(trimmed)) throw new DeskError('no-links-or-contact-details');
  for (const match of trimmed.matchAll(/\+?\d[\d(). -]{7,}\d/gu)) {
    if (match[0].replace(/\D/gu, '').length >= 10) throw new DeskError('no-links-or-contact-details');
  }
  return trimmed;
}
function parsePayload(value: unknown, recordKind: Kind): Payload {
  const body = object(value);
  exactKeys(body, ['label', 'goal', 'botName', 'onboarding', 'tasks', 'evidence']);
  const tasks = object(body.tasks);
  exactKeys(tasks, ['understand', 'make', 'test']);
  const task = (value: unknown): TaskStatus => {
    if (value !== 'todo' && value !== 'doing' && value !== 'ready') throw new DeskError('invalid-task-status');
    return value;
  };
  if (!Array.isArray(body.onboarding) || body.onboarding.length !== 3 || !body.onboarding.every(item => typeof item === 'boolean')) throw new DeskError('invalid-onboarding');
  const botName = text(body.botName, recordKind === 'bot' ? 1 : 0, 80);
  if (recordKind === 'human' && botName !== '') throw new DeskError('human-record-has-bot-name');
  return {
    label: text(body.label, 3, 80), goal: text(body.goal, 10, 500), botName,
    onboarding: [...body.onboarding],
    tasks: { understand: task(tasks.understand), make: task(tasks.make), test: task(tasks.test) },
    evidence: text(body.evidence, 0, 2000),
  };
}
function parseOwner(value: unknown): OwnerAction {
  const body = object(value);
  if (!['save', 'interest', 'request_review', 'delete'].includes(String(body.action))) throw new DeskError('invalid-action');
  exactKeys(body, body.action === 'save' ? ['action', 'kind', 'recordId', 'version', 'payload'] : ['action', 'kind', 'recordId', 'version']);
  const recordKind = kind(body.kind);
  const recordVersion = version(body.version);
  const id = body.action === 'save' && recordVersion === 0 && body.recordId === null ? null : recordId(body.recordId);
  if (recordVersion === 0 && id !== null) throw new DeskError('invalid-record-id');
  return { action: body.action as OwnerAction['action'], kind: recordKind, recordId: id, version: recordVersion, ...(body.action === 'save' ? { payload: parsePayload(body.payload, recordKind) } : {}) };
}
function parseDirector(value: unknown): DirectorAction {
  const body = object(value);
  exactKeys(body, ['ownerId', 'kind', 'recordId', 'version', 'decision', 'note']);
  if (body.decision !== 'changes_requested' && body.decision !== 'reviewed') throw new DeskError('invalid-review-decision');
  return { ownerId: userId(body.ownerId), kind: kind(body.kind), recordId: recordId(body.recordId), version: version(body.version), decision: body.decision, note: text(body.note, 10, 1000) };
}

async function readJson(request: Request): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/iu.test(request.headers.get('Content-Type') ?? '')) throw new DeskError('json-required', 415);
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_BYTES) throw new DeskError('body-too-large', 413);
  if (!request.body) throw new DeskError('invalid-json');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new DeskError('body-too-large', 413); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)); }
  catch { throw new DeskError('invalid-json'); }
}

function publicRecord(row: Row) {
  return {
    recordId: row.record_id, ownerId: row.owner_id, kind: row.kind, ...parsePayload(JSON.parse(row.payload_json), row.kind),
    version: row.version, status: row.status, submittedVersion: row.submitted_version,
    interestAt: row.interest_at === null ? null : new Date(row.interest_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString(),
    review: row.review_json === null ? null : JSON.parse(row.review_json) as Review,
  };
}

async function purge(db: D1Database, actor: string, now: number): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM internship_desk_records WHERE owner_id = ? AND expires_at <= ?').bind(actor, now),
    db.prepare('DELETE FROM internship_desk_records WHERE rowid IN (SELECT rowid FROM internship_desk_records WHERE expires_at <= ? ORDER BY expires_at LIMIT 50)').bind(now),
    db.prepare('DELETE FROM internship_desk_write_rates WHERE rowid IN (SELECT rowid FROM internship_desk_write_rates WHERE window_start < ? ORDER BY window_start LIMIT 100)').bind(Math.floor(now / HOUR) * HOUR),
  ]);
}
async function consumeWrite(db: D1Database, actor: string, now: number): Promise<Response | null> {
  const window = Math.floor(now / HOUR) * HOUR;
  const row = await db.prepare(`
    INSERT INTO internship_desk_write_rates (actor_id, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(actor_id, window_start) DO UPDATE SET count = count + 1
    WHERE count < 60 RETURNING count
  `).bind(actor, window).first<{ count: number }>();
  if (row) return null;
  const retryAfter = Math.max(1, Math.ceil((window + HOUR - now) / 1000));
  return json({ ok: false, error: 'write-rate-limit', retryAfter }, 429, { 'Retry-After': String(retryAfter) });
}
async function ownerRows(db: D1Database, owner: string, now: number): Promise<Row[]> {
  const result = await db.prepare(`SELECT ${FIELDS} FROM internship_desk_records WHERE owner_id = ? AND expires_at > ? ORDER BY kind LIMIT 2`).bind(owner, now).all<Row>();
  return result.results;
}
async function rowFor(db: D1Database, owner: string, recordKind: Kind, now: number): Promise<Row | null> {
  return db.prepare(`SELECT ${FIELDS} FROM internship_desk_records WHERE owner_id = ? AND kind = ? AND expires_at > ?`).bind(owner, recordKind, now).first<Row>();
}
function conflict(): never { throw new DeskError('version-conflict', 409); }

async function ownerWrite(db: D1Database, actor: string, action: OwnerAction, now: number): Promise<void> {
  const current = await rowFor(db, actor, action.kind, now);
  if ((!current && action.version !== 0) || (current && (current.version !== action.version || current.record_id !== action.recordId))) conflict();
  if (action.action === 'save' && !current) {
    const row = await db.prepare(`
      INSERT INTO internship_desk_records (record_id, owner_id, kind, payload_json, version, status, interest_at, updated_at, expires_at)
      VALUES (?, ?, ?, ?, 1, 'draft', NULL, ?, ?) ON CONFLICT(owner_id, kind) DO NOTHING RETURNING version
    `).bind(crypto.randomUUID(), actor, action.kind, JSON.stringify(action.payload), now, now + RETENTION).first();
    if (!row) conflict();
    return;
  }
  if (!current) conflict();
  if (action.action === 'delete') {
    const deleted = await db.prepare('DELETE FROM internship_desk_records WHERE owner_id = ? AND kind = ? AND record_id = ? AND version = ? AND expires_at > ? RETURNING version').bind(actor, action.kind, action.recordId, action.version, now).first();
    if (!deleted) conflict();
    return;
  }
  const stored = parsePayload(JSON.parse(current.payload_json), current.kind);
  let payload = current.payload_json;
  let status = current.status;
  let interestAt = current.interest_at;
  let submittedVersion = current.submitted_version;
  let submittedPayload = current.submitted_payload_json;
  let review = current.review_json;
  if (action.action === 'save') {
    payload = JSON.stringify(action.payload);
    if (payload !== current.payload_json) {
      status = interestAt === null ? 'draft' : 'interest_received';
      submittedVersion = null; submittedPayload = null; review = null;
    }
  } else {
    if (!stored.onboarding.every(Boolean)) throw new DeskError('incomplete-onboarding', 409);
    if (action.action === 'interest') {
      if (interestAt !== null || current.status !== 'draft') throw new DeskError('invalid-transition', 409);
      interestAt = now; status = 'interest_received';
    } else {
      if (interestAt === null || !['interest_received', 'changes_requested'].includes(current.status)) throw new DeskError('invalid-transition', 409);
      if (!Object.values(stored.tasks).every(value => value === 'ready') || stored.evidence.length < 30) throw new DeskError('incomplete-submission', 409);
      status = 'review_requested'; submittedVersion = action.version + 1;
      submittedPayload = current.payload_json; review = null;
    }
  }
  const saved = await db.prepare(`
    UPDATE internship_desk_records SET payload_json = ?, version = version + 1, status = ?, interest_at = ?, updated_at = ?, expires_at = ?, submitted_version = ?, submitted_payload_json = ?, review_json = ?
    WHERE owner_id = ? AND kind = ? AND record_id = ? AND version = ? AND expires_at > ? RETURNING version
  `).bind(payload, status, interestAt, now, now + RETENTION, submittedVersion, submittedPayload, review, actor, action.kind, action.recordId, action.version, now).first();
  if (!saved) conflict();
}

function parseCursor(value: string | null): Cursor | null {
  if (value === null) return null;
  if (!/^[A-Za-z0-9_-]{1,512}$/u.test(value)) throw new DeskError('invalid-cursor');
  try {
    const decoded = object(JSON.parse(atob(value.replace(/-/gu, '+').replace(/_/gu, '/'))));
    exactKeys(decoded, ['t', 'o', 'k']);
    if (typeof decoded.t !== 'number' || !Number.isSafeInteger(decoded.t) || decoded.t < 0) throw new Error();
    return { t: decoded.t, o: userId(decoded.o), k: kind(decoded.k) };
  } catch { throw new DeskError('invalid-cursor'); }
}
function cursorFor(row: Row): string {
  return btoa(JSON.stringify({ t: row.updated_at, o: row.owner_id, k: row.kind })).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/gu, '');
}
async function directorRows(db: D1Database, cursor: Cursor | null, now: number) {
  const query = cursor
    ? db.prepare(`SELECT ${FIELDS} FROM internship_desk_records WHERE interest_at IS NOT NULL AND expires_at > ? AND (updated_at < ? OR (updated_at = ? AND (owner_id > ? OR (owner_id = ? AND kind > ?)))) ORDER BY updated_at DESC, owner_id, kind LIMIT ?`).bind(now, cursor.t, cursor.t, cursor.o, cursor.o, cursor.k, PAGE_SIZE + 1)
    : db.prepare(`SELECT ${FIELDS} FROM internship_desk_records WHERE interest_at IS NOT NULL AND expires_at > ? ORDER BY updated_at DESC, owner_id, kind LIMIT ?`).bind(now, PAGE_SIZE + 1);
  const result = await query.all<Row>();
  const rows = result.results.slice(0, PAGE_SIZE);
  return { records: rows.map(publicRecord), nextCursor: result.results.length > PAGE_SIZE ? cursorFor(rows[rows.length - 1]) : null };
}
async function directorWrite(db: D1Database, actor: string, action: DirectorAction, now: number): Promise<Row> {
  if (action.ownerId === actor) throw new DeskError('cannot-review-own-record', 403);
  const row = await rowFor(db, action.ownerId, action.kind, now);
  if (!row || row.version !== action.version || row.record_id !== action.recordId) conflict();
  if (row.status !== 'review_requested' || row.submitted_version === null || row.submitted_payload_json !== row.payload_json) throw new DeskError('invalid-transition', 409);
  const review: Review = { decision: action.decision, note: action.note, reviewerId: actor, reviewedAt: new Date(now).toISOString(), submittedVersion: row.submitted_version };
  const updated = await db.prepare(`
    UPDATE internship_desk_records SET status = ?, review_json = ?, version = version + 1, updated_at = ?
    WHERE owner_id = ? AND kind = ? AND record_id = ? AND version = ? AND expires_at > ? AND status = 'review_requested' AND submitted_version = ? AND submitted_payload_json = payload_json
    RETURNING ${FIELDS}
  `).bind(action.decision, JSON.stringify(review), now, action.ownerId, action.kind, action.recordId, action.version, now, row.submitted_version).first<Row>();
  if (!updated) conflict();
  return updated;
}

/** Private, session-only desk. No bot credential, execution or deployment path. */
export async function handleInternshipDesk(request: Request, env: InternshipDeskEnv, director = false, now = Date.now()): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method)) return json({ ok: false, error: 'method-not-allowed' }, 405, { Allow: 'GET, POST' });
  if (!env.AUTH_DB) return unavailable();
  try {
    const session = await readSessionFromRequest(request, env);
    if (!session) return json({ ok: false, error: 'unauthorized' }, 401);
    const actor = session.user.userId;
    if (director && !hasDirectorDeskAccess(session)) return json({ ok: false, error: 'director-only' }, 403);
    const url = new URL(request.url);
    if ((!director || request.method === 'POST') && url.search) throw new DeskError('query-not-supported');
    if (director && request.method === 'GET' && ([...url.searchParams.keys()].some(key => key !== 'cursor') || url.searchParams.getAll('cursor').length > 1)) throw new DeskError('invalid-query');
    if (request.method === 'GET') {
      const cursor = director ? parseCursor(url.searchParams.get('cursor')) : null;
      await purge(env.AUTH_DB, actor, now);
      return director
        ? json({ ok: true, userId: actor, ...await directorRows(env.AUTH_DB, cursor, now) })
        : json({ ok: true, userId: actor, records: (await ownerRows(env.AUTH_DB, actor, now)).map(publicRecord) });
    }
    if (request.headers.get('Origin') !== url.origin) return json({ ok: false, error: 'origin-mismatch' }, 403);
    if (request.headers.get('X-PointCast-User') !== actor) return json({ ok: false, error: 'account-mismatch' }, 403);
    const body = await readJson(request);
    // Parse before cleanup/counter writes. A rejected body never becomes data.
    const parsed = director ? parseDirector(body) : parseOwner(body);
    await purge(env.AUTH_DB, actor, now);
    const limited = await consumeWrite(env.AUTH_DB, actor, now);
    if (limited) return limited;
    if (director) {
      const record = await directorWrite(env.AUTH_DB, actor, parsed as DirectorAction, now);
      return json({ ok: true, userId: actor, records: [publicRecord(record)] });
    }
    await ownerWrite(env.AUTH_DB, actor, parsed as OwnerAction, now);
    return json({ ok: true, userId: actor, records: (await ownerRows(env.AUTH_DB, actor, now)).map(publicRecord) });
  } catch (error) {
    if (error instanceof DeskError) return json({ ok: false, error: error.message }, error.status);
    return unavailable();
  }
}
