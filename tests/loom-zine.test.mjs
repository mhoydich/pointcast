import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleLoom } from '../src/lib/loom/service.mjs';
import {
  buildLoomZine, collectLoomLogs, formatZineText, isCollatorEcho, serveLoomZine,
} from '../src/lib/loom/loom-zine.mjs';

const NOW = new Date('2026-11-27T18:00:00.000Z');
const ORIGIN = 'https://pointcast.xyz/api/loom/zine';
const at = (iso) => iso;

function memoryKv() {
  const map = new Map();
  return { map, get: async (key) => map.get(key) ?? null, put: async (key, value) => { map.set(key, value); } };
}

function message(partial) {
  return {
    id: partial.id,
    at: partial.at,
    from: partial.from,
    kind: partial.kind || 'note',
    body: partial.body,
    parent: partial.parent ?? null,
    hidden: partial.hidden || false,
  };
}

function room(address, messages, title = address) {
  return { log: { address, title, kind: 'topic' }, messages };
}

const human = (name) => ({ name, kind: 'human', address: `@${name.toLowerCase()}` });
const agent = (name) => ({ name, kind: 'agent', address: `@${name.toLowerCase()}` });

function edition(logs, options = {}) {
  return buildLoomZine(logs, { now: NOW, ...options });
}

test('collator echoes are robot lines, the @collator address, or link copies', () => {
  assert.equal(isCollatorEcho({ kind: 'note', from: { kind: 'robot', address: '@collator', name: 'Collator' } }), true);
  assert.equal(isCollatorEcho({ kind: 'note', from: { kind: 'agent', address: '@collator', name: 'Collator' } }), true);
  assert.equal(isCollatorEcho({ kind: 'link', from: human('Ada'), body: 'DONE · copied' }), true);
  assert.equal(isCollatorEcho({ kind: 'note', from: human('Ada'), body: 'a real dispatch' }), false);
});

test('the sheet drops collator echoes, including a copied DONE with a proof link', () => {
  const built = edition([room('#loom', [
    message({ id: 'welcome', at: at('2026-11-27T16:00:00.000Z'), from: { name: 'Collator', kind: 'robot', address: '@collator' }, body: 'This note is automatic: nobody is watching live right now.' }),
    message({ id: 'echo', at: at('2026-11-27T16:05:00.000Z'), from: human('Ada'), kind: 'link', body: 'DONE · the brief is on main https://github.com/mhoydich/pointcast/pull/1945' }),
    message({ id: 'real', at: at('2026-11-27T16:10:00.000Z'), from: agent('Shwa'), body: 'The column is 390px on a phone.' }),
    message({ id: 'hidden', at: at('2026-11-27T16:20:00.000Z'), from: human('Ada'), hidden: true, body: 'DONE · secret https://github.com/mhoydich/pointcast/pull/9' }),
  ])]);
  assert.equal(built.masthead.dispatches, 1);
  assert.equal(built.leadStory.id, 'real');
  assert.equal(built.masthead.doneCount, 0);
  const text = formatZineText(built);
  assert.doesNotMatch(text, /automatic|pull\/1945|secret/);
  assert.match(text, /390px on a phone/);
});

test('a DONE receipt with a proof link leads, ahead of a busier thread', () => {
  const replies = ['Cay', 'Dee', 'Eve', 'Bo'].map((name, index) => message({
    id: `r${index}`,
    at: new Date(Date.parse('2026-11-27T12:00:00.000Z') + (index + 1) * 60000).toISOString(),
    from: human(name), parent: 'root', body: `${name} agrees with the column.`,
  }));
  const built = edition([
    room('#loom-ux', [
      message({ id: 'root', at: at('2026-11-27T12:00:00.000Z'), from: human('Nia'), body: 'The column is 390px on a phone.' }),
      ...replies,
    ]),
    room('#loom', [
      message({ id: 'done', at: at('2026-11-27T15:00:00.000Z'), from: agent('Shwa'), body: 'DONE · the brief is on main https://github.com/mhoydich/pointcast/pull/1945' }),
    ]),
  ]);
  assert.equal(built.leadStory.id, 'done');
  assert.equal(built.leadStory.room, '#loom');
  assert.equal(built.leadStory.headline, 'the brief is on main');
  assert.equal(built.leadStory.byline, 'Shwa · agent');
  assert.equal(built.leadStory.proof, 'https://github.com/mhoydich/pointcast/pull/1945');
  assert.match(built.leadStory.permalink, /^https:\/\/pointcast\.xyz\/loom\?to=%23loom#done$/);
  assert.equal(built.masthead.doneCount, 1);
  assert.equal(built.masthead.dispatches, 6);
  assert.equal(built.leadStory.replies, 0);
});

test('without a proof link, the lead is the most-replied thread', () => {
  const built = edition([
    room('#loom-ux', [
      message({ id: 'root', at: at('2026-11-27T12:00:00.000Z'), from: human('Nia'), body: 'The column is 390px on a phone.' }),
      message({ id: 'r1', at: at('2026-11-27T12:10:00.000Z'), from: human('Cay'), parent: 'root', body: 'Agreed.' }),
      message({ id: 'r2', at: at('2026-11-27T12:20:00.000Z'), from: human('Dee'), parent: 'root', body: 'Agreed again.' }),
    ]),
    room('#officenoun-tasks', [
      message({ id: 'bare', at: at('2026-11-27T17:00:00.000Z'), from: agent('Sol'), body: 'DONE · type is set' }),
    ]),
  ]);
  assert.equal(built.leadStory.id, 'root');
  assert.equal(built.leadStory.replies, 2);
  assert.equal(built.leadStory.headline, 'The column is 390px on a phone.');
});

test('wire briefs come from the busiest rooms and each line has a permalink', () => {
  const built = edition([
    room('#loom', [message({ id: 'lead', at: at('2026-11-27T16:00:00.000Z'), from: agent('Shwa'), body: 'DONE · the brief is on main https://github.com/mhoydich/pointcast/pull/1945' })]),
    room('#officenoun-tasks', [
      message({ id: 'a', at: at('2026-11-27T13:00:00.000Z'), from: agent('Sol'), body: 'First task note.' }),
      message({ id: 'b', at: at('2026-11-27T14:00:00.000Z'), from: human('Ada'), body: 'Second task note.' }),
      message({ id: 'c', at: at('2026-11-27T15:00:00.000Z'), from: human('Nia'), body: 'Third task note.' }),
    ]),
  ]);
  assert.equal(built.leadStory.id, 'lead');
  assert.equal(built.wireBriefs[0].room, '#officenoun-tasks');
  assert.equal(built.wireBriefs[0].dispatches, 3);
  assert.equal(built.wireBriefs[0].items[0].line.startsWith('Nia:'), true);
  for (const item of built.wireBriefs[0].items) {
    assert.match(item.permalink, /https:\/\/pointcast\.xyz\/loom\?to=%23officenoun-tasks#/);
  }
  assert.equal(built.wireBriefs.length, 1);
});

test('the waiting desk lists open asks and claims, and drops ones that were closed', () => {
  const built = edition([
    room('#loom-ux', [
      message({ id: 'ask', at: at('2026-11-27T14:00:00.000Z'), from: agent('Sol'), body: 'NEEDS Mike · a yes on the column width' }),
      message({ id: 'stranger', at: at('2026-11-27T14:10:00.000Z'), from: human('Nia'), parent: 'ask', body: 'CLEARED' }),
      message({ id: 'closed-ask', at: at('2026-11-27T13:00:00.000Z'), from: human('Ada'), body: 'NEEDS Sky · approve the ink' }),
      message({ id: 'sky', at: at('2026-11-27T13:30:00.000Z'), from: agent('Sky'), parent: 'closed-ask', body: 'CLEARED' }),
      message({ id: 'q', at: at('2026-11-27T15:00:00.000Z'), from: human('Ike'), kind: 'question', body: '@Sky is the court dry?' }),
      message({ id: 'answered', at: at('2026-11-27T11:00:00.000Z'), from: human('Bo'), kind: 'question', body: '@Sky can you see the tide?' }),
      message({ id: 'answer', at: at('2026-11-27T11:20:00.000Z'), from: agent('Sky'), parent: 'answered', body: 'Yes.' }),
    ]),
    room('#officenoun-tasks', [
      message({ id: 'mine', at: at('2026-11-27T12:00:00.000Z'), from: human('Ada'), body: 'MINE · V2-3 set the type' }),
      message({ id: 'other', at: at('2026-11-27T16:00:00.000Z'), from: human('Ada'), body: 'DONE · V2-9 a different card' }),
      message({ id: 'finished', at: at('2026-11-27T10:00:00.000Z'), from: agent('Sol'), body: 'MINE · V2-1 wire the desk' }),
      message({ id: 'finish', at: at('2026-11-27T10:30:00.000Z'), from: agent('Sol'), body: 'DONE · V2-1 the desk is wired' }),
    ]),
  ]);
  const open = built.waitingDesk.map((row) => `${row.kind}:${row.who}:${row.waitingOn}`);
  assert.deepEqual(open.sort(), ['ask:Sol:Mike', 'claim:the desk:Ada', 'question:Ike:Sky'].sort());
  assert.equal(built.masthead.openAskCount, 3);
  const waitingText = formatZineText(built).split('WAITING DESK')[1];
  assert.match(waitingText, /Sol waiting on Mike \(#loom-ux\): NEEDS Mike/);
  assert.match(waitingText, /the desk waiting on Ada \(#officenoun-tasks\): MINE · V2-3/);
  assert.doesNotMatch(waitingText, /V2-1|approve the ink|can you see the tide/);
});

test('coverage, the edition date, and the plain-text sheet stay explicit', () => {
  const built = edition([
    room('#loom', [message({ id: 'm', at: at('2026-11-27T16:00:00.000Z'), from: human('Ada'), body: 'Hello from the desk.' })]),
  ], { coverage: { scannedRooms: 2, totalRooms: 5, missedRooms: ['#a', '#b'], truncated: true } });
  assert.equal(built.masthead.editionDate, '2026-11-27');
  assert.equal(built.masthead.editionLabel, 'Friday, 27 November 2026');
  assert.equal(built.masthead.volumeLabel, 'Vol. 2026 · No. 331');
  assert.equal(built.masthead.windowLabel, 'Last 24 hours');
  assert.deepEqual(built.masthead.coverage, { scannedRooms: 2, totalRooms: 5, missedRooms: ['#a', '#b'], truncated: true });
  const text = formatZineText(built);
  assert.match(text, /^THE LOOM DISPATCH\n/);
  assert.match(text, /Coverage: scanned 2 of 5 rooms · partial · missed #a, #b/);
  assert.match(text, /Hello from the desk/);
  assert.match(text, /Collator echoes are left out/);
});

test('a named UTC day keeps that day and leaves the surrounding hours out', () => {
  const logs = [room('#loom', [
    message({ id: 'yesterday', at: at('2026-11-26T12:00:00.000Z'), from: human('Ada'), body: 'Yesterday\'s dispatch.' }),
    message({ id: 'today', at: at('2026-11-27T12:00:00.000Z'), from: human('Ada'), body: 'Today\'s dispatch.' }),
    message({ id: 'edge', at: at('2026-11-27T00:00:00.000Z'), from: human('Ada'), body: 'Exactly midnight, next day.' }),
  ])];
  const yesterday = edition(logs, { day: '2026-11-26' });
  const today = edition(logs, { day: '2026-11-27' });
  assert.deepEqual(yesterday.leadStory && [yesterday.leadStory.id, yesterday.masthead.windowLabel], ['yesterday', 'UTC day 2026-11-26']);
  assert.equal(today.leadStory.id, 'today');
  assert.equal(today.masthead.dispatches, 2);
  const rolling = edition(logs);
  assert.equal(rolling.masthead.dispatches, 2);
  assert.equal(rolling.leadStory.id, 'today');
});

test('an empty preview says the store was not read', () => {
  const built = edition([], { preview: true, coverage: { scannedRooms: 0, totalRooms: 0, missedRooms: [], truncated: false } });
  assert.equal(built.leadStory, null);
  assert.equal(built.masthead.dispatches, 0);
  assert.equal(built.masthead.preview, true);
  const text = formatZineText(built);
  assert.match(text, /PREVIEW/);
  assert.match(text, /not a report that the day was quiet/);
  assert.match(text, /No lead dispatch/);
});

test('reads go through handleLoom GETs and never touch KV directly', async () => {
  const calls = [];
  const kv = {
    get() { throw new Error('direct get'); },
    put() { throw new Error('direct put'); },
  };
  const handle = async (request) => {
    calls.push(`${request.method} ${request.url}`);
    const url = new URL(request.url);
    if (url.searchParams.has('to')) {
      return Response.json({
        ok: true, kvBound: true,
        log: { address: '#loom', title: 'The Loom', kind: 'topic' },
        messages: [
          { id: 'bot', at: '2026-11-27T17:00:00.000Z', from: { name: 'Collator', kind: 'robot', address: '@collator' }, kind: 'note', body: 'This note is automatic: nobody is watching live right now.' },
          { id: 'echo', at: '2026-11-27T17:01:00.000Z', from: human('Ada'), kind: 'link', body: 'DONE · the brief is on main https://github.com/mhoydich/pointcast/pull/9' },
          { id: 'm1', at: '2026-11-27T17:02:00.000Z', from: agent('Shwa'), kind: 'note', body: 'DONE · the brief is on main https://github.com/mhoydich/pointcast/pull/1945' },
        ],
      });
    }
    return Response.json({
      ok: true, kvBound: true,
      logs: [{ address: '#loom', kind: 'topic', title: 'The Loom', updatedAt: '2026-11-27T17:02:00.000Z' }],
    });
  };
  const response = await serveLoomZine(new Request(ORIGIN), { kv, clock: () => NOW, handle });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.kvBound, true);
  assert.equal(body.preview, false);
  assert.equal(body.edition.masthead.dispatches, 1);
  assert.equal(body.edition.leadStory.id, 'm1');
  assert.equal(body.edition.masthead.coverage.scannedRooms, 1);
  assert.equal(body.edition.masthead.coverage.totalRooms, 1);
  assert.equal(body.edition.masthead.coverage.truncated, false);
  assert.deepEqual(calls.map((call) => call.split(' ')[0]), ['GET', 'GET']);
  assert.ok(calls.every((call) => call.includes('/api/loom')));
  assert.doesNotMatch(formatZineText(body.edition), /automatic|pull\/9/);
});

test('a short scan records missed rooms and partial coverage', async () => {
  const handle = async (request) => {
    const url = new URL(request.url);
    const to = url.searchParams.get('to');
    if (to) {
      return Response.json({ ok: true, kvBound: true, log: { address: to, kind: 'topic' }, messages: [
        { id: 'm', at: '2026-11-27T17:00:00.000Z', from: human('Ada'), kind: 'note', body: `Note in ${to}` },
      ] });
    }
    return Response.json({
      ok: true, kvBound: true,
      logs: ['#loom', '#loom-ux', '#officenoun-tasks'].map((address, index) => ({
        address, kind: 'topic', updatedAt: `2026-11-27T1${index}:00:00.000Z`,
      })),
    });
  };
  const collected = await collectLoomLogs({ kv: { get() {}, put() {} }, handle, now: NOW, maxRooms: 1 });
  assert.equal(collected.coverage.scannedRooms, 1);
  assert.equal(collected.coverage.totalRooms, 3);
  assert.equal(collected.coverage.truncated, true);
  assert.equal(collected.coverage.missedRooms.length, 2);
  const built = buildLoomZine(collected.logs, { now: NOW, window: collected.window, coverage: collected.coverage });
  assert.match(formatZineText(built), /partial · missed/);
});

async function post(kv, body, when, extra = {}) {
  const response = await handleLoom(new Request('https://pointcast.xyz/api/loom', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), { kv, clock: () => when, firstHelloEnabled: false, limit: async () => true, ...extra });
  assert.equal(response.status, 201);
  return response.json();
}

test('a handleLoom log becomes the edition, and a later GET does not write', async () => {
  const kv = memoryKv();
  const root = await post(kv, { to: '#loom-ux', from: human('Nia'), body: 'The column is 390px on a phone.' }, new Date('2026-11-27T12:00:00.000Z'));
  await post(kv, { to: root.address, from: human('Cay'), body: 'Agreed.' }, new Date('2026-11-27T12:10:00.000Z'));
  await post(kv, { to: root.address, from: human('Dee'), body: 'Agreed again.' }, new Date('2026-11-27T12:20:00.000Z'));
  await post(kv, { to: '#loom-ux', from: agent('Sol'), body: 'NEEDS Mike · a yes on the column width' }, new Date('2026-11-27T17:00:00.000Z'));
  await post(kv, { to: '#officenoun-tasks', from: human('Ada'), body: 'MINE · V2-3 set the type' }, new Date('2026-11-27T13:00:00.000Z'));
  await post(kv, {
    to: '#loom', from: agent('Shwa'),
    body: 'DONE · the brief is on main https://github.com/mhoydich/pointcast/pull/1945\n#loom-ux',
  }, new Date('2026-11-27T16:00:00.000Z'));
  const before = JSON.stringify([...kv.map.entries()]);
  let puts = 0;
  const guarded = {
    get: (key) => kv.get(key),
    put: async () => { puts += 1; throw new Error('zine tried to write'); },
  };
  const response = await serveLoomZine(new Request(ORIGIN), { kv: guarded, clock: () => NOW });
  const body = await response.json();
  assert.equal(body.edition.leadStory.headline, 'the brief is on main');
  assert.equal(body.edition.leadStory.room, '#loom');
  assert.equal(body.edition.masthead.doneCount, 1);
  assert.equal(body.edition.wireBriefs[0].room, '#loom-ux');
  assert.ok(body.edition.waitingDesk.some((row) => row.who === 'Sol' && row.waitingOn === 'Mike'));
  assert.ok(body.edition.waitingDesk.some((row) => row.waitingOn === 'Ada' && row.kind === 'claim'));
  assert.equal(body.edition.masthead.dispatches, 6);
  assert.doesNotMatch(body.text, /#loom-ux: DONE/);
  assert.equal(puts, 0);
  assert.equal(JSON.stringify([...kv.map.entries()]), before);
});

test('a first-hello robot note posted by the Loom stays off the sheet', async () => {
  const kv = memoryKv();
  await post(kv, { to: '#loom', from: human('ZineReader'), body: 'First day on the desk.' }, new Date('2026-11-27T16:00:00.000Z'), { firstHelloEnabled: true });
  const stored = await (await handleLoom(new Request('https://pointcast.xyz/api/loom?to=%23loom'), { kv })).json();
  assert.ok(stored.messages.some((entry) => entry.from?.kind === 'robot'));
  const body = await (await serveLoomZine(new Request(ORIGIN), { kv, clock: () => NOW })).json();
  assert.equal(body.edition.masthead.dispatches, 1);
  assert.equal(body.edition.leadStory.byline, 'ZineReader · human');
  assert.doesNotMatch(body.text, /This note is automatic|Welcome to the Loom/);
});

test('ETag and If-None-Match return 304, including a weak tag', async () => {
  const handle = async (request) => {
    const url = new URL(request.url);
    if (url.searchParams.has('to')) {
      return Response.json({ ok: true, kvBound: true, log: { address: '#loom', kind: 'topic' }, messages: [
        { id: 'm', at: '2026-11-27T17:00:00.000Z', from: human('Ada'), kind: 'note', body: 'Hold the column.' },
      ] });
    }
    return Response.json({ ok: true, kvBound: true, logs: [{ address: '#loom', kind: 'topic', updatedAt: '2026-11-27T17:00:00.000Z' }] });
  };
  const opts = { kv: { get() {}, put() { throw new Error('write'); } }, clock: () => NOW, handle };
  const first = await serveLoomZine(new Request(ORIGIN), opts);
  const etag = first.headers.get('etag');
  assert.match(etag, /^"[0-9a-f]{32}"$/);
  const cached = await serveLoomZine(new Request(ORIGIN, { headers: { 'If-None-Match': etag } }), opts);
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), '');
  const weak = await serveLoomZine(new Request(ORIGIN, { headers: { 'If-None-Match': `W/${etag}` } }), opts);
  assert.equal(weak.status, 304);
  const head = await serveLoomZine(new Request(ORIGIN, { method: 'HEAD' }), opts);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('etag'), etag);
});

test('an unbound store is an empty 200 preview and does not throw', async () => {
  let calls = 0;
  const handle = (request, opts) => { calls += 1; return handleLoom(request, opts); };
  const response = await serveLoomZine(new Request(`${ORIGIN}?format=json`), { kv: null, clock: () => NOW, handle });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.kvBound, false);
  assert.equal(body.preview, true);
  assert.equal(body.edition.masthead.dispatches, 0);
  assert.equal(body.edition.leadStory, null);
  assert.match(body.text, /PREVIEW/);
  assert.match(body.text, /not a report that the day was quiet/);
  assert.equal(calls, 1);
  const text = await serveLoomZine(new Request(`${ORIGIN}?format=text`), { kv: null, clock: () => NOW });
  assert.equal(text.status, 200);
  assert.match(text.headers.get('content-type'), /text\/plain/);
  assert.match(await text.text(), /^THE LOOM DISPATCH/);
});

test('bad days, bad formats, and other methods stay off the reader', async () => {
  const opts = { kv: null, clock: () => NOW };
  assert.equal((await serveLoomZine(new Request(`${ORIGIN}?day=2026-02-31`), opts)).status, 400);
  assert.equal((await serveLoomZine(new Request(`${ORIGIN}?day=tomorrow`), opts)).status, 400);
  assert.equal((await serveLoomZine(new Request(`${ORIGIN}?format=rss`), opts)).status, 400);
  const posted = await serveLoomZine(new Request(ORIGIN, { method: 'POST' }), opts);
  assert.equal(posted.status, 405);
  assert.equal((await serveLoomZine(new Request(ORIGIN, { method: 'OPTIONS' }), opts)).status, 204);
});

test('the new files do not read loom logs or write, and the page is self-contained', () => {
  const strip = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const lib = strip(readFileSync(new URL('../src/lib/loom/loom-zine.mjs', import.meta.url), 'utf8'));
  const api = strip(readFileSync(new URL('../functions/api/loom/zine.ts', import.meta.url), 'utf8'));
  const page = readFileSync(new URL('../src/pages/sketches/loom-zine/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(lib, /loom:log:/);
  assert.doesNotMatch(lib, /\.put\(/);
  assert.match(api, /serveLoomZine/);
  assert.doesNotMatch(api, /loom:log:|kv\.get|kv\.put|\.put\(/);
  assert.match(page, /Copy Plain-Text Edition/);
  assert.match(page, /Print \/ Save PDF/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /@media print/);
  assert.match(page, /width: min\(920px, calc\(100% - 20px\)\)/);
  assert.match(page, /Preview\./);
  assert.doesNotMatch(page, /fonts\.google|cdn\.|unpkg|fontshare|@import\s+url/);
  assert.doesNotMatch(page, /https?:\/\/(?!pointcast\.xyz)/);
});
