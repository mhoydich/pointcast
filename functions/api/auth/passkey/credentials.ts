import {
  authJson,
  readSessionFromRequest,
} from '../session.ts';
import {
  deleteOwnedPasskey,
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

  let body: { credentialId?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return authJson({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  const credentialId = typeof body.credentialId === 'string' ? body.credentialId : '';
  if (!credentialId) return authJson({ ok: false, reason: 'missing-credential-id' }, { status: 400 });
  const removed = await deleteOwnedPasskey(db, current.user, credentialId);
  if (!removed) return authJson({ ok: false, reason: 'passkey-not-found' }, { status: 404 });
  return authJson({ ok: true, removed: credentialId });
};
