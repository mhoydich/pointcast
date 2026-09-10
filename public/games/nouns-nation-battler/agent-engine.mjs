/**
 * Seeded 12v12 exhibition rules, shared by the agent API and browser replay.
 * Gangs, role names and base stats come from the v42 league. This is a separate
 * ruleset: it does not reproduce the browser league's terrain or season state.
 * Simulation decisions use fixed ticks and integer arithmetic only.
 */
export const rulesVersion = 'nouns-nation.exhibition.1';
const ROLE_IDS = ['runner', 'bonker', 'slinger', 'captain', 'healer'];
const TACTIC_IDS = ['rush', 'guard', 'flank'];
const DEFAULT_ROSTER = { runner: 3, bonker: 3, slinger: 3, captain: 1, healer: 2 };
const GANGS = [
  { id: 'tomato-noggles', name: 'Tomato Noggles', short: 'TN', color: '#e45745' },
  { id: 'cobalt-frames', name: 'Cobalt Frames', short: 'CF', color: '#3677e0' },
  { id: 'golden-nouncil', name: 'Golden Nouncil', short: 'GN', color: '#d49b19' },
  { id: 'garden-stack', name: 'Garden Stack', short: 'GS', color: '#3f9b54' },
  { id: 'pixel-union', name: 'Pixel Union', short: 'PU', color: '#8b5cf6' },
  { id: 'night-auction', name: 'Night Auction', short: 'NA', color: '#2f3a4f' },
  { id: 'sunset-prop-house', name: 'Sunset Prop House', short: 'SP', color: '#ef7d2d' },
  { id: 'mint-condition', name: 'Mint Condition', short: 'MC', color: '#13a6a1' },
];
const ROLES = [
  { id: 'runner', hp: 74, speed: 1.34, range: 29, damage: 8, cadence: 34, move: 'Breakaway dash', step: 8, cooldown: 6 },
  { id: 'bonker', hp: 112, speed: .88, range: 24, damage: 15, cadence: 50, move: 'Noggles slam', step: 5, cooldown: 8 },
  { id: 'slinger', hp: 68, speed: 1.03, range: 96, damage: 9, cadence: 46, move: 'Auction volley', step: 6, cooldown: 8 },
  { id: 'captain', hp: 132, speed: .94, range: 42, damage: 16, cadence: 42, move: 'Quorum rally', step: 6, cooldown: 7 },
  { id: 'healer', hp: 78, speed: .96, range: 70, damage: 5, cadence: 58, move: 'Emergency mint', step: 6, cooldown: 10 },
];
const MAX_TICKS = 480;
const TICK_MS = 100;
const MAX_EVENTS = 240;
const WIDTH = 1000;
const HEIGHT = 600;
const roleById = Object.fromEntries(ROLES.map(role => [role.id, role]));
const gangById = Object.fromEntries(GANGS.map(gang => [gang.id, gang]));

function deepFreeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') deepFreeze(child);
  return Object.freeze(value);
}

export const catalog = deepFreeze({
  rulesVersion,
  mode: 'seeded-exhibition',
  description: 'A separate 12v12 exhibition using Nouns Nation gangs and roles. Gangs are cosmetic; roster and tactics change play. No season progression, terrain powers, wagers or prizes.',
  gangs: GANGS.map(gang => ({ ...gang })),
  roles: ROLES.map(({ step, cooldown, ...role }) => ({ ...role, attackEveryTicks: cooldown, movePerTick: step })),
  tactics: [
    { id: 'rush', name: 'Rush', description: 'Close the gap faster and pressure the nearest opponent.' },
    { id: 'guard', name: 'Guard', description: 'Advance more slowly; incoming hits deal two less damage, with a minimum of one. Flank bypasses this protection.' },
    { id: 'flank', name: 'Flank', description: 'Spread out and prefer exposed healers and slingers. Flanking hits bypass Guard and gain four damage against it; a direct rush can punish the spread.' },
  ],
  defaultRoster: { ...DEFAULT_ROSTER },
  rosterLimits: { size: 12, maximumPerRole: 6, captain: 2, healer: 3 },
  limits: { seedMin: 0, seedMax: 4294967295, maxTicks: MAX_TICKS, tickMs: TICK_MS, maxFrames: 122, maxEvents: MAX_EVENTS + 1 },
  resolution: 'Elimination ends a match. At the time limit, compare survivors, then the sum of each survivor’s remaining health percentage. Equal scores are a draw.',
  replay: 'Position and health samples every four ticks, including the first and final tick. The event feed is capped; frames still contain every unit. Each unit uses its own seeded random stream.',
});

function object(value, label, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError(`Unknown ${label} field: ${key}`);
  return value;
}

function team(value, side) {
  const input = value === undefined ? {} : object(value, side, ['gang', 'tactic', 'roster']);
  const gang = input.gang === undefined ? GANGS[side === 'left' ? 0 : 1].id : input.gang;
  const tactic = input.tactic === undefined ? (side === 'left' ? 'rush' : 'guard') : input.tactic;
  if (typeof gang !== 'string' || !Object.hasOwn(gangById, gang)) throw new TypeError(`${side}.gang is not in the catalog`);
  if (!TACTIC_IDS.includes(tactic)) throw new TypeError(`${side}.tactic is not in the catalog`);
  const roster = input.roster === undefined ? { ...DEFAULT_ROSTER } : object(input.roster, `${side}.roster`, ROLE_IDS);
  const copy = {};
  for (const role of ROLE_IDS) {
    const count = roster[role];
    const maximum = role === 'captain' ? 2 : role === 'healer' ? 3 : 6;
    if (!Number.isInteger(count) || count < 0 || count > maximum) throw new TypeError(`${side}.roster.${role} must be an integer from 0 to ${maximum}`);
    copy[role] = count;
  }
  if (Object.values(copy).reduce((sum, count) => sum + count, 0) !== 12) throw new TypeError(`${side}.roster must total 12`);
  return { gang, tactic, roster: copy };
}

export function parseMatchInput(value) {
  const input = object(value, 'match', ['seed', 'left', 'right']);
  const seed = input.seed === undefined ? 0 : input.seed;
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new TypeError('seed must be a uint32 integer (0–4294967295)');
  return { seed: seed === 0 ? 0 : seed, left: team(input.left, 'left'), right: team(input.right, 'right') };
}

function random(unit) {
  unit.rng = (unit.rng + 0x6d2b79f5) >>> 0;
  let value = unit.rng;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return (value ^ value >>> 14) >>> 0;
}
const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function makeUnits(input) {
  const units = [];
  for (const side of ['left', 'right']) {
    const config = input[side];
    const gangIndex = GANGS.findIndex(gang => gang.id === config.gang);
    let slot = 0;
    for (const roleId of ROLE_IDS) for (let count = 0; count < config.roster[roleId]; count++) {
      const role = roleById[roleId];
      const front = roleId === 'bonker' ? 250 : roleId === 'runner' ? 225 : roleId === 'captain' ? 205 : roleId === 'slinger' ? 165 : 125;
      const spread = config.tactic === 'flank' ? 88 : 72;
      const x = front + Math.floor(slot / 6) * 18;
      const unit = {
        id: units.length, slot, side, gang: config.gang, role: roleId,
        nounId: (gangIndex * 7 + slot) % 60,
        x: side === 'left' ? x : WIDTH - x,
        y: 300 + (slot % 6) * spread - Math.floor(spread * 5 / 2),
        hp: role.hp, maxHp: role.hp, cooldown: 0, rally: 0, swings: 0,
        rng: (input.seed ^ Math.imul(slot + 1, 0x9e3779b9)) >>> 0,
      };
      unit.cooldown = random(unit) % role.cooldown;
      units.push(unit);
      slot++;
    }
  }
  return units;
}

function enemyFor(unit, units, tactic) {
  let chosen = null;
  let best = Infinity;
  for (const candidate of units) {
    if (candidate.hp <= 0 || candidate.side === unit.side) continue;
    let score = distanceSquared(unit, candidate) * 4;
    if (tactic === 'flank' && ['healer', 'slinger'].includes(candidate.role)) score = Math.floor(score * 3 / 4);
    if (score < best || (score === best && candidate.slot < chosen.slot)) { chosen = candidate; best = score; }
  }
  return chosen;
}

function healTarget(unit, units) {
  let chosen = null;
  let bestMissing = 0;
  let bestDistance = Infinity;
  for (const candidate of units) {
    if (candidate.side !== unit.side || candidate.hp <= 0 || candidate.hp >= candidate.maxHp) continue;
    const d = distanceSquared(unit, candidate);
    // Healers protect nearby comrades; they do not abandon the entire formation
    // to chase a distant unit with one missing health point.
    if (d > 150 * 150) continue;
    const missing = candidate.maxHp - candidate.hp;
    if (missing > bestMissing || (missing === bestMissing && (d < bestDistance || (d === bestDistance && candidate.slot < chosen.slot)))) {
      chosen = candidate; bestMissing = missing; bestDistance = d;
    }
  }
  return chosen;
}

function approach(unit, target, step) {
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  if (!distance) return { x: unit.x, y: unit.y };
  const travel = Math.min(step, distance);
  let moveX = Math.trunc(dx * travel / distance);
  let moveY = Math.trunc(dy * travel / distance);
  if (moveX === 0 && moveY === 0) {
    if (Math.abs(dx) >= Math.abs(dy)) moveX = Math.sign(dx);
    else moveY = Math.sign(dy);
  }
  return { x: unit.x + moveX, y: unit.y + moveY };
}

function separateFriends(units) {
  const shifts = units.map(() => ({ x: 0, y: 0 }));
  for (let a = 0; a < units.length; a++) for (let b = a + 1; b < units.length; b++) {
    const first = units[a], second = units[b];
    if (first.hp <= 0 || second.hp <= 0 || first.side !== second.side || distanceSquared(first, second) >= 18 * 18) continue;
    const dx = first.x - second.x, dy = first.y - second.y;
    const x = dx === 0 && dy === 0 ? (first.side === 'left' ? 1 : -1) : Math.sign(dx);
    const y = Math.sign(dy);
    shifts[a].x += x * 2; shifts[b].x -= x * 2;
    shifts[a].y += y * 2; shifts[b].y -= y * 2;
  }
  for (const unit of units) {
    unit.x = clamp(unit.x + shifts[unit.id].x, 20, WIDTH - 20);
    unit.y = clamp(unit.y + shifts[unit.id].y, 20, HEIGHT - 20);
  }
}

/** Run once; inputs are copied and never mutated. No clock, network or storage. */
export function simulateMatch(value) {
  const input = parseMatchInput(value);
  const units = makeUnits(input);
  const identities = units.map(({ id, side, gang, role, nounId, maxHp }) => ({ id, side, gang, role, nounId, maxHp }));
  const frames = [];
  const events = [];
  let eventsTruncated = 0;
  const capture = tick => frames.push({ tick, units: units.map(unit => [unit.id, unit.x, unit.y, unit.hp]) });
  function emit(event) {
    if (events.length < MAX_EVENTS) { events.push(event); return; }
    // Preserve late knockouts and rallies without allowing unbounded replay size.
    if (event.type === 'ko' || event.type === 'rally') {
      const index = events.findIndex(item => item.type === 'hit' || item.type === 'heal');
      if (index >= 0) { events.splice(index, 1); events.push(event); }
    }
    eventsTruncated++;
  }
  capture(0);
  let ticks = 0;
  let reason = 'time-limit';
  for (let tick = 1; tick <= MAX_TICKS; tick++) {
    ticks = tick;
    // Movement decisions use the same snapshot on both sides.
    const positions = units.map(unit => {
      if (unit.hp <= 0) return { x: unit.x, y: unit.y };
      const role = roleById[unit.role], tactic = input[unit.side].tactic;
      const target = (unit.role === 'healer' && healTarget(unit, units)) || enemyFor(unit, units, tactic);
      if (!target || distanceSquared(unit, target) <= role.range ** 2) return { x: unit.x, y: unit.y };
      return approach(unit, target, role.step + (tactic === 'rush' ? 2 : tactic === 'guard' ? -1 : 1));
    });
    for (const unit of units) { unit.x = positions[unit.id].x; unit.y = positions[unit.id].y; }
    separateFriends(units);
    const damage = units.map(() => 0), healing = units.map(() => 0), rally = units.map(() => 0);
    const hits = [], heals = [];
    for (const unit of units) {
      if (unit.hp <= 0) continue;
      unit.cooldown = Math.max(0, unit.cooldown - 1);
      unit.rally = Math.max(0, unit.rally - 1);
      if (unit.cooldown) continue;
      const role = roleById[unit.role];
      const friend = unit.role === 'healer' ? healTarget(unit, units) : null;
      if (friend && distanceSquared(unit, friend) <= role.range ** 2) {
        const amount = Math.min(15, friend.maxHp - friend.hp);
        healing[friend.id] += amount;
        unit.cooldown = role.cooldown;
        heals.push({ actor: unit.id, target: friend.id, amount });
        continue;
      }
      const target = enemyFor(unit, units, input[unit.side].tactic);
      if (!target || distanceSquared(unit, target) > role.range ** 2) continue;
      const critical = random(unit) % 9 === 0;
      const guarded = input[target.side].tactic === 'guard';
      const counter = guarded && input[unit.side].tactic === 'flank';
      const amount = Math.max(1, role.damage + (critical ? 4 : 0) + (unit.rally ? 2 : 0) + (counter ? 4 : guarded ? -2 : 0));
      damage[target.id] += amount;
      hits.push({ actor: unit.id, target: target.id, amount });
      unit.cooldown = role.cooldown;
      unit.swings++;
      emit({ tick, type: 'hit', actor: unit.id, target: target.id, amount, text: `${gangById[unit.gang].short} ${role.move}${counter ? ' — around the guard' : critical ? ' — clean hit' : ''}.` });
      if (unit.role === 'captain' && unit.swings % 3 === 0) {
        let allies = 0;
        for (const ally of units) if (ally.hp > 0 && ally.side === unit.side && ally.id !== unit.id && distanceSquared(unit, ally) <= 120 ** 2) { rally[ally.id] = 10; allies++; }
        if (allies) emit({ tick, type: 'rally', actor: unit.id, target: null, amount: allies, text: `${gangById[unit.gang].short} Quorum rally boosts ${allies} nearby allies.` });
      }
    }
    // Every unit alive at the start of the exchange gets its action. Healing
    // cannot revive someone who was already down, and side iteration cannot
    // cancel an opponent's simultaneous finishing hit.
    for (const unit of units) {
      if (unit.hp <= 0) continue;
      let missing = unit.maxHp - unit.hp;
      for (const heal of heals) if (heal.target === unit.id) {
        const amount = Math.min(missing, heal.amount);
        missing -= amount;
        if (amount) emit({ tick, type: 'heal', actor: heal.actor, target: unit.id, amount,
          text: `${gangById[unit.gang].short} Emergency mint restores ${amount} health to Noun #${unit.nounId}.` });
      }
      unit.hp = Math.max(0, Math.min(unit.maxHp, unit.hp + healing[unit.id]) - damage[unit.id]);
      unit.rally = Math.max(unit.rally, rally[unit.id]);
      if (unit.hp === 0) {
        const contributors = hits.filter(hit => hit.target === unit.id).sort((a, b) => b.amount - a.amount || units[a.actor].slot - units[b.actor].slot);
        emit({ tick, type: 'ko', actor: contributors[0]?.actor ?? null, target: unit.id, amount: 0, text: `${gangById[unit.gang].short} Noun #${unit.nounId} is down.` });
      }
    }
    const left = units.some(unit => unit.side === 'left' && unit.hp > 0);
    const right = units.some(unit => unit.side === 'right' && unit.hp > 0);
    if (tick % 4 === 0 || !left || !right || tick === MAX_TICKS) capture(tick);
    if (!left || !right) { reason = 'elimination'; break; }
  }
  const survivors = { left: 0, right: 0 }, health = { left: 0, right: 0 }, healthScore = { left: 0, right: 0 };
  for (const unit of units) {
    if (unit.hp > 0) survivors[unit.side]++;
    health[unit.side] += unit.hp;
    healthScore[unit.side] += Math.floor(unit.hp * 10000 / unit.maxHp);
  }
  const difference = survivors.left - survivors.right || healthScore.left - healthScore.right;
  const winner = difference > 0 ? 'left' : difference < 0 ? 'right' : 'draw';
  events.push({ tick: ticks, type: 'result', actor: null, target: null, amount: 0,
    text: winner === 'draw' ? `Exhibition draw. ${survivors.left}–${survivors.right} standing.` : `${gangById[input[winner].gang].name} take the exhibition. ${survivors.left}–${survivors.right} standing.` });
  return { rulesVersion, mode: 'seeded-exhibition', input, field: { width: WIDTH, height: HEIGHT }, tickMs: TICK_MS,
    ticks, durationMs: ticks * TICK_MS, winner, reason, survivors, health, healthScore, units: identities, frames, events, eventsTruncated };
}
