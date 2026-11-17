import test from 'node:test';
import assert from 'node:assert/strict';
import { renderReplyThreads } from '../public/office/reply-threads.mjs';
class Element {
  children = []; attributes = {}; classList = { add() {} };
  setAttribute(k,v) { this.attributes[k] = v; }
  append(...children) { this.children.push(...children); }
}
const document = { createElement: () => new Element(), createElementNS: () => new Element() };
const edge = { id: 'reply', parentId: 'parent', fromHandle: '@a', toHandle: '@b', sourceUrl: 'https://pointcast.xyz/loom#reply' };
test('renders one static edge per reply ID and a source link', () => {
  const root = renderReplyThreads(document, [edge, edge], { '@a': { x: 1, y: 2 }, '@b': { x: 3, y: 4 } });
  assert.equal(root.children[0].children.length, 1);
  assert.equal(root.children[1].children.length, 1);
  assert.equal(root.children[0].children[0].attributes.x2, '3');
});
test('missing desks and self replies keep accessible provenance without a line', () => {
  const root = renderReplyThreads(document, [edge, { ...edge, id: 'self', toHandle: '@a' }]);
  assert.equal(root.children[0].children.length, 0);
  assert.match(root.children[1].children[0].children[0].textContent, /desk unavailable/);
  assert.match(root.children[1].children[1].children[0].textContent, /self reply/);
});
test('rejects unsafe sources and incomplete relationships, preserves text literally', () => {
  const root = renderReplyThreads(document, [{ ...edge, sourceUrl: 'javascript:alert(1)' }, { ...edge, id: 'bad', parentId: '' }, { ...edge, id: 'safe', fromHandle: '<img>' }]);
  assert.equal(root.children[1].children.length, 1);
  assert.match(root.children[1].children[0].children[0].textContent, /^<img>/);
});
