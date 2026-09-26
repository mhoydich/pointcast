/**
 * /api/drum/me — the signed-in member's drum.
 *
 * Beats played on any pointcast.xyz drum while signed in are credited to the
 * member's account (see /api/drum and /api/drum/signal), so the total follows
 * them across devices. Signed out, this says so and nothing else.
 *
 * GET /api/drum/me
 *   → { signedIn: false }
 *   → { signedIn: true, name, total, rank, members, firstAt, lastAt }
 */

import { drumMemberKey } from '../../_lib/drum-signal.ts';
import { readSessionFromRequest, type AuthEnv } from '../auth/session.ts';

interface Env extends AuthEnv {
  DRUM_COUNTER?: DurableObjectNamespace;
}

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  let current: Awaited<ReturnType<typeof readSessionFromRequest>> = null;
  try {
    current = await readSessionFromRequest(request, env);
  } catch {
    return json({ ok: false, reason: 'session-unavailable' }, 503);
  }
  if (!current) return json({ signedIn: false });
  if (!env.DRUM_COUNTER) return json({ ok: false, reason: 'counter-unavailable', signedIn: true }, 503);
  try {
    const key = await drumMemberKey(current.user.userId);
    const stub = env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName('global'));
    const stats = (await (await stub.fetch(`https://drum-counter.internal/?user=${key}`)).json()) as Record<string, unknown>;
    return json({ signedIn: true, name: current.user.preferredName || null, ...stats });
  } catch {
    return json({ ok: false, reason: 'counter-unavailable', signedIn: true }, 503);
  }
};
