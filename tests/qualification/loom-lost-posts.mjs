// Opt-in: this is intentionally red on unfixed main, so it is outside npm test.
// LOOM_REPRO_SOURCE=/path/to/local/worktree node --test tests/qualification/loom-lost-posts.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { localStores, readSchedule } from '../helpers/loom-local-store.mjs';

const source = resolve(process.env.LOOM_REPRO_SOURCE ?? '.');
const entry = resolve(source, 'functions/api/loom.ts');
const atomic = /import \{ handleAtomicLoom \}/.test(readFileSync(entry, 'utf8'));
const revision = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const compiled = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false });
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const endpoint = 'https://loom.test.invalid/api/loom';
const room = '#lost-posts-fixture';
const roomKey = `loom:log:${createHash('sha256').update(room).digest('hex').slice(0, 24)}`;

// Requests are objects passed directly to onRequest, never HTTP traffic.
globalThis.fetch = async () => { throw new Error('Network access forbidden in Loom lost-posts qualification'); };

async function read(env) {
  const response = await onRequest({ request: new Request(`${endpoint}?to=${encodeURIComponent(room)}&since=0`), env });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  return body.messages;
}

async function post(env, writer) {
  const response = await onRequest({ request: new Request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `192.0.2.${writer + 1}` },
    body: JSON.stringify({ to: room, from: { name: 'Load fixture', kind: 'agent', address: `@fixture-${writer}` }, body: `Fixture post ${writer}` }),
  }), env });
  return { writer, status: response.status, retryAfter: response.headers.get('Retry-After'), body: await response.json() };
}

function checkResponse(result) {
  if (result.status === 201) {
    assert.equal(result.body.ok, true);
    assert.equal(result.body.message.body, `Fixture post ${result.writer}`);
    assert.equal(result.body.message.from.address, `@fixture-${result.writer}`);
    assert.ok(result.body.message.id);
  } else {
    // Only explicit, rolled-back contention can be replayed. An ambiguous
    // storage failure, 429 or validation failure must fail this experiment.
    assert.equal(result.status, 503, JSON.stringify(result));
    assert.equal(result.body.error, 'loom_write_contention');
    assert.equal(result.body.retryAfterSec, 1);
    assert.equal(result.retryAfter, '1');
  }
}

function summarize(receipts, messages, sent) {
  const acknowledged = receipts.filter(receipt => receipt.status === 201);
  const ids = new Set(messages.map(message => message.id));
  const writers = new Set(messages.map(message => message.from.address));
  return {
    sent,
    acknowledged: acknowledged.length,
    present: acknowledged.filter(receipt => ids.has(receipt.body.message.id)).length,
    duplicates: messages.length - writers.size,
    duplicateIds: messages.length - ids.size,
    duplicateReceiptIds: acknowledged.length - new Set(acknowledged.map(receipt => receipt.body.message.id)).size,
    duplicateSequences: messages.length - new Set(messages.map(message => message.seq)).size,
    rejected: receipts.filter(receipt => receipt.status !== 201).length,
  };
}

for (const count of [25, 100]) {
  for (const scenario of ['burst', 'delayed-snapshot']) {
    test(`${scenario}: ${count} concurrent appends retain acknowledged posts`, { timeout: 60_000 }, async t => {
      const schedule = readSchedule(roomKey, count, { delayedWriter: scenario === 'delayed-snapshot' ? count - 1 : null });
      const stores = localStores(schedule, { atomic });
      // A known sender avoids unrelated automatic hello messages while leaving
      // the complete production wrapper, limiter and append handler unchanged.
      const nameHash = createHash('sha256').update('load fixture').digest('hex').slice(0, 32);
      stores.archive.set(`loom:welcomed:${nameHash}`, new Date().toISOString());
      let pending = [];
      const cancel = () => schedule.cancel();
      t.signal.addEventListener('abort', cancel, { once: true });
      try {
        pending = Array.from({ length: count }, (_, writer) => schedule.run(writer, () => post(stores.env, writer)));
        let observedBeforeLateWrite = [];
        if (scenario === 'delayed-snapshot') {
          await schedule.ready;
          const early = await Promise.all(pending.slice(0, -1));
          early.forEach(checkResponse);
          const visible = new Set((await read(stores.env)).map(message => message.id));
          observedBeforeLateWrite = early.filter(result => result.status === 201 && visible.has(result.body.message.id)).map(result => result.body.message.id);
          assert.ok(observedBeforeLateWrite.length, 'at least one acknowledged post must be read before the stale writer resumes');
          schedule.release();
        }
        const receipts = await Promise.all(pending);
        receipts.forEach(checkResponse);
        const initialMessages = await read(stores.env);
        const first = summarize(receipts, initialMessages, count);
        const visible = new Set(initialMessages.map(message => message.id));
        const vanishedAfterRead = observedBeforeLateWrite.filter(id => !visible.has(id)).length;

        // Production keeps its default eight internal attempts. Follow the
        // returned delay, then retry each definitively rejected request once,
        // sequentially. Never retry a success, even if its post disappeared.
        const rejected = receipts.filter(result => result.status !== 201);
        if (rejected.length) await delay(Math.max(...rejected.map(result => Number(result.retryAfter))) * 1000);
        for (const result of rejected) {
          const retry = await post(stores.env, result.writer);
          checkResponse(retry);
          assert.equal(retry.status, 201, 'one paced retry should succeed without competing writers');
          receipts[result.writer] = retry;
        }
        const messages = await read(stores.env);
        const final = summarize(receipts, messages, count);
        const report = { revision, backend: atomic ? 'SQLite D1 fixture' : 'KV fixture', scenario, first, final,
          observedBeforeLateWrite: observedBeforeLateWrite.length, vanishedAfterRead, retries: rejected.length, ...stores.stats() };
        t.diagnostic(JSON.stringify(report));

        assert.equal(first.present, first.acknowledged, 'every first-pass 201 receipt must be present on read-back');
        assert.equal(vanishedAfterRead, 0, 'a post read back before the late write must still exist afterwards');
        assert.equal(final.acknowledged, count);
        assert.equal(final.present, count);
        for (const snapshot of [first, final]) {
          assert.equal(snapshot.duplicates, 0);
          assert.equal(snapshot.duplicateIds, 0);
          assert.equal(snapshot.duplicateReceiptIds, 0);
          assert.equal(snapshot.duplicateSequences, 0);
        }
        const stored = new Map(messages.map(message => [message.id, [message.body, message.from.address, message.seq]]));
        for (const receipt of receipts) {
          const message = receipt.body.message;
          assert.deepEqual(stored.get(message.id), [message.body, message.from.address, message.seq]);
        }
      } finally {
        schedule.cancel();
        await Promise.allSettled(pending);
        t.signal.removeEventListener('abort', cancel);
        stores.close();
      }
    });
  }
}
