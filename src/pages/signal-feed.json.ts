/**
 * /signal-feed.json — the canonical event stream for this node.
 *
 * Sprint 4 of the live-artifacts arc. Aggregates signals from existing
 * data sources (blocks, ships, federation events) into one ordered feed,
 * newest first. Capped at 200 events.
 *
 * pointcast.xyz is statically built, so this endpoint emits the full
 * window at build time. Consumers filter client-side with the helpers
 * exported from src/lib/signal-contract.ts:
 *
 *   import { applyFilter, sortAndCap } from '/src/lib/signal-contract';
 *   const blocks = applyFilter(feed.events, { kinds: ['block_published'] });
 *   const lastHour = applyFilter(feed.events, { sinceMs: 60*60_000 });
 *   const meditate = applyFilter(feed.events, { room: 'meditate' });
 *
 * When the edge function lands (future sprint), it will replace this
 * handler with a server-side filtered variant supporting ?kinds=, ?room=,
 * ?since=, ?limit= query params. Consumers won't need to change — the
 * shape is identical, just smaller.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  SIGNAL_CONTRACT_SCHEMA,
  sortAndCap,
  validateSignalFeed,
  type SignalEvent,
} from '../lib/signal-contract';
import recentShipsData from '../data/recent-ships.json';

const NODE_ID = 'pointcast';
const FEED_CAP = 200;

interface ShipRow {
  ref: string;
  title: string;
  href: string;
  tag: string;
  at: string;
}

async function buildEvents(): Promise<SignalEvent[]> {
  const events: SignalEvent[] = [];

  // block_published — one event per published content block.
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

  // ship_landed — one event per feature PR captured in recent-ships.json.
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

  // room_opened — meditation room's "always open" marker. Future room
  // lifecycle PRs (e.g. /sunset's magic-hour gate emitting open/close at
  // 17:30 and 20:30) push real events here via a build-time hook.
  events.push({
    id: 'room_meditate_open',
    at: new Date('2025-01-14T12:00:00Z').toISOString(),
    kind: 'room_opened',
    nodeId: NODE_ID,
    room: 'meditate',
    headline: 'The meditation room is open',
    href: '/r/meditate',
  });

  // federation_subscribed — self-federation from Sprint 3.
  events.push({
    id: 'fed_pointcast_self',
    at: new Date('2026-05-14T10:00:00Z').toISOString(),
    kind: 'federation_subscribed',
    nodeId: NODE_ID,
    headline: 'PointCast subscribed to itself (federation demo)',
    href: '/r/federation/demo',
    payload: { remoteNodeId: 'pointcast', kind: 'self' },
  });

  return events;
}

export const GET: APIRoute = async () => {
  const all = await buildEvents();
  const events = sortAndCap(all, FEED_CAP);

  const feed = validateSignalFeed({
    $schema: SIGNAL_CONTRACT_SCHEMA,
    nodeId: NODE_ID,
    generatedAt: new Date().toISOString(),
    count: events.length,
    events,
  });

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
