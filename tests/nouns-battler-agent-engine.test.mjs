import assert from 'node:assert/strict';
import test from 'node:test';
import { performance } from 'node:perf_hooks';
import { catalog, parseMatchInput, rulesVersion, simulateMatch } from '../public/games/nouns-nation-battler/agent-engine.mjs';

const roster = { runner: 3, bonker: 3, slinger: 3, captain: 1, healer: 2 };
const config = (tactic = 'rush', gang = 'tomato-noggles') => ({ gang, tactic, roster: { ...roster } });

test('catalog preserves eight league gangs and five recognizable roles, explicitly separate rules', () => {
  assert.equal(catalog.gangs.length, 8);
  assert.equal(catalog.roles.length, 5);
  assert.equal(catalog.roles.find(role => role.id === 'captain').hp, 132);
  assert.equal(catalog.roles.find(role => role.id === 'bonker').damage, 15);
  assert.equal(catalog.roles.find(role => role.id === 'slinger').range, 96);
  assert.match(catalog.description, /separate 12v12 exhibition/);
  assert.equal(catalog.rulesVersion, rulesVersion);
  assert.ok(Object.isFrozen(catalog.defaultRoster));
});

test('strict parsing supports seed zero and uint32 endpoints; returned rosters are independent', () => {
  assert.equal(parseMatchInput({}).seed, 0);
  assert.equal(parseMatchInput({ seed: 0 }).seed, 0);
  assert.equal(parseMatchInput({ seed: 4294967295 }).seed, 4294967295);
  const a = parseMatchInput({}), b = parseMatchInput({});
  a.left.roster.runner = 0;
  assert.equal(b.left.roster.runner, 3);
  assert.equal(catalog.defaultRoster.runner, 3);
});

test('malformed, oversized, fractional and unknown inputs fail before simulation', () => {
  for (const bad of [null, [], 'match', true, 5, { extra: true }, { seed: -1 }, { seed: 4294967296 }, { seed: NaN }, { seed: Infinity }, { seed: 1.5 }, { seed: '0' },
    { left: null }, { left: [] }, { right: { agentScript: 'while(true){}' } }, { left: { gang: '__proto__' } }, { right: { tactic: 'always-win' } },
    { left: { roster: {} } }, { left: { roster: { ...roster, runner: 2.5 } } }, { right: { roster: { ...roster, captain: 3 } } },
    { left: { roster: { ...roster, healer: 4 } } }, { right: { roster: { ...roster, runner: -1 } } }, { left: { roster: { ...roster, slinger: 7 } } },
    { left: { roster: { ...roster, extra: 0 } } }, { right: { roster: { ...roster, runner: 2 } } }]) assert.throws(() => parseMatchInput(bad));
  assert.throws(() => parseMatchInput(JSON.parse('{"__proto__":{}}')));
});

test('same seed and input reproduce byte-identical events, frames and results without input mutation', () => {
  const input = parseMatchInput({ seed: 0 });
  const before = JSON.stringify(input);
  const first = simulateMatch(input);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(first, simulateMatch(input));
  assert.notDeepEqual(first.frames, simulateMatch({ ...input, seed: 1 }).frames);
  assert.equal(first.frames[0].tick, 0);
  assert.equal(first.frames.at(-1).tick, first.ticks);
  assert.equal(first.events.at(-1).type, 'result');
});

test('mirror-identical teams draw instead of awarding an iteration-order advantage', () => {
  for (const seed of [0, 1, 42, 4294967295]) for (const tactic of ['rush', 'guard', 'flank']) {
    const match = simulateMatch({ seed, left: config(tactic), right: config(tactic) });
    assert.equal(match.winner, 'draw', `seed ${seed}, ${tactic}`);
    assert.equal(match.survivors.left, match.survivors.right);
    assert.equal(match.health.left, match.health.right);
    for (const frame of match.frames) for (let i = 0; i < 12; i++) {
      const a = frame.units[i], b = frame.units[i + 12];
      assert.equal(a[1] + b[1], 1000);
      assert.equal(a[2], b[2]);
      assert.equal(a[3], b[3]);
    }
  }
});

test('swapping unequal teams mirrors the outcome and gang identity grants no hidden power', () => {
  const left = config('flank'), right = config('guard', 'mint-condition');
  right.roster = { runner: 1, bonker: 5, slinger: 2, captain: 2, healer: 2 };
  for (const seed of [0, 17, 900]) {
    const a = simulateMatch({ seed, left, right }), b = simulateMatch({ seed, left: right, right: left });
    assert.equal(a.ticks, b.ticks);
    assert.equal(a.survivors.left, b.survivors.right);
    assert.equal(a.health.left, b.health.right);
    assert.equal(a.health.right, b.health.left);
    assert.equal(a.winner, b.winner === 'draw' ? 'draw' : b.winner === 'left' ? 'right' : 'left');
  }
  const match = simulateMatch({ seed: 7, left: config('rush'), right: config('rush', 'mint-condition') });
  assert.equal(match.winner, 'draw');
});

test('tactics change movement and damage, while healing and captain rallies appear in actual exchanges', () => {
  const rush = simulateMatch({ seed: 5, left: config('rush'), right: config('rush') });
  const guard = simulateMatch({ seed: 5, left: config('guard'), right: config('guard') });
  const flank = simulateMatch({ seed: 5, left: config('flank'), right: config('flank') });
  assert.notDeepEqual(rush.frames[5], guard.frames[5]);
  assert.notDeepEqual(rush.frames[0], flank.frames[0]);
  assert.ok(rush.events.some(event => event.type === 'heal'));
  assert.ok(rush.events.some(event => event.type === 'rally'));
  assert.ok(rush.events.some(event => event.type === 'ko'));
  for (const event of guard.events.filter(event => event.type === 'hit')) {
    const role = catalog.roles.find(item => item.id === guard.units[event.actor].role);
    assert.ok([role.damage - 2, role.damage, role.damage + 2, role.damage + 4].includes(event.amount));
  }
});

test('known opening matchups form a counter triangle instead of a dominant default tactic', () => {
  for (const [left, right, winner] of [['rush', 'guard', 'right'], ['rush', 'flank', 'left'], ['flank', 'guard', 'left']]) {
    const match = simulateMatch({ seed: 0, left: config(left), right: config(right) });
    assert.equal(match.winner, winner, `${left} versus ${right}`);
    if (left === 'flank') assert.ok(match.events.some(event => event.text.includes('around the guard')));
  }
});

test('bounded rosters terminate with integer frames, valid totals and compact replay payloads', () => {
  const start = performance.now();
  for (let seed = 0; seed < 20; seed++) {
    const input = { seed, left: config(catalog.tactics[seed % 3].id), right: config(catalog.tactics[(seed + 1) % 3].id, 'cobalt-frames') };
    if (seed % 2 === 0) input.left.roster = { runner: 0, bonker: 1, slinger: 6, captain: 2, healer: 3 };
    const match = simulateMatch(input);
    assert.ok(match.ticks > 0 && match.ticks <= catalog.limits.maxTicks);
    assert.ok(['elimination', 'time-limit'].includes(match.reason));
    assert.ok(match.frames.length <= catalog.limits.maxFrames);
    assert.ok(match.events.length <= catalog.limits.maxEvents);
    assert.ok(Buffer.byteLength(JSON.stringify(match)) <= 256 * 1024);
    assert.equal(match.units.length, 24);
    assert.equal(match.durationMs, match.ticks * 100);
    for (const frame of match.frames) {
      assert.equal(frame.units.length, 24);
      for (const [id, x, y, hp] of frame.units) {
        assert.ok([id, x, y, hp].every(Number.isInteger));
        assert.ok(x >= 20 && x <= 980 && y >= 20 && y <= 580);
        assert.ok(hp >= 0 && hp <= match.units[id].maxHp);
      }
    }
    for (const side of ['left', 'right']) {
      const final = match.frames.at(-1).units.filter(([id]) => match.units[id].side === side);
      assert.equal(match.survivors[side], final.filter(([, , , hp]) => hp > 0).length);
      assert.equal(match.health[side], final.reduce((sum, [, , , hp]) => sum + hp, 0));
    }
  }
  // Deliberately loose guard against accidental unbounded loops, not a benchmark.
  assert.ok(performance.now() - start < 10000, '20 bounded matches should finish within ten seconds');
});
