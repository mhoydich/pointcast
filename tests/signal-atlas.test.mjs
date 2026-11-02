import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeGeneratedSeo } from '../src/lib/seo-build.mjs';
import { summarizeLegacyLog, disconnected, demoSnapshot, normalizeWishlist, SITES, REGIONS } from '../public/signal-atlas/model.mjs';
import { readLegacySnapshot } from '../public/signal-atlas/adapter.mjs';
import { isSignalAtlasPreview, signalAtlasDirectoryRedirect, withSignalAtlasPreviewHeaders } from '../src/lib/signal-atlas-boundary.mjs';

const now = Date.parse('2026-11-01T15:00:00Z');
const valid = { type: 'ai:openai', t: now - 60000 };

test('unknown telemetry is never converted to zero observations', async () => {
  for (const result of [disconnected(), summarizeLegacyLog(null, { now }), summarizeLegacyLog(undefined, { now }), await readLegacySnapshot({})]) {
    assert.equal(result.status, 'not_connected');
    assert.equal(result.observedLabelCount, null);
    assert.deepEqual(result.observations, []);
  }
  const empty = summarizeLegacyLog([], { now });
  assert.equal(empty.status, 'limited');
  assert.equal(empty.observedLabelCount, 0);
  assert.equal(empty.coverage.completeness, 'partial-retained-sample');
});

test('retained labels are deduplicated, unverified and never competitive', () => {
  const result = summarizeLegacyLog([valid, valid, { type: 'bot:google', t: now - 3600000 }], { now });
  assert.equal(result.observedLabelCount, 2);
  assert.ok(result.observations.every(row => row.state === 'observed_unverified' && row.competitive === false));
  assert.equal(result.observations.find(row => row.id === 'ai-openai').label, 'OpenAI-family UA label');
  assert.deepEqual(result.circuit.standings, []);
  assert.equal(result.observations[0].lastObservedDay, '2026-11-01');
});

test('private fields, payload instructions and human or unsupported labels never leave projection', () => {
  const secret = 'sensitive-sentinel';
  const result = summarizeLegacyLog([
    { ...valid, ip: secret, pid: secret, city: secret, region: secret, country: secret, note: secret, nounId: 42, ua: secret },
    { type: secret, t: now }, { type: 'human', t: now }, { type: '__proto__', t: now },
    { type: 'constructor', t: now }, { type: '<script>alert(1)</script>', t: now },
    { type: 'bot:other', t: now }, { type: 'bot:seo', t: now }, null, [], 'bad',
  ], { now });
  assert.equal(result.observedLabelCount, 1);
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.deepEqual(Object.keys(result.observations[0]).sort(), ['id', 'label', 'state', 'lastObservedDay', 'evidence', 'competitive'].sort());
});

test('expired, future and malformed timestamps cannot mint encounter cards', () => {
  const rows = [now + 1, now - 86_400_001, NaN, Infinity, '2026-11-01', null, 0, now + 0.5].map(t => ({ type: 'ai:openai', t }));
  assert.equal(summarizeLegacyLog(rows, { now }).observedLabelCount, 0);
  assert.throws(() => summarizeLegacyLog([valid], { now: NaN }), /clock/);
  assert.throws(() => summarizeLegacyLog(Array(101).fill(valid), { now }), /100/);
  assert.throws(() => summarizeLegacyLog({ log: [valid] }, { now }), /retained log/);
});

test('read adapter only reads log; it never calls a storage write or list', async () => {
  const calls = [];
  const env = { VISITS: { get: async key => { calls.push(key); return JSON.stringify([valid]); }, put: () => assert.fail('write'), list: () => assert.fail('list') } };
  const result = await readLegacySnapshot(env, { now });
  assert.deepEqual(calls, ['log']);
  assert.equal(result.observedLabelCount, 1);
});

test('source outages, malformed and oversized source data are unknown, not empty collections', async () => {
  for (const raw of ['{', '{}', 'x'.repeat(65537), 'null', JSON.stringify(Array(101).fill(valid))]) {
    const result = await readLegacySnapshot({ VISITS: { get: async () => raw } }, { now });
    assert.equal(result.status, 'unavailable');
    assert.equal(result.observedLabelCount, null);
  }
  const fail = await readLegacySnapshot({ VISITS: { get: async () => { throw new Error('private-failure'); } } }, { now });
  assert.equal(fail.status, 'unavailable');
  assert.ok(!JSON.stringify(fail).includes('private-failure'));
  const timeout = await readLegacySnapshot({ VISITS: { get: () => new Promise(() => {}) } }, { now, timeoutMs: 5 });
  assert.equal(timeout.status, 'unavailable');
});

test('demo encounters stay visibly demo and cannot enter real standings', () => {
  for (const site of SITES) {
    const fixture = demoSnapshot(site.id);
    assert.equal(fixture.mode, 'demo');
    assert.equal(fixture.status, 'demo');
    assert.ok(fixture.observations.every(row => row.state === 'demo' && !row.competitive));
    assert.deepEqual(fixture.circuit.standings, []);
  }
  assert.equal(SITES.length, new Set(SITES.map(site => site.origin)).size);
  assert.ok(!SITES.some(site => site.id === 'ues'));
  assert.equal(REGIONS.find(region => region.id === 'ues').siteId, 'pointcast');
});

test('wishlist import is bounded to documented catalog IDs', () => {
  assert.deepEqual(normalizeWishlist(['gptbot', 'gptbot', '__proto__', { id: 'googlebot' }, '<img>', 'googlebot']), ['gptbot', 'googlebot']);
  assert.deepEqual(normalizeWishlist({ gptbot: true }), []);
});

test('isolated preview boundary matches only its namespace and supplies restrictive headers', async () => {
  for (const path of ['/signal-atlas', '/signal-atlas/', '/signal-atlas/app.mjs']) assert.ok(isSignalAtlasPreview(path));
  for (const path of ['/signal-atlas-other', '/api/signal-atlas', '/ues', '/']) assert.ok(!isSignalAtlasPreview(path));
  const response = withSignalAtlasPreviewHeaders(new Response('preview', { status: 200 }));
  assert.equal(await response.text(), 'preview');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(response.headers.get('Content-Security-Policy'), /connect-src 'self'/);
});

test('known preview directories canonicalize without losing queries or redirecting files', () => {
  for (const path of ['/signal-atlas', '/signal-atlas/observatory']) {
    const response = signalAtlasDirectoryRedirect('https://pointcast.xyz' + path + '?example=one%20two');
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://pointcast.xyz' + path + '/?example=one%20two');
  }
  for (const path of ['/signal-atlas/', '/signal-atlas/observatory/', '/signal-atlas/app.mjs', '/signal-atlas/missing', '/api/signal-atlas', '/']) {
    assert.equal(signalAtlasDirectoryRedirect('https://pointcast.xyz' + path), null);
  }
});

test('middleware returns isolated preview before any log or session transformations', async () => {
  const source = await readFile(new URL('../functions/_middleware.ts', import.meta.url), 'utf8');
  const boundary = source.indexOf('isSignalAtlasPreview(url.pathname)');
  const logging = source.indexOf('recordVisit({');
  const directoryRewrite = source.indexOf('const looksLikeDirectoryPath');
  assert.ok(boundary > 0 && boundary < logging && boundary < directoryRewrite);
  assert.match(source.slice(boundary, boundary + 350), /return withSignalAtlasPreviewHeaders\(await next\(\)\)/);
});

test('SEO build leaves isolated preview markup compatible with its strict CSP', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-seo-'));
  try {
    const destination = join(dir, 'signal-atlas');
    await mkdir(destination);
    const source = await readFile(new URL('../public/signal-atlas/index.html', import.meta.url), 'utf8');
    await writeFile(join(destination, 'index.html'), source);
    normalizeGeneratedSeo(dir, { info() {} });
    const built = await readFile(join(destination, 'index.html'), 'utf8');
    assert.equal(built, source);
    assert.ok(!built.includes('<style>'));
    assert.match(built, /noindex,nofollow/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
