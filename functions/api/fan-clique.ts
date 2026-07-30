/**
 * /api/fan-clique — live school-click leaderboard for PointCast 25.
 *
 * GET  → all eligible teams, counts, total clicks, and current leader
 * POST { type: 'pointcast-fan-clique-v1', team, voterId }
 *      → one counted click per locally generated anonymous browser id
 *
 * This is intentionally a lightweight social game, not an election. The
 * browser id contains no account, email, wallet, or name. Clearing local
 * storage can create a new id, so the result must never be described as a
 * scientific fan-base measurement.
 */

import { rateLimit, rateLimitResponse } from '../_rate-limit';
import {
  FAN_CLIQUE_FEATURE,
  FAN_CLIQUE_TEAMS,
  FAN_CLIQUE_TEAM_SLUGS,
} from '../../src/lib/pointcast-fan-clique';

interface Env {
  PC_POLLS_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

interface VotePayload {
  type?: string;
  team?: string;
  voterId?: string;
}

const TYPE = 'pointcast-fan-clique-v1';
const PREFIX = `fan-clique:${FAN_CLIQUE_FEATURE.season}`;
const COUNT_PREFIX = `${PREFIX}:count:`;
const VOTER_PREFIX = `${PREFIX}:voter:`;
const VOTE_TTL = 370 * 24 * 60 * 60;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    ...extra,
  };
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: headers(extraHeaders),
  });
}

async function readStandings(kv?: KVNamespace) {
  const counts = await Promise.all(
    FAN_CLIQUE_TEAMS.map(async (team) => {
      if (!kv) return 0;
      try {
        const raw = await kv.get(`${COUNT_PREFIX}${team.slug}`);
        return raw ? Math.max(0, Number.parseInt(raw, 10) || 0) : 0;
      } catch {
        return 0;
      }
    }),
  );

  const standings = FAN_CLIQUE_TEAMS.map((team, index) => ({
    slug: team.slug,
    school: team.school,
    short: team.short,
    conference: team.conference,
    count: counts[index],
    fieldNumber: team.fieldNumber,
  })).sort((a, b) => b.count - a.count || a.fieldNumber - b.fieldNumber);

  return {
    standings,
    total: standings.reduce((sum, team) => sum + team.count, 0),
    leader: standings[0]?.count > 0 ? standings[0] : null,
  };
}

function applyFreshCount(
  snapshot: Awaited<ReturnType<typeof readStandings>>,
  team: string,
  count: number,
) {
  const standings = snapshot.standings
    .map((entry) => entry.slug === team ? { ...entry, count } : entry)
    .sort((a, b) => b.count - a.count || a.fieldNumber - b.fieldNumber);
  return {
    standings,
    total: standings.reduce((sum, entry) => sum + entry.count, 0),
    leader: standings[0]?.count > 0 ? standings[0] : null,
  };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: headers() });
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: headers({
        'X-Pc-Service': 'fan-clique',
        'X-Pc-Version': '1.0',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_POLLS_KV)),
      }),
    });
  }

  if (request.method === 'GET') {
    const live = Boolean(env.PC_POLLS_KV);
    const result = await readStandings(env.PC_POLLS_KV);
    return json({
      ok: true,
      live,
      type: TYPE,
      spec: FAN_CLIQUE_FEATURE.spec,
      season: FAN_CLIQUE_FEATURE.season,
      updatedAt: new Date().toISOString(),
      ...result,
      rules: {
        ballot: 'one-counted-click-per-browser-id',
        scientificPoll: false,
        footballRanking: false,
        personalDataCollected: false,
      },
      ...(live ? {} : { reason: 'PC_POLLS_KV is not bound; returning the honest zero state.' }),
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_POLLS_KV) {
    return json({
      ok: false,
      error: 'kv-not-bound',
      reason: 'Fan Clique needs the existing PC_POLLS_KV binding to count a vote.',
    }, 503);
  }

  const limit = await rateLimit(request, env, {
    bucket: 'fan-clique:vote',
    windowSec: 60 * 60,
    maxRequests: 20,
  });
  if (!limit.allowed) return rateLimitResponse(limit, 'Too many Fan Clique attempts from this connection.');

  let body: VotePayload;
  try {
    body = (await request.json()) as VotePayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== TYPE) {
    return json({ ok: false, error: 'unsupported-type', expected: TYPE }, 400);
  }

  const team = String(body.team || '').toLowerCase();
  if (!FAN_CLIQUE_TEAM_SLUGS.has(team)) {
    return json({ ok: false, error: 'unknown-team' }, 422);
  }

  const voterId = String(body.voterId || '');
  if (!/^fc_[a-z0-9_-]{24,80}$/.test(voterId)) {
    return json({ ok: false, error: 'invalid-voter-id' }, 422);
  }

  const voterKey = `${VOTER_PREFIX}${voterId}`;
  const countKey = `${COUNT_PREFIX}${team}`;

  try {
    const previous = await env.PC_POLLS_KV.get(voterKey);
    if (previous) {
      const result = await readStandings(env.PC_POLLS_KV);
      return json({
        ok: false,
        error: 'already-voted',
        votedFor: previous,
        ...result,
      }, 409);
    }

    // The pending marker narrows the duplicate window while the count updates.
    // KV is eventually consistent, which is acceptable for this casual game.
    await env.PC_POLLS_KV.put(voterKey, team, {
      expirationTtl: VOTE_TTL,
      metadata: { status: 'pending', at: new Date().toISOString() },
    });

    const currentRaw = await env.PC_POLLS_KV.get(countKey);
    const count = Math.max(0, Number.parseInt(currentRaw || '0', 10) || 0) + 1;
    await env.PC_POLLS_KV.put(countKey, String(count));
    await env.PC_POLLS_KV.put(voterKey, team, {
      expirationTtl: VOTE_TTL,
      metadata: { status: 'counted', at: new Date().toISOString() },
    });

    // KV can return a cached pre-write value for up to its propagation
    // window. Overlay the count we just accepted so the voter's receipt is
    // immediately truthful even while other edges converge.
    const snapshot = await readStandings(env.PC_POLLS_KV);
    const result = applyFreshCount(snapshot, team, count);
    const rank = result.standings.findIndex((entry) => entry.slug === team) + 1;
    return json({
      ok: true,
      type: TYPE,
      team,
      count,
      rank,
      ...result,
    }, 201, {
      'X-RateLimit-Limit': String(limit.limit),
      'X-RateLimit-Remaining': String(limit.remaining),
    });
  } catch (error) {
    try {
      await env.PC_POLLS_KV.delete(voterKey);
    } catch {
      // A failed cleanup must not replace the useful error response.
    }
    return json({
      ok: false,
      error: 'vote-write-failed',
      message: error instanceof Error ? error.message : 'Unknown write failure',
    }, 500);
  }
};
