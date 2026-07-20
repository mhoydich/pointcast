/**
 * GET /api/observatory/rss — RSS 2.0 feed of Observatory change events.
 *
 * One <item> per change: adoptions, removals, score moves, robots flips,
 * new census rows. Subscribe to watch the agent-readable web grow without
 * polling the JSON. Pretty alias: /agent-observatory/changes.rss.
 */

import { type Env, KEY_EVENTS } from './_lib';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function itemTitle(e: Record<string, any>): string {
  if (e.kind === 'score-changed') return `${e.domain} score ${e.prevScore} → ${e.newScore}`;
  return `${e.domain} — ${e.detail ?? e.kind}`;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const events = env.OBSERVATORY
    ? (((await env.OBSERVATORY.get(KEY_EVENTS, 'json')) as Array<Record<string, any>> | null) ?? []).slice(0, 50)
    : [];

  const items = events
    .map(
      (e) => `
    <item>
      <title>${xmlEscape(itemTitle(e))}</title>
      <link>https://pointcast.xyz/api/observatory?domain=${encodeURIComponent(e.domain)}</link>
      <guid isPermaLink="false">observatory-${xmlEscape(String(e.domain))}-${xmlEscape(String(e.kind))}-${e.t}</guid>
      <pubDate>${new Date(e.t).toUTCString()}</pubDate>
      <description>${xmlEscape(String(e.detail ?? e.kind))}</description>
      <category>${xmlEscape(String(e.kind))}</category>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PointCast · Agent-Web Observatory changes</title>
    <link>https://pointcast.xyz/agent-observatory</link>
    <description>Daily census of the agent-readable web — llms.txt, agents.json, ai.json, agent-payments, AI robots stanzas, and feeds. New adoptions and score moves land here.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="https://pointcast.xyz/api/observatory/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
