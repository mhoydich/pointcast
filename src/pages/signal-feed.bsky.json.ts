/**
 * /signal-feed.bsky.json — ready-to-post Bluesky records.
 *
 * Sprint 9 of the live-artifacts arc. Each entry is a fully-formed
 * `app.bsky.feed.post` record with embed + facets. A cron worker
 * picks the latest unseen ones (dedupe by `event.id`) and submits
 * them via the ATProto `com.atproto.repo.createRecord` endpoint.
 *
 * The worker isn't in this repo — see docs/bridges.md for the spec
 * Codex will implement on the Polygon/Cloudflare side.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortAndCap, type SignalEvent } from '../lib/signal-contract';
import { toBlueskyRecord, bridgeableEvents } from '../lib/bridges';
import recentShipsData from '../data/recent-ships.json';

const NODE_ID = 'pointcast';
const NODE_HOME = 'https://pointcast.xyz';

interface ShipRow {
  ref: string;
  title: string;
  href: string;
  tag: string;
  at: string;
}

async function buildEvents(): Promise<SignalEvent[]> {
  const events: SignalEvent[] = [];
  const blocks = await getCollection('blocks', ({ data }) => !data.draft);
  for (const b of blocks) {
    events.push({
      id: `blk_${b.data.id}`,
      at: new Date(b.data.timestamp).toISOString(),
      kind: 'block_published',
      nodeId: NODE_ID,
      headline: b.data.title,
      href: `/b/${b.data.id}`,
    });
  }
  const ships = (recentShipsData as { ships: ShipRow[] }).ships;
  for (const s of ships) {
    events.push({
      id: `ship_${s.ref.replace(/[#/]/g, '')}`,
      at: new Date(s.at).toISOString(),
      kind: 'ship_landed',
      nodeId: NODE_ID,
      headline: s.title,
      href: s.href,
    });
  }
  return events;
}

export const GET: APIRoute = async () => {
  const all = bridgeableEvents(await buildEvents());
  const events = sortAndCap(all, 50);

  const records = events
    .map((e) => {
      const record = toBlueskyRecord(e, NODE_HOME);
      if (!record) return null;
      return { eventId: e.id, record };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const payload = {
    $schema: 'https://pointcast.xyz/bridge-bsky/v1.json',
    nodeId: NODE_ID,
    network: 'atproto.bsky',
    generatedAt: new Date().toISOString(),
    note:
      'Each record is a fully-formed app.bsky.feed.post. A cron worker submits them to com.atproto.repo.createRecord and dedupes against eventId.',
    count: records.length,
    records,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
