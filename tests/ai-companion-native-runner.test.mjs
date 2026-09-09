import assert from 'node:assert/strict';
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  CompanionRunner, RuntimeClient, RuntimeHttpError, loadPairing, normalizeOrigin, parseOptions, pairRuntime, savePairing,
} from '../scripts/ai-companion/runner.mjs';

const TOKEN = 't'.repeat(43);
const LEASE = 'l'.repeat(43);
const state = { origin: 'https://pointcast.xyz', runtimeId: 'runtime-test', token: TOKEN };

async function files(t) {
  const root = await mkdtemp(join(tmpdir(), 'pointcast-runner-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repoRoot = join(root, 'repo');
  await mkdir(repoRoot);
  return { root, repoRoot, statePath: join(root, 'private', 'runtime.json') };
}

function fixture({ job = {}, call, runText, login, heartbeatMs = 60_000 } = {}) {
  const calls = [], executions = [], logs = [];
  let closed = 0;
  const claimedJob = job === null ? null : {
    id: 'job-one', kind: 'prompt', provider: 'codex', leaseToken: LEASE,
    expiresAt: new Date(Date.now() + 60_000).toISOString(), prompt: 'A small task.', model: 'test-model', ...job,
  };
  const adapter = {
    async inspectAccount() { return { available: true, authenticated: true, authMode: 'subscription' }; },
    async listModels() { return { models: [{ id: 'test-model', label: 'Test model' }], modelDiscovery: 'native' }; },
    async runText(options) {
      executions.push(options);
      return runText ? runText(options) : { text: 'A small result.', requestedModel: 'test-model', actualModels: ['test-model'], accessToken: 'must-not-leave-native-machine' };
    },
    async login(options) { executions.push(options); return login(options); },
    async close() { closed++; },
  };
  const client = { async call(operation, values = {}) {
    calls.push({ operation, values });
    if (call) {
      const response = await call(operation, values, calls);
      if (response !== undefined) return response;
    }
    return operation === 'claim' ? { ok: true, job: claimedJob } : { ok: true };
  } };
  const runner = new CompanionRunner({ client, adapters: { codex: adapter }, heartbeatMs, log: event => logs.push(event) });
  return { runner, calls, executions, logs, get closed() { return closed; } };
}

function operations(f) { return f.calls.map(call => call.operation); }
function completion(f) { return f.calls.find(call => call.operation === 'complete')?.values; }

test('origin validation allows HTTPS and loopback HTTP, with no credential or URL-path forwarding', () => {
  for (const [input, expected] of [
    ['https://pointcast.xyz/', 'https://pointcast.xyz'],
    ['https://preview.example:8443', 'https://preview.example:8443'],
    ['http://localhost:4321', 'http://localhost:4321'],
    ['http://127.0.0.1:8788', 'http://127.0.0.1:8788'],
    ['http://[::1]:8788', 'http://[::1]:8788'],
  ]) assert.equal(normalizeOrigin(input), expected);
  for (const input of ['invalid', 'http://pointcast.xyz', 'http://localhost.evil.example',
    'https://name:password@pointcast.xyz', 'https://pointcast.xyz/api',
    'https://pointcast.xyz/?token=secret', 'https://pointcast.xyz/#secret', 'file:///tmp/runtime']) {
    assert.throws(() => normalizeOrigin(input), /invalid-origin|origin-must-be-https-or-localhost/);
  }
});

test('pairing writes only expected fields outside the repo and replaces permissive files with mode 0600', async t => {
  const f = await files(t);
  await savePairing(f.statePath, { ...state, privateProviderToken: 'not-for-storage' }, f);
  assert.equal((await stat(f.statePath)).mode & 0o777, 0o600);
  assert.equal((await stat(join(f.root, 'private'))).mode & 0o777, 0o700);
  assert.deepEqual(JSON.parse(await readFile(f.statePath, 'utf8')), { version: 1, ...state });
  assert.deepEqual(await loadPairing(f.statePath), { version: 1, ...state });
  await chmod(f.statePath, 0o644);
  await savePairing(f.statePath, { ...state, runtimeId: 'replacement' }, f);
  assert.equal((await stat(f.statePath)).mode & 0o777, 0o600);
  assert.equal((await loadPairing(f.statePath)).runtimeId, 'replacement');
});

test('pairing storage rejects lexical and symlinked paths into the repository', async t => {
  const f = await files(t);
  await assert.rejects(savePairing(join(f.repoRoot, 'runtime.json'), state, f), /outside-repository/);
  const alias = join(f.root, 'repo-alias');
  await symlink(f.repoRoot, alias);
  await assert.rejects(savePairing(join(alias, 'runtime.json'), state, f), /outside-repository/);
  await assert.rejects(stat(join(f.repoRoot, 'runtime.json')), { code: 'ENOENT' });
});

test('pairing storage and reading reject a symlink without modifying its target', async t => {
  const f = await files(t);
  await mkdir(join(f.root, 'private'));
  const target = join(f.root, 'target.json');
  await writeFile(target, JSON.stringify({ version: 1, ...state }), { mode: 0o600 });
  const before = await readFile(target, 'utf8');
  await symlink(target, f.statePath);
  await assert.rejects(savePairing(f.statePath, state, f), /must-not-be-symlink/);
  await assert.rejects(loadPairing(f.statePath), { code: 'ELOOP' });
  assert.equal(await readFile(target, 'utf8'), before);
  assert.equal((await lstat(f.statePath)).isSymbolicLink(), true);
});

test('pairing reading rejects exposed, oversized, or invalid credentials', async t => {
  const f = await files(t);
  await savePairing(f.statePath, state, f);
  await chmod(f.statePath, 0o640);
  await assert.rejects(loadPairing(f.statePath), /requires-mode-0600/);
  await chmod(f.statePath, 0o600);
  await writeFile(f.statePath, 'x'.repeat(16_385));
  await assert.rejects(loadPairing(f.statePath), /requires-mode-0600/);
  await writeFile(f.statePath, JSON.stringify({ version: 1, ...state, token: 'invalid' }));
  await assert.rejects(loadPairing(f.statePath), /invalid-pairing-file/);
  await assert.rejects(savePairing(f.statePath, { ...state, token: 'invalid' }, f), /invalid-pairing-response/);
});

test('runtime HTTP calls do not follow redirects or include a browser origin, and make no automatic retries', async () => {
  const calls = [];
  const client = new RuntimeClient({ ...state, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } });
  await client.call('claim');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://pointcast.xyz/api/ai-runtime');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.authorization, 'Bearer ' + TOKEN);
  assert.equal(calls[0].options.headers.origin, undefined);
  assert.deepEqual(JSON.parse(calls[0].options.body), { operation: 'claim' });
  let failures = 0;
  const failing = new RuntimeClient({ ...state, fetchImpl: async () => {
    failures++;
    return new Response('upstream body containing a secret', { status: 503 });
  } });
  await assert.rejects(failing.call('complete'), { message: 'runtime-request-failed-503', status: 503 });
  assert.equal(failures, 1);
});

test('--once claims and completes exactly one prompt, sends only reviewed result fields, then closes', async () => {
  const f = fixture();
  const options = parseOptions(['--once']);
  assert.equal(options.once, true);
  assert.deepEqual(await f.runner.run(options), { status: 'succeeded', jobId: 'job-one' });
  assert.deepEqual(operations(f), ['heartbeat', 'claim', 'complete']);
  assert.equal(f.executions.length, 1);
  assert.equal(f.executions[0].prompt, 'A small task.');
  assert.equal(f.executions[0].model, 'test-model');
  assert.ok(f.executions[0].timeoutMs > 0 && f.executions[0].timeoutMs < 60_000);
  assert.deepEqual(completion(f), { jobId: 'job-one', leaseToken: LEASE, status: 'succeeded',
    result: { text: 'A small result.', requestedModel: 'test-model', actualModels: ['test-model'] } });
  assert.deepEqual(f.logs, [{ jobId: 'job-one', status: 'succeeded' }]);
  assert.equal(f.closed, 1);
});

test('--once with no queued job exits without inference or completion', async () => {
  const f = fixture({ job: null });
  assert.deepEqual(await f.runner.run({ once: true }), { status: 'idle' });
  assert.deepEqual(operations(f), ['heartbeat', 'claim']);
  assert.equal(f.executions.length, 0);
  assert.equal(f.closed, 1);
});

test('an ambiguous completion delivery stops the loop without another claim or inference', async () => {
  for (const error of [new Error('network-failed'), new RuntimeHttpError(503)]) {
    const f = fixture({ call(operation) { if (operation === 'complete') throw error; } });
    await assert.rejects(f.runner.run(), caught => caught === error);
    assert.deepEqual(operations(f), ['heartbeat', 'claim', 'complete']);
    assert.equal(f.executions.length, 1);
    assert.equal(f.closed, 1);
    assert.deepEqual(f.logs, []);
    assert.deepEqual(await f.runner.once(), { status: 'stopped' });
    assert.equal(f.executions.length, 1);
  }
});

test('a completion rejected by an expired lease does not report success or repeat the job', async () => {
  const f = fixture({ call(operation) { if (operation === 'complete') throw new RuntimeHttpError(409); } });
  assert.deepEqual(await f.runner.run({ once: true }), { status: 'cancelled-or-expired' });
  assert.deepEqual(operations(f), ['heartbeat', 'claim', 'complete']);
  assert.equal(f.executions.length, 1);
  assert.deepEqual(f.logs, [{ jobId: 'job-one', status: 'cancelled-or-expired' }]);
});

test('a cancellation heartbeat aborts the adapter and suppresses even a late successful response', { timeout: 2000 }, async () => {
  let heartbeats = 0, aborted = false;
  const f = fixture({ heartbeatMs: 5,
    call(operation) {
      if (operation === 'heartbeat') return { ok: true, cancelledJobIds: ++heartbeats > 1 ? ['job-one'] : [] };
    },
    runText({ signal }) {
      return new Promise(resolve => signal.addEventListener('abort', () => {
        aborted = true;
        resolve({ text: 'Late output must not succeed.', actualModels: ['test-model'] });
      }, { once: true }));
    },
  });
  assert.deepEqual(await f.runner.run({ once: true, signal: AbortSignal.timeout(1000) }), { status: 'failed', jobId: 'job-one' });
  assert.equal(aborted, true);
  assert.ok(heartbeats >= 2);
  assert.deepEqual(completion(f), { jobId: 'job-one', leaseToken: LEASE, status: 'failed', error: 'cancelled' });
  assert.equal(f.executions.length, 1);
  assert.equal(f.calls.filter(c => c.operation === 'claim').length, 1);
  assert.equal(f.calls.filter(c => c.operation === 'complete').length, 1);
  assert.equal(f.closed, 1);
});

test('a revoked pairing heartbeat aborts inference and stops the runner', { timeout: 2000 }, async () => {
  let heartbeats = 0;
  const revoked = new RuntimeHttpError(401);
  const f = fixture({ heartbeatMs: 5,
    call(operation) { if (operation === 'heartbeat' && ++heartbeats > 1) throw revoked; },
    runText({ signal }) { return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })); },
  });
  await assert.rejects(f.runner.run({ signal: AbortSignal.timeout(1000) }), error => error === revoked);
  assert.equal(completion(f).status, 'failed');
  assert.equal(completion(f).error, 'cancelled');
  assert.equal(f.executions.length, 1);
  assert.equal(f.calls.filter(c => c.operation === 'claim').length, 1);
  assert.equal(f.closed, 1);
});

test('expired jobs are completed as failed without starting the native adapter', async () => {
  const f = fixture({ job: { expiresAt: new Date(Date.now() - 1000).toISOString() } });
  assert.deepEqual(await f.runner.run({ once: true }), { status: 'failed', jobId: 'job-one' });
  assert.equal(f.executions.length, 0);
  assert.equal(completion(f).error, 'job-expired');
});

test('one login job forwards native login progress under its lease without running inference', async () => {
  const progress = { verificationUrl: 'https://auth.openai.com/codex/device', userCode: 'TEST-CODE' };
  const f = fixture({ job: { kind: 'login' }, login: async ({ onProgress }) => {
    await onProgress(progress);
    return { text: 'Login complete.', actualModels: [] };
  } });
  assert.equal((await f.runner.run({ once: true })).status, 'succeeded');
  assert.deepEqual(operations(f), ['heartbeat', 'claim', 'progress', 'complete']);
  assert.deepEqual(f.calls.find(c => c.operation === 'progress').values, { jobId: 'job-one', leaseToken: LEASE, login: progress });
  assert.equal(f.executions.length, 1);
  assert.equal(f.executions[0].prompt, undefined);
});

for (const lateOutcome of ['cancellation', 'failure']) {
  test(`a late heartbeat ${lateOutcome} wins after the native result and before completion`, { timeout: 2000 }, async t => {
    const nativeResult = Promise.withResolvers();
    const heartbeatStarted = Promise.withResolvers();
    const heartbeatResponse = Promise.withResolvers();
    const failure = new RuntimeHttpError(401);
    let heartbeats = 0;
    const f = fixture({ heartbeatMs: 5,
      call(operation) {
        if (operation !== 'heartbeat') return;
        if (++heartbeats === 1) return { ok: true };
        heartbeatStarted.resolve();
        return heartbeatResponse.promise;
      },
      runText() { return nativeResult.promise; },
    });
    const running = f.runner.run({ once: lateOutcome === 'cancellation' });
    const outcome = running.then(value => ({ value }), error => ({ error }));
    t.after(async () => {
      nativeResult.resolve({ text: 'Cleanup.', actualModels: ['test-model'] });
      heartbeatResponse.resolve({ ok: true, cancelledJobIds: ['job-one'] });
      await f.runner.close();
      await outcome;
    });
    await heartbeatStarted.promise;
    nativeResult.resolve({ text: 'Task finished before the heartbeat.', actualModels: ['test-model'] });
    // Drain task completion microtasks without releasing the held heartbeat.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.executions.length, 1);
    assert.equal(completion(f), undefined, 'completion must wait for the in-flight heartbeat');
    assert.equal(f.runner.active?.id, 'job-one', 'late cancellation still has an active controller');
    assert.equal(f.runner.active.controller.signal.aborted, false);
    if (lateOutcome === 'cancellation') heartbeatResponse.resolve({ ok: true, cancelledJobIds: ['job-one'] });
    else heartbeatResponse.reject(failure);
    const result = await outcome;
    if (lateOutcome === 'cancellation') assert.deepEqual(result.value, { status: 'failed', jobId: 'job-one' });
    else assert.equal(result.error, failure);
    assert.deepEqual(completion(f), { jobId: 'job-one', leaseToken: LEASE, status: 'failed', error: 'cancelled' });
    assert.equal(f.calls.filter(c => c.operation === 'claim').length, 1);
    assert.equal(f.calls.filter(c => c.operation === 'complete').length, 1);
    assert.equal(f.executions.length, 1);
    assert.equal(f.logs.some(event => event.status === 'succeeded'), false);
    assert.equal(f.runner.closed, true);
  });
}

test('pairing validates destination paths before any HTTP request consumes the code', async t => {
  const f = await files(t); let requests = 0;
  const client = new RuntimeClient({ fetchImpl: async () => { requests++; throw new Error('must-not-request'); } });
  const target = join(f.root, 'existing'); await writeFile(target, 'unchanged');
  const linked = join(f.root, 'linked'); await symlink(target, linked);
  const repoAlias = join(f.root, 'repo-alias'); await symlink(f.repoRoot, repoAlias);
  const directory = join(f.root, 'directory'); await mkdir(directory);
  for (const [stateFile, expected] of [
    [join(f.repoRoot, 'runtime.json'), /outside-repository/],
    [join(repoAlias, 'runtime.json'), /outside-repository/],
    [linked, /must-not-be-symlink/],
    [directory, /path-must-be-file/],
  ]) await assert.rejects(pairRuntime({ client, code: 'c'.repeat(43), stateFile, repoRoot: f.repoRoot }), expected);
  assert.equal(requests, 0);
  assert.equal(await readFile(target, 'utf8'), 'unchanged');
});

test('pairing omits implicit labels while preserving an explicitly chosen label', async t => {
  const f = await files(t); const requests = [];
  const client = new RuntimeClient({ fetchImpl: async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ ok: true, runtimeId: state.runtimeId, token: TOKEN }), { status: 200 });
  } });
  assert.equal(Object.hasOwn(parseOptions([]), 'label'), false);
  const base = { client, code: 'c'.repeat(43), stateFile: f.statePath, repoRoot: f.repoRoot, origin: state.origin };
  assert.deepEqual(await pairRuntime(base), state);
  assert.deepEqual(requests[0], { operation: 'pair', code: base.code });
  await pairRuntime({ ...base, label: 'My chosen computer' });
  assert.deepEqual(requests[1], { operation: 'pair', code: base.code, label: 'My chosen computer' });
  assert.equal((await stat(f.statePath)).mode & 0o777, 0o600);
  assert.deepEqual(await loadPairing(f.statePath), { version: 1, ...state });
});

test('valid pairing codes beginning with two dashes are accepted without accepting missing flag values', () => {
  const code = '--' + 'a'.repeat(41);
  assert.equal(parseOptions(['--pair', code, '--once']).pair, code);
  assert.equal(parseOptions(['--label', 'Chosen label']).label, 'Chosen label');
  assert.throws(() => parseOptions(['--pair', '--once']), /missing-option-value/);
  assert.throws(() => parseOptions(['--state-file', '--once']), /missing-option-value/);
});
