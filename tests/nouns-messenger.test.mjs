// Nouns Messenger backup validator. The validator lives inside public/nouns-messenger/app.js
// (no extra precached file), between the backup-validator markers, and is pure: these tests cut
// that block out and run it on its own.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '../public/nouns-messenger/app.js');
const src = readFileSync(APP, 'utf8');
const block = /\/\* backup-validator:start[^\n]*\n([\s\S]*?)\/\* backup-validator:end \*\//.exec(src)?.[1];
const validateBackup = new Function(`${block}\nreturn validateBackup;`)();
const KNOWN = { colors: ['yellow', 'red', 'green', 'blue', 'pink', 'cool', 'warm', 'ink'], bots: ['desk', 'tides', 'courts', 'night'] };
const run = (data) => validateBackup(data, KNOWN);

const good = () => ({
  app: 'nouns-messenger', version: 1, exported: '2026-10-22T10:00:00.000Z',
  me: { name: 'Mike', color: 'blue' },
  threads: [
    { id: 'c-desk', name: 'Noggles Desk', kind: 'bot', bot: 'desk', color: 'yellow', tag: 'the front desk of the town', unread: 1, created: 1, messages: [
      { id: 'abc123', from: 'them', text: 'gm', ts: 1000, status: 'read' },
      { id: 'def456', from: 'me', text: 'gm gm', ts: 2000, status: 'read', reaction: '🔥' },
    ] },
    { id: 'self', name: 'Note to self', kind: 'self', color: 'cool', tag: 'only you, only here', unread: 0, created: 1, messages: [] },
    { id: 'p-ana%20b', name: 'Ana B', kind: 'peer', color: 'pink', unread: 0, created: 1, messages: [{ id: 'x1', from: 'them', text: 'hi', ts: 5 }] },
  ],
});

test('the validator block is present in app.js', () => {
  assert.ok(block && block.includes('function validateBackup'));
});

test('a good backup passes and comes back with only checked fields', () => {
  const data = good();
  data.threads[0].evil = '<img src=x onerror=alert(1)>';
  data.threads[0].messages[0].html = '<b>x</b>';
  const out = run(data);
  assert.equal(out.threads.length, 3);
  assert.equal(out.me.name, 'Mike');
  assert.equal(out.threads[0].evil, undefined);
  assert.equal(out.threads[0].messages[0].html, undefined);
  assert.equal(out.threads[0].messages[1].reaction, '🔥');
  assert.equal(out.threads[2].messages[0].status, 'read');
});

test('markup in text is kept as plain text, not stripped or executed', () => {
  const data = good();
  data.threads[1].messages.push({ id: 'img1', from: 'me', text: '<img src=x onerror=alert(1)>', ts: 9 });
  assert.equal(run(data).threads[1].messages[0].text, '<img src=x onerror=alert(1)>');
});

test('wrong app, version or shape is rejected', () => {
  assert.throws(() => run(null));
  assert.throws(() => run([]));
  assert.throws(() => run({ ...good(), app: 'pmm' }), /not a Nouns Messenger backup/);
  assert.throws(() => run({ ...good(), version: 2 }), /version/);
  assert.throws(() => run({ ...good(), version: '1' }), /version/);
  assert.throws(() => run({ ...good(), threads: {} }), /no chats/);
});

test('length and count caps hold', () => {
  const long = good(); long.threads[0].messages[0].text = 'x'.repeat(2001);
  assert.throws(() => run(long), /longer than 2000/);
  const ok = good(); ok.threads[0].messages[0].text = 'x'.repeat(2000);
  assert.doesNotThrow(() => run(ok));
  const many = good(); many.threads = Array.from({ length: 201 }, (_, i) => ({ id: 'p-' + i, name: 'n' + i, kind: 'peer', messages: [] }));
  assert.throws(() => run(many), /too many chats/);
  const msgs = good(); msgs.threads[2].messages = Array.from({ length: 2001 }, (_, i) => ({ id: 'm' + i, from: 'me', text: 'a', ts: i }));
  assert.throws(() => run(msgs), /too many messages/);
  const name = good(); name.threads[2].name = 'n'.repeat(41);
  assert.throws(() => run(name), /too long/);
  const me = good(); me.me.name = 'n'.repeat(25);
  assert.throws(() => run(me), /too long/);
  const react = good(); react.threads[0].messages[0].reaction = 'r'.repeat(17);
  assert.throws(() => run(react), /reaction/);
});

test('wrong types and ids are rejected', () => {
  const cases = [
    (d) => { d.threads[0].messages[0].text = 42; },
    (d) => { d.threads[0].messages[0].text = ''; },
    (d) => { d.threads[0].messages[0].ts = 'yesterday'; },
    (d) => { d.threads[0].messages[0].ts = Infinity; },
    (d) => { d.threads[0].messages[0].from = 'admin'; },
    (d) => { d.threads[0].messages[0].id = '"] , * { x'; },
    (d) => { d.threads[0].messages[1].id = 'abc123'; },
    (d) => { d.threads[0].kind = 'room'; },
    (d) => { d.threads[0].bot = 'stranger'; },
    (d) => { d.threads[0].id = 'c-tides'; },
    (d) => { d.threads[1].id = 'notes'; },
    (d) => { d.threads[2].id = 'x-ana'; },
    (d) => { d.threads[2].id = 'p-<b>'; },
    (d) => { d.threads[2].id = 'self'; d.threads[2].kind = 'self'; },
    (d) => { d.threads[2].name = { toString: () => 'x' }; },
    (d) => { d.threads[2].messages = 'none'; },
    (d) => { d.threads[1] = 'thread'; },
    (d) => { d.me = 'Mike'; },
  ];
  for (const [i, change] of cases.entries()) {
    const d = good(); change(d);
    assert.throws(() => run(d), Error, `case ${i} should be rejected`);
  }
});

test('unknown colours fall back and unread is clamped', () => {
  const d = good();
  d.threads[2].color = 'url(javascript:alert(1))';
  d.threads[2].unread = 99;
  d.threads[0].unread = '3<script>';
  d.me.color = 'chartreuse';
  const out = run(d);
  assert.equal(out.threads[2].color, 'yellow');
  assert.equal(out.threads[2].unread, 1);
  assert.equal(out.threads[0].unread, 0);
  assert.equal(out.me.color, '');
});
