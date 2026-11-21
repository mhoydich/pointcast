import assert from 'node:assert/strict';
import test from 'node:test';

import { presentsResidentKey, timingSafeEqual } from '../functions/_lib/resident-key.ts';

// The resident shared secret is compared in one place, in constant time.
// A correct key behaves exactly as before; an unset key never makes anyone
// a resident.

const KEY = 'resident-key-under-test';
const withHeader = (value) => new Request('https://pointcast.test/', { headers: value === undefined ? {} : { 'X-Yard-Resident': value } });

test('timingSafeEqual: equal strings match', () => {
  assert.equal(timingSafeEqual(KEY, KEY), true);
});

test('timingSafeEqual: same length, different content does not match', () => {
  assert.equal(timingSafeEqual('abcdef', 'abcdeg'), false);
});

test('timingSafeEqual: different length does not match', () => {
  assert.equal(timingSafeEqual('abc', 'abcd'), false);
  assert.equal(timingSafeEqual('abcd', 'abc'), false);
});

test('timingSafeEqual: empty strings', () => {
  assert.equal(timingSafeEqual('', ''), true);
  assert.equal(timingSafeEqual('', 'a'), false);
});

test('presentsResidentKey: correct key passes', () => {
  assert.equal(presentsResidentKey(withHeader(KEY), { YARD_RESIDENT_KEY: KEY }), true);
});

test('presentsResidentKey: wrong key, wrong length, empty and missing header fail', () => {
  const env = { YARD_RESIDENT_KEY: KEY };
  assert.equal(presentsResidentKey(withHeader('resident-key-under-tesT'), env), false);
  assert.equal(presentsResidentKey(withHeader('short'), env), false);
  assert.equal(presentsResidentKey(withHeader(''), env), false);
  assert.equal(presentsResidentKey(withHeader(undefined), env), false);
});

test('presentsResidentKey: an unset or empty env key is never a resident', () => {
  assert.equal(presentsResidentKey(withHeader(''), {}), false);
  assert.equal(presentsResidentKey(withHeader('anything'), {}), false);
  assert.equal(presentsResidentKey(withHeader(''), { YARD_RESIDENT_KEY: '' }), false);
  assert.equal(presentsResidentKey(withHeader(undefined), { YARD_RESIDENT_KEY: undefined }), false);
});
