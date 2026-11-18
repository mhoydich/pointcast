import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { addressKey } from '../src/lib/loom/address.mjs';
import { handleAtomicLoom } from '../src/lib/loom/atomic.mjs';

const writerCount = 25;
const room = '#synthetic-swarm';
const endpoint = 'https://loom.test.invalid/api/loom';
const clock = () => new Date('2026-11-17T18:24:00Z');
const yieldTurn = () => new Promise(resolve => setImmediate(resolve));
const emptyArchive = { get: async () => null };

// Model the adapter's compare-and-commit contract without a database or network.
// Yielding before reads and commits lets the handler's attempts overlap.
function memoryRevisionStore(values = new Map()) {
  let revision = 0;
  let conflicts = 0;
  return {
    get conflicts() { return conflicts; },
    withSession(mode) {
      assert.equal(mode, 'first-primary');
      return this;
    },
    prepare(sql) {
      const args = [];
      return {
        sql,
        args,
        bind(...params) {
          args.push(...params);
          return this;
        },
        async first() {
          await yieldTurn();
          if (sql.startsWith('SELECT revision FROM loom_atomic_state')) return { revision };
          assert.match(sql, /^SELECT value FROM loom_atomic_values/);
          return values.has(args[0]) ? { value: values.get(args[0]) } : null;
        },
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

const writers = Array.from({ length: writerCount }, (_, i) => ({
  to: room,
  from: { name: `Synthetic writer ${i}`, address: `@fixture-${i}`, kind: 'agent' },
  body: `Load note ${i}`,
}));

function write(options, message) {
  return handleAtomicLoom(new Request(endpoint, {
    method: 'POST',
    body: JSON.stringify(message),
  }), { clock, firstHelloEnabled: false, ...options });
}

async function read(options) {
  const response = await handleAtomicLoom(new Request(`${endpoint}?to=${encodeURIComponent(room)}`), options);
  assert.equal(response.status, 200);
  return response.json();
}

function recordReceipt(receipts, writer, receipt) {
  assert.equal(receipt.ok, true);
  assert.equal(receipt.message.from.address, writer.from.address);
  assert.equal(receipt.message.body, writer.body);
  assert.ok(receipt.message.id);
  assert.ok(!receipts.has(receipt.message.id), 'every receipt must have a unique ID');
  receipts.set(receipt.message.id, [writer.from.address, writer.body, receipt.message.seq]);
}

async function assertStoredReceipts(options, receipts) {
  const { messages } = await read(options);
  assert.equal(messages.length, receipts.size, 'every stored post must have exactly one receipt');
  const stored = new Map(messages.map(message => [message.id, [message.from.address, message.body, message.seq]]));
  assert.deepEqual(stored, receipts);
  assert.equal(new Set(messages.map(message => message.seq)).size, receipts.size);
}

test('25 overlapping Loom writers persist each receipt or return retryable contention', async () => {
  const db = memoryRevisionStore();
  const options = { db, kv: emptyArchive };
  const [responses] = await Promise.all([
    Promise.all(writers.map(writer => write(options, writer))),
    Promise.all(writers.map(() => read(options))),
  ]);
  const receipts = new Map();
  const rolledBack = [];
  for (const [index, response] of responses.entries()) {
    const writer = writers[index];
    const receipt = await response.json();
    if (response.status === 201) {
      recordReceipt(receipts, writer, receipt);
    } else {
      assert.equal(response.status, 503);
      assert.equal(receipt.ok, false);
      assert.equal(receipt.error, 'loom_write_contention');
      assert.equal(receipt.retryAfterSec, 1);
      assert.equal(response.headers.get('Retry-After'), '1');
      rolledBack.push(writer);
    }
  }
  assert.ok(receipts.size > 0, 'the first pass must commit some writes');
  assert.ok(rolledBack.length > 0 && db.conflicts > 0, 'the fixture must exhaust retries for some writers');
  await assertStoredReceipts(options, receipts);

  // Follow Retry-After, then replay each explicitly rolled-back write once.
  await delay(1000);
  for (const writer of rolledBack) {
    const response = await write(options, writer);
    assert.equal(response.status, 201);
    recordReceipt(receipts, writer, await response.json());
  }
  assert.equal(receipts.size, writerCount);
  await assertStoredReceipts(options, receipts);
});

test('25 overlapping Loom writers can all commit with a larger retry budget', async () => {
  const options = { db: memoryRevisionStore(), kv: emptyArchive, attempts: writerCount };
  const responses = await Promise.all(writers.map(writer => write(options, writer)));
  const receipts = new Map();
  for (const [index, response] of responses.entries()) {
    assert.equal(response.status, 201);
    recordReceipt(receipts, writers[index], await response.json());
  }
  await assertStoredReceipts(options, receipts);
});

test('25 rate-limited Loom writers receive 429 and leave the room empty', async () => {
  const options = { db: memoryRevisionStore(), kv: emptyArchive, limit: async () => false };
  const responses = await Promise.all(writers.map(writer => write(options, writer)));
  assert.ok(responses.every(response => response.status === 429));
  await assertStoredReceipts(options, new Map());
});

test('invalid JSON shapes in the committed store or archive cannot be overwritten', async () => {
  const roomKey = `loom:log:${await addressKey(room)}`;
  for (const [key, value] of [[roomKey, 'null'], ['loom:rooms', '{}']]) {
    for (const source of ['archive', 'committed']) {
      const original = new Map([[key, value]]);
      const committed = source === 'committed' ? original : new Map();
      const kv = source === 'archive' ? { get: async name => original.get(name) ?? null } : emptyArchive;
      const response = await write({ db: memoryRevisionStore(committed), kv }, writers[0]);
      assert.equal(response.status, 503, `${source} ${key} must fail closed`);
      assert.equal(response.headers.get('Retry-After'), null);
      const receipt = await response.json();
      assert.equal(receipt.ok, false);
      assert.equal(receipt.error, 'loom_storage_unavailable');
      assert.equal(receipt.retryAfterSec, undefined);
      assert.deepEqual([...committed], source === 'committed' ? [[key, value]] : []);
    }
  }
});
