import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { recentNotes } from '../public/unit-02/build-log.mjs';

const snapshot = messages => ({ ok: true, log: { address: '#unit-02' }, messages });
const post = (id, extra = {}) => ({ id: 'm_' + id, body: 'Field note', ...extra });

test('the four newest visible notes retain their public Loom message IDs', () => {
  const messages = [
    post('old'), post('a'), post('b'), post('c'), post('d'),
    post('takedown', { hidden: true }), post('withdrawn', { withdrawnAt: '2026-11-27' }),
    post('not valid'), post('blank', { body: '  ' }),
  ];
  assert.deepEqual(recentNotes(snapshot(messages)).map(message => message.id), ['m_d','m_c','m_b','m_a']);
  assert.deepEqual(recentNotes(snapshot([])), []);
  assert.throws(() => recentNotes({ ok: true, log: { address: '#officenoun' }, messages }));
});

test('shipped model decompresses to a self-contained GLB and retains the named sections', () => {
  const bytes = gunzipSync(readFileSync(new URL('../public/unit-02/studio/station.glb.gz', import.meta.url)));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const scene = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  assert.equal(scene.asset.version, '2.0');
  assert.ok(scene.buffers.every(buffer => !buffer.uri));
  for (const name of ['Near shell', 'Roof', 'Running gear']) {
    assert.ok(scene.nodes.some(node => node.name === name), name);
  }
});
