/**
 * Front door + broadcast MCP tools (2026-11-03): start_here, on_air,
 * broadcast_feeds, syndication_card, and /broadcast.json.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  BROADCAST_TOOL_DEFINITIONS,
  BROADCAST_TOOL_NAMES,
  START_HERE_GROUPS,
  buildBroadcastFrame,
  dispatchBroadcastTool,
  itemsSince,
  shortPost,
  toBroadcastItems,
} from '../src/lib/broadcast-mcp.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const mcp = read('functions/api/mcp.ts');
const libs = ['bench', 'station', 'wild', 'civil-service', 'radio', 'tug', 'broadcast', 'contributions'].map((n) => read(`src/lib/${n}-mcp.ts`)).join('\n') + read('src/lib/real-estate-agent.mjs') + read('functions/_lib/ai-companions.ts');

const feedItem = (id, title, at, channel = 'FD', dek = '') => ({
  id: `https://pointcast.xyz/b/${id}`,
  url: `https://pointcast.xyz/b/${id}`,
  title,
  summary: dek || undefined,
  date_published: at,
  image: `https://pointcast.xyz/images/og/b/${id}.png`,
  _pointcast: { id, channel: { code: channel, name: channel === 'ESC' ? 'El Segundo' : 'Front Door' }, type: 'READ' },
});
const FEED = {
  items: [
    feedItem('0771', 'Three new rooms', '2026-10-30T20:00:00.000Z', 'SPN'),
    feedItem('0775', 'Before We Require Service, Make It Worth Choosing', '2026-11-02T02:38:51.000Z', 'ESC', 'A civic read on service hours.'),
    { id: 'std', url: 'https://pointcast.xyz/standards/x', title: 'A standard', date_published: '2026-11-01T00:00:00Z', _pointcast: { id: null } },
  ],
};

function fakeFetcher(map) {
  return async (url) => {
    const key = Object.keys(map).find((k) => url.endsWith(k));
    if (!key || map[key] === null) return new Response('nope', { status: 503 });
    return new Response(JSON.stringify(map[key]), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

test('four read-only tools, wired first into the server and the instructions', () => {
  assert.deepEqual(BROADCAST_TOOL_NAMES, ['start_here', 'on_air', 'broadcast_feeds', 'syndication_card']);
  for (const t of BROADCAST_TOOL_DEFINITIONS) assert.match(t.description, /read-only/i, t.name);
  for (const bit of ['...BROADCAST_TOOL_DEFINITIONS,', 'dispatchBroadcastTool(name, args, { base, toolCount: TOOLS.length })', 'call start_here first']) assert.ok(mcp.includes(bit), bit);
  assert.ok(mcp.indexOf('...BROADCAST_TOOL_DEFINITIONS,') < mcp.indexOf('...TOOL_DEFINITIONS,'), 'front door lists first');
  assert.match(mcp, /const WRITE_TOOL_NAMES = new Set\(\[[^\]]*\]\)/s);
  for (const name of BROADCAST_TOOL_NAMES) assert.ok(!new RegExp(`WRITE_TOOL_NAMES[^;]*'${name}'`, 's').test(mcp), `${name} is not a write`);
});

test('every tool start_here points to is a real tool', () => {
  const named = START_HERE_GROUPS.flatMap((g) => g.tools);
  for (const name of named) assert.ok(mcp.includes(`'${name}'`) || libs.includes(`name: '${name}'`), `start_here names ${name}, which no definition has`);
  assert.equal(new Set(named).size, named.length, 'no tool listed twice');
});

test('start_here returns the groups, the rules and the tool count', async () => {
  const out = await dispatchBroadcastTool('start_here', {}, { toolCount: 123 });
  assert.ok(!out.isError);
  assert.match(out.content[0].text, /123 tools/);
  const j = JSON.parse(out.content[1].text);
  assert.equal(j.groups.length, START_HERE_GROUPS.length);
  assert.ok(j.rules.some((r) => /Ask your person/.test(r)));
  assert.ok(j.rules.some((r) => /plan: nothing is on air/.test(r)));
});

test('feed items become cited broadcast items, newest first, standards skipped', () => {
  const items = toBroadcastItems(FEED.items);
  assert.deepEqual(items.map((i) => i.id), ['0775', '0771']);
  assert.equal(items[0].citation, 'PointCast · CH.ESC · № 0775 — “Before We Require Service, Make It Worth Choosing” · 2026-11-02 · https://pointcast.xyz/b/0775');
  assert.deepEqual(itemsSince(items, '2026-11-01T00:00:00Z').map((i) => i.id), ['0775']);
  assert.equal(itemsSince(items, 'not a date').length, 2);
});

test('on_air composes one frame and honours since', async () => {
  const fetcher = fakeFetcher({
    '/feed.json': FEED,
    '/now.json': { featured: { title: 'Bells / Bloom', url: 'https://pointcast.xyz/showcast/bells-bloom' }, broadcast: { cardOfTheDay: { id: 555, note: 'shaker drum card' } } },
    '/morning.json': { number: 31, title: 'Morning Edition No. 31', frozen: true, slots: [{ label: 'Sky · 6.100', line: 'No marine layer.' }] },
    '/api/station': { name: 'Mike Hoydich Radio', onAir: { live: false }, recent: [{ t: 'Song', a: 'Artist' }] },
  });
  const now = () => new Date('2026-11-03T04:00:00Z');
  const out = await dispatchBroadcastTool('on_air', {}, { base: 'https://pointcast.xyz', fetcher, now });
  assert.ok(!out.isError);
  const f = JSON.parse(out.content[1].text);
  assert.equal(f.schema, 'pointcast.broadcast/v1');
  assert.equal(f.cursor, '2026-11-02T02:38:51.000Z');
  assert.equal(f.headline.url, 'https://pointcast.xyz/b/0775');
  assert.equal(f.morning.number, 31);
  assert.equal(f.station.lastPlayed, 'Song — Artist');
  assert.equal(f.cardOfTheDay.id, 555);
  assert.deepEqual(f.missing, []);
  assert.match(f.note, /plan/);

  const again = await dispatchBroadcastTool('on_air', { since: f.cursor }, { fetcher, now });
  const g = JSON.parse(again.content[1].text);
  assert.equal(g.newCount, 0);
  assert.equal(g.cursor, f.cursor);
});

test('on_air degrades when side sources fail and errors only without the feed', async () => {
  const partial = await dispatchBroadcastTool('on_air', {}, { fetcher: fakeFetcher({ '/feed.json': FEED }) });
  assert.ok(!partial.isError);
  assert.deepEqual(JSON.parse(partial.content[1].text).missing, ['now', 'morning', 'station']);
  const none = await dispatchBroadcastTool('on_air', {}, { fetcher: fakeFetcher({}) });
  assert.equal(none.isError, true);
});

test('syndication_card quotes the block, stays under 280 and suggests elsegundo.xyz for ESC', async () => {
  const fetcher = fakeFetcher({ '/feed.json': FEED });
  const out = await dispatchBroadcastTool('syndication_card', { id: '0775' }, { fetcher });
  const card = JSON.parse(out.content[1].text);
  assert.ok(card.shortPost.length <= 280);
  assert.ok(card.shortPost.endsWith('https://pointcast.xyz/b/0775'));
  assert.ok(card.crossPost.some((c) => c.where === 'elsegundo.xyz'));
  assert.match(card.rules, /Your person posts it/);
  const spn = await dispatchBroadcastTool('syndication_card', { id: '0771' }, { fetcher });
  assert.ok(!JSON.parse(spn.content[1].text).crossPost.some((c) => c.where === 'elsegundo.xyz'));
  const missing = await dispatchBroadcastTool('syndication_card', { id: '9999' }, { fetcher });
  assert.equal(missing.isError, true);
  const long = shortPost({ ...toBroadcastItems(FEED.items)[0], dek: 'x'.repeat(600) });
  assert.ok(long.length <= 280 && long.includes('…'));
});

test('broadcast_feeds and /broadcast.json point at routes that exist', async () => {
  const out = await dispatchBroadcastTool('broadcast_feeds', {});
  const { feeds } = JSON.parse(out.content[1].text);
  const routes = { '/feed.xml': 'src/pages/feed.xml.ts', '/rss.xml': 'src/pages/rss.xml.js', '/feed.json': 'src/pages/feed.json.ts', '/explore.rss': 'src/pages/explore.rss.ts', '/morning.xml': 'functions/morning.xml.ts', '/morning.json': 'functions/morning.json.ts', '/broadcast.json': 'src/pages/broadcast.json.ts', '/now.json': 'src/pages/now.json.ts', '/today.json': 'src/pages/today.json.ts', '/blocks.json': 'src/pages/blocks.json.ts', '/llms.txt': 'public/llms.txt', '/agents.json': 'src/pages/agents.json.ts' };
  for (const f of feeds) {
    const path = new URL(f.url).pathname;
    assert.ok(routes[path], `no route mapped for ${path}`);
    assert.doesNotThrow(() => read(routes[path]), `${routes[path]} exists`);
  }
  const page = read('src/pages/broadcast.json.ts');
  assert.ok(page.includes('buildBroadcastFrame'));
});

test('the frame builder clamps limit and never claims radio is live', () => {
  const f = buildBroadcastFrame({ feedItems: FEED.items, generatedAt: '2026-11-03T00:00:00Z', limit: 99 });
  assert.ok(f.items.length <= 25);
  assert.equal(f.station, null);
  assert.doesNotMatch(JSON.stringify(f), /radio is on air|broadcasting on/i);
});

test('connector manifests lead with the front door', () => {
  const c = read('src/lib/pointcast-connectors.ts');
  assert.equal((c.match(/'start_here',/g) || []).length, 2);
  assert.equal((c.match(/'trading_desk_read',/g) || []).length, 2);
});

test('explicit annotations survive and reads say idempotent', () => {
  assert.match(mcp, /toolAnnotations\(tool\.name, \(tool as \{ annotations\?: Record<string, unknown> \}\)\.annotations\)/);
  assert.match(mcp, /idempotentHint: !isWrite/);
});
