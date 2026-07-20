/**
 * GET /api/observatory — the Agent-Web Observatory census.
 *
 * Query parameters:
 *   (none)          — full census: every roster domain with score + surfaces,
 *                     leaderboard-ordered (score desc, then domain).
 *   ?domain=x.com   — one domain's full scan record incl. probe detail
 *                     and score history.
 *   ?sort=domain    — census ordered alphabetically instead of by score.
 *
 * Pretty alias: /agent-observatory.json (302 in public/_redirects).
 * Data producer: workers/observatory/ (hourly cron). Methodology:
 * https://pointcast.xyz/agent-observatory
 */

import { type Env, KEY_INDEX, domainKey, jsonResponse, errorResponse, kvUnbound, corsPreflight } from './_lib';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const domainParam = url.searchParams.get('domain');
  const sort = url.searchParams.get('sort') ?? 'score';

  if (!env.OBSERVATORY) {
    return kvUnbound({ domains: [], count: 0, note: 'Census not yet provisioned — bind OBSERVATORY KV.' });
  }

  if (domainParam) {
    if (!/^[a-z0-9.-]{3,253}$/i.test(domainParam)) {
      return errorResponse('Invalid domain.');
    }
    const record = await env.OBSERVATORY.get(domainKey(domainParam.toLowerCase()), 'json');
    if (!record) return errorResponse('Domain not in the census.', 404);
    return jsonResponse({ ok: true, domain: record });
  }

  const index = ((await env.OBSERVATORY.get(KEY_INDEX, 'json')) as Array<Record<string, any>> | null) ?? [];
  const domains = [...index].sort((a, b) =>
    sort === 'domain' ? String(a.domain).localeCompare(String(b.domain)) : b.score - a.score || String(a.domain).localeCompare(String(b.domain)),
  );

  return jsonResponse({
    ok: true,
    name: 'Agent-Web Observatory',
    methodology: 'https://pointcast.xyz/agent-observatory',
    changes: 'https://pointcast.xyz/api/observatory/changes',
    weekly: 'https://pointcast.xyz/api/observatory/weekly',
    rss: 'https://pointcast.xyz/api/observatory/rss',
    count: domains.length,
    domains,
  });
};

export const onRequestOptions = corsPreflight;
