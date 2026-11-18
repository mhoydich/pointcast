import assert from 'node:assert/strict';
import test from 'node:test';
import { loadRoom, readRecords } from '../public/loom/studies/records.mjs';

const key = '1234567890abcdef12345678';
const from = { name: 'Desk', kind: 'agent', verified: false };
const at = '2026-11-18T00:00:00Z';
const msg = (seq, fields = {}) => ({ id: 'm_' + seq, seq, at, from, kind: 'note', body: 'Note ' + seq, ...fields });
const thread = messages => ({ ok: true, log: { address: '#grokbot', key }, messages });

test('direct messages, mirrors, local replies and declared roles retain their provenance', () => {
  const via = { key: 'eeeeeeeeeeeeeeeeeeeeeeee', id: 'm_origin', label: '#other' };
  const model = readRecords('#grokbot', thread([
    msg(4, { from: { kind: 'robot', name: 'Collator', verified: true } }),
    msg(3, { parent: 'm_2', from: { ...from, verified: true } }),
    msg(2, { via, mentions: ['@grokbot'], body: '<img src=x>' }), msg(1),
    msg(5, { from: { kind: 'human', name: 'GM' } })
  ]));
  assert.equal(model.authors.length, 4);
  const [native, mirrored, reply] = model.messages;
  assert.equal(native.sourceUrl, '/loom?to=loom%3A' + key + '%23m_1');
  assert.equal(mirrored.sourceUrl, '/loom?to=loom%3A'+via.key+'%23m_origin');
  assert.equal(mirrored.localUrl, '/loom?to=loom%3A'+key+'%23m_2');
  assert.equal(mirrored.body, '<img src=x>');
  assert.equal(mirrored.viaLabel, '#other');
  assert.equal(reply.parent, mirrored.id);
  assert.notEqual(mirrored.authorKey, reply.authorKey);
  assert.deepEqual(model.authors.map(a => a.kind), ['agent','agent','robot','human']);
});

test('only the latest 60 distinct visible messages are returned, in sequence order', () => {
  const good = Array.from({length: 65}, (_, i) => msg(i+1));
  const source = thread([null, ...good.reverse(), msg(65), msg(66,{ hidden: true }), msg(67,{withdrawn:true}), msg(68,{at:'bad'})]);
  const model = readRecords('#grokbot', source);
  assert.equal(model.totalVisible, 65);
  assert.equal(model.shown, 60);
  assert.equal(model.messages[0].seq, 6);
  assert.equal(model.messages.at(-1).seq, 65);
  assert.equal(readRecords('#grokbot', {...source, count: 70}).totalVisible, 70);
});

test('malformed mirror addresses cannot make a navigation target, unknown identities stay unclassified', () => {
  const [item] = readRecords('#grokbot', thread([msg(1, { from: {}, via: {key: 'https://bad.invalid',id:'m_1'} })])).messages;
  assert.match(item.sourceUrl, /^\/loom\?to=/);
  assert.equal(item.viaLabel, '');
  assert.equal(readRecords('#grokbot', thread([msg(1,{from:{}})])).authors[0].kind, 'unknown');
  assert.throws(() => readRecords('#grokbot', {ok:false, messages:[]}), /unreadable/);
  assert.throws(() => readRecords('#metaverse', thread([])), /unreadable/);
});

test('room loads are read-only and constrained to the supported rooms', async t => {
  let options, url;
  t.mock.method(globalThis, 'fetch', async (input, opts) => {
    options = opts; url = input;
    return {ok:true,json:async()=>thread([msg(1)])};
  });
  await assert.rejects(loadRoom('https://bad.invalid'), /Unsupported/);
  const result = await loadRoom('#grokbot');
  assert.equal(url, '/api/loom?to=%23grokbot');
  assert.equal(options.method || 'GET', 'GET');
  assert.equal(options.credentials, 'omit');
  assert.equal(result.shown, 1);
});
