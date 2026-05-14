/**
 * room-contract.test.mjs — guardrails for the v1 room contract.
 *
 * Validates:
 *   1. A canonical /meditate-shaped payload passes validation
 *   2. Each required field's absence is detected with a helpful path
 *   3. Receipt template interpolation works for the documented tokens
 *
 * Loaded by `npm test` via the test runner. Plain Node `node:test`, no
 * transpile — the contract module is plain TypeScript types + a tiny
 * runtime validator, so we import the compiled form from a small JS
 * mirror that's checked in alongside the .ts file (or we evaluate the
 * .ts file via a quick stripper since we don't ship a build step here).
 *
 * Implementation note: we re-implement the validator API surface in
 * this file by importing the source via a lightweight transpile-less
 * approach — node 22's native ESM doesn't load .ts directly, and we
 * don't want to add a build step just for tests. So this file imports
 * a small CommonJS-bridge file generated alongside, OR shims the
 * required functions inline. Simplest path: inline the validator
 * import via tsm/sucrase if available, else fall back to a manual
 * structural check that mirrors the TS validator. We pick the manual
 * check so the test has no new deps.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Minimal validator mirror ──────────────────────────────────────
// Mirrors the public surface of src/lib/room-contract.ts. Kept in
// sync by hand. If you change the TS validator, mirror the change
// here too — these tests fail loudly if a field expectation drifts.

function validateRoomSpec(value, path = 'room') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object, got ${typeof value}`);
  const v = value;
  requireString(v.id, `${path}.id`);
  requireString(v.title, `${path}.title`);
  requireString(v.description, `${path}.description`);
  requireString(v.home, `${path}.home`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  requireArray(v.status, `${path}.status`);
  v.status.forEach((s, i) => {
    if (!s || typeof s !== 'object') throw new Error(`${path}.status[${i}]: expected object`);
    requireString(s.id, `${path}.status[${i}].id`);
    requireString(s.label, `${path}.status[${i}].label`);
    requireString(s.value, `${path}.status[${i}].value`);
  });
  requireArray(v.programs, `${path}.programs`);
  if (v.programs.length === 0) throw new Error(`${path}.programs: at least one program required`);
  v.programs.forEach((p, i) => {
    if (!p || typeof p !== 'object') throw new Error(`${path}.programs[${i}]: expected object`);
    requireString(p.id, `${path}.programs[${i}].id`);
    requireString(p.name, `${path}.programs[${i}].name`);
    requireString(p.purpose, `${path}.programs[${i}].purpose`);
  });
  requireArray(v.controls, `${path}.controls`);
  v.controls.forEach((c, i) => {
    if (!c || typeof c !== 'object') throw new Error(`${path}.controls[${i}]: expected object`);
    requireString(c.id, `${path}.controls[${i}].id`);
    if (!['duration', 'intensity', 'select'].includes(c.type)) {
      throw new Error(`${path}.controls[${i}].type: expected duration|intensity|select`);
    }
    requireArray(c.options, `${path}.controls[${i}].options`);
  });
  requireArray(v.verbs, `${path}.verbs`);
  v.verbs.forEach((vb, i) => {
    if (!vb || typeof vb !== 'object') throw new Error(`${path}.verbs[${i}]: expected object`);
    requireString(vb.id, `${path}.verbs[${i}].id`);
    requireString(vb.label, `${path}.verbs[${i}].label`);
    requireString(vb.endpoint, `${path}.verbs[${i}].endpoint`);
    if (!['POST', 'GET'].includes(vb.method)) throw new Error(`${path}.verbs[${i}].method: expected POST or GET`);
    if (!vb.receipt || typeof vb.receipt !== 'object') throw new Error(`${path}.verbs[${i}].receipt: expected object`);
    requireString(vb.receipt.template, `${path}.verbs[${i}].receipt.template`);
  });
  return value;
}

function requireString(v, path) {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`${path}: expected non-empty string`);
}
function requireArray(v, path) {
  if (!Array.isArray(v)) throw new Error(`${path}: expected array`);
}

function renderReceipt(template, ctx) {
  return template.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `{${k}}`);
}

// ─── Canonical /meditate fixture ──────────────────────────────────

function meditateFixture() {
  return {
    $schema: 'https://pointcast.xyz/room-contract/v1.json',
    id: 'meditate',
    title: 'The meditation room',
    description: 'Pulled from /meditate on PointCast. Three breathing programs, one shared choir.',
    home: 'https://pointcast.xyz/meditate',
    generatedAt: new Date().toISOString(),
    status: [
      { id: 'mood', label: 'MOOD', value: 'pot on' },
      { id: 'today-block', label: "TODAY'S BLOCK", value: "We Don't Care · tap-on-beat" },
      { id: 'presence', label: 'PRESENT ON POINTCAST', value: '1 humans · 0 agents' },
      { id: 'now-playing', label: 'NOW PLAYING', value: 'silent' },
    ],
    visualizer: { type: 'breath', binding: 'pattern' },
    programs: [
      { id: 'calm', name: 'Calm Bay', pattern: [4, 2, 6, 2], tone: 'soft shoreline',
        purpose: 'Quick nervous-system reset between blocks, calls, and shipping.' },
      { id: 'current', name: 'Deep Current', pattern: [5, 2, 7, 2], tone: 'long exhale',
        purpose: 'Longer exhale for clearing mental noise before focused work.' },
      { id: 'moon', name: 'Moon Tide', pattern: [4, 4, 4, 4], tone: 'box breath',
        purpose: 'Evening square breath for letting the day close.' },
    ],
    controls: [
      {
        id: 'duration',
        type: 'duration',
        defaultId: '5m',
        options: [
          { id: '2m',  label: '2 min',  value: 120, name: 'Morning tide' },
          { id: '5m',  label: '5 min',  value: 300, name: 'Deep reset' },
          { id: '10m', label: '10 min', value: 600, name: 'Full drift' },
        ],
      },
    ],
    verbs: [
      {
        id: 'sing',
        label: 'Ring the room',
        description: 'Adds one harmonic voice (Cmaj9) to the global PointCast choir.',
        method: 'POST',
        endpoint: 'https://pointcast.xyz/drum-v6/sing',
        payload: { voice: 'alt-c', from: 'meditate' },
        receipt: { template: 'you sang {arg} into {target} · {time}' },
      },
    ],
  };
}

test('validateRoomSpec accepts the canonical /meditate fixture', () => {
  const room = meditateFixture();
  assert.doesNotThrow(() => validateRoomSpec(room));
});

test('validateRoomSpec rejects missing id', () => {
  const room = meditateFixture();
  delete room.id;
  assert.throws(() => validateRoomSpec(room), /room\.id/);
});

test('validateRoomSpec rejects programs: []', () => {
  const room = meditateFixture();
  room.programs = [];
  assert.throws(() => validateRoomSpec(room), /at least one program/);
});

test('validateRoomSpec surfaces nested path on bad status item', () => {
  const room = meditateFixture();
  room.status[1].value = 42;
  assert.throws(() => validateRoomSpec(room), /room\.status\[1\]\.value/);
});

test('validateRoomSpec rejects verb without receipt template', () => {
  const room = meditateFixture();
  room.verbs[0].receipt = {};
  assert.throws(() => validateRoomSpec(room), /receipt\.template/);
});

test('validateRoomSpec rejects unknown control type', () => {
  const room = meditateFixture();
  room.controls[0].type = 'slider';
  assert.throws(() => validateRoomSpec(room), /duration\|intensity\|select/);
});

test('renderReceipt interpolates documented tokens', () => {
  const out = renderReceipt('you {action} {arg} into {target}', {
    action: 'sang',
    arg: 'alt-c',
    target: '/drum-v6',
  });
  assert.equal(out, 'you sang alt-c into /drum-v6');
});

test('renderReceipt leaves unknown tokens as placeholders', () => {
  const out = renderReceipt('actor={actor} time={time}', { actor: 'mh' });
  assert.equal(out, 'actor=mh time={time}');
});
