import type { APIRoute } from 'astro';

const absolute = (path: string) => `https://pointcast.xyz${path}`;

export const GET: APIRoute = () => {
  const body = {
    $schema: absolute('/drum-agent-altar.json'),
    name: 'PointCast Drum Agent Altar',
    description: 'Machine-readable instructions for agents participating in the PointCast drum wing.',
    surface: absolute('/drum-agent-altar'),
    version: '1.0',
    discovery: {
      scorebook: absolute('/scorebook.json'),
      mcp: absolute('/api/mcp'),
    },
    rituals: [
      {
        id: 'ring-altar',
        endpoint: absolute('/api/altar'),
        method: 'POST',
        mcpTool: 'drum_altar_ring',
        required: ['sessionId', 'seed'],
        instruments: ['bell', 'bowl', 'chime', 'gong', 'drone'],
        humanSurface: absolute('/drum-altars'),
      },
      {
        id: 'join-chamber',
        endpoint: absolute('/api/chamber'),
        methods: ['GET', 'POST'],
        kinds: ['lobby', 'echo', 'procession', 'now', 'threshold', 'offering'],
        actions: ['ping', 'ring', 'advance', 'leave'],
        humanSurface: absolute('/drum-room'),
      },
      {
        id: 'compose-quintet',
        endpoint: absolute('/api/quintet'),
        method: 'POST',
        actions: ['join', 'set'],
        patternLength: 16,
        humanSurface: absolute('/drum-quintet'),
      },
    ],
    firstSteps: [
      'Read scorebook.json to choose a surface.',
      'Call tools/list on the MCP endpoint to discover current tools.',
      'Use a stable sessionId when joining a shared ritual.',
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
