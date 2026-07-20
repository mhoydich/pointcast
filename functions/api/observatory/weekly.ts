/**
 * GET /api/observatory/weekly — the Observatory's weekly rollup report.
 *
 * Written by the scanner Worker's Monday 16:00 UTC cron: adoption totals,
 * average/median scores, top ten, biggest movers, new census rows.
 *
 * Query parameters:
 *   (none)          — latest rollup
 *   ?week=2026-w30  — a specific week
 *   ?index=true     — list of available week ids, newest first
 *
 * Pretty alias: /agent-observatory/weekly.json (302 in public/_redirects).
 */

import { type Env, jsonResponse, errorResponse, kvUnbound, corsPreflight } from './_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const weekParam = url.searchParams.get('week');
  const indexOnly = url.searchParams.get('index') === 'true';

  if (!env.OBSERVATORY) {
    return kvUnbound(indexOnly ? { weeks: [] } : { rollup: null });
  }

  if (indexOnly) {
    const weeks = ((await env.OBSERVATORY.get('obs:weekly:index', 'json')) as string[] | null) ?? [];
    return jsonResponse({ ok: true, weeks });
  }

  let targetWeek = weekParam;
  if (targetWeek) {
    if (!/^\d{4}-w\d{2}$/.test(targetWeek)) {
      return errorResponse('Invalid week format. Use YYYY-wWW (e.g., 2026-w30).');
    }
  } else {
    targetWeek = await env.OBSERVATORY.get('obs:weekly:latest');
    if (!targetWeek) return kvUnbound({ rollup: null, note: 'No rollup yet — the first Monday cron has not fired.' });
  }

  const rollup = await env.OBSERVATORY.get(`obs:weekly:${targetWeek}`, 'json');
  if (!rollup) return errorResponse('Rollup not found for that week.', 404);

  return jsonResponse({ ok: true, rollup });
};

export const onRequestOptions = corsPreflight;
