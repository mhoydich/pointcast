import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOTION, cancelMotion, flickProjection, playMotion, springFrames, staggerDelay,
} from '../public/loom/kit/motion.mjs';

test('motion timings and list stagger stay inside the Loom Kit budgets', () => {
  const { press, release, cardOut, cardIn, sheet, fade, stagger, listBudget, easing } = MOTION;
  assert.deepEqual(
    { press, release, cardOut, cardIn, sheet, fade, stagger, listBudget, easing },
    {
      press: 80, release: 220, cardOut: 300, cardIn: 260, sheet: 380, fade: 150,
      stagger: 30, listBudget: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    },
  );
  assert.deepEqual([0, 1, 2].map(staggerDelay), [0, 30, 60]);
  assert.ok(staggerDelay(20) + MOTION.listItem <= listBudget);
  assert.equal(staggerDelay(100), staggerDelay(20));
});

test('spring release starts at the pressed scale, overshoots, and settles', () => {
  const scales = springFrames('scale(0.97)').map(({ transform }) => Number(transform.match(/scale\(([^)]+)\)/)[1]));
  assert.equal(scales[0], 0.97);
  assert.equal(Math.max(...scales), 1.02);
  assert.equal(scales.at(-1), 1);
});

test('card flick projects its velocity and caps rotation at six degrees', () => {
  const slow = flickProjection({ x: 24, y: 4, vx: 0.1, vy: 0.1 }, 320);
  const fast = flickProjection({ x: 24, y: 4, vx: 6, vy: 1 }, 320);
  const opposite = flickProjection({ x: -24, y: 4, vx: -6, vy: 1 }, 320);

  assert.ok(slow.x > 0);
  assert.ok(fast.x > slow.x);
  assert.ok(fast.y > slow.y);
  assert.ok(opposite.x < 0);
  for (const { x, y, angle } of [slow, fast, opposite]) {
    assert.ok([x, y, angle].every(Number.isFinite));
    assert.ok(Math.abs(angle) <= 6);
  }
});

const frames = [{ transform: 'translateX(0px)', opacity: 1 }, { transform: 'translateX(80px)', opacity: 0 }];

function motionTarget({ reduced = false, rejectOnCancel = true } = {}) {
  const view = { matchMedia: (query) => ({ matches: reduced && query === '(prefers-reduced-motion: reduce)' }) };
  const calls = [];
  const element = {
    ownerDocument: { defaultView: view },
    animate(keyframes, options) {
      const { promise, resolve, reject } = Promise.withResolvers();
      const run = {
        keyframes,
        options,
        finished: promise,
        finish: resolve,
        cancellations: 0,
        cancel() {
          run.cancellations++;
          if (rejectOnCancel) reject(new DOMException('Animation canceled', 'AbortError'));
        },
      };
      calls.push(run);
      return run;
    },
  };
  return { element, calls };
}

test('reduced motion replaces movement and stagger with an opacity-only fade', async () => {
  const { element, calls } = motionTarget({ reduced: true });
  const completion = playMotion(element, frames, { duration: MOTION.cardOut, delay: 90 });
  assert.equal(calls.length, 1);
  const [run] = calls;
  assert.equal(run.options.duration, MOTION.fade);
  assert.equal(run.options.delay ?? 0, 0);
  assert.ok(run.keyframes.length >= 2);
  for (const frame of run.keyframes) {
    assert.equal(typeof frame.opacity, 'number');
    assert.ok(Object.keys(frame).every((key) => ['opacity', 'offset', 'easing', 'composite'].includes(key)));
  }
  assert.notEqual(run.keyframes[0].opacity, run.keyframes.at(-1).opacity);
  run.finish();
  assert.equal(await completion, true);
});

test('replacement cancels the old run and late completion cannot clear the new one', async () => {
  const { element, calls } = motionTarget({ rejectOnCancel: false });
  const old = playMotion(element, frames, { duration: MOTION.cardOut });
  const current = playMotion(element, frames, { duration: MOTION.cardIn });
  assert.equal(calls[0].cancellations, 1);
  assert.equal(calls[1].cancellations, 0);
  assert.deepEqual(calls[1].keyframes, frames);
  assert.equal(calls[1].options.duration, MOTION.cardIn);

  calls[0].finish();
  assert.equal(await old, false);
  calls[1].finish();
  assert.equal(await current, true);
});

test('explicit cancellation resolves false and a later run can still finish', async () => {
  const { element, calls } = motionTarget();
  const canceled = playMotion(element, frames, { duration: MOTION.cardOut });
  cancelMotion(element);
  assert.equal(calls[0].cancellations, 1);
  assert.equal(await canceled, false);

  const later = playMotion(element, frames, { duration: MOTION.cardIn });
  calls[1].finish();
  assert.equal(await later, true);
});
