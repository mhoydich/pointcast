import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountCoGames } from '../src/lib/co-games-ui.ts';
import { CoGamesRuntimeClient } from '../src/lib/co-games-runtime.ts';

const page = readFileSync(new URL('../src/pages/co-games.astro', import.meta.url), 'utf8');
const markup = page.match(/<article class="co-games-page">[\s\S]*?<\/article>/)[0];
const tick = () => new Promise(resolve => setImmediate(resolve));
const future = () => new Date(Date.now() + 600000).toISOString();
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const runtime = () => ({
  id: 'runtime-one', label: 'My computer', status: 'online', expiresAt: future(), lastSeenAt: new Date().toISOString(),
  providers: [{ provider: 'codex', available: true, authenticated: true, authMode: 'subscription', models: [{ id: 'native-model', label: 'Native model' }] }],
});
const snapshot = (jobs = [], runtimes = [runtime()]) => Response.json({ ok: true, runtimes, jobs });
const accepted = () => Response.json({ ok: true, jobId: 'job-one' }, { status: 201 });
const observationOf = body => JSON.parse(body.prompt.split('\nObservation:\n')[1]);
function answer(observation, overrides = {}) {
  return { gameId: observation.gameId, revision: observation.revision, selectedHuman: observation.selectedHuman,
    support: 'ward', reason: 'Save our health for the larger attacks.', ...overrides };
}
function job(body, overrides = {}) {
  return { id: 'job-one', requestId: body.requestId, runtimeId: 'runtime-one', provider: 'codex', kind: 'prompt',
    status: 'succeeded', expiresAt: future(), result: { text: JSON.stringify(answer(observationOf(body))), actualModels: ['native-model'] }, ...overrides };
}

function fixture(t, respond = () => { throw new Error('Practice must not contact the runtime.'); }) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/co-games', pretendToBeVisual: true });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, '/api/me/ai-runtimes');
    assert.equal(init.credentials, 'include');
    assert.equal(init.cache, 'no-store');
    const call = { method: init.method, body: init.body ? JSON.parse(init.body) : null, signal: init.signal };
    calls.push(call);
    return respond(call);
  });
  const root = dom.window.document.getElementById('pointcast-co-games');
  const unmount = mountCoGames(root);
  let mounted = true;
  const cleanup = () => { if (mounted) { mounted = false; unmount(); } };
  t.after(async () => { cleanup(); await tick(); dom.window.close(); });
  const q = selector => root.querySelector(selector);
  const setMode = value => {
    q('[data-mode]').value = value;
    q('[data-mode]').dispatchEvent(new dom.window.Event('change'));
  };
  return { dom, root, q, calls, cleanup, setMode };
}

function winPractice(f) {
  for (const card of ['ember', 'root', 'ember', 'ember']) {
    f.q(`[data-card="${card}"]`).click();
    f.q('[data-cast]').click();
  }
}

test('practice is explicitly simulated, wins through real moves, and replay resets the board', { timeout: 3000 }, t => {
  const f = fixture(t);
  assert.equal(f.root.dataset.mode, 'practice');
  assert.match(f.q('[data-mode] option:checked').textContent, /simulated/);
  assert.match(f.q('[data-team-name]').textContent, /Practice partner/);
  assert.equal(f.q('[data-native-controls]').hidden, true);
  winPractice(f);
  assert.equal(f.root.dataset.status, 'won');
  assert.equal(f.q('[data-health]').textContent, '1 / 14');
  assert.equal(f.q('[data-enemy]').textContent, '0');
  assert.equal(f.q('[data-count]').textContent, '4');
  assert.match(f.q('[data-log-items]').textContent, /Practice partner/);
  assert.equal(f.dom.window.document.activeElement, f.q('[data-replay]'));
  f.q('[data-replay]').click();
  assert.equal(f.root.dataset.status, 'playing');
  assert.equal(f.q('[data-round]').textContent, 'ROUND 1 / 4');
  assert.equal(f.q('[data-health]').textContent, '14 / 14');
  assert.equal(f.q('[data-enemy]').textContent, '18');
  assert.equal(f.q('[data-uses="ember"]').textContent, '3 casts left');
  assert.equal(f.q('[data-log]').hidden, true);
  assert.equal(f.dom.window.document.activeElement, f.q('[data-card="ember"]'));
  assert.equal(f.calls.length, 0);
});

test('native support requires an explicit request and a separate cast, with actual model attribution', { timeout: 3000 }, async t => {
  let submitted;
  const f = fixture(t, ({ method, body }) => {
    if (method === 'POST') { submitted = body; return accepted(); }
    return snapshot(submitted ? [job(submitted)] : []);
  });
  f.setMode('native'); await tick();
  assert.equal(f.root.dataset.mode, 'native');
  assert.equal(f.q('[data-another]').hidden, true);
  assert.equal(f.q('[data-cast]').disabled, true);
  assert.equal(f.calls.filter(call => call.method === 'POST').length, 0);
  const preview = f.q('[data-prompt-preview]').textContent;
  f.q('[data-request]').click();
  assert.equal(f.q('[data-card="ember"]').disabled, true);
  assert.equal(f.q('[data-cast]').disabled, true);
  await tick();
  assert.equal(submitted.prompt, preview);
  assert.equal(submitted.kind, 'prompt');
  assert.equal(submitted.provider, 'codex');
  assert.equal(f.q('[data-round]').textContent, 'ROUND 1 / 4');
  assert.equal(f.q('[data-health]').textContent, '14 / 14');
  assert.equal(f.q('[data-enemy]').textContent, '18');
  assert.equal(f.q('[data-cast]').disabled, false);
  assert.match(f.q('[data-partner]').textContent, /Ward:.*native-model/);
  assert.match(f.q('[data-team-name]').textContent, /ChatGPT · Codex/);
  assert.equal(f.q('[data-request]').hidden, true);
  f.q('[data-cast]').click();
  assert.equal(f.q('[data-round]').textContent, 'ROUND 2 / 4');
  assert.equal(f.q('[data-health]').textContent, '13 / 14');
  assert.equal(f.q('[data-enemy]').textContent, '14');
  assert.match(f.q('[data-log-items]').textContent, /ChatGPT · Codex \(native-model\): Ward/);
  assert.equal(f.q('[data-cast]').disabled, true, 'the next round must obtain its own support');
  assert.equal(f.calls.filter(call => call.method === 'POST').length, 1);
});

for (const invalid of ['model proof', 'support response']) {
  test(`invalid native ${invalid} never falls back to practice and allows a fresh explicit attempt`, { timeout: 3000 }, async t => {
    let submitted;
    const f = fixture(t, ({ method, body }) => {
      if (method === 'POST') { submitted = body; return accepted(); }
      if (!submitted) return snapshot();
      const result = { text: JSON.stringify(answer(observationOf(submitted), invalid === 'support response' ? { support: 'invented' } : {})),
        actualModels: invalid === 'model proof' ? [] : ['native-model'] };
      return snapshot([job(submitted, { result })]);
    });
    f.setMode('native'); await tick();
    f.q('[data-request]').click(); await tick();
    assert.equal(f.root.dataset.mode, 'native');
    assert.equal(f.q('[data-cast]').disabled, true);
    assert.equal(f.q('[data-forecast]').hidden, true);
    assert.equal(f.q('[data-health]').textContent, '14 / 14');
    assert.equal(f.q('[data-enemy]').textContent, '18');
    assert.match(f.q('[data-runtime-status]').textContent, /No move was played/);
    assert.equal(f.q('[data-request]').textContent, 'Ask my AI for support');
    assert.equal(f.q('[data-request]').disabled, false);
    const firstId = submitted.requestId;
    f.q('[data-request]').click(); await tick();
    assert.notEqual(submitted.requestId, firstId, 'a terminal result cannot be repaired by polling the same job');
    assert.equal(f.q('[data-cast]').disabled, true);
  });
}

test('logout invalidates an in-flight reply even when the provider resolves after abort', { timeout: 3000 }, async t => {
  const late = deferred();
  let request;
  t.mock.method(CoGamesRuntimeClient.prototype, 'requestSupport', async (choice, observation, options) => {
    request = { observation, options }; return late.promise;
  });
  const f = fixture(t, () => snapshot());
  f.setMode('native'); await tick();
  f.q('[data-request]').click();
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  assert.equal(request.options.signal.aborted, true);
  late.resolve({ response: answer(request.observation), actualModels: ['native-model'], jobId: 'job-one', requestId: request.options.requestId });
  await tick();
  assert.equal(f.q('[data-cast]').disabled, true);
  assert.equal(f.q('[data-forecast]').hidden, true);
  assert.equal(f.q('[data-runtime]').options.length, 0);
  assert.match(f.q('[data-runtime-status]').textContent, /sign-in changed/);
  assert.doesNotMatch(f.q('[data-partner]').textContent, /native-model/);
  assert.equal(f.q('[data-health]').textContent, '14 / 14');
});

test('replay aborts stale discovery and completes a new connection check', { timeout: 3000 }, async t => {
  const oldDiscovery = deferred();
  let reads = 0;
  const f = fixture(t, () => ++reads === 1 ? oldDiscovery.promise : snapshot());
  winPractice(f);
  f.setMode('native');
  assert.equal(f.q('[data-refresh]').disabled, true);
  f.q('[data-replay]').click();
  assert.equal(f.calls[0].signal.aborted, true);
  await tick();
  assert.equal(reads, 2);
  assert.equal(f.q('[data-refresh]').disabled, false);
  assert.equal(f.q('[data-request]').disabled, false);
  assert.equal(f.q('[data-runtime]').options.length, 1);
  oldDiscovery.resolve(snapshot([], [])); await tick();
  assert.equal(f.q('[data-runtime]').options.length, 1, 'the old empty discovery cannot overwrite the new ready runtime');
  assert.equal(f.q('[data-round]').textContent, 'ROUND 1 / 4');
  assert.equal(f.q('[data-health]').textContent, '14 / 14');
  assert.doesNotMatch(f.q('[data-runtime-status]').textContent, /Checking/);
});

for (const availability of ['busy', 'offline']) {
  test(`ambiguous submission retries the same ID after the runtime becomes ${availability}`, { timeout: 3000 }, async t => {
    let submitted, posts = 0;
    const f = fixture(t, ({ method, body }) => {
      if (method === 'POST') {
        submitted = body;
        if (++posts === 1) throw new TypeError('The server accepted the job but the response was lost.');
        return accepted();
      }
      if (!submitted) return snapshot();
      if (posts === 1) return snapshot([job(submitted, { status: 'running' })], availability === 'offline' ? [] : [runtime()]);
      return snapshot([job(submitted)]);
    });
    f.setMode('native'); await tick();
    f.q('[data-request]').click(); await tick();
    assert.equal(f.q('[data-request]').textContent, 'Retry the same support request');
    f.q('[data-refresh]').click(); await tick();
    assert.equal(f.q('[data-runtime]').options.length, 1);
    if (availability === 'busy') assert.match(f.q('[data-runtime] option').textContent, /busy/);
    assert.equal(f.q('[data-request]').disabled, false, 'recovering existing work is allowed without starting another task');
    f.q('[data-request]').click(); await tick();
    const submissions = f.calls.filter(call => call.body?.operation === 'job');
    assert.equal(submissions.length, 2);
    assert.deepEqual(submissions[0].body, submissions[1].body);
    assert.equal(f.q('[data-cast]').disabled, false);
    assert.equal(f.q('[data-health]').textContent, '14 / 14');
    assert.match(f.q('[data-runtime-status]').textContent, /Support received from native-model/);
  });
}

test('unmount attempts cancellation of an uncertain submitted job even after waiting stopped', { timeout: 3000 }, async t => {
  let submitted;
  const f = fixture(t, ({ method, body }) => {
    if (method === 'POST' && body.operation === 'job') {
      submitted = body; throw new TypeError('Submission response was lost.');
    }
    if (method === 'POST' && body.operation === 'cancel') return Response.json({ ok: true });
    return snapshot(submitted ? [job(submitted, { status: 'running' })] : []);
  });
  f.setMode('native'); await tick();
  f.q('[data-request]').click(); await tick();
  assert.equal(f.q('[data-request]').textContent, 'Retry the same support request');
  assert.equal(f.q('[data-cancel]').hidden, true, 'the UI is no longer actively waiting');
  f.cleanup(); await tick();
  const cancellations = f.calls.filter(call => call.body?.operation === 'cancel');
  assert.equal(cancellations.length, 1);
  assert.equal(cancellations[0].body.jobId, 'job-one');
  const requests = f.calls.length;
  f.q('[data-request]').click(); await tick();
  assert.equal(f.calls.length, requests, 'unmount removes all UI listeners');
});
