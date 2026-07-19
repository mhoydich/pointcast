import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  RADIUS_CENTER,
  RADIUS_PRESETS,
  calculateRadiusLink,
  radiusInputFromSearch,
  serializeRadiusInput,
} from '../src/lib/radius-90245.ts';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('RADIUS / 90245 follows the ITU free-space reference at one kilometer and one GHz', () => {
  const result = calculateRadiusLink({
    distanceMiles: 1 / 1.609344,
    frequencyGHz: 1,
    transmitPowerDbm: 0,
    combinedGainDbi: 0,
    bandwidthMHz: 1,
    noiseFigureDb: 0,
    extraLossDb: 0,
  });

  assert.ok(Math.abs(result.freeSpacePathLossDb - 92.45) < 0.001);
  assert.ok(Math.abs(result.propagationDelayMicroseconds - 3.33564) < 0.001);
  assert.ok(Math.abs(result.firstFresnelRadiusMeters - 8.657) < 0.01);
  assert.equal(result.receivedPowerDbm, -result.freeSpacePathLossDb);
});

test('every radius preset is finite, bounded, and internally consistent', () => {
  assert.equal(RADIUS_PRESETS.length, 3);
  assert.equal(RADIUS_CENTER.maximumMiles, 25);

  for (const preset of RADIUS_PRESETS) {
    const result = calculateRadiusLink(preset);
    assert.ok(result.distanceMiles > 0 && result.distanceMiles <= 25);
    assert.ok(result.frequencyGHz > 0);
    assert.ok(Number.isFinite(result.freeSpacePathLossDb));
    assert.ok(Number.isFinite(result.noiseFloorDbm));
    assert.ok(Number.isFinite(result.snrDb));
    assert.ok(result.shannonCapacityMbps >= 0);
    assert.ok(['strong', 'workable', 'edge', 'below-noise'].includes(result.linkState));
  }
});

test('shared experiments round-trip through a bounded query packet', () => {
  const original = RADIUS_PRESETS[1];
  const search = serializeRadiusInput(original);
  const restored = radiusInputFromSearch(search);

  assert.deepEqual(restored, {
    distanceMiles: original.distanceMiles,
    frequencyGHz: original.frequencyGHz,
    transmitPowerDbm: original.transmitPowerDbm,
    combinedGainDbi: original.combinedGainDbi,
    bandwidthMHz: original.bandwidthMHz,
    noiseFigureDb: original.noiseFigureDb,
    extraLossDb: original.extraLossDb,
  });

  const hostile = radiusInputFromSearch(new URLSearchParams('d=999&f=-3&p=Infinity&g=999&b=0&n=-4&l=999'));
  assert.equal(hostile.distanceMiles, 25);
  assert.equal(hostile.frequencyGHz, 0.1);
  assert.equal(hostile.combinedGainDbi, 80);
  assert.equal(hostile.bandwidthMHz, 0.01);
  assert.equal(hostile.noiseFigureDb, 0);
  assert.equal(hostile.extraLossDb, 80);

  const partial = radiusInputFromSearch(new URLSearchParams('d=12'));
  assert.deepEqual(partial, {
    distanceMiles: 12,
    frequencyGHz: 2.4,
    transmitPowerDbm: 20,
    combinedGainDbi: 12,
    bandwidthMHz: 1,
    noiseFigureDb: 6,
    extraLossDb: 8,
  });
});

test('the field bench is discoverable, source-backed, private by default, and machine-readable', async () => {
  const [page, json, program, hub, apps, agents, forAgents, headers] = await Promise.all([
    read('../src/pages/ues/radius.astro'),
    read('../src/pages/ues/radius.json.ts'),
    read('../src/pages/university-of-el-segundo.astro'),
    read('../src/pages/ues/index.astro'),
    read('../src/lib/pointcast-apps.ts'),
    read('../src/pages/agents.json.ts'),
    read('../src/pages/for-agents.astro'),
    read('../public/_headers'),
  ]);

  assert.match(page, /RADIUS[\s\S]*\/ 90245/);
  assert.match(page, /FREE-SPACE PATH LOSS/);
  assert.match(page, /SHANNON CEILING/);
  assert.match(page, /MIDPOINT FRESNEL RADIUS/);
  assert.match(page, /Nothing is transmitted/);
  assert.match(page, /audio leaves this browser/);
  assert.match(page, /id="sound-toggle"/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(page, /navigator\.geolocation/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(program, /href="\/ues\/radius"/);
  assert.match(hub, /UES-09/);
  assert.match(apps, /slug: 'radius-90245'/);
  assert.match(agents, /radius90245: 'https:\/\/pointcast\.xyz\/ues\/radius'/);
  assert.match(agents, /radius90245: 'https:\/\/pointcast\.xyz\/ues\/radius\.json'/);
  assert.match(forAgents, /\/ues\/radius\.json/);
  assert.match(headers, /\/ues\/radius\.json[\s\S]*Access-Control-Allow-Origin: \*/);
});
