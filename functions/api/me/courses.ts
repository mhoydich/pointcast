import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { UES_SEASON_ONE_COURSES } from '../../../src/lib/ues-classes.ts';
import { normalizeProgress } from '../../../src/lib/ues-progress.mjs';

export interface CourseProfileEnv extends AuthEnv { UES_COURSE_PROFILE_ENABLED?: string; }
interface GenerationRow { generation: string; }
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
      const courses = code === null
        ? env.AUTH_DB.prepare('SELECT course_code, progress, revision, saved_at FROM ues_course_progress WHERE user_id = ? ORDER BY course_code').bind(userId)
        : env.AUTH_DB.prepare('SELECT course_code, progress, revision, saved_at FROM ues_course_progress WHERE user_id = ? AND course_code = ?').bind(userId, code);
      // One transaction binds the displayed courses (including an empty view)
      // to a durable account generation. A read never resets that generation.
      const result = await env.AUTH_DB.batch([
        env.AUTH_DB.prepare('INSERT INTO ues_course_profile_revisions (user_id, generation) VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING').bind(userId, crypto.randomUUID()),
        env.AUTH_DB.prepare('SELECT generation FROM ues_course_profile_revisions WHERE user_id = ?').bind(userId),
        courses,
      ]);
      const generation = (result[1].results[0] as GenerationRow | undefined)?.generation;
      if (generation === null || !revision(generation)) throw new Error('invalid-profile-generation');
      return authJson({ ok: true, ...account, generation, courses: (result[2].results as CourseRow[]).map(project) });
    }
    if (request.headers.get('X-PointCast-User') !== userId) return fail('account-changed', 409);
    const input = await body(request);
    if (input instanceof Response) return input;
    const remove = request.method === 'DELETE';
    if (!exact(input, remove ? ['courseCode', 'expectedRevision', 'expectedGeneration'] : ['courseCode', 'expectedRevision', 'expectedGeneration', 'consent', 'progress'])
      || typeof input.courseCode !== 'string' || !catalog.has(input.courseCode)
      || !revision(input.expectedRevision) || (remove && input.expectedRevision === null)
      || input.expectedGeneration === null || !revision(input.expectedGeneration)) return fail('invalid-payload', 400);
    const courseCode = input.courseCode;
    if (!remove && (input.consent !== true || !validProgress(input.progress, courseCode))) return fail('invalid-payload', 400);
    const nextGeneration = crypto.randomUUID();
    const nextRevision = crypto.randomUUID();
    const savedAt = new Date().toISOString();
    const payload = remove ? null : JSON.stringify(normalizeProgress(input.progress, courseCode));
    const matchingCourse = input.expectedRevision === null
      ? 'NOT EXISTS (SELECT 1 FROM ues_course_progress WHERE user_id = ? AND course_code = ?)'
      : 'EXISTS (SELECT 1 FROM ues_course_progress WHERE user_id = ? AND course_code = ? AND revision = ?)';
    const guard = env.AUTH_DB.prepare(`UPDATE ues_course_profile_revisions SET generation = ?
      WHERE user_id = ? AND generation = ? AND ${matchingCourse}`)
      .bind(nextGeneration, userId, input.expectedGeneration, userId, courseCode,
        ...(input.expectedRevision === null ? [] : [input.expectedRevision]));
    const generationMatches = 'EXISTS (SELECT 1 FROM ues_course_profile_revisions WHERE user_id = ? AND generation = ?)';
    const change = remove
      ? env.AUTH_DB.prepare(`DELETE FROM ues_course_progress WHERE user_id = ? AND course_code = ? AND revision = ? AND ${generationMatches}`)
        .bind(userId, courseCode, input.expectedRevision, userId, nextGeneration)
      : input.expectedRevision === null
        ? env.AUTH_DB.prepare(`INSERT INTO ues_course_progress (user_id, course_code, progress, revision, saved_at)
            SELECT ?, ?, ?, ?, ? WHERE ${generationMatches} ON CONFLICT(user_id, course_code) DO NOTHING`)
          .bind(userId, courseCode, payload, nextRevision, savedAt, userId, nextGeneration)
        : env.AUTH_DB.prepare(`UPDATE ues_course_progress SET progress = ?, revision = ?, saved_at = ?
            WHERE user_id = ? AND course_code = ? AND revision = ? AND ${generationMatches}`)
          .bind(payload, nextRevision, savedAt, userId, courseCode, input.expectedRevision, userId, nextGeneration);
    // D1.batch is one transaction: generation advancement and the course change
    // succeed together. A stale empty-view save cannot survive save -> delete,
    // since deletion preserves the new account generation without course data.
    const result = await env.AUTH_DB.batch([guard, change]);
    if (result[0].meta.changes !== 1 || result[1].meta.changes !== 1) return fail('revision-conflict', 409);
    return remove
      ? authJson({ ok: true, ...account, generation: nextGeneration, removed: courseCode })
      : authJson({ ok: true, ...account, generation: nextGeneration, course: project({
        course_code: courseCode, progress: payload!, revision: nextRevision, saved_at: savedAt,
      }) });
  } catch { return unavailable(); }
}

export const onRequestGet: PagesFunction<CourseProfileEnv> = ({ request, env }) => handle(request, env);
export const onRequestPut: PagesFunction<CourseProfileEnv> = ({ request, env }) => handle(request, env);
export const onRequestDelete: PagesFunction<CourseProfileEnv> = ({ request, env }) => handle(request, env);
