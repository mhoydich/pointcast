import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseFrontDoorNextDoor } from '../src/lib/front-door-next-door.ts';

test('front door chooses exactly one next door in the agreed priority order', () => {
  assert.deepEqual(chooseFrontDoorNextDoor({ claimedDays: [4], hasHandle: true, streak: 8 }), {
    href: '/bench', label: 'Sit at the bench', reason: 'First visit',
  });
  assert.deepEqual(chooseFrontDoorNextDoor({ claimedDays: [1, 4], hasHandle: true, streak: 8 }), {
    href: '/collect', label: 'See your collection', reason: 'Your dogs',
  });
  assert.deepEqual(chooseFrontDoorNextDoor({ claimedDays: [1, 2, 3, 4], hasHandle: false, streak: 3 }), {
    href: '/drum', label: 'Play the drum', reason: 'Keep the streak moving',
  });
  assert.deepEqual(chooseFrontDoorNextDoor({ claimedDays: [1, 4], hasHandle: false, streak: 1 }), {
    href: '/me', label: 'Make your handle', reason: 'One small next step',
  });
});
