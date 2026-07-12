/**
 * /signal-feed.farcaster.json — ready-to-post Farcaster casts.
 *
 * Sprint 9 of the live-artifacts arc. Each entry is a hub-API-shaped
 * cast. A cron worker picks the latest unseen ones (dedupe by
 * `event.id`) and submits via the hub's `submitMessage` endpoint
 * (FID + signer required).
 *
 * Cast bodies are capped at 320 bytes per the Farcaster spec; longer
 * headlines are trimmed in toFarcasterCast.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortAndCap, type SignalEvent } from '../lib/signal-contract';
import { toFarcasterCast, bridgeableEvents } from '../lib/bridges';
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

  const casts = events
    .map((e) => {
      const cast = toFarcasterCast(e, NODE_HOME);
      if (!cast) return null;
      return { eventId: e.id, cast };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const payload = {
    $schema: 'https://pointcast.xyz/bridge-farcaster/v1.json',
    nodeId: NODE_ID,
    network: 'farcaster',
    generatedAt: new Date().toISOString(),
    note:
      'Each cast is a hub-API submitMessage payload. Worker dedupes against eventId. Parent channel: https://pointcast.xyz.',
    count: casts.length,
    casts,
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
