/**
 * Shared ledger schema + contribute_paths + trading_desk_read (2026-11-03).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildBook, buildReputation, normalizeConfidence, normalizeEntry, pairWithdrawals } from '../src/lib/contributions-schema.ts';
import { CONTRIBUTION_PATHS, CONTRIBUTIONS_TOOL_NAMES, dispatchContributionsTool, extractRows } from '../src/lib/contributions-mcp.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const mcp = read('functions/api/mcp.ts');

const ROWS = [
  { id: 1, kind: 'pledge', handle: 'shwa', actor: 'agent', target: { type: 'item', id: 'toaster' }, side: 'bid', price: 12, confidence: 0.9, status: 'kept', createdAt: '2026-11-02T10:00:00Z' },
  { id: 2, kind: 'pledge', handle: 'shwa', actor: 'agent', target: { type: 'item', id: 'toaster' }, side: 'bid', price: 10, confidence: 0.8, status: 'broken', createdAt: '2026-11-02T11:00:00Z' },
  { id: 3, kind: 'signal', who: 'mike', via: 'person', itemId: 'toaster', side: 'ask', price: '25', confidence: 70, at: '2026-11-03T01:00:00Z' },
  { id: 4, kind: 'signal', handle: 'grok', target: { type: 'item', id: 'toaster' }, side: 'bid', price: 15, confidence: 0.5, createdAt: '2026-11-03T02:00:00Z' },
  { id: 5, kind: 'contribution', handle: 'grok', contributionType: 'review', target: { type: 'place', id: 'ezpz' }, body: 'Good tacos.', status: 'accepted', createdAt: '2026-11-03T03:00:00Z' },
  { id: 6, kind: 'signal', handle: 'bad handle with spaces', side: 'bid', price: 1 },
  { id: '', kind: 'signal', handle: 'x' },
];

test('normalizeEntry keeps the shared shape, maps aliases and drops bad rows', () => {
  const rows = ROWS.map((r) => normalizeEntry(r, 'elsegundo.xyz'));
  assert.equal(rows[5], null);
  assert.equal(rows[6], null);
  const mike = rows[2];
  assert.equal(mike.handle, 'mike');
  assert.equal(mike.actor, 'person');
  assert.equal(mike.target.id, 'toaster');
  assert.equal(mike.price, 25);
  assert.equal(mike.confidence, 0.7);
  assert.equal(mike.status, 'open');
  assert.equal(mike.site, 'elsegundo.xyz');
  assert.equal(normalizeConfidence(150), null);
  assert.equal(normalizeConfidence(-1), null);
  assert.equal(normalizeEntry({ id: 9, kind: 'signal', handle: 'a', proofUrl: 'http://x.test' }, 's').proofUrl, null, 'https only');
  assert.equal(normalizeEntry({ id: 9, kind: 'signal', handle: 'a', body: 'z'.repeat(900) }, 's').body.length, 500);
});

test('reputation counts kept and broken and scores calibration', () => {
  const entries = ROWS.map((r) => normalizeEntry(r, 'elsegundo.xyz')).filter(Boolean);
  const rep = buildReputation(entries);
  const shwa = rep.find((r) => r.handle === 'shwa');
  assert.equal(shwa.kept, 1);
  assert.equal(shwa.broken, 1);
  assert.equal(shwa.keptRate, 0.5);
  // ((0.9-1)^2 + (0.8-0)^2) / 2 = (0.01 + 0.64) / 2 = 0.325
  assert.equal(shwa.brier, 0.325);
  const grok = rep.find((r) => r.handle === 'grok');
  assert.equal(grok.accepted, 1);
  assert.equal(grok.brier, null);
});

test('the book takes open quotes only: best bid, best ask, spread', () => {
  const entries = ROWS.map((r) => normalizeEntry(r, 'elsegundo.xyz')).filter(Boolean);
  const [toaster] = buildBook(entries);
  assert.equal(toaster.target.id, 'toaster');
  assert.equal(toaster.bestBid, 15);
  assert.equal(toaster.bestAsk, 25);
  assert.equal(toaster.spread, 10);
  assert.equal(toaster.crossed, false);
  assert.equal(toaster.meanConfidence, 0.6);
});

test('two read-only tools, wired into the server, never writes', () => {
  assert.deepEqual(CONTRIBUTIONS_TOOL_NAMES, ['contribute_paths', 'trading_desk_read']);
  assert.ok(mcp.includes('...CONTRIBUTIONS_TOOL_DEFINITIONS,'));
  assert.ok(mcp.includes('dispatchContributionsTool(name, args, { deskBase })'));
  const src = read('src/lib/contributions-mcp.ts');
  assert.ok(!/method:\s*'POST'/.test(src), 'no POST from the mirror');
});

test('contribute_paths routes name real tools and filter by type and site', async () => {
  for (const p of CONTRIBUTION_PATHS) if (p.tool) assert.ok(mcp.includes(`'${p.tool}'`) || read('src/lib/civil-service-mcp.ts').includes(`'${p.tool}'`) || read('src/lib/station-mcp.ts').includes(`'${p.tool}'`), p.tool);
  const all = JSON.parse((await dispatchContributionsTool('contribute_paths', {})).content[1].text);
  assert.equal(all.paths.length, CONTRIBUTION_PATHS.length);
  assert.equal(all.schema, 'pointcast.ledger/v1');
  const desk = JSON.parse((await dispatchContributionsTool('contribute_paths', { site: 'elsegundo.xyz' })).content[1].text);
  assert.ok(desk.paths.every((p) => p.site === 'elsegundo.xyz') && desk.paths.length >= 2);
  const corr = JSON.parse((await dispatchContributionsTool('contribute_paths', { type: 'correction' })).content[1].text);
  assert.ok(corr.paths.every((p) => p.contributionType === 'correction'));
});

// Events in the elsegundo.xyz buying-lab shape (hello-token-reserve PR 193).
const LAB_EVENTS = [
  { seq: 7, type: 'contribution', at: '2026-11-03T04:00:00Z', id: 'c_00000000000000a7', handle: 'grok', by: 'agent', via: 'mcp', kind: 'place-data', place: 'ezpz', title: 'Hours for EZPZ', status: 'pending' },
  { seq: 6, type: 'contribution', at: '2026-11-03T03:50:00Z', id: 'c_00000000000000a6', handle: 'spam', by: 'person', via: 'page', kind: 'review', place: 'ezpz', status: 'hidden' },
  { seq: 5, type: 'withdraw', at: '2026-11-03T03:00:00Z', id: 'p_00000000000000a1', handle: 'shwa', by: 'agent', via: 'mcp', kind: 'pledge', item: 'office-chair', tier: 'standard' },
  { seq: 4, type: 'signal', at: '2026-11-03T02:00:00Z', id: 's_00000000000000a4', handle: 'mike', by: 'person', via: 'page', item: 'office-chair', price: 40, confidence: 1 },
  { seq: 3, type: 'pledge', at: '2026-11-03T01:00:00Z', id: 'p_00000000000000a1', handle: 'shwa', by: 'agent', via: 'mcp', item: 'office-chair', tier: 'standard', price: 55, confidence: 80, note: 'For the studio.' },
];

test('buying-lab events normalize: type, by, confidence 0-100, item+tier, place, kinds, hidden dropped', () => {
  const [contrib, hidden, withdraw, signal, pledge] = LAB_EVENTS.map((e) => normalizeEntry(e, 'elsegundo.xyz'));
  assert.equal(hidden, null, 'hidden contributions are never mirrored');
  assert.equal(pledge.kind, 'pledge');
  assert.equal(pledge.actor, 'agent');
  assert.equal(pledge.side, 'bid', 'the lab has no asks: a priced pledge is a bid');
  assert.equal(pledge.confidence, 0.8);
  assert.deepEqual(pledge.target, { type: 'edition', id: 'office-chair:standard', url: null });
  assert.equal(pledge.body, 'For the studio.');
  assert.equal(signal.confidence, 0.01, 'the lab confidence 1 means 1%, not 100%');
  assert.equal(withdraw.kind, 'pledge');
  assert.equal(withdraw.status, 'withdrawn');
  assert.equal(withdraw.side, null);
  assert.equal(withdraw.withdraws, true);
  assert.equal(pledge.withdraws, undefined);
  const paired = pairWithdrawals([withdraw, signal, pledge]);
  assert.equal(paired.length, 2);
  assert.equal(paired.find((e) => e.id === 'p_00000000000000a1').status, 'withdrawn');
  assert.equal(paired.find((e) => e.id === 's_00000000000000a4').status, 'open');
  assert.equal(pairWithdrawals([withdraw]).length, 1, 'an orphan withdraw (original aged off the ledger) stays');
  assert.equal(contrib.kind, 'contribution');
  assert.equal(contrib.contributionType, 'data', 'place-data maps to data');
  assert.equal(contrib.status, 'open', 'pending maps to open');
  assert.deepEqual(contrib.target, { type: 'place', id: 'ezpz', url: null });
  assert.equal(normalizeEntry({ ...LAB_EVENTS[0], kind: 'group-buy-host' }, 's').contributionType, 'group_buy');
  assert.equal(normalizeEntry({ ...LAB_EVENTS[0], kind: 'moderation', status: 'not-yet' }, 's').status, 'declined');
});

test('trading_desk_read reads the buying lab: own book, ledger events, a participant record', async () => {
  const asked = [];
  const fetcher = async (url) => {
    asked.push(url);
    if (url.includes('/ledger')) return new Response(JSON.stringify({ ok: true, note: 'n', total: 42, events: LAB_EVENTS, nextBefore: 3 }), { status: 200 });
    if (url.includes('/record')) return new Response(JSON.stringify({ ok: true, record: { handle: 'shwa', found: true, pledges: { open: 0, withdrawn: 1, settled: 2, kept: 2 }, calibration: { brier: null }, contributions: { total: 1, accepted: 1 }, reputation: { credit: 2, keptPledges: 2, score: 8 } } }), { status: 200 });
    return new Response(JSON.stringify({ ok: true, note: 'Play money only.', editions: [{ id: 'office-chair' }] }), { status: 200 });
  };
  const opts = { fetcher, deskBase: 'https://lab.test/api/v1/buying-lab/' };

  const book = await dispatchContributionsTool('trading_desk_read', {}, opts);
  assert.equal(asked.at(-1), 'https://lab.test/api/v1/buying-lab');
  assert.match(book.content[0].text, /1 edition listed/);
  assert.match(book.content[0].text, /Moneyless/);
  assert.equal(JSON.parse(book.content[1].text).book.editions[0].id, 'office-chair');

  const ledger = JSON.parse((await dispatchContributionsTool('trading_desk_read', { view: 'ledger', limit: 2 }, opts)).content[1].text);
  assert.equal(asked.at(-1), 'https://lab.test/api/v1/buying-lab/ledger?limit=100');
  assert.equal(ledger.entries.length, 2);
  assert.equal(ledger.entries[0].id, 'c_00000000000000a7', 'newest first');
  assert.equal(ledger.total, 42);
  assert.match((await dispatchContributionsTool('trading_desk_read', { view: 'ledger' }, opts)).content[0].text, /shwa withdrew a pledge/);

  const record = await dispatchContributionsTool('trading_desk_read', { view: 'reputation', handle: 'Shwa' }, opts);
  assert.equal(asked.at(-1), 'https://lab.test/api/v1/buying-lab/record?handle=shwa');
  assert.match(record.content[0].text, /score 8/);
  assert.match(record.content[0].text, /Brier not yet/);

  const board = JSON.parse((await dispatchContributionsTool('trading_desk_read', { view: 'reputation' }, opts)).content[1].text);
  const shwa = board.reputation.find((r) => r.handle === 'shwa');
  assert.equal(shwa.entries, 1, 'the withdraw folds into the pledge it cancels');
  assert.equal(shwa.withdrawn, 1);
  assert.equal(shwa.open, 0);

  const missing = await dispatchContributionsTool('trading_desk_read', { view: 'reputation', handle: 'nobody' }, { fetcher: async () => new Response(JSON.stringify({ ok: true, record: { handle: 'nobody', found: false } })) });
  assert.match(missing.content[0].text, /No buying-lab record for nobody/);
});

test('contribute_paths points desk routes at the buying lab MCP', async () => {
  const desk = JSON.parse((await dispatchContributionsTool('contribute_paths', { site: 'elsegundo.xyz' })).content[1].text);
  const remote = desk.paths.map((p) => p.remoteTool);
  assert.ok(remote.includes('https://elsegundo.xyz/mcp/desk · post_signal'));
  assert.ok(remote.includes('https://elsegundo.xyz/mcp/desk · post_pledge'));
  assert.ok(remote.includes('https://elsegundo.xyz/mcp/desk · contribute'));
});

test('trading_desk_read says plainly when the desk is down', async () => {
  const down = await dispatchContributionsTool('trading_desk_read', {}, { fetcher: async () => new Response('x', { status: 502 }) });
  assert.equal(down.isError, true);
  assert.match(down.content[0].text, /could not be read \(desk answered 502\)/);
  const notOk = await dispatchContributionsTool('trading_desk_read', {}, { fetcher: async () => new Response(JSON.stringify({ ok: false, note: 'lab paused' })) });
  assert.match(notOk.content[0].text, /lab paused/);
  const thrown = await dispatchContributionsTool('trading_desk_read', {}, { fetcher: async () => { throw new Error('offline'); } });
  assert.match(thrown.content[0].text, /offline/);
  assert.deepEqual(extractRows([1, 2]), [1, 2]);
  assert.deepEqual(extractRows({ ledger: [3] }), [3]);
  assert.deepEqual(extractRows({ events: [4] }), [4]);
  assert.deepEqual(extractRows({ nope: 1 }), []);
});
