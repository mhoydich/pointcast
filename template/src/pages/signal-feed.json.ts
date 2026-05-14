/**
 * /signal-feed.json — empty event stream by default.
 *
 * Push events into the array as your node accumulates them:
 *   - block_published when you publish a new entry
 *   - room_opened / room_closed for time-locked rooms
 *   - verb_fired when a write-back lands
 *   - federation_subscribed when you add a neighbor node
 *   - ship_landed for feature work
 *
 * See https://pointcast.xyz/signal-contract/v1.json for the full kinds.
 */
import type { APIRoute } from 'astro';
import {
  SIGNAL_CONTRACT_SCHEMA,
  validateSignalFeed,
  type SignalEvent,
} from '../lib/signal-contract';

const NODE_ID = 'your-node';

export const GET: APIRoute = async () => {
  const events: SignalEvent[] = [
    // Replace this with your own events.
    {
      id: 'room_welcome_open',
      at: new Date().toISOString(),
      kind: 'room_opened',
      nodeId: NODE_ID,
      room: 'welcome',
      headline: 'The welcome room is open',
      href: '/r/welcome',
    },
  ];

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
