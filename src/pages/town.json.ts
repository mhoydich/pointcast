/**
 * /town.json — machine-readable map manifest for /town.
 *
 * One JSON file lists every building (= every PointCast surface) on the
 * iso map. Same structure agents would use to build their own town view
 * or to drive an MCP tool over the surfaces.
 */
import type { APIRoute } from 'astro';

const TOWN = [
  { gx: 0, gy: 0, name: 'Lighthouse',       href: '/beacon',       glyph: '☼', category: 'civic',    note: 'beacon · the lighthouse signal' },
  { gx: 1, gy: 0, name: 'Broadcast Tower',  href: '/tv',           glyph: '📡', category: 'civic',    note: 'tv · 15 geo-stations within 100mi' },
  { gx: 2, gy: 0, name: 'Library',          href: '/archive',      glyph: '📚', category: 'civic',    note: 'archive · every block ever' },
  { gx: 3, gy: 0, name: 'Mailbox',          href: '/wire',         glyph: '✉', category: 'civic',    note: 'wire · global news desk' },

  { gx: 0, gy: 1, name: 'Town Hall',        href: '/residents',    glyph: '⌂', category: 'civic',    note: 'residents · plus-one agents' },
  { gx: 1, gy: 1, name: 'Drum Hall',        href: '/drum',         glyph: '♪', category: 'play',     note: 'drum · 11 surfaces + lounge sax' },
  { gx: 2, gy: 1, name: 'Café',             href: '/coffee',       glyph: '☕', category: 'commerce', note: 'coffee · mintable mugs FA2' },
  { gx: 3, gy: 1, name: 'Gallery',          href: '/gallery',      glyph: '◇', category: 'play',     note: 'gallery · curated visual blocks' },

  { gx: 0, gy: 2, name: 'Agent Gate',       href: '/api/mcp',      glyph: '◉', category: 'agent',    note: 'mcp · agent door · JSON-RPC 2.0' },
  { gx: 1, gy: 2, name: 'Workbench',        href: '/workbench',    glyph: '⚒', category: 'civic',    note: 'workbench · what is being built' },
  { gx: 2, gy: 2, name: 'Garden',           href: '/garden-yield', glyph: '🌱', category: 'nature',   note: 'garden · native planting kits' },
  { gx: 3, gy: 2, name: 'Boardwalk',        href: '/walk',         glyph: '〰', category: 'nature',   note: 'walk · daily ritual loop' },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/town',
    name: 'PointCast · /town',
    version: '0.1.0',
    description:
      'Pixel-art isometric map of PointCast. Every building is a real PointCast surface; every visitor is a Noun-head sprite walking between them. Drum Hall pulses on live drum activity.',
    canonical: 'https://pointcast.xyz/town',
    grid: { cols: 4, rows: 3, tileWidth: 96, tileHeight: 48 },
    buildings: TOWN.map((b) => ({
      ...b,
      url: `https://pointcast.xyz${b.href}`,
    })),
    presenceSource: 'https://pointcast.xyz/api/presence/snapshot',
    soundsSource:   'https://pointcast.xyz/api/sounds',
    agentDoor:      'https://pointcast.xyz/api/mcp',
    note: 'For an agent: poll presenceSource every 4s for visitors, soundsSource every 1.5s for drum events, fetch /agents.json for the full surface map.',
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
