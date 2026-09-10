import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';
import { AI_APPROACHES, AI_VISIT_TTL_MS, hashVisitCode, newVisitCode, validProvider } from '../../_lib/ai-companions.ts';

type CompanionRow = {
  provider: string;
  invitation_id: string;
  approach: string;
  gentle: number;
  expires_at: number | null;
  confirmed_at: number | null;
};

const unavailable = () => authJson({ ok: false, reason: 'ai-visits-unavailable' }, { status: 503 });

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  if (!env.AUTH_DB) return unavailable();
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
    const rows = await env.AUTH_DB.prepare(`
      SELECT provider, approach, gentle, invitation_id, expires_at, confirmed_at FROM ai_companions WHERE user_id = ? ORDER BY provider
    `).bind(current.user.userId).all<CompanionRow>();
    return authJson({ ok: true, companions: rows.results.map((row) => ({
      provider: row.provider,
      invitationId: row.invitation_id,
      approach: row.approach,
      gentle: Boolean(row.gentle),
      status: row.confirmed_at ? 'visit-confirmed' : row.expires_at && row.expires_at > Date.now() ? 'waiting' : 'expired',
      confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
      expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    })) });
  } catch { return unavailable(); }
};

async function mutate(request: Request, env: AuthEnv, remove: boolean): Promise<Response> {
  // Cookie-authenticated browser writes must originate from this exact site.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return authJson({ ok: false, reason: 'origin-not-allowed' }, { status: 403 });
  }
  if (!env.AUTH_DB) return unavailable();
  try {
    const current = await readSessionFromRequest(request, env);
    if (!current) return authJson({ ok: false, reason: 'unauthorized' }, { status: 401 });
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return authJson({ ok: false, reason: 'json-required' }, { status: 415 });
    }
    // Bound actual body bytes, including requests without Content-Length.
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 1024) { await reader.cancel(); return authJson({ ok: false, reason: 'body-too-large' }, { status: 413 }); }
        chunks.push(chunk.value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let body: Record<string, unknown>;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return authJson({ ok: false, reason: 'bad-body' }, { status: 400 }); }
    if (!body || !validProvider(body.provider)) return authJson({ ok: false, reason: 'invalid-provider' }, { status: 400 });
    if (remove) {
      await env.AUTH_DB.prepare('DELETE FROM ai_companions WHERE user_id = ? AND provider = ?')
        .bind(current.user.userId, body.provider).run();
      return authJson({ ok: true });
    }
    if (!(AI_APPROACHES as readonly unknown[]).includes(body.approach) || typeof body.gentle !== 'boolean') {
      return authJson({ ok: false, reason: 'invalid-preferences' }, { status: 400 });
    }
    const code = newVisitCode();
    const invitationId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + AI_VISIT_TTL_MS;
    await env.AUTH_DB.prepare(`
      INSERT INTO ai_companions (user_id, provider, approach, gentle, invitation_id, code_hash, expires_at, confirmed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
      ON CONFLICT(user_id, provider) DO UPDATE SET approach = excluded.approach, gentle = excluded.gentle,
        invitation_id = excluded.invitation_id, code_hash = excluded.code_hash, expires_at = excluded.expires_at, confirmed_at = NULL, updated_at = excluded.updated_at
    `).bind(current.user.userId, body.provider, body.approach, body.gentle ? 1 : 0,
      invitationId, await hashVisitCode(code), expiresAt, now).run();
    return authJson({ ok: true, code, invitationId, expiresAt: new Date(expiresAt).toISOString() }, { status: 201 });
  } catch { return unavailable(); }
}

export const onRequestPost: PagesFunction<AuthEnv> = ({ request, env }) => mutate(request, env, false);
export const onRequestDelete: PagesFunction<AuthEnv> = ({ request, env }) => mutate(request, env, true);
