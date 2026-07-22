import type { APIRoute } from 'astro';

const payload = {
  name: 'PointCast 3D Drum Party V2',
  canonical: 'https://pointcast.xyz/drum-room-v2',
  inviteShape: 'https://pointcast.xyz/drum-room-v2?room={lowercase-room-code}',
  websocket: 'wss://pointcast.xyz/api/drum/room?room={room-code}&sid={client-uuid}',
  stats: 'https://pointcast.xyz/api/drum/room?room={room-code}&stats=1',
  protocolVersion: 1,
  targetConcurrentVisitors: 100,
  capacity: 125,
  privacy: 'Anonymous room identity derived from a browser-local UUID. Sculpted terrain is stored only in this browser and room.',
  interaction: {
    tapWater: 'Drop a ripple',
    longPressWater: 'Begin sculpting the ocean floor',
    dragWhileHeld: 'Dig a pool or raise a ridge',
    terrainOptics: 'Ripple fronts bend, change speed, and focus around the local terrain height gradient',
  },
  partySystems: ['collaborative four-hit crowd quests', 'personal combo counter', 'room hype meter', 'six-hit party fill', 'three water-and-light vibes'],
  pads: ['kick', 'snare', 'hat', 'tom', 'clap', 'bell'],
  reactions: ['✦', '♥', '🔥', '🪩'],
  clientRendering: ['Three.js ocean and terrain', 'WebGL ripple shader with eight concurrent liquid lenses', 'Web Audio synthesis', 'adaptive remote-event gain', 'prefers-reduced-motion support'],
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
