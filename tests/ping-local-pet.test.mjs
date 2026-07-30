import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadPingData() {
  const script = `
    import { PING_LOCAL_PET } from './src/lib/ping-local-pet.ts';
    process.stdout.write(JSON.stringify(PING_LOCAL_PET));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('PING V1 publishes a finite, truthful product and production contract', () => {
  const ping = loadPingData();

  assert.deepEqual(
    ping.signals.map((signal) => signal.code),
    ['HOME', 'HELLO', 'OPEN', 'OKAY', 'KNOCK'],
  );
  assert.deepEqual(
    ping.modes.map((mode) => mode.code),
    ['HOME', 'MESH', 'QUIET'],
  );
  assert.equal(ping.truth.physicalUnitsBuilt, 0);
  assert.equal(ping.truth.capitalCommittedUsd, 0);
  assert.equal(ping.truth.applicationsSubmitted, 0);
  assert.equal(ping.truth.hostTestsPassed, 23);
  assert.equal(ping.truth.wireEnvelopeBytes, 84);
  assert.equal(ping.truth.testSecurityOnly, true);
  assert.equal(ping.truth.productionCryptoComplete, false);
  assert.equal(ping.alpha.revisedPlanningBomUsd, 3855);
  assert.equal(ping.alpha.orderableAsWritten, false);
  assert.equal(ping.productionRing.length, 6);
  assert.match(ping.goToMarket.launchRule, /No interviews are required before Alpha/);
  assert.match(ping.boundaries.join(' '), /browser-only rehearsal/);
});

test('PING carries capital, sourcing, hardware, and claim-release gates', () => {
  const ping = loadPingData();

  assert.equal(ping.capital.immediateRoute.amountUsd, 50000);
  assert.equal(ping.capital.immediateRoute.publishedCapUsd, 1500000);
  assert.match(ping.capital.immediateRoute.formStatus, /not submitted/);
  assert.match(ping.capital.immediateRoute.termsBoundary, /remain unknown/);
  assert.deepEqual(
    ping.buildSequence.map((step) => step.gate),
    ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'],
  );
  assert.equal(ping.buildSequence.filter((step) => step.status === 'now').length, 1);
  assert.match(ping.complianceGap, /did not establish/);
});

test('PING is published across human, machine, Block, local, and agent discovery surfaces', async () => {
  const [
    page,
    jsonRoute,
    blockSource,
    digitalPets,
    digitalPetsJson,
    local,
    localJson,
    sitemap,
    agents,
    forAgents,
    llms,
    llmsFull,
    builtPage,
    builtJson,
  ] = await Promise.all([
    read('src/pages/digital-pets/ping.astro'),
    read('src/pages/digital-pets/ping.json.ts'),
    read('src/content/blocks/0547.json'),
    read('src/pages/digital-pets.astro'),
    read('src/pages/digital-pets.json.ts'),
    read('src/pages/local.astro'),
    read('src/pages/local.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('dist/digital-pets/ping/index.html'),
    read('dist/digital-pets/ping.json'),
  ]);
  const block = JSON.parse(blockSource);
  const manifest = JSON.parse(builtJson);

  assert.equal(block.id, '0547');
  assert.equal(block.external.url, 'https://pointcast.xyz/digital-pets/ping');
  assert.match(page, /data-signal-button/);
  assert.match(page, /nothing transmitted/i);
  assert.match(page, /No interview theater/);
  assert.match(jsonRoute, /\.\.\.PING_LOCAL_PET/);
  assert.match(digitalPets, /Build PING/);
  assert.match(digitalPetsJson, /pingLocalPetJson/);
  assert.match(local, /PING \/ Local Pet 01 open production room/);
  assert.match(localJson, /pingLocalPetJson/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\/ping\.json/);
  assert.match(agents, /pingLocalPet: 'https:\/\/pointcast\.xyz\/digital-pets\/ping\.json'/);
  assert.match(forAgents, /Companion 04 is the PING/);
  assert.match(llms, /84-byte opaque wire/);
  assert.match(llmsFull, /zero physical units/);
  assert.match(builtPage, /ONE LITTLE/);
  assert.match(builtPage, /NO APPLICATION SUBMITTED/);
  assert.equal(manifest.truth.physicalUnitsBuilt, 0);
  assert.equal(manifest.blockUrl, 'https://pointcast.xyz/b/0547');
});

test('PING concept art is checked in and explicitly labeled as a concept', async () => {
  const image = new URL(
    'public/images/digital-pets/ping/local-star-family-concept.png',
    root,
  );
  await access(image);
  const metadata = await stat(image);
  const [page, block] = await Promise.all([
    read('src/pages/digital-pets/ping.astro'),
    read('src/content/blocks/0547.json'),
  ]);
  const blockRecord = JSON.parse(block);

  assert.ok(metadata.size > 100_000);
  assert.match(page, /CONCEPT IMAGE \/ NOT MANUFACTURED HARDWARE/);
  assert.equal(blockRecord.meta.conceptImageNotHardware, true);
});
