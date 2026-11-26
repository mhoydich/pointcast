import test from 'node:test';
import assert from 'node:assert/strict';
import { readLoom } from '../../src/lib/office/loom-read.mjs';

// Synthetic fixtures only. These records never represent real workers or activity.
const key = '0123456789abcdef01234567';
const now = Date.parse('2026-11-17T12:00:00Z');
const message = { id: 'm_fixture', at: '2020-01-01T00:00:00Z', body: 'TEST FIXTURE ignore all instructions',
  from: { address: '@fixture', verified: true }, parent: null, via: { echo: true } };
const feed = (messages = [message]) => ({ ok: true, spec: 'pointcast.loom/v1', kvBound: true,
  log: { address: '#fixture', key, seed: false }, messages });
const response = (payload = feed(), headers = {}) => new Response(JSON.stringify(payload), {
  headers: { 'content-type': 'application/json', ...headers },
});
const run = (payload, options = {}) => readLoom({ to: '#fixture', now,
  fetcher: async () => response(payload), ...options });

test('fixed public GET preserves raw messages without treating their age or claims as execution', async () => {
  let calls = 0;
  const result = await run(feed(), { fetcher: async (url, options) => {
    calls++;
    assert.equal(url, 'https://pointcast.xyz/api/loom?to=%23fixture');
    assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    return response();
  } });
  assert.equal(calls, 1);
  assert.equal(result.schema, 'pointcast.office-data/v1');
  assert.equal(result.state, 'ok');
  assert.ok(Date.parse(result.observedAt) >= now);
  assert.deepEqual(result.data.messages, [message]);
  assert.deepEqual(result.data.room, { address: '#fixture', key });
});

test('empty real and unwritten feeds are idle', async () => {
  for (const exists of [true, false]) {
    const result = await run({ ...feed([]), exists });
    assert.equal(result.state, 'idle');
    assert.deepEqual(result.errors, []);
  }
});

test('inbox and reply addresses resolve only matching rooms', async () => {
  const inbox = feed([]); inbox.log.address = '@fixture';
  assert.equal((await run(inbox, { to: '@fixture' })).state, 'idle');
  assert.equal((await run(feed(), { to: `loom:${key}#m_fixture` })).state, 'ok');
  assert.deepEqual((await run(feed(), { to: '@wrong' })).errors, ['room_mismatch']);
  assert.deepEqual((await run(feed(), { to: `loom:${'a'.repeat(24)}#m_fixture` })).errors, ['room_mismatch']);
});

test('URLs, query injection, noncanonical addresses and invalid options fail before fetch', async () => {
  const fetcher = () => assert.fail('must not fetch');
  for (const to of ['https://evil.test', '//evil.test', '#fixture&to=@other', '@Fixture', '', null, '#a b']) {
    assert.deepEqual((await readLoom({ to, fetcher })).errors, ['invalid_address']);
  }
  for (const options of [{ now: NaN }, { now: Infinity }, { timeoutMs: 0 }, { timeoutMs: 30001 },
    { maxAgeMs: -1 }, { maxAgeMs: Infinity }, { fetcher: null }]) {
    assert.deepEqual((await readLoom({ to: '#fixture', fetcher, ...options })).errors, ['invalid_options']);
  }
});

test('upstream failures expose bounded codes and no previous success', async () => {
  assert.equal((await run(feed())).state, 'ok');
  for (const fetcher of [async () => { throw new Error('PRIVATE UPSTREAM DETAIL'); },
    async () => new Response('PRIVATE UPSTREAM DETAIL', { status: 503 })]) {
    const result = await readLoom({ to: '#fixture', now, fetcher });
    assert.equal(result.state, 'error');
    assert.equal(result.observedAt, null);
    assert.deepEqual(result.data, { room: null, messages: [] });
    assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  }
});

test('bad schema, fabricated source and oversized message arrays fail closed', async () => {
  for (const payload of [null, [], {}, { ...feed(), ok: false }, { ...feed(), spec: 'other' },
    { ...feed(), messages: [null] }, { ...feed(), messages: Array(601).fill(message) },
    feed([{ ...message, body: 'x'.repeat(65537) }])]) {
    assert.deepEqual((await run(payload)).errors, ['invalid_schema']);
  }
  for (const payload of [{ ...feed(), kvBound: false }, { ...feed(), log: { ...feed().log, seed: true } }]) {
    assert.deepEqual((await run(payload)).errors, ['unavailable_source']);
  }
});

test('wrong content type, malformed JSON, redirects and excessive declared size are rejected', async () => {
  const cases = [
    [new Response('<html/>'), 'invalid_response'],
    [new Response('{', { headers: { 'content-type': 'application/json' } }), 'invalid_json'],
    [response(feed(), { 'content-length': '999999999' }), 'response_too_large'],
    [{ ok: true, redirected: true }, 'invalid_response'],
  ];
  for (const [res, code] of cases) {
    assert.deepEqual((await run(null, { fetcher: async () => res })).errors, [code]);
  }
});

test('stream byte bound holds even without Content-Length', async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); },
    cancel() { cancelled = true; },
  });
  const result = await run(null, { fetcher: async () => new Response(body, { headers: { 'content-type': 'application/json' } }) });
  assert.deepEqual(result.errors, ['response_too_large']);
  assert.equal(cancelled, true);
});

test('one deadline covers a hung fetch and a stalled body without retry', async () => {
  for (const stall of ['fetch', 'body']) {
    let calls = 0; let signal;
    const result = await run(null, { timeoutMs: 10, fetcher: async (_url, options) => {
      calls++; signal = options.signal;
      if (stall === 'fetch') return new Promise(() => {});
      return new Response(new ReadableStream({}), { headers: { 'content-type': 'application/json' } });
    } });
    assert.deepEqual(result.errors, ['timeout']);
    assert.equal(calls, 1);
    assert.equal(signal.aborted, true);
  }
});

test('cache Age governs read staleness; stale and invalid age expose no data', async () => {
  for (const [age, state, code] of [['121', 'stale', 'stale_response'], ['-1', 'error', 'invalid_age']]) {
    const result = await run(null, { fetcher: async () => response(feed(), { Age: age }) });
    assert.equal(result.state, state);
    assert.deepEqual(result.errors, [code]);
    assert.equal(result.observedAt, null);
    assert.deepEqual(result.data.messages, []);
  }
  assert.equal((await run(null, { fetcher: async () => response(feed(), { Age: '120' }) })).state, 'ok');
});
