/**
 * /signal-feed.atom.xml — RSS-compatible Atom feed of node events.
 *
 * Sprint 9 of the live-artifacts arc. Universal subscriber format —
 * works in any RSS/Atom reader (Feedly, NetNewsWire, Inoreader, raw
 * curl, ...). Generates from the same SignalEvent stream that powers
 * /signal-feed.json.
 *
 * Subscribers can poll this URL with `<link rel="alternate"
 * type="application/atom+xml">` discovery from the homepage.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sortAndCap, type SignalEvent } from '../lib/signal-contract';
import { toAtomFeed } from '../lib/bridges';
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
      payload: { channel: b.data.channel },
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
      payload: { ref: s.ref, tag: s.tag },
    });
  }

  return events;
}

export const GET: APIRoute = async () => {
  const all = await buildEvents();
  const events = sortAndCap(all, 50);

  const xml = toAtomFeed({
    nodeId: NODE_ID,
    nodeHome: NODE_HOME,
    title: 'PointCast — signal feed',
    description: 'Block publishes, room lifecycle, ships, and federation events from the El Segundo node.',
    generatedAt: new Date().toISOString(),
    events,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
