import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesShelfBook } from '../src/lib/bookshelf-browser.mjs';

test('shelf search combines a theme with every case-insensitive search word', () => {
  const haystack = 'The Kite Runner Khaled Hosseini memory place belonging';
  assert.equal(matchesShelfBook(haystack, ['memory', 'place'], '  KITE  Hosseini ', 'place'), true);
  assert.equal(matchesShelfBook(haystack, ['memory', 'place'], 'kite sanderson', 'all'), false);
  assert.equal(matchesShelfBook(haystack, ['memory', 'place'], 'kite', 'fantasy'), false);
  assert.equal(matchesShelfBook(haystack, ['memory', 'place'], '', 'all'), true);
});

test('shelf search handles accents and literal punctuation rather than executing a pattern', () => {
  assert.equal(matchesShelfBook('Hermann Hesse — Siddhartha', ['attention'], 'hermann hesse', 'all'), true);
  assert.equal(matchesShelfBook('Édition', [], 'edition', 'all'), true);
  assert.equal(matchesShelfBook('Mistborn Brandon Sanderson', ['fantasy'], '[.*]', 'all'), false);
});
