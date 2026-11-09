/** Read-only atlas tools on the PointCast MCP server: atlas_search, atlas_get, atlas_near, atlas_links. */
import assert from 'node:assert/strict';
import test from 'node:test';

import { assembleAtlas, mergeAtlases, rid, src, loc } from '../scripts/atlas/lib.mjs';

const BASE = 'https://pointcast.xyz';
const PC = { host: 'pointcast.xyz', name: 'PointCast atlas', description: 'fixture', notOfficial: 'Not an official City of El Segundo page.', spec: `${BASE}/cartography/atlas`, map: `${BASE}/cartography/map`, center: { lat: 33.92045, lon: -118.415318, name: 'El Segundo City Hall' }, radiusMiles: 25 };
const ES = { ...PC, host: 'elsegundo.xyz', name: 'elsegundo.xyz atlas', map: 'https://elsegundo.xyz/cartography/' };
const S = (u = 'https://example.org/s') => [src(u, '2026-10-01', 'listing', 'Fixture source')];
const rec = (site, type, slugText, name, lat, lon, extra = {}) => ({
  id: rid(site.host, type, slugText), type, name, site: site.host, url: `https://${site.host}/${slugText}`, source: S(), updated: '2026-10-01', license: 'CC0-1.0', layer: extra.layer || 'fixture',
  ...(lat != null ? { location: loc(lat, lon, 'point', { method: 'fixture', source: 'https://example.org/s' }) } : {}), ...extra,
});
const layers = [{ id: 'fixture', name: 'Fixture', description: 'test', types: ['court', 'place', 'agent'], license: 'CC0-1.0', updated: '2026-10-01', inline: true }];
const pcRecords = [
  rec(PC, 'court', 'rec-park', 'Recreation Park Courts', 33.9216, -118.4113, { summary: 'Pickleball courts by the park.', tags: ['pickleball'], links: [{ rel: 'same-as', id: 'es:court:recreation-park' }, { rel: 'near', id: 'pc:place:library' }] }),
  rec(PC, 'place', 'library', 'El Segundo Library', 33.9231, -118.4122, { summary: 'The public library.' }),
  rec(PC, 'place', 'far-pier', 'Far Pier', 33.7, -118.3, { summary: 'A pier far to the south.' }),
  rec(PC, 'agent', 'desk-bot', 'Desk bot', null, null, { summary: 'A house agent with no location.', links: [{ rel: 'about', id: 'pc:place:library' }] }),
];
const esRecords = [rec(ES, 'court', 'recreation-park', 'Recreation Park courts', 33.9217, -118.4114, { links: [{ rel: 'same-as', id: 'pc:court:rec-park' }] })];
const pcAtlas = assembleAtlas(PC, layers, pcRecords, '2026-11-08T00:00:00Z');
const esAtlas = assembleAtlas(ES, layers, esRecords, '2026-11-08T00:00:00Z');
const merged = mergeAtlases(PC, [{ atlas: pcAtlas, url: `${BASE}/atlas.json` }, { atlas: esAtlas, url: 'https://elsegundo.xyz/atlas.json' }], '2026-11-08T00:00:00Z');

async function loadMcp(t) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const rpc = async (method, params) => (await mcp.onRequestPost({
    env: {},
    request: new Request(`${BASE}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
  })).json();
  return { mcp, rpc };
}

async function withAtlas(run) {
  const realFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    const u = String(url);
    const body = u === `${BASE}/atlas.json` ? pcAtlas : u === `${BASE}/atlas/index.json` ? merged : null;
    return body ? new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }) : new Response('nope', { status: 404 });
  };
  try { return await run(urls); } finally { globalThis.fetch = realFetch; }
}

const call = async (rpc, name, args = {}) => {
  const out = await rpc('tools/call', { name, arguments: args });
  const r = out.result;
  return { isError: !!r.isError, line: r.content[0].text, data: r.content[1] ? JSON.parse(r.content[1].text) : null };
};

test('tools/list carries the four atlas tools, read-only, with enums', async (t) => {
  const { rpc } = await loadMcp(t);
  const tools = (await rpc('tools/list', {})).result.tools;
  for (const n of ['atlas_search', 'atlas_get', 'atlas_near', 'atlas_links']) {
    const tool = tools.find((x) => x.name === n);
    assert.ok(tool, n);
    assert.equal(tool.annotations.readOnlyHint, true, n);
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.match(tool.description, /Read-only/);
    assert.match(tool.description, /straight-line/);
    assert.match(tool.description, /github\.com\/mhoydich\/pointcast/);
  }
  assert.equal(tools.find((x) => x.name === 'atlas_search').inputSchema.properties.type.enum.length, 18);
  assert.equal(tools.find((x) => x.name === 'atlas_links').inputSchema.properties.rel.enum.length, 13);
});

test('atlas_search by word and by type', async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async () => {
    const byWord = await call(rpc, 'atlas_search', { q: 'pickleball courts' });
    assert.equal(byWord.data.total, 1);
    assert.equal(byWord.data.items[0].id, 'pc:court:rec-park');
    assert.equal(byWord.data.provenance.generated, '2026-11-08T00:00:00Z');
    assert.ok(byWord.data.provenance.notOfficial);
    const byType = await call(rpc, 'atlas_search', { type: 'place' });
    assert.deepEqual(byType.data.items.map((i) => i.id).sort(), ['pc:place:far-pier', 'pc:place:library']);
  });
});

test('atlas_get resolves links and errors on an unknown id', async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async () => {
    const got = await call(rpc, 'atlas_get', { id: 'pc:court:rec-park' });
    assert.equal(got.isError, false);
    const lib = got.data.record.links.find((l) => l.id === 'pc:place:library');
    assert.equal(lib.resolved, true);
    assert.equal(lib.name, 'El Segundo Library');
    // PointCast reads the merged index for atlas_get, so the sister link resolves and the sister's incoming link shows.
    const sister = got.data.record.links.find((l) => l.id === 'es:court:recreation-park');
    assert.equal(sister.resolved, true);
    assert.ok(got.data.record.incoming.some((i) => i.id === 'es:court:recreation-park'));
    const bad = await call(rpc, 'atlas_get', { id: 'pc:court:nope' });
    assert.equal(bad.isError, true);
    assert.match(bad.line, /Unknown atlas id/);
  });
});

test('atlas_get on a sister id reads the merged index', async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async (urls) => {
    const got = await call(rpc, 'atlas_get', { id: 'es:court:recreation-park' });
    assert.equal(got.isError, false);
    assert.equal(got.data.record.links[0].resolved, true);
    assert.ok(urls.includes(`${BASE}/atlas/index.json`));
  });
});

test('atlas_near sorts by distance, clamps radius to 25, rejects bad lat', async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async () => {
    const near = await call(rpc, 'atlas_near', { lat: 33.9216, lon: -118.4113, radiusMiles: 5 });
    assert.deepEqual(near.data.items.map((i) => i.id), ['pc:court:rec-park', 'pc:place:library']);
    assert.ok(near.data.items[0].distanceMiles <= near.data.items[1].distanceMiles);
    assert.match(near.data.distanceNote, /Straight-line/);
    const wide = await call(rpc, 'atlas_near', { lat: 33.9216, lon: -118.4113, radiusMiles: 500 });
    assert.equal(wide.data.radiusMiles, 25);
    assert.ok(wide.data.items.some((i) => i.id === 'pc:place:far-pier'), 'far pier is ~15 miles away');
    const dflt = await call(rpc, 'atlas_near', { lat: 33.9216, lon: -118.4113 });
    assert.equal(dflt.data.radiusMiles, 1);
    const bad = await call(rpc, 'atlas_near', { lat: 123, lon: -118.4 });
    assert.equal(bad.isError, true);
    const missing = await call(rpc, 'atlas_near', { lon: -118.4 });
    assert.equal(missing.isError, true);
  });
});

test('atlas_links returns nodes and edges and resolves sister ids through the merged index', async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async () => {
    const g = await call(rpc, 'atlas_links', { id: 'pc:place:library' });
    assert.deepEqual(g.data.edges.map((e) => `${e.from}|${e.rel}|${e.to}`).sort(), ['pc:agent:desk-bot|about|pc:place:library', 'pc:court:rec-park|near|pc:place:library']);
    const court = await call(rpc, 'atlas_links', { id: 'pc:court:rec-park' });
    // PointCast reads the merged index for atlas_links, so the sister node resolves with its name.
    const sister = court.data.nodes.find((n) => n.id === 'es:court:recreation-park');
    assert.equal(sister.name, 'Recreation Park courts');
    assert.notEqual(sister.resolved, false);
    const onlySame = await call(rpc, 'atlas_links', { id: 'pc:court:rec-park', rel: 'same-as' });
    assert.equal(onlySame.data.edges.length, 2, 'same-as both ways once the sister atlas is in the index');
    assert.equal((await call(rpc, 'atlas_links', { id: 'pc:nope:x' })).isError, true);
  });
});

test('a sister host as site reads the merged index filtered to that host; bad enum values are errors, not empty answers', async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async (urls) => {
    const es = await call(rpc, 'atlas_search', { site: 'elsegundo.xyz' });
    assert.equal(es.isError, false);
    assert.ok(es.data.items.length >= 1);
    assert.ok(es.data.items.every((i) => i.site === 'elsegundo.xyz'));
    assert.ok(urls.includes(`${BASE}/atlas/index.json`));
    const near = await call(rpc, 'atlas_near', { lat: 33.9217, lon: -118.4114, radiusMiles: 1, site: 'elsegundo.xyz', limit: 1 });
    assert.ok(near.data.items.every((i) => i.site === 'elsegundo.xyz'));
    assert.equal(near.data.offset, 0);
    const badType = await call(rpc, 'atlas_search', { type: 'nonsense' });
    assert.equal(badType.isError, true);
    assert.match(badType.line, /type must be one of/);
    const badRel = await call(rpc, 'atlas_links', { id: 'pc:court:rec-park', rel: 'bogus' });
    assert.equal(badRel.isError, true);
  });
});

test("site: 'all' reads /atlas/index.json, default reads /atlas.json", async (t) => {
  const { rpc } = await loadMcp(t);
  await withAtlas(async (urls) => {
    const def = await call(rpc, 'atlas_search', { q: 'recreation' });
    assert.equal(def.data.total, 1);
    assert.deepEqual(urls, [`${BASE}/atlas.json`]);
    const all = await call(rpc, 'atlas_search', { q: 'recreation', site: 'all' });
    assert.equal(all.data.total, 2);
    assert.ok(urls.includes(`${BASE}/atlas/index.json`));
    assert.equal(all.data.provenance.kind, 'merged-index');
  });
});

test('a failed fetch is a plain error', async (t) => {
  const { rpc, mcp } = await loadMcp(t);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('down', { status: 503 });
  try {
    const down = await call(rpc, 'atlas_search', { q: 'x' });
    assert.equal(down.isError, true);
    assert.match(down.line, /Atlas unavailable/);
  } finally { globalThis.fetch = realFetch; }
  assert.ok(mcp);
});
