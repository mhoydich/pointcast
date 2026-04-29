/**
 * /api/mcp — Model Context Protocol server for PointCast.
 *
 * v0.1.0 (per Mike: "lets mcp drum")  — drum-hub-only, 9 tools.
 * v0.2.0 (per Mike: "1 and 4 and 6")  — whole-site coverage.
 * v0.3.0 (per Mike: "links people can add is the priority and then need
 *                                       apps in the client") — connector
 *                                       links + app catalog tools.
 * v0.4.0 (per Mike: "something for the agents to do") — Nouns Nation
 *                                       Battler agent tasks + manifest
 *                                       handoff.
 * v0.5.0 — Nouns Nation Battler result tracking + Claude/Cowork
 *          scorebook briefs from Desk Wall snapshots and recap text.
 * v0.6.0 — Battler claim queue with timeboxed watch, MCP, creative,
 *          design, audience, and QA task packs.
 * v0.7.0 — Battler Agent Sideline Desk, asset factory, business model,
 *          and participant rewards draft for visiting agents.
 *
 * Any MCP-aware agent (Claude custom connectors, Claude Desktop, Cursor,
 * Claude Code, ChatGPT-style app clients, etc.) can connect over JSON-RPC
 * 2.0 / HTTP and operate the entire PointCast surface — connector links,
 * app shelf, drum hub, presence, blocks, channels, mintables, weather,
 * town map, contracts. Spec:
 * https://modelcontextprotocol.io
 *
 * Transport: stateless POST JSON-RPC 2.0. SSE streaming optional later.
 *
 * Drum-hub tools (v0.1.0)
 *   drum_list_rooms       (no input)   list every /drum* surface
 *   drum_who_is_here      (no input)   active visitors from /api/visit
 *   drum_top_drummers     (no input)   leaderboard from /api/drum/top
 *   drum_now_playing      (no input)   current Spotify track in v3
 *   drum_global_count     (no input)   global cumulative drum count
 *   drum_tap              (no input)   tap a drum on /drum (v1 classic)
 *   drum_play_instrument  ({inst})     fire a v4/v7 orchestra instrument
 *   drum_sing_voice       ({voice})    fire a v6 choir voice
 *   drum_set_track        ({trackId})  set the v3 room Spotify track
 *
 * Whole-site tools
 *   town_map              (no input)   12-building iso town map
 *   surfaces_list         (no input)   every URL grouped by category
 *   presence_snapshot     (no input)   who is here right now
 *   now_snapshot          (no input)   live system snapshot
 *   today_highlights      (no input)   curated day strip
 *   blocks_recent         ({limit})    latest blocks across channels
 *   block_read            ({id})       read one block by 4-digit id
 *   blocks_by_channel     ({channel})  recent blocks in a channel
 *   blocks_search         ({q})        full-text search blocks
 *   local_snapshot        (no input)   100-mile El Segundo lens
 *   weather_get           ({station})  station weather
 *   editions_summary      (no input)   mintables overview
 *   contracts_status      (no input)   live Tezos contract addresses
 *   channels_list         (no input)   9 channels with codes/slugs
 *   agents_manifest       (no input)   full /agents.json
 *   connector_links       (no input)   addable MCP links for AI clients
 *   apps_list             (no input)   PointCast app shelf for clients
 *   nouns_battler_manifest (no input)  Nouns Nation Battler manifest
 *   nouns_battler_agent_tasks ({taskId?, role?, lane?}) visiting-agent tasks
 *   nouns_battler_asset_factory ({assetType?, gang?, tone?}) asset/business kit
 *   nouns_battler_presence (no input)  anonymous presence instructions
 *   nouns_battler_result_tracker ({snapshotUrl?, snapshotJson?, recapText?, view?})
 *                                       parse/track Battler results
 *   nouns_battler_cowork_brief ({focus?}) Claude/Cowork scorebook kit
 *
 * Resources
 *   drum://rooms          markdown list of all drum surfaces
 *   drum://now-playing    current room track
 *   drum://leaderboard    top 10 drummers
 *   drum://schema         /api/sounds event schema
 *   pointcast://map       iso town map (mirror of /town.json)
 *   pointcast://now       /now.json
 *   pointcast://feed      latest 20 blocks (JSON Feed 1.1)
 *   pointcast://contracts live Tezos contracts
 *   pointcast://channels  9 PointCast channels
 *   pointcast://connectors addable MCP connector links
 *   pointcast://apps      PointCast app shelf
 *   nouns-battler://agent-bench  task board for visiting agents
 *   nouns-battler://manifest     Battler game manifest
 *   nouns-battler://results-kit  result tracking schema + prompts + watch frames
 *   nouns-battler://asset-factory asset, business, and rewards model
 *
 * Discovery
 *   GET /api/mcp returns an HTML discovery page with config snippets.
 *   POST /api/mcp speaks JSON-RPC.
 *   OPTIONS /api/mcp returns CORS headers.
 *
 * Per docs/mcp/pointcast-drum.md.
 */

import {
  NOUNS_BATTLER_AGENT_BENCH,
  buildNounsBattlerAssetBrief,
  filterNounsBattlerAgentTaskPacks,
  filterNounsBattlerAgentTasks,
  findNounsBattlerAgentTaskPack,
  findNounsBattlerAgentTask,
} from '../../src/lib/nouns-battler-agent-bench';
import type { Env } from './visit';

const MCP_PROTOCOL_VERSION = '2025-06-18';
const SERVER_NAME = 'pointcast';
const SERVER_VERSION = '0.7.0';
const V2_SERVER_NAME = 'pointcast-v2';
const V2_SERVER_VERSION = '2.3.0';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type, Last-Event-ID, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
};

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;
const WRITE_TOOL_NAMES = new Set([
  'drum_tap',
  'drum_play_instrument',
  'drum_sing_voice',
  'drum_set_track',
]);

function toolTitle(name: string): string {
  return name
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toolAnnotations(name: string) {
  const isWrite = WRITE_TOOL_NAMES.has(name);
  return {
    title: toolTitle(name),
    readOnlyHint: !isWrite,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  };
}

// ── Tool catalogue ────────────────────────────────────────────────────
// Each tool has a name, description, and JSON-Schema input shape.
// Tools that take no arguments use `{ type: 'object', properties: {} }`.
const TOOL_DEFINITIONS = [
  {
    name: 'drum_list_rooms',
    description:
      'List every drum surface on PointCast — v1 classic, v2 collab, v3 spotify, v4 orchestra, v5 loops, v6 choir, v7 big, v8 symphony, v9 the lounge, plus apr26 sequencer, /drum-trophies (on-chain badges), /drum-tv (cast view), and /drum-tv-v2 (the venue).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_who_is_here',
    description:
      'Return the list of visitors currently present in the drum hub. Each entry has a pid (8-char anonymous identifier), nounId (pixel-art Nouns avatar id 0-1199), and type (human or bot).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_top_drummers',
    description:
      'Return the top 10 drummers by all-time tap count. Anonymized: each entry has rank, hash (8-char identity), nounId, and count.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_now_playing',
    description:
      'Return the current Spotify track set on /drum-v3 (the smooth-jazz drum-along surface). Returns null if no track is set.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_global_count',
    description:
      'Return the global cumulative drum count across every /drum* surface and every visitor since the room opened.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'drum_tap',
    description:
      'Tap the drum on /drum (v1 classic). Broadcasts to every connected visitor in real time. Use sparingly — humans hear every tap.',
    inputSchema: {
      type: 'object',
      properties: {
        combo: {
          type: 'number',
          description: 'Combo multiplier 1-5. 1 = single tap, 5 = on-fire combo. Default 1.',
          minimum: 1,
          maximum: 5,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'drum_play_instrument',
    description:
      'Fire one of the 12 orchestra instruments on /drum-v4 (or any of the 30 cells on /drum-v7). Broadcasts to every connected visitor.',
    inputSchema: {
      type: 'object',
      properties: {
        inst: {
          type: 'string',
          description:
            'Instrument key. v4 options: kick, snare, hihat, openhat, clap, tom, bass, lead, pad, bell, shaker, cymbal. v7 options include kick-sub, snare-deep, etc.',
        },
      },
      required: ['inst'],
      additionalProperties: false,
    },
  },
  {
    name: 'drum_sing_voice',
    description:
      'Sing one of the 12 choir voices on /drum-v6. Voices are tuned to a Cmaj9 chord stack so any combination is harmonically valid.',
    inputSchema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          description:
            'Voice key. Options: sop-c, sop-e, sop-g, sop-c2, alt-g, alt-c, alt-e, alt-g2, ten-c, ten-e, ten-g, ten-c2.',
        },
      },
      required: ['voice'],
      additionalProperties: false,
    },
  },
  {
    name: 'drum_set_track',
    description:
      'Set the Spotify track for the room on /drum-v3. Every connected visitor will load the same track. Track id is 22 base62 chars (e.g. 0vFOzaXqZHahrZp6enQwQb for Six Blade Knife by Dire Straits).',
    inputSchema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'Spotify track id — 22 alphanumeric characters.',
          pattern: '^[A-Za-z0-9]{22}$',
        },
      },
      required: ['trackId'],
      additionalProperties: false,
    },
  },

  // ── Whole-site tools ───────────────────────────────────────────────
  // Drum is a room. PointCast is the whole town. These tools open the
  // rest of the building list.
  {
    name: 'town_map',
    description: 'Get the iso town map — every building (= every PointCast surface), grid position, and URL. Mirror of /town.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'surfaces_list',
    description: 'List every PointCast surface — all human URLs grouped by category (content, rooms, agents, mints, play, meta).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'presence_snapshot',
    description: 'Live presence snapshot — who is on PointCast right now. Returns counts (humans, agents) + per-session noun ids and join times.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'now_snapshot',
    description: 'Live system snapshot — what is happening on PointCast right now. Mirror of /now.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'today_highlights',
    description: 'Today\'s curated highlights from /today — editorial day-strip.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'blocks_recent',
    description: 'Latest published blocks across all channels. Each block has id, title, dek, channel, type, timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'How many blocks to return (default 10).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'block_read',
    description: 'Read a single block by 4-digit id. Returns full body + companions + author.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[0-9]{4}$', description: '4-digit block id, e.g. "0379".' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'blocks_by_channel',
    description: 'Recent blocks in a specific channel. Channel codes: FD (Front Door), CRT (Court), SPN (Spinning), GF (Good Feels), GDN (Garden), ESC (El Segundo), FCT (Faucet), VST (Visit), BTL (Battler), BDY (Birthday).',
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel code OR slug (e.g. "FD" or "front-door").' },
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'Default 10.' },
      },
      required: ['channel'],
      additionalProperties: false,
    },
  },
  {
    name: 'blocks_search',
    description: 'Full-text search across all blocks (titles, deks, bodies). Returns top matches with id + title + matched snippet.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query.' },
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'Default 10.' },
      },
      required: ['q'],
      additionalProperties: false,
    },
  },
  {
    name: 'local_snapshot',
    description: 'El Segundo 100-mile lens — institutions, stations, local blocks, nature signals. Mirror of /local.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'weather_get',
    description: 'Local weather for an El Segundo-area station. Stations: el-segundo, manhattan-beach, hermosa, redondo-beach, venice, santa-monica, palos-verdes, long-beach, los-angeles, malibu, pasadena, anaheim-oc, newport-laguna, santa-barbara, north-san-diego, palm-springs.',
    inputSchema: {
      type: 'object',
      properties: {
        station: { type: 'string', description: 'Station slug. Default "el-segundo".' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'editions_summary',
    description: 'Every mintable on PointCast — live FA2s, planned, faucet daily. Mirror of /editions.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'contracts_status',
    description: 'Live Tezos contract addresses + origination status (Visit Nouns, Coffee Mugs, Window Snapshots, Drum Token, Prize Cast, Marketplace, Zen Cats).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'channels_list',
    description: 'Every PointCast channel (9 of them) — code, slug, name, purpose, color.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'agents_manifest',
    description: 'Full /agents.json — the consolidated manifest of every machine-readable surface.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'connector_links',
    description: 'List addable MCP connector links. Use this when a user asks what URL to paste into a custom connector client.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'apps_list',
    description: 'List PointCast apps for the client shelf: internal tools, satellite rooms, collectible consoles, and connector apps.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nouns_battler_manifest',
    description:
      'Return the Nouns Nation Battler manifest: game links, TV route, desk wall, battle types, season systems, brand kits, and agent-facing links.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nouns_battler_agent_tasks',
    description:
      'Return the Agent Bench task board and claim queue for visiting AI agents. Optional filters: taskId for one role prompt or claim-queue task, role for scout/host/commentator/art-director/designer/fan/qa/asset-producer/yield-designer, lane for watch/mcp/creative/design/verify/audience/assets/growth/economy.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Optional task id such as scout-current-slate, desk-read, scorekeeper-open-slate, or qa-public-circuit.' },
        role: {
          type: 'string',
          description: 'Optional role filter: scout, host, commentator, art-director, designer, fan, or qa.',
        },
        lane: {
          type: 'string',
          description: 'Optional claim queue lane filter: watch, mcp, creative, design, verify, audience, assets, growth, or economy.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_asset_factory',
    description:
      'Return a Nouns Nation Battler asset/business brief for agents creating posters, ads, art prompts, product concepts, sponsor reads, report cards, or participant rewards loops.',
    inputSchema: {
      type: 'object',
      properties: {
        assetType: {
          type: 'string',
          enum: ['poster', 'ad', 'art', 'product', 'sponsor-read', 'report-card'],
          description: 'Asset type to package. Default poster.',
        },
        gang: {
          type: 'string',
          description: 'Optional gang name such as Tomato Noggles, Cobalt Frames, or Mint Condition.',
        },
        tone: {
          type: 'string',
          description: 'Optional creative tone such as broadcast-riot, premium-sports, collector, or weird-but-legible.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_presence',
    description:
      'Return current PointCast presence plus the privacy-safe way for an agent to check into Nouns Nation Battler as kind=agent.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'nouns_battler_result_tracker',
    description:
      'Track Nouns Nation Battler results from a Desk Wall snapshot URL, raw snapshot JSON, or copied Recap Studio text. Returns standings, latest recaps, parsed final score, and Claude/Cowork cards.',
    inputSchema: {
      type: 'object',
      properties: {
        snapshotUrl: {
          type: 'string',
          description: 'Optional /nouns-nation-battler-desk/#snapshot=... or focused report-card URL.',
        },
        snapshotJson: {
          description: 'Optional raw Desk Wall snapshot JSON, either as an object or a JSON string.',
          oneOf: [{ type: 'object' }, { type: 'string' }],
        },
        recapText: {
          type: 'string',
          description: 'Optional copied Recap Studio, Commissioner Desk, or social post text.',
        },
        view: {
          type: 'string',
          enum: ['scorebook', 'cowork', 'share'],
          description: 'Output emphasis. scorebook is default.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'nouns_battler_cowork_brief',
    description:
      'Return an inventive Claude/Cowork brief for using Nouns Nation Battler as a live scorebook, color-commentary desk, commissioner room, group-chat host, or watch-frame guide.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          enum: ['scorekeeper', 'color-commentator', 'commissioner', 'group-chat-host', 'all'],
          description: 'Which Cowork mode to emphasize. Default all.',
        },
      },
      additionalProperties: false,
    },
  },
] as const;

const TOOLS = TOOL_DEFINITIONS.map((tool) => ({
  ...tool,
  annotations: toolAnnotations(tool.name),
}));

// ── Resources ────────────────────────────────────────────────────────
const RESOURCES = [
  {
    uri: 'drum://rooms',
    name: 'Drum Rooms',
    description: 'Markdown list of every /drum* surface with a one-line description.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'drum://now-playing',
    name: 'Now Playing',
    description: 'Current Spotify track set on /drum-v3 (or null).',
    mimeType: 'application/json',
  },
  {
    uri: 'drum://leaderboard',
    name: 'Leaderboard',
    description: 'Top 10 drummers by all-time tap count.',
    mimeType: 'application/json',
  },
  {
    uri: 'drum://schema',
    name: 'Event Schema',
    description: 'JSON schema for /api/sounds events used across all drum surfaces.',
    mimeType: 'application/json',
  },

  // ── Whole-site resources ───────────────────────────────────────────
  {
    uri: 'pointcast://map',
    name: 'Town Map',
    description: 'Iso town map (12 buildings → 12 surfaces). Mirror of /town.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://now',
    name: 'Now',
    description: 'Live system snapshot. Mirror of /now.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://feed',
    name: 'Feed',
    description: 'Latest 20 blocks (JSON Feed 1.1). Mirror of /feed.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://contracts',
    name: 'Contracts',
    description: 'Live Tezos contract addresses + status.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://channels',
    name: 'Channels',
    description: 'Every PointCast channel — code, slug, name, purpose.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://connectors',
    name: 'Connector Links',
    description: 'Addable MCP links for AI clients. Mirror of /connectors.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'pointcast://apps',
    name: 'Apps',
    description: 'PointCast app shelf. Mirror of /apps.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://agent-bench',
    name: 'Nouns Nation Battler Agent Bench',
    description: 'Task board and opt-in presence instructions for visiting agents.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://manifest',
    name: 'Nouns Nation Battler Manifest',
    description: 'Game manifest with links, league systems, battle types, and brand kits.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://results-kit',
    name: 'Nouns Nation Battler Results Kit',
    description: 'Result tracking schema, Cowork modes, watch-frame links, and prompts for scorebook-style agent work.',
    mimeType: 'application/json',
  },
  {
    uri: 'nouns-battler://asset-factory',
    name: 'Nouns Nation Battler Asset Factory',
    description: 'Sideline Desk asset types, business model, and participant rewards draft for agents creating useful artifacts.',
    mimeType: 'application/json',
  },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────
function rpcResult(id: number | string | null, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    headers: JSON_HEADERS,
  });
}
function rpcError(id: number | string | null, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), {
    headers: JSON_HEADERS,
  });
}
function originBase(req: Request): string {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}
function serverInfoFor(req: Request): { name: string; version: string } {
  const path = new URL(req.url).pathname;
  if (path.endsWith('/api/mcp-v2')) {
    return { name: V2_SERVER_NAME, version: V2_SERVER_VERSION };
  }
  return { name: SERVER_NAME, version: SERVER_VERSION };
}
async function callJson(url: string, init?: RequestInit): Promise<any> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`upstream ${r.status} ${url}`);
  return r.json();
}
function textContent(text: string): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text }] };
}

function base64UrlToUtf8(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function snapshotTokenFromUrl(value: string): string {
  const hash = value.includes('#') ? value.slice(value.indexOf('#') + 1) : value;
  const params = new URLSearchParams(hash);
  return params.get('snapshot') || '';
}

function parseJsonish(value: unknown): any | null {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function normalizeBattlerSnapshot(value: any): any | null {
  if (!value || typeof value !== 'object') return null;
  if (value.kind === 'nouns-nation-desk-snapshot' && value.league) return value;
  if (value.league) return { kind: 'nouns-nation-desk-snapshot', version: value.version || 1, league: value.league };
  if (value.table || value.recapCards || value.deskCards) {
    return { kind: 'nouns-nation-desk-snapshot', version: 1, league: value };
  }
  return null;
}

function snapshotFromArgs(args: Record<string, unknown>): { source: string; snapshot: any | null; error?: string } {
  const snapshotJson = parseJsonish(args.snapshotJson);
  if (snapshotJson) return { source: 'snapshotJson', snapshot: normalizeBattlerSnapshot(snapshotJson) };

  const snapshotUrl = String(args.snapshotUrl || '').trim();
  if (!snapshotUrl) return { source: 'empty', snapshot: null };

  const token = snapshotTokenFromUrl(snapshotUrl);
  if (!token) return { source: 'snapshotUrl', snapshot: null, error: 'snapshotUrl does not contain a snapshot hash parameter' };
  try {
    return { source: 'snapshotUrl', snapshot: normalizeBattlerSnapshot(JSON.parse(base64UrlToUtf8(token))) };
  } catch (err: any) {
    return { source: 'snapshotUrl', snapshot: null, error: `snapshotUrl could not be decoded: ${err?.message || String(err)}` };
  }
}

function standingsFromLeague(league: any): any[] {
  const table = league?.table || {};
  return Object.entries(table)
    .map(([name, row]: [string, any]) => ({
      name,
      wins: Number(row?.wins || 0),
      losses: Number(row?.losses || 0),
      pf: Number(row?.pf || 0),
      pa: Number(row?.pa || 0),
      diff: Number(row?.pf || 0) - Number(row?.pa || 0),
      fans: Number(row?.fans || 0),
      streak: Number(row?.streak || 0),
      last: String(row?.last || ''),
      challengeWins: Number(row?.challengeWins || 0),
      rivalryWins: Number(row?.rivalryWins || 0),
    }))
    .sort((a, b) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf || b.fans - a.fans || a.name.localeCompare(b.name));
}

function phaseFromLeague(league: any): string {
  if (!league) return 'No season snapshot loaded';
  const season = Number(league.seasonNumber || 1);
  if (league.phase === 'champion') return `Season ${season} champion: ${league.champion || 'pending'}`;
  if (league.phase === 'playoffs') {
    return Number(league.playoffSlot || 0) < 2
      ? `Season ${season} Nouns Bowl semifinal ${Number(league.playoffSlot || 0) + 1}`
      : `Season ${season} Nouns Bowl final`;
  }
  return `Season ${season} day ${Number(league.day || 0) + 1}, slate ${Number(league.slot || 0) + 1}`;
}

function parseRecapResult(text: string): any | null {
  const raw = text.trim().replace(/\s+/g, ' ');
  if (!raw) return null;
  const beat = raw.match(/(?:^|[:.]\s*)([A-Z][A-Za-z ]{1,42}|[A-Z]{2,3})\s+beat\s+([A-Z][A-Za-z ]{1,42}|[A-Z]{2,3}),?\s+(\d{1,2})\s*[-–]\s*(\d{1,2})/i);
  const final = raw.match(/Final\s+([^.]*)/i);
  const next = raw.match(/Next:\s*([^.]*)/i);
  const phase = raw.includes(':') ? raw.split(':')[0].trim() : 'Copied recap';
  if (beat) {
    return {
      phase,
      winner: beat[1].trim(),
      loser: beat[2].trim(),
      winnerScore: Number(beat[3]),
      loserScore: Number(beat[4]),
      final: `${beat[1].trim()} ${beat[3]}-${beat[4]} ${beat[2].trim()}`,
      next: next?.[1]?.trim() || '',
      raw,
    };
  }
  return {
    phase,
    final: final?.[1]?.trim() || '',
    next: next?.[1]?.trim() || '',
    raw,
  };
}

function coworkCardsFromResult(result: any): any[] {
  const leader = result.standings?.[0];
  const latest = result.latestRecaps?.[0];
  const parsed = result.parsedResult;
  return [
    {
      title: 'Scorekeeper',
      body: leader
        ? `${leader.name} lead the table at ${leader.wins}-${leader.losses}, ${leader.diff >= 0 ? '+' : ''}${leader.diff} differential, ${leader.fans} heat.`
        : parsed?.final
          ? `Latest final logged: ${parsed.final}.`
          : 'Waiting for a Desk Wall snapshot or recap text.',
    },
    {
      title: 'Broadcast Hook',
      body: latest?.headline || latest?.title || parsed?.final || result.summary,
    },
    {
      title: 'Next Watch',
      body: latest?.next || parsed?.next || 'Open the TV cast and run the next slate: https://pointcast.xyz/nouns-nation-battler-tv/',
    },
  ];
}

function buildBattlerResultTracker(args: Record<string, unknown>): any {
  const view = String(args.view || 'scorebook');
  const recapText = String(args.recapText || '').trim();
  const parsedResult = recapText ? parseRecapResult(recapText) : null;
  const loaded = snapshotFromArgs(args);
  const league = loaded.snapshot?.league || null;
  const standings = standingsFromLeague(league);
  const latestRecaps = Array.isArray(league?.recapCards) ? league.recapCards.slice(0, 5) : [];
  const phase = phaseFromLeague(league) || parsedResult?.phase || 'No season snapshot loaded';
  const leader = standings[0];
  const source = loaded.snapshot ? loaded.source : parsedResult ? 'recapText' : loaded.source;
  const summary = leader
    ? `${phase}. ${leader.name} lead ${leader.wins}-${leader.losses}; ${latestRecaps.length} recap card${latestRecaps.length === 1 ? '' : 's'} loaded.`
    : parsedResult?.final
      ? `${parsedResult.phase}: ${parsedResult.final}${parsedResult.next ? `; next ${parsedResult.next}` : ''}.`
      : 'No result artifact supplied yet. Pass snapshotUrl, snapshotJson, or recapText.';
  const record = {
    source,
    view,
    phase,
    summary,
    standings,
    latestRecaps,
    parsedResult,
    warning: loaded.error || undefined,
  };
  return {
    ...record,
    coworkCards: coworkCardsFromResult(record),
    nextPrompt: NOUNS_BATTLER_AGENT_BENCH.resultTracking.sharePrompt,
    acceptedInputs: NOUNS_BATTLER_AGENT_BENCH.resultTracking.inputs,
  };
}

// ── Tool dispatchers ──────────────────────────────────────────────────
async function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  base: string,
  sessionId: string,
): Promise<{ content: Array<{ type: string; text?: string }>; isError?: boolean }> {
  switch (name) {
    case 'drum_list_rooms': {
      const md = ROOMS_MARKDOWN;
      return textContent(md);
    }
    case 'drum_who_is_here': {
      const data = await callJson(`${base}/api/visit`);
      const present = Array.isArray(data?.present) ? data.present : [];
      const humans = present.filter((p: any) => p?.type === 'human' && p?.pid);
      const summary =
        humans.length === 0
          ? 'no humans present right now (the room is quiet)'
          : `${humans.length} human${humans.length === 1 ? '' : 's'} in the drum hub:\n` +
            humans
              .map(
                (p: any) =>
                  `  · pid ${p.pid?.slice(0, 8)} · noun #${p.nounId} · ${p.country || '—'}${p.city ? '/' + p.city : ''}`,
              )
              .join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify({ count: humans.length, humans }, null, 2) },
        ],
      };
    }
    case 'drum_top_drummers': {
      const data = await callJson(`${base}/api/drum/top`);
      const entries = Array.isArray(data?.entries) ? data.entries : [];
      const summary =
        entries.length === 0
          ? 'no drummers on the leaderboard yet'
          : 'top 10 drummers (anonymized):\n' +
            entries
              .map((e: any) => `  #${e.rank} · noun #${e.nounId} · ${e.count.toLocaleString()} drums (${e.hash})`)
              .join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(entries, null, 2) },
        ],
      };
    }
    case 'drum_now_playing': {
      const data = await callJson(`${base}/api/drum/track`);
      const t = data?.track;
      if (!t) return textContent('no track is set in the room right now (open /drum-v3 and paste a Spotify URL to set one)');
      return {
        content: [
          {
            type: 'text',
            text: `now playing: spotify track ${t.id} (set ${Math.round((Date.now() - (t.setAt || 0)) / 1000)}s ago by ${t.setBy})`,
          },
          { type: 'text', text: JSON.stringify(t, null, 2) },
        ],
      };
    }
    case 'drum_global_count': {
      const data = await callJson(`${base}/api/drum?sessionId=mcp-${sessionId}`);
      return textContent(
        `global drum count: ${(data?.globalTotal ?? 0).toLocaleString()} taps across every /drum* surface, every visitor, since the room opened`,
      );
    }
    case 'drum_tap': {
      const combo = Math.max(1, Math.min(5, Number(args.combo) || 1));
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'drum', seed: combo, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(`✓ tapped the drum (combo x${combo}) — broadcast to every visitor`);
    }
    case 'drum_play_instrument': {
      const inst = String(args.inst || '');
      if (!inst) return { content: [{ type: 'text', text: 'inst is required' }], isError: true };
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'orchestra', inst, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(`✓ played ${inst} — broadcast to every visitor on the orchestra surfaces`);
    }
    case 'drum_sing_voice': {
      const voice = String(args.voice || '');
      if (!voice) return { content: [{ type: 'text', text: 'voice is required' }], isError: true };
      await fetch(`${base}/api/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'choir', voice, sessionId: `mcp-${sessionId}` }),
      });
      return textContent(`✓ sang ${voice} — the choir surface picked it up`);
    }
    case 'drum_set_track': {
      const trackId = String(args.trackId || '');
      if (!SPOTIFY_ID_RE.test(trackId)) {
        return {
          content: [{ type: 'text', text: 'trackId must be 22 alphanumeric characters (Spotify track id)' }],
          isError: true,
        };
      }
      const r = await fetch(`${base}/api/drum/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, sessionId: `mcp-${sessionId}` }),
      });
      if (!r.ok) return { content: [{ type: 'text', text: `failed to set track (${r.status})` }], isError: true };
      return textContent(
        `✓ set the room track to spotify:track:${trackId}. open https://pointcast.xyz/drum-v3 to drum along.`,
      );
    }
    // ── Whole-site tool dispatch ─────────────────────────────────────
    case 'town_map': {
      const data = await callJson(`${base}/town.json`);
      return {
        content: [
          { type: 'text', text: `${data?.buildings?.length ?? 0} buildings on the iso town map. Click any URL below to enter that room:\n` +
            (data?.buildings || []).map((b: any) => `  · ${b.glyph} ${b.name} → ${b.url}`).join('\n') },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'surfaces_list': {
      const data = await callJson(`${base}/agents.json`);
      const human = data?.endpoints?.human || {};
      const json = data?.endpoints?.json || {};
      const lines = [
        `${Object.keys(human).length} human surfaces, ${Object.keys(json).length} JSON surfaces:`,
        '',
        '## human',
        ...Object.entries(human).map(([k, v]) => `  · ${k}: ${v}`),
        '',
        '## json',
        ...Object.entries(json).map(([k, v]) => `  · ${k}: ${v}`),
      ];
      return textContent(lines.join('\n'));
    }
    case 'presence_snapshot': {
      const data = await callJson(`${base}/api/presence/snapshot`);
      const sessions = data?.sessions || [];
      const summary = `${data?.humans ?? 0} humans, ${data?.agents ?? 0} agents on PointCast right now\n` +
        sessions.map((s: any) =>
          `  · noun #${s.nounId} · ${s.kind} · ${s.country || '—'}/${s.deviceClass || '—'} · joined ${s.joinedAt}`
        ).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'now_snapshot': {
      const data = await callJson(`${base}/now.json`);
      return {
        content: [
          { type: 'text', text: `now-snapshot — ${data?.generatedAt || 'live'}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'today_highlights': {
      const data = await callJson(`${base}/today.json`);
      return {
        content: [
          { type: 'text', text: `today on PointCast — ${data?.date || ''}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'blocks_recent': {
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 10));
      const data = await callJson(`${base}/feed.json`);
      const items = (data?.items || []).slice(0, limit);
      const summary = `latest ${items.length} blocks:\n` +
        items.map((it: any) => `  · ${it.id?.split('/').pop() || ''} · ${it.title} · ${it.date_published?.slice(0, 10)}`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(items, null, 2) },
        ],
      };
    }
    case 'block_read': {
      const id = String(args.id || '');
      if (!/^[0-9]{4}$/.test(id)) {
        return { content: [{ type: 'text', text: 'id must be 4 digits, e.g. "0379"' }], isError: true };
      }
      try {
        const data = await callJson(`${base}/b/${id}.json`);
        return {
          content: [
            { type: 'text', text: `block ${id} · ${data?.title || ''} (${data?.channel}/${data?.type}) · ${data?.timestamp}` },
            { type: 'text', text: JSON.stringify(data, null, 2) },
          ],
        };
      } catch {
        return { content: [{ type: 'text', text: `block ${id} not found` }], isError: true };
      }
    }
    case 'blocks_by_channel': {
      const channel = String(args.channel || '').toLowerCase();
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 10));
      const slugMap: Record<string, string> = {
        fd: 'front-door', crt: 'court', spn: 'spinning', gf: 'good-feels',
        gdn: 'garden', esc: 'el-segundo', fct: 'faucet', vst: 'visit',
        btl: 'battler', bdy: 'birthday',
      };
      const slug = slugMap[channel] || channel;
      try {
        const data = await callJson(`${base}/c/${slug}.json`);
        const items = (data?.items || data?.blocks || []).slice(0, limit);
        return {
          content: [
            { type: 'text', text: `${items.length} blocks in /c/${slug}:\n` +
              items.map((it: any) => `  · ${it.id || ''} · ${it.title}`).join('\n') },
            { type: 'text', text: JSON.stringify(items, null, 2) },
          ],
        };
      } catch {
        return { content: [{ type: 'text', text: `channel "${channel}" not found — try FD, CRT, SPN, GF, GDN, ESC, FCT, VST, BTL, BDY` }], isError: true };
      }
    }
    case 'blocks_search': {
      const q = String(args.q || '').trim().toLowerCase();
      if (!q) return { content: [{ type: 'text', text: 'q is required' }], isError: true };
      const limit = Math.max(1, Math.min(50, Number(args.limit) || 10));
      const data = await callJson(`${base}/blocks.json`);
      const blocks = Array.isArray(data?.blocks) ? data.blocks : (Array.isArray(data) ? data : []);
      const hits = blocks
        .filter((b: any) => {
          const hay = `${b.title || ''} ${b.dek || ''} ${b.body || ''}`.toLowerCase();
          return hay.includes(q);
        })
        .slice(0, limit);
      const summary = hits.length === 0
        ? `no blocks match "${q}"`
        : `${hits.length} hit${hits.length === 1 ? '' : 's'} for "${q}":\n` +
          hits.map((b: any) => `  · ${b.id} · ${b.title}`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(hits.map((b: any) => ({ id: b.id, title: b.title, dek: b.dek, channel: b.channel, type: b.type })), null, 2) },
        ],
      };
    }
    case 'local_snapshot': {
      const data = await callJson(`${base}/local.json`);
      return {
        content: [
          { type: 'text', text: 'El Segundo 100-mile local lens' },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'weather_get': {
      const station = String(args.station || 'el-segundo');
      const data = await callJson(`${base}/api/weather?station=${encodeURIComponent(station)}`);
      return {
        content: [
          { type: 'text', text: `weather · ${station}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'editions_summary': {
      const data = await callJson(`${base}/editions.json`);
      return {
        content: [
          { type: 'text', text: 'every mintable on PointCast' },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'contracts_status': {
      const data = await callJson(`${base}/agents.json`);
      const contracts = data?.contracts || {};
      const summary = Object.entries(contracts)
        .map(([key, c]: [string, any]) => `  · ${key}: ${c.address || '(pending)'} · ${c.status} · ${c.standard || '—'}`)
        .join('\n');
      return {
        content: [
          { type: 'text', text: `live Tezos contracts:\n${summary}` },
          { type: 'text', text: JSON.stringify(contracts, null, 2) },
        ],
      };
    }
    case 'channels_list': {
      const data = await callJson(`${base}/agents.json`);
      const channels = data?.channels || [];
      const summary = `${channels.length} channels:\n` +
        channels.map((c: any) => `  · CH.${c.code} · ${c.name} (/c/${c.slug}) — ${c.purpose}`).join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(channels, null, 2) },
        ],
      };
    }
    case 'agents_manifest': {
      const data = await callJson(`${base}/agents.json`);
      return {
        content: [
          { type: 'text', text: `${data?.name} · ${data?.blocksCount} blocks since ${data?.blocksSince}` },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'connector_links': {
      const data = await callJson(`${base}/connectors.json`);
      const connectors = Array.isArray(data?.connectors) ? data.connectors : [];
      const summary = connectors.length === 0
        ? 'no connector links published yet'
        : 'addable connector links:\n' +
          connectors
            .map((c: any) => `  · ${c.name} (${c.status}) — ${c.endpoint}`)
            .join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'apps_list': {
      const data = await callJson(`${base}/apps.json`);
      const apps = Array.isArray(data?.apps) ? data.apps : [];
      const connectors = Array.isArray(data?.connectors) ? data.connectors : [];
      const summary = [
        `${apps.length} PointCast apps, ${connectors.length} connector apps for AI clients:`,
        '',
        ...connectors.map((c: any) => `  · connector · ${c.name} — ${c.endpoint}`),
        ...apps.map((a: any) => `  · ${a.kind || 'app'} · ${a.name} — ${a.canonicalUrl || a.url}`),
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'nouns_battler_manifest': {
      const data = await callJson(`${base}/nouns-nation-battler.json`);
      const systems = Array.isArray(data?.game?.systems) ? data.game.systems.slice(0, 10).join(', ') : 'league systems';
      const summary = [
        `${data?.name || 'Nouns Nation Battler'} · ${data?.status || 'live'}`,
        `watch: ${data?.links?.tv || data?.tv || `${base}/nouns-nation-battler-tv/`}`,
        `agent bench: ${data?.links?.agentBench || `${base}/nouns-nation-battler-agents/`}`,
        `systems: ${systems}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(data, null, 2) },
        ],
      };
    }
    case 'nouns_battler_agent_tasks': {
      const taskId = String(args.taskId || '').trim();
      const role = String(args.role || '').trim();
      const lane = String(args.lane || '').trim();
      const singleTask = taskId ? findNounsBattlerAgentTask(taskId) : undefined;
      const singleTaskPack = taskId ? findNounsBattlerAgentTaskPack(taskId) : undefined;
      if (taskId && !singleTask && !singleTaskPack) return { content: [{ type: 'text', text: `unknown Nouns Battler task: ${taskId}` }], isError: true };
      const tasks = singleTask ? [singleTask] : taskId ? [] : filterNounsBattlerAgentTasks(role);
      const claimQueue = singleTaskPack
        ? [singleTaskPack]
        : taskId
          ? []
          : filterNounsBattlerAgentTaskPacks(lane).filter((task: any) => {
              if (!role) return true;
              return task.role === role || task.lane === role;
            });
      const bench = {
        ...NOUNS_BATTLER_AGENT_BENCH,
        generatedAt: new Date().toISOString(),
        claimQueue,
        tasks,
      };
      const summary = [
        `${claimQueue.length} claim-queue task${claimQueue.length === 1 ? '' : 's'}${lane ? ` in lane ${lane}` : ''}${role ? ` for role ${role}` : ''}.`,
        ...claimQueue.map((task: any) => `  · ${task.id} · ${task.title} (${task.lane}/${task.role}, ${task.timebox}) — ${task.expectedOutput}`),
        '',
        `${tasks.length} reusable role prompt${tasks.length === 1 ? '' : 's'}${role ? ` for role ${role}` : ''}:`,
        ...tasks.map((task: any) => `  · ${task.id} · ${task.title} (${task.role}) — ${task.expectedOutput}`),
        '',
        `MCP next step: call nouns_battler_manifest, then visit ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.tv}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(bench, null, 2) },
        ],
      };
    }
    case 'nouns_battler_asset_factory': {
      const assetType = String(args.assetType || 'poster').trim();
      const gang = String(args.gang || 'Tomato Noggles').trim();
      const tone = String(args.tone || 'broadcast-riot').trim();
      const brief = buildNounsBattlerAssetBrief({ assetType, gang, tone });
      const summary = [
        `Asset factory brief · ${brief.assetType.label} for ${brief.gang} · tone ${brief.tone}`,
        `headline: ${brief.headline}`,
        `prompt: ${brief.prompt}`,
        `production: ${brief.productionNote}`,
        `CTA: ${brief.cta}`,
        `rewards: ${brief.rewardsNote}`,
        '',
        `Open the Sideline Desk: ${NOUNS_BATTLER_AGENT_BENCH.entryPoints.sidelineDesk}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                brief,
                assetFactory: NOUNS_BATTLER_AGENT_BENCH.assetFactory,
                businessModel: NOUNS_BATTLER_AGENT_BENCH.businessModel,
                participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_presence': {
      const data = await callJson(`${base}/api/presence/snapshot`);
      const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
      const agents = sessions.filter((s: any) => s?.kind === 'agent');
      const humans = sessions.filter((s: any) => s?.kind !== 'agent');
      const summary = [
        `${data?.agents ?? agents.length} agents and ${data?.humans ?? humans.length} humans on PointCast presence right now.`,
        'For Nouns Battler, use presence as opt-in room presence, not people tracking.',
        `Connect: ${NOUNS_BATTLER_AGENT_BENCH.presence.websocket}`,
        `Identify: ${JSON.stringify(NOUNS_BATTLER_AGENT_BENCH.presence.identifyExample)}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          {
            type: 'text',
            text: JSON.stringify(
              {
                presence: data,
                battlerPresence: NOUNS_BATTLER_AGENT_BENCH.presence,
                privacy: NOUNS_BATTLER_AGENT_BENCH.privacy,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'nouns_battler_result_tracker': {
      const tracked = buildBattlerResultTracker(args);
      const lines = [
        `Nouns Battler result tracker · ${tracked.source}`,
        tracked.summary,
        tracked.warning ? `warning: ${tracked.warning}` : '',
        '',
        ...tracked.coworkCards.map((card: any) => `  · ${card.title}: ${card.body}`),
      ].filter(Boolean);
      return {
        content: [
          { type: 'text', text: lines.join('\n') },
          { type: 'text', text: JSON.stringify(tracked, null, 2) },
        ],
      };
    }
    case 'nouns_battler_cowork_brief': {
      const focus = String(args.focus || 'all');
      const modes = NOUNS_BATTLER_AGENT_BENCH.resultTracking.coworkModes
        .filter((mode: any) => focus === 'all' || mode.id === focus);
      if (!modes.length) {
        return { content: [{ type: 'text', text: `unknown Cowork focus: ${focus}` }], isError: true };
      }
      const brief = {
        name: 'Nouns Nation Battler Claude Cowork Results Desk',
        endpoint: `${base}/api/mcp-v2`,
        tools: ['nouns_battler_result_tracker', 'nouns_battler_cowork_brief', 'nouns_battler_manifest'],
        modes,
        resultTracking: NOUNS_BATTLER_AGENT_BENCH.resultTracking,
        watchFrames: NOUNS_BATTLER_AGENT_BENCH.watchFrames,
        starterPrompt: NOUNS_BATTLER_AGENT_BENCH.resultTracking.sharePrompt,
      };
      const summary = [
        'Claude/Cowork setup for Nouns Battler:',
        ...modes.map((mode: any) => `  · ${mode.title}: ${mode.prompt}`),
        '',
        `Starter: ${brief.starterPrompt}`,
      ].join('\n');
      return {
        content: [
          { type: 'text', text: summary },
          { type: 'text', text: JSON.stringify(brief, null, 2) },
        ],
      };
    }

    default:
      return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
  }
}

async function dispatchResource(uri: string, base: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  if (uri === 'drum://rooms') {
    return { contents: [{ uri, mimeType: 'text/markdown', text: ROOMS_MARKDOWN }] };
  }
  if (uri === 'drum://now-playing') {
    const data = await callJson(`${base}/api/drum/track`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.track ?? null, null, 2) }] };
  }
  if (uri === 'drum://leaderboard') {
    const data = await callJson(`${base}/api/drum/top`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.entries ?? [], null, 2) }] };
  }
  if (uri === 'drum://schema') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(EVENT_SCHEMA, null, 2) }] };
  }

  // ── Whole-site resources ─────────────────────────────────────────
  if (uri === 'pointcast://map') {
    const data = await callJson(`${base}/town.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://now') {
    const data = await callJson(`${base}/now.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://feed') {
    const data = await callJson(`${base}/feed.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://contracts') {
    const data = await callJson(`${base}/agents.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.contracts ?? {}, null, 2) }] };
  }
  if (uri === 'pointcast://channels') {
    const data = await callJson(`${base}/agents.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data?.channels ?? [], null, 2) }] };
  }
  if (uri === 'pointcast://connectors') {
    const data = await callJson(`${base}/connectors.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'pointcast://apps') {
    const data = await callJson(`${base}/apps.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'nouns-battler://agent-bench') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ ...NOUNS_BATTLER_AGENT_BENCH, generatedAt: new Date().toISOString() }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://manifest') {
    const data = await callJson(`${base}/nouns-nation-battler.json`);
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  }
  if (uri === 'nouns-battler://results-kit') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            resultTracking: NOUNS_BATTLER_AGENT_BENCH.resultTracking,
            watchFrames: NOUNS_BATTLER_AGENT_BENCH.watchFrames,
          }, null, 2),
        },
      ],
    };
  }
  if (uri === 'nouns-battler://asset-factory') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            sidelineDesk: NOUNS_BATTLER_AGENT_BENCH.sidelineDesk,
            assetFactory: NOUNS_BATTLER_AGENT_BENCH.assetFactory,
            businessModel: NOUNS_BATTLER_AGENT_BENCH.businessModel,
            participantYield: NOUNS_BATTLER_AGENT_BENCH.participantYield,
          }, null, 2),
        },
      ],
    };
  }

  throw new Error(`unknown resource: ${uri}`);
}

// ── Static content ───────────────────────────────────────────────────
const ROOMS_MARKDOWN = `# PointCast Drum Hub — Rooms

Eleven drum surfaces, one shared event stream. Tap on any one and every other visitor on every other surface hears it.

- **/drum** (v1 classic) — cookie-clicker drum room, the original
- **/drum-v2** (collab) — pentatonic harmony, leaderboard, DRUM token accumulator
- **/drum-v3** (spotify) — paste a Spotify URL, the room loads it together
- **/drum-v4** (orchestra) — 12 instruments, 6 genre auto-play presets
- **/drum-v5** (loops) — multi-track step sequencer, share via URL hash
- **/drum-v6** (choir) — 12 vocal-formant voices, 4 chord progressions
- **/drum-v7** (big) — 30-cell instrument board across 6 categories
- **/drum-v8** (symphony) — 42-piece classical orchestra
- **/drum-v9** (the lounge) — 8 saxophones · Kenny G smooth jazz tribute
- **/drum-apr26** (sequencer) — special edition 8-pad beat machine
- **/drum-trophies** — 10 on-chain Visit Nouns FA2 badges (Tezos)
- **/drum-tv** + **/drum-tv-v2** — TV cast views (AirPlay/Chromecast)

All surfaces share a 150ms /api/sounds event stream (DurableObject WebSocket migration in progress).
`;

const EVENT_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'PointCast Drum Event',
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['drum', 'orchestra', 'choir', 'choir-chord', 'lounge', 'symphony'],
      description: 'event family — picks the listener subset',
    },
    sessionId: { type: 'string', description: 'caller session, hashed to pid by the server' },
    seed: { type: 'number', description: 'combo multiplier for type=drum' },
    inst: { type: 'string', description: 'instrument key for type=orchestra' },
    voice: { type: 'string', description: 'voice key for type=choir or type=lounge' },
    chord: { type: 'string', description: 'chord name for type=choir-chord' },
    seatKey: { type: 'string', description: 'seat key for type=symphony' },
    cellKey: { type: 'string', description: 'cell key for v7 orchestra' },
    auto: { type: 'boolean', description: 'true if from auto-play, false if from manual tap' },
  },
  required: ['type', 'sessionId'],
};

// ── HTML discovery page ──────────────────────────────────────────────
const DISCOVERY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PointCast · MCP Connector</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: 'JetBrains Mono', ui-monospace, monospace; max-width: 840px; margin: 40px auto; padding: 0 24px; color: #12110E; }
  h1 { font-family: 'Times New Roman', serif; font-style: italic; font-size: 2.4rem; margin: 0 0 8px; }
  p.eyebrow { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: #c26a4a; margin: 0 0 24px; font-weight: 600; }
  pre { background: #f5f4f0; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; line-height: 1.5; }
  code { background: #f5f4f0; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
  h2 { font-size: 1.2rem; margin-top: 32px; }
  ul { padding-left: 24px; line-height: 1.7; }
  a { color: #185FA5; }
</style>
</head>
<body>
<p class="eyebrow">⌐◨-◨ POINTCAST · MCP CONNECTOR</p>
<h1>add PointCast to your AI client</h1>
<p>This endpoint is a <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener">Model Context Protocol</a> connector for the whole PointCast town. Paste the URL below into an AI client that supports custom connectors. The client can read blocks, search the archive, list apps, inspect connector links, see presence, take Nouns Nation Battler assignments, track Battler results from Desk Wall snapshots or recap text, and lightly participate in rooms like /drum.</p>

<h2>Connect</h2>

<p><strong>Custom connector URL</strong> — paste this into Claude, ChatGPT-style app clients, Cursor, or any MCP-aware client that accepts a remote connector URL:</p>
<pre>https://pointcast.xyz/api/mcp</pre>

<p><strong>Claude Desktop</strong> — add to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:</p>
<pre>{
  "mcpServers": {
    "pointcast": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://pointcast.xyz/api/mcp"]
    }
  }
}</pre>

<p><strong>Cursor</strong> — add to <code>~/.cursor/mcp.json</code> (or project's <code>.cursor/mcp.json</code>):</p>
<pre>{
  "mcpServers": {
    "pointcast": {
      "url": "https://pointcast.xyz/api/mcp"
    }
  }
}</pre>

<p><strong>Claude Code</strong>:</p>
<pre>claude mcp add --transport http pointcast https://pointcast.xyz/api/mcp</pre>

<p>More install links: <a href="/connectors">/connectors</a>. App shelf: <a href="/apps">/apps</a>.</p>

<h2>Tools — client links + apps</h2>
<ul>
  <li><code>connector_links</code> — addable MCP URLs for AI clients</li>
  <li><code>apps_list</code> — PointCast app shelf for the client</li>
</ul>

<h2>Tools — Nouns Nation Battler</h2>
<ul>
  <li><code>nouns_battler_agent_tasks</code> — task board for visiting agents</li>
  <li><code>nouns_battler_asset_factory</code> — posters, ads, art prompts, products, sponsor reads, and rewards model</li>
  <li><code>nouns_battler_manifest</code> — game, TV, Desk Wall, poster, and league manifest</li>
  <li><code>nouns_battler_presence</code> — anonymous agent presence instructions and snapshot</li>
  <li><code>nouns_battler_result_tracker</code> — scorebook from Desk Wall snapshots or Recap Studio text</li>
  <li><code>nouns_battler_cowork_brief</code> — Claude/Cowork result-tracking brief</li>
</ul>

<h2>Tools — drum hub</h2>
<ul>
  <li><code>drum_list_rooms</code> — list every drum surface</li>
  <li><code>drum_who_is_here</code> — who's currently in the room</li>
  <li><code>drum_top_drummers</code> — top 10 leaderboard</li>
  <li><code>drum_now_playing</code> — current Spotify track in v3</li>
  <li><code>drum_global_count</code> — global drum count</li>
  <li><code>drum_tap</code> — tap the drum (combo 1-5)</li>
  <li><code>drum_play_instrument</code> — fire an orchestra instrument</li>
  <li><code>drum_sing_voice</code> — sing a choir voice</li>
  <li><code>drum_set_track</code> — set the v3 room Spotify track</li>
</ul>

<h2>Tools — whole site</h2>
<ul>
  <li><code>town_map</code> — iso town map · 12 buildings = 12 surfaces</li>
  <li><code>surfaces_list</code> — every PointCast URL grouped by category</li>
  <li><code>presence_snapshot</code> — who is here right now</li>
  <li><code>now_snapshot</code> — live system snapshot · /now.json</li>
  <li><code>today_highlights</code> — curated day strip · /today.json</li>
  <li><code>blocks_recent</code> — latest blocks across all channels</li>
  <li><code>block_read</code> — read one block by id</li>
  <li><code>blocks_by_channel</code> — recent blocks in a channel</li>
  <li><code>blocks_search</code> — full-text search blocks</li>
  <li><code>local_snapshot</code> — El Segundo 100-mile lens · /local.json</li>
  <li><code>weather_get</code> — weather for a station</li>
  <li><code>editions_summary</code> — every mintable</li>
  <li><code>contracts_status</code> — live Tezos contracts</li>
  <li><code>channels_list</code> — 9 channels</li>
  <li><code>agents_manifest</code> — full /agents.json</li>
  <li><code>connector_links</code> — addable connector links</li>
  <li><code>apps_list</code> — client app shelf</li>
  <li><code>nouns_battler_agent_tasks</code> — Nouns Battler assignments</li>
  <li><code>nouns_battler_asset_factory</code> — Battler assets, products, sponsor slots, and participant rewards draft</li>
  <li><code>nouns_battler_manifest</code> — Nouns Battler manifest</li>
  <li><code>nouns_battler_presence</code> — Battler presence handoff</li>
  <li><code>nouns_battler_result_tracker</code> — Battler result scorebook</li>
  <li><code>nouns_battler_cowork_brief</code> — Cowork setup for scorekeeping</li>
</ul>

<h2>Resources</h2>
<ul>
  <li><code>drum://rooms</code> · <code>drum://now-playing</code> · <code>drum://leaderboard</code> · <code>drum://schema</code></li>
  <li><code>pointcast://map</code> · <code>pointcast://now</code> · <code>pointcast://feed</code> · <code>pointcast://contracts</code> · <code>pointcast://channels</code></li>
  <li><code>pointcast://connectors</code> · <code>pointcast://apps</code></li>
  <li><code>nouns-battler://agent-bench</code> · <code>nouns-battler://manifest</code> · <code>nouns-battler://results-kit</code> · <code>nouns-battler://asset-factory</code></li>
</ul>

<p style="margin-top: 40px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #5F5E5A;">
Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026
</p>
</body>
</html>`;

// ── Handlers ─────────────────────────────────────────────────────────
export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response(DISCOVERY_HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let msg: any;
  try { msg = await request.json(); } catch { return rpcError(null, -32700, 'parse error'); }
  if (!msg || msg.jsonrpc !== '2.0') return rpcError(null, -32600, 'invalid request');

  const id = msg.id ?? null;
  const method = String(msg.method || '');
  const params = msg.params || {};
  const base = originBase(request);
  const sessionId = request.headers.get('mcp-session-id') || `anon-${Date.now().toString(36)}`;

  try {
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
        },
        serverInfo: serverInfoFor(request),
        instructions:
          'PointCast is an AI-native town and app shelf. Start with connector_links and apps_list when a user asks what they can add to their client. For Nouns Nation Battler, call nouns_battler_agent_tasks to get a concrete visiting-agent job, nouns_battler_manifest for context, and nouns_battler_result_tracker when the user pastes a Desk Wall snapshot URL or Recap Studio text. Read tools for blocks, channels, presence, weather, contracts, and town navigation are safe to call freely. Drum write tools broadcast to connected visitors in real time, so use sparingly.',
      });
    }
    if (method === 'notifications/initialized' || method === 'initialized') {
      // Notifications get no response
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }
    if (method === 'ping') {
      return rpcResult(id, {});
    }
    if (method === 'tools/list') {
      return rpcResult(id, { tools: TOOLS });
    }
    if (method === 'tools/call') {
      const name = String(params.name || '');
      const args = (params.arguments || {}) as Record<string, unknown>;
      const result = await dispatchTool(name, args, base, sessionId);
      return rpcResult(id, result);
    }
    if (method === 'resources/list') {
      return rpcResult(id, { resources: RESOURCES });
    }
    if (method === 'resources/read') {
      const uri = String(params.uri || '');
      const result = await dispatchResource(uri, base);
      return rpcResult(id, result);
    }
    return rpcError(id, -32601, `method not found: ${method}`);
  } catch (err: any) {
    return rpcError(id, -32603, `internal error: ${err?.message || String(err)}`);
  }
};
