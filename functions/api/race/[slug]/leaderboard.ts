/**
 * GET /api/race/{slug}/leaderboard — RFC 0002 Race System, Phase 2.
 *
 * Returns:
 *   {
 *     ok: true,
 *     race: { slug, title, channel, mode, status, ... },
 *     count: number,
 *     entries: Array<LeaderboardEntry>,   // top-N, rank-ordered
 *     you?: LeaderboardEntry              // if ?entrantId= matches a row
 *   }
 *
 * Query params:
 *   ?limit=<n>         — top-N cap, 1–100, default 10 per RFC
 *   ?entrantId=<id>    — if present, the caller's own row is returned
 *                        under `you` alongside the top-N
 *
 * Rate limited at 60/min/IP (same as /api/wire-events). Graceful no-op
 * when PC_RACE_KV is unbound: returns `{ ok: true, entries: [],
 * reason: 'kv-unbound' }` so the client shows an empty leaderboard
 * rather than erroring.
 */

import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../../../_rate-limit';
import {
  findRace,
  deriveStatus,
  normalizeSlug,
  type RaceEntry,
  type LeaderboardEntry,
} from '../../../../src/lib/races';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

type AnyParams = Record<string, string | string[] | undefined>;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const rawSlug = Array.isArray((ctx.params as AnyParams).slug)
    ? ((ctx.params as AnyParams).slug as string[])[0]
    : ((ctx.params as AnyParams).slug as string | undefined) ?? '';
  const slug = normalizeSlug(rawSlug);
  if (!slug) return json({ ok: false, error: 'invalid race slug' }, 400);

  const rl = await rateLimit(ctx.request, ctx.env, {
    bucket: 'race-leaderboard',
    windowSec: 60,
    maxRequests: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl, 'leaderboard poll rate exceeded');

  const race = findRace(slug);
  if (!race) {
    return applyRateLimitHeaders(
      json({ ok: false, error: 'race not found', slug }, 404),
      rl,
    );
  }

  const status = deriveStatus(race);
  const url = new URL(ctx.request.url);
  const limitRaw = url.searchParams.get('limit');
  const entrantId = (url.searchParams.get('entrantId') || '').slice(0, 80);
  const limit = Math.max(1, Math.min(100, parseInt(limitRaw || '10', 10) || 10));

  const raceMeta = {
    slug: race.slug,
    title: race.title,
    channel: race.channel,
    mode: race.mode,
    status,
    opensAt: race.opensAt,
    closesAt: race.closesAt,
    resolvesAt: race.resolvesAt,
    prize: race.prize ?? null,
  };

  if (!ctx.env.PC_RACE_KV) {
    return applyRateLimitHeaders(
      json({
        ok: true,
        reason: 'kv-unbound',
        race: raceMeta,
        count: 0,
        entries: [] as LeaderboardEntry[],
      }),
      rl,
    );
  }

  let stored: RaceEntry[] = [];
  let updatedAt: string | null = null;
  let totalEntryCount = 0;
  try {
    const raw = await ctx.env.PC_RACE_KV.get(`race:${race.slug}`);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        entries?: RaceEntry[];
        updatedAt?: string;
        entryCount?: number;
      };
      if (Array.isArray(parsed.entries)) stored = parsed.entries;
      if (typeof parsed.updatedAt === 'string') updatedAt = parsed.updatedAt;
      if (typeof parsed.entryCount === 'number') totalEntryCount = parsed.entryCount;
    }
  } catch {
    // return empty leaderboard rather than 5xx — the race still "exists"
  }

  const entries: LeaderboardEntry[] = stored.slice(0, limit).map((e, idx) => ({
    rank: idx + 1,
    entrantId: e.entrantId,
    entrantKind: e.entrantKind,
    score: e.score,
    submittedAt: e.submittedAt,
    ...(e.submissionRef ? { submissionRef: e.submissionRef } : {}),
  }));

  let you: LeaderboardEntry | null = null;
  if (entrantId) {
    const yourIdx = stored.findIndex((e) => e.entrantId === entrantId);
    if (yourIdx >= 0) {
      const e = stored[yourIdx];
      you = {
        rank: yourIdx + 1,
        entrantId: e.entrantId,
        entrantKind: e.entrantKind,
        score: e.score,
        submittedAt: e.submittedAt,
        ...(e.submissionRef ? { submissionRef: e.submissionRef } : {}),
      };
    }
  }

  return applyRateLimitHeaders(
    json({
      ok: true,
      race: raceMeta,
      count: totalEntryCount || stored.length,
      limit,
      updatedAt,
      entries,
      ...(you ? { you } : {}),
    }),
    rl,
  );
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=5',
    },
  });
}
