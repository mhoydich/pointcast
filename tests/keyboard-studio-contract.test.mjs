import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BODY_BYTES,
  MAX_PASSAGES,
  ROOM_ID_PATTERN,
  parsePassageInput,
} from '../workers/keyboard-studio/src/contract.ts';

test('studio room IDs require 128 bits of lowercase hex', () => {
  assert.match('0123456789abcdef0123456789abcdef', ROOM_ID_PATTERN);
  assert.doesNotMatch('0123456789ABCDEF0123456789ABCDEF', ROOM_ID_PATTERN);
  assert.doesNotMatch('short', ROOM_ID_PATTERN);
});

test('studio passage validation preserves writing and normalizes a blank name', () => {
  const input = parsePassageInput({
    name: '   ',
    text: 'First line\n\n  Second line',
    clientId: '3E592629-EF67-45FC-ADDA-F8993D38A40A',
  });
  assert.deepEqual(input, {
    name: 'Guest',
    text: 'First line\n\n  Second line',
    clientId: '3e592629-ef67-45fc-adda-f8993d38a40a',
  });
});

test('studio rejects empty, oversized, and malformed passages', () => {
  const base = { name: 'Pat', text: 'a story', clientId: '0123456789abcdef0123456789abcdef' };
  assert.equal(parsePassageInput(null), null);
  assert.equal(parsePassageInput({ ...base, text: '  \n ' }), null);
  assert.equal(parsePassageInput({ ...base, name: 'x'.repeat(33) }), null);
  assert.equal(parsePassageInput({ ...base, text: 'x'.repeat(3001) }), null);
  assert.equal(parsePassageInput({ ...base, clientId: 'guessable-id' }), null);
  assert.equal(parsePassageInput({ ...base, text: 42 }), null);
  assert.equal(MAX_PASSAGES, 200);
  assert.ok(MAX_BODY_BYTES > 3000);
});
