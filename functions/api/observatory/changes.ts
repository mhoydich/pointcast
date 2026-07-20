/**
 * GET /api/observatory/changes — the Observatory change feed.
 *
 * Every scan is diffed against the previous one; the interesting deltas
 * ("nytimes.com added /llms.txt", "score 40 → 60") land here, newest first.
 *
 * Query parameters:
 *   ?limit=50       — max events returned (default 100, cap 500)
 *   ?domain=x.com   — only events for one domain
 *
 * Pretty alias: /agent-observatory/changes.json (302 in public/_redirects).
 * RSS twin: /api/observatory/rss.
 */

import { type Env, KEY_EVENTS, jsonResponse, kvUnbound, corsPreflight } from './_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') ?? '100', 10) || 100));
  const domain = url.searchParams.get('domain')?.toLowerCase() ?? null;

  if (!env.OBSERVATORY) {
    return kvUnbound({ events: [], count: 0 });
  }

  let events = ((await env.OBSERVATORY.get(KEY_EVENTS, 'json')) as Array<Record<string, any>> | null) ?? [];
  if (domain) events = events.filter((e) => e.domain === domain);
  events = events.slice(0, limit);

  return jsonResponse({ ok: true, count: events.length, events });
};

export const onRequestOptions = corsPreflight;
