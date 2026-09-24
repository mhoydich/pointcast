import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const DRAFT = 'pointcast.keyboard.studio.draft.v1';
const PREFS = 'pointcast.keyboard.studio.prefs.v1';
const NOTES = 'pointcast.keyboard.notes.v1';
const ROOM = '0123456789abcdef0123456789abcdef';
const TOKEN = 'a'.repeat(64);
const html = readFileSync('src/pages/keyboard/studio.astro', 'utf8')
  .replace(/^---[\s\S]*?---\n/, '').replaceAll(' is:inline', '');

function open({ storage = {}, room = '', handleRequest } = {}) {
  const requests = [];
  const dom = new JSDOM(html, {
    url: 'https://pointcast.xyz/keyboard/studio' + (room ? '?room=' + room + '&token=' + TOKEN : ''),
    runScripts: 'dangerously',
    beforeParse(window) {
      Object.defineProperty(window.document, 'hidden', { value: false, configurable: true });
      Object.defineProperty(window.crypto, 'randomUUID', { value: () => '11111111-1111-4111-8111-111111111111' });
      window.URL.createObjectURL = () => 'blob:test';
      window.URL.revokeObjectURL = () => {};
      window.HTMLAnchorElement.prototype.click = () => {};
      window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
      window.HTMLDialogElement.prototype.close = function () { this.open = false; };
      window.confirm = () => true;
      for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);
      window.fetch = async (url, init = {}) => {
        requests.push({ url, init });
        const result = handleRequest ? await handleRequest(url, init) : (url.includes('action=create')
          ? { room: ROOM, token: TOKEN, status: 201 }
          : { room: ROOM, passages: [] });
        return {
          ok: result.status === undefined || result.status < 400,
          status: result.status || 200,
          headers: { get: () => null },
          json: async () => result,
        };
      };
    },
  });
  const { window } = dom;
  const $ = (id) => window.document.getElementById(id);
  const input = (id, value, data = null) => {
    $(id).value = value;
    const event = new window.InputEvent('input', { bubbles: true, data, inputType: 'insertText' });
    $(id).dispatchEvent(event);
  };
  return { window, $, input, requests, close: () => window.close() };
}

test('private draft, Echo margin, and mute preference survive reload', async () => {
  const first = open();
  try {
    first.input('title', 'A sea scene');
    first.input('body', 'The ocean rose against our small garden.', '.');
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.match(first.$('echo-quote').textContent, /water|tide|sound/i);
    first.$('echo-keep').click();
    assert.equal(first.$('margin').querySelectorAll('.margin-item').length, 1);
    first.$('sound').click();
    assert.equal(first.$('sound').getAttribute('aria-pressed'), 'false');
    const next = open({ storage: {
      [DRAFT]: first.window.localStorage.getItem(DRAFT),
      [PREFS]: first.window.localStorage.getItem(PREFS),
    } });
    try {
      assert.equal(next.$('title').value, 'A sea scene');
      assert.equal(next.$('body').value, 'The ocean rose against our small garden.');
      assert.equal(next.$('margin').querySelectorAll('.margin-item').length, 1);
      assert.equal(next.$('sound').getAttribute('aria-pressed'), 'false');
    } finally { next.close(); }
  } finally { first.close(); }
});

test('copying a Note appends to existing Studio draft and leaves Notes untouched', () => {
  const notes = JSON.stringify({ notes: [{ title: 'Flower', body: 'A rose', deleted: false }] });
  const app = open({ storage: { [NOTES]: notes } });
  try {
    app.input('body', 'My original');
    app.$('copy-note').click();
    app.$('import-list').querySelector('button').click();
    assert.equal(app.$('body').value, 'My original\n\nA rose');
    assert.equal(app.window.localStorage.getItem(NOTES), notes);
  } finally { app.close(); }
});

test('concurrent tab conflict protects active writing from overwrite', () => {
  const app = open();
  try {
    app.input('body', 'Mine');
    const remote = { ...JSON.parse(app.window.localStorage.getItem(DRAFT)), body: 'Other tab', revision: Date.now() + 1 };
    app.$('body').focus();
    app.window.dispatchEvent(new app.window.StorageEvent('storage', { key: DRAFT, newValue: JSON.stringify(remote) }));
    app.input('body', 'Still mine');
    assert.match(app.$('save-status').textContent, /Another tab changed/);
    assert.equal(JSON.parse(app.window.localStorage.getItem(DRAFT)).body, 'Mine');
  } finally { app.close(); }
});

test('joining a room does not send the private draft, and passages render as text', async () => {
  const app = open({ room: ROOM, storage: { [DRAFT]: JSON.stringify({ title: 'Private', body: 'Do not send', margin: [] }) }, handleRequest: () => ({ room: ROOM, passages: [{ id: 'one', name: '<img src=x>', text: '<script>bad()</script>', at: 1 }] }) });
  try {
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(app.requests.filter(r => r.init.method === 'POST').length, 0);
    assert.equal(app.$('passages').querySelector('script'), null);
    assert.equal(app.$('passages').querySelector('img'), null);
    assert.match(app.$('passages').textContent, /<script>bad/);
    assert.equal(app.$('body').value, 'Do not send');
  } finally { app.close(); }
});

test('creating a room generates a private invite and does not send the draft', async () => {
  const calls = [];
  const app = open({ handleRequest: (url, init) => {
    calls.push({ url, init });
    return url.includes('action=create')
      ? { room: ROOM, token: TOKEN, status: 201 }
      : { room: ROOM, passages: [] };
  } });
  try {
    app.input('body', 'My private draft');
    app.$('room-tab').click();
    app.$('create-room').click();
    await new Promise(resolve => setTimeout(resolve, 20));
    const invite = new URL(app.window.location.href);
    assert.equal(invite.searchParams.get('room'), ROOM);
    assert.equal(invite.searchParams.get('token'), TOKEN);
    assert.equal(calls.filter(c => c.init.method === 'POST').length, 1);
    assert.match(calls[0].url, /action=create/);
    assert.ok(calls.filter(c => c.init.method === 'GET').every(c => c.url.includes('token=' + TOKEN)));
    assert.match(app.$('room-panel').textContent, /cannot be closed yet/i);
    app.$('leave-room').click();
    assert.doesNotMatch(app.window.location.href, /[?](room|token)=/);
    assert.equal(app.$('body').value, 'My private draft');
  } finally { app.close(); }
});
