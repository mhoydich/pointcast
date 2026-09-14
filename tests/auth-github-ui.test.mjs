import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { buildGitHubConnectionView, githubCallbackMessage } from '../src/lib/auth/github-connection.mjs';
import { buildAccountDeskView } from '../src/lib/auth/account-desk.mjs';
import { getGitHubAuthAvailability, loginWithGitHub } from '../src/lib/auth/client.ts';

import { authReturnTo } from '../src/lib/auth/return-to.mjs';

test('universal sign-in returns to the starting room without accepting an external destination', () => {
  assert.equal(authReturnTo('?returnTo=%2Fshwa%2F'), '/shwa/');
  assert.equal(authReturnTo('?returnTo=%2Fshwa%2F%3Fx%3D1%23music'), '/shwa/?x=1#music');
  for (const path of ['https://evil.example/', '//evil.example/', '/\\evil.example/', 'javascript:alert(1)']) assert.equal(authReturnTo('?'+new URLSearchParams({returnTo:path})), '/auth');
});

const user = { userId: 'fixture', preferredName: 'Fixture member', identities: [] };

test('GitHub account views distinguish checking, unavailable, login, link, and connected', () => {
  assert.equal(buildGitHubConnectionView(undefined, true).disabled, true);
  assert.equal(buildGitHubConnectionView(null, null).state, 'checking');
  assert.equal(buildGitHubConnectionView(null, false).disabled, true);
  assert.equal(buildGitHubConnectionView(null, true).action, 'Sign in with GitHub →');
  assert.equal(buildGitHubConnectionView(user, true).action, 'Link GitHub →');
  const linked = { ...user, identities: [{ provider: 'github', id: '123', username: 'octocat', verifiedAt: new Date().toISOString() }] };
  const view = buildAccountDeskView(linked, { githubAvailable: true });
  assert.deepEqual(view.identityChips, ['GitHub']);
  assert.equal(view.signedInWith, 'GitHub');
  assert.equal(view.providers.github.disabled, true);
  assert.equal(view.providers.github.badge, 'LINKED');
  assert.equal(githubCallbackMessage('?auth=github'), 'Signed in with GitHub.');
  assert.match(githubCallbackMessage('?auth_error=github-session-changed'), /session changed/);
  assert.equal(githubCallbackMessage('?auth_error=<script>'), '');
});

test('shared client reads configuration readiness and preserves the current route and explicit intent', async (t) => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const destinations = [];
  globalThis.window = { location: {
    origin: 'https://pointcast.xyz', pathname: '/shwa/', search: '?room=mine', hash: '#music',
    assign: (value) => destinations.push(new URL(value)),
  } };
  globalThis.document = {};
  try {
    t.mock.method(globalThis, 'fetch', async (url, init) => {
      assert.equal(url, '/api/auth/github?status=1');
      assert.equal(init.cache, 'no-store');
      return Response.json({ ok: true, provider: 'github', available: true });
    });
    assert.equal(await getGitHubAuthAvailability(), true);
    await loginWithGitHub({ intent: 'login' });
    await loginWithGitHub({ intent: 'link', returnTo: '/auth' });
    assert.equal(destinations[0].pathname, '/api/auth/github');
    assert.equal(destinations[0].searchParams.get('returnTo'), '/shwa/?room=mine#music');
    assert.equal(destinations[0].searchParams.get('intent'), 'login');
    assert.equal(destinations[1].searchParams.get('intent'), 'link');
    assert.equal(destinations[1].searchParams.get('returnTo'), '/auth');
  } finally { globalThis.window = originalWindow; globalThis.document = originalDocument; }
});

test('the universal menu renders GitHub disabled until readiness and login/link state are known', async (t) => {
  const source = readFileSync(new URL('../src/components/AuthMenu.astro', import.meta.url), 'utf8');
  const button = source.match(/<button\s+data-provider="github"[\s\S]*?<\/button>/)?.[0];
  assert.ok(button);
  assert.match(button, /disabled/);
  const dom = new JSDOM(`<div data-auth-menu>${button}<p data-auth-status></p></div>`, { url: 'https://pointcast.xyz/shwa/' });
  const names = ['window', 'document', 'Element', 'HTMLElement', 'HTMLButtonElement', 'CustomEvent'];
  const originals = Object.fromEntries(names.map((name) => [name, globalThis[name]]));
  for (const name of names) globalThis[name] = dom.window[name];
  let resolveGithub;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url === '/api/auth/github?status=1') return new Promise((resolve) => { resolveGithub = resolve; });
    if (url === '/api/auth/x?status=1') return Response.json({ ok: true, provider: 'x', available: false });
    if (url === '/api/auth/session') return Response.json({ user: null });
    assert.fail(`Unexpected request: ${url}`);
  });
  const controller = new dom.window.AbortController();
  try {
    const compiled = await build({ entryPoints: [fileURLToPath(new URL('../src/scripts/chrome/auth-menu.ts', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external' });
    const module = { exports: {} };
    new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
    const { mountAuthMenus } = module.exports;
    mountAuthMenus({ signal: controller.signal, on: (target, type, listener) => target.addEventListener(type, listener, { signal: controller.signal }) });
    const rendered = document.querySelector('[data-provider="github"]');
    assert.equal(rendered.disabled, true);
    resolveGithub(Response.json({ ok: true, provider: 'github', available: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(rendered.disabled, false);
    assert.equal(document.querySelector('[data-auth-github-name]').textContent, 'GitHub');
    window.dispatchEvent(new CustomEvent('pc:auth-change', { detail: { user } }));
    assert.equal(document.querySelector('[data-auth-github-name]').textContent, 'Link GitHub');
    window.dispatchEvent(new CustomEvent('pc:auth-change', { detail: { user: { ...user, identities: [{ provider: 'github', id: '123', verifiedAt: '2026-09-14' }] } } }));
    assert.equal(rendered.disabled, true);
    assert.equal(document.querySelector('[data-auth-github-name]').textContent, 'GitHub linked');
  } finally {
    controller.abort();
    dom.window.close();
    for (const name of names) globalThis[name] = originals[name];
  }
});
