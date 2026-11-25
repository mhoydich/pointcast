import test from 'node:test';
import assert from 'node:assert/strict';
import { ledgerRows, ledgerThread, readHearthLedger } from '../src/lib/loom/hearth-ledger.mjs';

const NOW = Date.parse('2026-11-25T20:00:00Z');
const at = minutes => new Date(NOW - minutes * 60000).toISOString();
const mike = { kind: 'human', name: 'Mike Hoydich', address: '@mike' };
const jane = { kind: 'human', name: 'Jane', address: '@jane' };
const astra = { kind: 'agent', name: 'Astra', address: '@astra', operator: ' @MIKE ', model: 'gpt-6-astra' };
const fable = { kind: 'agent', name: 'Fable', address: '@fable', operator: 'Mike Hoydich', model: 'claude-opus-5-5' };
const sid = { kind: 'agent', name: 'Sid', address: '@sid' };
const quiet = { kind: 'agent', name: 'Quiet', address: '@quiet' };
const desk = { kind: 'agent', name: 'Task desk', address: '@desk' };
const who = from => ({ name: from.name, address: from.address || null, verified: false });
const post = (id, from, minutes = 0, extra = {}) => ({ id, at: at(minutes), from, body: id, ...extra });
const thread = (address, messages, extra = {}) => ({ address, key: address.slice(1), messages, ...extra });
const task = (id, from, minutes, state = 'done', extra = {}) => ({ task: id, status: state, reported: true,
  claimedBy: who(from), by: who(desk), source: { id: 'receipt-' + id, at: at(minutes), by: who(desk) }, ...extra });

function fixtures() {
  return [
    thread('#efficiency', [
      post('mike-identity', mike, 90),
      post('earlier', astra, 60, { body: 'Estimate 120k, actual ~95k tokens.' }),
      post('latest-valid', fable, 50, { body: 'Status desk · 80-120k → about 140k (guess) · long room reads' }),
      post('estimate-only', fable, 40, { body: 'Estimate 150k tokens. Actual: near the top of the range.' }),
      post('range', fable, 30, { body: '80k → 140k–160k tokens' }),
      post('rollup', fable, 20, { body: 'Total across 4 sprints · actual 700k tokens.' }),
      post('zero', fable, 10, { body: 'Actual 0 tokens.' }),
      post('jane-actual', jane, 5, { body: 'Actual 600k tokens.' }),
      post('sid-actual', sid, 4, { body: 'Actual 210k tokens.' }),
      post('quiet-zero', quiet, 3, { body: 'Actual 0 tokens.' }),
    ]),
    thread('#officenoun-tasks', [
      post('card-one', desk, 80, { taskStatus: task('OFF-1', astra, 60) }),
      post('card-reopened', desk, 75, { taskStatus: task('OFF-2', fable, 55) }),
      post('multipart', desk, 70, { taskStatus: task('OFF-3', astra, 50, 'done', {
        parts: [
          { part: 'A', status: 'done', claimedBy: who(astra), source: { at: at(55), by: who(astra) } },
          { part: 'B', status: 'done', claimedBy: who(fable), source: { at: at(50), by: who(fable) } },
        ],
      }) }),
      post('jane-card', desk, 65, { taskStatus: task('OFF-4', jane, 45) }),
      post('quiet-open', desk, 60, { taskStatus: task('OFF-5', quiet, 40, 'open') }),
    ]),
    thread('#ledger', [
      post('duplicate-one', desk, 50, { taskStatus: task('OFF-1', astra, 60) }),
      post('older-root-newer-reopen', desk, 200, { taskStatus: task('OFF-2', fable, 2, 'open') }),
    ]),
  ];
}

test('ledger groups people and their bots, keeps actual approximation and omits handles without evidence', () => {
  const rows = ledgerRows(fixtures(), { now: NOW });
  assert.deepEqual(rows.map(row => [row.handle, row.kind]), [['mike', 'human'], ['jane', 'human'], ['sid', 'agent']]);
  const [mikeRow, janeRow, sidRow] = rows;
  assert.equal(mikeRow.name, 'Mike Hoydich');
  assert.equal(mikeRow.lent.tokens, 140000, 'one latest usable report, never a sum of overlapping reports');
  assert.equal(mikeRow.lent.approximate, true);
  assert.equal(mikeRow.lent.tokenSource.id, 'latest-valid');
  assert.equal(mikeRow.lent.closedCards, 2, 'duplicates, reopened tasks and same-person multipart work count correctly');
  assert.deepEqual(mikeRow.lent.cardSources.map(source => source.task).sort(), ['OFF-1', 'OFF-3']);
  assert.equal(janeRow.lent.closedCards, 1);
  assert.equal(janeRow.lent.tokens, 600000);
  assert.equal(sidRow.lent.tokens, 210000);
  assert.equal(sidRow.lent.closedCards, undefined, 'unreported cards are omitted rather than zero');
  assert.ok(rows.every(row => !['astra', 'fable', 'quiet', 'desk', 'mike hoydich'].includes(row.handle)));
});

test('token-only rows sort by descending tokens and then normalized handle', () => {
  const rows = ledgerRows([thread('#efficiency', [
    post('zulu', { kind: 'agent', name: 'Zulu', address: '@ZULU' }, 2, { body: 'Actual 100k tokens.' }),
    post('alpha', { kind: 'agent', name: 'Alpha', address: '@alpha' }, 1, { body: 'Actual 100k tokens.' }),
    post('sid', sid, 0, { body: 'Actual 200k tokens.' }),
  ])], { now: NOW });
  assert.deepEqual(rows.map(row => row.handle), ['sid', 'alpha', 'zulu']);
});

test('adopting a handle does not split older name-only reports into another person row', () => {
  const threads = [thread('#efficiency', [
    post('old-name', { kind: 'human', name: 'Mike Hoydich' }, 10, { body: 'Actual 100k tokens.' }),
    post('new-handle', mike, 1, { body: 'Actual 200k tokens.' }),
  ])];
  const rows = ledgerRows(threads, { now: NOW });
  assert.deepEqual(rows.map(row => [row.handle, row.lent.tokens]), [['mike', 200000]]);
});

test('people sharing a display name retain separate explicit handles', () => {
  const rows = ledgerRows([thread('#efficiency', [
    post('alex-a', { kind: 'human', name: 'Alex', address: '@alex-a' }, 2, { body: 'Actual 100k tokens.' }),
    post('alex-b', { kind: 'human', name: 'Alex', address: '@alex-b' }, 1, { body: 'Actual 200k tokens.' }),
  ])], { now: NOW });
  assert.deepEqual(rows.map(row => [row.handle, row.lent.tokens]), [['alex-b', 200000], ['alex-a', 100000]]);
});

test('a bot that names its operator does not also keep a standalone row from older posts', () => {
  const threads = [thread('#efficiency', [
    post('before-operator', sid, 10, { body: 'Actual 100k tokens.' }),
    post('with-operator', { ...sid, operator: 'Mike' }, 1, { body: 'Actual 200k tokens.' }),
  ]), thread('#ledger', [post('closed-card', desk, 5, { taskStatus: task('OFF-1', sid, 2) })])];
  const rows = ledgerRows(threads, { now: NOW });
  assert.deepEqual(rows.map(row => [row.handle, row.lent.tokens, row.lent.closedCards]), [['mike', 200000, 1]]);
});

test('an explicit operator handle wins over another person’s matching display name', () => {
  const rows = ledgerRows([thread('#efficiency', [
    post('other-mike', { kind: 'human', name: 'Mike', address: '@other-mike' }, 3),
    post('michael', { kind: 'human', name: 'Michael', address: '@mike' }, 2),
    post('owned', { ...sid, operator: '@mike' }, 1, { body: 'Actual 100k tokens.' }),
  ])], { now: NOW });
  assert.deepEqual(rows.map(row => [row.handle, row.lent.tokens]), [['mike', 100000]]);
});

test('closed-card addresses cannot be claimed through another person’s display-name alias', () => {
  const michael = { kind: 'human', name: 'Michael', address: '@mike' };
  const rows = ledgerRows([thread('#ledger', [
    post('other-mike', { kind: 'human', name: 'Mike', address: '@other-mike' }, 3),
    post('michael', michael, 2),
    post('closed', desk, 1, { taskStatus: task('OFF-1', michael, 1) }),
  ])], { now: NOW });
  assert.deepEqual(rows.map(row => [row.handle, row.lent.closedCards]), [['mike', 1]]);
});

test('a name-only card claimant shared by different handles is not credited twice', () => {
  const rows = ledgerRows([thread('#ledger', [
    post('alex-a', { kind: 'human', name: 'Alex', address: '@alex-a' }, 3),
    post('alex-b', { kind: 'human', name: 'Alex', address: '@alex-b' }, 2),
    post('ambiguous', desk, 1, { taskStatus: task('OFF-1', { name: 'Alex' }, 1) }),
  ])], { now: NOW });
  assert.deepEqual(rows, []);
});

test('operator-only identities and task-only contributor metadata survive compact reads', () => {
  const owned = { kind: 'agent', name: 'Worker', address: '@worker', operator: '@mike' };
  const messages = [
    post('owned-claim', owned, 5, { body: 'MINE OFF-10 · ' + 'unneeded task prose '.repeat(100) }),
    post('sid-done', sid, 4, { body: 'DONE OFF-11' }),
    post('owned-root', desk, 30, { taskStatus: task('OFF-10', owned, 3) }),
    post('sid-root', desk, 25, { taskStatus: task('OFF-11', sid, 2) }),
  ];
  const original = thread('#ledger', messages, { trimmed: true });
  const compact = ledgerThread(messages, { room: original.address, key: original.key, trimmed: true, now: NOW });
  assert.equal(compact.state, 'read');
  assert.equal(compact.address, '#ledger');
  assert.equal(compact.key, 'ledger');
  assert.equal(compact.trimmed, true);
  assert.ok(compact.messages.some(message => message.from.address === '@worker' && message.from.operator === '@mike'));
  assert.ok(compact.messages.some(message => message.from.address === '@sid'));
  const rows = ledgerRows([compact], { now: NOW });
  assert.deepEqual(rows, ledgerRows([original], { now: NOW }));
  assert.deepEqual(rows.map(row => [row.handle, row.kind, row.lent.closedCards]), [['mike', 'human', 1], ['sid', 'agent', 1]]);
  assert.ok(rows.every(row => row.lent.tokens === undefined));
});

test('compact efficiency and ledger threads preserve grouped totals, sources and approximations', () => {
  const threads = fixtures();
  const compact = threads.map(value => ledgerThread(value.messages, { room: value.address, key: value.key, now: NOW }));
  assert.deepEqual(ledgerRows(compact, { now: NOW }), ledgerRows(threads, { now: NOW }));
  assert.equal(compact[0].messages.find(message => message.id === 'latest-valid').body,
    threads[0].messages.find(message => message.id === 'latest-valid').body);
});

test('equal-time reopened copies stay open regardless of thread order', () => {
  const threads = [
    thread('#ledger', [post('identity', sid, 10), post('done', desk, 9, { taskStatus: task('OFF-20', sid, 1) })]),
    thread('#officenoun-tasks', [post('reopened', desk, 20, { taskStatus: task('OFF-20', sid, 1, 'open') })]),
  ];
  assert.deepEqual(ledgerRows(threads, { now: NOW }), []);
  assert.deepEqual(ledgerRows([...threads].reverse(), { now: NOW }), []);
});

test('hidden, withdrawn, echoed, collator, future and invalid-date evidence never contributes', () => {
  const bad = [
    post('hidden', sid, 0, { hidden: true }),
    post('withdrawn', sid, 0, { withdrawn: true }),
    post('echo', sid, 0, { via: { id: 'original' } }),
    post('robot', { kind: 'robot', name: 'Robot', address: '@robot' }),
    post('collator-name', { kind: 'agent', name: 'Collator', address: '@named-collator' }),
    post('collator-address', { kind: 'agent', name: 'Anything', address: '@collator' }),
    post('future', sid, -1),
    post('invalid-date', sid, 0, { at: 'unknown' }),
  ].map(message => ({ ...message, body: 'Actual 900k tokens.' }));
  assert.deepEqual(ledgerRows([thread('#efficiency', bad)], { now: NOW }), []);
  const compact = ledgerThread(bad, { room: '#efficiency', key: 'efficiency', now: NOW });
  assert.deepEqual(compact.messages, []);
  assert.deepEqual(ledgerRows([thread('#other-room', [post('not-efficiency', sid, 0, { body: 'Actual 900k tokens.' })])], { now: NOW }), []);
});

test('ledger reads only its existing source rooms, including old rooms, in one read-only batch', async () => {
  const calls = [];
  const logs = [
    { kind: 'topic', address: '#unrelated', updatedAt: at(0) },
    { kind: 'handle', address: '@sid' },
    { kind: 'topic', address: '#ledger', updatedAt: '2020-01-01T00:00:00Z' },
    { kind: 'topic', address: '#efficiency', updatedAt: '2020-01-01T00:00:00Z' },
    { kind: 'topic', address: '#officenoun-tasks' },
  ];
  const source = fixtures();
  const request = async (path, options = {}) => {
    calls.push(path);
    assert.ok(!options.method || options.method === 'GET');
    if (path === '/api/loom?compact=1') return Response.json({ ok: true, kvBound: true, logs });
    const url = new URL(path, 'https://pointcast.xyz');
    assert.equal(url.pathname, '/api/loom-hearth');
    assert.equal(url.searchParams.get('ledger'), '1');
    assert.equal(url.searchParams.has('person'), false);
    const rooms = url.searchParams.getAll('room');
    assert.deepEqual([...rooms].sort(), ['#efficiency', '#ledger', '#officenoun-tasks']);
    return Response.json({ ok: true, rooms: rooms.map(address => ({ ...source.find(value => value.address === address), state: 'read' })) });
  };
  const result = await readHearthLedger({ request, now: NOW });
  assert.equal(calls.length, 2);
  assert.equal(result.asOf, NOW);
  assert.equal(result.readRooms, 3);
  assert.deepEqual(result.rows, ledgerRows(source, { now: NOW }));
  assert.equal(result.incomplete, false);
  assert.deepEqual(result.unavailable, []);
  assert.deepEqual(result.trimmed, []);
});

test('trimmed and unavailable source rooms disclose partial history without discarding usable rows', async () => {
  const request = async path => path === '/api/loom?compact=1'
    ? Response.json({ ok: true, kvBound: true, logs: ['#ledger', '#efficiency', '#officenoun-tasks'].map(address => ({ kind: 'topic', address })) })
    : Response.json({ ok: true, rooms: [
      { address: '#efficiency', key: 'efficiency', state: 'read', trimmed: true, messages: [post('actual', sid, 1, { body: 'Actual ~25k tokens.' })] },
      { address: '#ledger', state: 'unavailable' },
      { address: '#officenoun-tasks', key: 'tasks', state: 'read', messages: [] },
    ] });
  const result = await readHearthLedger({ request, now: NOW });
  assert.equal(result.incomplete, true);
  assert.equal(result.readRooms, 2);
  assert.deepEqual(result.trimmed, ['#efficiency']);
  assert.deepEqual(result.unavailable, ['#ledger']);
  assert.equal(result.rows[0].lent.tokens, 25000);
  assert.equal(result.rows[0].lent.approximate, true);
});

test('an empty source directory is empty, while failed or unbound reads do not masquerade as an empty ledger', async () => {
  let requests = 0;
  const empty = await readHearthLedger({ now: NOW, request: async path => {
    requests++;
    assert.equal(path, '/api/loom?compact=1');
    return Response.json({ ok: true, kvBound: true, logs: [{ kind: 'topic', address: '#elsewhere' }] });
  } });
  assert.equal(requests, 1);
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.readRooms, 0);
  await assert.rejects(readHearthLedger({ now: NOW, request: async () => Response.json({ ok: true, kvBound: false, logs: [] }) }));
  await assert.rejects(readHearthLedger({ now: NOW, request: async path => path === '/api/loom?compact=1'
    ? Response.json({ ok: true, kvBound: true, logs: [{ kind: 'topic', address: '#efficiency' }] })
    : new Response(null, { status: 503 }) }));
  await assert.rejects(readHearthLedger({ now: NOW, request: async path => path === '/api/loom?compact=1'
    ? Response.json({ ok: true, kvBound: true, logs: [{ kind: 'topic', address: '#efficiency' }] })
    : Response.json({ ok: true, rooms: [] }) }));
});
