import test from 'node:test';
import assert from 'node:assert/strict';
import { personCard, personThread, modelLab, readHearthPerson } from '../src/lib/loom/hearth-person.mjs';
import { HEARTH_DAY } from '../src/lib/loom/hearth-day.mjs';

const NOW = Date.parse('2026-11-23T19:00:00Z');
const human = { kind: 'human', name: 'Mike' };
const astra = { kind: 'agent', name: 'Astra', address: '@astra', operator: ' @MIKE ', model: 'gpt-6-astra' };
const fable = { kind: 'agent', name: 'Fable', address: '@fable', operator: 'mike', model: 'claude-opus-5-5' };
const other = { kind: 'agent', name: 'Other bot', address: '@other', operator: 'jason', model: 'gpt-6' };
const post = (id, from, days = 0, extra = {}) => ({ id, seq: 1, at: new Date(NOW - days * HEARTH_DAY).toISOString(), from, body: id, ...extra });
const thread = (address, messages) => ({ log: { address, key: address.slice(1) }, messages });

test('one person keeps full latest posts and only their operator-linked bots, most recent first', () => {
  const longBody = 'A full human post. '.repeat(100);
  const threads = [
    thread('#loom-v2', [post('human-first', human, 8), post('human-fourth', human, 0.8),
      post('astra', astra, 0.1), post('other', other, 0.01), post('echo', astra, 0, { via: { key: 'elsewhere' } }),
      post('hidden', fable, 0, { hidden: true }), post('future', fable, -1), post('bad-date', fable, 0, { at: 'unknown' })]),
    thread('#design', [post('human-third', human, 0.7), post('human-second', { ...human, name: '@mIkE' }, 0.6, { body: longBody }),
      post('fable', fable, 0.2), post('astra-old-room', astra, 7.1), post('withdrawn', human, 0, { withdrawn: true })]),
    thread('@astra', [post('astra-week', astra, 6)]),
  ];
  const card = personCard(threads, { name: ' @mike ', now: NOW });
  assert.deepEqual(card.posts.map(p => p.id), ['human-second', 'human-third', 'human-fourth']);
  assert.equal(card.posts[0].body, longBody);
  assert.deepEqual(card.lastSeen, { at: card.posts[0].at, room: '#design', key: 'design', id: 'human-second' });
  assert.deepEqual(card.bots.map(bot => [bot.name, bot.lab, bot.rooms]), [
    ['Astra', 'OpenAI', ['#loom-v2', '@astra']], ['Fable', 'Anthropic', ['#design']],
  ]);
  assert.equal(card.lent, null);
});

test('an older model-bearing post supplies the lab without changing a bot’s last seen', () => {
  const card = personCard([thread('#loom', [post('latest', { ...astra, model: undefined }, 0), post('model', astra, 9)])], { name: 'mike', now: NOW });
  assert.equal(card.bots[0].model, 'gpt-6-astra');
  assert.equal(card.bots[0].lab, 'OpenAI');
  assert.equal(card.bots[0].lastSeen.id, 'latest');
  assert.equal(card.lastSeen, null, 'a bot post does not say its person was seen');
  assert.deepEqual(card.posts, []);
  assert.equal(modelLab('unknown private model'), null);
  assert.equal(modelLab('google/gemini-2.5-pro'), 'Google');
});

test('lent tokens use the latest explicit actual report and closed cards use ledger task state', () => {
  const completed = { status: 'done', reported: true, task: 'OFF-99', claimedBy: { name: 'Astra', address: '@astra' }, by: { name: 'Reviewer' } };
  const threads = [thread('#efficiency', [
    post('earlier', astra, 4, { body: 'Estimate 120k, actual ~95k tokens.' }),
    post('latest-report', fable, 2, { body: 'Status desk · 80-120k → about 140k (guess) · long room reads' }),
    post('estimate-only', fable, 1, { body: 'Estimate 150k tokens. Actual: near the top of the range.' }),
    post('range', fable, 0.9, { body: '80k → 140k–160k tokens' }),
    post('zero', fable, 0.8, { body: 'Actual 0 tokens.' }),
    post('other-report', other, 0.1, { body: 'Actual 900k tokens.' }),
  ]), thread('#officenoun-tasks', [
    post('card', other, 3, { taskStatus: completed }),
    post('done-prose', astra, 1, { body: 'DONE · this is not a recorded closed task' }),
    post('someone-else-card', other, 1, { taskStatus: { ...completed, task: 'OFF-100', claimedBy: { name: 'Other bot', address: '@other' }, by: { name: 'Other bot', address: '@other' } } }),
    post('open-card', astra, 0.1, { taskStatus: { ...completed, task: 'OFF-101', status: 'open' } }),
  ]), thread('#ledger', [post('duplicate', other, 2, { taskStatus: completed })])];
  const card = personCard(threads, { name: 'mike', now: NOW });
  assert.equal(card.lent.tokens, 140000);
  assert.equal(card.lent.approximate, true);
  assert.equal(card.lent.tokenSource.id, 'latest-report');
  assert.equal(card.lent.closedCards, 1);
  assert.deepEqual(card.lent.cardSources.map(receipt => receipt.task), ['OFF-99']);
  const empty = personCard([thread('#efficiency', [post('zero', astra, 0, { body: 'Actual 0 tokens.' })])], { name: 'mike', now: NOW });
  assert.equal(empty.lent, null);
});

test('elapsed time, rollups, ranges and missing actual amounts never become token loans', () => {
  for (const body of [
    'Shwa · 5m → 75s (claim-to-verified, not compute)', '10 min → 162 sec', '5m → 8m', '120 → 140',
    'SPRINT · estimate 150–250k tokens. Actual: near the top of that range.',
    '4 sprints rollup · 500k → 700k tokens', 'Total across 4 sprints · actual 700k tokens.',
    'Week to Nov 13, four logged sprints: 5.3M → 8.0M actual.',
    '80k → 140k–160k tokens', '80k → 140k to 160k tokens', 'Actual: 0 tokens.',
  ]) {
    assert.equal(personCard([thread('#efficiency', [post('report', astra, 0, { body })])], { name: '@ mike ', now: NOW }).lent,
      null, body);
  }
  const card = personCard([thread('#efficiency', [post('report', astra, 0, { body: '100k → 1.2m tokens' })])], { name: 'mike', now: NOW });
  assert.equal(card.lent.tokens, 1200000);
  const million = personCard([thread('#efficiency', [post('report', astra, 0, { body: 'Small house · 4.9M → 7.6M (main measured, lanes modeled)' })])], { name: 'mike', now: NOW });
  assert.equal(million.lent.tokens, 7600000);
  const explicit = personCard([thread('#efficiency', [post('report', astra, 0, { body: 'Estimate 150–250K tokens → actual ≈140K (mostly reading)' })])], { name: 'mike', now: NOW });
  assert.equal(explicit.lent.tokens, 140000);
  assert.equal(explicit.lent.approximate, true);
});

test('a newer reopening overrides a closed task copy, even on an older root post', () => {
  const status = (state, days) => ({ task: 'OFF-99', status: state, reported: true,
    claimedBy: { name: 'Astra', address: '@astra' }, by: { name: 'Astra', address: '@astra' },
    source: { at: new Date(NOW - days * HEARTH_DAY).toISOString() } });
  const threads = [
    thread('#loom', [post('owned', astra, 0)]),
    thread('#ledger', [post('done', other, 3, { taskStatus: status('done', 3) })]),
    thread('#officenoun-tasks', [post('old-root-reopened', other, 10, { taskStatus: status('open', 1) })]),
  ];
  const compact = threads.map(t => personThread(t.messages, { name: 'mike', room: t.log.address, key: t.log.key, now: NOW }));
  assert.equal(personCard(compact, { name: 'mike', now: NOW }).lent, null);
  assert.equal(compact[2].messages[0].taskStatus.status, 'open');
});

test('compact room reads preserve full human posts and only the bot metadata the card uses', () => {
  const messages = [post('human-old', human, 4), post('human-3', human, 3), post('human-2', human, 2), post('human-1', human, 1),
    post('latest', { ...astra, model: undefined }, 0, { body: 'unneeded large bot text' }), post('model', astra, 1),
    post('bot-old', astra, 2), post('other', other, 0), post('echo', fable, 0, { via: {} })];
  const result = personThread(messages, { name: 'mike', room: '#loom', key: 'loom', trimmed: true, now: NOW });
  assert.equal(result.state, 'read');
  assert.equal(result.trimmed, true);
  assert.deepEqual(result.messages.filter(m => m.from.kind === 'human').map(m => m.id), ['human-1', 'human-2', 'human-3']);
  assert.deepEqual(result.messages.filter(m => m.from.kind === 'agent').map(m => m.id), ['latest', 'model']);
  assert.equal(result.messages.find(m => m.id === 'latest').body, undefined);
  assert.equal(result.messages.find(m => m.id === 'human-1').body, 'human-1');
  const compactCard = personCard([result], { name: 'mike', now: NOW });
  const fullCard = personCard([thread('#loom', messages)], { name: 'mike', now: NOW });
  assert.deepEqual(compactCard, fullCard);
});

test('person reader uses bounded Hearth batches and discloses failed or trimmed reads', async () => {
  const logs = Array.from({ length: 19 }, (_, i) => ({ kind: 'topic', address: '#room' + String(i).padStart(2, '0'), updatedAt: new Date(NOW).toISOString() }));
  const batches = [];
  let pending = 0, peak = 0;
  async function request(path) {
    const query = new URL(path, 'https://pointcast.xyz').searchParams;
    if (query.has('compact')) return Response.json({ ok: true, kvBound: true, logs });
    assert.equal(query.get('person'), '@MIKE');
    const rooms = query.getAll('room');
    batches.push(rooms);
    peak = Math.max(peak, ++pending);
    await new Promise(resolve => setTimeout(resolve, 1));
    pending--;
    if (rooms.includes('#room08')) return new Response(null, { status: 503 });
    return Response.json({ ok: true, rooms: rooms.map(address => ({ address, key: address.slice(1), state: 'read',
      trimmed: address === '#room18', messages: address === '#room18' ? [post('latest-person', human)] : [] })) });
  }
  const card = await readHearthPerson('@MIKE', { request, now: NOW });
  assert.deepEqual(batches.map(batch => batch.length), [8, 8, 3]);
  assert.equal(peak, 2);
  assert.equal(card.readRooms, 11);
  assert.equal(card.unavailable.length, 8);
  assert.deepEqual(card.trimmed, ['#room18']);
  assert.equal(card.incomplete, true);
  assert.equal(card.posts[0].id, 'latest-person');
});

test('person reads include the seven-day boundary and unknown dates without warning for quiet rooms', async () => {
  const since = NOW - 7 * HEARTH_DAY;
  const logs = [
    { kind: 'topic', address: '#old', updatedAt: new Date(since - 1).toISOString() },
    { kind: 'topic', address: '#boundary', updatedAt: new Date(since).toISOString() },
    { kind: 'handle', address: '@recent', updatedAt: new Date(NOW).toISOString() },
    { kind: 'topic', address: '#missing-date' },
    { kind: 'topic', address: '#invalid-date', updatedAt: 'unknown' },
  ];
  const reads = [];
  const request = async path => {
    if (path.includes('compact')) return Response.json({ ok: true, kvBound: true, logs });
    const rooms = new URL(path, 'https://pointcast.xyz').searchParams.getAll('room');
    reads.push(...rooms);
    return Response.json({ ok: true, rooms: rooms.map(address => ({ address, state: 'read', messages: [], trimmed: false })) });
  };
  const result = await readHearthPerson('mike', { request, now: NOW });
  assert.deepEqual([...reads].sort(), ['#boundary', '#invalid-date', '#missing-date', '@recent'].sort());
  assert.equal(result.readRooms, 4);
  assert.equal(result.incomplete, false);
  assert.deepEqual(result.unavailable, []);
  assert.deepEqual(result.trimmed, []);
});

test('an old-only directory performs no room reads and has no history gaps', async () => {
  let requests = 0;
  const request = async path => {
    requests++;
    assert.equal(path, '/api/loom?compact=1');
    return Response.json({ ok: true, kvBound: true, logs: [
      { kind: 'topic', address: '#old', updatedAt: new Date(NOW - 8 * HEARTH_DAY).toISOString() },
    ] });
  };
  const result = await readHearthPerson('mike', { request, now: NOW });
  assert.equal(requests, 1);
  assert.equal(result.readRooms, 0);
  assert.equal(result.incomplete, false);
  assert.deepEqual(result.posts, []);
  assert.deepEqual(result.bots, []);
  assert.deepEqual(result.unavailable, []);
  assert.deepEqual(result.trimmed, []);
});

test('room activity reordering preserves person batch membership and order', async () => {
  const logs = Array.from({ length: 19 }, (_, i) => ({
    kind: 'topic', address: '#room' + i, updatedAt: new Date(NOW - i * 1000).toISOString(),
  }));
  const batchesFor = async directory => {
    const batches = [];
    const request = async path => {
      if (path.includes('compact')) return Response.json({ ok: true, kvBound: true, logs: directory });
      const rooms = new URL(path, 'https://pointcast.xyz').searchParams.getAll('room');
      batches.push(rooms);
      return Response.json({ ok: true, rooms: rooms.map(address => ({ address, state: 'read', messages: [], trimmed: false })) });
    };
    const result = await readHearthPerson('mike', { request, now: NOW });
    assert.equal(result.incomplete, false);
    assert.equal(result.readRooms, logs.length);
    return batches;
  };
  const first = await batchesFor(logs);
  const reordered = await batchesFor([...logs].reverse().map(room => ({ ...room, updatedAt: new Date(NOW).toISOString() })));
  assert.deepEqual(first.map(batch => batch.length), [8, 8, 3]);
  assert.deepEqual(reordered, first);
});

test('an unbound directory or an absent name cannot become an empty person card', async () => {
  await assert.rejects(readHearthPerson('mike', { request: async () => Response.json({ ok: true, kvBound: false, logs: [] }) }));
  await assert.rejects(readHearthPerson('', { request: async () => { throw new Error('must not fetch'); } }), /Choose a person/);
  await assert.rejects(readHearthPerson('x'.repeat(121), { request: async () => { throw new Error('must not fetch'); } }), /Choose a person/);
  await assert.rejects(readHearthPerson('mike', { request: async path => path.includes('compact')
    ? Response.json({ ok: true, kvBound: true, logs: [{ address: '#loom', kind: 'topic' }] }) : new Response(null, { status: 503 }) }), /could not read/);
});

for (const activeRooms of [19, 430]) {
  test(`a 430-room directory reads all ${activeRooms} active rooms without a history warning`, async () => {
    const logs = Array.from({ length: 430 }, (_, index) => ({
      address: '#room' + String(index).padStart(3, '0'), kind: 'topic',
      // Put active rooms at the end so directory position cannot hide activity.
      updatedAt: new Date(NOW - (index < 430 - activeRooms ? 8 : 0) * HEARTH_DAY).toISOString(),
    }));
    const batches = [];
    const request = async path => {
      if (path.includes('compact')) return Response.json({ ok: true, kvBound: true, logs });
      const rooms = new URL(path, 'https://pointcast.xyz').searchParams.getAll('room');
      batches.push(rooms);
      return Response.json({ ok: true, rooms: rooms.map(address => ({ address, state: 'read', key: address.slice(1),
        messages: address === '#room429' ? [post('beyond-cap', human)] : [], trimmed: false })) });
    };
    const result = await readHearthPerson('mike', { request, now: NOW });
    assert.equal(result.readRooms, activeRooms);
    assert.equal(result.incomplete, false);
    assert.deepEqual(result.unavailable, []);
    assert.deepEqual(result.trimmed, []);
    assert.equal(result.posts[0].id, 'beyond-cap');
    assert.equal(batches.length, activeRooms === 430 ? 54 : 3);
    assert.ok(batches.every(batch => batch.length <= 8));
    assert.equal(new Set(batches.flat()).size, activeRooms);
  });
}

for (const gap of ['unavailable', 'trimmed']) {
  test(`one ${gap} person room reports exactly one history gap`, async () => {
    const request = async path => path.includes('compact')
      ? Response.json({ ok: true, kvBound: true, logs: ['#good', '#gap'].map(address => ({ kind: 'topic', address })) })
      : Response.json({ ok: true, rooms: [
        { address: '#good', state: 'read', messages: [post('readable', human)] },
        { address: '#gap', state: gap === 'unavailable' ? 'unavailable' : 'read', trimmed: gap === 'trimmed', messages: [] },
      ] });
    const result = await readHearthPerson('mike', { request, now: NOW });
    assert.equal(result.incomplete, true);
    assert.equal(result.readRooms, gap === 'unavailable' ? 1 : 2);
    assert.deepEqual(result.unavailable, gap === 'unavailable' ? ['#gap'] : []);
    assert.deepEqual(result.trimmed, gap === 'trimmed' ? ['#gap'] : []);
    assert.equal(result.unavailable.length + result.trimmed.length, 1);
    assert.equal(result.posts[0].id, 'readable');
  });
}
