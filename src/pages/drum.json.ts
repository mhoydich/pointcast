import type { APIRoute } from 'astro';
import { drumRooms } from '../data/drum-rooms';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'PointCast Drum Room',
  canonical_url: 'https://pointcast.xyz/drum',
  description: 'Highlighted rooms in the PointCast multiplayer drum hub.',
  counts: {
    rooms: drumRooms.length,
  },
  rooms: drumRooms.map((room) => ({
    ...room,
    url: `https://pointcast.xyz/${room.slug}`,
  })),
  live: {
    sounds: 'https://pointcast.xyz/api/sounds',
    room: 'https://pointcast.xyz/api/drum/room',
    leaderboard: 'https://pointcast.xyz/api/drum/top',
  },
  participation: {
    agent_hall: 'https://pointcast.xyz/drum-agents',
    mcp: 'https://pointcast.xyz/mcp',
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  },
});

