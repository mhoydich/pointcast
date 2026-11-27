/**
 * Loom Rush Agent Play MCP — pointcast.loom-rush.mcp/v1
 *
 * Stateless JSON-RPC 2.0, same shape as /api/mcp: initialize, tools/list,
 * tools/call, resources/list, resources/read, ping. The simulation is pure.
 * Nothing here writes the Loom, D1, or KV.
 */
import {
  CAMPAIGN,
  EXHIBITION,
  SPEC,
  VERSION,
  catalog,
  playExhibition,
  simulatePlan,
} from '../loom/loom-rush-sim.mjs';

export const PROTOCOL_VERSION = '2025-06-18';
export const SERVER_NAME = 'pointcast-loom-rush';
export const SERVER_VERSION = VERSION;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type, Last-Event-ID, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
  'Cache-Control': 'no-store',
};

const INSTRUCTIONS = 'Loom Rush LR-1 is a 10-wave defense of the road to the Living Hearth. Call loom_rush_catalog for towers, pads, and waves. loom_rush_play runs one uint32 seed and a build plan. loom_rush_tournament scores the house exhibition, or the entries you pass. open_loom_rush returns the browser sketch. Sound on that page starts off. Plans are deterministic: the same seed and steps always return the same proof.';

function annotations(name) {
  const title = name.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  return {
    'pointcast/effect': 'read',
    title,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
}

const stepSchema = {
  type: 'object',
  properties: {
    wave: { type: 'integer', minimum: 1, maximum: 10 },
    op: { type: 'string', enum: ['build', 'upgrade'] },
    pad: { type: 'integer', minimum: 0, maximum: 5 },
    tower: { type: 'string', enum: ['archer', 'barracks', 'mage', 'gong', 'paladin'] },
  },
  required: ['wave', 'op', 'pad'],
  additionalProperties: false,
};

export const TOOLS = [
  {
    name: 'loom_rush_catalog',
    description: 'LR-1 rules: six pads, five towers including the Signing Desk Paladin (wave 6), ten waves, star and score math, and the CC0 Noun sprites.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: annotations('loom_rush_catalog'),
  },
  {
    name: 'loom_rush_play',
    description: 'Play a deterministic Loom Rush plan. Pass a uint32 seed, an agent name, and ordered build/upgrade steps for pads 0–5. Returns hearts, score, stars, MVP, a 12-hex SHA-256 proof, and a Sensory MCP cue. The same seed and steps always replay.',
    inputSchema: {
      type: 'object',
      properties: {
        seed: { type: 'integer', minimum: 0, maximum: 4294967295, description: 'uint32 replay seed. 1126 is the house exhibition seed.' },
        agent: { type: 'string', description: '1–32 chars: lowercase letters, digits, hyphens.' },
        steps: { type: 'array', items: stepSchema, maxItems: 36 },
      },
      required: ['seed', 'agent', 'steps'],
      additionalProperties: false,
    },
    annotations: annotations('loom_rush_play'),
  },
  {
    name: 'loom_rush_tournament',
    description: 'Score several agents on one seed. Omit entries to run the Seed 1126 house exhibition (four labs plus town-watch). Ranking is score, then hearts, leftover gold, kills, and agent name.',
    inputSchema: {
      type: 'object',
      properties: {
        seed: { type: 'integer', minimum: 0, maximum: 4294967295 },
        entries: {
          type: 'array',
          maxItems: 8,
          items: {
            type: 'object',
            properties: {
              agent: { type: 'string' },
              steps: { type: 'array', items: stepSchema, maxItems: 36 },
            },
            required: ['agent', 'steps'],
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
    annotations: annotations('loom_rush_tournament'),
  },
  {
    name: 'open_loom_rush',
    description: 'Open the browser sketch for Loom Rush. The page is 390px-friendly, draws the CC0 Nouns locally, and starts with sound off.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: annotations('open_loom_rush'),
  },
];

export const RESOURCES = [
  {
    uri: 'loom-rush://catalog',
    name: 'Loom Rush LR-1 catalog',
    description: 'Towers, waves, pads, scoring, and sprite credits.',
    mimeType: 'application/json',
  },
  {
    uri: 'loom-rush://exhibition/1126',
    name: 'Loom Rush Seed 1126 exhibition',
    description: 'Ranked multi-agent exhibition on seed 1126.',
    mimeType: 'application/json',
  },
];

function rpcResult(id, result) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { headers: JSON_HEADERS });
}

function rpcError(id, code, message) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), { headers: JSON_HEADERS });
}

function textResult(text, data, isError = false) {
  const content = [{ type: 'text', text }];
  if (data !== undefined) content.push({ type: 'text', text: JSON.stringify(data, null, 2) });
  return { content, ...(isError ? { isError: true } : {}) };
}

function originOf(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function onlyKeys(value, allowed) {
  return Object.keys(value).filter((key) => !allowed.includes(key));
}

function asArgs(params) {
  const args = params?.arguments;
  if (args == null) return {};
  if (typeof args !== 'object' || Array.isArray(args)) return null;
  return args;
}

function lineFor(run) {
  const stars = run.stars === 1 ? '1-star' : `${run.stars}-star`;
  return `${run.wavesCleared}/10 · ${stars} · ${run.hearts}/20 hearts · score ${run.score} · ${run.kills} kills · MVP ${run.mvp || 'none'}${run.mvpDamage ? ` (${run.mvpDamage})` : ''} · proof ${run.proof} · cue ${run.sensory.cue}`;
}

function callTool(name, args, request) {
  if (name === 'loom_rush_catalog') {
    if (onlyKeys(args, []).length) return textResult('loom_rush_catalog takes no arguments.', undefined, true);
    const body = catalog();
    return textResult(`Loom Rush ${CAMPAIGN}. ${body.waves.length} waves, ${body.pads.length} pads, paladin at wave 6.`, body);
  }
  if (name === 'loom_rush_play') {
    if (onlyKeys(args, ['seed', 'agent', 'steps']).length) return textResult('loom_rush_play accepts only seed, agent, and steps.', undefined, true);
    const run = simulatePlan({ seed: args.seed, agent: args.agent, steps: args.steps });
    if (!run.ok) return textResult(run.error.message, { code: run.error.code }, true);
    return textResult(`Seed ${run.seed} · ${run.agent} — ${lineFor(run)}`, run);
  }
  if (name === 'loom_rush_tournament') {
    if (onlyKeys(args, ['seed', 'entries']).length) return textResult('loom_rush_tournament accepts only seed and entries.', undefined, true);
    const seed = args.seed === undefined ? 1126 : args.seed;
    if (args.entries === undefined) {
      const board = playExhibition(seed);
      if (!board.ok) return textResult(board.error.message, { code: board.error.code }, true);
      const text = board.runs.map((run) => `${run.place}. ${run.agent} — ${lineFor(run)}`).join('\n');
      return textResult(`Seed ${seed} exhibition\n${text}`, board);
    }
    if (!Array.isArray(args.entries) || args.entries.length < 1 || args.entries.length > 8) {
      return textResult('entries must be a list of 1 to 8 agents.', { code: 'bad_entries' }, true);
    }
    const runs = [];
    for (const entry of args.entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || onlyKeys(entry, ['agent', 'steps']).length) {
        return textResult('Each entry accepts only agent and steps.', { code: 'bad_entries' }, true);
      }
      const run = simulatePlan({ seed, agent: entry.agent, steps: entry.steps });
      if (!run.ok) return textResult(run.error.message, { code: run.error.code }, true);
      runs.push(run);
    }
    runs.sort((a, b) => b.score - a.score || b.hearts - a.hearts || b.gold - a.gold || b.kills - a.kills || (a.agent < b.agent ? -1 : a.agent > b.agent ? 1 : 0));
    const ranked = runs.map((run, index) => ({ place: index + 1, ...run }));
    const text = ranked.map((run) => `${run.place}. ${run.agent} — ${lineFor(run)}`).join('\n');
    return textResult(`Seed ${seed} tournament\n${text}`, { ok: true, spec: SPEC, campaign: CAMPAIGN, seed, runs: ranked });
  }
  if (name === 'open_loom_rush') {
    if (onlyKeys(args, []).length) return textResult('open_loom_rush takes no arguments.', undefined, true);
    const url = `${originOf(request)}/sketches/loom-rush/`;
    return textResult(`Play Loom Rush in the browser: ${url} Sound starts off.`, {
      url,
      title: 'Loom Rush · Nouns Edition',
      campaign: CAMPAIGN,
      waves: 10,
      sound: 'off',
    });
  }
  return textResult(`Unknown tool: ${name}`, undefined, true);
}

function readResource(uri) {
  if (uri === 'loom-rush://catalog') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(catalog(), null, 2) }] };
  }
  const exhibition = /^loom-rush:\/\/exhibition\/(\d+)$/.exec(uri);
  if (exhibition) {
    const seed = Number(exhibition[1]);
    const board = playExhibition(seed);
    if (!board.ok) return { error: board.error.message };
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(board, null, 2) }] };
  }
  return null;
}

function discoveryHtml() {
  const tools = TOOLS.map((tool) => `<li><code>${tool.name}</code> — ${tool.description}</li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loom Rush MCP</title>
</head>
<body>
  <main>
    <h1>Loom Rush Agent Play</h1>
    <p>JSON-RPC 2.0 at this URL. Protocol ${PROTOCOL_VERSION}. Campaign ${CAMPAIGN}. Spec ${SPEC}.</p>
    <ul>${tools}</ul>
    <p><a href="/sketches/loom-rush/">Play the sketch</a>. Sound starts off. The house exhibition is seed 1126.</p>
  </main>
</body>
</html>`;
}

export function onRequestGet() {
  return new Response(discoveryHtml(), {
    headers: { ...JSON_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...JSON_HEADERS, 'Access-Control-Max-Age': '86400' } });
}

export async function onRequestPost({ request }) {
  let msg;
  try {
    msg = await request.json();
  } catch {
    return rpcError(null, -32700, 'parse error');
  }
  if (!msg || msg.jsonrpc !== '2.0' || Array.isArray(msg)) return rpcError(null, -32600, 'invalid request');
  const id = msg.id ?? null;
  const method = String(msg.method || '');
  const params = msg.params || {};
  try {
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false, subscribe: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions: INSTRUCTIONS,
      });
    }
    if (method === 'notifications/initialized' || method === 'initialized') {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }
    if (method === 'ping') return rpcResult(id, {});
    if (method === 'tools/list') return rpcResult(id, { tools: TOOLS });
    if (method === 'tools/call') {
      const name = String(params.name || '');
      const args = asArgs(params);
      if (!args) return rpcResult(id, textResult('Tool arguments must be an object.', undefined, true));
      return rpcResult(id, callTool(name, args, request));
    }
    if (method === 'resources/list') return rpcResult(id, { resources: RESOURCES });
    if (method === 'resources/read') {
      const uri = String(params.uri || '');
      const found = readResource(uri);
      if (!found) return rpcError(id, -32002, `resource not found: ${uri}`);
      if (found.error) return rpcError(id, -32602, found.error);
      return rpcResult(id, found);
    }
    return rpcError(id, -32601, `method not found: ${method}`);
  } catch (err) {
    return rpcError(id, -32603, `internal error: ${err?.message || String(err)}`);
  }
}

export const EXHIBITION_AGENTS = EXHIBITION.map((entry) => entry.agent);
