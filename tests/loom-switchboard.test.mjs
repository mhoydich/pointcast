import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import {
  LIVE_MS, WARM_MS, DEFAULT_LIMIT, MAX_LIMIT, SAMPLE_NOTICE,
  buildSwitchboardGraph, coverageLine, inspectHtml, isCollatorEcho, lampFor,
  loomPermalink, parseRoomLimit, proseMentions, sampleSwitchboard, serveSwitchboard,
  stripQuotedAndCode, switchboardHtml,
} from '../src/lib/loom/switchboard.mjs';

const NOW = Date.parse('2026-11-27T16:15:00.000Z');
const at = (msAgo) => new Date(NOW - msAgo).toISOString();
const person = (name, extra = {}) => ({ name, kind: 'human', address: `@${name.toLowerCase()}`, ...extra });

function memoryKv() {
  const map = new Map();
  let puts = 0;
  return {
    map,
    puts: () => puts,
    get: async (key) => map.get(key) ?? null,
    put: async (key, value) => { puts += 1; map.set(key, value); },
  };
}

function codeOnly(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('quoted lines and code blocks are stripped before @mentions', () => {
  const body = [
    'Hello @ada',
    '> @quoted stays in the quote',
    '> > @nested also quoted',
    '```js',
    'const ping = "@coded";',
    '@fence',
    '```',
    'see `@inline` and ada@bea.com',
    'still @bea.',
    '```',
    '@unclosed is code',
  ].join('\n');
  const stripped = stripQuotedAndCode(body);
  assert.equal(stripped.includes('@quoted'), false);
  assert.equal(stripped.includes('@nested'), false);
  assert.equal(stripped.includes('@coded'), false);
  assert.equal(stripped.includes('@fence'), false);
  assert.equal(stripped.includes('@inline'), false);
  assert.equal(stripped.includes('@unclosed'), false);
  assert.deepEqual(proseMentions(body), ['ada', 'bea']);
});

test('collator echoes are the robot, @collator, and link copies', () => {
  assert.equal(isCollatorEcho({ from: { kind: 'robot', name: 'Collator', address: '@collator' }, kind: 'note' }), true);
  assert.equal(isCollatorEcho({ from: { kind: 'human', name: 'Ada', address: '@collator' }, kind: 'note' }), true);
  assert.equal(isCollatorEcho({ from: { kind: 'robot', name: 'Other', address: '@other' }, kind: 'note' }), true);
  assert.equal(isCollatorEcho({ from: person('Ada'), kind: 'link', body: 'echo' }), true);
  assert.equal(isCollatorEcho({ from: person('Ada'), kind: 'note', body: 'real' }), false);
});

test('buildSwitchboardGraph builds desks, rooms, cords, and coverage', () => {
  const logs = [
    {
      address: '#Loom',
      title: 'The Loom',
      messages: [
        { id: 'm_qada01', at: at(2 * 60 * 60 * 1000), from: person('Ada'), kind: 'question', body: 'Is the lamp on?\n> @cal\n```\n@ghost\n```\nAsk @bea.' },
        { id: 'm_aed001', at: at(30 * 60 * 1000), from: person('Ed'), kind: 'answer', parent: 'm_qada01', body: 'It is on.' },
        { id: 'm_link01', at: at(60 * 1000), from: person('Linker'), kind: 'link', body: 'echo of a post @bea' },
        { id: 'm_robot1', at: at(60 * 1000), from: { name: 'Collator', kind: 'robot', address: '@collator' }, kind: 'note', body: 'welcome @ada' },
        { id: 'm_hidden', at: at(60 * 1000), from: person('Ada'), kind: 'note', body: 'hidden @bea', hidden: true },
        { id: 'm_note01', at: at(2 * 60 * 1000), from: { ...person('Bea'), kind: 'agent', operator: 'Mike' }, kind: 'note', body: 'Chart is up.' },
      ],
    },
    {
      address: '#loom-ux',
      title: 'Loom UX',
      messages: [
        { id: 'm_claim1', at: at(3 * WARM_MS), from: person('Cal'), kind: 'claim', body: 'I will draw the bezel.', taskStatus: { status: 'open' } },
        { id: 'm_done01', at: at(WARM_MS), from: person('Cal'), kind: 'question', body: 'Already finished?', taskStatus: { status: 'done' } },
        { id: 'm_openb1', at: at(10 * 60 * 1000), from: person('Ada'), kind: 'question', body: 'Is the cord chart ready @bea?' },
      ],
    },
  ];
  const graph = buildSwitchboardGraph(logs, { now: NOW, scannedRooms: 2, totalRooms: 5, missedRooms: ['#market-research'], truncated: true });
  const ids = graph.desks.map((desk) => desk.id);
  assert.deepEqual(ids.filter((id) => id === 'collator' || id === 'linker' || id === 'ghost'), []);
  assert.ok(ids.includes('ada') && ids.includes('bea') && ids.includes('cal') && ids.includes('ed'));

  const ada = graph.desks.find((desk) => desk.id === 'ada');
  const bea = graph.desks.find((desk) => desk.id === 'bea');
  const cal = graph.desks.find((desk) => desk.id === 'cal');
  assert.equal(ada.waitingCount, 1);
  assert.equal(ada.count, 2);
  assert.equal(ada.lamp, 'waiting');
  assert.equal(bea.kind, 'agent');
  assert.equal(bea.operator, 'Mike');
  assert.equal(bea.handle, '@bea');
  assert.equal(bea.waitingCount, 1);
  assert.equal(bea.lamp, 'waiting');
  assert.equal(cal.waitingCount, 1);
  assert.equal(cal.lamp, 'waiting');

  const loom = graph.rooms.find((room) => room.address === '#loom');
  const ux = graph.rooms.find((room) => room.address === '#loom-ux');
  assert.equal(loom.count, 3);
  assert.equal(loom.openAsks, 0);
  assert.equal(ux.count, 3);
  assert.equal(ux.openAsks, 2);
  assert.equal(ux.lamp, 'waiting');

  const roomCord = graph.cords.find((cord) => cord.id === 'room:ada>#loom');
  assert.equal(roomCord.weight, 1);
  assert.equal(roomCord.kind, 'room');
  assert.equal(roomCord.permalink, loomPermalink('#loom', 'm_qada01'));
  assert.equal(roomCord.permalink, 'https://pointcast.xyz/loom?to=%23loom#m_qada01');
  assert.match(roomCord.snippet, /Ask @bea/);

  const handoff = graph.cords.find((cord) => cord.kind === 'handoff' && cord.from === 'ada' && cord.to === 'bea');
  assert.ok(handoff);
  assert.equal(handoff.weight, 2);
  assert.equal(graph.cords.some((cord) => cord.to === 'cal' && cord.kind === 'handoff'), false);
  assert.equal(graph.cords.some((cord) => cord.to === 'ghost'), false);

  assert.deepEqual(graph.coverage, { scannedRooms: 2, totalRooms: 5, missedRooms: ['#market-research'], truncated: true });
});

test('lamps follow post age, and waiting wins over a fresh post', () => {
  assert.equal(lampFor({ at: NOW - LIVE_MS, now: NOW }), 'live');
  assert.equal(lampFor({ at: NOW - LIVE_MS - 1, now: NOW }), 'warm');
  assert.equal(lampFor({ at: NOW - WARM_MS, now: NOW }), 'warm');
  assert.equal(lampFor({ at: NOW - WARM_MS - 1, now: NOW }), 'idle');
  assert.equal(lampFor({ at: NOW, waitingCount: 2, now: NOW }), 'waiting');
});

test('a long post is clipped to a single-line snippet on the cord', () => {
  const body = `  ${'word '.repeat(80)}`;
  const graph = buildSwitchboardGraph([{ address: '#loom', messages: [{ id: 'm_long01', at: at(0), from: person('Ada'), kind: 'note', body }] }], { now: NOW });
  const cord = graph.cords[0];
  assert.equal(cord.snippet.length, 140);
  assert.equal(cord.snippet.endsWith('…'), true);
  assert.equal(cord.snippet.includes('\n'), false);
});

test('sample board is labeled and has desks, rooms, and a handoff', () => {
  const board = sampleSwitchboard(NOW);
  assert.equal(board.sample, true);
  assert.equal(board.notice, SAMPLE_NOTICE);
  assert.ok(board.desks.length >= 4);
  assert.ok(board.rooms.map((room) => room.address).includes('#officenoun-tasks'));
  for (const address of ['#loom', '#loom-v2', '#loom-ux', '#loom-rush', '#market-research']) {
    assert.ok(board.rooms.some((room) => room.address === address), address);
  }
  assert.equal(board.desks.find((desk) => desk.id === 'ada').lamp, 'live');
  assert.equal(board.desks.find((desk) => desk.id === 'bea').lamp, 'waiting');
  assert.equal(board.desks.find((desk) => desk.id === 'cal').lamp, 'idle');
  assert.equal(board.desks.find((desk) => desk.id === 'ed').lamp, 'warm');
  assert.ok(board.cords.some((cord) => cord.kind === 'handoff' && cord.from === 'ada' && cord.to === 'bea'));
  assert.equal(coverageLine(board).includes('Not a read of the live Loom'), true);
  const html = switchboardHtml(board);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /Relay click/);
  assert.match(html, /Demonstration board/);
  assert.equal(html.includes('<script>'), false);
});

test('markup escapes post text', () => {
  const graph = buildSwitchboardGraph([
    { address: '#loom', messages: [{ id: 'm_html01', at: at(0), from: person('Ada'), kind: 'note', body: '<script>alert(1)</script> @bea' }] },
    { address: '#loom-ux', messages: [{ id: 'm_bea001', at: at(0), from: person('Bea'), kind: 'note', body: 'here' }] },
  ], { now: NOW });
  const html = switchboardHtml({ ...graph, sample: false, notice: 'n', generatedAt: new Date(NOW).toISOString() });
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  const inspect = inspectHtml({ ...graph, generatedAt: new Date(NOW).toISOString() }, { type: 'cord', id: 'handoff:ada>bea' });
  assert.match(inspect, /Open this thread on the Loom/);
  assert.match(inspect, /href="https:\/\/pointcast\.xyz\/loom\?to=%23loom#m_html01"/);
});

test('room limit clamps to the default and the maximum', () => {
  assert.equal(parseRoomLimit(null), DEFAULT_LIMIT);
  assert.equal(parseRoomLimit(''), DEFAULT_LIMIT);
  assert.equal(parseRoomLimit('nope'), DEFAULT_LIMIT);
  assert.equal(parseRoomLimit('0'), DEFAULT_LIMIT);
  assert.equal(parseRoomLimit('2'), 2);
  assert.equal(parseRoomLimit(String(MAX_LIMIT + 30)), MAX_LIMIT);
});

function fakeLoom(handlers) {
  const calls = [];
  const loom = async (request) => {
    assert.equal(request.method, 'GET');
    calls.push(request.url);
    const url = new URL(request.url);
    const to = url.searchParams.get('to');
    if (!to) return Response.json(handlers.directory);
    if (handlers.fail?.has(to)) return new Response('no', { status: 500 });
    return Response.json(handlers.rooms[to]);
  };
  return { loom, calls };
}

const directoryEntry = (address, updatedAt) => ({ address, kind: 'topic', updatedAt, key: address, count: 1, last: { name: 'Ada', kind: 'human' } });

test('the route reads rooms through handleLoom GETs and reports coverage', async () => {
  const rooms = {};
  const logs = [];
  for (let i = 0; i < 5; i += 1) {
    const address = `#room-${i}`;
    logs.push(directoryEntry(address, `2026-11-27T16:0${i}:00.000Z`));
    rooms[address] = { ok: true, kvBound: true, log: { address, title: address }, messages: [{ id: `m_room${i}a`, at: at(60 * 1000), from: person('Ada'), kind: 'note', body: `note ${i}` }] };
  }
  const { loom, calls } = fakeLoom({ directory: { ok: true, kvBound: true, logs }, rooms, fail: new Set(['#room-4']) });
  const kv = { get: async () => { throw new Error('direct get'); }, put: async () => { throw new Error('direct put'); } };
  const response = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard?limit=3'), { kv, clock: () => new Date(NOW), loom });
  const json = await response.json();
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.sample, false);
  assert.equal(json.limit, 3);
  assert.equal(json.coverage.totalRooms, 5);
  assert.equal(json.coverage.truncated, true);
  assert.equal(json.coverage.scannedRooms, 2);
  assert.deepEqual(json.coverage.missedRooms, ['#room-4']);
  assert.equal(calls.filter((url) => url.includes('to=')).length, 3);
  assert.ok(calls.every((url) => url.startsWith('https://pointcast.xyz/api/loom')));
  assert.equal(calls.some((url) => url.includes('compact=1')), true);
  assert.equal(json.desks.some((desk) => desk.id === 'ada'), true);
});

test('ETag and If-None-Match return 304, including a weak tag', async () => {
  const { loom } = fakeLoom({
    directory: { ok: true, kvBound: true, logs: [directoryEntry('#loom', '2026-11-27T16:00:00.000Z')] },
    rooms: { '#loom': { ok: true, log: { address: '#loom' }, messages: [{ id: 'm_etag01', at: at(60 * 1000), from: person('Ada'), kind: 'note', body: 'etag' }] } },
  });
  const opts = { kv: { get: async () => null, put: async () => { throw new Error('put'); } }, clock: () => new Date(NOW), loom };
  const first = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard'), opts);
  const etag = first.headers.get('etag');
  assert.match(first.headers.get('cache-control'), /max-age=15/);
  assert.match(first.headers.get('content-type'), /application\/json/);
  assert.match(etag, /^"[0-9a-f]{64}"$/);
  const again = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard', { headers: { 'If-None-Match': `W/${etag}, "other"` } }), opts);
  assert.equal(again.status, 304);
  assert.equal(again.headers.get('etag'), etag);
  assert.equal(await again.text(), '');
  const head = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard', { method: 'HEAD' }), opts);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('etag'), etag);
  assert.equal(await head.text(), '');
});

test('unbound KV and an empty directory return the labeled sample with 200', async () => {
  const unbound = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard'), { kv: null, clock: () => new Date(NOW) });
  const body = await unbound.json();
  assert.equal(unbound.status, 200);
  assert.equal(body.sample, true);
  assert.equal(body.notice, SAMPLE_NOTICE);
  assert.ok(body.desks.length >= 4);
  assert.match(unbound.headers.get('cache-control'), /max-age=60/);

  const seed = { address: '#loom', kind: 'topic', updatedAt: '2026-10-20T16:00:00.000Z', last: { name: 'Collator', kind: 'robot' } };
  let gets = 0;
  const loom = async () => Response.json({ ok: true, kvBound: true, logs: [seed] });
  const kv = { get: async () => { gets += 1; return null; }, put: async () => { throw new Error('put'); } };
  const empty = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard'), { kv, clock: () => new Date(NOW), loom });
  const emptyBody = await empty.json();
  assert.equal(empty.status, 200);
  assert.equal(emptyBody.sample, true);
  assert.equal(gets, 0);
});

test('POST is refused and the module does not name log keys or call KV itself', async () => {
  const refused = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard', { method: 'POST' }), { kv: null });
  assert.equal(refused.status, 405);
  assert.match(refused.headers.get('allow'), /GET, HEAD/);
  const src = codeOnly(readFileSync(new URL('../src/lib/loom/switchboard.mjs', import.meta.url), 'utf8'));
  const route = codeOnly(readFileSync(new URL('../functions/api/loom/switchboard.ts', import.meta.url), 'utf8'));
  assert.equal(src.includes('loom:log'), false);
  assert.equal(/kv\.get\(/.test(src), false);
  assert.equal(/kv\.put\(/.test(src), false);
  assert.match(route, /PC_LOOM_KV \?\? env\.VISITS/);
  assert.equal(route.includes('loom:log'), false);
  assert.equal(/kv\.get\(/.test(route), false);
  assert.equal(/kv\.put\(/.test(route), false);
});

test('a real handleLoom read drops collator welcomes and link copies, and does not write', async () => {
  const kv = memoryKv();
  let tick = Date.parse('2026-11-27T16:00:00.000Z');
  const clock = () => new Date(tick);
  const post = async (body, hello = false) => {
    tick += 1000;
    const response = await handleLoom(new Request('https://pointcast.xyz/api/loom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `10.9.0.${tick % 200}` },
      body: JSON.stringify(body),
    }), { kv, clock, firstHelloEnabled: hello });
    const json = await response.json();
    assert.equal(json.ok, true, JSON.stringify(json));
    return json;
  };
  const ada = { name: 'Ada', kind: 'human', address: '@ada' };
  const bea = { name: 'Bea', kind: 'agent', address: '@bea', operator: 'Mike' };
  const question = await post({ to: '#loom', from: ada, kind: 'question', body: 'Is the row straight?' }, true);
  await post({ to: question.address, from: bea, kind: 'answer', body: 'Yes.' });
  await post({
    to: '#loom',
    from: ada,
    kind: 'note',
    body: ['> @cal quoted', '```', '@ghost', '```', 'The cord is for @bea.'].join('\n'),
  });
  await post({ to: '#loom-ux', from: bea, kind: 'question', body: 'Leave the waiting lamp on?' });
  await post({ to: '#loom', from: { name: 'Linker', kind: 'human', address: '@linker' }, kind: 'link', body: 'a link copy @bea' });

  const stored = await (await handleLoom(new Request('https://pointcast.xyz/api/loom?to=%23loom'), { kv })).json();
  assert.equal(stored.messages.some((message) => message.from?.address === '@collator' || message.from?.kind === 'robot'), true);

  const writes = kv.puts();
  const response = await serveSwitchboard(new Request('https://pointcast.xyz/api/loom/switchboard?limit=4'), { kv, clock: () => new Date(tick + 60 * 1000) });
  assert.equal(kv.puts(), writes);
  const board = await response.json();
  assert.equal(board.sample, false);
  assert.equal(board.desks.some((desk) => desk.id === 'collator' || desk.id === 'linker'), false);
  assert.equal(board.desks.find((desk) => desk.id === 'ada').waitingCount, 0);
  assert.equal(board.desks.find((desk) => desk.id === 'bea').operator, 'Mike');
  assert.equal(board.desks.find((desk) => desk.id === 'bea').lamp, 'waiting');
  const handoff = board.cords.find((cord) => cord.kind === 'handoff');
  assert.equal(handoff.from, 'ada');
  assert.equal(handoff.to, 'bea');
  assert.equal(handoff.permalink.startsWith('https://pointcast.xyz/loom?to=%23loom#'), true);
  assert.equal(board.rooms.some((room) => room.address === '#loom'), true);
  assert.equal(board.rooms.some((room) => room.address === '#loom-ux'), true);
  assert.equal(board.coverage.missedRooms.length, 0);
  assert.equal(board.coverage.truncated, false);
});

test('the sketch page is phone-first, self-contained, and ships the click off', () => {
  const page = readFileSync(new URL('../src/pages/sketches/switchboard/index.astro', import.meta.url), 'utf8');
  assert.match(page, /name="viewport"/);
  assert.match(page, /prefers-reduced-motion:\s*reduce/);
  assert.match(page, /animation:\s*none/);
  assert.doesNotMatch(page, /fonts\.google|cdn\.|unpkg|jsdelivr|@import|@font-face/i);
  const minWidths = [...page.matchAll(/min-width:\s*(\d+)px/g)].map((match) => Number(match[1]));
  assert.deepEqual(minWidths, [720]);
  assert.match(page, /min-width:\s*0/);
  assert.match(page, /switchboardHtml/);
  assert.match(page, /mountSwitchboard/);
});
