/**
 * /api/points — read the open Network Points ledger.
 *
 * GET /api/points?profile=<id>          → public summary for one profile
 * GET /api/points?profile=<handle>      → same, for a member who set that handle
 * GET /api/points?profile=<id>&lines=1  → summary + every line + chain check
 * GET /api/points?recent=1              → the latest lines across the network
 * GET /api/points?me=1                  → the signed-in member's own status
 *
 * POST /api/points/join and /api/points/leave change membership (see points/).
 *
 * Rules: src/lib/network-points.mjs, published at /points.json. Collectible
 * marks only: no cash value, never sold, redeemed or traded for money.
 * With POINTS_LEDGER_ENABLED unset, every read answers { enabled: false }.
 */

import { DISCLOSURE, summarize, verifyChain } from '../../src/lib/network-points.mjs';
import { readSessionFromRequest, type AuthEnv } from './auth/session.ts';
import {
  HANDLE_RE,
  isProfileId,
  profileForHandle,
  ledgerProfileId,
  pointsEnabled,
  readProfileLines,
  readProfileRow,
  readRecentLines,
  type PointsEnv,
} from '../_lib/network-points.ts';

interface Env extends AuthEnv, PointsEnv {
  DRUM_COUNTER?: DurableObjectNamespace;
}

const PUBLIC = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=30' };
const PRIVATE = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200, headers = PUBLIC) => new Response(JSON.stringify(body), { status, headers });

async function drumBeats(env: Env, profile: string): Promise<number | null> {
  if (!env.DRUM_COUNTER) return null;
  try {
    const stub = env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName('global'));
    const stats = (await (await stub.fetch(`https://drum-counter.internal/?user=${profile}`)).json()) as { total?: number };
    return typeof stats.total === 'number' ? stats.total : null;
  } catch {
    return null;
  }
}

async function profileSummary(env: Env, profile: string, withLines: boolean) {
  const db = env.AUTH_DB!;
  const [row, lines, beats] = await Promise.all([readProfileRow(db, profile), readProfileLines(db, profile), drumBeats(env, profile)]);
  if (!row && !lines.length) return null;
  const summary = summarize(profile, lines, { beats });
  return {
    ok: true,
    enabled: true,
    ...summary,
    name: row && row.joined_at !== 'left' ? row.display_name : null,
    member: !!row && row.joined_at !== 'left',
    handle: row && row.joined_at !== 'left' ? row.handle : null,
    ...(withLines ? { ledger: lines, chain: await verifyChain(lines) } : {}),
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!pointsEnabled(env)) {
    return json({ ok: true, enabled: false, reason: 'points-ledger-off', rules: 'https://pointcast.xyz/points.json', disclosure: DISCLOSURE });
  }
  try {
    if (url.searchParams.has('me')) {
      const current = await readSessionFromRequest(request, env).catch(() => null);
      if (!current) return json({ ok: true, enabled: true, signedIn: false }, 200, PRIVATE);
      const profile = await ledgerProfileId(current.user.userId);
      const summary = await profileSummary(env, profile, false);
      return json({ ok: true, enabled: true, signedIn: true, profile, member: summary?.member ?? false, summary }, 200, PRIVATE);
    }
    if (url.searchParams.has('recent')) {
      const lines = await readRecentLines(env.AUTH_DB!, Number(url.searchParams.get('limit') ?? 50) || 50);
      return json({ ok: true, enabled: true, schema: 'pointcast.points.recent/v1', lines, disclosure: DISCLOSURE });
    }
    const asked = url.searchParams.get('profile');
    let profile: string | null = isProfileId(asked) ? asked : null;
    if (!profile && asked && HANDLE_RE.test(asked)) {
      profile = await profileForHandle(env.AUTH_DB!, asked);
      if (!profile) return json({ ok: false, reason: 'no-such-profile' }, 404);
    }
    if (!profile) return json({ ok: false, reason: 'bad-profile' }, 400);
    const summary = await profileSummary(env, profile, url.searchParams.get('lines') === '1');
    if (!summary) return json({ ok: false, reason: 'no-such-profile' }, 404);
    return json(summary);
  } catch {
    return json({ ok: false, reason: 'points-unavailable' }, 503);
  }
};
