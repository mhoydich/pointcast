// Stretch with Claude: session shape, timing, breath phases, mood lines, and the stretch:v1 record.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOODS, POSES, SESSIONS, buildTimeline, breathAt, formatClock, frameAt, getPose, getSession, locate,
  moodLine, parseStore, rasterize, recordSession, siteMoodFor, startOf, suggestFor,
} from '../src/lib/stretch.mjs';

test('three sessions of 2, 5 and 8 minutes, each 5 to 9 known poses that add up exactly', () => {
  assert.deepEqual(SESSIONS.map((s) => [s.id, s.minutes]), [['phone-neck', 2], ['desk-reset', 5], ['evening-unwind', 8]]);
  for (const s of SESSIONS) {
    assert.ok(s.steps.length >= 5 && s.steps.length <= 9, `${s.id} has ${s.steps.length} poses`);
    for (const [id, sec] of s.steps) {
      assert.ok(getPose(id), `${s.id} names unknown pose ${id}`);
      assert.ok(Number.isInteger(sec) && sec >= 10, `${s.id}/${id} lasts ${sec}s`);
    }
    assert.equal(buildTimeline(s).total, s.minutes * 60, `${s.id} adds up`);
    assert.equal(s.steps.at(-1)[0], 'box-breath', `${s.id} closes with box breathing`);
  }
});

test('every pose has copy, a breath pattern and two frames with the same joints', () => {
  const joints = ['head', 'neck', 'lSh', 'rSh', 'lEl', 'rEl', 'lHa', 'rHa', 'hip', 'lKn', 'rKn', 'lFt', 'rFt'];
  for (const p of POSES) {
    for (const k of ['name', 'instruction', 'breath', 'easeOff']) assert.ok(p[k]?.length > 10 || k === 'name', `${p.id}.${k}`);
    assert.match(p.easeOff, /^Ease off if /);
    assert.equal(p.pattern.length, 4);
    assert.ok(p.pattern[0] > 0 && p.pattern[2] > 0);
    assert.equal(p.frames.length, 2);
    for (const f of p.frames) for (const j of joints) assert.ok(Array.isArray(f[j]), `${p.id} frame lacks ${j}`);
    assert.deepEqual(Object.keys(p.frames[0]).sort(), Object.keys(p.frames[1]).sort(), `${p.id} frames differ in joints`);
    assert.ok(['chair', 'stand', 'floor'].includes(p.setting));
  }
  // Box breathing counts four, four, four, four.
  assert.deepEqual(getPose('box-breath').pattern, [4, 4, 4, 4]);
});

test('locate walks the timeline and clamps at both ends', () => {
  const tl = buildTimeline(getSession('phone-neck'));
  assert.equal(locate(tl, -5).index, 0);
  assert.equal(locate(tl, 0).step.poseId, 'neck-tilt');
  assert.equal(locate(tl, 19.9).index, 0);
  assert.equal(locate(tl, 20).index, 1);
  const mid = locate(tl, 45);
  assert.equal(mid.index, 2);
  assert.equal(mid.inStep, 5);
  assert.equal(mid.stepLeft, 15);
  assert.equal(mid.left, 75);
  assert.equal(mid.done, false);
  const end = locate(tl, 999);
  assert.equal(end.done, true);
  assert.equal(end.index, tl.steps.length - 1);
  assert.equal(end.left, 0);
  assert.equal(locate(tl, 'nonsense').index, 0);
});

test('startOf clamps step jumps', () => {
  const tl = buildTimeline(getSession('desk-reset'));
  assert.equal(startOf(tl, 0), 0);
  assert.equal(startOf(tl, 1), 30);
  assert.equal(startOf(tl, -3), 0);
  assert.equal(startOf(tl, 99), tl.steps.at(-1).start);
});

test('breathAt cycles in, hold, out, hold and drives the figure mix', () => {
  const box = [4, 4, 4, 4];
  assert.equal(breathAt(box, 0).phase, 'in');
  assert.equal(breathAt(box, 0).count, 1);
  assert.equal(breathAt(box, 3.5).count, 4);
  assert.equal(breathAt(box, 2).mix, 0.5);
  assert.equal(breathAt(box, 5).phase, 'hold');
  assert.equal(breathAt(box, 5).mix, 1);
  assert.equal(breathAt(box, 10).phase, 'out');
  assert.equal(breathAt(box, 10).mix, 0.5);
  assert.equal(breathAt(box, 13).phase, 'rest');
  assert.equal(breathAt(box, 13).mix, 0);
  assert.equal(breathAt(box, 16).phase, 'in', 'wraps every 16 seconds');
  // No holds: in then straight out.
  assert.equal(breathAt([3, 0, 3, 0], 3).phase, 'out');
  assert.equal(breathAt([3, 0, 3, 0], 6).phase, 'in');
  for (let t = 0; t < 40; t += 0.25) {
    const b = breathAt([4, 1, 5, 0], t);
    assert.ok(b.mix >= 0 && b.mix <= 1 && b.progress >= 0 && b.progress < 1);
  }
});

test('formatClock rounds up to whole seconds', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(4.2), '0:05');
  assert.equal(formatClock(120), '2:00');
  assert.equal(formatClock(479.1), '8:00');
  assert.equal(formatClock(-3), '0:00');
});

test('mood lines, suggestions and site mood mapping', () => {
  assert.equal(MOODS.length, 8);
  assert.equal(moodLine('tired', 'calm'), 'You came in tired, you leave calm.');
  assert.match(moodLine('calm', 'calm'), /^You came in calm, and you leave calm\./);
  assert.equal(moodLine(null, 'sunny'), 'You leave sunny.');
  assert.equal(moodLine('nope', null), 'You finished. That is enough.');
  assert.equal(suggestFor('tired'), 'evening-unwind');
  assert.equal(suggestFor('hyped'), 'desk-reset');
  assert.equal(suggestFor('calm'), 'phone-neck');
  for (const m of MOODS) assert.ok(getSession(suggestFor(m.id)));
  assert.equal(siteMoodFor('calm'), 'chill');
  assert.equal(siteMoodFor('sunny'), null, 'no plain site match, so pc:mood is left alone');
});

test('stretch:v1 parsing survives junk and keeps ten entries', () => {
  const fresh = parseStore(null);
  assert.deepEqual(fresh, { v: 1, sound: true, sessions: 0, seconds: 0, log: [] });
  assert.deepEqual(parseStore('{not json'), fresh);
  assert.deepEqual(parseStore('{"v":2}'), fresh);
  const odd = parseStore(JSON.stringify({ v: 1, sound: false, sessions: -4, seconds: 'x', log: [{ session: 'bogus' }, { session: 'phone-neck', before: 'zzz', after: 'low' }] }));
  assert.equal(odd.sound, false);
  assert.equal(odd.sessions, 0);
  assert.deepEqual(odd.log, [{ session: 'phone-neck', before: null, after: 'low', at: '' }]);
  let s = fresh;
  for (let i = 0; i < 12; i++) s = recordSession(s, { session: 'desk-reset', before: 'salty', after: 'calm', seconds: 300, at: `t${i}` });
  assert.equal(s.sessions, 12);
  assert.equal(s.seconds, 3600);
  assert.equal(s.log.length, 10);
  assert.equal(s.log[0].at, 't2');
  assert.equal(fresh.sessions, 0, 'recordSession does not mutate its input');
});

test('the pixel figure stays on its 48 x 48 grid and changes with the breath', () => {
  for (const p of POSES) {
    const a = rasterize(frameAt(p, 1), p.setting);
    const b = rasterize(frameAt(p, 0), p.setting);
    for (const cells of [a, b]) {
      assert.ok([...cells.values()].includes('head'), `${p.id} draws a head`);
      for (const k of cells.keys()) {
        const [x, y] = k.split(',').map(Number);
        assert.ok(x >= 0 && x < 48 && y >= 0 && y < 48, `${p.id} cell ${k} off grid`);
      }
    }
    assert.notDeepEqual([...a.keys()].sort(), [...b.keys()].sort(), `${p.id} frames look identical`);
  }
});
