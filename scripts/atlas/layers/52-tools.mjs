// Layer: mcp-tools — one record per tool on the PointCast MCP server (https://pointcast.xyz/api/mcp).
// The list comes from the server itself (tools/list through the real handler), so it can never drift
// from MCP_TOOL_NAMES in functions/api/mcp.ts; tests/atlas-tools-layer.test.mjs checks that.
import { loadTs } from '../_ts.mjs';

// The day this layer's tool list was last reviewed against functions/api/mcp.ts. Bump it when the tool list changes;
// tests/atlas-tools-layer.test.mjs fails when the names drift, which is the real staleness signal.
const CATALOGUE_REVIEWED = '2026-11-09';

export const layer = {
  id: 'mcp-tools',
  name: 'MCP tools',
  description: 'Every tool the PointCast MCP server offers to agents, with whether it only reads or can also write.',
  types: ['tool'],
  inline: true,
  data: 'https://pointcast.xyz/api/mcp',
  page: 'https://pointcast.xyz/mcps',
  license: 'CC0-1.0',
  updated: CATALOGUE_REVIEWED,
  source: { url: 'https://pointcast.xyz/agents.json', checked: CATALOGUE_REVIEWED, label: 'fact', title: 'PointCast agents manifest' },
  notes: 'Built from tools/list on functions/api/mcp.ts. checked and updated are the day the list was last reviewed against mcp.ts (CATALOGUE_REVIEWED); tests/atlas-tools-layer.test.mjs fails when the tool names drift. "read-only" follows the server\'s own readOnlyHint annotation; a tool marked write can post, append, tap, play, set, ask, submit, offer or claim.',
};

const WRITE_RE = /\b(posts?|appends?|taps?|plays?|sets?|asks?|submits?|offers?|claims?)\b/i;

function firstSentence(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const re = /[.!?](?=\s+[A-Z("“])/g;
  let m;
  while ((m = re.exec(t))) {
    const before = t.slice(0, m.index + 1);
    if (/(?:e\.g|i\.e|etc|vs)\.$/.test(before)) continue;
    return before;
  }
  return t;
}

export async function records(ctx) {
  const { site, helpers } = ctx;
  const { rid, src, summary, compact } = helpers;
  const mcp = await loadTs('functions/api/mcp.ts');
  const res = await mcp.onRequestPost({
    env: {},
    request: new Request('https://pointcast.xyz/api/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) }),
  });
  const tools = (await res.json()).result.tools;
  const names = new Set(tools.map((t) => t.name));
  for (const n of mcp.MCP_TOOL_NAMES) if (!names.has(n)) throw new Error(`tools/list is missing ${n}`);

  return tools.map((t) => {
    const hint = t.annotations?.readOnlyHint;
    const write = hint === false || (hint === undefined && WRITE_RE.test(firstSentence(t.description)));
    return compact({
      id: rid(site.host, 'tool', t.name.replace(/_/g, '-')),
      type: 'tool',
      name: t.name,
      summary: summary(firstSentence(t.description)),
      site: site.host,
      url: `https://pointcast.xyz/api/mcp#${t.name}`,
      data: 'https://pointcast.xyz/api/mcp',
      source: [src('https://pointcast.xyz/agents.json', CATALOGUE_REVIEWED, t.name.startsWith('atlas_') ? 'derived' : 'fact', 'PointCast agents manifest')],
      updated: CATALOGUE_REVIEWED,
      license: 'CC0-1.0',
      tags: ['mcp', write ? 'write' : 'read-only'],
      layer: 'mcp-tools',
    });
  });
}
