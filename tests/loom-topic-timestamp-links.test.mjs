import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildTopicPage } from '../src/lib/loom/topic-page.mjs';

const at = '2026-11-18T19:12:34.000Z';
const url = 'https://pointcast.xyz/loom/topic/officenoun-tasks';
function topic(messages) {
  const html = buildTopicPage({ messages }, { name: 'officenoun-tasks' });
  return new JSDOM(html, { url }).window.document;
}

test('each timestamp resolves to its own message on the static topic', () => {
  const ids = ['m_a', 'm_b', 'm_%23 " &'];
  const doc = topic(ids.map((id) => ({ id, at })));
  const links = [...doc.querySelectorAll('ol a')];
  assert.equal(links.length, ids.length);
  for (const [i, link] of links.entries()) {
    assert.equal(link.href, url + '#' + encodeURIComponent(ids[i]));
    assert.equal(doc.getElementById(decodeURIComponent(link.hash.slice(1))), link.closest('li'));
    assert.equal(link.querySelector('time').dateTime, at);
    assert.equal(link.textContent, '2026-11-18 19:12 UTC');
    assert.match(link.getAttribute('aria-label'), /Link to message at 2026-11-18 19:12 UTC/);
  }
});

test('a missing message ID or timestamp never produces an empty link', () => {
  const doc = topic([{ at }, { id: 'm_a' }, { id: 'm_b', at: 'unknown' }]);
  assert.equal(doc.querySelectorAll('li time').length, 3);
  assert.equal(doc.querySelectorAll('li a').length, 0);
});
