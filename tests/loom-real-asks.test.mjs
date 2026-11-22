import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPiles } from '../src/lib/loom/for-you.mjs';

const NOW = new Date('2026-11-22T12:00:00.000Z');
const desk = { name: 'Signing desk', kind: 'agent' };
let serial = 0;
const message = (body, extra = {}) => ({
  id: `m_real${++serial}`, seq: serial, body, kind: 'note', from: desk,
  at: new Date(NOW.getTime() - 3600000).toISOString(), parent: null, ...extra,
});
const asks = (messages, address = '#work', owner = 'mike') => buildPiles({
  owner, now: NOW, threads: [{ address, label: address, key: 'real-asks', messages }],
}).piles.needsYes.map(({ id }) => id);

test('real Signing desk FIXED post remains a receipt despite its later approval dependency', () => {
  // Exact excerpts from #mint-queue m_4i134w543q (seq 234), read 2026-11-22.
  // The intervening list of ten token links is omitted.
  const fixed = message("FIXED (seq 224), 6pm check. The Money Office plates now render. objkt never fetched the IPFS copies, so the ten plates are re-minted in the same collection with jsDelivr-hosted art: tokens 12 to 21, 50 each, 45 listed at 0 tez, 5 held. op ooziEzYW…ZsGAhWG5. Checked plate 1 on objkt: it shows.\nOld tokens 0 to 9 still exist, unseen, unlisted by nobody, 0 collected. Burning them needs Mike's yes; until then they sit in the office wallet. X desk: please point the @officenoun thread at tokens 12 to 21 (token 0 link -> /12).\nAlso new: Collectors' Gifts 14 (Snowfro) and 15 (Gary Vee), still no art for any of the 15.");
  assert.deepEqual(asks([fixed], '#mint-queue'), []);
});

test('real MINTED receipt and REVIEW note do not ask for Mike’s decision', () => {
  // Exact opening excerpts from #mint-queue m_0c2f3s672n (seq 215) and
  // #loom-v2 m_0y5a4u5i2t (seq 16), read 2026-11-22. Links below are omitted.
  const minted = message('MINTED, 4pm check (Sat Nov 21). THE MONEY OFFICE, ten plates, new collection KT19K7dBa2em8PspJRBAdvaDXmrsFPcxesji. 50 each, 45 listed at 0 tez, 5 held, CC0, royalty 0. Art pinned to IPFS, hashes matched the ticket. Last op oo8g92Xr…DdSC1H.');
  const review = message('REVIEW H-1, H-2, H-3, H-4 (and a first V2-5) are in draft PR 1909: https://github.com/mhoydich/pointcast/pull/1909\n\nNew pages beside the classic Loom, which is unchanged: /loom/hearth (front page), /loom/hearth/room?to=..., /loom/hearth/flame, /loom/hearth/lend. 8 tests pass. The build was not run in this cloud session (too small, per OPERATIONS.md), so CI\'s build is the check.');
  assert.deepEqual(asks([minted, review]), []);
});

test('status and receipt openers never become asks from a later needs-your-yes phrase', () => {
  for (const status of ['FIXED', 'MINTED', 'DONE', 'SHIPPED', 'MERGED', 'REVIEW', 'PASS', 'HOLD', 'RELEASE RECEIPT', 'LEAD NOTE', 'UPDATE', 'RECEIPT']) {
    const receipt = message(`${status}: the desk has recorded the result. The next release needs your yes.`);
    assert.deepEqual(asks([receipt]), [], status);
  }
});

test('stamps, Markdown and a short lead do not disguise status reports as asks', () => {
  const bodies = [
    '**FIXED**: the plates now render. Burning old copies needs your yes.',
    '# REVIEW\nThe check passed. The next release needs your yes.',
    'Nov 22 · Sid, AI agent · MINTED: all plates recorded. The reprint needs your yes.',
    '2026-11-22 PT\nRELEASE RECEIPT: the check passed. A reprint needs your yes.',
    'Evening desk report.\nFIXED: the plates render.\nPASS: all checks passed.\nSHIPPED: the preview is available. Burning old copies needs your yes.',
  ];
  for (const body of bodies) assert.deepEqual(asks([message(body)]), [], body);
});

test('direct questions, yes-or-no choices and approval requests to Mike remain asks', () => {
  const requests = [
    message('@mike, should we publish the poster?', { kind: 'question' }),
    message('Mike: yes or no on publishing the poster?'),
    message('Mike, please approve the poster.'),
    message('Ready to publish; needs your yes'),
    message('NEEDS MIKE · DONE review · #work'),
  ];
  assert.deepEqual(new Set(asks(requests)), new Set(requests.map(({ id }) => id)));
  assert.deepEqual(asks([message('@alex, should we publish the poster?', { kind: 'question' })]), []);
});

test('polls addressed to Mike or his inbox are asks; another owner’s poll is not', () => {
  const poll = (question) => message(question, { kind: 'poll', poll: { question, options: ['Blue', 'Orange'] } });
  const mike = poll('@mike, which poster should we publish?');
  const alex = poll('@alex, which poster should we publish?');
  const inbox = poll('Which poster should we publish?');
  assert.deepEqual(asks([mike, alex]), [mike.id]);
  assert.deepEqual(asks([inbox], '@mike'), [inbox.id]);
  assert.deepEqual(asks([mike], '#work', 'alex'), []);
});

test('new request forms keep relay age, top-level, author and closure limits', () => {
  const body = 'Mike, please approve the poster.';
  const old = message(body, { at: new Date(NOW.getTime() - 25 * 3600000).toISOString() });
  const reply = message(body, { parent: 'm_parent' });
  const self = message(body, { from: { name: 'Mike', kind: 'agent' } });
  const human = message(body, { from: { name: 'Sam', kind: 'human' } });
  const future = message(body, { at: new Date(NOW.getTime() + 3600000).toISOString() });
  const closed = message(body);
  const answer = message('Yes, go ahead', { from: { name: 'Mike', kind: 'human' }, parent: closed.id, at: NOW.toISOString() });
  assert.deepEqual(asks([old, reply, self, human, future, closed, answer]), []);
});

test('mentioning old requests, labels or a decision that is no longer needed is not an ask', () => {
  const notes = [
    message("The needs Mike's yes card now has two buttons."),
    message("The needs Mike's yes card and the needs Mike's yes label are visible."),
    message('The release no longer needs your yes.'),
    message('Mike: yes or no is the label.'),
    message('Previous question: @mike, should we publish?', { kind: 'question' }),
  ];
  assert.deepEqual(asks(notes), []);
  const other = message('@alex, which poster should we publish?', {
    kind: 'poll', poll: { question: '@alex, which poster should we publish?', options: ['Blue', 'Orange'] },
  });
  assert.deepEqual(asks([other], '@mike'), [], 'a different addressee overrides inbox location');
});

test('Markdown code fences and quoted owner requests do not create asks', () => {
  const examples = [
    'Copy example:\n```text\nNeeds your yes before release\n```',
    'Copy example:\n~~~text\nMike, please approve the poster.\n~~~',
    'Copy example:\n```\nNeeds your yes before release',
    'Copy example:\n~~~\nMike: yes or no?',
    '> NEEDS MIKE · approve the poster',
    '“Mike, please approve the poster.”',
  ];
  for (const body of examples) assert.deepEqual(asks([message(body)]), [], body);
  const genuine = message(examples[0] + '\nThe poster itself needs your yes.');
  assert.deepEqual(asks([genuine]), [genuine.id]);
});

test('natural requests with greetings or Mike named at the end remain asks', () => {
  const requests = [
    message('Hi Mike, can you approve the poster?'),
    message('Please approve the poster, Mike.'),
    message('Can you approve the poster, @mike?'),
  ];
  assert.deepEqual(new Set(asks(requests)), new Set(requests.map(({ id }) => id)));
});
