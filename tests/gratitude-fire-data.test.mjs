import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_LINE,
  MAX_HASH_LENGTH,
  MAX_LINE_LENGTH,
  PICTURE_HEIGHT,
  PICTURE_WIDTH,
  layoutLines,
  lineFromHash,
  normalizeLine,
  shareUrl,
} from '../src/lib/gratitude-fire.mjs';

const base = 'https://pointcast.xyz/sketches/gratitude-fire/';
const fragmentFor = line => `#${new URLSearchParams({ fire: 'hearth', line })}`;

test('gratitude defaults are one plain line and a 1200 by 630 picture', () => {
  assert.equal(DEFAULT_LINE, 'thankful for the people who keep a light on.');
  assert.equal(MAX_LINE_LENGTH, 140);
  assert.equal(MAX_HASH_LENGTH, 2400);
  assert.deepEqual([PICTURE_WIDTH, PICTURE_HEIGHT], [1200, 630]);
  for (const value of [undefined, null, '', '   ', '\n\t\r']) {
    assert.equal(normalizeLine(value), '');
    assert.equal(lineFromHash(new URL(shareUrl(base, value)).hash), DEFAULT_LINE);
  }
});

test('normalization preserves words and punctuation on one line', () => {
  assert.equal(normalizeLine('  thankful\nfor\t tea,  toast & friends.\r\n'), 'thankful for tea, toast & friends.');
  const cleaned = normalizeLine('thankful\u0000 for\u0007 tea\u001b and\u007f toast');
  assert.doesNotMatch(cleaned, /[\u0000-\u001f\u007f]/u);
  assert.doesNotMatch(cleaned, /\s{2}/u);
});

test('the URL round trip keeps punctuation, accented words, and emoji literal', () => {
  for (const line of [
    'thankful for Mum & Dad: “you + me” — 100% ♥ #home?',
    'thankful for café, piñata, 東京 and friends 🦃🌻🔥',
    'thankful for family 👨‍👩‍👧‍👦 and good food 🥧',
  ]) {
    const url = new URL(shareUrl(base, line));
    assert.equal(new URLSearchParams(url.hash.slice(1)).get('fire'), 'hearth');
    assert.equal(lineFromHash(url.hash), line);
  }
});

test('the cap counts Unicode codepoints without splitting a surrogate pair', () => {
  const line = 'a'.repeat(MAX_LINE_LENGTH - 1) + '🔥' + 'tail';
  const capped = 'a'.repeat(MAX_LINE_LENGTH - 1) + '🔥';
  assert.equal(normalizeLine(line), capped);
  assert.equal(Array.from(normalizeLine(line)).length, MAX_LINE_LENGTH);
  assert.equal(lineFromHash(new URL(shareUrl(base, line)).hash), capped);

  const emoji = '🔥'.repeat(MAX_LINE_LENGTH);
  const url = new URL(shareUrl(base, emoji + '🌻'));
  assert.ok(url.hash.length <= MAX_HASH_LENGTH);
  assert.equal(lineFromHash(url.hash), emoji);
});

test('missing, empty, invalid, malformed, and oversized fragments use the default', () => {
  for (const hash of [
    '',
    '#',
    '#line=thankful+for+you',
    '#fire=hearth',
    '#fire=hearth&line=',
    '#fire=hearth&line=++%09',
    '#fire=&line=hello',
    '#fire=candle&line=hello',
    '#fire=constructor&line=hello',
    '#fire=__proto__&line=hello',
    '#fire=hearth&line=%E0%A4%A',
    '#fire=hearth&line=%',
    '#fire=hearth&line=' + 'x'.repeat(MAX_HASH_LENGTH),
  ]) {
    assert.equal(lineFromHash(hash), DEFAULT_LINE, hash.slice(0, 80));
  }
});

test('shared links discard credentials and unrelated query parameters', () => {
  const incoming = 'https://sender:secret@example.org:8443/another-app/gratitude/?utm_source=private&line=wrong#old';
  const url = new URL(shareUrl(incoming, 'thankful for you.'));
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  assert.equal(url.search, '');
  assert.equal(url.origin, 'https://example.org:8443');
  assert.equal(url.pathname, '/another-app/gratitude/');
  assert.equal(lineFromHash(url.hash), 'thankful for you.');
});

test('markup-like words remain literal data after serialization', () => {
  const line = 'thankful for <img src=x onerror="alert(1)"> & <script>no</script> \'friends\'';
  const url = new URL(shareUrl(base, line));
  assert.equal(lineFromHash(url.hash), line);
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('line'), line);
  assert.equal(lineFromHash(fragmentFor(line)), line);
  assert.equal(url.hash.includes('<'), false);
  assert.equal(url.hash.includes('>'), false);
});

test('picture text wraps words into the available width', () => {
  const ctx = { measureText: text => ({ width: Array.from(text).length * 10 }) };
  assert.deepEqual(layoutLines(ctx, 'thankful for warm soup and good friends', 180), [
    'thankful for warm',
    'soup and good',
    'friends',
  ]);
});

test('picture text splits long unbroken words while preserving emoji', () => {
  const ctx = { measureText: text => ({ width: Array.from(text).length * 10 }) };
  const word = '🔥'.repeat(11);
  const lines = layoutLines(ctx, word, 40);
  assert.deepEqual(lines, ['🔥🔥🔥🔥', '🔥🔥🔥🔥', '🔥🔥🔥']);
  assert.equal(lines.join(''), word);
  assert.ok(lines.every(line => ctx.measureText(line).width <= 40));
});
