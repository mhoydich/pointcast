import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { handleAtomicLoom } from '../../src/lib/loom/atomic.mjs';

const writers = 25;
const room = '#synthetic-swarm';
const endpoint = 'https://loom.test.invalid/api/loom';
const yieldTurn = () => new Promise(resolve => setImmediate(resolve));
const clock = () => new Date('2026-11-17T18:24:00Z');

// In-memory model of the adapter contract. No database, SQL engine, or
// network. A batch compares the revision before publishing any buffered keys.
function memoryRevisionStore() {
  let revision = 0;
  let conflicts = 0;
  const values = new Map();
  return {
    get conflicts() { return conflicts; },
    withSession(mode) { assert.equal(mode, 'first-primary'); return this; },
    prepare(sql) {
      const args = [];
      return {
        bind(...values) { args.push(...values); return this; },
        async first() {
          await yieldTurn();
          if (sql.startsWith('SELECT revision FROM loom_atomic_state')) return { revision };
          assert.match(sql, /^SELECT value FROM loom_atomic_values/);
          return values.has(args[0]) ? { value: values.get(args[0]) } : null;
        },
        get args() { return args; },
        sql,
      };
    },
    async batch([guard, ...writes]) {
      await yieldTurn();
      assert.match(guard.sql, /^UPDATE loom_atomic_state SET revision/);
      if (guard.args[0] !== revision) {
        conflicts += 1;
        throw new Error('CHECK constraint failed: loom_revision_matches');
      }
      for (const write of writes) assert.match(write.sql, /^INSERT INTO loom_atomic_values/);
      for (const { args: [key, value] } of writes) values.set(key, value);
      revision += 1;
    },
  };
}

async function run(label, handler, { limitAfter = Infinity, retryContention = false } = {}) {
  let calls = 0;
  const options = { clock, firstHelloEnabled: false, limit: async () => ++calls <= limitAfter };
  const request = new Request(endpoint + '?to=' + encodeURIComponent(room));
  const write = i => handler(
    new Request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        to: room,
        from: { name: 'Synthetic writer ' + i, address: '@fixture-' + i, kind: 'agent' },
        body: 'Load note ' + i,
      }),
    }),
    options,
  );
  const writes = Array.from({ length: writers }, (_, i) => write(i));
  const reads = Array.from({ length: writers }, async () => {
    const start = performance.now();
    const response = await handler(request.clone(), options);
    assert.equal(response.status, 200);
    await response.json();
    return performance.now() - start;
  });

  const responses = await Promise.all(writes);
  const statuses = {};
  const errors = {};
  const accepted = new Set();
  const contention = [];
  for (const [writer, response] of responses.entries()) {
    statuses[response.status] = (statuses[response.status] ?? 0) + 1;
    const receipt = await response.json();
    if (response.status === 201) accepted.add(receipt.message.id);
    else {
      errors[receipt.error] = (errors[receipt.error] ?? 0) + 1;
      if (receipt.error === 'loom_write_contention') {
        assert.equal(response.status, 503);
        assert.equal(response.headers.get('Retry-After'), '1');
        contention.push(writer);
      }
    }
  }
  assert.equal(accepted.size, statuses[201] ?? 0);
  async function recoveredCounts() {
    const response = await handler(request.clone(), options);
    assert.equal(response.status, 200);
    const result = await response.json();
    const sourcePosts = result.messages.filter(message => message.from.address?.startsWith('@fixture-'));
    const observed = new Set(sourcePosts.map(message => message.id));
    const recovered = [...accepted].filter(id => observed.has(id)).length;
    return {
      acknowledged: accepted.size,
      recovered,
      missingAcknowledged: accepted.size - recovered,
      duplicatePosts: sourcePosts.length - new Set(sourcePosts.map(message => message.from.address)).size,
    };
  }
  const firstPass = await recoveredCounts();
  let pacedRetry;
  if (retryContention && contention.length) {
    // Each entry was observed to have fully rolled back. Wait for the app's
    // advertised delay, then retry once per writer, with one request in flight.
    await delay(1000);
    let attempted = 0;
    let exhausted = 0;
    let ambiguous = false;
    for (const writer of contention) {
      const response = await write(writer);
      const receipt = await response.json();
      attempted += 1;
      if (response.status === 201) accepted.add(receipt.message.id);
      else if (response.status === 503 && receipt.error === 'loom_write_contention') exhausted += 1;
      else { ambiguous = true; break; }
    }
    pacedRetry = { attempted, exhausted, ambiguous, ...(await recoveredCounts()) };
  }
  const durations = (await Promise.all(reads)).sort((a, b) => a - b);
  return {
    label,
    attempted: writers,
    ...firstPass,
    ...(pacedRetry ? { pacedRetry } : {}),
    rateLimitHits: statuses[429] ?? 0,
    statuses,
    errors,
    readP50Ms: +durations[12].toFixed(2),
    readP95Ms: +durations[23].toFixed(2),
  };
}

const defaultDb = memoryRevisionStore();
const atomicDefault = await run('atomic, default retry budget', (request, options) => handleAtomicLoom(request, { ...options, db: defaultDb }), { retryContention: true });
assert.equal(atomicDefault.missingAcknowledged, 0);
assert.equal(atomicDefault.duplicatePosts, 0);
//
const controlDb = memoryRevisionStore();
const atomicWidened = await run('atomic, 25 attempts diagnostic', (request, options) => handleAtomicLoom(request, { ...options, db: controlDb, attempts: writers }));
assert.equal(atomicWidened.acknowledged, writers);
assert.equal(atomicWidened.missingAcknowledged, 0);
assert.equal(atomicWidened.duplicatePosts, 0);

const rateStore = memoryRevisionStore();
const rateControl = await run('synthetic rate budget control', (request, options) => handleAtomicLoom(request, { ...options, db: rateStore }), { limitAfter: 0 });
assert.equal(rateControl.rateLimitHits, writers);
assert.equal(rateControl.recovered, 0);
assert.equal((atomicDefault.statuses[201] ?? 0) + (atomicDefault.statuses[503] ?? 0), writers);
assert.equal(atomicDefault.rateLimitHits, 0);
assert.equal(atomicDefault.errors.loom_write_contention ?? 0, atomicDefault.statuses[503] ?? 0);
assert.ok(atomicDefault.pacedRetry, 'fixture must exercise explicitly rolled-back contention');
assert.equal(atomicDefault.pacedRetry.attempted, atomicDefault.statuses[503]);
assert.equal(atomicDefault.pacedRetry.acknowledged, writers);
assert.equal(atomicDefault.pacedRetry.recovered, writers);
assert.equal(atomicDefault.pacedRetry.duplicatePosts, 0);
assert.equal(atomicDefault.pacedRetry.exhausted, 0);
assert.equal(atomicDefault.pacedRetry.ambiguous, false);

console.log(JSON.stringify({
  atomicDefault: { ...atomicDefault, conflicts: defaultDb.conflicts },
  atomicWidened: { ...atomicWidened, conflicts: controlDb.conflicts },
  rateControl,
}, null, 2));
