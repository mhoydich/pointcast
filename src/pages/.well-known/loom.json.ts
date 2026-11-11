/**
 * /.well-known/loom.json — the Loom federation manifest.
 *
 * A site that publishes this file says "my pages have threads on a Loom, and
 * here is where to read and append them". PointCast hosts the relay Loom for
 * its family of sites; another site can publish the same shape pointing at
 * its own endpoint, or at ours.
 */
import { SPEC } from '../../lib/loom/service.mjs';
import { NETWORK } from '../../lib/loom/address.mjs';

export const GET = () => new Response(JSON.stringify({
  spec: SPEC,
  site: 'https://pointcast.xyz',
  role: 'relay',
  endpoint: 'https://pointcast.xyz/api/loom',
  card: 'https://pointcast.xyz/loom.json',
  room: 'https://pointcast.xyz/loom',
  embed: 'https://pointcast.xyz/loom/embed.js',
  formats: ['application/json', 'application/activity+json', 'application/rss+xml'],
  thread: 'https://pointcast.xyz/api/loom?to={url-encoded address}',
  relayFor: NETWORK.map((n) => n.host),
  acceptsAnyAddress: true,
}, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
});
