// Read-only queries over an atlas document (a site atlas or the merged index). Pure functions,
// no I/O, so both MCP servers and the map pages can share them. Kept identical in
// mhoydich/pointcast (src/lib/atlas-query.mjs) and mhoydich/hello-token-reserve (netlify/lib/atlas/query.mjs).
// Spec: docs/ATLAS.md §6 (elsegundo.xyz) / docs/cartography/ATLAS.md §6 (PointCast).

const EARTH_MILES = 3958.7613;
const rad = (d) => (d * Math.PI) / 180;

export function haversineMiles(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingDegrees(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360) % 360;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (deg) => COMPASS[Math.round(deg / 45) % 8];

export const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const MAX_LIMIT = 50;
export const MAX_RADIUS_MILES = 25;

const clampInt = (v, lo, hi, dflt) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };

/** The compact shape search and near return: enough to decide, never the whole record. */
export function compactRecord(r) {
  const out = { id: r.id, type: r.type, name: r.name, site: r.site, url: r.url, updated: r.updated, layer: r.layer, license: r.license };
  if (r.summary) out.summary = r.summary;
  if (r.attribution) out.attribution = r.attribution; // ODbL rows must travel with their attribution
  if (r.data) out.data = r.data;
  if (r.location) out.location = { lat: r.location.lat, lon: r.location.lon, precision: r.location.precision, ...(r.location.area ? { area: r.location.area } : {}) };
  if (r.tags && r.tags.length) out.tags = r.tags;
  if (r.status && r.status !== 'live') out.status = r.status;
  if (r.sensitive && r.sensitive.length) out.sensitive = r.sensitive;
  if (r.when) out.when = r.when;
  return out;
}

function haystack(r) {
  return normalize([r.name, r.summary, r.type, r.layer, r.id, (r.tags || []).join(' '), r.location && r.location.area, r.location && r.location.address].filter(Boolean).join(' '));
}

/** Records every term of `q` matches (name, summary, tags, layer, type, id, area, address). */
export function search(atlas, { q = '', type, layer, site, limit, offset } = {}) {
  const terms = normalize(q).split(/\s+/).filter(Boolean).slice(0, 12);
  const lim = clampInt(limit, 1, MAX_LIMIT, 10);
  const off = clampInt(offset, 0, 100000, 0);
  let rows = atlas.records;
  if (type) rows = rows.filter((r) => r.type === type);
  if (layer) rows = rows.filter((r) => r.layer === layer);
  if (site && site !== 'all') rows = rows.filter((r) => r.site === site);
  if (terms.length) {
    rows = rows
      .map((r) => { const h = haystack(r); const name = normalize(r.name); let score = 0; for (const t of terms) { if (!h.includes(t)) return null; score += name.includes(t) ? 3 : 1; if (name === t) score += 5; } return { r, score }; })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name))
      .map((x) => x.r);
  }
  return { total: rows.length, limit: lim, offset: off, nextOffset: off + lim < rows.length ? off + lim : null, items: rows.slice(off, off + lim).map(compactRecord) };
}

/** One record by id, with each link resolved to the target's name/type/url when the atlas has it. */
export function get(atlas, id) {
  const r = atlas.records.find((x) => x.id === id);
  if (!r) return null;
  const links = (r.links || []).map((l) => { const t = atlas.records.find((x) => x.id === l.id); return t ? { ...l, name: t.name, type: t.type, url: t.url, resolved: true } : { ...l, resolved: false }; });
  const incoming = atlas.records.filter((x) => (x.links || []).some((l) => l.id === id)).map((x) => ({ rel: (x.links.find((l) => l.id === id) || {}).rel, id: x.id, name: x.name, type: x.type, url: x.url }));
  const layer = (atlas.layers || []).find((l) => l.id === r.layer) || null;
  return { ...r, links, incoming, layerInfo: layer ? { id: layer.id, name: layer.name, data: layer.data, page: layer.page, license: layer.license, updated: layer.updated } : null };
}

/** Located records within radiusMiles of a point, nearest first. Straight-line, never travel time. */
export function near(atlas, { lat, lon, radiusMiles, type, layer, site, limit, offset } = {}) {
  const origin = { lat: Number(lat), lon: Number(lon) };
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lon) || Math.abs(origin.lat) > 90 || Math.abs(origin.lon) > 180) throw new Error('lat and lon are required decimal degrees');
  const radius = Math.min(MAX_RADIUS_MILES, Math.max(0.05, Number.isFinite(Number(radiusMiles)) ? Number(radiusMiles) : 1));
  const lim = clampInt(limit, 1, MAX_LIMIT, 10);
  const off = clampInt(offset, 0, 100000, 0);
  let rows = atlas.records.filter((r) => r.location);
  if (type) rows = rows.filter((r) => r.type === type);
  if (layer) rows = rows.filter((r) => r.layer === layer);
  if (site && site !== 'all') rows = rows.filter((r) => r.site === site);
  const hits = rows
    .map((r) => ({ r, distanceMiles: haversineMiles(origin, r.location) }))
    .filter((x) => x.distanceMiles <= radius)
    .sort((a, b) => a.distanceMiles - b.distanceMiles || a.r.name.localeCompare(b.r.name));
  return {
    origin, radiusMiles: radius, total: hits.length, limit: lim, offset: off, nextOffset: off + lim < hits.length ? off + lim : null,
    distanceNote: 'Straight-line great-circle miles from the origin, not a route or travel time.',
    items: hits.slice(off, off + lim).map(({ r, distanceMiles }) => { const b = bearingDegrees(origin, r.location); return { ...compactRecord(r), distanceMiles: Math.round(distanceMiles * 100) / 100, bearing: b, compass: compass(b), precision: r.location.precision }; }),
  };
}

export const MAX_GRAPH_NODES = 200;

/** A small graph around one id: outgoing and incoming links, one or two hops, at most MAX_GRAPH_NODES nodes. */
export function links(atlas, { id, rel, depth } = {}) {
  const start = atlas.records.find((x) => x.id === id);
  if (!start) return null;
  const hops = clampInt(depth, 1, 2, 1);
  const byId = new Map(atlas.records.map((r) => [r.id, r]));
  const nodes = new Map([[start.id, start]]);
  const edges = [];
  const seenEdge = new Set();
  const addEdge = (from, r, to) => { const k = `${from}|${r}|${to}`; if (seenEdge.has(k)) return; seenEdge.add(k); edges.push({ from, rel: r, to }); };
  let frontier = [start.id];
  let truncated = false;
  const room = () => nodes.size < MAX_GRAPH_NODES || (truncated = true, false);
  for (let hop = 0; hop < hops && !truncated; hop += 1) {
    const next = [];
    for (const fid of frontier) {
      const f = byId.get(fid);
      if (!f) continue;
      for (const l of f.links || []) {
        if (rel && l.rel !== rel) continue;
        addEdge(f.id, l.rel, l.id);
        const t = byId.get(l.id);
        if (t && !nodes.has(t.id)) { if (!room()) break; nodes.set(t.id, t); next.push(t.id); }
        else if (!t && !nodes.has(l.id)) { if (!room()) break; nodes.set(l.id, null); }
      }
      for (const other of atlas.records) {
        for (const l of other.links || []) {
          if (l.id !== fid) continue;
          if (rel && l.rel !== rel) continue;
          addEdge(other.id, l.rel, fid);
          if (!nodes.has(other.id)) { if (!room()) break; nodes.set(other.id, other); next.push(other.id); }
        }
      }
    }
    frontier = next;
  }
  return {
    id: start.id, depth: hops, rel: rel || null, truncated, maxNodes: MAX_GRAPH_NODES,
    nodes: [...nodes.entries()].map(([nid, r]) => (r ? compactRecord(r) : { id: nid, resolved: false, note: 'This id lives in another site atlas; look it up in the merged index at https://pointcast.xyz/atlas/index.json' })),
    edges,
  };
}

/** The lines every tool answer should carry. */
export function provenance(atlas) {
  return { atlas: atlas.name, site: atlas.site, kind: atlas.kind, generated: atlas.generated, license: atlas.license, licenseNote: atlas.licenseNote, notOfficial: atlas.notOfficial, spec: atlas.spec, map: atlas.map, distanceNote: 'Distances are straight-line great-circle miles, never travel time.' };
}
