import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const block = (id) => JSON.parse(read(`src/content/blocks/${id}.json`));

const receipts = [
  ['0690', 'https://pointcast.xyz/grok/case-study/', 'open-build'],
  ['0691', 'https://pointcast.xyz/ues/philosophy/no-degrees-only-receipts/', 'ues-phil-001'],
  ['0692', 'https://pointcast.xyz/ues/philosophy/the-radius-as-pedagogy/', 'ues-phil-002'],
];

test('survey and seminar receipts are guest LINK blocks on Front Door', () => {
  for (const [id, url, tag] of receipts) {
    const entry = block(id);
    assert.equal(entry.id, id);
    assert.equal(entry.channel, 'FD');
    assert.equal(entry.type, 'LINK');
    assert.equal(entry.author, 'guest');
    assert.match(entry.source, /New Bot/);
    assert.match(entry.source, /Mike Hoydich/);
    assert.match(entry.source, /guest/);
    assert.equal(entry.external.url, url);
    assert.ok(entry.meta.tags.includes(tag) || entry.meta.tags.includes('open-build'));
    assert.ok(entry.meta.tags.includes('new-bot'));
    assert.equal(entry.meta.byline, 'guest');
    assert.match(entry.body, /not a resident/i);
    for (const companion of entry.companions) {
      assert.ok(companion.id.length <= 80, companion.id);
      assert.ok(companion.label.length <= 80, companion.label);
    }
  }
});

test('philosophy 003 is a labeled essay and 004 and 005 stay stubs', () => {
  const source = read('src/lib/ues-philosophy.ts');
  assert.match(source, /id: 'ues-phil-003'[\s\S]*?status: 'published'/);
  assert.match(source, /slug: 'the-unmoderated-label'/);
  assert.match(source, /id: 'ues-phil-004'[\s\S]*?status: 'next'/);
  assert.match(source, /id: 'ues-phil-005'[\s\S]*?status: 'next'/);
  for (const label of ['fact', 'reported', 'speculation']) {
    assert.match(source, new RegExp(`label: '${label}'`));
  }
  assert.match(source, /block: `\$\{ORIGIN\}\/b\/0691`/);
  assert.match(source, /block: `\$\{ORIGIN\}\/b\/0692`/);
  assert.doesNotMatch(source, /\/b\/0693/);
});

test('method ledger points at the three receipts and leaves 003 unledgered', () => {
  const source = read('src/lib/grok-method.ts');
  assert.match(source, /survey: '0690'/);
  assert.match(source, /uesPhil001: '0691'/);
  assert.match(source, /uesPhil002: '0692'/);
  assert.match(source, /uesPhil003: null/);
  assert.match(source, /https:\/\/pointcast\.xyz\/b\/0690/);
  assert.match(source, /id: 'claim-shelf-receipts'/);
  assert.match(source, /id: 'claim-block-when-ledgered'/);
});
