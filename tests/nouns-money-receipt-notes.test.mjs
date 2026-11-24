import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildManifest, pickNoun } from '../scripts/nouns-money-receipt-notes.mjs';

const { buys } = JSON.parse(readFileSync(new URL('../art/nouns-money/receipt-notes/buys.json', import.meta.url)));

test('every buy prints one whole-Noun note with no prices', () => {
  const notes = buildManifest(buys);
  assert.equal(notes.length, buys.length);
  for (const n of notes) {
    for (const part of ['body', 'accessory', 'head', 'glasses']) assert.ok(n.traits[part], `${n.serial} missing ${part}`);
    assert.doesNotMatch(n.svg, /SOL|\$\d|tez\b|price/i);
    assert.match(n.svg, /NO CASH VALUE/);
    assert.match(n.svg, />FOR</);
  }
});

test('the Noun is deterministic for a serial', () => {
  assert.deepEqual(pickNoun('NM-RCPT-001:OFFICENOUN:2026-11-15'), pickNoun('NM-RCPT-001:OFFICENOUN:2026-11-15'));
});
