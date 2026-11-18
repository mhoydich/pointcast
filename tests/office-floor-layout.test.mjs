import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createFloor } from '../public/office/floor-layout.mjs';
const require = createRequire(process.env.OFFICE_TEST_TOOLING
  ? `${process.env.OFFICE_TEST_TOOLING}/package.json` : import.meta.url);
const { JSDOM } = require('jsdom');
const makeDocument = () => new JSDOM('<!doctype html>').window.document;

test('renders only the supplied roster with accessible, empty desk mounts', () => {
  const document = makeDocument();
  const roster = Object.freeze([
    Object.freeze({ handle: '@one', name: 'One', nounUrl: '/images/one.png' }),
    Object.freeze({ handle: '@two', name: 'Two', nounUrl: 'https://example.com/two.png' }),
  ]);
  const floor = createFloor(document, roster);
  assert.equal(floor.getAttribute('aria-label'), 'Office floor');
  assert.equal(floor.querySelector('section').getAttribute('aria-label'), 'Roster desks');
  assert.deepEqual([...floor.querySelectorAll('[data-desk-handle]')].map(n => n.dataset.deskHandle), ['@one', '@two']);
  assert.equal(floor.querySelectorAll('article').length, 2);
  assert.equal(floor.querySelector('article').getAttribute('aria-label'), 'One desk');
  assert.equal(floor.querySelector('[data-desk-handle]').children.length, 0);
  assert.equal(floor.isConnected, false);
  assert.doesNotMatch(floor.textContent, /online|working|active|approval/i);
});

test('empty roster does not fabricate occupants; independent floors share no IDs', () => {
  const document = makeDocument();
  document.body.append(createFloor(document), createFloor(document));
  assert.equal(document.querySelectorAll('[data-desk-handle]').length, 0);
  assert.equal(document.querySelectorAll('[id]').length, 0);
  assert.match(document.body.textContent, /No desks supplied yet/);
});

test('names and handles remain literal text; unsafe portraits are omitted', () => {
  const floor = createFloor(makeDocument(), [
    { handle: '@<script>', name: '<img onerror=alert(1)>', nounUrl: 'javascript:alert(1)' },
    { handle: '@other', name: 'Other', nounUrl: '//example.com/a.png' },
  ]);
  assert.equal(floor.querySelectorAll('script, img').length, 0);
  assert.equal(floor.querySelector('h3').textContent, '<img onerror=alert(1)>');
  assert.equal(floor.querySelector('[data-desk-handle]').dataset.deskHandle, '@<script>');
});

test('ambiguous or invalid roster entries fail before rendering', () => {
  const document = makeDocument();
  assert.throws(() => createFloor(document, {}), TypeError);
  for (const roster of [[null], [{ handle: '', name: 'Name' }], [{ handle: '@a', name: ' ' }],
    [{ handle: '@a', name: 'A' }, { handle: '@a', name: 'B' }]]) {
    assert.throws(() => createFloor(document, roster), TypeError);
  }
});
