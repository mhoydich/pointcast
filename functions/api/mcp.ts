/**
 * /api/mcp — Model Context Protocol server for the PointCast drum hub.
 *
 * Per Mike: "lets mcp drum"
 *
 * Exposes the drum surfaces as MCP tools so any AI agent (Claude
 * Desktop, Cursor, Claude Code, ChatGPT, etc.) can call them. Spec:
 * https://modelcontextprotocol.io
 *
 * Transport: stateless POST JSON-RPC 2.0. SSE streaming optional later.
 *
 * Tools
 *   drum_list_rooms       (no input)   list every /drum* surface
 *   drum_who_is_here      (no input)   active visitors from /api/visit
 *   drum_top_drummers     (no input)   leaderboard from /api/drum/top
 *   drum_now_playing      (no input)   current Spotify track in v3
 *   drum_global_count     (no input)   global cumulative drum count
 *
 *   drum_tap              (no input)   tap a drum on /drum (v1 classic)
 *   drum_play_instrument  ({inst})     fire a v4/v7 orchestra instrument
 *   drum_sing_voice       ({voice})    fire a v6 choir voice
 *   drum_set_track        ({trackId})  set the v3 room Spotify track
 *
 * Resources
 *   drum://rooms          markdown list of all drum surfaces
 *   drum://now-playing    current room track
 *   drum://leaderboard    top 10 drummers
 *   drum://schema         /api/sounds event schema
 *
 * Discovery
 *   GET /api/mcp returns a small HTML page with config snippets.
 *   POST /api/mcp speaks JSON-RPC.
 *   OPTIONS /api/mcp returns CORS headers.
 *
 * Per docs/mcp/pointcast-drum.md.
 */

import type { Env } from './visit';

const MCP_PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'pointcast-drum';
const SERVER_VERSION = '0.1.0';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
};

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;

// ── Tool catalogue ────────────────────────────────────────────────────
// Each tool has a name, description, and JSON-Schema input shape.
// Tools that take no arguments use `{ type: 'object', properties: {} }`.
const TOOLS = [
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
] as const;

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
async function callJson(url: string, init?: RequestInit): Promise<any> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`upstream ${r.status} ${url}`);
  return r.json();
}
function textContent(text: string): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text }] };
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
<title>PointCast Drum · MCP Server</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: 'JetBrains Mono', ui-monospace, monospace; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #12110E; }
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
<p class="eyebrow">⌐◨-◨ POINTCAST · DRUM · MCP SERVER</p>
<h1>let an AI agent drum with you</h1>
<p>This endpoint is a <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener">Model Context Protocol</a> server that wraps the PointCast drum hub. Any MCP-aware client (Claude Desktop, Cursor, Claude Code, ChatGPT plugins) can connect and call tools to tap drums, play instruments, sing voices, set Spotify tracks, and read room state.</p>

<h2>Connect</h2>

<p><strong>Claude Desktop</strong> — add to <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:</p>
<pre>{
  "mcpServers": {
    "pointcast-drum": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://pointcast.xyz/api/mcp"]
    }
  }
}</pre>

<p><strong>Cursor</strong> — add to <code>~/.cursor/mcp.json</code> (or project's <code>.cursor/mcp.json</code>):</p>
<pre>{
  "mcpServers": {
    "pointcast-drum": {
      "url": "https://pointcast.xyz/api/mcp"
    }
  }
}</pre>

<p><strong>Claude Code</strong>:</p>
<pre>claude mcp add --transport http pointcast-drum https://pointcast.xyz/api/mcp</pre>

<h2>Tools</h2>
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

<h2>Resources</h2>
<ul>
  <li><code>drum://rooms</code> — markdown list of all drum surfaces</li>
  <li><code>drum://now-playing</code> — current room track JSON</li>
  <li><code>drum://leaderboard</code> — top 10 drummers JSON</li>
  <li><code>drum://schema</code> — /api/sounds event schema</li>
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
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions:
          'PointCast drum hub. Tap drums, play instruments, sing voices, set Spotify tracks, read room state. Tools broadcast to every connected human visitor in real time, so use sparingly. Read-only tools (list_rooms, who_is_here, top_drummers, now_playing, global_count) are safe to call freely.',
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
