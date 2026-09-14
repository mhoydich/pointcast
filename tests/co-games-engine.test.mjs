import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initial, legalHuman, legalPartner, simulate, choose, score, human, partner, threats,
  observe, validateSupportResponse,
} from '../src/lib/co-games-engine.mjs';

function play(cards) {
  let state = initial();
  const turns = [];
  for (const [spell, requestedSupport] of cards) {
    const support = requestedSupport ?? choose(state, spell);
    const forecast = simulate(state, spell, support);
    assert.ok(forecast, `legal move ${spell}/${support}`);
    turns.push({ spell, support, ...forecast });
    state = forecast.state;
  }
  return { state, turns };
}

test('two distinct timed strategies win under simultaneous combat', () => {
  for (const cards of [
    [['ember', 'ward'], ['root', 'ward'], ['ember', 'echo'], ['ember', 'echo']],
    [['focus', 'ward'], ['ember', 'ward'], ['ember', 'mend'], ['ember', 'echo']],
  ]) {
    const { state } = play(cards);
    assert.equal(state.status, 'won');
    assert.equal(state.hp, 1);
    assert.equal(state.enemy, 0);
    assert.equal(state.round, 4);
  }
});

test('the local partner supports winning plans while human choices can still lose', () => {
  for (const sequence of [
    ['ember', 'root', 'ember', 'ember'],
    ['focus', 'ember', 'root', 'ember'],
  ]) {
    const { state } = play(sequence.map(card => [card]));
    assert.equal(state.status, 'won');
    assert.equal(state.hp, 1);
  }
  const defensive = play(Array.from({ length: 4 }, () => ['root'])).state;
  assert.equal(defensive.status, 'lost');
  assert.equal(defensive.hp, 10);
  assert.equal(defensive.enemy, 6);
  const mutual = play(['focus', 'ember', 'ember', 'ember'].map(card => [card])).state;
  assert.equal(mutual.hp, 0);
  assert.equal(mutual.enemy, 0);
  assert.equal(mutual.status, 'lost');
});

test('Focus is consumed by either damaging spell without boosting support or block', () => {
  const focused = simulate(initial(), 'focus', 'echo').state;
  assert.equal(focused.focused, true);
  assert.equal(focused.focus, 0);
  const attack = simulate(focused, 'ember', 'echo');
  assert.equal(attack.humanDamage, 8);
  assert.equal(attack.damage, 10);
  assert.equal(attack.state.focused, false);
  const root = simulate(focused, 'root', 'ward');
  assert.equal(root.humanDamage, 4);
  assert.equal(root.block, 6);
  assert.equal(root.state.focused, false);
  assert.equal(simulate(root.state, 'root', 'ward').humanDamage, 2);
  assert.equal(simulate(focused, 'focus', 'ward'), null);
});

test('healing is capped before attack and excess block does not carry over', () => {
  assert.equal(simulate(initial(), 'root', 'mend').healing, 0);
  const heal = simulate({ ...initial(), hp: 13 }, 'root', 'mend');
  assert.equal(heal.healing, 1);
  assert.equal(heal.wastedHeal, 2);
  assert.equal(heal.state.hp, 13);
  const blocked = simulate(initial(), 'root', 'ward');
  assert.equal(blocked.wastedBlock, 2);
  const next = simulate(blocked.state, 'ember', 'echo');
  assert.equal(next.block, 0);
  assert.equal(next.taken, 6);
});

test('invalid, exhausted and terminal moves fail without mutating the state', () => {
  const state = initial();
  const before = structuredClone(state);
  const first = simulate(state, 'ember', 'ward');
  assert.deepEqual(state, before);
  assert.deepEqual(first, simulate(state, 'ember', 'ward'));
  for (const [spell, support] of [['__proto__', 'ward'], ['ember', 'constructor'], ['missing', 'echo']]) {
    assert.equal(simulate(state, spell, support), null);
  }
  assert.equal(choose(state, 'missing'), null);
  assert.equal(simulate({ ...state, ember: 0 }, 'ember', 'ward'), null);
  assert.equal(simulate({ ...state, ward: 0 }, 'ember', 'ward'), null);
  for (const bad of [null, {}, { ...state, round: 4 }, { ...state, hp: NaN }, { ...state, echo: -1 }]) {
    assert.deepEqual(legalHuman(bad), []);
    assert.equal(simulate(bad, 'root', 'ward'), null);
    assert.equal(choose(bad, 'root'), null);
  }
  const mutual = simulate({ ...state, hp: 1, enemy: 1 }, 'ember', 'echo').state;
  assert.equal(mutual.hp, 0);
  assert.equal(mutual.enemy, 0);
  assert.equal(mutual.status, 'lost');
  const timeout = simulate({ ...state, round: 3 }, 'root', 'ward').state;
  assert.equal(timeout.round, 4);
  assert.equal(timeout.status, 'lost');
  assert.equal(simulate(timeout, 'root', 'echo'), null);
  assert.equal(choose(timeout, 'root'), null);
});

test('every reachable state terminates within four turns with bounded resources and legal partner choices', () => {
  const visited = new Set();
  let wins = 0, losses = 0, transitions = 0;
  function walk(state) {
    const key = JSON.stringify(state);
    if (visited.has(key)) return;
    visited.add(key);
    assert.ok(state.hp >= 0 && state.hp <= 14);
    assert.ok(state.enemy >= 0 && state.enemy <= 18);
    assert.ok(state.round >= 0 && state.round <= 4);
    for (const stock of ['ember', 'focus', 'echo', 'ward', 'mend']) assert.ok(state[stock] >= 0);
    if (state.status !== 'playing') {
      assert.deepEqual(legalHuman(state), []);
      assert.deepEqual(legalPartner(state), []);
      if (state.status === 'won') { wins++; assert.ok(state.hp > 0 && state.enemy === 0); }
      else { losses++; assert.ok(state.hp === 0 || state.round === 4); }
      return;
    }
    for (const spell of legalHuman(state)) {
      const support = choose(state, spell);
      assert.ok(legalPartner(state).includes(support));
      assert.equal(support, choose(state, spell));
      const possible = legalPartner(state).map(card => score(simulate(state, spell, card).state));
      if (possible.some(value => value >= 10000)) {
        assert.ok(score(simulate(state, spell, support).state) >= 10000, 'partner preserves a winning continuation');
      }
      for (const card of legalPartner(state)) {
        const result = simulate(state, spell, card);
        transitions++;
        assert.equal(result.state.round, state.round + 1);
        walk(result.state);
      }
    }
  }
  walk(initial());
  assert.ok(visited.size > 300 && transitions > 900, 'explored the full branching game');
  assert.ok(wins > 0 && losses > 0);
});

test('observation copies state and accepts only currently legal, matching support responses', () => {
  const state = initial();
  const observation = observe(state, 'ember', 'game-a');
  const response = { gameId: 'game-a', revision: 0, selectedHuman: 'ember', support: 'echo' };
  assert.deepEqual(validateSupportResponse(observation, response), { ok: true, support: 'echo' });
  state.hp = 1;
  assert.equal(observation.state.hp, 14);
  assert.ok(Object.isFrozen(observation.state));
  assert.ok(Object.isFrozen(human.ember) && Object.isFrozen(partner.ward) && Object.isFrozen(threats));
  assert.deepEqual(observation.legalSupports, ['echo', 'ward', 'mend']);
  assert.equal(observation.protocol, 'pointcast.co-games.v1');
  assert.throws(() => observe(initial(), 'ember', ''));
  assert.throws(() => observe(initial(), 'invalid', 'game-a'));
  for (const malformed of [null, [], 'echo']) {
    assert.equal(validateSupportResponse(observation, malformed).reason, 'invalid-response');
  }
  for (const support of ['unknown', 'constructor', null]) {
    assert.equal(validateSupportResponse(observation, { ...response, support }).reason, 'illegal-support');
  }
  const replay = observe(initial(), 'ember', 'game-b');
  assert.equal(validateSupportResponse(replay, response).reason, 'game-mismatch');
  const changed = observe(initial(), 'root', 'game-a');
  assert.equal(validateSupportResponse(changed, response).reason, 'selection-mismatch');
  const next = observe(simulate(initial(), 'ember', 'echo').state, 'ember', 'game-a');
  assert.equal(validateSupportResponse(next, response).reason, 'stale-revision');
  const exhausted = observe({ ...initial(), echo: 0 }, 'ember', 'game-a');
  assert.equal(validateSupportResponse(exhausted, response).reason, 'illegal-support');
});
