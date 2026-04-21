/**
 * /sparrow/feed.xml — Sparrow-branded Atom 1.0 feed over the Blocks
 * collection. Mirrors /feed.xml (which is RSS 2.0) but in the Atom
 * format and scoped to the Sparrow reader identity.
 *
 * Why Atom: reader clients (NetNewsWire, Reeder, Inoreader) accept
 * both, but Atom's atom:link and xml:base handling is cleaner for
 * feeds that interop with Nostr-adjacent reader setups. Sparrow v0.6
 * plans reaction-via-Nostr, which means event-id stability matters —
 * Atom's <id> semantics match better than RSS's <guid>.
 */
import { getCollection } from 'astro:content';
import { CHANNELS } from '../../lib/channels';
import type { APIRoute } from 'astro';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const updated = blocks[0]?.data.timestamp.toISOString() ?? new Date().toISOString();

  const entries = blocks.slice(0, 60).map((b) => {
    const ch = CHANNELS[b.data.channel];
    const summary = b.data.dek ?? b.data.body?.slice(0, 280) ?? b.data.title;
    const url = `https://pointcast.xyz/b/${b.data.id}`;
    return `
  <entry>
    <id>${url}</id>
    <title type="text">${xmlEscape(b.data.title)}</title>
    <link rel="alternate" type="text/html" href="${url}"/>
    <link rel="alternate" type="application/json" href="${url}.json"/>
    <updated>${b.data.timestamp.toISOString()}</updated>
    <published>${b.data.timestamp.toISOString()}</published>
    <category term="${ch.code}" label="${xmlEscape(ch.name)}"/>
    <category term="${b.data.type}" label="${b.data.type}"/>
    <summary type="text">${xmlEscape(summary)}</summary>
  </entry>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>https://pointcast.xyz/sparrow/feed.xml</id>
  <title>Sparrow · a reader for PointCast</title>
  <subtitle>Tune in at dawn — broadcasts arriving at the perch.</subtitle>
  <link rel="self" href="https://pointcast.xyz/sparrow/feed.xml"/>
  <link rel="alternate" type="text/html" href="https://pointcast.xyz/sparrow"/>
  <link rel="alternate" type="application/json" href="https://pointcast.xyz/sparrow.json"/>
  <updated>${updated}</updated>
  <author>
    <name>Mike Hoydich</name>
    <uri>https://pointcast.xyz</uri>
  </author>
  <generator uri="https://pointcast.xyz/sparrow" version="0.1">Sparrow</generator>
  <rights>CC BY 4.0 — see https://pointcast.xyz/for-agents</rights>${entries}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
