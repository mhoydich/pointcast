import assert from 'node:assert/strict';
import test from 'node:test';
import { initial, observe } from '../src/lib/co-games-engine.mjs';
import { CoGamesRuntimeClient, CoGamesRuntimeError, buildCoGamesPrompt, parseCoGamesResponse } from '../src/lib/co-games-runtime.ts';

const requestId = 'request-1234567890';
const observation = () => observe(initial(), 'ember', 'game-one');
const answer = (overrides = {}) => ({ gameId: 'game-one', revision: 0, selectedHuman: 'ember', support: 'echo', reason: 'Add damage while we have room to take this hit.', ...overrides });
const future = () => new Date(Date.now() + 600000).toISOString();
const runtime = (overrides = {}) => ({ id: 'runtime-one', label: 'My computer', status: 'online', expiresAt: future(), lastSeenAt: new Date().toISOString(), providers: [
  { provider: 'codex', available: true, authenticated: true, authMode: 'subscription', models: [{ id: 'test-model', label: 'Test model' }] },
], ...overrides });
const choice = () => ({ id: 'runtime-one:codex', runtimeId: 'runtime-one', label: 'My computer', provider: 'codex', providerLabel: 'ChatGPT · Codex', models: [{ id: 'test-model', label: 'Test model' }], busy: false });
const job = (overrides = {}) => ({ id: 'job-one', requestId, runtimeId: 'runtime-one', kind: 'prompt', provider: 'codex', status: 'succeeded', expiresAt: future(), result: { text: JSON.stringify(answer()), actualModels: ['test-model'] }, ...overrides });
const snapshot = (jobs = [], runtimes = [runtime()]) => Response.json({ ok: true, runtimes, jobs });
const accepted = () => Response.json({ ok: true, jobId: 'job-one' }, { status: 201 });
const tick = () => new Promise(resolve => setImmediate(resolve));
function clientWith(respond, options = {}) {
  const calls = [];
  const client = new CoGamesRuntimeClient({ pollMs: 0, ...options, fetchImpl: async (url, init) => {
    assert.equal(url, '/api/me/ai-runtimes');
    assert.equal(init.credentials, 'include');
    assert.equal(init.cache, 'no-store');
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ method: init.method, body });
    return respond({ method: init.method, body, signal: init.signal, calls });
  } });
  return { client, calls };
}
const failure = reason => error => error instanceof CoGamesRuntimeError && error.reason === reason;

test('default browser fetch keeps its global receiver for discovery, submission, and polling', async (t) => {
  const methods = [];
  t.mock.method(globalThis, 'fetch', async function (url, init) {
    // Browser fetch can reject calls whose receiver is a client instance.
    if (this !== globalThis) throw new TypeError('Illegal invocation');
    assert.equal(url, '/api/me/ai-runtimes');
    assert.equal(init.credentials, 'include');
    methods.push(init.method);
    return init.method === 'POST' ? accepted() : snapshot([job()]);
  });
  const client = new CoGamesRuntimeClient({ pollMs: 0 });
  const choices = await client.discover();
  assert.equal(choices[0].runtimeId, 'runtime-one');
  const result = await client.requestSupport(choices[0], observation(), { requestId });
  assert.equal(result.response.support, 'echo');
  assert.deepEqual(methods, ['GET', 'POST', 'GET']);
});

test('discovers only live native subscription choices and reports runtime contention', async () => {
  const r = runtime();
  r.providers.push({ provider: 'claude', available: true, authenticated: true, authMode: 'subscription', models: [] });
  const { client } = clientWith(() => snapshot([job({ status: 'running' })], [r,
    runtime({ id: 'stale', lastSeenAt: new Date(Date.now() - 46000).toISOString() }),
    runtime({ id: 'expired', expiresAt: new Date(Date.now() - 1).toISOString() }),
    runtime({ id: 'api', providers: [{ ...r.providers[0], authMode: 'api' }] }),
    runtime({ id: 'not-authenticated', providers: [{ ...r.providers[0], authenticated: false }] }),
    runtime({ id: 'waiting', status: 'waiting' }),
  ]));
  const choices = await client.discover();
  assert.equal(choices.length, 2);
  assert.deepEqual(choices.map(c => c.provider), ['codex', 'claude']);
  assert.ok(choices.every(c => c.busy));
  assert.deepEqual(choices[0].models, [{ id: 'test-model', label: 'Test model' }]);
});

test('prompt carries all rules and bounded game data; invalid or oversized packets fail before transport', () => {
  const prompt = buildCoGamesPrompt(observation());
  assert.ok(prompt.length < 4000);
  assert.match(prompt, /Both sides attack even on the final blow/);
  assert.match(prompt, /zero-based indexes: 0 is round 1 and 3 is round 4/);
  assert.match(prompt, /current incoming attack is threats\[state.round\]/);
  assert.match(prompt, /without numerical health, damage, or round forecasts/);
  assert.match(prompt, /Focus doubles the human's next damaging spell/);
  assert.ok(prompt.includes(JSON.stringify(observation())));
  assert.throws(() => buildCoGamesPrompt({ ...observation(), legalSupports: [] }), failure('invalid-observation'));
  assert.throws(() => buildCoGamesPrompt({ ...observation(), extra: 'a'.repeat(4000) }), failure('prompt-too-large'));
});

test('bounded parser accepts JSON or a single JSON fence and rejects stale, illegal, or mixed replies', () => {
  assert.deepEqual(parseCoGamesResponse(JSON.stringify(answer()), observation()), answer());
  assert.deepEqual(parseCoGamesResponse('```json\n' + JSON.stringify(answer()) + '\n```', observation()), answer());
  for (const invalid of [answer({ revision: 1 }), answer({ gameId: 'older-game' }), answer({ selectedHuman: 'root' }),
    answer({ support: 'invented-card' }), answer({ reason: 'x'.repeat(241) }), [], null]) {
    assert.throws(() => parseCoGamesResponse(JSON.stringify(invalid), observation()), failure('invalid-game-response'));
  }
  assert.throws(() => parseCoGamesResponse('Here is my move: ' + JSON.stringify(answer()), observation()), failure('invalid-game-response'));
  assert.throws(() => parseCoGamesResponse('x'.repeat(16001), observation()), failure('invalid-game-response'));
  assert.deepEqual(parseCoGamesResponse(JSON.stringify({ ...answer(), hp: 999, script: '<script>bad</script>' }), observation()), answer());
});

test('one explicit submission polls only its own exact job, returns model evidence and never plays effects', async () => {
  let reads = 0;
  const { client, calls } = clientWith(({ method }) => method === 'POST' ? accepted()
    : snapshot([job({ id: 'unrelated', requestId: 'unrelated-request-123', result: { text: 'bad', actualModels: [] } }),
      job({ status: ++reads === 1 ? 'running' : 'succeeded' })]));
  const progress = [];
  const result = await client.requestSupport(choice(), observation(), { requestId, onProgress: p => progress.push(p) });
  assert.deepEqual(result, { response: answer(), actualModels: ['test-model'], jobId: 'job-one', requestId });
  assert.equal(calls.filter(c => c.method === 'POST').length, 1);
  assert.deepEqual(progress.map(p => p.status), ['submitting', 'queued', 'running']);
  assert.equal(calls[0].body.kind, 'prompt');
  assert.equal(calls[0].body.provider, 'codex');
  assert.equal(calls[0].body.model, undefined);
});

test('immutable ambiguous retry reuses identical request ID and body; changed card cannot reuse it', async () => {
  let posts = 0;
  const { client, calls } = clientWith(({ method }) => {
    if (method === 'GET') return snapshot([job()]);
    if (++posts === 1) throw new TypeError('Network failed after server acceptance');
    return accepted();
  });
  await assert.rejects(client.requestSupport(choice(), observation(), { requestId }), error => failure('network-error')(error) && error.requestId === requestId);
  await assert.rejects(client.requestSupport(choice(), observe(initial(), 'root', 'game-one'), { requestId }), failure('request-conflict'));
  const result = await client.requestSupport(choice(), observation(), { requestId });
  assert.equal(result.response.support, 'echo');
  assert.deepEqual(calls.filter(c => c.method === 'POST')[0].body, calls.filter(c => c.method === 'POST')[1].body);
});

test('retrying an accepted failed or malformed-result job never submits a new inference', async () => {
  const { client, calls } = clientWith(({ method }) => method === 'POST' ? accepted() : snapshot([job({ status: 'failed', error: 'native-task-failed' })]));
  for (let i = 0; i < 2; i++) await assert.rejects(client.requestSupport(choice(), observation(), { requestId }), failure('native-task-failed'));
  assert.equal(calls.filter(c => c.method === 'POST').length, 1);
});

test('missing model provenance or response text cannot become a partner move', async () => {
  for (const [result, reason] of [
    [{ text: JSON.stringify(answer()), actualModels: [] }, 'model-proof-required'],
    [{ text: JSON.stringify(answer()), actualModels: ['bad model'] }, 'model-proof-required'],
    [{ text: '', actualModels: ['test-model'] }, 'invalid-game-response'],
    [null, 'invalid-game-response'],
    [{ text: JSON.stringify(answer({ support: 'illegal' })), actualModels: ['test-model'] }, 'invalid-game-response'],
  ]) {
    const { client } = clientWith(({ method }) => method === 'POST' ? accepted() : snapshot([job({ result })]));
    await assert.rejects(client.requestSupport(choice(), observation(), { requestId }), error => failure(reason)(error) && error.jobId === 'job-one');
  }
});

test('auth expiry, malformed status and missing exact job stop without any fallback', async () => {
  const responses = [
    [() => Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 }), 'unauthorized'],
    [() => Response.json({ ok: true, runtimes: [], jobs: 'bad' }), 'invalid-response'],
    [() => snapshot([]), 'job-missing'],
    [() => snapshot([job({ requestId: 'another-request-123' })]), 'invalid-response'],
    [() => snapshot([job({ status: 'queued', expiresAt: new Date(Date.now() - 1).toISOString() })]), 'job-expired'],
  ];
  for (const [response, reason] of responses) {
    const { client, calls } = clientWith(({ method }) => method === 'POST' ? accepted() : response());
    await assert.rejects(client.requestSupport(choice(), observation(), { requestId }), failure(reason));
    assert.equal(calls.filter(c => c.method === 'POST').length, 1);
  }
});

test('abort stops polling while preserving request identity and does not claim remote cancellation', async () => {
  const controller = new AbortController();
  const { client, calls } = clientWith(({ method }) => method === 'POST' ? accepted() : snapshot([job({ status: 'running' })]), { pollMs: 100000 });
  const pending = client.requestSupport(choice(), observation(), { requestId, signal: controller.signal });
  const rejected = assert.rejects(pending, error => failure('aborted')(error) && error.requestId === requestId && /may still be running/.test(error.message));
  await tick(); controller.abort(); await rejected;
  assert.equal(calls.length, 2);
  assert.ok(!calls.some(c => c.body?.operation === 'cancel'));
});

test('polling pauses while hidden, resumes the same job, and abort releases visibility wait', async () => {
  const doc = new EventTarget(); doc.visibilityState = 'hidden';
  const { client, calls } = clientWith(({ method }) => method === 'POST' ? accepted() : snapshot([job()]), { visibilityDocument: doc });
  const pending = client.requestSupport(choice(), observation(), { requestId });
  await tick(); assert.equal(calls.length, 1);
  doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal((await pending).jobId, 'job-one');
  assert.equal(calls.length, 2);
  doc.visibilityState = 'hidden';
  const controller = new AbortController();
  const again = client.requestSupport(choice(), observation(), { requestId, signal: controller.signal });
  const rejected = assert.rejects(again, failure('aborted'));
  await tick(); controller.abort(); await rejected;
  assert.equal(calls.length, 2);
});

test('cancel only addresses a job started here and wins a submission-response race', async () => {
  let finishPost;
  const { client, calls } = clientWith(({ body }) => {
    if (body?.operation === 'job') return new Promise(resolve => { finishPost = resolve; });
    if (body?.operation === 'cancel') return Response.json({ ok: true });
    return snapshot([job()]);
  });
  await assert.rejects(client.cancel('other-request-123'), failure('unknown-request'));
  const pending = client.requestSupport(choice(), observation(), { requestId });
  const rejected = assert.rejects(pending, failure('cancelled'));
  await tick();
  const cancelled = client.cancel(requestId);
  finishPost(accepted());
  assert.deepEqual(await cancelled, { cancellationRequested: true, jobId: 'job-one' });
  await rejected;
  assert.deepEqual(calls.at(-1).body, { operation: 'cancel', jobId: 'job-one' });
  assert.equal(calls.filter(c => c.method === 'GET').length, 0);
});

test('ambiguous request cancellation recovers only its matching request and reports unconfirmed absence', async () => {
  let readable = false;
  const { client, calls } = clientWith(({ method, body }) => {
    if (body?.operation === 'job') throw new TypeError('lost response');
    if (body?.operation === 'cancel') return Response.json({ ok: true });
    if (method === 'GET') return snapshot(readable ? [job()] : [job({ requestId: 'not-ours-1234567890' })]);
  });
  await assert.rejects(client.requestSupport(choice(), observation(), { requestId }), failure('network-error'));
  await assert.rejects(client.cancel(requestId), failure('cancellation-unconfirmed'));
  assert.ok(!calls.some(c => c.body?.operation === 'cancel'));
  readable = true;
  assert.deepEqual(await client.cancel(requestId), { cancellationRequested: true, jobId: 'job-one' });
});

test('bounded polling times out with identity preserved and no automatic inference retry', async () => {
  const { client, calls } = clientWith(({ method }) => method === 'POST' ? accepted() : snapshot([job({ status: 'running' })]), { timeoutMs: 5, pollMs: 10 });
  await assert.rejects(client.requestSupport(choice(), observation(), { requestId }), error => failure('support-request-timeout')(error) && error.jobId === 'job-one');
  assert.equal(calls.filter(c => c.method === 'POST').length, 1);
});
