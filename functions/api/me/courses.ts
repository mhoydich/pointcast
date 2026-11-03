import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { UES_SEASON_ONE_COURSES } from '../../../src/lib/ues-classes.ts';
import { normalizeProgress } from '../../../src/lib/ues-progress.mjs';

export interface CourseProfileEnv extends AuthEnv { UES_COURSE_PROFILE_ENABLED?: string; }
interface CourseRow { course_code: string; progress: string; revision: string; saved_at: string; }
const catalog = new Map(UES_SEASON_ONE_COURSES.map(course => [course.code as string, course]));
const MAX_BODY_BYTES = 2048;
const fail = (reason: string, status: number) => authJson({ ok: false, reason }, { status });
const unavailable = () => fail('course-profile-unavailable', 503);
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const revision = (value: unknown) => value === null || (typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value));

// The profile accepts the local six-field checklist only, never arbitrary notes,
// identity, artifacts, caller claims about verification, or unknown catalog codes.
function validProgress(value: unknown, code: string): boolean {
  if (!record(value) || !exact(value, ['v', 'courseCode', 'startedAt', 'completedWeeks', 'finalOutcome', 'completedAt'])) return false;
  if (value.v !== 1 || value.courseCode !== code || typeof value.finalOutcome !== 'boolean') return false;
  if (!Array.isArray(value.completedWeeks) || value.completedWeeks.length > 6
    || value.completedWeeks.some(week => !Number.isInteger(week) || week < 1 || week > 6)
    || new Set(value.completedWeeks).size !== value.completedWeeks.length) return false;
  for (const key of ['startedAt', 'completedAt']) {
    const date = value[key];
    if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date)
      || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString() !== date || Date.parse(date) > Date.now() + 60_000)) return false;
  }
  if ((value.completedWeeks.length || value.finalOutcome) && value.startedAt === null) return false;
  const complete = value.completedWeeks.length >= 4 && value.finalOutcome;
  if (complete !== (value.completedAt !== null)) return false;
  return value.completedAt === null || (value.startedAt !== null && String(value.completedAt) >= String(value.startedAt));
}

function project(row: CourseRow) {
  const course = catalog.get(row.course_code);
  const progress: unknown = JSON.parse(row.progress);
  if (!course || !validProgress(progress, course.code) || !revision(row.revision) || row.revision === null) throw new Error('invalid-course-row');
  return {
    courseCode: course.code, title: course.title, path: course.path,
    progress: normalizeProgress(progress, course.code), revision: row.revision, savedAt: row.saved_at,
    attestation: 'self-attested', visibility: 'private',
  };
}

async function body(request: Request): Promise<Record<string, unknown> | Response> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return fail('json-required', 415);
  const reader = request.body?.getReader();
  const bytes = new Uint8Array(MAX_BODY_BYTES);
  let size = 0;
  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (size + chunk.value.byteLength > MAX_BODY_BYTES) { await reader.cancel(); return fail('body-too-large', 413); }
      bytes.set(chunk.value, size); size += chunk.value.byteLength;
    }
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, size)));
    return record(parsed) ? parsed : fail('bad-body', 400);
  } catch { return fail('bad-body', 400); }
}

async function handle(request: Request, env: CourseProfileEnv): Promise<Response> {
  const url = new URL(request.url);
  const mutating = request.method !== 'GET';
  const origin = request.headers.get('origin');
  if ((mutating && origin !== url.origin) || (origin && origin !== url.origin)
    || request.headers.get('sec-fetch-site') === 'cross-site') return fail('origin-not-allowed', 403);
  if (env.UES_COURSE_PROFILE_ENABLED !== '1' || !env.AUTH_DB) return unavailable();
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return fail('unauthorized', 401);
    const userId = current.user.userId;
    const account = { userId, displayName: current.user.preferredName || 'PointCast member' };
    const code = url.searchParams.get('courseCode');
    if (code !== null && !catalog.has(code)) return fail('unknown-course', 400);
    if (!mutating) {
      const rows = code === null
        ? await env.AUTH_DB.prepare('SELECT course_code, progress, revision, saved_at FROM ues_course_progress WHERE user_id = ? ORDER BY course_code').bind(userId).all<CourseRow>()
        : await env.AUTH_DB.prepare('SELECT course_code, progress, revision, saved_at FROM ues_course_progress WHERE user_id = ? AND course_code = ?').bind(userId, code).all<CourseRow>();
      return authJson({ ok: true, ...account, courses: rows.results.map(project) });
    }
    if (request.headers.get('X-PointCast-User') !== userId) return fail('account-changed', 409);
    const input = await body(request);
    if (input instanceof Response) return input;
    const remove = request.method === 'DELETE';
    if (!exact(input, remove ? ['courseCode', 'expectedRevision'] : ['courseCode', 'expectedRevision', 'consent', 'progress'])
      || typeof input.courseCode !== 'string' || !catalog.has(input.courseCode)
      || !revision(input.expectedRevision) || (remove && input.expectedRevision === null)) return fail('invalid-payload', 400);
    const courseCode = input.courseCode;
    if (!remove && (input.consent !== true || !validProgress(input.progress, courseCode))) return fail('invalid-payload', 400);
    // Opaque revisions prevent stale updates/deletes, including delete/re-create.
    // One statement changes one course; generic /me/state never touches this table.
    if (remove) {
      const result = await env.AUTH_DB.prepare('DELETE FROM ues_course_progress WHERE user_id = ? AND course_code = ? AND revision = ?')
        .bind(userId, courseCode, input.expectedRevision).run();
      return result.meta.changes ? authJson({ ok: true, ...account, removed: courseCode }) : fail('revision-conflict', 409);
    }
    const payload = JSON.stringify(normalizeProgress(input.progress, courseCode));
    const nextRevision = crypto.randomUUID();
    const savedAt = new Date().toISOString();
    const row = input.expectedRevision === null
      ? await env.AUTH_DB.prepare(`INSERT INTO ues_course_progress (user_id, course_code, progress, revision, saved_at)
          VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, course_code) DO NOTHING RETURNING course_code, progress, revision, saved_at`)
        .bind(userId, courseCode, payload, nextRevision, savedAt).first<CourseRow>()
      : await env.AUTH_DB.prepare(`UPDATE ues_course_progress SET progress = ?, revision = ?, saved_at = ?
          WHERE user_id = ? AND course_code = ? AND revision = ? RETURNING course_code, progress, revision, saved_at`)
        .bind(payload, nextRevision, savedAt, userId, courseCode, input.expectedRevision).first<CourseRow>();
    return row ? authJson({ ok: true, ...account, course: project(row) }) : fail('revision-conflict', 409);
  } catch { return unavailable(); }
}

export const onRequestGet: PagesFunction<CourseProfileEnv> = ({ request, env }) => handle(request, env);
export const onRequestPut: PagesFunction<CourseProfileEnv> = ({ request, env }) => handle(request, env);
export const onRequestDelete: PagesFunction<CourseProfileEnv> = ({ request, env }) => handle(request, env);
