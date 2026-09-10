import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildXConnectionView, xCallbackMessage } from '../src/lib/auth/x-connection.mjs';
import { buildAccountDeskView } from '../src/lib/auth/account-desk.mjs';
import { mountProfileConnections } from '../src/scripts/profile-connections.mjs';

const xIdentity = { provider: 'x', id: '123456789', username: 'pointcast_test', verifiedAt: '2026-09-09T15:00:00Z' };
const alternate = { provider: 'google', id: 'google-123', verifiedAt: '2026-09-09T15:00:00Z' };
const linked = { userId: 'pcu_test', preferredName: 'Test member', identities: [xIdentity, alternate] };
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const component = await readFile(new URL('../src/components/ProfileConnections.astro', import.meta.url), 'utf8');
function fixture(overrides = {}) {
  const dom = new JSDOM(component.split('<script>')[0].replace(/^---[\s\S]*?---/, ''), { url: 'https://pointcast.test/me' });
  const root = dom.window.document.querySelector('[data-profile-connections]');
  const api = {
    getSession: async () => linked,
    getXAuthAvailability: async () => true,
    loginWithX: async () => null,
    disconnectX: async () => undefined,
    ...overrides,
  };
  const cleanup = mountProfileConnections(root, api);
  return { dom, root, cleanup, find: (selector) => root.querySelector(selector) };
}

test('X availability stays honest across profile and account desk states', () => {
  assert.equal(buildXConnectionView(null).state, 'checking');
  assert.equal(buildXConnectionView(undefined, true).disabled, true);
  assert.equal(buildXConnectionView(null, false).state, 'unavailable');
  assert.equal(buildXConnectionView(null, false).disabled, true);
  assert.equal(buildXConnectionView(null, true).action, 'Sign in with X →');
  assert.equal(buildXConnectionView({ identities: [alternate] }, true).action, 'Link X →');
  assert.equal(buildAccountDeskView(null).providers.x.disabled, true);
  assert.equal(buildAccountDeskView(null, { xAvailable: false }).providers.x.state, 'unavailable');
  assert.equal(buildAccountDeskView(linked, { xAvailable: false }).providers.x.connected, true);
});

test('X handle links use verified session identity and reject malformed or inferred handles', () => {
  assert.equal(buildXConnectionView(linked, true).href, 'https://x.com/pointcast_test');
  assert.equal(buildXConnectionView({ identities: [{ ...xIdentity, username: 'evil.com/path' }] }, true).href, null);
  assert.equal(buildXConnectionView({ identities: [{ ...xIdentity, username: undefined, name: '@some_name' }] }, true).href, null);
  assert.equal(buildXConnectionView({ identities: [{ ...xIdentity, id: 'not-an-id' }] }, true).connected, false);
  assert.equal(buildXConnectionView({ identities: [{ ...xIdentity, verifiedAt: undefined }] }, true).connected, false);
  assert.equal(buildXConnectionView({ identities: [xIdentity] }, true).canDisconnect, false);
  assert.equal(buildXConnectionView(linked, false).canDisconnect, true);
});

test('unavailable provider and unknown session cannot start an X redirect', async () => {
  const availability = deferred();
  let calls = 0;
  const f = fixture({ getSession: async () => null, getXAuthAvailability: () => availability.promise, loginWithX: async () => { calls += 1; } });
  await tick();
  f.find('[data-x-action="connect"]').click();
  assert.equal(calls, 0);
  availability.resolve(false);
  await tick();
  assert.equal(f.root.dataset.state, 'unavailable');
  assert.equal(f.find('[data-x-action="connect"]').disabled, true);
  f.cleanup();
  const failure = fixture({ getSession: async () => { throw new Error('offline'); } });
  await tick();
  assert.equal(failure.find('[data-x-action="connect"]').disabled, true);
  assert.match(failure.find('[data-x-notice]').textContent, /session could not be checked/);
  failure.cleanup();
});

test('profile connect explicitly selects login or link from the accepted session', async () => {
  for (const user of [null, { identities: [alternate] }]) {
    const calls = [];
    const f = fixture({ getSession: async () => user, loginWithX: async (options) => calls.push(options) });
    await tick();
    f.find('[data-x-action="connect"]').click();
    await tick();
    assert.deepEqual(calls, [{ intent: user ? 'link' : 'login', returnTo: '/me' }]);
    f.cleanup();
  }
});

test('disconnect freshness error preserves the verified identity and gives recovery instructions', async () => {
  const f = fixture({ disconnectX: async () => { throw new Error('fresh-sign-in-required'); } });
  await tick();
  f.find('[data-x-action="disconnect"]').click();
  await tick();
  assert.equal(f.root.dataset.state, 'connected');
  assert.equal(f.find('[data-x-handle]').getAttribute('href'), 'https://x.com/pointcast_test');
  assert.match(f.find('[data-x-notice]').textContent, /Sign in again/);
  assert.equal(f.find('[data-x-action="disconnect"]').disabled, false);
  assert.equal(f.find('[data-x-recovery]').hidden, false);
  assert.equal(f.find('[data-x-action="reauth"]').textContent, 'Sign in again with Google');
  f.cleanup();
});

test('disconnect sends the stable identity ID and refreshes before reporting removal', async () => {
  const calls = [];
  let reads = 0;
  const f = fixture({
    getSession: async () => ++reads === 1 ? linked : { ...linked, identities: [alternate] },
    disconnectX: async (id) => calls.push(id),
  });
  await tick();
  f.find('[data-x-action="disconnect"]').click();
  await tick();
  assert.deepEqual(calls, ['123456789']);
  assert.equal(reads, 2);
  assert.equal(f.root.dataset.state, 'available');
  assert.equal(f.find('[data-x-handle]').hidden, true);
  assert.equal(f.find('[data-x-handle]').hasAttribute('href'), false);
  assert.equal(f.find('[data-x-notice]').textContent, 'X disconnected from PointCast.');
  f.cleanup();
});

test('a late session response cannot restore an identity after sign-out', async () => {
  const old = deferred();
  let reads = 0;
  const f = fixture({ getSession: () => ++reads === 1 ? old.promise : Promise.resolve(null) });
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  await tick();
  old.resolve(linked);
  await tick();
  assert.equal(f.root.dataset.state, 'available');
  assert.equal(f.find('[data-x-handle]').hidden, true);
  assert.equal(f.find('[data-x-action="connect"]').textContent, 'Sign in with X →');
  f.cleanup();
});

test('session changes scrub the old handle immediately and navigation cancels pending renders', async () => {
  const next = deferred();
  let reads = 0;
  const f = fixture({ getSession: () => ++reads === 1 ? Promise.resolve(linked) : next.promise });
  await tick();
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: null } }));
  assert.equal(f.find('[data-x-handle]').hidden, true);
  assert.equal(f.find('[data-x-handle]').hasAttribute('href'), false);
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('astro:before-swap'));
  next.resolve(linked);
  await tick();
  assert.equal(f.find('[data-x-handle]').hidden, true);
  f.cleanup();
});

test('X callback failures are readable and never echo arbitrary URL text', () => {
  assert.match(xCallbackMessage('?auth_error=x-already-linked'), /another PointCast account/);
  assert.match(xCallbackMessage('?auth_error=x-fresh-sign-in-required'), /Sign in again/);
  assert.equal(xCallbackMessage('?auth_error=x-%3Cscript%3E'), 'The X connection could not be updated. Please try again.');
});


test('X freshness recovery opens and focuses an already-linked method without starting a new login or link', async () => {
  let starts = 0;
  const f = fixture({
    disconnectX: async () => { throw new Error('fresh-sign-in-required'); },
    loginWithX: async () => { starts += 1; },
  });
  const menu = f.dom.window.document.createElement('div');
  menu.dataset.authMenu = '';
  menu.innerHTML = '<button data-auth-trigger aria-expanded="false">Account</button><button data-provider="passkey">Passkey</button><button data-provider="google">Google</button>';
  f.dom.window.document.body.append(menu);
  const trigger = menu.querySelector('[data-auth-trigger]');
  trigger.addEventListener('click', () => trigger.setAttribute('aria-expanded', 'true'));
  f.dom.window.history.replaceState({}, '', '/me?auth_error=x-fresh-sign-in-required');
  await tick();
  f.find('[data-x-action="disconnect"]').click();
  await tick();
  f.find('[data-x-action="reauth"]').click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(f.dom.window.document.activeElement, menu.querySelector('[data-provider="google"]'));
  assert.equal(starts, 0);
  assert.equal(f.dom.window.location.search, '');
  assert.equal(f.root.dataset.state, 'connected');
  // An ordinary session refresh is not proof of fresh authentication.
  f.dom.window.dispatchEvent(new f.dom.window.CustomEvent('pc:auth-change', { detail: { user: linked } }));
  await tick();
  assert.equal(f.find('[data-x-recovery]').hidden, false);
  f.cleanup();
});

test('all X launch and callback failures provide a specific recovery message', () => {
  const reasons = {
    'x-secure-origin-required': /HTTPS/,
    'x-start-failed': /could not start/,
    'x-invalid-intent': /profile.*Sign in with X or Link X/,
    'x-missing-callback': /complete sign-in response/,
    'x-token-failed': /complete the sign-in request/,
    'x-profile-failed': /profile could not be read/,
    'x-verification-failed': /could not be verified/,
  };
  for (const [reason, expected] of Object.entries(reasons)) assert.match(xCallbackMessage(`?auth_error=${reason}`), expected);
});
