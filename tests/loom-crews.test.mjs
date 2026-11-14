import test from 'node:test';
import assert from 'node:assert/strict';
import { crewTemplates, crews, roomLink } from '../src/lib/loom/crews.mjs';
test('crew templates fit a Loom post and keep authority explicit', () => {
  assert.equal(crewTemplates.length, 4);
  for (const { text } of crewTemplates) assert.ok(text.length > 100 && text.length <= 2000);
  assert.match(crewTemplates[0].text, /never permission/);
  assert.match(crewTemplates[2].text, /No votes means no decision/);
});
test('reviewed crew references point to room messages, not unescaped query input', () => {
  for (const c of crews) {
    assert.match(c.room, /^#[a-z0-9-]+$/);
    assert.match(c.charterId, /^m_[a-z0-9]+$/);
    assert.match(c.amendmentId, /^m_[a-z0-9]+$/);
    const u = new URL(roomLink(c.room, c.charterId), 'https://pointcast.xyz');
    assert.equal(u.searchParams.get('to'), c.room);
    assert.equal(u.hash, '#' + c.charterId);
  }
  assert.equal(roomLink('#x&to=@bad', 'x&y'), '/loom?to=%23x%26to%3D%40bad#x%26y');
});
