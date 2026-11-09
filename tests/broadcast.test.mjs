import test from 'node:test';
import assert from 'node:assert/strict';
import { selectBlocks, buildPost, postedIds, blockUrl, POST_MAX } from '../scripts/broadcast.mjs';

const now = new Date('2026-11-09T20:00:00Z');
const block = (over) => ({
  id: '0780', title: 'Call or be called', dek: 'A short dek.', author: 'cc',
  timestamp: '2026-11-08T17:00:00Z', ...over,
});
const count = (text) => [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].length;

test('selects only recent agent-written, published blocks, oldest first', () => {
  const picked = selectBlocks([
    block({ id: '0780' }),
    block({ id: '0779', timestamp: '2026-11-07T09:00:00Z', author: 'codex' }),
    block({ id: '0778', author: 'mike' }),
    block({ id: '0777', author: 'mh+cc' }),
    block({ id: '0776', author: 'guest' }),
    block({ id: '0775', draft: true }),
    block({ id: '0774', timestamp: '2026-11-01T00:00:00Z' }),
    block({ id: '0773', timestamp: '2026-11-10T00:00:00Z' }),
    block({ id: '0772', title: '  ' }),
    block({ id: 'abc' }),
    null,
  ], now);
  assert.deepEqual(picked.map((b) => b.id), ['0779', '0780']);
});

test('a block with no author counts as cc, the schema default', () => {
  assert.equal(selectBlocks([block({ author: undefined })], now).length, 1);
});

test('the post links back, and the link facet covers exactly the shown url', () => {
  const post = buildPost(block({ title: 'Café at the pier ☕', dek: 'Naïve dek — with dashes.' }), now);
  const bytes = new TextEncoder().encode(post.text);
  const { byteStart, byteEnd } = post.facets[0].index;
  assert.equal(new TextDecoder().decode(bytes.slice(byteStart, byteEnd)), 'pointcast.xyz/b/0780');
  assert.equal(post.facets[0].features[0].uri, blockUrl('0780'));
  assert.equal(post.embed.external.uri, 'https://pointcast.xyz/b/0780');
  assert.equal(post.createdAt, now.toISOString());
});

test('long text is clipped to the limit and keeps the link', () => {
  const post = buildPost(block({ title: 'T'.repeat(120), dek: 'd'.repeat(600) }), now);
  assert.ok(count(post.text) <= POST_MAX);
  assert.ok(post.text.endsWith('pointcast.xyz/b/0780'));
  assert.ok(post.text.includes('…'));
});

test('a block without a dek still makes a post and a card', () => {
  const post = buildPost(block({ dek: undefined }), now);
  assert.ok(post.text.startsWith('Call or be called'));
  assert.ok(post.embed.external.description.length > 0);
});

test('already-posted blocks are found in text, card and facets', () => {
  const ids = postedIds([
    { post: { record: { text: 'see pointcast.xyz/b/0701' } } },
    { post: { record: { text: 'x', embed: { external: { uri: 'https://pointcast.xyz/b/0702' } } } } },
    { post: { record: { text: 'y', facets: [{ features: [{ uri: 'https://pointcast.xyz/b/0703' }] }] } } },
    { post: { record: { text: 'unrelated pointcast.xyz/court' } } },
    {},
  ]);
  assert.deepEqual([...ids].sort(), ['0701', '0702', '0703']);
});
