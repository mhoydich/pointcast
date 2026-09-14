/** The bounded, deterministic rules shared by the co-games board and its partners. */
const encounter = (id, name, enemy, attacks, armor, combosEnabled) => Object.freeze({
  id, name, enemy, threats: Object.freeze(attacks), armor: Object.freeze(armor), combos: combosEnabled,
});
export const encounters = Object.freeze({
  classic: encounter('classic', 'Classic rift', 18, [4, 6, 5, 7], [0, 0, 0, 0], false),
  garden: encounter('garden', 'Garden gang', 18, [3, 4, 5, 6], [0, 0, 0, 0], true),
  rush: encounter('rush', 'Snack attack', 18, [6, 2, 6, 3], [0, 0, 0, 0], true),
  shell: encounter('shell', 'Shell club', 20, [3, 4, 5, 6], [2, 2, 0, 0], true),
  storm: encounter('storm', 'Moon crew', 22, [2, 5, 2, 7], [0, 0, 0, 0], true),
});
/** Legacy callers retain the original four attacks. Use encounterFor for a particular match. */
export const threats = encounters.classic.threats;
export const combos = Object.freeze({
  'ember:echo': Object.freeze({ human: 'ember', support: 'echo', name: 'Fireworks',
    description: 'Ember + Echo adds 2 damage after Focus.', bonusDamage: 2, bonusHealing: 0 }),
  'root:ward': Object.freeze({ human: 'root', support: 'ward', name: 'Safe haven',
    description: 'Root + Ward heals 2 before the attacks.', bonusDamage: 0, bonusHealing: 2 }),
  'focus:mend': Object.freeze({ human: 'focus', support: 'mend', name: 'Second wind',
    description: 'Focus + Mend heals 5 in total before the attacks.', bonusDamage: 0, bonusHealing: 2 }),
});
const noCombos = Object.freeze({});
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

export function initial(encounterId = 'classic') {
  if (typeof encounterId !== 'string' || !Object.hasOwn(encounters, encounterId)) {
    throw new TypeError('Choose a known encounter.');
  }
  return {
    encounter: encounterId, round: 0, hp: 14, enemy: encounters[encounterId].enemy, focused: false,
    ember: 3, focus: 1, echo: 2, ward: 2, mend: 1, status: 'playing',
  };
}

/** Missing encounter is accepted only for legacy classic snapshots. */
export function encounterFor(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  const id = state.encounter === undefined ? 'classic' : state.encounter;
  return typeof id === 'string' && Object.hasOwn(encounters, id) ? encounters[id] : null;
}

const integerIn = (value, maximum) => Number.isInteger(value) && value >= 0 && value <= maximum;
const stateFields = new Set(['encounter', 'round', 'hp', 'enemy', 'focused', 'ember', 'focus', 'echo', 'ward', 'mend', 'status']);
function validState(state) {
  const config = encounterFor(state);
  if (!config || Object.keys(state).some(key => !stateFields.has(key))) return false;
  if (!integerIn(state.round, 4) || !integerIn(state.hp, 14) || !integerIn(state.enemy, config.enemy)
    || typeof state.focused !== 'boolean') return false;
  for (const [card, maximum] of Object.entries({ ember: 3, focus: 1, echo: 2, ward: 2, mend: 1 })) {
    if (!integerIn(state[card], maximum)) return false;
  }
  if (state.status === 'playing') return state.round < 4 && state.hp > 0 && state.enemy > 0;
  if (state.status === 'won') return state.hp > 0 && state.enemy === 0;
  return state.status === 'lost' && (state.hp === 0 || (state.round === 4 && state.enemy > 0));
}

export function currentIntent(state) {
  if (!validState(state) || state.status !== 'playing') return null;
  const config = encounterFor(state);
  return { attack: config.threats[state.round], armor: config.armor[state.round] };
}

export const legalHuman = state => validState(state) && state.status === 'playing'
  ? Object.keys(human).filter(card => card === 'root' || state[card] > 0) : [];
export const legalPartner = state => validState(state) && state.status === 'playing'
  ? Object.keys(partner).filter(card => state[card] > 0) : [];

/** Forecast a pair without modifying the current state. Invalid or finished moves return null. */
export function simulate(state, humanId, supportId) {
  if (!legalHuman(state).includes(humanId) || !legalPartner(state).includes(supportId)) return null;
  const config = encounterFor(state);
  const next = { ...state, encounter: config.id };
  const spell = human[humanId], support = partner[supportId];
  const paired = config.combos ? combos[`${humanId}:${supportId}`] : null;
  const combo = paired ? Object.freeze({ name: paired.name, description: paired.description }) : null;
  const humanDamage = spell.damage * (state.focused ? 2 : 1);
  const rawDamage = humanDamage + support.damage + (paired?.bonusDamage ?? 0);
  const armor = Math.min(rawDamage, config.armor[state.round]);
  const damage = rawDamage - armor;
  const block = spell.block + support.block;
  const availableHealing = support.heal + (paired?.bonusHealing ?? 0);
  const healing = Math.min(availableHealing, 14 - state.hp);
  const incoming = config.threats[state.round];
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
    state: next, damage, rawDamage, armor, combo, humanDamage, block, healing, incoming, taken,
    wastedBlock: Math.max(0, block - incoming), wastedHeal: availableHealing - healing,
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
  const config = encounterFor(state);
  return Object.freeze({
    protocol: 'pointcast.co-games.v1',
    gameId,
    revision: state.round,
    selectedHuman,
    state: Object.freeze({ ...state, encounter: config.id }),
    encounter: config,
    threats: config.threats,
    armor: config.armor,
    combos: config.combos ? combos : noCombos,
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
