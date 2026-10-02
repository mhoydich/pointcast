import {
  authJson,
  hasAuthStorage,
  readSessionFromRequest,
  type AuthEnv,
} from '../auth/session.ts';
import {
  byteLength, isRecord, MAX_PAYLOAD_BYTES, mergePayload,
  normalizePayload, readState, writeState,
} from './_state.ts';
export { USER_STATE_KEYS, normalizePayload } from './_state.ts';
export type { UserStateKey, UserStateEntry, UserStatePayload } from './_state.ts';

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  const state = await readState(env, current.user.userId);
  return authJson({ ok: true, payload: state?.payload ?? {}, version: state?.version ?? 0 });
};

export const onRequestPut: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!hasAuthStorage(env)) return authJson({ ok: false, reason: 'kv-not-bound' }, { status: 500 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });

  let body: { payload?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  if (isRecord(body?.payload) && 'nounsMoneyCollection' in body.payload) {
    return authJson({ ok: false, reason: 'collection-endpoint-required' }, { status: 400 });
  }
  const incoming = normalizePayload(body?.payload);
  if (!incoming) return authJson({ ok: false, reason: 'invalid-payload' }, { status: 400 });

  const existing = await readState(env, current.user.userId);
  const payload = mergePayload(existing?.payload ?? {}, incoming);
  if (byteLength(payload) > MAX_PAYLOAD_BYTES) {
    return authJson({ ok: false, reason: 'payload-too-large', maxBytes: MAX_PAYLOAD_BYTES }, { status: 413 });
  }
  const version = (existing?.version ?? 0) + 1;
  if (!await writeState(env, current.user.userId, payload, version)) {
    return authJson({ ok: false, reason: 'payload-too-large', maxBytes: MAX_PAYLOAD_BYTES }, { status: 413 });
  }
  const saved = await readState(env, current.user.userId);
  return authJson({ ok: true, payload: saved?.payload ?? payload, version: saved?.version ?? version });
};
