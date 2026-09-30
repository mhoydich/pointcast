import assert from 'node:assert/strict';
import test from 'node:test';

import { forgeBoard, HEX_COORDS, HARBOR_SLOTS, sealRoll, sealCommitment, validateTable, cleanSeed } from '../src/lib/catan.ts';
import { onRequestGet as tablesGet, onRequestPost as tablesPost } from '../functions/api/catan/tables.ts';
import { onRequestPost as seatPost } from '../functions/api/catan/seat.ts';
import { onRequestPost as cancelPost } from '../functions/api/catan/cancel.ts';
import { onRequestGet as boardGet } from '../functions/api/catan/board.ts';
import { onRequestGet as sealGet, onRequestPost as sealPost } from '../functions/api/catan/seal.ts';
import { createSeal } from '../functions/_lib/catan-store.ts';
import { handleAgentCatanSeal } from '../functions/api/agent/catan-seal.ts';

class FakeKV {
  constructor() { this.m = new Map(); }
  async get(k, type) { const v = this.m.get(k); if (v === undefined) return null; return type === 'json' ? JSON.parse(v) : v; }
  async put(k, v) { this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
}
const post = (url, body, ip = '1.1.1.1') => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) });
const neighbors = (i) => { const { q, r } = HEX_COORDS[i]; return [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([a, b]) => HEX_COORDS.findIndex((c) => c.q === q + a && c.r === r + b)).filter((j) => j >= 0); };

test('forge: deterministic, full bag, and balanced for many seeds', () => {
  assert.deepEqual(forgeBoard('wood-for-sheep'), forgeBoard('wood-for-sheep'));
  assert.equal(cleanSeed('  Wood For <Sheep>! '), 'woodforsheep');
  for (let s = 0; s < 400; s++) {
    const b = forgeBoard(`seed-${s}`);
    assert.equal(b.hexes.length, 19);
    assert.equal(b.hexes.filter((h) => h.resource === 'desert').length, 1);
    assert.equal(b.hexes.filter((h) => h.number !== null).length, 18);
    for (const h of b.hexes) for (const j of neighbors(h.i)) {
      const m = b.hexes[j].number;
      if (h.number === null || m === null) continue;
      assert.notEqual(h.number, m, `twins touch on seed-${s}`);
      assert.ok(!([6, 8].includes(h.number) && [6, 8].includes(m)), `red numbers touch on seed-${s}`);
    }
    assert.equal(b.harbors.length, 9);
    assert.equal(b.harbors.filter((h) => h.kind === 'any').length, 4);
  }
  assert.equal(new Set(HARBOR_SLOTS.map((s) => `${s.hex}:${s.dir}`)).size, 9);
});

test('seal: rolls are fair dice and recompute from the secret', async () => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 600; i++) { const [a, b] = await sealRoll('secret-x', i); assert.ok(a >= 1 && a <= 6 && b >= 1 && b <= 6); counts[a]++; }
  for (let f = 1; f <= 6; f++) assert.ok(counts[f] > 60 && counts[f] < 140, `face ${f} count ${counts[f]}`);
  assert.deepEqual(await sealRoll('secret-x', 5), await sealRoll('secret-x', 5));
  assert.match(await sealCommitment('abc'), /^[0-9a-f]{64}$/);
});

test('validateTable refuses links, past times, bad seats and unknown editions', () => {
  const now = Date.parse('2026-09-29T12:00:00Z');
  const ok = { title: 'Hex night', city: 'El Segundo, CA', venue: 'library', when: '2026-10-10T18:30:00-07:00', host: 'mike' };
  assert.equal(validateTable(ok, now).ok, true);
  assert.equal(validateTable({ ...ok, note: 'join at https://spam' }, now).ok, false);
  assert.equal(validateTable({ ...ok, when: '2026-01-01T00:00:00Z' }, now).ok, false);
  assert.equal(validateTable({ ...ok, seats: 9 }, now).ok, false);
  assert.equal(validateTable({ ...ok, link: 'http://insecure.example' }, now).ok, false);
  assert.equal(validateTable({ ...ok, edition: 'monopoly' }, now).ok, false);
});

test('tables: host, list, seat, fill, leave, cancel, budget', async () => {
  const env = { VISITS: new FakeKV() };
  const when = new Date(Date.now() + 3 * 86400_000).toISOString();
  const created = await tablesPost({ request: post('https://pointcast.xyz/api/catan/tables', { title: 'Tuesday hex night', city: 'El Segundo, CA', venue: 'library room', when, seats: 3, host: 'mike' }), env });
  assert.equal(created.status, 201);
  const { table, hostKey } = await created.json();
  assert.match(hostKey, /^hk_/);
  assert.equal(table.hostKeyHash, undefined, 'host key hash never leaves the server');
  assert.deepEqual(table.seated, ['mike']);

  const listed = await (await tablesGet({ request: new Request('https://pointcast.xyz/api/catan/tables?city=segundo'), env })).json();
  assert.equal(listed.count, 1);
  assert.equal((await (await tablesGet({ request: new Request('https://pointcast.xyz/api/catan/tables?city=portland'), env })).json()).count, 0);

  assert.equal((await seatPost({ request: post('https://x/api/catan/seat', { id: table.id, handle: 'ore-baron' }), env })).status, 200);
  assert.equal((await seatPost({ request: post('https://x/api/catan/seat', { id: table.id, handle: 'wheatley' }), env })).status, 200);
  assert.equal((await seatPost({ request: post('https://x/api/catan/seat', { id: table.id, handle: 'late' }), env })).status, 409, 'full');
  assert.equal((await seatPost({ request: post('https://x/api/catan/seat', { id: table.id, handle: 'mike', leave: true }), env })).status, 409, 'host cannot leave');
  assert.equal((await seatPost({ request: post('https://x/api/catan/seat', { id: table.id, handle: 'wheatley', leave: true }), env })).status, 200);

  assert.equal((await cancelPost({ request: post('https://x/api/catan/cancel', { id: table.id, hostKey: 'hk_wrong' }), env })).status, 403);
  assert.equal((await cancelPost({ request: post('https://x/api/catan/cancel', { id: table.id, hostKey }), env })).status, 200);
  assert.equal((await (await tablesGet({ request: new Request('https://x/api/catan/tables'), env })).json()).count, 0);

  const base = { title: 'Spam', city: 'X', venue: 'Y', when, host: 'z' };
  for (let i = 0; i < 3; i++) assert.equal((await tablesPost({ request: post('https://x/api/catan/tables', base, '9.9.9.9'), env })).status, 201);
  assert.equal((await tablesPost({ request: post('https://x/api/catan/tables', base, '9.9.9.9'), env })).status, 429);
});

test('board API mirrors the forge', async () => {
  const r = await boardGet({ request: new Request('https://x/api/catan/board?seed=harbor') });
  const j = await r.json();
  assert.deepEqual(j.hexes, forgeBoard('harbor').hexes);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), '*');
});

test('sealed table: secret hidden until reveal, only the rollKey rolls, reveal verifies', async () => {
  const env = { VISITS: new FakeKV() };
  const { seal, rollKey } = await createSeal(env.VISITS, { title: 'Bot league', players: 4 }, { payer: '0xabc', receiptHash: 'r1' });
  let pub = (await (await sealGet({ request: new Request(`https://x/api/catan/seal?id=${seal.id}`), env })).json()).seal;
  assert.equal(pub.secret, null);
  assert.equal((await sealPost({ request: post('https://x/api/catan/seal', { id: seal.id, rollKey: 'rk_nope', action: 'roll' }), env })).status, 403);
  for (let i = 0; i < 5; i++) {
    const r = await (await sealPost({ request: post('https://x/api/catan/seal', { id: seal.id, rollKey, action: 'roll' }), env })).json();
    assert.equal(r.index, i);
  }
  await sealPost({ request: post('https://x/api/catan/seal', { id: seal.id, rollKey, action: 'reveal' }), env });
  pub = (await (await sealGet({ request: new Request(`https://x/api/catan/seal?id=${seal.id}`), env })).json()).seal;
  assert.equal(pub.revealed, true);
  assert.equal(await sealCommitment(pub.secret), pub.commitment);
  for (let i = 0; i < pub.rolls.length; i++) assert.deepEqual(await sealRoll(pub.secret, i), pub.rolls[i]);
  assert.equal((await sealPost({ request: post('https://x/api/catan/seal', { id: seal.id, rollKey, action: 'roll' }), env })).status, 409);
  const recent = await (await sealGet({ request: new Request('https://x/api/catan/seal'), env })).json();
  assert.equal(recent.seals[0].id, seal.id);
});

test('catan-seal paid action quotes 402 without payment and refuses bad input first', async () => {
  const env = { VISITS: new FakeKV(), AUTH_DB: {} };
  const quote = await handleAgentCatanSeal(post('https://pointcast.xyz/api/agent/catan-seal', { title: 'Bot league', players: 4 }), env);
  assert.equal(quote.status, 402);
  assert.ok(quote.headers.get('Payment-Required'));
  const bad = await handleAgentCatanSeal(post('https://pointcast.xyz/api/agent/catan-seal', { players: 9 }), env);
  assert.equal(bad.status, 400);
});

import { ISLAND_VERTICES, scoreOpening, bestOpening, dailySeed, pacificDate, dailyNumber, shareLine } from '../src/lib/catan.ts';
import { onRequestGet as dailyGet, onRequestPost as dailyPost } from '../functions/api/catan/daily.ts';
import { onRequestGet as icsGet } from '../functions/api/catan/ics.ts';

test('daily geometry: 54 corners, 18 harbour corners, neighbours are symmetric', () => {
  assert.equal(ISLAND_VERTICES.length, 54);
  assert.equal(ISLAND_VERTICES.filter((v) => v.slot !== null).length, 18);
  for (const v of ISLAND_VERTICES) {
    assert.ok(v.hexes.length >= 1 && v.hexes.length <= 3);
    for (const n of v.near) assert.ok(ISLAND_VERTICES[n].near.includes(v.id));
  }
});

test('daily scoring: distance rule, par is the ceiling, share row', () => {
  const b = forgeBoard(dailySeed('2026-10-01'));
  const v = ISLAND_VERTICES[20];
  assert.equal(scoreOpening(b, 20, v.near[0]).ok, false);
  assert.equal(scoreOpening(b, 20, 20).ok, false);
  const best = bestOpening(b);
  assert.equal(scoreOpening(b, best.a, best.b).score, best.score);
  for (let a = 0; a < 54; a += 7) for (let c = a + 1; c < 54; c += 5) {
    const s = scoreOpening(b, a, c); if (s.ok) assert.ok(s.score <= best.score);
  }
  assert.equal(dailyNumber('2026-09-29'), 1);
  assert.match(shareLine(3, 31, 31), /#3\n31\/31 ⬢⬢⬢⬢⬢/);
});

test('daily API: play once per handle, leaderboard ranks, past days reveal', async () => {
  const env = { VISITS: new FakeKV() };
  const today = pacificDate();
  const b = forgeBoard(dailySeed(today));
  const best = bestOpening(b);
  const g = await (await dailyGet({ request: new Request('https://x/api/catan/daily'), env })).json();
  assert.equal(g.date, today);
  assert.equal(g.par, best.score);
  assert.equal(g.reveal, null, 'no spoilers today');
  assert.equal(g.vertices.length, 54);
  const r1 = await dailyPost({ request: post('https://x/api/catan/daily', { handle: 'bot-a', kind: 'agent', a: best.a, b: best.b }), env });
  assert.equal(r1.status, 201);
  const j1 = await r1.json();
  assert.equal(j1.score, best.score);
  assert.equal(j1.rank, 1);
  const again = await dailyPost({ request: post('https://x/api/catan/daily', { handle: 'BOT-A', a: 0, b: 30 }), env });
  assert.equal(again.status, 409);
  const bad = await dailyPost({ request: post('https://x/api/catan/daily', { handle: 'p', a: 20, b: ISLAND_VERTICES[20].near[0] }), env });
  assert.equal(bad.status, 400);
  const g2 = await (await dailyGet({ request: new Request('https://x/api/catan/daily'), env })).json();
  assert.equal(g2.entries, 1);
  assert.equal(g2.averages.agent, best.score);
  assert.equal(g2.leaderboard[0].handle, 'bot-a');
  const past = await (await dailyGet({ request: new Request('https://x/api/catan/daily?date=2026-09-29'), env })).json();
  if (today > '2026-09-29') assert.ok(past.reveal && Number.isInteger(past.reveal.a));
  assert.equal((await dailyGet({ request: new Request('https://x/api/catan/daily?date=2099-01-01'), env })).status, 400);
});

test('ics: one invite and a feed, escaped and CRLF', async () => {
  const env = { VISITS: new FakeKV() };
  const when = new Date(Date.now() + 2 * 86400_000).toISOString();
  const { table } = await (await tablesPost({ request: post('https://x/api/catan/tables', { title: 'Hex night; bring snacks', city: 'El Segundo, CA', venue: 'library', when, host: 'mike' }), env })).json();
  const one = await icsGet({ request: new Request(`https://x/api/catan/ics?id=${table.id}`), env });
  const text = await one.text();
  assert.match(one.headers.get('Content-Type'), /text\/calendar/);
  assert.match(text, /BEGIN:VEVENT\r\n/);
  assert.ok(text.includes('SUMMARY:Catan · Hex night\\; bring snacks'));
  assert.match(text, /LOCATION:library\\, El Segundo\\, CA/);
  const feed = await (await icsGet({ request: new Request('https://x/api/catan/ics?city=segundo'), env })).text();
  assert.equal((feed.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.equal((await icsGet({ request: new Request('https://x/api/catan/ics?id=nope'), env })).status, 404);
});

import { validateGame } from '../src/lib/catan.ts';
import { onRequestGet as gamesGet, onRequestPost as gamesPost } from '../functions/api/catan/games.ts';
import { lightTable } from '../functions/_lib/catan-store.ts';
import { handleAgentCatanLantern } from '../functions/api/agent/catan-lantern.ts';

const GAME = { target: 10, winner: 1, road: 1, army: null, turns: 14, minutes: 82, rolls: { 7: 5, 6: 4, 8: 3 }, players: [{ name: 'ore-baron', color: 'red', vp: 7 }, { name: 'wheatley', color: 'blue', vp: 10 }, { name: 'sheepforwheat', color: 'white', vp: 5 }] };

test('validateGame: winner must reach target, colors and indices checked', () => {
  assert.equal(validateGame(GAME).ok, true);
  assert.equal(validateGame({ ...GAME, winner: 0 }).ok, false, 'winner below target');
  assert.equal(validateGame({ ...GAME, road: 7 }).ok, false);
  assert.equal(validateGame({ ...GAME, players: [GAME.players[0]] }).ok, false);
  assert.equal(validateGame({ ...GAME, players: GAME.players.map((p) => ({ ...p, color: 'purple' })) }).ok, false);
  assert.equal(validateGame({ ...GAME, rolls: { 7: -1 } }).ok, false);
});

test('games API: log, read one, table history, recent tallies', async () => {
  const env = { VISITS: new FakeKV() };
  const r = await gamesPost({ request: post('https://x/api/catan/games', { ...GAME, table: 'abcd1234' }), env });
  assert.equal(r.status, 201);
  const { game } = await r.json();
  const one = await (await gamesGet({ request: new Request(`https://x/api/catan/games?id=${game.id}`), env })).json();
  assert.equal(one.game.players[one.game.winner].name, 'wheatley');
  const hist = await (await gamesGet({ request: new Request('https://x/api/catan/games?table=abcd1234'), env })).json();
  assert.equal(hist.count, 1);
  const recent = await (await gamesGet({ request: new Request('https://x/api/catan/games'), env })).json();
  assert.equal(recent.tallies.winners[0].name, 'wheatley');
  assert.equal(recent.tallies.medianMinutes, 82);
  assert.equal((await gamesPost({ request: post('https://x/api/catan/games', { ...GAME, winner: 2 }), env })).status, 400);
});

test('lanterns: light, stack, pin to top, never past the start; paid action refuses dark tables before quoting', async () => {
  const env = { VISITS: new FakeKV(), AUTH_DB: {} };
  const soon = new Date(Date.now() + 2 * 86400_000).toISOString();
  const later = new Date(Date.now() + 20 * 86400_000).toISOString();
  const mk = async (title, when) => (await (await tablesPost({ request: post('https://x/api/catan/tables', { title, city: 'El Segundo, CA', venue: 'library', when, host: 'h' }, `10.0.0.${title.length}`), env })).json()).table;
  const a = await mk('Soon night', soon);
  const b = await mk('Later night long', later);
  let list = (await (await tablesGet({ request: new Request('https://x/api/catan/tables'), env })).json()).tables;
  assert.equal(list[0].id, a.id, 'soonest first when dark');
  const lit = await lightTable(env.VISITS, b.id, '0xabcd…1234', 'All welcome', 'r1');
  assert.equal(lit.lantern.lit, 1);
  list = (await (await tablesGet({ request: new Request('https://x/api/catan/tables'), env })).json()).tables;
  assert.equal(list[0].id, b.id, 'lit table pinned first');
  assert.equal(list[0].lantern.by, '0xabcd…1234');
  assert.equal(list[0].lantern.receipts, undefined, 'receipts stay private');
  const twice = await lightTable(env.VISITS, b.id, '0xabcd…1234', '', 'r2');
  assert.equal(twice.lantern.lit, 2);
  assert.ok(Date.parse(twice.lantern.until) > Date.parse(lit.lantern.until), 'stacks');
  const capped = await lightTable(env.VISITS, a.id, '0x1', '', null);
  assert.ok(Date.parse(capped.lantern.until) <= Date.parse(soon) + 3 * 3600_000 + 1, 'never glows past the game');
  assert.equal(await lightTable(env.VISITS, 'nope', '0x1', '', null), null);

  const dark = await handleAgentCatanLantern(post('https://pointcast.xyz/api/agent/catan-lantern', { table: 'nope' }), env);
  assert.equal(dark.status, 404, 'no quote for a table that does not exist');
  const quote = await handleAgentCatanLantern(post('https://pointcast.xyz/api/agent/catan-lantern', { table: a.id, note: 'hi' }), env);
  assert.equal(quote.status, 402);
  assert.equal((await handleAgentCatanLantern(post('https://pointcast.xyz/api/agent/catan-lantern', { table: a.id, note: 'see https://x' }), env)).status, 400);
});
