import test from 'node:test';
import assert from 'node:assert/strict';
import { safeKeepUrl, moveItem, legacyImportGroups, publicCard } from '../src/lib/me-library-model.mjs';

test('saved URL safety preserves functional query and fragment identity', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,no', 'http://example.com', 'https://me:secret@example.com', '//example.com', '/\\evil.example/path', 'ftp://example.com']) assert.equal(safeKeepUrl(bad), null);
  assert.equal(safeKeepUrl('https://example.com/view?q=a#part'), 'https://example.com/view?q=a#part');
  assert.equal(safeKeepUrl('/b/0001?view=full#details'), 'https://pointcast.xyz/b/0001?view=full#details');
  assert.equal(safeKeepUrl('/station/calm/'), 'https://pointcast.xyz/station/calm/');
});
test('known source import adapters preserve source lists and ignore unrelated state', () => {
  const state = new Map([
    ['pointcast:shopping-pocket:v1', '["chair","unknown"]'],
    ['sparrow:saved', '["0591","../../auth","0591"]'],
    ['pc:dock:saved:v1', '["/station?channel=calm#play","//evil.example","/api/private","javascript:alert(1)"]'],
  ]);
  const readKeys = [];
  const groups = legacyImportGroups(key => { readKeys.push(key); return state.get(key); }, [{ id: 'chair', url: 'https://merchant.example/chair', maker: 'Maker', name: 'Chair', role: 'A place to sit' }]);
  assert.deepEqual(readKeys, [...state.keys()]);
  assert.equal(groups[0].items[0].site, 'ShoppingPocket');
  assert.equal(groups[1].items.length, 1);
  assert.equal(groups[1].items[0].url, 'https://pointcast.xyz/b/0591');
  assert.equal(groups[2].items.length, 1);
  assert.equal(groups[2].items[0].url, 'https://pointcast.xyz/station?channel=calm#play');
  assert.equal(state.get('sparrow:saved'), '["0591","../../auth","0591"]');
});
test('publication preview never includes private notes, identity or internal keys', () => {
  const card = publicCard({ title: 'A page', url: 'https://example.com', note: 'private secret', id: 'keep1', who: 'private-person', description: 'private description' }, 'Shared thought');
  assert.deepEqual(card, { title: 'A page', url: 'https://example.com/', caption: 'Shared thought' });
  assert.equal(JSON.stringify(card).includes('private'), false);
});
test('keyboard reorder is stable and does not mutate current state', () => {
  const original = ['a', 'b', 'c'];
  assert.deepEqual(moveItem(original, 1, -1), ['b', 'a', 'c']);
  assert.deepEqual(moveItem(original, 1, 1), ['a', 'c', 'b']);
  assert.deepEqual(moveItem(original, 0, -1), original);
  assert.deepEqual(original, ['a', 'b', 'c']);
});
