// node --test sketches/radio-spike/radio-frame.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeFrame, decodeFrame, FrameError, HEADER_BYTES, FRAME_MAX_BYTES, TEXT_MAX_BYTES, NOUN_MAX,
  MOODS, createSequence, createDedup, createLimiter, textBudget, hex, fromHex, isWellFormed,
} from './radio-frame.mjs';

const alias = fromHex('a1b2c3d4');
const base = { alias, messageId: 7, mood: 1 };
const rejects = (bytes, code) => assert.throws(() => decodeFrame(bytes), e => e instanceof FrameError && e.code === code, `expected ${code}`);

test('seven moods, ids 1..7, names preserved', () => {
  assert.deepEqual(MOODS.map(m => m.id), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(MOODS.map(m => m.name), ['Calm', 'Hype', 'Love', 'Silly', 'Focus', 'Storm', 'Goodnight']);
});

test('mood-only frame is exactly 13 bytes and round-trips', () => {
  const f = encodeFrame(base);
  assert.equal(f.length, HEADER_BYTES);
  assert.equal(hex(f), '4c5201' + '01' + 'a1b2c3d4' + '0007' + '01' + '00' + '00');
  const d = decodeFrame(f);
  assert.equal(d.type, 1); assert.equal(d.mood, 1); assert.equal(d.moodName, 'Calm');
  assert.equal(d.alias, 'a1b2c3d4'); assert.equal(d.messageId, 7); assert.equal(d.text, ''); assert.equal(d.noun, null);
});

test('ASCII text round-trips', () => {
  const d = decodeFrame(encodeFrame({ ...base, mood: 2, text: 'game on' }));
  assert.equal(d.type, 2); assert.equal(d.text, 'game on'); assert.equal(d.moodName, 'Hype');
});

test('multibyte emoji round-trips and counts bytes, not characters', () => {
  const text = 'love 💛🌊'; // 5 + 4 + 4 = 13 bytes
  assert.equal(textBudget(text).bytes, 13);
  const f = encodeFrame({ ...base, mood: 3, text });
  assert.equal(f.length, HEADER_BYTES + 13);
  assert.equal(decodeFrame(f).text, text);
});

test('32-byte boundary accepted, 33 rejected without truncation', () => {
  const t32 = 'abcdefghijklmnopqrstuvwxyz012345';
  assert.equal(textBudget(t32).bytes, TEXT_MAX_BYTES);
  assert.equal(decodeFrame(encodeFrame({ ...base, text: t32 })).text, t32);
  assert.throws(() => encodeFrame({ ...base, text: t32 + '6' }), e => e.code === 'text_too_long');
  const budget = textBudget('éééééééééééééééé' + 'é'); // 17 × 2 = 34 bytes
  assert.equal(budget.over, 2); assert.equal(budget.remaining, 0);
});

test('noun field: 47-byte max frame, NOUN_MAX enforced', () => {
  const t32 = '01234567890123456789012345678901';
  const f = encodeFrame({ ...base, text: t32, noun: NOUN_MAX });
  assert.equal(f.length, FRAME_MAX_BYTES);
  const d = decodeFrame(f);
  assert.equal(d.noun, NOUN_MAX); assert.equal(d.text, t32);
  assert.throws(() => encodeFrame({ ...base, noun: NOUN_MAX + 1 }), e => e.code === 'noun');
  const bad = encodeFrame({ ...base, noun: 0 });
  bad[13] = 0xff; bad[14] = 0xff; // 65535 > NOUN_MAX
  rejects(bad, 'noun');
});

test('golden frames exist at every exact length: 13, 15, 14..45, 16..47', () => {
  const lengths = new Set();
  for (let L = 0; L <= TEXT_MAX_BYTES; L++) {
    const text = 'x'.repeat(L);
    lengths.add(encodeFrame({ ...base, text }).length);
    lengths.add(encodeFrame({ ...base, text, noun: 1 }).length);
  }
  for (let n = 13; n <= 47; n++) assert.ok(lengths.has(n), `no frame of length ${n}`);
});

test('rejections: magic, version, type, mood, reserved bits, lengths, utf-8', () => {
  const good = encodeFrame({ ...base, mood: 2, text: 'hi' });
  const mut = (i, v) => { const c = new Uint8Array(good); c[i] = v; return c; };
  rejects(mut(0, 0x43), 'magic');            // "CR"
  rejects(mut(2, 2), 'version');
  rejects(mut(2, 0), 'version');
  rejects(mut(3, 0), 'type');
  rejects(mut(3, 3), 'type');
  rejects(mut(10, 0), 'mood');
  rejects(mut(10, 8), 'mood');
  rejects(mut(11, 0x02), 'flags');
  rejects(mut(11, 0x80), 'flags');
  rejects(mut(12, 3), 'length');             // declares more than present
  rejects(good.subarray(0, 14), 'length');   // truncated
  const trailing = new Uint8Array(good.length + 1); trailing.set(good); rejects(trailing, 'length');
  rejects(new Uint8Array(12), 'length');
  rejects(new Uint8Array(48), 'length');
  const moodWithText = mut(3, 1); rejects(moodWithText, 'length'); // type 1 must have L = 0
  const textNoLen = encodeFrame(base); textNoLen[3] = 2; rejects(textNoLen, 'length'); // type 2 needs L >= 1
  // malformed UTF-8: lone continuation byte, overlong "/" (C0 AF), encoded surrogate (ED A0 80)
  for (const bytes of [[0x80, 0x41], [0xc0, 0xaf], [0xed, 0xa0, 0x80]]) {
    const f = new Uint8Array(HEADER_BYTES + bytes.length);
    f.set(good.subarray(0, HEADER_BYTES)); f[12] = bytes.length; f.set(bytes, HEADER_BYTES);
    rejects(f, 'utf8');
  }
  assert.throws(() => encodeFrame({ ...base, text: '\ud83d' }), e => e.code === 'text'); // lone surrogate
});

test('surrogates: every pair is checked; mixed valid + unpaired is rejected', () => {
  const ok = ['😀', '😀😀', 'a😀b', '💛🌊💛🌊💛🌊💛🌊'];
  for (const t of ok) { assert.equal(isWellFormed(t), true, t); assert.equal(decodeFrame(encodeFrame({ ...base, text: t })).text, t); }
  const bad = {
    'emoji then lone high':  '\u{1F600}\ud83d',
    'lone high then emoji':  '\ud83d\u{1F600}',
    'lone low':              '\udc00',
    'emoji then lone low':   '\u{1F600}\udc00',
    'high high':             '\ud83d\ud83d',
    'low then high':         '\udc00\ud83d',
    'high at end of text':   'abc\ud83d',
  };
  for (const [name, t] of Object.entries(bad)) {
    assert.equal(isWellFormed(t), false, name);
    assert.throws(() => encodeFrame({ ...base, text: t }), e => e.code === 'text', name);
  }
  assert.equal(textBudget('😀').bytes, 4);
});

test('two tabs never share a wire alias, even on a shared store with interleaved reads and writes', () => {
  // A deliberately non-atomic shared store: every get() and set() is interleaved between the
  // two instances at the storage layer, the way two tabs on localStorage can interleave.
  let saved = null;
  const trace = [];
  const shared = who => ({ get: () => { trace.push(`${who}:get`); return saved; }, set: v => { trace.push(`${who}:set`); saved = v; } });
  const a = createSequence(shared('a'), { owner: 'aaaaaaaa' });
  const b = createSequence(shared('b'), { owner: 'bbbbbbbb' });   // constructed after a wrote: sees a's live owner
  assert.notEqual(a.aliasHex, b.aliasHex, 'second instance on an owned store takes its own alias');
  const seen = new Set();
  for (let i = 0; i < 200; i++) {                      // interleave at take() granularity: a, b, b, a, a, b ...
    const inst = [a, b, b, a, a, b][i % 6];
    const key = `${inst.aliasHex}:${inst.take()}`;
    assert.equal(seen.has(key), false, `duplicate ${key}`);
    seen.add(key);
  }
  assert.equal(seen.size, 200);
  const d = createDedup(512);
  for (const k of seen) { const [al, id] = k.split(':'); assert.equal(d.accept(al, +id), true); }
  // both instances handed out the full 0..99 run under their own alias: allocation never depended on a read
  assert.deepEqual([...seen].filter(k => k.startsWith(a.aliasHex)).map(k => +k.split(':')[1]).sort((x, y) => x - y), [...Array(100).keys()]);
  assert.ok(trace.filter(t => t.endsWith(':get')).length <= 2, 'the store is only read at construction, never during take()');
});

test('owner token: default options give a fresh call sign per load; only the same owner continues a saved alias', () => {
  let saved = null;
  const store = { get: () => saved, set: v => { saved = v; } };
  const first = createSequence(store);                              // as index.html wires it: random owner
  first.take(); first.take();
  const reload = createSequence(store);                             // page reload with default options
  assert.notEqual(reload.aliasHex, first.aliasHex, 'reload → new call sign');
  assert.equal(reload.take(), 0, 'and ids restart at 0 under the new alias');
  const owned = createSequence(store, { owner: 'aaaaaaaa' });
  owned.take(); owned.take(); owned.take();
  const continued = createSequence(store, { owner: 'aaaaaaaa' });   // explicit same owner (not used by the harness)
  assert.equal(continued.aliasHex, owned.aliasHex);
  assert.equal(continued.take(), 3, 'same owner continues the sequence');
  const copy = { get: () => saved, set: () => {} };                 // duplicated tab starts with a copy of the store
  const dup = createSequence(copy, { owner: 'cccccccc' });
  assert.notEqual(dup.aliasHex, owned.aliasHex, 'copied store with another owner → fresh alias');
  assert.equal(dup.take(), 0);
  // legacy store without an owner token is adopted (one-time migration)
  saved = JSON.stringify({ alias: 'deadbeef', next: 5 });
  const legacy = createSequence(store, { owner: 'dddddddd' });
  assert.equal(legacy.aliasHex, 'deadbeef'); assert.equal(legacy.take(), 5);
});

test('dedup: repeated intentional sends are distinct; the same frame twice is suppressed', () => {
  const d = createDedup(4);
  assert.equal(d.accept('a1b2c3d4', 1), true);
  assert.equal(d.accept('a1b2c3d4', 1), false);
  assert.equal(d.accept('a1b2c3d4', 2), true);
  assert.equal(d.accept('ffffffff', 1), true);
  d.accept('a', 9); d.accept('b', 9); // overflow evicts oldest
  assert.equal(d.accept('a1b2c3d4', 1), true, 'evicted key is accepted again (bounded memory)');
});

test('sequence persists, wraps at 65535 and rotates alias', () => {
  let saved = null;
  const store = { get: () => saved, set: v => { saved = v; } };
  const s = createSequence(store, { owner: 'ab12ab12' });
  const a = s.aliasHex;
  assert.equal(s.take(), 0); assert.equal(s.take(), 1);
  const s2 = createSequence(store, { owner: 'ab12ab12' }); // same tab after reload
  assert.equal(s2.aliasHex, a); assert.equal(s2.take(), 2);
  saved = JSON.stringify({ alias: a, next: 0xffff, owner: 'ab12ab12' });
  const s3 = createSequence(store, { owner: 'ab12ab12' });
  assert.equal(s3.take(), 0xffff);
  assert.notEqual(s3.aliasHex, a, 'alias rotates on wrap');
  assert.equal(s3.take(), 0);
});

test('limiter: burst then rate', () => {
  const l = createLimiter({ rate: 1, burst: 2 });
  assert.equal(l.allow(0), true); assert.equal(l.allow(0), true); assert.equal(l.allow(0), false);
  assert.equal(l.allow(1000), true);
});
