/**
 * atlas-mcp — read-only MCP tools over the Cartography atlas (docs/cartography/ATLAS.md §6).
 * Kept out of mcp.ts like radio-mcp: import, spread ATLAS_TOOL_DEFINITIONS into the tool list,
 * route the four names to dispatchAtlasTool.
 *
 *   atlas_search  read  find records by words, type, layer, site
 *   atlas_get     read  one full record with its links resolved
 *   atlas_near    read  located records near a point, straight-line miles
 *   atlas_links   read  the small graph around one id
 *
 * They fetch `${base}/atlas.json` (or `${base}/atlas/index.json`, the merged index) and run the
 * pure functions in atlas-query.mjs. Nothing is written. Suggestions arrive as pull requests.
 */

import { get as atlasGet, links as atlasLinks, near as atlasNear, provenance, search as atlasSearch } from './atlas-query.mjs';

const TYPES = ['place', 'court', 'player', 'gear', 'event', 'league', 'business', 'quiet-place', 'shrine', 'ping', 'page', 'bot', 'agent', 'route', 'area', 'dataset', 'feed', 'tool'];
const RELS = ['near', 'in', 'part-of', 'has-part', 'same-as', 'about', 'plays-at', 'hosted-at', 'made-by', 'sells', 'reads', 'answers', 'see-also'];

const COMMON =
  'Read-only: nothing is written and there is no public write tool. Distances are straight-line great-circle miles, never travel time. Not official; not an official City of El Segundo source. To suggest a correction or a new record, open a pull request at github.com/mhoydich/pointcast.';

const SITE_PROP = {
  type: 'string',
  enum: ['pointcast.xyz', 'all'],
  description: "'pointcast.xyz' (default) reads this site's atlas.json; 'all' reads the merged cross-site index (/atlas/index.json).",
};

export const ATLAS_TOOL_DEFINITIONS = [
  {
    name: 'atlas_search',
    description:
      `Search the Atlas, one open map of places, courts, players, gear, events, leagues, businesses, quiet places, shrines, pings, pages, bots and agents. All words in q must match name, summary, tags, layer or type. Returns compact records with paging. ${COMMON}`,
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Words to match; all must match. Omit to list by filter.' },
        type: { type: 'string', enum: TYPES, description: 'Only this record type.' },
        layer: { type: 'string', description: 'Only this layer id (a source dataset), as listed in atlas.json layers.' },
        site: SITE_PROP,
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Page size, default 10, max 50.' },
        offset: { type: 'integer', minimum: 0, description: 'Skip this many results (paging).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'atlas_get',
    description:
      `Read one Atlas record by id (for example pc:court:el-segundo), with every link resolved to the target's name, type and url where the atlas knows it, plus incoming links and the public source links for each fact. Ids from other sites (es:, in:, ues:) are looked up in the merged index. ${COMMON}`,
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Atlas id: {site}:{type}:{slug}.' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'atlas_near',
    description:
      `Find located Atlas records within a radius of a point, nearest first, each with distanceMiles and a compass bearing. Radius defaults to 1 mile and is capped at 25. Records without coordinates are not returned. ${COMMON}`,
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90, description: 'Latitude, WGS84 decimal degrees.' },
        lon: { type: 'number', minimum: -180, maximum: 180, description: 'Longitude, WGS84 decimal degrees.' },
        radiusMiles: { type: 'number', minimum: 0.05, maximum: 25, description: 'Search radius in miles, default 1, max 25.' },
        type: { type: 'string', enum: TYPES, description: 'Only this record type.' },
        layer: { type: 'string', description: 'Only this layer id.' },
        site: SITE_PROP,
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Max results, default 10, max 50.' },
      },
      required: ['lat', 'lon'],
      additionalProperties: false,
    },
  },
  {
    name: 'atlas_links',
    description:
      `Read the small graph around one Atlas id: outgoing links and incoming links (records that point at it), one or two hops, as { nodes, edges }. Ids that live on another site and are not in the atlas read are marked unresolved. ${COMMON}`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Atlas id to start from.' },
        rel: { type: 'string', enum: RELS, description: 'Only follow this relation.' },
        depth: { type: 'integer', enum: [1, 2], description: 'Hops to follow, 1 (default) or 2.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
] as const;

export const ATLAS_TOOL_NAMES = ATLAS_TOOL_DEFINITIONS.map((t) => t.name);

interface ToolResult { content: Array<{ type: string; text?: string }>; isError?: boolean }
const text = (t: string) => ({ type: 'text', text: t });
const fail = (t: string): ToolResult => ({ content: [text(t)], isError: true });

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; doc: any }>();

export function clearAtlasCache() { cache.clear(); }

async function loadDoc(url: string): Promise<any> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.doc;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`atlas ${res.status}`);
    const doc = await res.json();
    if (!doc || !Array.isArray(doc.records)) throw new Error('atlas malformed');
    cache.set(url, { at: Date.now(), doc });
    return doc;
  } catch (err) {
    if (hit) return hit.doc; // stale on error
    throw err;
  }
}

const siteUrl = (base: string, all: boolean) => (all ? `${base}/atlas/index.json` : `${base}/atlas.json`);
const wantsAll = (args: Record<string, unknown>) => String(args?.site ?? '') === 'all';
const str = (v: unknown) => (v == null ? undefined : String(v));

export async function dispatchAtlasTool(name: string, args: Record<string, unknown>, base: string): Promise<ToolResult> {
  args = args || {};
  try {
    if (name === 'atlas_search') {
      const all = wantsAll(args);
      const doc = await loadDoc(siteUrl(base, all));
      const result = atlasSearch(doc, { q: str(args.q), type: str(args.type), layer: str(args.layer), site: all ? 'all' : undefined, limit: args.limit as any, offset: args.offset as any });
      const line = `${result.total} record${result.total === 1 ? '' : 's'}${args.q ? ` for "${args.q}"` : ''} in ${doc.name} (generated ${doc.generated}); showing ${result.items.length}: ${result.items.map((i: any) => `${i.name} [${i.id}]`).join(' | ') || 'none'}. Read-only, not official.`;
      return { content: [text(line), text(JSON.stringify({ ...result, provenance: provenance(doc) }))] };
    }

    if (name === 'atlas_get' || name === 'atlas_links') {
      const id = String(args.id ?? '').trim();
      if (!id) return fail('id is required, for example pc:court:el-segundo.');
      const doc = await loadDoc(siteUrl(base, !id.startsWith('pc:')));
      if (name === 'atlas_get') {
        const rec = atlasGet(doc, id);
        if (!rec) return fail(`Unknown atlas id "${id}". Use atlas_search to find ids.`);
        const unresolved = rec.links.filter((l: any) => !l.resolved).length;
        const line = `${rec.name} [${rec.id}] · ${rec.type} · layer ${rec.layer} · updated ${rec.updated} · ${rec.links.length} link${rec.links.length === 1 ? '' : 's'}${unresolved ? ` (${unresolved} unresolved)` : ''} · ${rec.url}. Sources: ${(rec.source || []).map((s: any) => s.url).join(' ')}`;
        return { content: [text(line), text(JSON.stringify({ record: rec, provenance: provenance(doc) }))] };
      }
      const graph = atlasLinks(doc, { id, rel: str(args.rel), depth: args.depth as any });
      if (!graph) return fail(`Unknown atlas id "${id}". Use atlas_search to find ids.`);
      const unresolved = graph.nodes.filter((n: any) => n.resolved === false).length;
      const line = `${graph.nodes.length} node${graph.nodes.length === 1 ? '' : 's'}, ${graph.edges.length} edge${graph.edges.length === 1 ? '' : 's'} around ${id} (depth ${graph.depth}${graph.rel ? `, rel ${graph.rel}` : ''})${unresolved ? `; ${unresolved} unresolved id${unresolved === 1 ? '' : 's'} live on another site` : ''}. Read-only, not official.`;
      return { content: [text(line), text(JSON.stringify({ ...graph, provenance: provenance(doc) }))] };
    }

    if (name === 'atlas_near') {
      const lat = Number(args.lat);
      const lon = Number(args.lon);
      if (args.lat == null || args.lon == null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return fail('lat and lon are required decimal degrees (lat -90..90, lon -180..180).');
      }
      const doc = await loadDoc(siteUrl(base, wantsAll(args)));
      const result = atlasNear(doc, { lat, lon, radiusMiles: args.radiusMiles as any, type: str(args.type), layer: str(args.layer), limit: args.limit as any });
      const line = `${result.total} located record${result.total === 1 ? '' : 's'} within ${result.radiusMiles} mi (straight-line, not travel time): ${result.items.map((i: any) => `${i.name} ${i.distanceMiles} mi ${i.compass}`).join(' | ') || 'none'}. Not official.`;
      return { content: [text(line), text(JSON.stringify({ ...result, provenance: provenance(doc) }))] };
    }
  } catch (err) {
    return fail(`Atlas unavailable: ${err instanceof Error ? err.message : 'unknown error'}.`);
  }
  return fail(`unknown atlas tool: ${name}`);
}
