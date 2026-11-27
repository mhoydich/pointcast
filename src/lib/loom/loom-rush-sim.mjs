/**
 * Loom Rush v2 — headless LR-1 campaign.
 *
 * Integer ticks only. A uint32 seed and a build plan replay to the same
 * proof on every engine. Combat never reads the clock.
 *
 * Campaign shape follows #loom-rush LR-1 (m_290n6c0y0z): waves 6–10 are
 * Collator Scouts, marching knights, the night map, the long meeting,
 * and the Silo Dragon with raider escorts. The Signing Desk Paladin
 * unlocks after wave 5.
 */

export const SPEC = 'pointcast.loom-rush/v2';
export const CAMPAIGN = 'LR-1';
export const VERSION = '2.0.0';
export const MAX_HEARTS = 20;
export const STARTING_GOLD = 300;
export const PAD_COUNT = 6;
export const MAX_STEPS = 36;
export const PALADIN_WAVE = 6;

export const MAP = {
  length: 10000,
  pads: [1500, 3100, 4700, 6300, 7900, 9300],
};

export const SPRITES = [
  { id: 'noun-knight', file: 'noun-knight-32.png', message: 'm_690b3z3n58', sha256: 'd85cea03b41cb77a76f484ad6ccdb63a4b592a056ceae96e70c58fe701948224', role: 'Barracks blocker and marching knight' },
  { id: 'silo-dragon', file: 'silo-dragon-32.png', message: 'm_0w4i3w5f5c', sha256: 'cfdf4756b06bba85fa30d3bbd3246d016caaf83ce193d7e554346a5c5df36d49', role: 'Wave 5 and wave 10 boss' },
  { id: 'collator-scout', file: 'collator-scout-32.png', message: 'm_0k300u1f0y', sha256: 'ac47382367fc18e29edfbd8ae3aec3e5e071c908d2e3d23d2e13646bad05bc8c', role: 'Wave 6 scout, slips past pad 0' },
  { id: 'signing-paladin', file: 'signing-paladin-32.png', message: 'm_6a031g2c2l', sha256: 'f41468995a9b3be911474d0e0b65b2ea4fea6a8b77e359de76293ffc2543a310', role: 'Signing Desk Paladin' },
  { id: 'night-raider', file: 'night-raider-32.png', message: 'm_1d02500s63', sha256: '5b8abee002bbf962c0cb7c37d6a2e31b3759ed261943886970785a3a4537f177', role: 'Night raider' },
  { id: 'gong-bombard', file: 'gong-bombard-32.png', message: 'm_4k2h6h1v31', sha256: '3d51b30d7e0c494a184b1f9fde648910fcd21f26f45a2c970e19ec336471e30d', role: 'Bronze Gong Bombard' },
];

export const SPRITE_SRC = Object.fromEntries(SPRITES.map((sprite) => [sprite.id, `/sketches/loom-rush/${sprite.file}`]));

export const TOWER_TYPES = {
  archer: {
    name: 'Loom Archers',
    role: 'Single-target shots along the road. Weaker at night.',
    cost: [60, 45, 70],
    range: 1650,
    cooldown: 4,
    damage: [14, 22, 32],
  },
  barracks: {
    name: 'Hearth Barracks',
    role: 'Noun Knights block the road. Collator Scouts slip past pad 0.',
    cost: [80, 55, 80],
    knights: [1, 2, 3],
    knightHp: [56, 78, 102],
    knightDmg: [7, 10, 14],
  },
  mage: {
    name: 'Multi-Lab Mage',
    role: 'Splash. Stronger at night.',
    cost: [100, 70, 100],
    range: 1850,
    cooldown: 8,
    damage: [24, 36, 50],
    splash: 820,
  },
  gong: {
    name: 'Bronze Gong',
    role: 'Heavy splash and a slow. Holds still stacks.',
    cost: [120, 85, 115],
    range: 2150,
    cooldown: 11,
    damage: [32, 48, 66],
    splash: 1200,
    slow: 680,
    slowTicks: 18,
  },
  paladin: {
    name: 'Signing Desk Paladin',
    role: 'From wave 6. Heals knights, empowers one tower, slows the aura. Cannot be rushed.',
    cost: [140, 95, 125],
    range: 1750,
    unlockWave: PALADIN_WAVE,
    heal: [16, 26, 36],
    empower: [220, 320, 420],
  },
};

const grunt = (count, hp, speed, gap) => ({ kind: 'grunt', count, hp, speed, armor: 0, gold: 8, leak: 1, gap, bite: 1 });

export const WAVES = [
  { id: 1, name: 'Road grunts', bonus: 48, groups: [grunt(8, 34, 165, 980)] },
  { id: 2, name: 'Runners', bonus: 56, groups: [{ kind: 'runner', count: 10, hp: 28, speed: 275, armor: 0, gold: 8, leak: 1, gap: 720, bite: 1 }] },
  { id: 3, name: 'Armored', bonus: 64, groups: [{ kind: 'armored', count: 8, hp: 92, speed: 145, armor: 6, gold: 12, leak: 1, gap: 1040, bite: 2 }] },
  { id: 4, name: 'Mixed push', bonus: 72, groups: [grunt(8, 42, 175, 860), { kind: 'runner', count: 6, hp: 30, speed: 290, armor: 0, gold: 9, leak: 1, gap: 640, bite: 1 }] },
  { id: 5, name: 'Silo Dragon', bonus: 90, groups: [grunt(6, 40, 170, 900), { kind: 'dragon', count: 1, hp: 620, speed: 105, armor: 7, gold: 100, leak: 5, gap: 2200, bite: 0, unblockable: true }] },
  { id: 6, name: 'Collator Scouts', bonus: 80, groups: [{ kind: 'scout', count: 8, hp: 30, speed: 470, armor: 0, gold: 10, leak: 1, gap: 240, bite: 1, slipPad0: true, pairs: true, pairBreak: 1080 }] },
  { id: 7, name: 'Marching Knights', bonus: 88, groups: [
    { kind: 'scout', count: 4, hp: 30, speed: 450, armor: 0, gold: 10, leak: 1, gap: 520, bite: 1, slipPad0: true },
    { kind: 'knight', count: 6, hp: 150, speed: 125, armor: 8, gold: 16, leak: 2, gap: 1120, bite: 4 },
  ] },
  { id: 8, name: 'Night Raiders', night: true, bonus: 96, groups: [{ kind: 'raider', count: 10, hp: 104, speed: 245, armor: 3, gold: 14, leak: 2, gap: 820, bite: 3 }] },
  { id: 9, name: 'The Long Meeting', night: true, hpMul: 2, speedMil: 500, bonus: 110, groups: [
    { kind: 'scout', count: 4, hp: 30, speed: 440, armor: 0, gold: 10, leak: 1, gap: 700, bite: 1, slipPad0: true },
    { kind: 'knight', count: 4, hp: 130, speed: 125, armor: 8, gold: 16, leak: 2, gap: 1000, bite: 4 },
    { kind: 'raider', count: 4, hp: 96, speed: 230, armor: 3, gold: 14, leak: 2, gap: 900, bite: 3 },
  ] },
  { id: 10, name: 'Dragon returns', night: true, bonus: 140, groups: [
    { kind: 'raider', count: 2, hp: 110, speed: 240, armor: 3, gold: 14, leak: 2, gap: 780, bite: 3 },
    { kind: 'dragon', count: 1, hp: 860, speed: 95, armor: 8, gold: 150, leak: 6, gap: 2400, bite: 0, unblockable: true },
  ] },
];

const step = (wave, op, pad, tower) => (tower ? { wave, op, pad, tower } : { wave, op, pad });
const build = (wave, pad, tower) => step(wave, 'build', pad, tower);
const up = (wave, pad) => step(wave, 'upgrade', pad);

/** House exhibition plus the town-watch build posted on #loom-rush. */
export const EXHIBITION = [
  {
    agent: 'astra-arcane-volley',
    steps: [
      build(1, 1, 'barracks'), build(1, 2, 'mage'), build(1, 4, 'archer'),
      up(2, 2), up(2, 1),
      build(3, 3, 'gong'),
      up(4, 2), up(4, 3),
      up(5, 1),
      build(6, 5, 'paladin'), build(6, 0, 'archer'),
      up(7, 3), up(7, 5),
      up(8, 4),
      up(9, 5),
      up(10, 0),
    ],
  },
  {
    agent: 'sol-gong-artillery',
    steps: [
      build(1, 0, 'barracks'), build(1, 1, 'barracks'), build(1, 3, 'gong'),
      up(2, 3),
      up(3, 3),
      build(4, 5, 'gong'),
      up(5, 5), build(5, 2, 'mage'),
      build(6, 4, 'paladin'), up(6, 2),
      up(7, 5),
      up(8, 4),
      up(9, 2),
      up(10, 0),
    ],
  },
  {
    agent: 'claude-citadel',
    steps: [
      build(1, 1, 'barracks'), build(1, 0, 'barracks'), build(1, 2, 'archer'),
      up(2, 1), up(2, 0),
      build(3, 3, 'gong'),
      up(4, 1), build(4, 4, 'mage'),
      up(5, 3),
      build(6, 5, 'paladin'),
      up(7, 3), up(7, 4),
      up(8, 5), up(8, 0),
      up(9, 4),
      up(10, 5),
    ],
  },
  {
    agent: 'antigravity-balanced',
    steps: [
      build(1, 0, 'archer'), build(1, 1, 'barracks'), build(1, 2, 'mage'),
      build(2, 3, 'gong'), up(2, 0),
      up(3, 2), up(3, 1),
      build(4, 4, 'archer'), up(4, 3),
      up(5, 2), up(5, 1),
      build(6, 5, 'paladin'), up(6, 0),
      up(7, 3),
      up(8, 5),
      up(9, 4),
      up(10, 5),
    ],
  },
  {
    agent: 'town-watch',
    steps: [
      build(1, 0, 'barracks'), build(1, 1, 'barracks'), build(1, 3, 'gong'),
      up(2, 3),
      up(3, 3),
      build(4, 2, 'mage'),
      up(5, 2), build(5, 5, 'gong'),
      build(6, 4, 'archer'), up(6, 2),
      up(7, 5),
      up(8, 5),
      up(9, 0),
      up(10, 1),
    ],
  },
];

const TOWER_IDS = new Set(Object.keys(TOWER_TYPES));
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/** SHA-256 hex. Used for proofs so the browser and the Worker match Node. */
export function sha256hex(message) {
  const data = new TextEncoder().encode(message);
  const bitLen = data.length * 8;
  const total = Math.ceil((bitLen + 1 + 64) / 512) * 64;
  const buf = new Uint8Array(total);
  buf.set(data);
  buf[data.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(total - 8, Math.floor(bitLen / 0x100000000));
  view.setUint32(total - 4, bitLen >>> 0);
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);
  for (let i = 0; i < buf.length; i += 64) {
    for (let t = 0; t < 16; t += 1) w[t] = view.getUint32(i + t * 4);
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = ((e & f) ^ ((~e) & g)) >>> 0;
      const temp1 = (h + s1 + ch + K[t] + w[t]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (s0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((part) => part.toString(16).padStart(8, '0')).join('');
}

function error(code, message) {
  return { code, message };
}

export function checkSeed(seed) {
  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return error('bad_seed', 'Seed must be an integer from 0 through 4294967295.');
  }
  return null;
}

function checkAgent(agent) {
  if (typeof agent !== 'string' || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(agent)) {
    return error('bad_agent', 'Agent name must be 1–32 characters: lowercase letters, digits, and hyphens.');
  }
  return null;
}

function sameKeys(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
}

function canonicalStep(value) {
  if (value.op === 'build') return { wave: value.wave, op: 'build', pad: value.pad, tower: value.tower };
  return { wave: value.wave, op: 'upgrade', pad: value.pad };
}

export function canonicalSteps(steps) {
  return JSON.stringify(steps.map(canonicalStep));
}

/** Structural guards. Gold is checked when the step is played. */
export function validatePlan({ seed, agent, steps }) {
  const seedError = checkSeed(seed);
  if (seedError) return seedError;
  const agentError = checkAgent(agent);
  if (agentError) return agentError;
  if (!Array.isArray(steps)) return error('bad_step', 'Steps must be a list.');
  if (steps.length > MAX_STEPS) return error('too_many_steps', `A plan can hold at most ${MAX_STEPS} steps.`);
  const occupied = new Map();
  let paladin = 0;
  let previousWave = 1;
  for (let index = 0; index < steps.length; index += 1) {
    const entry = steps[index];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return error('bad_step', `Step ${index + 1} must be an object.`);
    }
    const op = entry.op;
    if (op !== 'build' && op !== 'upgrade') return error('bad_op', `Step ${index + 1} must build or upgrade.`);
    const expected = op === 'build' ? ['wave', 'op', 'pad', 'tower'] : ['wave', 'op', 'pad'];
    if (!sameKeys(entry, expected)) return error('bad_step', `Step ${index + 1} has unexpected fields.`);
    if (typeof entry.wave !== 'number' || !Number.isInteger(entry.wave) || entry.wave < 1 || entry.wave > WAVES.length) {
      return error('bad_step', `Step ${index + 1} names a wave outside 1–${WAVES.length}.`);
    }
    if (entry.wave < previousWave) return error('wave_order', 'Steps must stay in wave order.');
    previousWave = entry.wave;
    if (typeof entry.pad !== 'number' || !Number.isInteger(entry.pad) || entry.pad < 0 || entry.pad >= PAD_COUNT) {
      return error('bad_pad', `Pad ${entry.pad} is outside 0–${PAD_COUNT - 1}.`);
    }
    if (op === 'build') {
      if (typeof entry.tower !== 'string' || !TOWER_IDS.has(entry.tower)) {
        return error('bad_tower', `Unknown tower "${entry.tower}". Use archer, barracks, mage, gong, or paladin.`);
      }
      if (occupied.has(entry.pad)) return error('pad_taken', `Pad ${entry.pad} already has a tower in this plan.`);
      if (entry.tower === 'paladin') {
        if (entry.wave < PALADIN_WAVE) {
          return error('paladin_locked', `The Signing Desk Paladin unlocks at wave ${PALADIN_WAVE}.`);
        }
        paladin += 1;
        if (paladin > 1) return error('paladin_duplicate', 'A run can field one Signing Desk Paladin.');
      }
      occupied.set(entry.pad, 1);
    } else {
      const level = occupied.get(entry.pad);
      if (!level) return error('no_tower', `Pad ${entry.pad} has no tower to upgrade.`);
      if (level >= 3) return error('max_level', `Pad ${entry.pad} is already at max level.`);
      occupied.set(entry.pad, level + 1);
    }
  }
  return null;
}

function nextRng(match) {
  match.rng = (Math.imul(match.rng, 1664525) + 1013904223) >>> 0;
  return match.rng;
}

function fresh(seed) {
  return {
    seed,
    rng: seed >>> 0,
    gold: STARTING_GOLD,
    hearts: MAX_HEARTS,
    nextWave: 1,
    wavesCleared: 0,
    kills: 0,
    fallen: false,
    towers: [null, null, null, null, null, null],
    knights: [],
    log: [],
    applied: [],
  };
}

export function createMatch(seed) {
  const seedError = checkSeed(seed);
  if (seedError) return { ok: false, error: seedError };
  return { ok: true, match: fresh(seed) };
}

function configure(tower) {
  const spec = TOWER_TYPES[tower.type];
  tower.name = spec.name;
  tower.pos = MAP.pads[tower.pad];
  tower.range = spec.range || 0;
  tower.cooldown = spec.cooldown || 0;
  tower.damagePerShot = spec.damage ? spec.damage[tower.level - 1] : 0;
  tower.splash = spec.splash || 0;
  tower.slow = spec.slow || 0;
  tower.slowTicks = spec.slowTicks || 0;
  tower.empower = 0;
}

function syncKnights(match, tower) {
  const spec = TOWER_TYPES.barracks;
  const hp = spec.knightHp[tower.level - 1];
  const dmg = spec.knightDmg[tower.level - 1];
  const have = match.knights.filter((knight) => knight.pad === tower.pad);
  for (const knight of have) {
    const ratio = knight.maxHp > 0 ? knight.hp / knight.maxHp : 1;
    knight.maxHp = hp;
    knight.dmg = dmg;
    knight.hp = Math.max(1, Math.min(hp, Math.round(ratio * hp)));
    knight.pos = tower.pos;
  }
  while (match.knights.filter((knight) => knight.pad === tower.pad).length < spec.knights[tower.level - 1]) {
    match.knights.push({ pad: tower.pad, pos: tower.pos, hp, maxHp: hp, dmg, holding: null });
  }
}

function refuse(step, reason) {
  const row = canonicalStep(step);
  row.applied = false;
  row.reason = reason;
  return row;
}

function applyStep(match, entry) {
  if (entry.op === 'build') {
    if (match.towers[entry.pad]) return refuse(entry, 'pad_taken');
    const spec = TOWER_TYPES[entry.tower];
    const cost = spec.cost[0];
    if (match.gold < cost) return refuse(entry, 'gold');
    match.gold -= cost;
    const tower = { type: entry.tower, pad: entry.pad, level: 1, dealt: 0, kills: 0, cd: 0 };
    configure(tower);
    match.towers[entry.pad] = tower;
    if (entry.tower === 'barracks') syncKnights(match, tower);
    match.applied.push(canonicalStep(entry));
    return { ...canonicalStep(entry), applied: true, cost };
  }
  const tower = match.towers[entry.pad];
  if (!tower) return refuse(entry, 'no_tower');
  const spec = TOWER_TYPES[tower.type];
  if (tower.level >= spec.cost.length) return refuse(entry, 'max_level');
  const cost = spec.cost[tower.level];
  if (match.gold < cost) return refuse(entry, 'gold');
  match.gold -= cost;
  tower.level += 1;
  configure(tower);
  if (tower.type === 'barracks') syncKnights(match, tower);
  match.applied.push(canonicalStep(entry));
  return { ...canonicalStep(entry), applied: true, cost };
}

export function stampMatch(match, agent = 'player') {
  if (!match.fallen && match.nextWave <= WAVES.length) return null;
  return publish(match, agent, match.applied, match.applied, []).proof;
}

function liveError(match, entry) {
  if (!match || match.fallen || match.nextWave > WAVES.length) return error('campaign_over', 'This run is already over.');
  if (entry.op !== 'build' && entry.op !== 'upgrade') return error('bad_op', 'Place a tower or upgrade one.');
  if (typeof entry.pad !== 'number' || !Number.isInteger(entry.pad) || entry.pad < 0 || entry.pad >= PAD_COUNT) {
    return error('bad_pad', `Pad ${entry.pad} is outside 0–${PAD_COUNT - 1}.`);
  }
  if (entry.op === 'build') {
    if (typeof entry.tower !== 'string' || !TOWER_TYPES[entry.tower]) {
      return error('bad_tower', 'Unknown tower. Use archer, barracks, mage, gong, or paladin.');
    }
    if (match.towers[entry.pad]) return error('pad_taken', `Pad ${entry.pad} already has a tower.`);
    if (entry.tower === 'paladin') {
      if (match.nextWave < PALADIN_WAVE) return error('paladin_locked', `The Signing Desk Paladin unlocks at wave ${PALADIN_WAVE}.`);
      if (match.towers.some((tower) => tower && tower.type === 'paladin')) {
        return error('paladin_duplicate', 'A run can field one Signing Desk Paladin.');
      }
    }
    return null;
  }
  const tower = match.towers[entry.pad];
  if (!tower) return error('no_tower', `Pad ${entry.pad} has no tower to upgrade.`);
  if (tower.level >= TOWER_TYPES[tower.type].cost.length) return error('max_level', `Pad ${entry.pad} is already at max level.`);
  return null;
}

export function placeTower(match, pad, tower) {
  const entry = { wave: match.nextWave, op: 'build', pad, tower };
  const problem = liveError(match, entry);
  if (problem) return { ok: false, error: problem };
  const spec = TOWER_TYPES[tower];
  if (match.gold < spec.cost[0]) {
    return { ok: false, error: error('gold', `Not enough gold for ${spec.name}. It costs ${spec.cost[0]}.`) };
  }
  applyStep(match, entry);
  return { ok: true, view: viewOf(match) };
}

export function upgradeTower(match, pad) {
  const entry = { wave: match.nextWave, op: 'upgrade', pad };
  const problem = liveError(match, entry);
  if (problem) return { ok: false, error: problem };
  const tower = match.towers[pad];
  const cost = TOWER_TYPES[tower.type].cost[tower.level];
  if (match.gold < cost) {
    return { ok: false, error: error('gold', `Not enough gold to upgrade pad ${pad}. It costs ${cost}.`) };
  }
  applyStep(match, entry);
  return { ok: true, view: viewOf(match) };
}

function hurt(enemy, amount, source, match, bag) {
  if (enemy.hp <= 0 || enemy.leaked || amount <= 0) return;
  enemy.hp -= amount;
  if (source) source.dealt += amount;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    if (source) source.kills += 1;
    match.kills += 1;
    bag.gold += enemy.gold;
    bag.killed += 1;
    if (enemy.heldBy) {
      enemy.heldBy.holding = null;
      enemy.heldBy = null;
    }
  }
}

function leak(enemy, match, bag) {
  if (enemy.leaked || enemy.hp <= 0) return;
  enemy.leaked = true;
  enemy.hp = 0;
  match.hearts = Math.max(0, match.hearts - enemy.leak);
  bag.leaked += 1;
  if (enemy.heldBy) {
    enemy.heldBy.holding = null;
    enemy.heldBy = null;
  }
  if (match.hearts <= 0) match.fallen = true;
}

function shotDamage(tower, night) {
  let damage = tower.damagePerShot;
  if (night && tower.type === 'archer') damage = Math.round(damage * 85 / 100);
  if (night && tower.type === 'mage') damage = Math.round(damage * 115 / 100);
  if (tower.empower) damage = Math.round(damage * (1000 + tower.empower) / 1000);
  return Math.max(1, damage);
}

function empowerTarget(match) {
  const choices = match.towers.filter((tower) => tower && tower.damagePerShot > 0);
  choices.sort((a, b) => b.level - a.level || b.dealt - a.dealt || a.pad - b.pad);
  return choices[0] || null;
}

function spawn(match, wave) {
  const enemies = [];
  let cursor = 0;
  let id = 0;
  const hpMul = wave.hpMul || 1;
  const speedMil = wave.speedMil || 1000;
  for (const group of wave.groups) {
    for (let index = 0; index < group.count; index += 1) {
      const jitter = nextRng(match) % 80;
      const hp = group.hp * hpMul;
      enemies.push({
        id: id += 1,
        kind: group.kind,
        x: -(cursor + jitter),
        hp,
        maxHp: hp,
        speed: Math.max(40, Math.round(group.speed * speedMil / 1000)),
        armor: group.armor,
        gold: group.gold,
        leak: group.leak,
        bite: group.bite,
        slipPad0: !!group.slipPad0,
        unblockable: !!group.unblockable,
        slowUntil: -1,
        slowMil: 1000,
        leaked: false,
        heldBy: null,
      });
      cursor += group.gap;
      if (group.pairs && index % 2 === 1) cursor += group.pairBreak;
    }
  }
  return enemies;
}

function resolveWave(match, wave, replay) {
  for (const knight of match.knights) {
    knight.holding = null;
    if (knight.hp <= 0) knight.hp = Math.max(1, Math.round(knight.maxHp * 35 / 100));
  }
  const paladin = match.towers.find((tower) => tower && tower.type === 'paladin');
  if (paladin && wave.id >= PALADIN_WAVE) {
    const heal = TOWER_TYPES.paladin.heal[paladin.level - 1];
    for (const knight of match.knights) knight.hp = Math.min(knight.maxHp, knight.hp + heal);
    const target = empowerTarget(match);
    if (target) target.empower = TOWER_TYPES.paladin.empower[paladin.level - 1];
  }
  for (const tower of match.towers) if (tower) tower.cd = 0;
  const enemies = spawn(match, wave);
  const frames = [];
  const shots = [];
  const bag = { killed: 0, leaked: 0, gold: 0 };
  const night = !!wave.night;
  for (let tick = 0; tick < 1400 && !match.fallen; tick += 1) {
    shots.length = 0;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.leaked || enemy.heldBy) continue;
      let speed = enemy.speed;
      if (tick < enemy.slowUntil) speed = Math.max(30, Math.round(speed * enemy.slowMil / 1000));
      if (paladin && Math.abs(enemy.x - paladin.pos) <= paladin.range) speed = Math.max(30, Math.round(speed * 62 / 100));
      enemy.x += speed;
      if (!enemy.unblockable) {
        const open = match.knights.filter((knight) => knight.hp > 0 && !knight.holding).sort((a, b) => a.pad - b.pad);
        for (const knight of open) {
          if (enemy.slipPad0 && knight.pad === 0) continue;
          if (enemy.x >= knight.pos - 220 && enemy.x <= knight.pos + 60) {
            enemy.heldBy = knight;
            knight.holding = enemy;
            enemy.x = knight.pos;
            break;
          }
        }
      }
      if (!enemy.heldBy && enemy.x >= MAP.length) leak(enemy, match, bag);
      if (match.fallen) break;
    }
    if (match.fallen) break;
    for (const tower of match.towers) {
      if (!tower || tower.damagePerShot <= 0) continue;
      if (tower.cd > 0) {
        tower.cd -= 1;
        continue;
      }
      const inRange = enemies.filter((enemy) => enemy.hp > 0 && !enemy.leaked && Math.abs(enemy.x - tower.pos) <= tower.range);
      if (!inRange.length) continue;
      inRange.sort((a, b) => b.x - a.x || a.id - b.id);
      const target = inRange[0];
      const damage = shotDamage(tower, night);
      const victims = tower.splash ? inRange.filter((enemy) => Math.abs(enemy.x - target.x) <= tower.splash) : [target];
      for (const victim of victims) {
        hurt(victim, Math.max(1, damage - victim.armor), tower, match, bag);
        if (tower.slow) {
          victim.slowUntil = tick + tower.slowTicks;
          victim.slowMil = tower.slow;
        }
      }
      tower.cd = tower.cooldown;
      if (replay) shots.push({ pad: tower.pad, x: target.x, tower: tower.type });
    }
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.leaked) continue;
      if (enemy.unblockable) {
        for (const knight of match.knights) {
          if (knight.hp <= 0 || Math.abs(enemy.x - knight.pos) > 260) continue;
          const barracks = match.towers[knight.pad];
          hurt(enemy, knight.dmg, barracks, match, bag);
        }
        continue;
      }
      if (!enemy.heldBy || enemy.heldBy.hp <= 0) continue;
      const knight = enemy.heldBy;
      const barracks = match.towers[knight.pad];
      hurt(enemy, knight.dmg, barracks, match, bag);
      if (enemy.hp > 0) {
        knight.hp -= enemy.bite;
        if (knight.hp <= 0) {
          knight.hp = 0;
          knight.holding = null;
          enemy.heldBy = null;
        }
      }
    }
    if (replay && tick % 4 === 0) {
      frames.push({
        t: tick,
        units: enemies.filter((enemy) => enemy.hp > 0 && !enemy.leaked).map((enemy) => ({
          id: enemy.id, kind: enemy.kind, x: enemy.x, hp: enemy.hp, max: enemy.maxHp,
        })),
        shots: shots.slice(),
      });
    }
    if (enemies.every((enemy) => enemy.hp <= 0 || enemy.leaked)) break;
  }
  if (!match.fallen) {
    for (const enemy of enemies) {
      if (enemy.hp > 0 && !enemy.leaked) leak(enemy, match, bag);
    }
  }
  for (const knight of match.knights) knight.holding = null;
  for (const tower of match.towers) if (tower) tower.empower = 0;
  match.gold += bag.gold;
  const cleared = match.hearts > 0;
  if (cleared) {
    match.gold += wave.bonus;
    match.wavesCleared += 1;
    match.nextWave += 1;
  } else {
    match.fallen = true;
  }
  const summary = {
    wave: wave.id,
    name: wave.name,
    night: !!wave.night,
    killed: bag.killed,
    leaked: bag.leaked,
    hearts: match.hearts,
    gold: match.gold,
    cleared,
  };
  if (replay) summary.frames = frames;
  match.log.push(summary);
  return summary;
}

function mvpOf(match) {
  const towers = match.towers.filter(Boolean).sort((a, b) => b.dealt - a.dealt || b.kills - a.kills || a.pad - b.pad);
  const top = towers[0];
  if (!top || top.dealt <= 0) return { mvp: '', mvpDamage: 0 };
  return { mvp: `${top.type}@pad${top.pad}`, mvpDamage: top.dealt };
}

function starsOf(match) {
  if (match.wavesCleared < WAVES.length || match.hearts <= 0) return 0;
  if (match.hearts >= 18) return 3;
  if (match.hearts >= 12) return 2;
  return 1;
}

function scoreOf(match, stars) {
  return match.kills * 100 + match.gold * 10 + match.hearts * 25 + stars * 500 + match.wavesCleared * 40;
}

export function sensoryCue(summary) {
  if (summary.survived && summary.mvp.startsWith('gong@')) return 'bronze_gong';
  if (summary.survived && summary.stars === 3) return 'mint_crown';
  return 'loom_pluck';
}

function proofFor(summary, steps) {
  const body = [
    SPEC,
    CAMPAIGN,
    String(summary.seed),
    summary.agent,
    canonicalSteps(steps),
    String(summary.wavesCleared),
    String(summary.hearts),
    String(summary.kills),
    String(summary.gold),
    String(summary.score),
    String(summary.stars),
    summary.mvp,
  ].join('|');
  return sha256hex(body).slice(0, 12);
}

export function viewOf(match) {
  const stars = match.fallen || match.nextWave > WAVES.length ? starsOf(match) : 0;
  const done = match.fallen || match.nextWave > WAVES.length;
  const mvp = mvpOf(match);
  return {
    seed: match.seed,
    gold: match.gold,
    hearts: match.hearts,
    heartsMax: MAX_HEARTS,
    nextWave: Math.min(match.nextWave, WAVES.length),
    waveCount: WAVES.length,
    fallen: match.fallen,
    survived: done && !match.fallen && match.wavesCleared === WAVES.length,
    done,
    wavesCleared: match.wavesCleared,
    kills: match.kills,
    stars: done ? stars : 0,
    score: done ? scoreOf(match, stars) : 0,
    mvp: done ? mvp.mvp : '',
    mvpDamage: done ? mvp.mvpDamage : 0,
    towers: match.towers.map((tower, pad) => (tower ? {
      pad, tower: tower.type, name: tower.name, level: tower.level, damage: tower.dealt, kills: tower.kills,
    } : { pad, tower: null })),
    knights: match.knights.map((knight) => ({ pad: knight.pad, hp: knight.hp, maxHp: knight.maxHp })),
    log: match.log.map(({ frames, ...row }) => row),
  };
}

function publish(match, agent, steps, applied, refused) {
  const stars = starsOf(match);
  const mvp = mvpOf(match);
  const summary = {
    ok: true,
    spec: SPEC,
    campaign: CAMPAIGN,
    version: VERSION,
    seed: match.seed,
    agent,
    survived: !match.fallen && match.wavesCleared === WAVES.length,
    fallen: match.fallen,
    wavesCleared: match.wavesCleared,
    hearts: match.hearts,
    heartsMax: MAX_HEARTS,
    kills: match.kills,
    gold: match.gold,
    stars,
    score: scoreOf(match, stars),
    mvp: mvp.mvp,
    mvpDamage: mvp.mvpDamage,
    waves: match.log,
    towers: viewOf(match).towers.filter((tower) => tower.tower),
    stepsApplied: applied,
    stepsRefused: refused,
  };
  summary.proof = proofFor(summary, steps);
  summary.sensory = { spec: 'pointcast.sensory.mcp/v1', cue: sensoryCue(summary) };
  return summary;
}

export function playNext(match, options = {}) {
  if (match.fallen || match.nextWave > WAVES.length) {
    return { ok: false, error: error('campaign_over', 'This run is already over.') };
  }
  const summary = resolveWave(match, WAVES[match.nextWave - 1], !!options.replay);
  return { ok: true, wave: summary, view: viewOf(match) };
}

export function simulatePlan({ seed, agent, steps, replay = false }) {
  const problem = validatePlan({ seed, agent, steps });
  if (problem) return { ok: false, error: problem };
  const match = fresh(seed);
  const applied = [];
  const refused = [];
  while (!match.fallen && match.nextWave <= WAVES.length) {
    const due = steps.filter((entry) => entry.wave === match.nextWave);
    for (const entry of due) {
      const result = applyStep(match, entry);
      if (result.applied) applied.push(result);
      else refused.push(result);
    }
    resolveWave(match, WAVES[match.nextWave - 1], replay);
  }
  return publish(match, agent, steps, applied, refused);
}

export function compareRuns(a, b) {
  return b.score - a.score || b.hearts - a.hearts || b.gold - a.gold || b.kills - a.kills || (a.agent < b.agent ? -1 : a.agent > b.agent ? 1 : 0);
}

export function playExhibition(seed = 1126) {
  const seedError = checkSeed(seed);
  if (seedError) return { ok: false, error: seedError };
  const runs = EXHIBITION.map((entry) => simulatePlan({ seed, agent: entry.agent, steps: entry.steps }));
  const failed = runs.find((run) => !run.ok);
  if (failed) return failed;
  const ranked = [...runs].sort(compareRuns).map((run, index) => ({ place: index + 1, ...run }));
  return { ok: true, spec: SPEC, campaign: CAMPAIGN, seed, runs: ranked };
}

export function catalog() {
  return {
    spec: SPEC,
    campaign: CAMPAIGN,
    version: VERSION,
    hearts: MAX_HEARTS,
    startingGold: STARTING_GOLD,
    pads: MAP.pads.map((pos, pad) => ({ pad, pos })),
    towers: Object.entries(TOWER_TYPES).map(([id, tower]) => ({
      id,
      name: tower.name,
      role: tower.role,
      cost: tower.cost,
      maxLevel: tower.cost.length,
      unlockWave: tower.unlockWave || 1,
    })),
    waves: WAVES.map((wave) => ({
      wave: wave.id,
      name: wave.name,
      night: !!wave.night,
      hpMul: wave.hpMul || 1,
      speedMil: wave.speedMil || 1000,
      groups: wave.groups.map((group) => ({
        kind: group.kind,
        count: group.count,
        slipPad0: !!group.slipPad0,
        pairs: !!group.pairs,
        boss: !!group.unblockable,
      })),
    })),
    stars: '3 at 18 or more hearts after all 10 waves, 2 at 12 or more, 1 if the hearth still stands. A fallen run scores 0 stars.',
    score: 'kills×100 + leftover gold×10 + hearts×25 + stars×500 + waves cleared×40',
    paladin: 'The Signing Desk Paladin can be placed from wave 6. Each later wave it heals barracks knights and empowers one tower. Enemies in its aura are slowed. It cannot be rushed.',
    exhibition: EXHIBITION.map((entry) => entry.agent),
    sprites: SPRITES.map((sprite) => ({ ...sprite, src: SPRITE_SRC[sprite.id] })),
    sensory: { spec: 'pointcast.sensory.mcp/v1', cues: ['bronze_gong', 'loom_pluck', 'mint_crown'] },
  };
}
