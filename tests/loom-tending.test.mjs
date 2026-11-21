import test from 'node:test';
import assert from 'node:assert/strict';
import { recentLogs } from '../public/sketches/loom-tending/activity.mjs';

const now = Date.parse('2026-11-18T20:54:54.401Z');
const day = 86_400_000;
const room = messages => ({
  ok: true, spec: 'pointcast.loom/v1', kvBound: true, exists: true,
  log: { address: '#bonfire', key: 'ef0ab7326ff28ab76e7af3ed' }, messages,
});
const post = (id, ms, overrides = {}) => ({
  id, at: new Date(ms).toISOString(), from: { name: 'Window desk', kind: 'agent' },
  kind: 'note', body: 'A small contribution.', ...overrides,
});

test('includes both 24-hour boundaries once, sorted by publication time', () => {
  const oldest = post('m_000001', now - day);
  const newest = post('m_000002', now, { from: { kind: 'human', name: 'Reader' } });
  const middle = post('m_000003', now - 5);
  const logs = recentLogs(room([
    oldest, post('m_000004', now - day - 1, { editedAt: newest.at }), middle, newest,
    post('m_000005', now + 1), middle,
  ]), now);
  assert.deepEqual(logs.map(log => log.id), [newest.id, middle.id, oldest.id]);
  assert.deepEqual(logs[0], { id: newest.id, body: newest.body, at: newest.at, name: 'Reader' });
});

test('mirrors, service activity and malformed or unavailable posts do not tend the fire', () => {
  const changes = [
    { via: { address: '#loom-ux' } }, { from: { kind: 'robot', name: 'Collator' } },
    { kind: 'system' }, { from: null }, { from: { kind: 'system', name: 'House' } },
    { hidden: true }, { withdrawn: true }, { _pending: true }, { id: 'wrong' },
    { at: 'invalid' }, { at: null }, { body: '  ' },
  ];
  assert.deepEqual(recentLogs(room(changes.map((change, i) =>
    post('m_' + String(i).padStart(6, '0'), now, change))), now), []);
  const beforeWithdrawal = post('m_000022', now);
  assert.deepEqual(recentLogs(room([beforeWithdrawal, { ...beforeWithdrawal, hidden: true }]), now), []);
});

test('image-only and poll records carry readable source text', () => {
  const image = post('m_000001', now, { kind: 'image', body: '', media: { alt: 'Glowing ember' } });
  const poll = post('m_000002', now - 1, { kind: 'poll', body: '', poll: { question: 'Which wood?' } });
  assert.deepEqual(recentLogs(room([image, poll]), now).map(row => row.body), ['Glowing ember', 'Which wood?']);
});

test('a successfully read empty room is distinct from a missing or unbound source', () => {
  assert.deepEqual(recentLogs(room([]), now), []);
  for (const patch of [
    { ok: false }, { spec: 'another-api' }, { kvBound: false }, { kvBound: undefined },
    { exists: false }, { log: { address: '#bonfire', key: 'invalid' } },
    { log: { address: '#other' } }, { messages: null },
  ]) assert.throws(() => recentLogs({ ...room([]), ...patch }, now), /unavailable/);
  assert.throws(() => recentLogs(null, now), /unavailable/);
  assert.throws(() => recentLogs(room([]), NaN), /timestamp/);
});
