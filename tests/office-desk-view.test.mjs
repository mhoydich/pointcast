import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createDesk, updateDesk, DESK_FRESHNESS_MS } from '../public/office/desk-view.mjs';

const asOf = '2026-11-17T17:00:00Z';
const facts = { asOf, lastPostAt: asOf, postUrl: '/loom?to=%40sid#receipt', status: 'Reviewing' };
function setup(agent = { name: 'Sid', handle: '@sid', nounUrl: '/images/after-hours-art/portraits/sid.svg' }) {
  const dom = new JSDOM();
  return { dom, desk: createDesk(dom.window.document, agent) };
}

test('whole supplied portrait, exact identity and visible fallback on image error', () => {
  const { dom, desk } = setup();
  const image = desk.querySelector('img');
  assert.equal(image.getAttribute('src'), 'https://pointcast.xyz/images/after-hours-art/portraits/sid.svg');
  assert.equal(desk.querySelector('h2').textContent, 'Sid');
  assert.equal(desk.querySelector('.office-desk__handle').textContent, '@sid');
  image.dispatchEvent(new dom.window.Event('error'));
  assert.equal(image.hidden, true);
  assert.equal(desk.querySelector('.office-desk__portrait-fallback').hidden, false);
  assert.equal(setup({ name: 'Shwa' }).desk.querySelector('img'), null);
});

test('recent light requires complete evidence and includes the explicit freshness boundary', () => {
  const { desk } = setup();
  updateDesk(desk, { ...facts, lastPostAt: new Date(Date.parse(asOf) - DESK_FRESHNESS_MS).toISOString() });
  assert.equal(desk.dataset.activity, 'recent');
  assert.match(desk.textContent, /15 minutes/);
  assert.match(desk.textContent, /does not show whether a process is running/);
  assert.equal(desk.querySelector('a').href, 'https://pointcast.xyz/loom?to=%40sid#receipt');
  assert.equal(desk.querySelector('time').dateTime, '2026-11-17T16:45:00.000Z');
  updateDesk(desk, { ...facts, lastPostAt: new Date(Date.parse(asOf) - DESK_FRESHNESS_MS - 1).toISOString() });
  assert.equal(desk.dataset.activity, 'stale');
});

test('missing, future, invalid or explicitly stale facts cannot light a desk', () => {
  const { desk } = setup();
  for (const change of [
    { postUrl: null }, { lastPostAt: null }, { asOf: null },
    { lastPostAt: '2026-11-17T17:00:01Z' }, { lastPostAt: 'bad' },
    { lastPostAt: '2026-11-17T17:00:00' }, { stale: true }, { postUrl: 'javascript:alert(1)' },
  ]) {
    updateDesk(desk, facts);
    assert.equal(desk.dataset.activity, 'recent');
    updateDesk(desk, { ...facts, ...change });
    assert.notEqual(desk.dataset.activity, 'recent', JSON.stringify(change));
  }
  updateDesk(desk, {});
  assert.match(desk.textContent, /Activity unknown/);
  assert.match(desk.textContent, /Source unknown/);
  assert.match(desk.textContent, /Snapshot time unknown/);
  assert.equal(desk.querySelector('a'), null);
  assert.equal(desk.querySelector('time'), null);
});

test('supplied text is inert and updates replace old evidence', () => {
  const { desk } = setup({ name: '<img src=x>', handle: '@custom', nounUrl: 'javascript:alert(1)' });
  updateDesk(desk, { ...facts, status: '<script>bad()</script>' });
  assert.equal(desk.querySelector('script'), null);
  assert.equal(desk.querySelector('img'), null);
  assert.match(desk.textContent, /Reported status: <script>/);
  updateDesk(desk, { stale: true });
  assert.equal(desk.querySelector('a'), null);
  assert.match(desk.textContent, /Reported status: unknown/);
  assert.equal(desk.dataset.activity, 'stale');
});
