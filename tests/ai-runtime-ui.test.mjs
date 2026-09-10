import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { transform } from 'esbuild';
import { buildRuntimePrompt, buildRuntimeView, mountAiRuntime, nativeLoginUrl, readRuntimeResponse } from '../src/lib/auth/ai-runtime-ui.ts';

const component = readFileSync(new URL('../src/components/AiRuntime.astro', import.meta.url), 'utf8').split('<script>')[0].replace(/^---[\s\S]*?---/, '');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const now = () => new Date().toISOString();
const future = () => new Date(Date.now() + 600000).toISOString();
function runtime(overrides = {}) {
  return { id: 'runtime-a', label: 'My computer', status: 'online', expiresAt: future(), lastSeenAt: now(), lastSuccessAt: null,
    providers: [{ provider: 'codex', available: true, authenticated: false, authMode: 'unknown', modelDiscovery: 'native', models: [{ id: 'native-model', label: 'Native model' }] }], ...overrides };
}
function ready(overrides = {}) {
  const r = runtime(); r.providers[0].authenticated = true; r.providers[0].authMode = 'subscription'; return { ...r, ...overrides };
}
function job(overrides = {}) {
  return { id: 'job-a', runtimeId: 'runtime-a', kind: 'prompt', provider: 'codex', model: 'native-model', status: 'queued', createdAt: now(), expiresAt: future(), ...overrides };
}
function fixture(t, respond, options = {}) {
  const dom = new JSDOM(component, { url: 'https://pointcast.test/me', pretendToBeVisual: true });
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, '/api/me/ai-runtimes');
    assert.equal(init.credentials, 'include');
    return respond(init);
  });
  const root = dom.window.document.querySelector('[data-ai-runtime]');
  const cleanup = mountAiRuntime(root, { pollMs: 100000, ...options });
  t.after(() => { cleanup(); dom.window.close(); });
  return { dom, root, q: (selector) => root.querySelector(selector), cleanup };
}

 test('runtime state separates pairing, online companion, native sign-in, and a model-backed task', () => {
  assert.equal(buildRuntimeView(null, 'codex', []).state, 'unpaired');
  assert.equal(buildRuntimeView(runtime({ status: 'waiting', lastSeenAt: null }), 'codex', []).state, 'waiting');
  assert.equal(buildRuntimeView(runtime(), 'codex', []).state, 'online');
  assert.equal(buildRuntimeView(ready(), 'codex', []).badge, 'Ready to try');
  const successful = job({ status: 'succeeded', result: { text: 'A real answer', actualModels: ['native-model'] } });
  const verified = ready({ lastSuccessAt: now() });
  assert.equal(buildRuntimeView(verified, 'codex', [successful]).badge, 'Connected · task verified');
  assert.equal(buildRuntimeView(verified, 'codex', [{ ...successful, kind: 'login' }]).verified, false);
  assert.equal(buildRuntimeView(verified, 'codex', [{ ...successful, result: { text: 'No model proof' } }]).verified, false);
  assert.equal(buildRuntimeView(verified, 'claude', [successful]).verified, false);
  assert.equal(buildRuntimeView({ ...verified, lastSeenAt: new Date(Date.now() - 46000).toISOString() }, 'codex', [successful]).state, 'offline');
  const api = ready(); api.providers[0].authMode = 'api';
  assert.equal(buildRuntimeView(api, 'codex', []).subscriptionReady, false);
});

test('first-task context is a visible text packet and native sign-in links stay on provider hosts', () => {
  const preview = buildRuntimePrompt('  A quiet evening  ', 'elemental-shrine', '  I have ten minutes. ');
  assert.match(preview, /^A quiet evening\n\nSelected PointCast context \(provided text only\):/);
  assert.match(preview, /https:\/\/pointcast.xyz\/elemental-shrine/);
  assert.match(preview, /My note for this task:\nI have ten minutes\./);
  assert.equal(buildRuntimePrompt('hello', 'https://unselected.example', ''), 'hello');
  assert.equal(nativeLoginUrl('javascript:alert(1)', 'codex'), null);
  assert.equal(nativeLoginUrl('https://attacker.example/login', 'codex'), null);
  assert.equal(nativeLoginUrl('https://claude.ai/login', 'codex'), null);
  assert.equal(nativeLoginUrl('https://auth.openai.com/codex/device', 'codex'), 'https://auth.openai.com/codex/device');
});

test('pairing separates a flag-prefixed private code from the copied stdin command', async (t) => {
  let paired = false;
  const privateCode = '--' + 'A'.repeat(41);
  const calls = [];
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { calls.push(JSON.parse(init.body)); paired = true; return Response.json({ ok: true, runtimeId: 'runtime-a', code: privateCode, expiresAt: future() }, { status: 201 }); }
    return Response.json({ ok: true, runtimes: paired ? [runtime({ status: 'waiting', lastSeenAt: null, providers: [] })] : [], jobs: [] });
  });
  await tick();
  f.q('[data-runtime-pair-form]').dispatchEvent(new f.dom.window.Event('submit', { cancelable: true }));
  await tick(); await tick();
  assert.deepEqual(calls, [{ operation: 'invite', label: 'My computer' }]);
  assert.equal(f.q('[data-runtime-command]').value, 'node scripts/ai-companion/runner.mjs --pair-stdin --origin https://pointcast.test');
  assert.equal(f.q('[data-runtime-code]').value, privateCode);
  assert.ok(!f.q('[data-runtime-command]').value.includes(privateCode));
  const copied = [];
  Object.defineProperty(f.dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => copied.push(value) } });
  f.q('[data-runtime-copy]').click(); await tick();
  f.q('[data-runtime-copy-code]').click(); await tick();
  assert.deepEqual(copied, [f.q('[data-runtime-command]').value, privateCode]);
  assert.equal(f.q('[data-runtime-pair-code]').hidden, false);
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Waiting for companion');
  assert.equal(f.q('[data-runtime-run]').disabled, true);
});

test('native login completion alone does not verify a task or authorize API-billed prompts', async (t) => {
  const r = runtime(); r.providers[0].authenticated = true; r.providers[0].authMode = 'api';
  const f = fixture(t, () => Response.json({ ok: true, runtimes: [r], jobs: [job({ kind: 'login', status: 'succeeded' })] }));
  await tick();
  assert.equal(f.q('[data-runtime-run]').disabled, true);
  assert.equal(f.q('[data-runtime-login]').disabled, false);
  assert.equal(f.q('[data-runtime-login]').hidden, false);
  assert.match(f.q('[data-runtime-provider-status]').textContent, /subscription sign-in/);
  assert.notEqual(f.q('[data-runtime-badge]').textContent, 'Connected · task verified');
});

test('first task submits the exact preview and only a succeeded task with actual model changes Connected state', async (t) => {
  let stage = 'ready';
  let submitted;
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { submitted = JSON.parse(init.body); stage = 'queued'; return Response.json({ ok: true, jobId: 'job-a' }, { status: 201 }); }
    const jobs = stage === 'ready' ? [] : [job(stage === 'succeeded' ? { status: 'succeeded', result: { text: 'Try Elemental Shrine for a quiet pause.', actualModels: ['native-model'] } } : {})];
    return Response.json({ ok: true, runtimes: [ready(stage === 'succeeded' ? { lastSuccessAt: now() } : {})], jobs });
  });
  await tick();
  f.q('[data-runtime-context]').value = 'elemental-shrine';
  f.q('[data-runtime-note]').value = 'I have ten minutes.';
  f.q('[data-runtime-gentle]').checked = true;
  f.q('[data-runtime-model]').value = 'native-model';
  f.q('[data-runtime-task-form]').dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  const preview = f.q('[data-runtime-preview]').textContent;
  f.q('[data-runtime-task-form]').dispatchEvent(new f.dom.window.Event('submit', { cancelable: true }));
  await tick(); await tick();
  assert.equal(submitted.prompt, preview);
  assert.equal(submitted.gentle, true);
  assert.equal(submitted.model, 'native-model');
  assert.equal(submitted.kind, 'prompt');
  assert.match(submitted.requestId, /^[0-9a-f]{8}-[0-9a-f-]{27}$/);
  assert.equal(f.q('[data-runtime-result]').hidden, true);
  assert.notEqual(f.q('[data-runtime-badge]').textContent, 'Connected · task verified');
  assert.equal(f.q('[data-runtime-run]').disabled, true);
  stage = 'succeeded'; f.q('[data-runtime-refresh]').click(); await tick();
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Connected · task verified');
  assert.match(f.q('[data-runtime-result-text]').textContent, /Elemental Shrine/);
  assert.match(f.q('[data-runtime-result-model]').textContent, /actual model: native-model/);
  assert.doesNotMatch(f.q('[data-runtime-status]').textContent, /Waiting/);
});

test('combined prompt and note limit is enforced before a request', async (t) => {
  let writes = 0;
  const f = fixture(t, (init) => { if (init.method !== 'GET') writes += 1; return Response.json({ ok: true, runtimes: [ready()], jobs: [] }); });
  await tick();
  f.q('[data-runtime-prompt]').value = 'x'.repeat(3990);
  f.q('[data-runtime-note]').value = 'Additional private note';
  f.q('[data-runtime-task-form]').dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  assert.equal(f.q('[data-runtime-run]').disabled, true);
  f.q('[data-runtime-task-form]').dispatchEvent(new f.dom.window.Event('submit', { cancelable: true }));
  await tick();
  assert.equal(writes, 0);
});

test('auth change scrubs private pair code, note, and result and rejects a late prior-session response', async (t) => {
  let resolveLate;
  let reads = 0;
  const f = fixture(t, () => ++reads === 1
    ? Response.json({ ok: true, runtimes: [ready({ lastSuccessAt: now() })], jobs: [job({ status: 'succeeded', result: { text: 'Private earlier result', actualModels: ['native-model'] } })] })
    : new Promise((resolve) => { resolveLate = resolve; }));
  await tick();
  f.q('[data-runtime-note]').value = 'Private draft';
  f.q('[data-runtime-refresh]').click(); await tick();
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  assert.equal(f.q('[data-runtime-note]').value, '');
  assert.equal(f.q('[data-runtime-result-text]').textContent, '');
  assert.equal(f.q('[data-runtime-command]').value, '');
  assert.equal(f.q('[data-runtime-code]').value, '');
  resolveLate(Response.json({ ok: true, runtimes: [ready()], jobs: [job({ status: 'succeeded', result: { text: 'Late private result', actualModels: ['native-model'] } })] }));
  await tick();
  assert.equal(f.q('[data-runtime-result-text]').textContent, '');
  assert.equal(f.q('[data-runtime-invite]').disabled, true);
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Sign-in required');
});

test('cancelled native login immediately removes its URL and ignores late completion', async (t) => {
  let cancelled = false;
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { assert.equal(JSON.parse(init.body).operation, 'cancel'); cancelled = true; return Response.json({ ok: true }); }
    return Response.json({ ok: true, runtimes: [runtime()], jobs: [job({ kind: 'login', status: cancelled ? 'succeeded' : 'running', login: { verificationUrl: 'https://auth.openai.com/codex/device', userCode: 'ABCD-1234' } })] });
  });
  await tick();
  assert.equal(f.q('[data-runtime-login-panel]').hidden, false);
  f.q('[data-runtime-cancel]').click();
  assert.equal(f.q('[data-runtime-login-link]').hasAttribute('href'), false);
  await tick(); await tick();
  assert.equal(f.q('[data-runtime-login-panel]').hidden, true);
  assert.equal(f.q('[data-runtime-result]').hidden, true);
  assert.notEqual(f.q('[data-runtime-badge]').textContent, 'Connected · task verified');
});

test('disconnect scrubs an in-flight result and cannot be undone by an older status read', async (t) => {
  let removed = false;
  let reads = 0;
  let resolveOld;
  const f = fixture(t, (init) => {
    if (init.method === 'DELETE') { removed = true; return Response.json({ ok: true }); }
    if (++reads === 2) return new Promise((resolve) => { resolveOld = resolve; });
    return Response.json({ ok: true, runtimes: removed ? [] : [ready()], jobs: [] });
  });
  await tick(); f.q('[data-runtime-refresh]').click(); await tick();
  f.q('[data-runtime-disconnect]').click(); await tick(); await tick();
  resolveOld(Response.json({ ok: true, runtimes: [ready({ lastSuccessAt: now() })], jobs: [job({ status: 'succeeded', result: { text: 'Late response', actualModels: ['native-model'] } })] }));
  await tick();
  assert.equal(f.q('[data-runtime-connection]').hidden, true);
  assert.equal(f.q('[data-runtime-result-text]').textContent, '');
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Not paired');
});

test('polling pauses when hidden and stays stopped after sign-out', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let reads = 0;
  const f = fixture(t, () => { reads += 1; return Response.json({ ok: true, runtimes: [], jobs: [] }); }, { pollMs: 12 });
  let visibility = 'visible';
  Object.defineProperty(f.dom.window.document, 'visibilityState', { configurable: true, get: () => visibility });
  // Let the initial fetch/JSON/render promises finish before advancing the
  // timer they schedule. Host load must not decide whether the poll runs.
  await tick();
  assert.equal(reads, 1);
  t.mock.timers.tick(11); await tick();
  assert.equal(reads, 1);
  t.mock.timers.tick(1); await tick();
  assert.equal(reads, 2);
  visibility = 'hidden'; f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await tick();
  t.mock.timers.tick(120); await tick();
  assert.equal(reads, 2);
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  visibility = 'visible'; f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange')); await tick();
  t.mock.timers.tick(120); await tick();
  assert.equal(reads, 2);
});

test('HTML service failures have a human error and retain status without enabling controls', async (t) => {
  await assert.rejects(readRuntimeResponse(new Response('<html>proxy error</html>', { status: 503 })), (error) => {
    assert.equal(error.status, 503); assert.equal(error.reason, 'invalid-response'); assert.doesNotMatch(error.message, /SyntaxError|<html>/); return true;
  });
  const f = fixture(t, () => new Response('<html>proxy error</html>', { status: 503 }));
  await tick();
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Status unavailable');
  assert.equal(f.q('[data-runtime-invite]').disabled, true);
  assert.match(f.q('[data-runtime-status]').textContent, /unavailable/);
});


test('a lost submission response retries the same request and a later explicit task gets a new identifier', async (t) => {
  const writes = [];
  let finished = false;
  const f = fixture(t, (init) => {
    if (init.method === 'POST') {
      writes.push(JSON.parse(init.body));
      if (writes.length === 1) throw new TypeError('response lost after server acceptance');
      finished = true;
      return Response.json({ ok: true, jobId: 'job-a' }, { status: 201 });
    }
    return Response.json({ ok: true, runtimes: [ready()], jobs: finished ? [job({ requestId: writes[0].requestId, status: 'succeeded', result: { text: 'Your quiet first task.', actualModels: ['native-model'] } })] : [] });
  });
  await tick();
  f.q('[data-runtime-run]').click(); await tick();
  assert.equal(writes.length, 1);
  assert.equal(f.q('[data-runtime-run]').textContent, 'Retry same task');
  assert.equal(f.q('[data-runtime-run]').disabled, false);
  f.q('[data-runtime-run]').click(); await tick(); await tick();
  assert.deepEqual(writes[1], writes[0]);
  assert.match(f.q('[data-runtime-result-text]').textContent, /quiet first task/);
  f.q('[data-runtime-run]').click(); await tick(); await tick();
  assert.notEqual(writes[2].requestId, writes[0].requestId);
});

test('changing the preview ends a failed request retry, including a change later reverted', async (t) => {
  const writes = [];
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { writes.push(JSON.parse(init.body)); throw new TypeError('response lost'); }
    return Response.json({ ok: true, runtimes: [ready()], jobs: [] });
  });
  await tick(); f.q('[data-runtime-run]').click(); await tick();
  const previous = f.q('[data-runtime-prompt]').value;
  f.q('[data-runtime-prompt]').value = 'A different task';
  f.q('[data-runtime-prompt]').dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  assert.notEqual(f.q('[data-runtime-run]').textContent, 'Retry same task');
  f.q('[data-runtime-prompt]').value = previous;
  f.q('[data-runtime-prompt]').dispatchEvent(new f.dom.window.Event('input', { bubbles: true }));
  f.q('[data-runtime-run]').click(); await tick();
  assert.equal(writes[1].prompt, writes[0].prompt);
  assert.notEqual(writes[1].requestId, writes[0].requestId);
});

test('status polling reconciles an uncertain submission by its exact request identifier', async (t) => {
  let submission;
  let reveal = false;
  let writes = 0;
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { writes += 1; submission = JSON.parse(init.body); throw new TypeError('response lost'); }
    return Response.json({ ok: true, runtimes: [ready()], jobs: reveal ? [job({ requestId: submission.requestId, status: 'running' })] : [] });
  });
  await tick(); f.q('[data-runtime-run]').click(); await tick();
  reveal = true; f.q('[data-runtime-refresh]').click(); await tick();
  assert.equal(f.q('[data-runtime-run]').disabled, true);
  assert.notEqual(f.q('[data-runtime-run]').textContent, 'Retry same task');
  assert.match(f.q('[data-runtime-status]').textContent, /previous request was received/);
  assert.equal(writes, 1);
});

test('native sign-in uses a stable retry identifier which is cleared on account change', async (t) => {
  const writes = [];
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { writes.push(JSON.parse(init.body)); throw new TypeError('response lost'); }
    return Response.json({ ok: true, runtimes: [runtime()], jobs: [] });
  });
  await tick(); f.q('[data-runtime-login]').click(); await tick();
  assert.equal(f.q('[data-runtime-login]').textContent, 'Retry same sign-in request');
  f.q('[data-runtime-login]').click(); await tick();
  assert.deepEqual(writes[1], writes[0]);
  assert.equal(writes[0].kind, 'login');
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: { id: 'different-profile' } } }));
  await tick(); f.q('[data-runtime-login]').click(); await tick();
  assert.notEqual(writes[2].requestId, writes[0].requestId);
});


test('cancelling the latest task keeps its status and labels an older result as previous', async (t) => {
  let cancelled = false;
  const previous = job({ id: 'previous-job', status: 'succeeded', result: { text: 'An earlier completed response.', actualModels: ['native-model'] } });
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { assert.deepEqual(JSON.parse(init.body), { operation: 'cancel', jobId: 'job-a' }); cancelled = true; return Response.json({ ok: true }); }
    return Response.json({ ok: true, runtimes: [ready({ lastSuccessAt: now() })], jobs: [job({ status: cancelled ? 'cancelled' : 'queued' }), previous] });
  });
  await tick();
  f.q('[data-runtime-cancel]').click();
  assert.match(f.q('[data-runtime-job-status]').textContent, /Cancellation requested/);
  assert.notEqual(f.q('[data-runtime-job-status]').textContent, 'Task completed.');
  await tick(); await tick();
  assert.equal(f.q('[data-runtime-job-status]').textContent, 'Task cancelled.');
  assert.equal(f.q('[data-runtime-status]').textContent, 'Task cancelled.');
  assert.equal(f.q('[data-runtime-result-title]').textContent, 'Previous AI response');
  assert.equal(f.q('[data-runtime-result-text]').textContent, 'An earlier completed response.');
  assert.equal(f.q('[data-runtime-cancel]').hidden, true);
  assert.equal(f.q('[data-runtime-run]').disabled, false);
});


test('separate private pairing code expires and is scrubbed on sign-out', async (t) => {
  let clock = Date.now();
  t.mock.method(Date, 'now', () => clock);
  let paired = false;
  let expiry;
  const f = fixture(t, (init) => {
    if (init.method === 'POST') { paired = true; expiry = future(); return Response.json({ ok: true, runtimeId: 'runtime-a', code: 'C'.repeat(43), expiresAt: expiry }, { status: 201 }); }
    return Response.json({ ok: true, runtimes: paired ? [runtime({ status: 'waiting', lastSeenAt: null, expiresAt: expiry, providers: [] })] : [], jobs: [] });
  });
  const copied = [];
  Object.defineProperty(f.dom.window.navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => copied.push(value) } });
  await tick();
  f.q('[data-runtime-invite]').click(); await tick(); await tick();
  assert.equal(f.q('[data-runtime-code]').value, 'C'.repeat(43));
  clock += 600001;
  f.q('[data-runtime-copy-code]').click(); await tick();
  assert.deepEqual(copied, []);
  f.q('[data-runtime-refresh]').click(); await tick();
  assert.equal(f.q('[data-runtime-code]').value, '');
  assert.equal(f.q('[data-runtime-command]').value, '');
  assert.equal(f.q('[data-runtime-pair-code]').hidden, true);
  f.q('[data-runtime-invite]').click(); await tick(); await tick();
  assert.equal(f.q('[data-runtime-code]').value, 'C'.repeat(43));
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  assert.equal(f.q('[data-runtime-code]').value, '');
  assert.equal(f.q('[data-runtime-command]').value, '');
});

test('Astro initial page-load keeps one mount and a page swap mounts the replacement once', async (t) => {
  const source = readFileSync(new URL('../src/components/AiRuntime.astro', import.meta.url), 'utf8');
  const script = source.split('<script>')[1].split('</script>')[0].replace(/import \{ mountAiRuntime \} from [^;]+;/, '');
  const { code } = await transform(script, { loader: 'ts' });
  const dom = new JSDOM(component, { url: 'https://pointcast.test/me', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  let mounted = 0; let cleaned = 0;
  const mount = () => { mounted += 1; return () => { cleaned += 1; }; };
  new Function('window', 'document', 'mountAiRuntime', code)(dom.window, dom.window.document, mount);
  assert.equal(mounted, 1);
  dom.window.document.dispatchEvent(new dom.window.Event('astro:page-load'));
  assert.equal(mounted, 1);
  assert.equal(cleaned, 0);
  dom.window.document.dispatchEvent(new dom.window.Event('astro:before-swap'));
  assert.equal(cleaned, 1);
  dom.window.document.body.innerHTML = component;
  dom.window.document.dispatchEvent(new dom.window.Event('astro:page-load'));
  dom.window.document.dispatchEvent(new dom.window.Event('astro:page-load'));
  assert.equal(mounted, 2);
  dom.window.document.dispatchEvent(new dom.window.Event('astro:before-swap'));
  assert.equal(cleaned, 2);
});

test('Claude terminal fallback gives exact local recovery steps and Check status requires fresh native proof', async (t) => {
  let signedIn = false, writes = 0, reads = 0;
  const f = fixture(t, (init) => {
    if (init.method === 'POST') writes++;
    else reads++;
    const r = runtime({ providers: [{ provider: 'claude', available: true, authenticated: signedIn,
      authMode: signedIn ? 'subscription' : 'unknown', models: [], modelDiscovery: 'unavailable' }] });
    return Response.json({ ok: true, runtimes: [r], jobs: [job({ kind: 'login', provider: 'claude', status: 'failed',
      error: 'claude-login-native-terminal-required', login: { verificationUrl: 'https://claude.ai/oauth?state=OLD' } })] });
  });
  await tick();
  f.q('[data-runtime-provider]').value = 'claude';
  f.q('[data-runtime-provider]').dispatchEvent(new f.dom.window.Event('change', { bubbles: true }));
  const guidance = f.q('[data-runtime-job-status]').textContent;
  assert.match(guidance, /claude auth login --claudeai/);
  assert.match(guidance, /terminal on the paired computer/);
  assert.match(guidance, /finish sign-in there, then choose Check status/);
  assert.equal(f.q('[data-runtime-login-panel]').hidden, true);
  assert.equal(f.q('[data-runtime-login-link]').hasAttribute('href'), false);
  assert.equal(f.q('[data-runtime-run]').disabled, true);
  assert.equal(f.q('[data-runtime-refresh]').disabled, false);
  assert.notEqual(f.q('[data-runtime-badge]').textContent, 'Connected · task verified');
  signedIn = true;
  f.q('[data-runtime-refresh]').click(); await tick();
  assert.equal(reads, 2); assert.equal(writes, 0);
  assert.equal(f.q('[data-runtime-run]').disabled, false);
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Ready to try');
});


test('repeated same-owner wallet bridge notifications do not starve the initial runtime read', async t => {
  const reads = [];
  const f = fixture(t, init => new Promise(resolve => reads.push({ resolve, signal: init.signal })));
  const notify = () => f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', {
    detail: { user: { id: 'owner-a' }, source: 'tezos-session-bridge' },
  }));
  notify();
  const currentRead = reads.at(-1);
  for (let i = 0; i < 12; i += 1) { notify(); await tick(); }
  assert.equal(currentRead.signal.aborted, false);
  assert.equal(reads.length, 2);
  currentRead.resolve(Response.json({ ok: true, runtimes: [ready()], jobs: [] }));
  await tick(); await tick();
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Ready to try');
  assert.equal(f.q('[data-runtime-invite]').disabled, false);
  f.q('[data-runtime-note]').value = 'Keep my current note';
  notify();
  assert.equal(f.q('[data-runtime-note]').value, 'Keep my current note');
  assert.equal(reads.length, 2);
});

test('runtime bridge dedup still resets changed owners, explicit refresh, and sign-out', async t => {
  const reads = [];
  const f = fixture(t, init => new Promise(resolve => reads.push({ resolve, signal: init.signal })));
  const notify = (id, source = 'tezos-session-bridge') => f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', {
    detail: { user: id ? { id } : null, source },
  }));
  notify('owner-a');
  const previousOwner = reads.at(-1);
  f.q('[data-runtime-note]').value = 'Owner A private note';
  notify('owner-b');
  assert.equal(previousOwner.signal.aborted, true);
  assert.equal(f.q('[data-runtime-note]').value, '');
  const ownerB = reads.at(-1);
  f.dom.window.dispatchEvent(new f.dom.window.Event('pc:auth-refresh'));
  assert.equal(ownerB.signal.aborted, true);
  const refreshed = reads.at(-1);
  notify('owner-b', 'explicit-sign-in');
  assert.equal(refreshed.signal.aborted, true);
  const latest = reads.at(-1);
  notify(null);
  assert.equal(latest.signal.aborted, true);
  for (const read of reads) read.resolve(Response.json({ ok: true, runtimes: [ready()], jobs: [] }));
  await tick(); await tick();
  assert.equal(f.q('[data-runtime-badge]').textContent, 'Sign-in required');
  assert.equal(f.q('[data-runtime-invite]').disabled, true);
});
