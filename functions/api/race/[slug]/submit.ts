/**
 * POST /api/race/{slug}/submit — RFC 0002 Race System, Phase 2.
 *
 * Body (JSON):
 *   { entrantId: string, entrantKind: 'noun'|'wallet'|'anon',
 *     score: number, submissionRef?: string, clientTs?: string }
 *
 * Flow:
 *   1. Rate limit (10/hr/IP on the race:{slug} bucket) via shared helper
 *   2. Resolve race spec from registry (src/lib/races.ts)
 *   3. Derive status from spec; reject if not 'open'
 *   4. Validate body shape + entrant kind
 *   5. Upsert entry in PC_RACE_KV under `race:{slug}:entrant:{id}`
 *      — newer submission wins per scoreDirection(mode)
 *   6. Append to sorted entries list under `race:{slug}`
 *   7. Return the entrant's current rank + total entries
 *
 * Graceful no-op when PC_RACE_KV is unbound:
 *   Returns `{ ok: true, stored: false, reason: 'kv-unbound' }` so the
 *   client can still round-trip a submission and show an "accepted"
 *   state while the binding is pending. This matches the Sprint 18
 *   pattern on rate limiting.
 */

import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../../../_rate-limit';
import {
  findRace,
  deriveStatus,
  scoreDirection,
  normalizeSlug,
  type RaceEntry,
  type EntrantKind,
  type RaceSpec,
} from '../../../../src/lib/races';

interface Env {
  PC_RATES_KV?: KVNamespace;
  PC_RACE_KV?: KVNamespace;
}

type AnyParams = Record<string, string | string[] | undefined>;

const KV_ENTRY_TTL_SEC = 60 * 60 * 24 * 90; // 90 days, well past any single race

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const rawSlug = Array.isArray((ctx.params as AnyParams).slug)
    ? ((ctx.params as AnyParams).slug as string[])[0]
    : ((ctx.params as AnyParams).slug as string | undefined) ?? '';
  const slug = normalizeSlug(rawSlug);
  if (!slug) return json({ ok: false, error: 'invalid race slug' }, 400);

  // Per-slug rate bucket so racing slug A doesn't starve the limit for
  // slug B. 10 submissions/hr/IP is gentle — Mike can widen per-race.
  const rl = await rateLimit(ctx.request, ctx.env, {
    bucket: `race-submit:${slug}`,
    windowSec: 3600,
    maxRequests: 10,
  });
  if (!rl.allowed) return rateLimitResponse(rl, 'too many race submissions; slow down');

  const race = findRace(slug);
  if (!race) {
    return applyRateLimitHeaders(
      json(
        {
          ok: false,
          error: 'race not found',
          hint: 'See RACE_REGISTRY in src/lib/races.ts or GET /race.json (when PR #18 lands).',
        },
        404,
      ),
      rl,
    );
  }

  const status = deriveStatus(race);
  if (status !== 'open') {
    return applyRateLimitHeaders(
      json(
        {
          ok: false,
          error: 'race not open',
          slug: race.slug,
          status,
          opensAt: race.opensAt,
          closesAt: race.closesAt,
        },
        409,
      ),
      rl,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return applyRateLimitHeaders(json({ ok: false, error: 'expected JSON body' }, 400), rl);
  }

  const entrantId = String(body.entrantId ?? '').trim().slice(0, 80);
  const entrantKindRaw = String(body.entrantKind ?? '').trim();
  const entrantKind = (['noun', 'wallet', 'anon'] as EntrantKind[]).includes(
    entrantKindRaw as EntrantKind,
  )
    ? (entrantKindRaw as EntrantKind)
    : null;
  const scoreRaw = Number(body.score);
  const score = Number.isFinite(scoreRaw) ? scoreRaw : NaN;
  const submissionRef =
    typeof body.submissionRef === 'string' ? body.submissionRef.trim().slice(0, 200) : undefined;
  const clientTs =
    typeof body.clientTs === 'string' ? body.clientTs.trim().slice(0, 40) : undefined;

  if (!entrantId) return applyRateLimitHeaders(json({ ok: false, error: 'entrantId required' }, 400), rl);
  if (!entrantKind) return applyRateLimitHeaders(json({ ok: false, error: 'entrantKind must be noun|wallet|anon' }, 400), rl);
  if (!Number.isFinite(score)) return applyRateLimitHeaders(json({ ok: false, error: 'score must be a number' }, 400), rl);
  // Some defensive bounds — real sanity is per-race, not at this layer.
  if (Math.abs(score) > 1e12) return applyRateLimitHeaders(json({ ok: false, error: 'score out of range' }, 400), rl);

  const now = new Date();
  const entry: RaceEntry = {
    entrantId,
    entrantKind,
    score,
    submittedAt: now.toISOString(),
    ...(submissionRef ? { submissionRef } : {}),
    ...(clientTs ? { clientTs } : {}),
  };

  // KV unbound — behave exactly like an accept + echo. Client shows
  // the "submitted" state; when the binding lands, the next submission
  // from the same entrantId writes cleanly.
  if (!ctx.env.PC_RACE_KV) {
    return applyRateLimitHeaders(
      json({
        ok: true,
        stored: false,
        reason: 'kv-unbound',
        race: { slug: race.slug, status, mode: race.mode },
        entry,
      }),
      rl,
    );
  }

  // Upsert entrant row + merge into sorted entries list. Conservative
  // approach: read modify write on `race:{slug}` so ordering stays
  // correct under the low write rates we expect (<10/hr/race). If races
  // scale to thousands of entries/hr we'll shard — that's Phase 5.
  const entrantKey = `race:${race.slug}:entrant:${entrantId}`;
  const raceKey = `race:${race.slug}`;

  let existingEntries: RaceEntry[] = [];
  try {
    const raw = await ctx.env.PC_RACE_KV.get(raceKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { entries?: RaceEntry[] };
      if (Array.isArray(parsed.entries)) existingEntries = parsed.entries;
    }
  } catch {
    // fall through with empty list — don't fail the write on a stale read
  }

  const keyedEntries = new Map<string, RaceEntry>();
  for (const e of existingEntries) keyedEntries.set(e.entrantId, e);

  const prev = keyedEntries.get(entrantId);
  if (prev) {
    // Only overwrite the prior entry if this one *improves* the score
    // under the mode's direction. Otherwise keep the best.
    const dir = scoreDirection(race.mode);
    const isBetter = dir === 'asc' ? score < prev.score : score > prev.score;
    if (isBetter) keyedEntries.set(entrantId, entry);
  } else {
    keyedEntries.set(entrantId, entry);
  }

  const merged = Array.from(keyedEntries.values()).sort((a, b) => {
    const dir = scoreDirection(race.mode);
    if (a.score === b.score) return a.submittedAt.localeCompare(b.submittedAt);
    return dir === 'asc' ? a.score - b.score : b.score - a.score;
  });

  try {
    await Promise.all([
      ctx.env.PC_RACE_KV.put(entrantKey, JSON.stringify(entry), { expirationTtl: KV_ENTRY_TTL_SEC }),
      ctx.env.PC_RACE_KV.put(
        raceKey,
        JSON.stringify({
          slug: race.slug,
          mode: race.mode,
          updatedAt: now.toISOString(),
          entryCount: merged.length,
          entries: merged.slice(0, 200), // bound the hot value at 200 entries
        }),
        { expirationTtl: KV_ENTRY_TTL_SEC },
      ),
    ]);
  } catch (e) {
    return applyRateLimitHeaders(
      json({ ok: false, stored: false, error: 'KV write failed', race: { slug: race.slug, status } }, 502),
      rl,
    );
  }

  const rank = merged.findIndex((e) => e.entrantId === entrantId) + 1;

  return applyRateLimitHeaders(
    json({
      ok: true,
      stored: true,
      race: { slug: race.slug, status, mode: race.mode, entryCount: merged.length },
      entry,
      rank: rank || null,
    }),
    rl,
  );
};

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

// Silence the unused-type lint since tsc might not see these imported
// types as "used" — they're referenced in JSDoc only in one place.
export type __RaceSpec = RaceSpec;
