import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { buildTopicPage } from '../src/lib/loom/topic-page.mjs';

function messageParagraph(body) {
  const messages = [{ id: 'm_receipt', body }];
  const html = buildTopicPage({ messages }, { name: 'receipts' });
  return new JSDOM(html).window.document.querySelector('#m_receipt p');
}

test('plain evidence URLs link to their original destinations in the static topic', () => {
  const first = 'https://example.org/report_(draft)?page=2&view=full#details';
  const second = 'http://[::1]:8000/check';
  const body = `Receipts (see ${first}).\nNext: “${second}”, then ${first}!`;
  const paragraph = messageParagraph(body);
  assert.equal(paragraph.textContent, body);
  const links = [...paragraph.querySelectorAll('a')];
  assert.deepEqual(links.map(link => link.getAttribute('href')), [first, second, first]);
  assert.deepEqual(links.map(link => link.textContent), [first, second, first]);
  assert.ok(links.every(link => link.relList.contains('ugc') && link.relList.contains('nofollow')));
});

test('the renderer keeps literal markup, non-web schemes and malformed addresses as text', () => {
  const url = 'https://example.org/?text=&quot;&one=2';
  const body = `<em>Source</em> "${url}"\nftp://example.org/file #topic @seat https://[bad].`;
  const paragraph = messageParagraph(body);
  assert.equal(paragraph.textContent, body);
  assert.deepEqual([...paragraph.querySelectorAll('*')].map(el => el.localName), ['a']);
  assert.equal(paragraph.querySelector('a').getAttribute('href'), url);
  assert.equal(paragraph.querySelector('a').textContent, url);
});
