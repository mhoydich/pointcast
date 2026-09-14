import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const source = await readFile(new URL('../src/components/shwa/account-panel.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(createRequire(import.meta.url), module, module.exports);
const { RoomAccount, RoomMusic, roomSpotifySelection } = module.exports;
const trackUrl = 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC';
const personal = { ok: true, configured: true, connected: true, status: 'connected', checkedAt: new Date().toISOString(), track: { id: '4uLU6hMCjMI75M1A2tKUQC', title: 'Private Test Song', artist: 'Private Test Artist', album: 'Test', imageUrl: null, spotifyUrl: trackUrl, isPlaying: true, progressMs: 1, durationMs: 3000 } };

async function mount(Component, props, fetcher) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://pointcast.xyz/shwa/' });
  const old = Object.fromEntries(['window', 'document', 'localStorage', 'fetch', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, globalThis[key]]));
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, fetch: fetcher, IS_REACT_ACT_ENVIRONMENT: true });
  const container = dom.window.document.getElementById('root');
  const root = createRoot(container);
  const render = async next => { await act(async () => { root.render(React.createElement(Component, next)); }); };
  await render(props);
  return { container, dom, render, async close() { await act(async () => root.unmount()); dom.window.close(); Object.assign(globalThis, old); } };
}

test('Spotify iframe links accept canonical public entities and reject deceptive origins or paths', () => {
  assert.equal(roomSpotifySelection(`${trackUrl}?si=tracking`).url, trackUrl);
  assert.equal(roomSpotifySelection('https://open.spotify.com/intl-fr/album/4uLU6hMCjMI75M1A2tKUQC').embed, 'https://open.spotify.com/embed/album/4uLU6hMCjMI75M1A2tKUQC');
  for (const bad of ['https://open.spotify.com.evil.test/track/4uLU6hMCjMI75M1A2tKUQC', 'https://evil.test@open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', 'http://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', 'javascript:alert(1)', 'https://open.spotify.com/track/short', `${trackUrl}/more`, 'https://open.spotify.com:444/track/4uLU6hMCjMI75M1A2tKUQC']) assert.equal(roomSpotifySelection(bad), null, bad);
});

test('personal Spotify restores with cookies, never forwards metadata to Shwa, and removes playback during voice', async () => {
  const activity = [], requests = [];
  const props = { onActivity: (...args) => activity.push(args), live: false };
  const view = await mount(RoomMusic, props, async (url, options) => { requests.push({ url, options }); return Response.json(personal); });
  try {
    assert.equal(requests[0].url, '/api/me/spotify');
    assert.equal(requests[0].options.credentials, 'include');
    assert.equal(requests[0].options.cache, 'no-store');
    assert.match(view.container.textContent, /Private Test Song/);
    assert.equal(view.container.querySelector('iframe').src, trackUrl.replace('/track/', '/embed/track/'));
    assert.doesNotMatch(view.container.querySelector('iframe').getAttribute('allow'), /autoplay/);
    assert.equal(view.container.querySelector('a[href*="personal=1"]').getAttribute('href'), '/api/spotify/auth?personal=1&returnTo=%2Fshwa%2F');
    assert.doesNotMatch(JSON.stringify(activity), /Private Test|4uLU6h|open\.spotify/);
    await view.render({ ...props, live: true });
    assert.equal(view.container.querySelector('iframe'), null);
    assert.equal(view.container.querySelector('a[href*="personal=1"]'), null);
  } finally { await view.close(); }
});

test('auth changes discard the previous personal track and distinguish expired authorization', async () => {
  let response = () => Response.json(personal);
  const view = await mount(RoomMusic, {}, async () => response());
  try {
    response = () => new Response(null, { status: 401 });
    await act(async () => window.dispatchEvent(new window.Event('pc:auth-change')));
    assert.equal(view.container.querySelector('iframe'), null);
    assert.doesNotMatch(view.container.textContent, /Private Test/);
    assert.match(view.container.textContent, /Sign in to PointCast/);
    response = () => Response.json({ ok: true, configured: true, connected: true, status: 'reconnect_required', track: null, checkedAt: new Date().toISOString() });
    await act(async () => window.dispatchEvent(new window.Event('pc:auth-refresh')));
    assert.match(view.container.textContent, /authorization needs to be renewed/);
    assert.equal(view.container.querySelector('iframe'), null);
    assert.match(view.container.querySelector('a[href*="personal=1"]').textContent, /Reconnect/);
  } finally { await view.close(); }
});

test('account restoration shows the verified identity and keeps outages distinct from signed out', async () => {
  let response = () => Response.json({ user: { userId: 'user-test', preferredName: 'Test Person', identities: [{ provider: 'google', id: 'private-google-id', name: 'Test Person' }] } });
  const activity = [];
  const view = await mount(RoomAccount, { onActivity: (...args) => activity.push(args) }, async () => response());
  try {
    assert.match(view.container.textContent, /Test Person/);
    assert.doesNotMatch(JSON.stringify(activity), /Test Person|private-google-id|user-test/);
    response = () => new Response(null, { status: 503 });
    await act(async () => window.dispatchEvent(new window.Event('pc:auth-refresh')));
    assert.match(view.container.textContent, /Account unavailable/);
    assert.equal(view.container.querySelector('a'), null);
    response = () => new Response(null, { status: 401 });
    await act(async () => window.dispatchEvent(new window.Event('pc:auth-change')));
    assert.equal(view.container.querySelector('a').getAttribute('href'), '/auth?returnTo=%2Fshwa%2F');
  } finally { await view.close(); }
});
