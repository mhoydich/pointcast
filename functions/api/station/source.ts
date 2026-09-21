/**
 * /api/station/source — where the station's play log comes from.
 * GET is public (the ListenBrainz username is public by nature: the page links to it).
 * POST is the broadcaster's alone: { listenbrainz: "username" } to set, "" to clear. The
 * username is checked against ListenBrainz before it is saved. No secrets are involved.
 */
import { authJson, readSessionFromRequest } from '../auth/session.ts';
import type { SpotifyBroadcastEnv } from '../spotify/_broadcast.ts';
import { LB_USER } from '../spotify/_listenbrainz.ts';
import { readStationConfig, writeStationConfig } from '../spotify/_station.ts';

export async function handleSource(request: Request, env: SpotifyBroadcastEnv, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method === 'GET') { const c = await readStationConfig(env); return authJson({ ok: true, listenbrainz: c.listenbrainz ?? null }); }
  if (request.method !== 'POST') return authJson({ ok: false, reason: 'method-not-allowed' }, { status: 405 });
  if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return authJson({ ok: false, reason: 'same-origin-required' }, { status: 403 });
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  let body: { listenbrainz?: unknown }; try { const text = await request.text(); if (text.length > 500) throw new Error('too-long'); body = JSON.parse(text); } catch { return authJson({ ok: false, reason: 'invalid-json' }, { status: 400 }); }
  const user = String(body?.listenbrainz ?? '').trim();
  if (!user) { await writeStationConfig(env, {}); return authJson({ ok: true, listenbrainz: null }); }
  if (!LB_USER.test(user)) return authJson({ ok: false, reason: 'invalid-username', error: 'That does not look like a ListenBrainz username.' }, { status: 400 });
  // Does this person exist there? One public request; a typo should fail here, not silently log nothing.
  let exists = false; try { const r = await fetcher(`https://api.listenbrainz.org/1/user/${encodeURIComponent(user)}/listen-count`, { headers: { 'User-Agent': 'PointCastStation/1.0 (https://pointcast.xyz/station)' }, signal: AbortSignal.timeout(6000) }); exists = r.ok; } catch { /* below */ }
  if (!exists) return authJson({ ok: false, reason: 'unknown-user', error: 'ListenBrainz has no public user by that name (or is not answering). Nothing was saved.' }, { status: 422 });
  await writeStationConfig(env, { listenbrainz: user });
  return authJson({ ok: true, listenbrainz: user });
}

export const onRequest: PagesFunction<SpotifyBroadcastEnv> = ({ request, env }) => handleSource(request, env);
