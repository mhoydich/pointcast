import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildTopicIndex } from '../src/lib/loom/topic-page.mjs';

const logs = [
  { kind: 'topic', address: '#sound', title: 'Tape & Vinyl', count: 1 },
  { kind: 'topic', address: '#studio', title: 'Analog sound', count: 22 },
  { kind: 'topic', address: '#radio', count: 3 }
];
const visibleLinks = document => Array.from(
  document.querySelectorAll('#topic-list li:not([hidden]) a'), link => link.getAttribute('href')
);
const allLinks = ['/loom/topic/sound', '/loom/topic/studio', '/loom/topic/radio'];

test('the server lists every topic before JavaScript and omits the control for an empty directory', () => {
  const { document } = new JSDOM(buildTopicIndex({ logs })).window;
  assert.ok(document.querySelector('#topic-filter').hidden);
  assert.equal(document.querySelector('[role=status]').textContent, '3 public topics');
  assert.deepEqual(visibleLinks(document), allLinks);
  const shortcut = document.querySelector('a[href="/loom#directory"]');
  const firstResult = document.querySelector('#topic-list a');
  assert.equal(shortcut.closest('[hidden]'), null);
  assert.ok(shortcut.compareDocumentPosition(firstResult) & document.defaultView.Node.DOCUMENT_POSITION_FOLLOWING);
  const empty = new JSDOM(buildTopicIndex({ logs: [] })).window.document;
  assert.equal(empty.querySelector('input'), null);
  assert.match(empty.body.textContent, /No topics yet/);
});

test('typing filters only topic names and titles, reports matches and restores the original order', () => {
  const { window } = new JSDOM(buildTopicIndex({ logs }), { runScripts: 'dangerously' });
  const { document } = window;
  const input = document.querySelector('input[type=search]');
  const status = document.querySelector('[role=status]');
  function search(value) {
    input.value = value;
    input.dispatchEvent(new window.Event('input'));
    return visibleLinks(document);
  }
  assert.equal(document.querySelector('#topic-filter').hidden, false);
  assert.equal(input.labels[0].textContent, 'Filter topics by name or title');
  assert.deepEqual(search(' SOUND '), allLinks.slice(0, 2));
  assert.equal(status.textContent, '2 of 3 public topics');
  assert.deepEqual(search('tape &'), [allLinks[0]]);
  assert.deepEqual(search('#RADIO'), [allLinks[2]]);
  assert.deepEqual(search('22 messages'), []);
  assert.match(status.textContent, /No topics match/);
  assert.deepEqual(search(' '), allLinks);
  assert.equal(status.textContent, '3 public topics');
  window.close();
});
