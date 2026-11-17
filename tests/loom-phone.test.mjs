import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOARD, blockedPulls, endpoints, inbox, postReply, threadUrl } from '../public/loom/phone/phone.mjs';

const spec = 'pointcast.loom/v1';
const key = '0c4fe73d9b7a2a11f5f75e2b';
const target = (id) => `loom:${key}#${id}`;
const pr = (number) => `https://github.com/mhoydich/pointcast/pull/${number}`;
const item = (id) => ({ id, link: target(id), label: '#work', snippet: 'A public question', from: { name: 'Ada' } });
const forMike = (needsYes, replies) => ({ ok: true, spec, owner: '@mike', piles: { needsYes }, activity: { replies } });
const board = (messages) => ({ ok: true, spec, kvBound: true, log: { address: BOARD, key }, messages });
const message = (id, body, seq = 1, extra = {}) => ({ id, body, at: '2026-11-17T10:00:00Z', seq, from: { name: 'Tess', kind: 'agent' }, ...extra });

test('the public inbox follows canonical original targets with independent section availability', () => {
  const gate = item('m_gate001');
  const reply = item('m_reply01');
  const wrongParent = { ...gate, id: 'm_other01' };
  const wrongScheme = { snippet: 'malformed', link: 'https://example.com/' };
  assert.deepEqual(inbox(forMike([gate, wrongParent, wrongScheme, gate], [reply])), {
    gates: [{ target: gate.link, text: gate.snippet, by: 'Ada', room: '#work' }],
    replies: [{ target: reply.link, text: reply.snippet, by: 'Ada', room: '#work' }],
  });
  assert.deepEqual(inbox(forMike([], undefined)), { gates: [], replies: null });
  assert.throws(() => inbox({ ...forMike([], []), owner: '@mikey' }), /inbox_unavailable/);
});

test('the latest explicit board reports keep separate topics and omit echoes, hidden posts and PRs cited as context', () => {
  const root = 'm_review01';
  const hold = 'm_review02';
  const input = [
    message(root, `READY / shipped: ${pr(1)}\n\nBLOCKED / not superseded: first item. ${pr(2)}\n\nBLOCKED: second item. ${pr(3)}`),
    message(hold, `Review. BLOCKED for release: 4 conflicts with 5; hold 5. ${pr(4)} ${pr(5)}`, 2),
    message('m_clear01', `UNBLOCKED: checked again. ${pr(2)}`, 3),
    message('m_other01', `BLOCKED: ambiguous report with two URLs ${pr(6)} ${pr(7)}`, 4),
    message('m_echo001', `BLOCKED: copy ${pr(8)}`, 5, { via: { key: 'echo' } }),
    message('m_hidden1', `BLOCKED: hidden ${pr(9)}`, 6, { hidden: true }),
    message('m_old0001', `BLOCKED: conflicts with main. ${pr(12)}`, 7),
    message('m_new0001', `Replacement from fresh main. Closed superseded 12 and linked the replacement. ${pr(3)}`, 8),
  ];
  assert.deepEqual(blockedPulls(board(input)), [
    { target: target(hold), by: 'Tess', notes: [{ text: '4 conflicts with 5; hold 5.', prs: [pr(5)] }] },
    { target: target(root), by: 'Tess', notes: [{ text: 'second item.', prs: [pr(3)] }] },
  ]);
  assert.throws(() => blockedPulls({ ...board([]), kvBound: false }), /board_unavailable/);
});

test('a structured blocked task uses the exact receipt as its reply target', () => {
  const id = 'm_receipt1';
  const parent = 'm_task001';
  const receipt = message(id, `PARTIAL / BLOCKED A · editor action needed ${pr(10)}`, 2, { parent });
  const task = message(parent, `OFF-10 · A scoped task ${pr(11)}`, 1, {
    taskStatus: { blocked: true, parts: [{ part: 'A', blocked: true, source: { id, at: receipt.at } }] },
  });
  const [entry] = blockedPulls(board([task, receipt]));
  assert.equal(entry.target, target(id));
  assert.deepEqual(entry.notes.flatMap((note) => note.prs), [pr(10)]);
});

test('preview reads the public endpoint and exposes no posting controls', () => {
  assert.deepEqual(endpoints(new URL('https://rawcdn.githack.com/preview/index.html')), {
    api: 'https://pointcast.xyz/api/loom', canPost: false,
  });
  assert.deepEqual(endpoints(new URL('https://pointcast.xyz/loom/phone/')), { api: '/api/loom', canPost: true });
});

test('an answer posts to the canonical parent without identity claims, and checks the receipt', async () => {
  const destination = target('m_gate001');
  const address = target('m_answer1');
  let count = 0;
  const request = async (url, options) => {
    count++;
    assert.equal(url, '/api/loom');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), {
      to: destination, from: { name: 'Mike', kind: 'human' }, kind: 'answer', body: 'Yes',
    });
    const message = { id: 'm_answer1', parent: 'm_gate001' };
    return new Response(JSON.stringify({ ok: true, spec, message, address }), { status: 201 });
  };
  assert.deepEqual(await postReply('/api/loom', destination, ' Mike ', 'Yes', request), {
    status: 'posted', url: threadUrl(address),
  });
  assert.equal(count, 1);
  assert.deepEqual(await postReply('/api/loom', '#wrong-topic', 'Mike', 'Yes', request), { status: 'invalid' });
  assert.equal(count, 1);
});

test('an ambiguous reply gets no automatic retry and a server rejection remains retryable', async () => {
  const destination = target('m_gate001');
  let count = 0;
  const interrupted = async () => { count++; throw new Error('network stopped'); };
  assert.deepEqual(await postReply('/api/loom', destination, 'Mike', 'No', interrupted), { status: 'unknown' });
  assert.equal(count, 1);
  const wrong = () => new Response(JSON.stringify({ ok: true, spec, address: target('m_answer1'), message: { parent: 'm_wrong01', id: 'm_answer1' } }), { status: 201 });
  assert.deepEqual(await postReply('/api/loom', destination, 'Mike', 'No', wrong), { status: 'unknown' });
  assert.deepEqual(await postReply('/api/loom', destination, 'Mike', 'No', () => new Response('', { status: 429 })), { status: 'limited' });
});
