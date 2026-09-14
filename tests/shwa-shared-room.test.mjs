import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { roomFromHash, roomInvite } from '../src/components/shwa/lib/shared-room.ts';
const require = createRequire(import.meta.url);
const compiled = await build({ entryPoints: [fileURLToPath(new URL('../src/components/shwa/shared-room.tsx', import.meta.url))], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', loader: { '.css': 'empty' }, jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' });
const module = { exports: {} }; new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, module, module.exports);
const { SharedRoomBoard, useSharedRoom } = module.exports;
async function mount(Component, props = {}, extra = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://pointcast.xyz/shwa/' }); const old = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, location: dom.window.location, history: dom.window.history, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true, ...extra })) { old.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const { createRoot } = await import('react-dom/client'); const container = document.querySelector('#root'), root = createRoot(container);
  await act(async () => root.render(React.createElement(Component, props)));
  return { dom, container, async render(next) { await act(async () => root.render(React.createElement(Component, next))); }, async close() { await act(async () => root.unmount()); dom.window.close(); for (const [key, descriptor] of old) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } } };
}
const button = (container, name) => [...container.querySelectorAll('button')].find(item => item.textContent.trim() === name);
async function click(node) { assert.ok(node); await act(async () => node.click()); }
const empty = { revision: 1, expiresAt: Date.now() + 86400000, members: [{ id: 'me', name: 'Test human', resource: 'house', online: true }], pieces: [] };
const noop = () => {};
test('invite tokens are explicit high entropy fragments, never a guessed public room', () => {
  const token = 'a'.repeat(64); assert.equal(roomFromHash('#room=' + token), token); assert.equal(roomFromHash('#room=public'), '');
  assert.equal(roomInvite('https://pointcast.xyz', token), 'https://pointcast.xyz/shwa/#room=' + token); assert.equal(roomInvite('https://pointcast.xyz', 'public'), '');
});
test('shared proposals require explicit votes, image preparation and AI context are separate actions', async () => {
  const sent = [], discussed = [], images = [];
  const room = { ...empty, pieces: [{ id: 'p1', authorId: 'someone', author: 'Second human', kind: 'proposal', text: '<script>Not executable</script>', votes: {}, createdAt: 1 }, { id: 'p2', authorId: 'me', author: 'Test human', kind: 'image-idea', text: 'A green room with radio lights.', votes: {}, createdAt: 2 }] };
  const group = { invite: 'a'.repeat(64), id: 'me', phase: 'connected', room, error: '', join: noop, leave: noop, send: value => { sent.push(value); return true; } };
  const props = { group, open: true, setOpen: noop, houseAvailable: false, onDiscuss: text => discussed.push(text), onImageIdea: text => images.push(text), onWallet: noop };
  const view = await mount(SharedRoomBoard, props);
  try {
    assert.equal(view.container.querySelectorAll('.shared-seats li').length, 5); assert.equal(view.container.querySelectorAll('.shared-seats .occupied').length, 1);
    assert.equal(view.container.querySelectorAll('script').length, 0); assert.equal(sent.length, 0); assert.equal(discussed.length, 0);
    await click(button(view.container, 'Yes')); assert.deepEqual(sent.pop(), { type: 'vote', id: 'p1', vote: 'yes' });
    await click(button(view.container, 'Prepare image')); assert.deepEqual(images, ['A green room with radio lights.']); assert.equal(discussed.length, 0);
    await click(button(view.container, 'Discuss with Shwa')); assert.equal(discussed.length, 1);
    await click(button(view.container, 'My seat')); await click(button(view.container, 'My AI')); assert.equal(view.container.querySelector('.shared-setup-actions a').getAttribute('href'), '/me#my-ai'); await click(button(view.container, 'x402')); assert.deepEqual(sent.pop(), { type: 'profile', name: 'Test human', resource: 'x402' });
    assert.match(view.container.textContent, /automatic AI purchases are not connected yet/);
    await view.render({ ...props, group: { ...group, phase: 'disconnected' } }); assert.equal(button(view.container, 'Yes').disabled, true);
    assert.match(view.container.textContent, /edits paused/);
  } finally { await view.close(); }
});
test('room connection begins only on join and releases the socket on leaving', async () => {
  let controller; const sockets = [], requests = [];
  class FakeSocket {
    static OPEN = 1; readyState = 0; sent = [];
    constructor(url) { this.url = url; sockets.push(this); }
    send(value) { this.sent.push(JSON.parse(value)); }
    close() { this.readyState = 3; this.onclose?.({ code: 1000 }); }
    open() { this.readyState = 1; this.onopen?.(); }
    message(data) { this.onmessage?.({ data: JSON.stringify(data) }); }
  }
  function Harness() { controller = useSharedRoom(); return React.createElement('p', null, controller.phase); }
  const view = await mount(Harness, {}, { WebSocket: FakeSocket, fetch: async (url, options) => { requests.push({ url, options }); return Response.json({ room: 'b'.repeat(64), expiresAt: Date.now() + 86400000 }); } });
  try {
    assert.equal(sockets.length, 0); assert.equal(requests.length, 0);
    await act(async () => controller.join('First human', 'own'));
    assert.equal(sockets.length, 1); assert.equal(requests.length, 1); assert.ok(requests[0].url.endsWith('/rooms')); assert.equal(requests[0].options.credentials, 'omit');
    await act(async () => sockets[0].open()); const join = sockets[0].sent[0]; assert.equal(join.name, 'First human'); assert.equal(join.resource, 'own'); assert.match(join.secret, /^[a-f0-9]{64}$/); assert.ok(!sockets[0].url.includes(join.secret));
    await act(async () => { sockets[0].message({ type: 'joined', id: 'me' }); sockets[0].message({ type: 'state', room: empty }); });
    assert.equal(controller.phase, 'connected'); assert.equal(controller.room.members.length, 1);
    await act(async () => controller.leave()); assert.equal(sockets[0].sent.at(-1).type, 'leave'); assert.equal(sockets[0].readyState, 3); assert.equal(controller.room, null); assert.equal(location.hash, '');
    assert.equal(requests.length, 1, 'Joining never calls an AI or payment endpoint');
  } finally { await view.close(); }
});
