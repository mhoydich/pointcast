/** The bounded, deterministic rules shared by the co-games board and its partners. */
export const threats = Object.freeze([4, 6, 5, 7]);
export const human = Object.freeze({
  ember: Object.freeze({ name: 'Ember', damage: 4, block: 0 }),
  root: Object.freeze({ name: 'Root', damage: 2, block: 3 }),
  focus: Object.freeze({ name: 'Focus', damage: 0, block: 0 }),
});
export const partner = Object.freeze({
  echo: Object.freeze({ name: 'Echo', damage: 2, block: 0, heal: 0 }),
  ward: Object.freeze({ name: 'Ward', damage: 0, block: 3, heal: 0 }),
  mend: Object.freeze({ name: 'Mend', damage: 0, block: 0, heal: 3 }),
});

export const initial = () => ({
  round: 0, hp: 14, enemy: 18, focused: false,
  ember: 3, focus: 1, echo: 2, ward: 2, mend: 1, status: 'playing',
});

const integerIn = (value, maximum) => Number.isInteger(value) && value >= 0 && value <= maximum;
function validState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  if (!integerIn(state.round, 4) || !integerIn(state.hp, 14) || !integerIn(state.enemy, 18)
    || typeof state.focused !== 'boolean') return false;
  for (const [card, maximum] of Object.entries({ ember: 3, focus: 1, echo: 2, ward: 2, mend: 1 })) {
    if (!integerIn(state[card], maximum)) return false;
  }
  if (state.status === 'playing') return state.round < 4 && state.hp > 0 && state.enemy > 0;
  if (state.status === 'won') return state.hp > 0 && state.enemy === 0;
  return state.status === 'lost' && (state.hp === 0 || (state.round === 4 && state.enemy > 0));
}

export const legalHuman = state => validState(state) && state.status === 'playing'
  ? Object.keys(human).filter(card => card === 'root' || state[card] > 0) : [];
export const legalPartner = state => validState(state) && state.status === 'playing'
  ? Object.keys(partner).filter(card => state[card] > 0) : [];

/** Forecast a pair without modifying the current state. Invalid or finished moves return null. */
export function simulate(state, humanId, supportId) {
  if (!legalHuman(state).includes(humanId) || !legalPartner(state).includes(supportId)) return null;
  const next = { ...state };
  const spell = human[humanId], support = partner[supportId];
  const humanDamage = spell.damage * (state.focused ? 2 : 1);
  const damage = humanDamage + support.damage;
  const block = spell.block + support.block;
  const healing = Math.min(support.heal, 14 - state.hp);
  const incoming = threats[state.round];
  const taken = Math.max(0, incoming - block);

  // Healing precedes both attacks; even a defeated rift deals its incoming attack.
  next.hp = Math.max(0, state.hp + healing - taken);
  next.enemy = Math.max(0, state.enemy - damage);
  next.round++;
  if (humanId !== 'root') next[humanId]--;
  next[supportId]--;
  if (humanId === 'focus') next.focused = true;
  else if (spell.damage > 0) next.focused = false;
  next.status = next.hp === 0 ? 'lost' : next.enemy === 0 ? 'won' : next.round === 4 ? 'lost' : 'playing';

  return {
    state: next, damage, humanDamage, block, healing, incoming, taken,
    wastedBlock: Math.max(0, block - incoming), wastedHeal: support.heal - healing,
  };
}

// At most four rounds and the fixed card stocks bound the entire search tree.
const memo = new Map();
export function score(state) {
  if (!validState(state)) return -Infinity;
  if (state.status === 'won') return 10000 + state.hp * 50 + (4 - state.round) * 100;
  if (state.status === 'lost') return (state.hp > 0 ? -1000 : -3000) - state.enemy * 50 + state.hp * 5;
  const key = JSON.stringify(state);
  if (memo.has(key)) return memo.get(key);
  let value = -Infinity;
  for (const spell of legalHuman(state)) {
    for (const support of legalPartner(state)) {
      value = Math.max(value, score(simulate(state, spell, support).state));
    }
  }
  memo.set(key, value);
  return value;
}

/** Local demo policy: preserve the best reachable finish, then avoid wasted support. */
export function choose(state, humanId) {
  if (!legalHuman(state).includes(humanId)) return null;
  let best = null, bestScore = -Infinity;
  for (const support of legalPartner(state)) {
    const forecast = simulate(state, humanId, support);
    const value = score(forecast.state) - (forecast.wastedBlock + forecast.wastedHeal) * 0.1;
    if (value > bestScore) { best = support; bestScore = value; }
  }
  return best;
}

/** Give each replay a new gameId. Observations contain game data only, with no provider context. */
export function observe(state, selectedHuman, gameId) {
  if (typeof gameId !== 'string' || !gameId.trim() || gameId.length > 128) {
    throw new TypeError('A nonempty game ID of at most 128 characters is required.');
  }
  if (!legalHuman(state).includes(selectedHuman)) throw new TypeError('Select a legal spell in an active game.');
  return Object.freeze({
    protocol: 'pointcast.co-games.v1',
    gameId,
    revision: state.round,
    selectedHuman,
    state: Object.freeze({ ...state }),
    threats,
    legalSupports: Object.freeze(legalPartner(state)),
    cards: Object.freeze({ human, partner }),
  });
}

/** Validate against a fresh CURRENT observation, never the observation captured when a request began. */
export function validateSupportResponse(observation, response) {
  const fail = reason => ({ ok: false, reason });
  if (!observation || !legalHuman(observation.state).includes(observation.selectedHuman)) return fail('inactive-game');
  if (!response || typeof response !== 'object' || Array.isArray(response)) return fail('invalid-response');
  if (response.gameId !== observation.gameId) return fail('game-mismatch');
  if (response.revision !== observation.revision) return fail('stale-revision');
  if (response.selectedHuman !== observation.selectedHuman) return fail('selection-mismatch');
  if (!legalPartner(observation.state).includes(response.support)) return fail('illegal-support');
  return { ok: true, support: response.support };
}
