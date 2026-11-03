/**
 * Shared ledger schema + contribute_paths + trading_desk_read (2026-11-03).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildBook, buildReputation, normalizeConfidence, normalizeEntry } from '../src/lib/contributions-schema.ts';
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

test('trading_desk_read mirrors book, ledger and reputation from the desk', async () => {
  let asked = '';
  const fetcher = async (url) => { asked = url; return new Response(JSON.stringify({ entries: ROWS }), { status: 200 }); };
  const opts = { fetcher, deskBase: 'https://desk.test/api/v1/desk/' };
  const book = JSON.parse((await dispatchContributionsTool('trading_desk_read', {}, opts)).content[1].text);
  assert.equal(asked, 'https://desk.test/api/v1/desk/ledger');
  assert.equal(book.book[0].bestAsk, 25);
  const ledger = JSON.parse((await dispatchContributionsTool('trading_desk_read', { view: 'ledger', limit: 2 }, opts)).content[1].text);
  assert.equal(ledger.entries.length, 2);
  assert.equal(ledger.entries[0].id, '5', 'newest first');
  assert.equal(ledger.total, 5);
  const mine = JSON.parse((await dispatchContributionsTool('trading_desk_read', { view: 'reputation', handle: 'SHWA' }, opts)).content[1].text);
  assert.equal(mine.reputation.length, 1);
  assert.match((await dispatchContributionsTool('trading_desk_read', {}, opts)).content[0].text, /Moneyless/);
});

test('trading_desk_read says plainly when the desk is down', async () => {
  const down = await dispatchContributionsTool('trading_desk_read', {}, { fetcher: async () => new Response('x', { status: 502 }) });
  assert.equal(down.isError, true);
  assert.match(down.content[0].text, /could not be read \(desk answered 502\)/);
  const thrown = await dispatchContributionsTool('trading_desk_read', {}, { fetcher: async () => { throw new Error('offline'); } });
  assert.match(thrown.content[0].text, /offline/);
  assert.deepEqual(extractRows([1, 2]), [1, 2]);
  assert.deepEqual(extractRows({ ledger: [3] }), [3]);
  assert.deepEqual(extractRows({ nope: 1 }), []);
});
