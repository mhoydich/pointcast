/**
 * PointCast Weekly Recap — GET /api/recap
 *
 * Serves the latest (or a specific week's) recap JSON for client hydration.
 * Also handles the manual recalculation trigger at /api/recap?recalc=true
 * (admin-only, protected by a shared secret in the ADMIN_SECRET env var).
 *
 * Query parameters:
 *   ?week=2026-w16        — fetch a specific week's recap
 *   ?recalc=true          — recompute the current week's recap (admin only)
 *   ?index=true           — return the full list of available week IDs
 *   ?summary=true         — return WeeklyRecapSummary[] for RSS/homepage use
 *
 * Cache-Control: public, max-age=3600, stale-while-revalidate=86400
 * (Data only changes once per week; aggressive caching is safe.)
 */

import type { WeeklyRecap, WeeklyRecapSummary } from '../../src/types/recap';
import { computeWeeklyRecap } from '../cron/weekly-recap';

export interface Env {
  VISITS: KVNamespace;
  FEEDBACK: KVNamespace;
  RECAPS: KVNamespace;
  DROPS: KVNamespace;
  ADMIN_SECRET?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status, { 'Cache-Control': 'no-store' });
}

function toSummary(recap: WeeklyRecap): WeeklyRecapSummary {
  return {
    id: recap.id,
    startDate: recap.startDate,
    endDate: recap.endDate,
    publishedAt: recap.publishedAt,
    totalDrums: recap.totalDrums,
    newVisitors: recap.newVisitors,
    topNounId: recap.topNounId,
    heroHeadline: recap.heroMoment.headline,
    isQuietWeek: recap.isQuietWeek,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const weekParam = url.searchParams.get('week');
  const recalc = url.searchParams.get('recalc') === 'true';
  const indexOnly = url.searchParams.get('index') === 'true';
  const summaryOnly = url.searchParams.get('summary') === 'true';

  // ── Admin recalculation ──────────────────────────────────────────────────
  if (recalc) {
    const authHeader = request.headers.get('Authorization') ?? '';
    const secret = env.ADMIN_SECRET ?? '';
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const recap = await computeWeeklyRecap(env);
      await env.RECAPS.put(`recap:${recap.id}`, JSON.stringify(recap));
      await env.RECAPS.put('recap:latest', recap.id);

      // Update index
      const indexRaw = await env.RECAPS.get('recap:index', 'json') as string[] | null;
      const index = indexRaw ?? [];
      if (!index.includes(recap.id)) {
        index.unshift(recap.id);
        await env.RECAPS.put('recap:index', JSON.stringify(index));
      }

      return jsonResponse({ success: true, id: recap.id }, 200, { 'Cache-Control': 'no-store' });
    } catch (err) {
      return errorResponse(`Recalculation failed: ${String(err)}`, 500);
    }
  }

  // ── Index listing ────────────────────────────────────────────────────────
  if (indexOnly) {
    const index = await env.RECAPS.get('recap:index', 'json') as string[] | null;
    return jsonResponse(index ?? []);
  }

  // ── Specific week or latest ──────────────────────────────────────────────
  let targetKey: string;

  if (weekParam) {
    // Validate format: YYYY-wWW
    if (!/^\d{4}-w\d{2}$/.test(weekParam)) {
      return errorResponse('Invalid week format. Use YYYY-wWW (e.g., 2026-w16).');
    }
    targetKey = `recap:${weekParam}`;
  } else {
    // Fetch the latest pointer
    const latestId = await env.RECAPS.get('recap:latest');
    if (!latestId) {
      return errorResponse('No recap available yet.', 404);
    }
    targetKey = `recap:${latestId}`;
  }

  const raw = await env.RECAPS.get(targetKey);
  if (!raw) {
    return errorResponse('Recap not found.', 404);
  }

  const recap = JSON.parse(raw) as WeeklyRecap;

  if (summaryOnly) {
    return jsonResponse(toSummary(recap));
  }

  return jsonResponse(recap);
};

// ─── OPTIONS (CORS preflight) ─────────────────────────────────────────────────
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
};
