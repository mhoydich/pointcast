import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { GENTLE_INVITATION } from '../../_lib/ai-companions.ts';
import {
  RUNTIME_JOB_MS, RUNTIME_ONLINE_MS, RuntimeInputError, expireRuntimeJobs, hashRuntimeSecret, iso,
  jobView, nativeProvider, normalizeProviders, runtimeBody, runtimeFailure, runtimeSecret, runtimeView,
  validModel, type RuntimeJob, type RuntimeRow,
} from '../../_lib/ai-runtimes.ts';

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB) return runtimeFailure('ai-runtimes-unavailable', 503);
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return runtimeFailure('unauthorized', 401);
    const userId = current.user.userId;
    await expireRuntimeJobs(env.AUTH_DB, userId);
    const runtimes = await env.AUTH_DB.prepare('SELECT * FROM ai_runtimes WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId).all<RuntimeRow>();
    const jobs = await env.AUTH_DB.prepare('SELECT * FROM ai_runtime_jobs WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20')
      .bind(userId).all<RuntimeJob>();
    return authJson({ ok: true, runtimes: runtimes.results.map((row) => runtimeView(row)), jobs: jobs.results.map(jobView) });
  } catch { return runtimeFailure('ai-runtimes-unavailable', 503); }
};

async function write(request: Request, env: AuthEnv, remove: boolean) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return runtimeFailure('origin-not-allowed', 403);
  if (!env.AUTH_DB) return runtimeFailure('ai-runtimes-unavailable', 503);
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return runtimeFailure('unauthorized', 401);
    const body = await runtimeBody(request, 24_576);
    const db = env.AUTH_DB;
    const userId = current.user.userId;
    const now = Date.now();
    await expireRuntimeJobs(db, userId, now);
    if (remove) {
      if (typeof body.runtimeId !== 'string') return runtimeFailure('invalid-runtime');
      // FK cascade also removes prompts/results. Revocation is enforced by every
      // claim and completion query, including in-flight requests.
      await db.prepare('DELETE FROM ai_runtimes WHERE id = ? AND user_id = ?').bind(body.runtimeId, userId).run();
      return authJson({ ok: true });
    }
    if (body.operation === 'invite') {
      if (typeof body.label !== 'string' || !body.label.trim() || body.label.length > 80) return runtimeFailure('invalid-label');
      const id = crypto.randomUUID();
      const code = runtimeSecret();
      const expires = now + RUNTIME_JOB_MS;
      const row = await db.prepare(`INSERT INTO ai_runtimes (id,user_id,label,pair_hash,pair_expires_at,created_at)
        SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM ai_runtimes WHERE user_id = ?) < 5 RETURNING id`)
        .bind(id, userId, body.label.trim(), await hashRuntimeSecret(code), expires, now, userId).first<{ id: string }>();
      if (!row) return runtimeFailure('runtime-limit', 429);
      return authJson({ ok: true, runtimeId: id, code, expiresAt: iso(expires) }, { status: 201 });
    }
    if (body.operation === 'cancel') {
      if (typeof body.jobId !== 'string') return runtimeFailure('invalid-job');
      await db.prepare(`UPDATE ai_runtime_jobs SET status = 'cancelled', lease_hash = NULL, login_json = NULL,
        finished_at = ? WHERE id = ? AND user_id = ? AND status IN ('queued','running')`).bind(now, body.jobId, userId).run();
      return authJson({ ok: true });
    }
    if (body.operation !== 'job' || typeof body.runtimeId !== 'string' || !nativeProvider(body.provider)
      || (body.kind !== 'login' && body.kind !== 'prompt')) return runtimeFailure('invalid-job');
    if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(body.requestId)) return runtimeFailure('invalid-request-id');
    const requestHash = await hashRuntimeSecret(JSON.stringify([
      body.runtimeId, body.kind, body.provider, body.model ?? null, body.prompt ?? null, body.gentle ?? false,
    ]));
    const previous = await db.prepare('SELECT id, request_hash FROM ai_runtime_jobs WHERE user_id = ? AND request_id = ?')
      .bind(userId, body.requestId).first<{ id: string; request_hash: string }>();
    if (previous) return previous.request_hash === requestHash
      ? authJson({ ok: true, jobId: previous.id, replayed: true }, { status: 201 })
      : runtimeFailure('request-conflict', 409);
    const runtime = await db.prepare('SELECT * FROM ai_runtimes WHERE id = ? AND user_id = ?')
      .bind(body.runtimeId, userId).first<RuntimeRow>();
    if (!runtime) return runtimeFailure('runtime-not-found', 404);
    if (!runtime.token_hash || (runtime.token_expires_at ?? 0) <= now
      || runtime.last_seen_at === null || now - runtime.last_seen_at >= RUNTIME_ONLINE_MS) return runtimeFailure('runtime-offline', 409);
    const provider = normalizeProviders(JSON.parse(runtime.providers_json)).find((item) => item.provider === body.provider);
    if (!provider?.available) return runtimeFailure('provider-unavailable', 409);
    let model: string | null = null;
    let prompt: string | null = null;
    if (body.kind === 'prompt') {
      if (!provider.authenticated) return runtimeFailure('provider-not-ready', 409);
      if (provider.authMode !== 'subscription') return runtimeFailure('subscription-required', 409);
      if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 4000
        || (body.gentle !== undefined && typeof body.gentle !== 'boolean')) return runtimeFailure('invalid-prompt');
      if (body.model !== undefined && body.model !== null && body.model !== '') {
        if (!validModel(body.model) || !provider.models.some((item) => item.id === body.model)) return runtimeFailure('model-not-available');
        model = body.model;
      }
      prompt = `This is a text-only PointCast visit. Answer using only the information in this request. No tools, files, external requests, purchases, or messages are available. Do not claim to have opened a URL or taken an action.\n${body.gentle ? GENTLE_INVITATION + '\n' : ''}\nThe user chose to share:\n${body.prompt.trim()}`;
    }
    const count = await db.prepare('SELECT COUNT(*) AS total FROM ai_runtime_jobs WHERE user_id = ? AND created_at > ?')
      .bind(userId, now - 60 * 60_000).first<{ total: number }>();
    if ((count?.total ?? 0) >= 30) return runtimeFailure('job-limit', 429);
    const jobId = crypto.randomUUID();
    // Owner and runtime existence are checked again in the insert so disconnect
    // cannot leave a runnable orphan. The partial index serializes active jobs.
    const inserted = await db.prepare(`INSERT OR IGNORE INTO ai_runtime_jobs
      (id,runtime_id,user_id,kind,provider,request_id,request_hash,model,prompt,status,created_at,expires_at)
      SELECT ?,id,user_id,?,?,?,?,?,?,'queued',?,? FROM ai_runtimes
      WHERE id = ? AND user_id = ? AND token_expires_at > ?
      AND (SELECT COUNT(*) FROM ai_runtime_jobs WHERE user_id = ? AND created_at > ?) < 30
      RETURNING id`)
      .bind(jobId, body.kind, body.provider, body.requestId, requestHash, model, prompt, now, now + RUNTIME_JOB_MS, runtime.id, userId, now,
        userId, now - 60 * 60_000).first<{ id: string }>();
    if (!inserted) {
      const raced = await db.prepare('SELECT id, request_hash FROM ai_runtime_jobs WHERE user_id = ? AND request_id = ?')
        .bind(userId, body.requestId).first<{ id: string; request_hash: string }>();
      if (raced) return raced.request_hash === requestHash
        ? authJson({ ok: true, jobId: raced.id, replayed: true }, { status: 201 })
        : runtimeFailure('request-conflict', 409);
      return runtimeFailure('runtime-busy', 429);
    }
    return authJson({ ok: true, jobId }, { status: 201 });
  } catch (error) {
    if (error instanceof RuntimeInputError) return runtimeFailure(error.message, error.status);
    return runtimeFailure('ai-runtimes-unavailable', 503);
  }
}
export const onRequestPost: PagesFunction<AuthEnv> = ({ request, env }) => write(request, env, false);
export const onRequestDelete: PagesFunction<AuthEnv> = ({ request, env }) => write(request, env, true);
