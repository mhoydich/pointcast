import type { APIRoute } from 'astro';

const payload = {
  name: 'PointCast 3D Drum Room',
  canonical: 'https://pointcast.xyz/drum-room',
  inviteShape: 'https://pointcast.xyz/drum-room?room={lowercase-room-code}',
  websocket: 'wss://pointcast.xyz/api/drum/room?room={room-code}&sid={client-uuid}',
  stats: 'https://pointcast.xyz/api/drum/room?room={room-code}&stats=1',
  protocolVersion: 1,
  targetConcurrentVisitors: 100,
  capacity: 125,
  privacy: 'Anonymous room identity derived from a browser-local UUID. No account, wallet, microphone, or personal profile required.',
  messageTypes: {
    client: ['hit', 'reaction', 'ping', 'sync'],
    server: ['welcome', 'presence', 'hit', 'reaction', 'pong', 'rate-limit', 'busy', 'error'],
  },
  pads: ['kick', 'snare', 'hat', 'tom', 'clap', 'bell'],
  reactions: ['⚡', '✦', '♥', '☻', '🔥', '🪩'],
  clientRendering: ['Three.js room with CSS fallback', 'Web Audio synthesis', 'adaptive remote-event gain', 'prefers-reduced-motion support'],
  server: ['Cloudflare Durable Object per room', 'WebSocket Hibernation API', 'SQLite room totals and recent hits', 'bounded 512-byte client frames', '8 messages per second per connection'],
  license: 'CC0-flavored PointCast surface',
};

export const GET: APIRoute = () => new Response(JSON.stringify(payload, null, 2), {
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
