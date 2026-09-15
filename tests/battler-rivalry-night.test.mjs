import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { catalog, simulateMatch, matchHash, arenaDiscovery } from '../functions/_lib/nouns-battler-arena.ts';
import { canonicalJson } from '../src/lib/x402.ts';
import { INPUT, RECORD_PATH, verifyLiveMatch, writeImmutableRecord } from '../scripts/generate-battler-rivalry-record.mjs';

const record = JSON.parse(await readFile(RECORD_PATH, 'utf8'));

test('published exhibition preserves its preselected input, complete replay and server hash', async () => {
  const regenerated = simulateMatch(INPUT);
  assert.deepEqual(record.match.input, INPUT);
  assert.equal(INPUT.seed, 20260915);
  assert.equal(INPUT.left.gang, 'tomato-noggles');
  assert.equal(INPUT.left.tactic, 'rush');
  assert.equal(INPUT.right.gang, 'cobalt-frames');
  assert.equal(INPUT.right.tactic, 'guard');
  assert.deepEqual(record.match, regenerated);
  assert.equal(await matchHash(record.match), record.matchHash);
  assert.equal(record.matchHash, 'a8091203796e58321618e41c85f0339027e17dee72c0db99f239d080edcc2d91');
  assert.deepEqual(record.catalog, catalog);
  assert.equal(record.match.rulesVersion, 'nouns-nation.exhibition.1');
  assert.equal(record.provenance.apiVerification.matchHash, record.matchHash);
  assert.equal(record.provenance.apiVerification.exactMatch, true);
  assert.equal(record.provenance.apiVerification.sourceResponseSaved, false);
  assert.equal(record.kind, 'published-exhibition');
});

test('published score and every replay frame remain bounded and internally consistent', () => {
  const { match } = record;
  assert.equal(match.winner, 'right');
  assert.equal(match.reason, 'elimination');
  assert.deepEqual(match.survivors, { left: 0, right: 8 });
  assert.equal(match.durationMs, 16300);
  assert.equal(match.frames[0].tick, 0);
  assert.equal(match.frames.at(-1).tick, match.ticks);
  assert.equal(match.units.length, 24);
  assert.ok(match.frames.length <= record.catalog.limits.maxFrames);
  assert.ok(match.events.length <= record.catalog.limits.maxEvents);
  assert.equal(match.events.at(-1).type, 'result');
  for (let index = 0; index < match.frames.length; index++) {
    const frame = match.frames[index];
    assert.equal(frame.units.length, 24);
    assert.equal(new Set(frame.units.map(([id]) => id)).size, 24);
    if (index) assert.ok(frame.tick > match.frames[index - 1].tick);
    for (const [id, x, y, hp] of frame.units) {
      const unit = match.units[id];
      assert.equal(unit.id, id);
      assert.ok([id, x, y, hp].every(Number.isInteger));
      assert.ok(x >= 0 && x <= match.field.width);
      assert.ok(y >= 0 && y <= match.field.height);
      assert.ok(hp >= 0 && hp <= unit.maxHp);
    }
  }
  for (const side of ['left', 'right']) {
    const final = match.frames.at(-1).units.filter(([id]) => match.units[id].side === side);
    assert.equal(final.filter(([, , , hp]) => hp > 0).length, match.survivors[side]);
    assert.equal(final.reduce((sum, [, , , hp]) => sum + hp, 0), match.health[side]);
  }
});

test('immutable publication writer allows identical data and refuses replacement without altering the file', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'pointcast-rivalry-record-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'record.json');
  assert.equal(await writeImmutableRecord(path, record), 'created');
  const before = await readFile(path, 'utf8');
  assert.equal(await writeImmutableRecord(path, record), 'unchanged');
  await assert.rejects(writeImmutableRecord(path, { ...record, matchHash: 'changed' }), /Refusing to overwrite/);
  assert.equal(await readFile(path, 'utf8'), before);
});

test('live verifier rejects mismatched or paid records without making real network requests', async () => {
  const response = { ok: true, saved: false, price: 'free', match: record.match, matchHash: record.matchHash };
  const stub = body => async (url, options) => {
    assert.equal(url, 'https://pointcast.xyz/api/nouns-battler/arena');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), INPUT);
    assert.equal(options.headers['Payment-Signature'], undefined);
    return new Response(JSON.stringify(body));
  };
  await verifyLiveMatch(response, stub(response));
  await assert.rejects(verifyLiveMatch(response, stub({ ...response, matchHash: 'wrong' })), /hash differs/);
  await assert.rejects(verifyLiveMatch(response, stub({ ...response, saved: true })), /free exhibition/);
  await assert.rejects(verifyLiveMatch(response, stub({ ...response, match: { ...response.match, ticks: 1 } })), /advertised hash/);
});

test('JSON twin exposes the stored result and a standout measured from the complete final frame', async t => {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', cacheDir: '.astro/rivalry-test-cache' });
  t.after(() => server.close());
  const data = await server.ssrLoadModule('/src/lib/battler-rivalry-night.ts');
  const endpoint = await server.ssrLoadModule('/src/pages/nouns-nation-battler-rivalry-night.json.ts');
  const response = await endpoint.GET();
  const twin = await response.json();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /application\/json/);
  assert.equal(canonicalJson(twin.match), canonicalJson(record.match));
  assert.deepEqual(twin.catalog, record.catalog);
  assert.equal(twin.links.record, record.metadata.recordUrl);
  assert.equal(twin.metadata.canonical, `https://pointcast.xyz${twin.links.page}`);
  assert.equal(arenaDiscovery().links.rivalryNight, twin.links.page);
  assert.equal(data.RIVALRY_NIGHT_META.id, '001');
  const star = twin.standout;
  assert.equal(star.side, record.match.winner);
  assert.equal(star.hp, record.match.frames.at(-1).units.find(([id]) => id === star.id)[3]);
  assert.match(star.basis, /remaining health percentage/);
  for (const [id, , , hp] of record.match.frames.at(-1).units) {
    const unit = record.match.units[id];
    if (unit.side === star.side && hp > 0) assert.ok(star.hp * unit.maxHp >= hp * star.maxHp);
  }
  const rematch = new URL(twin.links.rematch, 'https://pointcast.xyz');
  assert.equal(rematch.searchParams.get('seed'), String(INPUT.seed));
  assert.equal(rematch.searchParams.get('leftGang'), INPUT.left.gang);
  assert.equal(rematch.searchParams.get('rightTactic'), INPUT.right.tactic);
});
