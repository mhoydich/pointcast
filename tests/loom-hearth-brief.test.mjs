import test from 'node:test';
import assert from 'node:assert/strict';
import { roomBrief as splitBrief, proofUrl } from '../src/lib/loom/hearth-summary.mjs';

// Most tests below check how receipts are found and phrased, not whether they carry
// proof. This view puts proven and reported work back in one newest-first list.
const roomBrief = (...args) => {
  const { reported = [], reportedMore = 0, doneMore = 0, ...brief } = splitBrief(...args);
  const done = [...brief.done, ...reported].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const more = doneMore + reportedMore;
  return { ...brief, done, ...(more ? { doneMore: more } : {}) };
};
import { loomBrief, briefHeadline } from '../src/lib/loom/hearth.mjs';
import { hearthActivity } from '../src/lib/loom/hearth-day.mjs';

const NOW = Date.parse('2026-11-25T20:00:00Z');
const hAgo = h => new Date(NOW - h * 3600000).toISOString();
let seq = 0;
const post = (name, body, hours, extra = {}) => ({ id: 'm' + ++seq, seq, at: hAgo(hours), body, from: { name, kind: 'agent' }, ...extra });
const log = { address: '#work', key: 'abc' };

test('a room brief reports last-day receipts and open claims, never older posts', () => {
  const messages = [
    post('Astra', 'DONE V2-4 read-only ledger https://github.com/mhoydich/pointcast/pull/1938', 2),
    post('Sol', 'MINE rooms in three lines', 3),
    post('Astra', 'MINE person cards', 5),
    post('Astra', 'DONE person cards', 4),
    post('Old', 'DONE something from last week', 200),
    post('Old', 'MINE an abandoned claim from last week', 190),
  ];
  const brief = roomBrief(messages, { log, now: NOW });
  assert.deepEqual(brief.done.map(i => i.text), ['V2-4 read-only ledger', 'person cards']);
  assert.equal(brief.done[0].href, 'https://github.com/mhoydich/pointcast/pull/1938');
  assert.equal(brief.done[0].by, 'Astra');
  assert.match(brief.done[1].href, /^\/loom\?to=%23work#m/);
  assert.deepEqual(brief.open.map(i => i.text), ['rooms in three lines']);
  // A quiet room gives nothing rather than digging up its last twenty posts.
  assert.deepEqual(roomBrief(messages.slice(4), { log, now: NOW }), { done: [], open: [] });
});

test('a room brief ignores hidden, withdrawn, mirrored and collator posts and caps each list', () => {
  const messages = [
    post('A', 'DONE hidden work', 1, { hidden: true }),
    post('A', 'DONE withdrawn work', 1, { withdrawn: true }),
    post('A', 'DONE mirrored work', 1, { via: '#elsewhere' }),
    { ...post('collator', 'DONE robot roll-up', 1), from: { name: 'collator', kind: 'robot' } },
    ...[1, 2, 3, 4, 5].map(n => post('A', `DONE real job ${n}`, n)),
  ];
  const brief = roomBrief(messages, { log, now: NOW, limit: 3 });
  assert.deepEqual(brief.done.map(i => i.text), ['real job 1', 'real job 2', 'real job 3']);
  assert.equal(brief.doneMore, 2, 'what the cap left out is counted');
  assert.equal(roomBrief(messages, { log, now: NOW }).doneMore, undefined);
});

test('front-page lines keep the sentence after a card or PR id, full names, and skip room-wide questions', () => {
  const messages = [
    post("Shwa (Mike's agent · QA)", 'DONE #1934 · The strip shows 12 recipients newest first at 390px. This does not change the home page. https://pointcast.xyz/x', 1),
    post('Sol', 'DONE V2-3 · Standalone runner draft: https://github.com/mhoydich/pointcast/pull/1942 · 347 tests pass', 2),
    post('Desk', 'Should we change the room colors?', 1, { kind: 'question' }),
    post('Desk', 'NEEDS mike pick the holders strip placement', 1),
  ];
  const brief = roomBrief(messages, { log, now: NOW });
  assert.equal(brief.done[0].text, '#1934 · The strip shows 12 recipients newest first at 390px');
  assert.equal(brief.done[0].by, "Shwa (Mike's agent · QA)");
  assert.equal(brief.done[1].text, 'V2-3 · Standalone runner draft');
  assert.deepEqual(brief.open.map(i => i.text), ['pick the holders strip placement']);
});

test('lit rooms carry a brief; quiet rooms do not', () => {
  const lit = hearthActivity([post('A', 'DONE a job', 1)], { now: NOW });
  assert.equal(lit.state, 'active');
  assert.equal(lit.brief, undefined, 'hearthActivity itself stays a pure activity count');
});

test('the board brief merges rooms newest first and counts repeated work once', () => {
  const item = (text, href, hours, by = 'Astra') => ({ text, href, at: hAgo(hours), by });
  const active = [
    { address: '#loom-v2', brief: { done: [item('ledger', 'https://x.test/1', 3), item('lend page', 'https://x.test/2', 1)], open: [item('runner', '/loom?to=%23loom-v2#m1', 2)] } },
    { address: '#efficiency', brief: { done: [item('ledger again', 'https://x.test/1', 2), item('Lend Page', '/loom?to=%23efficiency#m9', 4)], open: [] } },
    { address: '#old-server', human: true, humanName: 'Mike' },
    { address: '#bad', brief: { done: [{ text: 7 }, null], open: 'nope' } },
  ];
  const brief = loomBrief(active.map(r => ({ ...r, brief: r.brief && { done: [].concat(r.brief.done || []), open: Array.isArray(r.brief.open) ? r.brief.open : [] } })));
  assert.deepEqual(brief.done.map(i => [i.text, i.room]), [['lend page', '#loom-v2'], ['ledger again', '#efficiency']]);
  assert.deepEqual(brief.open.map(i => i.room), ['#loom-v2']);
  assert.equal(brief.doneCount, 2);
  assert.equal(loomBrief(active.slice(0, 1), { done: 1 }).done.length, 1);
  assert.equal(loomBrief(active.slice(0, 1), { done: 1 }).doneCount, 2, 'the count is the whole day, not the visible slice');
});

test('the headline counts work and names a person; with no reported work it is the old recap', () => {
  const snapshot = { active: [{ address: '#officenoun', human: true, humanName: 'Mike', lastAt: hAgo(1), lastHumanAt: hAgo(1) }], unavailable: [], since: NOW - 86400000, asOf: NOW };
  const bots = { ...snapshot, active: [{ address: '#loom-v2', human: false, lastName: 'Astra', lastAt: hAgo(1) }] };
  assert.equal(briefHeadline({ doneCount: 5, openCount: 2 }, bots), '5 things done, 2 still open.');
  assert.equal(briefHeadline({ doneCount: 1, openCount: 0 }, snapshot), 'Mike spoke in #officenoun. 1 thing done in the last day.');
  assert.equal(briefHeadline({ doneCount: 0, openCount: 1 }, bots), '1 thing still open.');
  assert.equal(briefHeadline({ doneCount: 0, openCount: 0 }, bots), 'Astra added a log to #loom-v2.');
});

test('quoted or fenced merge examples are not reports of finished work', () => {
  const quoted = [post('A', '> PR #42 was merged: https://github.com/mhoydich/pointcast/pull/42', 1)];
  const fenced = [post('A', 'Example\n```\nPR #42 was merged: https://github.com/mhoydich/pointcast/pull/42\n```', 1)];
  const inline = [post('A', 'Write `DONE V2-3` when you finish.', 1)];
  for (const messages of [quoted, fenced, inline]) assert.deepEqual(roomBrief(messages, { log, now: NOW }), { done: [], open: [] });
  const real = [post('A', '> an earlier note\nPR #42 was merged: https://github.com/mhoydich/pointcast/pull/42', 1)];
  assert.equal(roomBrief(real, { log, now: NOW }).done.length, 1);
});

test('a claim closes on its own completion, whatever the marker, and never on an unrelated one', () => {
  const claim = post('Sol', 'MINE #42 · Fix navigation', 3);
  const shipped = post('Sol', 'SHIPPED #42 · Fix navigation', 2, { parent: claim.id });
  let brief = roomBrief([claim, shipped], { log, now: NOW });
  assert.deepEqual([brief.done.length, brief.open.length], [1, 0], 'the same task is not both done and open');
  const a = post('Sol', 'MINE A', 5), b = post('Sol', 'MINE B', 4), doneB = post('Sol', 'DONE B', 3);
  brief = roomBrief([a, b, doneB], { log, now: NOW });
  assert.deepEqual(brief.open.map(i => i.text), ['A']);
  const v23 = post('Sol', 'MINE V2-3 · Building the runner', 5), v24 = post('Sol', 'DONE V2-4 · Ledger', 4);
  assert.equal(roomBrief([v23, v24], { log, now: NOW }).open.length, 1, 'another card id closes nothing');
  assert.equal(roomBrief([v23, post('Sol', 'MERGED V2-3 · runner', 1)], { log, now: NOW }).open.length, 0);
  assert.equal(roomBrief([v23, post('Astra', 'DONE V2-3 · runner', 1)], { log, now: NOW }).open.length, 1, 'someone else cannot close it');
  assert.equal(roomBrief([post('Sol', 'DONE V2-3', 6), v23], { log, now: NOW }).open.length, 1, 'an earlier completion closes nothing');
});

test('stamped or bolded NEEDS asks still reach the front page', () => {
  for (const body of ['NEEDS MIKE · Choose a room', 'Nov 25 · Sol, AI agent · NEEDS MIKE · Choose a room', '**NEEDS MIKE** · Choose a room']) {
    assert.deepEqual(roomBrief([post('Sol', body, 1)], { log, now: NOW }).open.map(i => i.text), ['Choose a room'], body);
  }
  assert.deepEqual(roomBrief([post('Sol', '> NEEDS MIKE · an example', 1)], { log, now: NOW }).open, []);
});

test('room to headline: more work than the cap is counted, and said to be a floor when cut', () => {
  const six = [1, 2, 3, 4, 5, 6].map(n => post('A', `DONE job ${n}`, n));
  const full = loomBrief([{ address: '#work', brief: roomBrief(six, { log, now: NOW }) }]);
  assert.equal(full.doneCount, 6);
  assert.equal(full.done.length, 5);
  const bots = { active: [{ address: '#work', human: false, lastName: 'A', lastAt: hAgo(1) }], unavailable: [], since: NOW - 86400000, asOf: NOW };
  assert.equal(briefHeadline(full, bots), '6 things done in the last day.');
  const cut = loomBrief([{ address: '#work', brief: roomBrief(six, { log, now: NOW, limit: 4 }) }]);
  assert.equal(cut.doneCount, 4, 'only distinct known work is counted');
  assert.equal(briefHeadline(cut, bots), 'At least 4 things done in the last day.');
  const same = Array.from({ length: 13 }, (_, i) => post('A', 'DONE navigation https://example.com/navigation', 1 + i / 10));
  const repeated = loomBrief([{ address: '#work', brief: roomBrief(same, { log, now: NOW }) }]);
  assert.equal(briefHeadline(repeated, bots), 'At least 1 thing done in the last day.', 'thirteen copies are one thing');
});

test('six hundred unresolved claims stay cheap to classify', () => {
  const claims = Array.from({ length: 600 }, (_, i) => post('Bot ' + (i % 7), `MINE job ${i}`, 1 + i / 100));
  const started = performance.now();
  const brief = roomBrief(claims, { log, now: NOW });
  assert.equal(brief.open.length + brief.openMore, 600);
  assert.ok(performance.now() - started < 250, 'one pass, not one scan per claim');
});

test('re-review: prose quotes, exact claim matches, handle underscores and inline-code subjects', () => {
  for (const body of ['The example says "PR #42 was merged: https://github.com/mhoydich/pointcast/pull/42".',
    'The example says “PR #42 was merged: https://github.com/mhoydich/pointcast/pull/42”.']) {
    assert.deepEqual(roomBrief([post('A', body, 1)], { log, now: NOW }).done, [], body);
  }
  const first = post('Sol', 'MINE Room summary', 5), second = post('Sol', 'MINE Room summary styling', 4);
  let brief = roomBrief([first, second, post('Sol', 'DONE Room summary styling', 3)], { log, now: NOW });
  assert.deepEqual(brief.open.map(i => i.text), ['Room summary'], 'the exact task closes, not its prefix');
  brief = roomBrief([post('Sol', 'MINE Rooms', 5), post('Sol', 'DONE Room', 3)], { log, now: NOW });
  assert.equal(brief.open.length, 1, 'Room is not Rooms');
  brief = roomBrief([post('Sol', 'MINE Room summary', 5), post('Sol', 'MINE Room summary styling', 4), post('Sol', 'DONE Room', 3)], { log, now: NOW });
  assert.equal(brief.open.length, 2, 'an ambiguous short wording closes nothing');
  brief = roomBrief([post('Sol', 'MINE Room summary for Hearth', 5), post('Sol', 'DONE Room summary', 3)], { log, now: NOW });
  assert.equal(brief.open.length, 0, 'one clear shorter wording still closes');

  const ask = post('Sol', 'NEEDS @review_desk · Choose a room', 3);
  const answer = { ...post('Alex', 'The blue one.', 2, { parent: ask.id }), from: { name: 'Alex', kind: 'human', address: '@review_desk' } };
  assert.equal(roomBrief([ask], { log, now: NOW }).open.length, 1);
  assert.equal(roomBrief([ask, answer], { log, now: NOW }).open.length, 0, 'the named owner answered');
  assert.deepEqual(roomBrief([post('Sol', '_NEEDS MIKE_ · Choose a room', 1)], { log, now: NOW }).open.map(i => i.text), ['Choose a room']);

  const files = [post('A', 'DONE · `src/a.mjs`', 1), post('A', 'DONE · `src/b.mjs`', 2), post('A', 'MINE `hearth_brief.mjs` tests', 3)];
  brief = roomBrief(files, { log, now: NOW });
  assert.deepEqual(brief.done.map(i => i.text), ['src/a.mjs', 'src/b.mjs']);
  assert.deepEqual(brief.open.map(i => i.text), ['hearth_brief.mjs tests']);
  assert.equal(loomBrief([{ address: '#work', brief }]).doneCount, 2);
  assert.deepEqual(roomBrief([post('A', '`DONE` is the word to start a receipt with.', 1)], { log, now: NOW }).done, []);
});

test('live lines read as sentences: shouting calmed, bylines dropped, a trailing card id leads', () => {
  const lines = [
    post('antigravity', 'DONE POINTCAST SENSORY & HAPTICS MCP API (pointcast.sensory.mcp/v1) VERIFIED (@antigravity, Thu Nov 26)', 1),
    post('antigravity', 'DONE HUX-6 · BRING YOUR BOT TO THE LOOM + DAO ROOM CHARTER v0 (@antigravity, CC0)', 2),
    post('Antigravity', 'DONE (draft for Purplematter; note: card is currently unsigned) · LEND-2\n\nTitle: Office Noun', 3),
  ];
  assert.deepEqual(roomBrief(lines, { log, now: NOW }).done.map(i => i.text), [
    'PointCast sensory & haptics MCP API (pointcast.sensory.mcp/v1) verified',
    'HUX-6 · Bring your bot to the Loom + DAO room charter v0 (@antigravity, CC0)',
    'LEND-2 · draft for Purplematter; note: card is currently unsigned',
  ]);
});

test('review fixtures: asides that carry the work stay, code and names keep their case, only card ids move', () => {
  const said = body => roomBrief([post('A', body, 1)], { log, now: NOW }).done.map(i => i.text);
  assert.deepEqual(said('DONE HUX-6 (repaired the unread-room count)'), ['HUX-6 (repaired the unread-room count)']);
  assert.deepEqual(said('DONE (repaired the unread-room count)\nChecks passed.'), ['repaired the unread-room count']);
  assert.deepEqual(said('DONE Disabled alerts (for staging only)'), ['Disabled alerts (for staging only)']);
  assert.deepEqual(said('DONE FIXED REQUEST SIGNATURE FOR `getUser` IN `src/Model.js`'), ['Fixed request signature for getUser in src/Model.js']);
  assert.deepEqual(said('DONE ROTATED API_TOKEN FOR POINTCAST AND THE LOOM'), ['Rotated API_TOKEN for PointCast and the Loom']);
  assert.deepEqual(said('DONE IPHONE15 BUILD SIGNED AND SHIPPED TODAY'), ['IPHONE15 build signed and shipped today']);
  assert.deepEqual(said('DONE Encoding verified · UTF8'), ['Encoding verified']);
  assert.deepEqual(said('DONE Audit passed\nISO9001'), ['Audit passed']);
  assert.deepEqual(said('DONE Audit passed. HTTP403'), ['Audit passed']);
  assert.deepEqual(said('DONE Ledger card · #1943'), ['#1943 · Ledger card']);
  assert.deepEqual(said('DONE #1950\nFixed unread-room count'), ['#1950 · Fixed unread-room count']);
  assert.deepEqual(said('DONE Add wallet (Monero only)'), ['Add wallet (Monero only)']);
  assert.deepEqual(said('DONE Fixed upload (by disabling validation)'), ['Fixed upload (by disabling validation)']);
  assert.deepEqual(said('DONE Shipped the card (by @astra)'), ['Shipped the card']);
  assert.deepEqual(said('DONE Shipped the card (Thu Nov 26)'), ['Shipped the card']);
  assert.deepEqual(said('DONE Shipped the card (Thursday)'), ['Shipped the card']);
  const open = body => roomBrief([post('A', body, 1)], { log, now: NOW }).open.map(i => i.text);
  assert.deepEqual(open('MINE LEND-2\nCheck borrower ceiling'), ['LEND-2 · Check borrower ceiling']);
  assert.deepEqual(open('MINE Add support shift (Friday only)'), ['Add support shift (Friday only)']);
});

test('section labels are not people being asked, but a named or greeted person is', () => {
  const report = post('Desk', 'SOL 6.2 REPORT · relayed. Job: can a plain FA2 enforce the rules?\nAnswer: none of them.\nFlags: label them honour rules.', 1);
  assert.deepEqual(roomBrief([report], { log, now: NOW }).open, []);
  for (const body of ['Shwa: can you take the check page?', 'MIKE: can you approve the release?', 'SHWA: can you approve the release?',
    'Hey MIKE, can you approve the release?', 'Job: can you approve the release?',
    'GROK-01 · THE SWITCHBOARD GAME\nGrok Bot, can you take first turn?',
    'Hey Job, can you approve the release?\nStatus: tests pass.\nNote: The patch only changes the footer.',
    'Job, can you approve the release?\nStatus: tests pass.\nNote: The patch only changes the footer.']) {
    assert.equal(roomBrief([post('Desk', body, 1)], { log, now: NOW }).open.length, 1, body);
  }
});

test('the headline is a floor when a room could not be read', () => {
  const snap = { active: [{ address: '#work', human: false, lastName: 'A', lastAt: hAgo(1) }], unavailable: [{ address: '#gone' }], since: NOW - 86400000, asOf: NOW };
  assert.equal(briefHeadline({ doneCount: 2, openCount: 0 }, snap), 'At least 2 things done in the last day.');
});

test('done needs proof: a DONE with no repo, site or chain link is listed as reported', () => {
  const posts = [
    post('antigravity', 'DONE · POINTCAST SENSORY & HAPTICS MCP API VERIFIED (@antigravity, Thu Nov 26)\n18/18 node:test passing in my workspace.', 1),
    post('Astra', 'DONE #1943 · Ledger counts signed closes https://github.com/mhoydich/pointcast/pull/1943', 2),
    post('Shwa', 'SHIPPED · Block Yard opens at a transaction https://pointcast.xyz/chain/yard?tx=a4e0', 3),
    post('Desk', 'DONE · Minted FIRST WEAVE 001 https://objkt.com/tokens/KT1abc/1', 4),
    post('A', 'DONE · Wrote the essay https://example.com/essay', 5),
    post('B', 'DONE · Example only\n> https://github.com/mhoydich/pointcast/pull/1', 6),
    post('C', 'DONE · Repo look-alike https://github.com/someone-else/pointcast/pull/9', 7),
    post('X desk', 'DONE · two-coin post is live on @officenoun (Fri Nov 27, 3:56am ET) https://x.com/officenoun/status/1994000000000000001', 8),
  ];
  const brief = splitBrief(posts, { log, now: NOW });
  assert.deepEqual(brief.done.map(i => i.by), ['Astra', 'Shwa', 'Desk', 'X desk']);
  assert.equal(brief.done[3].href, 'https://x.com/officenoun/status/1994000000000000001');
  for (const body of ['DONE · Prototype complete in local session. The planned destination is "https://pointcast.xyz/sensory". No upload yet.',
    'DONE · Prototype complete in local session. The planned destination is “https://pointcast.xyz/sensory”. No upload yet.']) {
    const quoted = splitBrief([post('A', body, 1)], { log, now: NOW });
    assert.deepEqual([quoted.done.length, quoted.reported.length], [0, 1], body);
  }
  const timed = roomBrief([post('A', 'MINE Publish the auction (Fri Nov 27, 3:56pm ET)', 1)], { log, now: NOW });
  assert.deepEqual(timed.open.map(i => i.text), ['Publish the auction (Fri Nov 27, 3:56pm ET)'], 'a claim keeps its schedule');
  for (const stamp of ['(Nov 27)', '(Friday)', '(Thu Nov 26)']) {
    assert.deepEqual(roomBrief([post('A', `MINE Publish the auction ${stamp}`, 1)], { log, now: NOW }).open.map(i => i.text),
      [`Publish the auction ${stamp}`], stamp);
  }
  assert.deepEqual(roomBrief([post('A', 'MINE Publish the auction (@astra)', 1)], { log, now: NOW }).open.map(i => i.text), ['Publish the auction']);
  assert.equal(brief.done[0].href, 'https://github.com/mhoydich/pointcast/pull/1943');
  assert.deepEqual(brief.reported.map(i => i.by), ['antigravity', 'A', 'B', 'C']);
  assert.match(brief.reported[0].href, /^\/loom\?to=%23work#m/, 'a reported line links to its own post');
  assert.equal(proofUrl(posts[4]), null);
});

test('the board counts proven work as done and says how much is only reported', () => {
  const item = (text, href, hours) => ({ text, href, at: hAgo(hours), by: 'A' });
  const active = [
    { address: '#loom-v2', brief: { done: [item('ledger', 'https://github.com/mhoydich/pointcast/pull/1943', 1)],
      open: [item('runner', '/loom?to=%23loom-v2#m1', 2)], reported: [item('sensory api', '/loom?to=%23loom-v2#m2', 3)] } },
    { address: '#efficiency', brief: { done: [], open: [], reported: [item('Ledger', '/loom?to=%23efficiency#m3', 2), item('hearth 3d', '/loom?to=%23efficiency#m4', 4)] } },
  ];
  const brief = loomBrief(active);
  assert.deepEqual(brief.reported.map(i => i.text), ['sensory api', 'hearth 3d'], 'work proven elsewhere is not also reported');
  const bots = { active: [{ address: '#loom-v2', human: false, lastName: 'A', lastAt: hAgo(1) }], unavailable: [], since: NOW - 86400000, asOf: NOW };
  assert.equal(briefHeadline(brief, bots), '1 thing done, 2 reported, 1 still open.');
  assert.equal(briefHeadline({ doneCount: 0, openCount: 0, reportedCount: 3 }, bots), '3 things reported.');
  assert.equal(briefHeadline({ doneCount: 2, openCount: 0, reportedCount: 0 }, bots), '2 things done in the last day.');
});

test('a desk signature, card id and branch name before the sentence do not become the line', () => {
  const open = body => roomBrief([post('Astra', body, 1)], { log, now: NOW }).open.map(i => i.text);
  assert.deepEqual(open("MINE · Astra Cover (@astra-cover), Astra 6.2 · HUX-3D · loom-ux-hux-3d-astra-cover. I'll integrate and review Antigravity's Fire, Water and Air sketch when its branch, archive or preview arrives. Switchboard has the source request."),
    ["HUX-3D · I'll integrate and review Antigravity's Fire, Water and Air sketch when its branch, archive or preview arrives"]);
  assert.deepEqual(open("MINE · MR-002 · @astra-intelligence, GPT-6.2 Astra · loom-ux-mr002-astra. I'll check the GPU price markets and current coding subscriptions, then put a sourced $500–$1,000 studio budget here for review."),
    ["MR-002 · I'll check the GPU price markets and current coding subscriptions, then put a sourced $500–$1,000 studio…"]);
  assert.deepEqual(open('MINE · Review the runner with @shwa and @astra before Friday'), ['Review the runner with @shwa and @astra before Friday'],
    'a real sentence that mentions people is not a signature');
  assert.deepEqual(open('MINE · @astra'), ['@astra'], 'a signature that is the whole post still shows');
});

test('re-review: asks, asides and model tasks are never skipped as signatures; only card ids are kept', () => {
  const brief = body => roomBrief([post('Astra', body, 1)], { log, now: NOW });
  const openText = body => brief(body).open.map(i => i.text);
  assert.deepEqual(openText('@mike, can you review? The preview is ready.'), ['@mike, can you review?']);
  for (const ask of ['MIKE: ask @Shwa?', 'Shwa: ask @Mike?', 'Job: ask @Mike?']) {
    assert.deepEqual(openText(`${ask} It is blocking launch.`), [ask], ask);
  }
  assert.deepEqual(openText('MINE · (Ask @mike first). Preview attached.'), ['Ask @mike first']);
  assert.deepEqual(brief("DONE · Fixed @shwa's blocker. Tests pass. https://pointcast.xyz/loom").done.map(i => i.text), ["Fixed @shwa's blocker"]);
  assert.deepEqual(openText('MINE · Upgrade Claude 4.5. Keep current defaults.'), ['Upgrade Claude 4.5']);
  assert.deepEqual(openText('MINE · Review Gemini 3. Then report.'), ['Review Gemini 3']);
  assert.deepEqual(openText('MINE · @astra · a1b2c3d · HUX-3D · Fix the runner.'), ['HUX-3D · Fix the runner']);
  assert.deepEqual(openText('MINE · @astra · m_3g4y4p0y58 · Fix the runner.'), ['Fix the runner']);
});
