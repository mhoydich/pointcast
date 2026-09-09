import {
  authJson,
  hasFreshAuthentication,
  readSessionFromRequest,
} from '../session.ts';
import {
  deleteOwnedPasskey,
  PasskeyLastSignInError,
  listPasskeyRows,
  passkeySummary,
  requirePasskeyDb,
  type PasskeyEnv,
} from './_shared.ts';

export const onRequestGet: PagesFunction<PasskeyEnv> = async ({ request, env }) => {
  const db = requirePasskeyDb(env);
  if (!db) return authJson({ ok: false, reason: 'd1-not-bound' }, { status: 503 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  const rows = await listPasskeyRows(db, current.user.userId);
  return authJson({ ok: true, passkeys: rows.map(passkeySummary) });
};

export const onRequestDelete: PagesFunction<PasskeyEnv> = async ({ request, env }) => {
  const db = requirePasskeyDb(env);
  if (!db) return authJson({ ok: false, reason: 'd1-not-bound' }, { status: 503 });
  const current = await readSessionFromRequest(request, env);
  if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
  if (!await hasFreshAuthentication(env, current.session)) {
    return authJson({ ok: false, reason: 'fresh-sign-in-required' }, { status: 403 });
  }

  let body: { credentialId?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const credentialId = typeof body.credentialId === 'string' ? body.credentialId : '';
  if (!credentialId) return authJson({ ok: false, reason: 'missing-credential-id' }, { status: 400 });
  try {
    const removed = await deleteOwnedPasskey(db, current.user, credentialId);
    if (!removed) return authJson({ ok: false, reason: 'passkey-not-found' }, { status: 404 });
    return authJson({ ok: true, removed: credentialId });
  } catch (error) {
    if (error instanceof PasskeyLastSignInError) {
      return authJson({ ok: false, reason: 'passkey-last-sign-in-method' }, { status: 409 });
    }
    throw error;
  }
};
