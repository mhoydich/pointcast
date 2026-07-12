/**
 * signal-contract.test.mjs — guardrails for SignalEvent + SignalFeed +
 * applyFilter + sortAndCap.
 *
 * Mirrors src/lib/signal-contract.ts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const VALID_KINDS = [
  'block_published',
  'room_opened',
  'room_closed',
  'verb_fired',
  'presence_change',
  'federation_subscribed',
  'ship_landed',
];

function validateSignalEvent(value, path = 'event') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value;
  requireString(v.id, `${path}.id`);
  requireString(v.at, `${path}.at`);
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.headline, `${path}.headline`);
  if (!VALID_KINDS.includes(v.kind)) {
    throw new Error(`${path}.kind: expected one of ${VALID_KINDS.join('|')}`);
  }
  return v;
}

function validateSignalFeed(value, path = 'feed') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value;
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  if (typeof v.count !== 'number' || v.count < 0) throw new Error(`${path}.count`);
  if (!Array.isArray(v.events)) throw new Error(`${path}.events`);
  v.events.forEach((e, i) => validateSignalEvent(e, `${path}.events[${i}]`));
  return v;
}

function requireString(v, path) {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`${path}: expected non-empty string`);
}

function sortAndCap(events, maxEvents = 200) {
  return [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, maxEvents);
}

function applyFilter(events, filter) {
  const cutoff = filter.sinceMs ? Date.now() - filter.sinceMs : null;
  return events.filter((e) => {
    if (filter.kinds && !filter.kinds.includes(e.kind)) return false;
    if (filter.room && e.room !== filter.room) return false;
    if (cutoff !== null && +new Date(e.at) < cutoff) return false;
    return true;
  });
}

// ─── Fixtures ────────────────────────────────────────────────────────

function eventFixture(overrides = {}) {
  return {
    id: 'blk_0337',
    at: '2026-05-14T10:00:00Z',
    kind: 'block_published',
    nodeId: 'pointcast',
    headline: 'The meditation room',
    href: '/b/0337',
    ...overrides,
  };
}

function feedFixture(overrides = {}) {
  return {
    $schema: 'https://pointcast.xyz/signal-contract/v1.json',
    nodeId: 'pointcast',
    generatedAt: new Date().toISOString(),
    count: 1,
    events: [eventFixture()],
    ...overrides,
  };
}

// ─── Event tests ─────────────────────────────────────────────────────

test('validateSignalEvent accepts canonical fixture', () => {
  assert.doesNotThrow(() => validateSignalEvent(eventFixture()));
});

test('validateSignalEvent rejects unknown kind', () => {
  assert.throws(() => validateSignalEvent(eventFixture({ kind: 'pizza_cooled' })), /kind/);
});

test('validateSignalEvent rejects missing headline', () => {
  const e = eventFixture(); delete e.headline;
  assert.throws(() => validateSignalEvent(e), /headline/);
});

test('validateSignalEvent accepts all VALID_KINDS', () => {
  VALID_KINDS.forEach((k) => {
    assert.doesNotThrow(() => validateSignalEvent(eventFixture({ id: `e_${k}`, kind: k })));
  });
});

// ─── Feed tests ──────────────────────────────────────────────────────

test('validateSignalFeed accepts canonical fixture', () => {
  assert.doesNotThrow(() => validateSignalFeed(feedFixture()));
});

test('validateSignalFeed rejects negative count', () => {
  assert.throws(() => validateSignalFeed(feedFixture({ count: -1 })), /count/);
});

test('validateSignalFeed surfaces nested path on bad event', () => {
  const f = feedFixture({ events: [eventFixture(), eventFixture({ kind: 'taco' })] });
  assert.throws(() => validateSignalFeed(f), /events\[1\]\.kind/);
});

// ─── sortAndCap tests ───────────────────────────────────────────────

test('sortAndCap orders newest first and caps', () => {
  const a = eventFixture({ id: 'a', at: '2026-05-14T08:00:00Z' });
  const b = eventFixture({ id: 'b', at: '2026-05-14T10:00:00Z' });
  const c = eventFixture({ id: 'c', at: '2026-05-14T09:00:00Z' });
  const out = sortAndCap([a, b, c], 2);
  assert.deepEqual(out.map((e) => e.id), ['b', 'c']);
});

test('sortAndCap does not mutate input', () => {
  const input = [
    eventFixture({ id: 'a', at: '2026-05-14T08:00:00Z' }),
    eventFixture({ id: 'b', at: '2026-05-14T10:00:00Z' }),
  ];
  const snapshot = input.map((e) => e.id).join(',');
  sortAndCap(input);
  assert.equal(input.map((e) => e.id).join(','), snapshot);
});

// ─── applyFilter tests ──────────────────────────────────────────────

test('applyFilter by kinds', () => {
  const evs = [
    eventFixture({ id: 'a', kind: 'block_published' }),
    eventFixture({ id: 'b', kind: 'ship_landed' }),
    eventFixture({ id: 'c', kind: 'verb_fired' }),
  ];
  const out = applyFilter(evs, { kinds: ['block_published', 'ship_landed'] });
  assert.deepEqual(out.map((e) => e.id).sort(), ['a', 'b']);
});

test('applyFilter by room', () => {
  const evs = [
    eventFixture({ id: 'a', room: 'meditate' }),
    eventFixture({ id: 'b', room: 'coffee' }),
    eventFixture({ id: 'c' }),
  ];
  const out = applyFilter(evs, { room: 'meditate' });
  assert.deepEqual(out.map((e) => e.id), ['a']);
});

test('applyFilter by sinceMs drops old events', () => {
  const now = Date.now();
  const evs = [
    eventFixture({ id: 'old', at: new Date(now - 10 * 60_000).toISOString() }),
    eventFixture({ id: 'new', at: new Date(now - 30_000).toISOString() }),
  ];
  const out = applyFilter(evs, { sinceMs: 60_000 }); // last 1 min
  assert.deepEqual(out.map((e) => e.id), ['new']);
});
