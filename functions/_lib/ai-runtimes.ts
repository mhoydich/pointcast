import { authJson } from '../api/auth/session.ts';
export { hashVisitCode as hashRuntimeSecret, newVisitCode as runtimeSecret } from './ai-companions.ts';

export const RUNTIME_ONLINE_MS = 45_000;
export const RUNTIME_JOB_MS = 10 * 60_000;
export const RUNTIME_RETENTION_MS = 30 * 24 * 60 * 60_000;
export const RUNTIME_TOKEN_MS = RUNTIME_RETENTION_MS;
export type NativeProvider = 'codex' | 'claude';
export type ProviderState = {
  provider: NativeProvider; available: boolean; authenticated: boolean;
  authMode: 'subscription' | 'api' | 'unknown';
  models: { id: string; label: string }[];
  modelDiscovery: 'native' | 'configured' | 'unavailable';
};
export type RuntimeRow = {
  id: string; user_id: string; label: string; pair_hash: string | null;
  pair_expires_at: number | null; token_hash: string | null; token_expires_at: number | null;
  providers_json: string; created_at: number; last_seen_at: number | null; last_success_at: number | null;
};
export type RuntimeJob = {
  id: string; runtime_id: string; user_id: string; kind: 'login' | 'prompt'; provider: NativeProvider;
  model: string | null; prompt: string | null; status: string; lease_hash: string | null;
  request_id: string; request_hash: string;
  login_json: string | null; result_json: string | null; error: string | null;
  created_at: number; expires_at: number; finished_at: number | null;
};
export const runtimeFailure = (reason: string, status = 400) => authJson({ ok: false, reason }, { status });
export const validRuntimeSecret = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
export const nativeProvider = (value: unknown): value is NativeProvider => value === 'codex' || value === 'claude';
export const validModel = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/.test(value);
export const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
export const iso = (value: number | null) => value === null ? null : new Date(value).toISOString();

export class RuntimeInputError extends Error {
  status: number;
  constructor(reason: string, status = 400) { super(reason); this.status = status; }
}

export async function runtimeBody(request: Request, limit = 32_768): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RuntimeInputError('json-required', 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RuntimeInputError('bad-body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > limit) { await reader.cancel(); throw new RuntimeInputError('body-too-large', 413); }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new RuntimeInputError('bad-body'); }
  if (!record(body)) throw new RuntimeInputError('bad-body');
  return body;
}

export function normalizeProviders(input: unknown): ProviderState[] {
  if (!Array.isArray(input) || input.length > 2) throw new RuntimeInputError('invalid-providers');
  const seen = new Set<string>();
  return input.map((item) => {
    if (!record(item) || !nativeProvider(item.provider) || seen.has(item.provider)
      || typeof item.available !== 'boolean' || typeof item.authenticated !== 'boolean'
      || !['subscription', 'api', 'unknown'].includes(String(item.authMode))
      || !['native', 'configured', 'unavailable'].includes(String(item.modelDiscovery))
      || !Array.isArray(item.models) || item.models.length > 100) throw new RuntimeInputError('invalid-providers');
    seen.add(item.provider);
    const models = item.models.map((model) => {
      if (!record(model) || !validModel(model.id) || typeof model.label !== 'string'
        || model.label.length < 1 || model.label.length > 120) throw new RuntimeInputError('invalid-models');
      return { id: model.id, label: model.label };
    });
    return {
      provider: item.provider, available: item.available, authenticated: item.available && item.authenticated,
      authMode: item.authMode as ProviderState['authMode'], models,
      modelDiscovery: item.modelDiscovery as ProviderState['modelDiscovery'],
    };
  });
}

export function runtimeView(row: RuntimeRow, now = Date.now()) {
  const paired = row.token_hash && (row.token_expires_at ?? 0) > now;
  return {
    id: row.id, label: row.label,
    status: !row.token_hash && (row.pair_expires_at ?? 0) > now ? 'waiting'
      : paired && row.last_seen_at !== null && now - row.last_seen_at < RUNTIME_ONLINE_MS ? 'online' : 'offline',
    expiresAt: iso(row.token_expires_at ?? row.pair_expires_at), lastSeenAt: iso(row.last_seen_at),
    lastSuccessAt: iso(row.last_success_at), providers: normalizeProviders(JSON.parse(row.providers_json)),
  };
}

export function jobView(row: RuntimeJob) {
  return {
    id: row.id, requestId: row.request_id, runtimeId: row.runtime_id, kind: row.kind, provider: row.provider, model: row.model,
    status: row.status, createdAt: iso(row.created_at), expiresAt: iso(row.expires_at),
    ...(row.status === 'running' && row.login_json ? { login: JSON.parse(row.login_json) } : {}),
    ...(row.result_json ? { result: JSON.parse(row.result_json) } : {}),
    ...(row.error ? { error: row.error } : {}),
  };
}

/** Expired jobs stop permanently; no retry can silently repeat an inference. */
export async function expireRuntimeJobs(db: D1Database, userId: string, now = Date.now()) {
  await db.prepare(`DELETE FROM ai_runtimes WHERE user_id = ? AND token_hash IS NULL AND pair_expires_at <= ?`)
    .bind(userId, now).run();
  await db.prepare(`UPDATE ai_runtime_jobs SET status = 'failed', error = 'job-expired',
    login_json = NULL, lease_hash = NULL, finished_at = ?
    WHERE user_id = ? AND status IN ('queued','running') AND expires_at <= ?`).bind(now, userId, now).run();
  await db.prepare('DELETE FROM ai_runtime_jobs WHERE user_id = ? AND created_at < ?')
    .bind(userId, now - RUNTIME_RETENTION_MS).run();
}

/** Only the native provider's own HTTPS sign-in destinations may reach the UI. */
export function loginProgress(value: unknown, provider: NativeProvider) {
  if (!record(value) || typeof value.verificationUrl !== 'string' || value.verificationUrl.length > 4096) {
    throw new RuntimeInputError('invalid-login-progress');
  }
  let url: URL;
  try { url = new URL(value.verificationUrl); } catch { throw new RuntimeInputError('invalid-login-progress'); }
  const hosts = provider === 'codex' ? ['auth.openai.com', 'chatgpt.com']
    : ['claude.ai', 'claude.com', 'platform.claude.com', 'console.anthropic.com'];
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !hosts.includes(url.hostname)) {
    throw new RuntimeInputError('invalid-login-progress');
  }
  if (value.userCode !== undefined && (typeof value.userCode !== 'string' || !/^[A-Za-z0-9-]{4,32}$/.test(value.userCode))) {
    throw new RuntimeInputError('invalid-login-progress');
  }
  return { verificationUrl: url.href, ...(typeof value.userCode === 'string' ? { userCode: value.userCode } : {}) };
}

export function resultValue(value: unknown, kind: RuntimeJob['kind']) {
  if (!record(value) || typeof value.text !== 'string' || value.text.length > 16_000
    || (kind === 'prompt' && !value.text.trim())) throw new RuntimeInputError('invalid-result');
  const actualModels = value.actualModels === undefined ? [] : value.actualModels;
  if (!Array.isArray(actualModels) || actualModels.length > 10 || actualModels.some((model) => !validModel(model))) {
    throw new RuntimeInputError('invalid-result-models');
  }
  if (kind === 'prompt' && actualModels.length === 0) throw new RuntimeInputError('model-proof-required');
  return { text: value.text, actualModels, ...(validModel(value.requestedModel) ? { requestedModel: value.requestedModel } : {}) };
}
