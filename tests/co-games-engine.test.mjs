import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initial, legalHuman, legalPartner, simulate, choose, score, human, partner, threats,
  observe, validateSupportResponse, encounters, encounterFor, currentIntent, combos,
} from '../src/lib/co-games-engine.mjs';

function play(cards, encounterId = 'classic') {
  let state = initial(encounterId);
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

test('named encounters are immutable and cannot be replaced with arbitrary match stats', () => {
  assert.deepEqual(Object.keys(encounters), ['classic', 'garden', 'rush', 'shell', 'storm']);
  assert.equal(initial().encounter, 'classic');
  assert.equal(encounters.garden.name, 'Garden gang');
  assert.equal(encounters.rush.name, 'Snack attack');
  assert.equal(encounters.shell.name, 'Shell club');
  assert.equal(encounters.storm.name, 'Moon crew');
  assert.ok(Object.isFrozen(encounters) && Object.isFrozen(combos));
  for (const [id, config] of Object.entries(encounters)) {
    const state = initial(id);
    assert.equal(state.encounter, id);
    assert.equal(state.enemy, config.enemy);
    assert.equal(encounterFor(state), config);
    assert.deepEqual(currentIntent(state), { attack: config.threats[0], armor: config.armor[0] });
    assert.ok(Object.isFrozen(config) && Object.isFrozen(config.threats) && Object.isFrozen(config.armor));
    assert.equal(legalHuman({ ...state, enemy: config.enemy + 1 }).length, 0);
  }
  for (const id of ['unknown', '__proto__', 'constructor', '', null, 0, {}, []]) {
    assert.throws(() => initial(id), TypeError);
    const state = { ...initial(), encounter: id };
    assert.equal(encounterFor(state), null);
    assert.deepEqual(legalHuman(state), []);
    assert.equal(choose(state, 'ember'), null);
    assert.equal(score(state), -Infinity);
    assert.equal(currentIntent(state), null);
  }
  for (const extra of [{ armor: [0, 0, 0, 0] }, { threats: [0, 0, 0, 0] }, { maxHp: 999 }, { combo: true }]) {
    const state = { ...initial('shell'), ...extra };
    assert.equal(simulate(state, 'ember', 'echo'), null);
    assert.throws(() => observe(state, 'ember', 'game-a'));
  }
  const legacy = initial(); delete legacy.encounter;
  assert.equal(encounterFor(legacy), encounters.classic);
  assert.deepEqual(simulate(legacy, 'ember', 'echo'), simulate(initial(), 'ember', 'echo'));
});

test('Fireworks adds damage after Focus without multiplying support or the combo bonus', () => {
  const classic = simulate(initial(), 'ember', 'echo');
  assert.equal(classic.combo, null);
  assert.equal(classic.damage, 6);
  const fireworks = simulate(initial('garden'), 'ember', 'echo');
  assert.equal(fireworks.combo.name, 'Fireworks');
  assert.equal(fireworks.humanDamage, 4);
  assert.equal(fireworks.rawDamage, 8);
  assert.equal(fireworks.damage, 8);
  assert.equal(fireworks.state.enemy, 10);
  assert.equal(fireworks.state.ember, 2);
  assert.equal(fireworks.state.echo, 1);
  const focused = simulate(initial('garden'), 'focus', 'ward').state;
  const next = simulate(focused, 'ember', 'echo');
  assert.equal(next.humanDamage, 8);
  assert.equal(next.rawDamage, 12);
  assert.equal(next.state.focused, false);
  assert.equal(simulate(initial('garden'), 'ember', 'ward').combo, null);
});

test('Safe haven and Second wind heal before attacks, respect the health cap, and spend ordinary stocks', () => {
  const safe = simulate({ ...initial('rush'), hp: 10 }, 'root', 'ward');
  assert.equal(safe.combo.name, 'Safe haven');
  assert.equal(safe.healing, 2);
  assert.equal(safe.block, 6);
  assert.equal(safe.taken, 0);
  assert.equal(safe.state.hp, 12);
  assert.equal(safe.state.ward, 1);
  const wind = simulate({ ...initial('garden'), hp: 7 }, 'focus', 'mend');
  assert.equal(wind.combo.name, 'Second wind');
  assert.equal(wind.healing, 5);
  assert.equal(wind.state.hp, 9);
  assert.equal(wind.state.focus, 0);
  assert.equal(wind.state.mend, 0);
  assert.equal(wind.state.focused, true);
  const capped = simulate({ ...initial('garden'), hp: 13 }, 'focus', 'mend');
  assert.equal(capped.healing, 1);
  assert.equal(capped.wastedHeal, 4);
  assert.equal(capped.state.hp, 11);
  assert.equal(simulate({ ...initial(), hp: 7 }, 'root', 'ward').healing, 0);
  assert.equal(simulate({ ...initial(), hp: 7 }, 'focus', 'mend').healing, 3);
});

test('Shell club armor reduces combined damage only on the announced two rounds', () => {
  const first = simulate(initial('shell'), 'ember', 'echo');
  assert.deepEqual({ raw: first.rawDamage, armor: first.armor, damage: first.damage, hp: first.state.enemy },
    { raw: 8, armor: 2, damage: 6, hp: 14 });
  const second = simulate(first.state, 'focus', 'ward');
  assert.equal(second.rawDamage, 0);
  assert.equal(second.armor, 0, 'armor cannot absorb damage that was not dealt');
  assert.equal(second.damage, 0);
  assert.deepEqual(currentIntent(first.state), { attack: 4, armor: 2 });
  assert.deepEqual(currentIntent(second.state), { attack: 5, armor: 0 });
  const third = simulate(second.state, 'ember', 'echo');
  assert.equal(third.rawDamage, 12);
  assert.equal(third.armor, 0);
  assert.equal(third.damage, 12);
  const supportOnly = simulate(initial('shell'), 'focus', 'echo');
  assert.equal(supportOnly.rawDamage, 2);
  assert.equal(supportOnly.armor, 2);
  assert.equal(supportOnly.damage, 0);
});

test('agent snapshots carry the exact encounter rules and immutable active combos', () => {
  for (const [id, config] of Object.entries(encounters)) {
    const packet = observe(initial(id), 'ember', `game-${id}`);
    assert.equal(packet.protocol, 'pointcast.co-games.v1');
    assert.equal(packet.state.encounter, id);
    assert.equal(packet.encounter, config);
    assert.equal(packet.threats, config.threats);
    assert.equal(packet.armor, config.armor);
    assert.deepEqual(Object.keys(packet.combos), config.combos ? Object.keys(combos) : []);
    assert.ok(Object.isFrozen(packet.combos));
    const serialized = JSON.parse(JSON.stringify(packet));
    assert.deepEqual(serialized.encounter, config);
    if (config.combos) {
      assert.deepEqual(serialized.combos['ember:echo'], {
        human: 'ember', support: 'echo', name: 'Fireworks',
        description: 'Ember + Echo adds 2 damage after Focus.', bonusDamage: 2, bonusHealing: 0,
      });
      assert.equal(serialized.combos['focus:mend'].bonusHealing, 2);
      assert.equal(serialized.cards.partner.mend.heal, 3);
    }
  }
});

test('all encounters have distinct optimal human plans, with early wins and losses still possible', () => {
  const plans = {
    garden: { cards: ['ember', 'ember', 'root'], hp: 9 },
    rush: { cards: ['ember', 'ember', 'root', 'ember'], hp: 11 },
    shell: { cards: ['ember', 'focus', 'ember', 'root'], hp: 7 },
    storm: { cards: ['ember', 'ember', 'ember', 'root'], hp: 9 },
  };
  assert.equal(new Set(Object.values(plans).map(plan => plan.cards.join(','))).size, 4);
  for (const [id, plan] of Object.entries(plans)) {
    const result = play(plan.cards.map(card => [card]), id);
    assert.equal(result.state.status, 'won', id);
    assert.equal(result.state.hp, plan.hp, id);
    assert.equal(score(result.state), score(initial(id)), `${id}: the plan reaches the optimal score`);
    assert.equal(currentIntent(result.state), null);
    assert.equal(simulate(result.state, 'root', 'ward'), null);
    const defensive = play(Array.from({ length: 4 }, () => ['root']), id);
    assert.equal(defensive.state.status, 'lost', `${id}: endlessly defending leaves the opponent alive`);
  }
});

test('every new encounter exhausts a bounded legal tree and the partner preserves available wins', () => {
  for (const id of ['garden', 'rush', 'shell', 'storm']) {
    const seen = new Set();
    let wins = 0, losses = 0;
    function visit(state) {
      const key = JSON.stringify(state);
      if (seen.has(key)) return;
      seen.add(key);
      assert.equal(state.encounter, id);
      assert.ok(Number.isInteger(state.hp) && state.hp >= 0 && state.hp <= 14);
      assert.ok(Number.isInteger(state.enemy) && state.enemy >= 0 && state.enemy <= encounters[id].enemy);
      assert.ok(state.round >= 0 && state.round <= 4);
      if (state.status !== 'playing') {
        assert.equal(legalHuman(state).length, 0);
        if (state.status === 'won') { wins++; assert.ok(state.enemy === 0 && state.hp > 0); }
        else { losses++; assert.ok(state.hp === 0 || state.round === 4); }
        return;
      }
      for (const spell of legalHuman(state)) {
        const support = choose(state, spell);
        const possible = legalPartner(state).map(card => simulate(state, spell, card));
        if (possible.some(forecast => score(forecast.state) >= 10000)) {
          assert.ok(score(simulate(state, spell, support).state) >= 10000, `${id}: keep a winning path`);
        }
        for (const forecast of possible) {
          assert.equal(forecast.damage + forecast.armor, forecast.rawDamage);
          assert.ok(forecast.armor >= 0 && forecast.armor <= 2);
          assert.equal(forecast.incoming, encounters[id].threats[state.round]);
          assert.equal(forecast.state.round, state.round + 1);
          assert.ok(forecast.healing >= 0 && forecast.healing <= 5);
          assert.deepEqual(state, JSON.parse(key), 'forecast does not mutate its input');
          visit(forecast.state);
        }
      }
    }
    visit(initial(id));
    assert.ok(seen.size > 300 && seen.size < 2000, `${id}: bounded branching encounter`);
    assert.ok(wins > 0 && losses > 0, `${id}: both outcomes are possible`);
  }
});
