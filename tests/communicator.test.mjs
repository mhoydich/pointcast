import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../public/communicator/ledger.mjs';
import * as E from '../public/communicator/engine.mjs';
import { DEMO_PROFILES, DEMO_VENUES, DEMO_LADDER, DEMO_RATINGS, DEMO_NOW } from '../public/communicator/demo.mjs';

const NOW = DEMO_NOW;
const REC = DEMO_VENUES[0];
const ASK = 'Get me a 4.0 doubles game Thursday evening at Rec Park';
const parse = (t) => E.parseRequest(t, { now: NOW, venues: DEMO_VENUES });
const gameEntry = (a, sa, b, sb, extra = {}) => ({
  id: 'le_test', kind: 'game', at: '2026-10-01T00:00:00Z', status: 'confirmed', confirmations: [], dispute: null,
  sides: [{ players: a, score: sa }, { players: b, score: sb }], ...extra,
});

test('1. rating.js parity: Steven Chu example', () => {
  const r = L.fromResults([{ level: 4.5, place: 2, teams: 8, recency: 0.33 }]);
  assert.deepEqual(r, { est: 4.6, weight: 0.33 });
  const b = L.blend({ ...r, declared: null });
  assert.equal(b.value, 4.6);
  assert.equal(b.plusMinus, L.round2(0.5 / Math.sqrt(1.33)));
  assert.equal(b.plusMinus, 0.43);
  assert.equal(L.levelName(b.value), '4.5');
  assert.equal(L.tagFor({ results: 1, declared: false }), 'Provisional');
  assert.equal(L.tagFor({ results: 3 }), 'Settled');
  assert.equal(L.tagFor({ results: 0, declared: true }), 'Self-declared');
  assert.equal(L.blend({}), null);
  // small draws count half; declared counts three results' worth
  assert.equal(L.fromResults([{ level: 4, place: 1, teams: 3, recency: 1 }]).weight, 0.5);
  assert.equal(L.blend({ est: 4.0, weight: 1, declared: 5.0 }).gap, 1);
});

test('1b. recency halves each year and drops to zero past the cap', () => {
  assert.equal(L.recency('2025-11-10T00:00:00Z', '2026-11-10T00:00:00Z'), 0.5);
  assert.equal(L.recency('2026-11-10T00:00:00Z', '2026-11-10T00:00:00Z'), 1);
  assert.equal(L.recency('2024-01-01T00:00:00Z', '2026-11-10T00:00:00Z'), 0);
});

test('2. both-sides confirmation', () => {
  const base = gameEntry(['a', 'b'], 11, ['c', 'd'], 7, { status: 'pending' });
  const one = L.confirmEntry(base, { by: 'a', side: 0, at: NOW });
  assert.equal(one.status, 'pending');
  assert.equal(L.isConfirmed(one, L.DEFAULT_LADDER), false);
  assert.equal(base.confirmations.length, 0, 'input not mutated');
  const dup = L.confirmEntry(one, { by: 'a', side: 0, at: NOW });
  assert.equal(dup.confirmations.length, 1);
  const both = L.confirmEntry(one, { by: 'c', side: 1, at: NOW });
  assert.equal(both.status, 'confirmed');
  assert.throws(() => L.confirmEntry(base, { by: 'zed', side: 0, at: NOW }));
  assert.throws(() => L.confirmEntry(base, { by: 'a', side: 1, at: NOW }));
  assert.equal(L.disputeEntry(one, { by: 'c', at: NOW, note: 'no' }).status, 'disputed');
});

test('2b. organizer and any confirmation rules', () => {
  const e = gameEntry(['a', 'b'], 11, ['c', 'd'], 7, { status: 'pending', source: { kind: 'organizer' } });
  assert.equal(L.isConfirmed(e, { ...L.DEFAULT_LADDER, confirm: 'organizer' }), true);
  assert.equal(L.isConfirmed({ ...e, source: { kind: 'self' } }, { ...L.DEFAULT_LADDER, confirm: 'organizer' }), false);
  assert.equal(L.isConfirmed({ ...e, confirmations: [{ by: 'a', side: 0 }] }, { ...L.DEFAULT_LADDER, confirm: 'any' }), true);
});

test('3. gameWalk: winners up, losers down, clamped to the scale', () => {
  const four = { a: 4, b: 4, c: 4, d: 4 };
  // The spec formula: margin = diff*toPoints/max(scores, toPoints). 11-7 -> 4, step 0.15*4/12 = 0.05.
  const w = L.gameWalk([gameEntry(['a', 'b'], 11, ['c', 'd'], 7)], four);
  assert.equal(w.a.value, 4.05); assert.equal(w.c.value, 3.95); assert.equal(w.a.games, 1);
  // A shutout reads as a full 11-point margin: 0.15*11/12 = 0.1375.
  const s = L.gameWalk([gameEntry(['a', 'b'], 11, ['c', 'd'], 0)], four);
  assert.ok(Math.abs(s.a.value - 4.1375) < 1e-9 && Math.abs(s.c.value - 3.8625) < 1e-9);
  const top = L.gameWalk([gameEntry(['a', 'b'], 11, ['c', 'd'], 0)], { a: 8, b: 8, c: 8, d: 8 });
  assert.equal(top.a.value, 8); assert.ok(top.c.value < 8);
  const floor = L.gameWalk([gameEntry(['a', 'b'], 11, ['c', 'd'], 0)], { a: 2, b: 2, c: 2, d: 2 });
  assert.equal(floor.c.value, 2);
  // pending games are ignored
  assert.deepEqual(L.gameWalk([gameEntry(['a'], 11, ['c'], 0, { status: 'pending' })], four), {});
});

test('3b. rate: finishes only, then games after countAfter, public fields only', () => {
  const r = L.rate('ada-r', { entries: DEMO_LADDER, declared: 4.0, now: NOW });
  assert.equal(r.tag, 'Settled');
  assert.equal(r.evidence.finishes, 3);
  const none = L.rate('nobody', { entries: [], declared: null, now: NOW });
  assert.equal(none.value, null);
  const declaredOnly = L.rate('hal-n', { entries: [], declared: 4.0, now: NOW });
  assert.deepEqual([declaredOnly.value, declaredOnly.plusMinus, declaredOnly.tag], [4, 0.5, 'Self-declared']);
  assert.deepEqual(Object.keys(L.publicRating({ ...r, secret: 1, evidence: {} })), L.PUBLIC_RATING_FIELDS);
  assert.ok(L.inBand(4.25, 4.0) && !L.inBand(4.3, 4.0));
});

test('3c. standings: wins then point differential', () => {
  const t = L.standings([gameEntry(['a', 'b'], 11, ['c', 'd'], 9), gameEntry(['a', 'c'], 11, ['b', 'd'], 2)], {});
  assert.equal(t[0].handle, 'a'); assert.equal(t[0].won, 2); assert.equal(t[0].pointDiff, 11);
  assert.equal(t.at(-1).handle, 'd');
});

test('4. parseRequest happy path', () => {
  const { ok, request, missing } = parse(ASK);
  assert.equal(ok, true);
  assert.deepEqual(missing, []);
  assert.equal(request.level, 4.0);
  assert.equal(request.format, 'doubles');
  assert.equal(request.players, 4);
  assert.equal(request.date, '2026-11-12');
  assert.equal(request.day, 4);
  assert.deepEqual(request.window, { start: '17:00', end: '21:00', label: 'evening' });
  assert.equal(request.venue, 'el-segundo');
  assert.equal(request.schema, 'coordination/request/1');
});

test('5. parseRequest asks for what is missing', () => {
  const { ok, request, missing } = parse('pickup game tomorrow');
  assert.equal(ok, false);
  assert.ok(missing.includes('level') && missing.includes('venue'));
  assert.ok(!missing.includes('day'));
  assert.equal(request.date, '2026-11-11');
  assert.equal(parse('4.5 singles at 6pm Saturday at the heights').request.players, 2);
  assert.equal(parse('3.5 at 6:30 tonight').request.window.start, '18:30');
  assert.equal(parse('3.5 after work Friday').request.window.start, '17:00');
});

test('6. proposeSlots: hours, reserve hint and drop-in blocks', () => {
  const thu = E.proposeSlots(parse(ASK).request, REC, { now: NOW });
  assert.equal(thu.length, 3);
  assert.equal(thu[0].start, '2026-11-12T17:00:00-08:00');
  assert.equal(thu[0].end, '2026-11-12T18:30:00-08:00');
  assert.equal(thu[0].court, 'reserve');
  assert.match(thu[0].note, /Book on Rec/);
  const mon35 = E.proposeSlots(parse('3.5 doubles Monday evening at Rec Park').request, REC, { now: NOW });
  const mon45 = E.proposeSlots(parse('4.5 doubles Monday evening at Rec Park').request, REC, { now: NOW });
  assert.ok(mon35.every((s) => !/T1[78]:/.test(s.start) || s.start.slice(11, 13) >= '19' || false), 'no 3.5 slot inside the Advanced block');
  assert.ok(mon35.every((s) => s.court === 'reserve'));
  assert.equal(mon45[0].start.slice(11, 16), '17:00');
  assert.equal(mon45[0].court, 'open play');
  // never outside venue hours
  const late = E.proposeSlots({ ...parse(ASK).request, window: { start: '21:00', end: '23:00', label: 'late' } }, REC, { now: NOW });
  assert.ok(late.every((s) => s.end.slice(11, 16) <= '22:00'));
});

const candidates = (seed = 1, level = 4.0) => E.findCandidates(
  { ...parse(ASK).request, level }, { profiles: DEMO_PROFILES, ratings: DEMO_RATINGS, now: NOW, exclude: ['mike'], seed, venues: DEMO_VENUES });

test('7. findCandidates: consent, band, venue, privacy, determinism', () => {
  const c = candidates(1);
  const handles = c.map((x) => x.handle);
  for (const bad of ['gus-o', 'kit-b', 'ivy-s', 'jo-w', 'lou-f', 'mike', 'dee-m']) assert.ok(!handles.includes(bad), bad);
  assert.deepEqual([...handles].sort(), ['ada-r', 'bo-t', 'cy-l', 'eli-p', 'fay-k', 'hal-n']);
  const json = JSON.stringify(c);
  for (const leak of ['example.invalid', 'phone', 'email', 'contact', '310-555']) assert.ok(!json.includes(leak), leak);
  assert.deepEqual(candidates(1).map((x) => x.handle), handles, 'same seed, same order');
  assert.deepEqual(candidates(99).map((x) => x.handle).sort(), [...handles].sort(), 'other seeds, same set');
  assert.ok(c.every((x, i) => i === 0 || c[i - 1].fit >= x.fit), 'sorted by fit');
  const hal = c.find((x) => x.handle === 'hal-n');
  assert.equal(hal.rating.tag, 'Self-declared');
  assert.ok(c[0].reasons.some((r) => /free Thu 17–21/.test(r)) && c[0].reasons.some((r) => /plays Rec Park/.test(r)));
  assert.deepEqual(candidates(1, 4.5).map((x) => x.handle), ['dee-m']);
});

test('7b. publicProfile and canContact keep contact private', () => {
  for (const p of DEMO_PROFILES) {
    const pub = JSON.stringify(E.publicProfile(p));
    for (const leak of ['contact', 'email', 'phone', 'example.invalid', '555']) assert.ok(!pub.includes(leak));
    assert.deepEqual(Object.keys(E.publicProfile(p)), ['handle', 'display', 'town', 'tier', 'venues', 'listed']);
  }
  assert.equal(E.canContact(DEMO_PROFILES.find((p) => p.handle === 'gus-o')), false);
  assert.equal(E.canContact(DEMO_PROFILES.find((p) => p.handle === 'ada-r')), true);
  assert.equal(E.canContact(DEMO_PROFILES.find((p) => p.handle === 'ada-r'), { from: 'strangers' }), false);
});

// Shared setup: a Thursday game with Mike hosting, 3 invited and 3 on the waitlist.
function setup(waitlist = 3) {
  const request = parse(ASK).request;
  const slot = E.proposeSlots(request, REC, { now: NOW })[0];
  let { game } = E.createGame(request, { venue: REC, slot, host: 'mike', hostDisplay: 'Mike H.', now: NOW, seed: 7 });
  const inv = E.invite(game, candidates(7), { now: NOW, profiles: DEMO_PROFILES, waitlist });
  return { request, slot, game: inv.game, outbox: inv.outbox };
}

test('8. full flow: invite, backfill, fill, confirm, remind, play, score, record', () => {
  const outboxes = [];
  const s = setup();
  let { game } = s;
  outboxes.push(s.outbox);
  assert.equal(game.status, 'inviting');
  assert.equal(game.roster.invited.length, 3);
  assert.equal(game.roster.waitlist.length, 3);
  assert.equal(s.outbox.length, 3);
  assert.ok(s.outbox.every((m) => m.kind === 'invite' && m.replies.join() === 'in,out,maybe,newtime' && m.effect === 'consent' && m.text.length <= 160));
  assert.match(s.outbox[0].text, /4\.0 doubles Thu 5:00–6:30 PM at Rec Park with Mike\. In\?/);

  const [a, b, c] = game.roster.invited;
  const next = game.roster.waitlist[0];
  let r = E.reply(game, { handle: a, answer: 'in', now: NOW }); game = r.game; outboxes.push(r.outbox);
  r = E.reply(game, { handle: b, answer: 'in', now: NOW }); game = r.game; outboxes.push(r.outbox);
  assert.equal(game.roster.in.length, 3);
  r = E.reply(game, { handle: c, answer: 'out', now: NOW }); game = r.game; outboxes.push(r.outbox);
  assert.equal(r.outbox.length, 1);
  assert.equal(r.outbox[0].to, next); assert.equal(r.outbox[0].kind, 'invite');
  assert.equal(game.status, 'inviting');
  r = E.reply(game, { handle: next, answer: 'in', now: NOW }); game = r.game; outboxes.push(r.outbox);
  assert.equal(game.status, 'filled');
  assert.equal(r.outbox.length, 4); assert.ok(r.outbox.every((m) => m.kind === 'filled'));

  r = E.confirm(game, { now: NOW }); game = r.game; outboxes.push(r.outbox);
  assert.equal(game.status, 'confirmed');
  assert.ok(r.outbox.every((m) => m.kind === 'confirmed' && m.replies.join() === 'directions,add to calendar,drop out'));
  assert.match(r.outbox[0].text, /401 Sheldon St, El Segundo/);
  assert.match(r.outbox[0].text, /rec\.us/);

  const rem = E.reminders(game, { now: NOW });
  assert.deepEqual(rem.map((x) => x.kind), ['reminder-24h', 'reminder-2h']);
  assert.ok(rem.every((x) => Date.parse(x.at) > Date.parse(NOW)));
  assert.equal(E.dueReminders(game, { now: NOW }).length, 0);
  const dueNow = E.dueReminders(game, { now: '2026-11-11T17:30:00-08:00' });
  assert.equal(dueNow.length, 4); outboxes.push(dueNow);
  game = E.markReminderSent(game, 'reminder-24h', { now: NOW }).game;
  assert.equal(E.dueReminders(game, { now: '2026-11-11T17:30:00-08:00' }).length, 0, 'already sent');
  assert.equal(E.reminders(game, { now: '2026-11-12T14:00:00-08:00' }).length, 1);

  assert.throws(() => E.markPlayed(game, { now: NOW }), /not ended/);
  game = E.markPlayed(game, { now: NOW, force: true }).game;
  assert.equal(game.status, 'played');

  const others = game.roster.in.filter((h) => h !== 'mike');
  const sides = [{ players: ['mike', others[0]], score: 11 }, { players: [others[1], others[2]], score: 9 }];
  const sub = E.submitScore(game, { by: 'mike', sides, now: NOW }); game = sub.game; outboxes.push(sub.outbox);
  assert.equal(game.status, 'scoring');
  assert.equal(sub.ledger[0].status, 'pending');
  assert.equal(sub.ledger[0].source.kind, 'communicator');
  assert.deepEqual(sub.outbox.map((m) => m.to).sort(), [others[1], others[2]].sort());
  assert.ok(sub.outbox.every((m) => m.kind === 'score-confirm' && m.replies.join() === 'confirm,dispute'));
  const same = E.confirmScore(game, sub.ledger[0], { by: 'mike', now: NOW });
  assert.equal(same.game.status, 'scoring', 'the scorer confirming again does not record it');
  assert.equal(same.outbox.length, 0);
  assert.throws(() => E.confirmScore(game, sub.ledger[0], { by: 'stranger', now: NOW }));

  // Ratings before and after. The default walk waits for 3 confirmed games and moves slowly, so this
  // check uses a ladder with a bigger k and countAfter 1 to make the rise visible after rounding.
  const lad = { ...L.DEFAULT_LADDER, game: { ...L.DEFAULT_LADDER.game, k: 1, countAfter: 1 } };
  const seed = { mike: 4, [others[0]]: 4, [others[1]]: 4, [others[2]]: 4 };
  const rt = (h, entries) => L.rate(h, { entries, declared: 4.0, now: NOW, ladder: lad, ratings: seed }).value;
  const before = { win: rt('mike', []), lose: rt(others[1], []) };

  const done = E.confirmScore(game, sub.ledger[0], { by: others[1], now: NOW }); game = done.game; outboxes.push(done.outbox);
  assert.equal(game.status, 'recorded');
  assert.equal(done.ledger[0].status, 'confirmed');
  assert.equal(done.outbox.length, 4);
  assert.ok(done.outbox.every((m) => m.kind === 'recorded' && /Recorded 11–9/.test(m.text)));
  assert.ok(rt('mike', [done.ledger[0]]) > before.win, 'winner rises');
  assert.ok(rt(others[1], [done.ledger[0]]) < before.lose, 'loser falls');
  const walk = L.gameWalk(done.ledger, seed);
  assert.ok(walk.mike.value > 4 && walk[others[1]].value < 4, 'default ladder moves the same direction');

  // Privacy: nothing in any message carries contact fields.
  const all = outboxes.flat();
  assert.ok(all.length > 20);
  for (const m of all) {
    const j = JSON.stringify(m);
    assert.ok(!j.includes('@'), j); assert.ok(!/\d{7,}/.test(j), j); assert.ok(!/contact/i.test(j), j);
    assert.deepEqual(Object.keys(m).sort(), ['at', 'effect', 'game', 'id', 'kind', 'replies', 'requires', 'text', 'to']);
  }
});

test('9. dropout after filled backfills; an empty waitlist reports short to the host', () => {
  let { game } = setup(1);
  const [a, b, c] = game.roster.invited;
  for (const h of [a, b, c]) game = E.reply(game, { handle: h, answer: 'in', now: NOW }).game;
  assert.equal(game.status, 'filled');
  let r = E.reply(game, { handle: a, answer: 'out', now: NOW });
  assert.equal(r.game.status, 'inviting');
  assert.equal(r.outbox.length, 1); assert.equal(r.outbox[0].kind, 'invite');
  game = r.game;
  assert.equal(game.roster.waitlist.length, 0);
  const filler = game.roster.invited[0];
  game = E.reply(game, { handle: filler, answer: 'in', now: NOW }).game;
  assert.equal(game.status, 'filled');
  r = E.reply(game, { handle: b, answer: 'out', now: NOW });
  assert.equal(r.game.status, 'short');
  assert.equal(r.outbox.length, 1);
  assert.equal(r.outbox[0].kind, 'short'); assert.equal(r.outbox[0].to, 'mike');
  assert.deepEqual(r.outbox[0].replies, ['widen band', 'new time', 'cancel']);
  assert.throws(() => E.reply(game, { handle: 'stranger', answer: 'in', now: NOW }));
  const m = E.reply(game, { handle: c, answer: 'maybe', now: NOW });
  assert.ok(m.game.roster.maybe.includes(c) && !m.game.roster.in.includes(c));
});

test('10. newtime proposals and acceptNewTime', () => {
  let { game, slot } = setup();
  const [a, b] = game.roster.invited;
  const later = E.proposeSlots(parse(ASK).request, REC, { now: NOW })[2];
  assert.notEqual(later.start, slot.start);
  let r = E.reply(game, { handle: a, answer: 'newtime', slot: later, now: NOW });
  game = r.game;
  assert.equal(game.proposals.length, 1);
  assert.equal(r.outbox[0].to, 'mike'); assert.equal(r.outbox[0].kind, 'newtime');
  assert.deepEqual(r.outbox[0].replies, ['accept', 'keep']);
  r = E.reply(game, { handle: b, answer: 'newtime', slot: structuredClone(later), now: NOW });
  game = r.game;
  assert.equal(game.proposals.length, 1);
  assert.deepEqual(game.proposals[0].votes, [a, b]);
  game = E.reply(game, { handle: a, answer: 'in', now: NOW }).game;
  const acc = E.acceptNewTime(game, 0, { now: NOW });
  assert.equal(acc.game.slot.start, later.start);
  assert.deepEqual(acc.game.roster.in, ['mike']);
  assert.ok(acc.game.roster.invited.includes(a) && acc.game.roster.invited.includes(b));
  assert.ok(acc.outbox.length >= 3 && acc.outbox.every((m) => m.kind === 're-invite' && m.to !== 'mike'));
  assert.equal(acc.game.status, 'inviting');
  assert.throws(() => E.acceptNewTime(game, 5, { now: NOW }));
});

test('11. submitScore validation', () => {
  let { game } = setup();
  for (const h of game.roster.invited) game = E.reply(game, { handle: h, answer: 'in', now: NOW }).game;
  game = E.reply(game, { handle: game.roster.waitlist[0] ?? game.roster.invited[0], answer: 'in', now: NOW }).game;
  if (game.status !== 'filled') { const h = game.roster.invited[0]; game = E.reply(game, { handle: h, answer: 'in', now: NOW }).game; }
  assert.equal(game.status, 'filled');
  game = E.markPlayed(E.confirm(game, { now: NOW }).game, { now: NOW, force: true }).game;
  const [h, p1, p2, p3] = game.roster.in;
  const mk = (x, y) => [{ players: [h, p1], score: x }, { players: [p2, p3], score: y }];
  const sub = (o) => E.submitScore(game, { by: h, sides: mk(11, 9), now: NOW, ...o });
  assert.doesNotThrow(() => sub({ sides: mk(11, 10) }));
  assert.throws(() => sub({ sides: mk(10, 9) }));
  assert.throws(() => sub({ sides: mk(11, 11) }));
  assert.throws(() => sub({ sides: mk(11.5, 9) }));
  assert.throws(() => sub({ sides: mk(-1, 11) }));
  assert.throws(() => sub({ by: 'stranger' }));
  assert.throws(() => sub({ sides: [{ players: [h, p1, p2], score: 11 }, { players: [p3], score: 9 }] }));
  assert.throws(() => sub({ sides: [{ players: [h, p1], score: 11 }, { players: [p2, 'ghost'], score: 9 }] }));
  const ok = sub({});
  const d = E.disputeScore(ok.game, ok.ledger[0], { by: p2, now: NOW, note: 'it was 11-8' });
  assert.equal(d.game.status, 'disputed'); assert.equal(d.ledger[0].status, 'disputed');
  assert.equal(d.outbox[0].to, h);
  assert.throws(() => E.disputeScore(ok.game, ok.ledger[0], { by: 'stranger', now: NOW }));
});

test('12. cancel tells everyone and only the host may cancel', () => {
  const { game } = setup();
  assert.throws(() => E.cancel(game, { by: game.roster.invited[0], now: NOW }));
  const r = E.cancel(game, { by: 'mike', now: NOW, reason: 'rain' });
  assert.equal(r.game.status, 'cancelled');
  assert.equal(r.outbox.length, 3);
  assert.match(r.outbox[0].text, /cancelled: rain/);
  assert.throws(() => E.reply(r.game, { handle: game.roster.invited[0], answer: 'in', now: NOW }));
});

test('13. invite refuses candidates without consent', () => {
  const request = parse(ASK).request;
  const slot = E.proposeSlots(request, REC, { now: NOW })[0];
  const { game } = E.createGame(request, { venue: REC, slot, host: 'mike', now: NOW });
  const gus = DEMO_PROFILES.find((p) => p.handle === 'gus-o');
  assert.throws(() => E.invite(game, [{ handle: 'gus-o', display: gus.display }], { now: NOW, profiles: DEMO_PROFILES }), /consent/);
  assert.throws(() => E.invite(game, [{ handle: 'unknown', display: 'U' }], { now: NOW, profiles: DEMO_PROFILES }));
  assert.equal(game.status, 'proposed', 'input untouched');
});

test('13b. parseReply synonyms and time hints', () => {
  const cases = { in: ['in', 'Yes', "I'm in", 'count me in', '\u{1F44D}'], out: ['out', 'no', "can't", 'cant', 'pass'], maybe: ['maybe', 'might', 'not sure'] };
  for (const [want, list] of Object.entries(cases)) for (const t of list) assert.equal(E.parseReply(t), want, t);
  for (const t of ['how about 7', 'later', 'earlier', 'different time', 'can we do 6:30pm']) assert.equal(E.parseReply(t), 'newtime', t);
  assert.equal(E.parseReply('purple'), null);
  assert.deepEqual(E.parseReplyDetail('how about 7'), { answer: 'newtime', slotHint: '19:00' });
  assert.equal(E.parseReplyDetail('later').slotHint, null);
});

test('14. ACTIONS covers every exported engine function', () => {
  const fns = Object.entries(E).filter(([, v]) => typeof v === 'function').map(([k]) => k);
  const names = new Set(E.ACTIONS.map((a) => a.name));
  for (const f of fns) assert.ok(names.has(f), `ACTIONS is missing ${f}`);
  for (const a of E.ACTIONS) {
    assert.ok(['read', 'write', 'consent'].includes(a.effect), a.name);
    assert.ok(['anyone', 'player', 'host', 'organizer'].includes(a.who), a.name);
    assert.ok(a.description.length > 10);
  }
  for (const read of ['ladder_read', 'venue_read', 'availability_read']) assert.ok(names.has(read));
  assert.equal(names.size, E.ACTIONS.length, 'no duplicate names');
});

test('15. demo data: fictional, privacy split intact, inputs never mutated', () => {
  assert.equal(DEMO_PROFILES.length, 13);
  assert.ok(DEMO_PROFILES.every((p) => p.contact.email.endsWith('@example.invalid')));
  assert.equal(DEMO_PROFILES.filter((p) => !p.consent.communicator).length, 2);
  assert.equal(DEMO_RATINGS['hal-n'].tag, 'Self-declared');
  assert.equal(DEMO_RATINGS['ivy-s'].tag, 'Settled'); assert.equal(DEMO_RATINGS['ivy-s'].level, '3.5');
  const before = JSON.stringify([DEMO_PROFILES, DEMO_LADDER]);
  candidates(3); setup();
  assert.equal(JSON.stringify([DEMO_PROFILES, DEMO_LADDER]), before);
  assert.ok(DEMO_LADDER.every((e) => e.status === 'confirmed' && e.schema === 'coordination/ledger-entry/1'));
});
