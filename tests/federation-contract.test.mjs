/**
 * federation-contract.test.mjs — guardrails for NodeSpec + PresenceSpec.
 *
 * Mirrors the validators in src/lib/federation-contract.ts. Loaded by
 * `npm run test:rooms` (or via the umbrella `npm test`).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── NodeSpec validator (mirrors src/lib/federation-contract.ts) ─────

function validateNodeSpec(value, path = 'node') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object, got ${typeof value}`);
  const v = value;
  requireString(v.id, `${path}.id`);
  requireString(v.name, `${path}.name`);
  requireString(v.description, `${path}.description`);
  requireString(v.home, `${path}.home`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  requireArray(v.rooms, `${path}.rooms`);
  v.rooms.forEach((r, i) => {
    if (!r || typeof r !== 'object') throw new Error(`${path}.rooms[${i}]: expected object`);
    requireString(r.id, `${path}.rooms[${i}].id`);
    requireString(r.title, `${path}.rooms[${i}].title`);
    requireString(r.url, `${path}.rooms[${i}].url`);
    requireString(r.jsonUrl, `${path}.rooms[${i}].jsonUrl`);
    if (r.status !== undefined && !['open', 'closed', 'scheduled', 'beta'].includes(r.status)) {
      throw new Error(`${path}.rooms[${i}].status: expected open|closed|scheduled|beta`);
    }
    if (r.visualizer !== undefined && !['breath', 'pour', 'tap', 'wave', 'lantern'].includes(r.visualizer)) {
      throw new Error(`${path}.rooms[${i}].visualizer: expected breath|pour|tap|wave|lantern`);
    }
  });
  if (v.federatedFrom !== undefined) {
    requireArray(v.federatedFrom, `${path}.federatedFrom`);
    v.federatedFrom.forEach((r, i) => {
      if (!r || typeof r !== 'object') throw new Error(`${path}.federatedFrom[${i}]: expected object`);
      requireString(r.id, `${path}.federatedFrom[${i}].id`);
      requireString(r.home, `${path}.federatedFrom[${i}].home`);
      requireString(r.nodeJsonUrl, `${path}.federatedFrom[${i}].nodeJsonUrl`);
    });
  }
  return value;
}

function validatePresenceSpec(value, path = 'presence') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value;
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  requireNumber(v.humans, `${path}.humans`);
  requireNumber(v.agents, `${path}.agents`);
  requireNumber(v.total, `${path}.total`);
  if (v.recent !== undefined) requireArray(v.recent, `${path}.recent`);
  return value;
}

function requireString(v, path) {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`${path}: expected non-empty string`);
}
function requireArray(v, path) {
  if (!Array.isArray(v)) throw new Error(`${path}: expected array`);
}
function requireNumber(v, path) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new Error(`${path}: expected non-negative finite number`);
  }
}

function formatPresenceBadge(p) {
  return `${p.humans} humans · ${p.agents} agents`;
}

// ─── Fixtures ────────────────────────────────────────────────────────

function nodeFixture() {
  return {
    $schema: 'https://pointcast.xyz/federation-contract/v1.json',
    id: 'pointcast',
    name: 'PointCast',
    description: 'An agent-native broadcast from El Segundo.',
    home: 'https://pointcast.xyz',
    generatedAt: new Date().toISOString(),
    rooms: [
      { id: 'meditate', title: 'The meditation room', url: 'https://pointcast.xyz/r/meditate', jsonUrl: 'https://pointcast.xyz/meditate.json', status: 'open', visualizer: 'breath' },
    ],
    federatedFrom: [
      { id: 'pointcast', home: 'https://pointcast.xyz', nodeJsonUrl: 'https://pointcast.xyz/node.json' },
    ],
  };
}

function presenceFixture() {
  return {
    $schema: 'https://pointcast.xyz/presence-contract/v1.json',
    nodeId: 'pointcast',
    humans: 1,
    agents: 0,
    total: 1,
    recent: [],
    generatedAt: new Date().toISOString(),
  };
}

// ─── NodeSpec tests ─────────────────────────────────────────────────

test('validateNodeSpec accepts the canonical fixture', () => {
  assert.doesNotThrow(() => validateNodeSpec(nodeFixture()));
});

test('validateNodeSpec rejects missing id', () => {
  const n = nodeFixture(); delete n.id;
  assert.throws(() => validateNodeSpec(n), /node\.id/);
});

test('validateNodeSpec rejects missing rooms array', () => {
  const n = nodeFixture(); delete n.rooms;
  assert.throws(() => validateNodeSpec(n), /node\.rooms/);
});

test('validateNodeSpec rejects bad room status enum', () => {
  const n = nodeFixture(); n.rooms[0].status = 'mostly-open';
  assert.throws(() => validateNodeSpec(n), /status/);
});

test('validateNodeSpec rejects bad visualizer enum', () => {
  const n = nodeFixture(); n.rooms[0].visualizer = 'fog';
  assert.throws(() => validateNodeSpec(n), /visualizer/);
});

test('validateNodeSpec accepts empty federatedFrom (a node without subscribers)', () => {
  const n = nodeFixture(); n.federatedFrom = [];
  assert.doesNotThrow(() => validateNodeSpec(n));
});

test('validateNodeSpec rejects malformed federatedFrom item', () => {
  const n = nodeFixture(); n.federatedFrom[0] = { home: 'https://x' };
  assert.throws(() => validateNodeSpec(n), /federatedFrom\[0\]\.id/);
});

// ─── PresenceSpec tests ─────────────────────────────────────────────

test('validatePresenceSpec accepts the canonical fixture', () => {
  assert.doesNotThrow(() => validatePresenceSpec(presenceFixture()));
});

test('validatePresenceSpec rejects negative humans count', () => {
  const p = presenceFixture(); p.humans = -1;
  assert.throws(() => validatePresenceSpec(p), /humans/);
});

test('validatePresenceSpec rejects non-finite counts', () => {
  const p = presenceFixture(); p.agents = Infinity;
  assert.throws(() => validatePresenceSpec(p), /agents/);
});

test('formatPresenceBadge produces "X humans · Y agents"', () => {
  assert.equal(formatPresenceBadge({ humans: 3, agents: 2 }), '3 humans · 2 agents');
  assert.equal(formatPresenceBadge({ humans: 0, agents: 0 }), '0 humans · 0 agents');
});
