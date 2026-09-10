import { authJson, type AuthEnv } from './auth/session.ts';
import {
  RUNTIME_JOB_MS, RUNTIME_TOKEN_MS, RuntimeInputError, expireRuntimeJobs, hashRuntimeSecret, iso,
  loginProgress, normalizeProviders, resultValue, runtimeBody, runtimeFailure, runtimeSecret,
  validRuntimeSecret, type RuntimeJob, type RuntimeRow,
} from '../_lib/ai-runtimes.ts';

/** Outbound companion transport. Never accepts a browser cookie as authority. */
export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (request.headers.has('origin')) return runtimeFailure('native-client-required', 403);
  if (!env.AUTH_DB) return runtimeFailure('ai-runtimes-unavailable', 503);
  try {
    const body = await runtimeBody(request, 98_304);
    const db = env.AUTH_DB;
    const now = Date.now();
    if (body.operation === 'pair') {
      if (!validRuntimeSecret(body.code) || (body.label !== undefined
        && (typeof body.label !== 'string' || !body.label.trim() || body.label.length > 80))) {
        return runtimeFailure('invalid-pairing');
      }
      const token = runtimeSecret();
      const runtime = await db.prepare(`UPDATE ai_runtimes SET pair_hash = NULL, pair_expires_at = NULL,
        token_hash = ?, token_expires_at = ?, last_seen_at = ?, label = COALESCE(?, label)
        WHERE pair_hash = ? AND pair_expires_at > ? AND token_hash IS NULL RETURNING id`)
        .bind(await hashRuntimeSecret(token), now + RUNTIME_TOKEN_MS, now,
          typeof body.label === 'string' ? body.label.trim() : null, await hashRuntimeSecret(body.code), now)
        .first<{ id: string }>();
      if (!runtime) return runtimeFailure('pairing-expired', 401);
      return authJson({ ok: true, runtimeId: runtime.id, token });
    }
    const token = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token) return runtimeFailure('unauthorized', 401);
    const tokenHash = await hashRuntimeSecret(token);
    const runtime = await db.prepare('SELECT * FROM ai_runtimes WHERE token_hash = ? AND token_expires_at > ?')
      .bind(tokenHash, now).first<RuntimeRow>();
    if (!runtime) return runtimeFailure('unauthorized', 401);
    await expireRuntimeJobs(db, runtime.user_id, now);
    if (body.operation === 'heartbeat') {
      const providers = normalizeProviders(body.providers);
      const updated = await db.prepare(`UPDATE ai_runtimes SET providers_json = ?, last_seen_at = ?
        WHERE id = ? AND token_hash = ? AND token_expires_at > ? RETURNING id`)
        .bind(JSON.stringify(providers), now, runtime.id, tokenHash, now).first<{ id: string }>();
      if (!updated) return runtimeFailure('unauthorized', 401);
      const cancelled = await db.prepare(`SELECT id FROM ai_runtime_jobs WHERE runtime_id = ?
        AND status IN ('cancelled','failed') AND finished_at > ?`).bind(runtime.id, now - RUNTIME_JOB_MS).all<{ id: string }>();
      return authJson({ ok: true, cancelledJobIds: cancelled.results.map((row) => row.id) });
    }
    if (body.operation === 'claim') {
      const leaseToken = runtimeSecret();
      const row = await db.prepare(`UPDATE ai_runtime_jobs SET status = 'running', lease_hash = ?
        WHERE id = (SELECT id FROM ai_runtime_jobs WHERE runtime_id = ? AND status = 'queued'
          AND expires_at > ? ORDER BY created_at LIMIT 1)
        AND status = 'queued' AND EXISTS (SELECT 1 FROM ai_runtimes WHERE id = ? AND token_hash = ? AND token_expires_at > ?)
        RETURNING *`).bind(await hashRuntimeSecret(leaseToken), runtime.id, now, runtime.id, tokenHash, now).first<RuntimeJob>();
      return authJson({ ok: true, job: row ? { id: row.id, kind: row.kind, provider: row.provider,
        model: row.model, prompt: row.prompt, leaseToken, expiresAt: iso(row.expires_at) } : null });
    }
    if ((body.operation !== 'progress' && body.operation !== 'complete')
      || typeof body.jobId !== 'string' || !validRuntimeSecret(body.leaseToken)) return runtimeFailure('invalid-operation');
    const leaseHash = await hashRuntimeSecret(body.leaseToken);
    const job = await db.prepare(`SELECT * FROM ai_runtime_jobs WHERE id = ? AND runtime_id = ?
      AND status = 'running' AND lease_hash = ? AND expires_at > ?`)
      .bind(body.jobId, runtime.id, leaseHash, now).first<RuntimeJob>();
    if (!job) return runtimeFailure('job-no-longer-active', 409);
    if (body.operation === 'progress') {
      if (job.kind !== 'login') return runtimeFailure('invalid-login-progress');
      const login = loginProgress(body.login, job.provider);
      const updated = await db.prepare(`UPDATE ai_runtime_jobs SET login_json = ? WHERE id = ? AND status = 'running'
        AND lease_hash = ? AND expires_at > ? AND EXISTS
        (SELECT 1 FROM ai_runtimes WHERE id = ? AND token_hash = ? AND token_expires_at > ?) RETURNING id`)
        .bind(JSON.stringify(login), job.id, leaseHash, now, runtime.id, tokenHash, now).first<{ id: string }>();
      return updated ? authJson({ ok: true }) : runtimeFailure('job-no-longer-active', 409);
    }
    if (body.status !== 'succeeded' && body.status !== 'failed') return runtimeFailure('invalid-result-status');
    let result: ReturnType<typeof resultValue> | null = null;
    let error: string | null = null;
    if (body.status === 'succeeded') result = resultValue(body.result, job.kind);
    else {
      if (typeof body.error !== 'string' || !body.error.trim() || body.error.length > 500) return runtimeFailure('invalid-error');
      error = body.error;
    }
    const updated = await db.prepare(`UPDATE ai_runtime_jobs SET status = ?, result_json = ?, error = ?,
      login_json = NULL, lease_hash = NULL, finished_at = ? WHERE id = ? AND status = 'running'
      AND lease_hash = ? AND expires_at > ? AND EXISTS
      (SELECT 1 FROM ai_runtimes WHERE id = ? AND token_hash = ? AND token_expires_at > ?) RETURNING id`)
      .bind(body.status, result ? JSON.stringify(result) : null, error, now, job.id, leaseHash, now, runtime.id, tokenHash, now)
      .first<{ id: string }>();
    if (!updated) return runtimeFailure('job-no-longer-active', 409);
    if (job.kind === 'prompt' && result) {
      await db.prepare('UPDATE ai_runtimes SET last_success_at = ? WHERE id = ? AND token_hash = ? AND token_expires_at > ?')
        .bind(now, runtime.id, tokenHash, now).run();
    }
    return authJson({ ok: true });
  } catch (error) {
    if (error instanceof RuntimeInputError) return runtimeFailure(error.message, error.status);
    return runtimeFailure('ai-runtimes-unavailable', 503);
  }
};
