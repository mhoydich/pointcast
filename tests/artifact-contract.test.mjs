/**
 * artifact-contract.test.mjs — guardrails for Artifact + ArtifactFeed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const VALID_KINDS = ['svg', 'one-liner', 'polaroid', 'link'];

function validateArtifact(value, path = 'artifact') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value;
  requireString(v.id, `${path}.id`);
  requireString(v.createdAt, `${path}.createdAt`);
  requireString(v.roomId, `${path}.roomId`);
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.title, `${path}.title`);
  if (!VALID_KINDS.includes(v.kind)) {
    throw new Error(`${path}.kind: expected one of ${VALID_KINDS.join('|')}`);
  }
  if (!v.content || typeof v.content !== 'object') throw new Error(`${path}.content: expected object`);
  const c = v.content;
  if (c.kind !== v.kind) throw new Error(`${path}.content.kind: must match outer kind (${v.kind})`);
  switch (v.kind) {
    case 'svg':       requireString(c.svg,   `${path}.content.svg`);   break;
    case 'one-liner': requireString(c.text,  `${path}.content.text`);  break;
    case 'polaroid':  requireString(c.image, `${path}.content.image`); requireString(c.alt, `${path}.content.alt`); break;
    case 'link':      requireString(c.url,   `${path}.content.url`);   break;
  }
  return v;
}

function validateArtifactFeed(value, path = 'feed') {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value;
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  if (typeof v.count !== 'number' || v.count < 0) throw new Error(`${path}.count`);
  if (!Array.isArray(v.artifacts)) throw new Error(`${path}.artifacts`);
  v.artifacts.forEach((a, i) => validateArtifact(a, `${path}.artifacts[${i}]`));
  return v;
}

function artifactsForRoom(arts, roomId, now = new Date()) {
  return arts
    .filter((a) => a.roomId === roomId)
    .filter((a) => !a.expiresAt || new Date(a.expiresAt) > now)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function formatCreator(a) { return a.creator ?? `anon@${a.nodeId}`; }

function requireString(v, path) {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`${path}: expected non-empty string`);
}

function svgFixture() {
  return {
    id: 'art_a', createdAt: '2026-05-14T08:00:00Z', kind: 'svg',
    roomId: 'meditate', nodeId: 'pointcast', creator: 'cc',
    title: 'wave', caption: 'shoreline', content: { kind: 'svg', svg: '<svg/>' },
  };
}
function onelinerFixture() {
  return { id: 'art_b', createdAt: '2026-05-14T08:01:00Z', kind: 'one-liner', roomId: 'meditate', nodeId: 'pointcast', title: 'note', content: { kind: 'one-liner', text: 'silver quiet' } };
}
function polaroidFixture() {
  return { id: 'art_c', createdAt: '2026-05-14T08:02:00Z', kind: 'polaroid', roomId: 'meditate', nodeId: 'pointcast', title: 'shore', content: { kind: 'polaroid', image: '/x.png', alt: 'shoreline polaroid' } };
}
function linkFixture() {
  return { id: 'art_d', createdAt: '2026-05-14T08:03:00Z', kind: 'link', roomId: 'meditate', nodeId: 'pointcast', title: 'block', content: { kind: 'link', url: 'https://x' } };
}

test('validateArtifact accepts all four kinds', () => {
  [svgFixture(), onelinerFixture(), polaroidFixture(), linkFixture()].forEach((a) => {
    assert.doesNotThrow(() => validateArtifact(a));
  });
});

test('validateArtifact rejects mismatched inner kind', () => {
  const a = svgFixture(); a.content = { kind: 'one-liner', text: 'oops' };
  assert.throws(() => validateArtifact(a), /content\.kind/);
});

test('validateArtifact rejects unknown kind', () => {
  const a = svgFixture(); a.kind = 'gif'; a.content = { kind: 'gif' };
  assert.throws(() => validateArtifact(a), /kind/);
});

test('validateArtifact rejects polaroid without alt', () => {
  const a = polaroidFixture(); delete a.content.alt;
  assert.throws(() => validateArtifact(a), /alt/);
});

test('validateArtifact rejects missing roomId', () => {
  const a = svgFixture(); delete a.roomId;
  assert.throws(() => validateArtifact(a), /roomId/);
});

test('validateArtifactFeed accepts mixed-kind feed', () => {
  const f = {
    $schema: 'https://pointcast.xyz/artifact-contract/v1.json',
    nodeId: 'pointcast',
    generatedAt: new Date().toISOString(),
    count: 4,
    artifacts: [svgFixture(), onelinerFixture(), polaroidFixture(), linkFixture()],
  };
  assert.doesNotThrow(() => validateArtifactFeed(f));
});

test('validateArtifactFeed surfaces nested path on bad item', () => {
  const f = {
    $schema: 'x', nodeId: 'pointcast', generatedAt: new Date().toISOString(),
    count: 2,
    artifacts: [svgFixture(), { ...onelinerFixture(), content: { kind: 'polaroid' } }],
  };
  assert.throws(() => validateArtifactFeed(f), /feed\.artifacts\[1\]\.content\.kind/);
});

test('artifactsForRoom filters by roomId + sorts newest-first', () => {
  const a = { ...svgFixture(), id: 'old', createdAt: '2026-05-14T06:00:00Z' };
  const b = { ...svgFixture(), id: 'new', createdAt: '2026-05-14T09:00:00Z' };
  const c = { ...svgFixture(), id: 'other', roomId: 'coffee' };
  const out = artifactsForRoom([a, b, c], 'meditate');
  assert.deepEqual(out.map((x) => x.id), ['new', 'old']);
});

test('artifactsForRoom drops expired artifacts', () => {
  const now = new Date('2026-05-14T10:00:00Z');
  const fresh = { ...svgFixture(), id: 'fresh', expiresAt: '2026-05-14T12:00:00Z' };
  const expired = { ...svgFixture(), id: 'expired', expiresAt: '2026-05-14T08:00:00Z' };
  const out = artifactsForRoom([fresh, expired], 'meditate', now);
  assert.deepEqual(out.map((x) => x.id), ['fresh']);
});

test('formatCreator falls back to anon@<node>', () => {
  assert.equal(formatCreator({ creator: 'mh', nodeId: 'pointcast' }), 'mh');
  assert.equal(formatCreator({ nodeId: 'pointcast' }), 'anon@pointcast');
});
