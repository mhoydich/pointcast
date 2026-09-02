import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { TREASURY_PLACEHOLDER } from '../scripts/lib/kennel-club-metadata.mjs';
import { browserClientSource, septemberWindows } from '../scripts/kennel-club-originate.mjs';

const ROOT = process.cwd();
const METADATA_DIR = path.join(ROOT, 'contracts/kennel-club/metadata');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

test('TZIP-21 set has exactly token IDs 0 through 29 plus contract metadata', async () => {
  const files = (await readdir(METADATA_DIR)).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  assert.deepEqual(files, [...Array.from({ length: 30 }, (_, id) => `${id}.json`), 'contract.json']);
});

test('token metadata matches the series source and contains no artist or brand names', async () => {
  const series = await readJson(path.join(ROOT, 'src/data/kennel-club-september-sitting.json'));
  const pins = await readJson(path.join(ROOT, 'contracts/kennel-club/pins.json'));
  assert.equal(series.sittings.length, 30);
  const forbidden = /\b(?:David\s+Hockney|Hockney|Andy\s+Warhol|Warhol|Ralph\s+Lauren|Polo\s+Ralph\s+Lauren|Gucci|Prada)\b/i;

  for (let tokenId = 0; tokenId < 30; tokenId += 1) {
    const sitting = series.sittings[tokenId];
    const file = path.join(METADATA_DIR, `${tokenId}.json`);
    const raw = await readFile(file, 'utf8');
    const metadata = JSON.parse(raw);
    assert.doesNotMatch(raw, forbidden, `token ${tokenId} contains a forbidden name`);
    assert.equal(sitting.tokenId, tokenId);
    assert.equal(metadata.name, sitting.tokenMetadata.name);
    assert.equal(metadata.description, sitting.tokenMetadata.description);
    assert.equal(metadata.decimals, 0);
    assert.deepEqual(metadata.creators, [pins.treasury || TREASURY_PLACEHOLDER]);
    assert.deepEqual(metadata.attributes, [
      { name: 'breed', value: sitting.breed },
      { name: 'wardrobe', value: sitting.wardrobe },
      { name: 'title', value: sitting.title },
      { name: 'sitting', value: String(sitting.day).padStart(2, '0') },
      { name: 'mintDate', value: sitting.mintDate },
    ]);
    assert.deepEqual(metadata.tags, sitting.tags);
    const pngCid = pins.images?.[String(tokenId)]?.png?.cid || `__KENNEL_CLUB_${String(tokenId).padStart(2, '0')}_PNG_CID__`;
    const webpCid = pins.images?.[String(tokenId)]?.webp?.cid || `__KENNEL_CLUB_${String(tokenId).padStart(2, '0')}_WEBP_CID__`;
    assert.equal(metadata.artifactUri, `ipfs://${pngCid}`);
    assert.equal(metadata.displayUri, `ipfs://${webpCid}`);
    assert.equal(metadata.thumbnailUri, metadata.displayUri);
    assert.deepEqual(metadata.formats.map(({ mimeType, dimensions }) => ({ mimeType, dimensions })), [
      { mimeType: 'image/png', dimensions: { value: '1024x1280', unit: 'px' } },
      { mimeType: 'image/webp', dimensions: { value: '1024x1280', unit: 'px' } },
    ]);
  }
});

test('TZIP-16 contract metadata is brand-neutral and declares the implemented interfaces', async () => {
  const raw = await readFile(path.join(METADATA_DIR, 'contract.json'), 'utf8');
  const metadata = JSON.parse(raw);
  assert.doesNotMatch(raw, /\b(?:David\s+Hockney|Hockney|Andy\s+Warhol|Warhol|Ralph\s+Lauren|Polo\s+Ralph\s+Lauren|Gucci|Prada)\b/i);
  assert.deepEqual(metadata.interfaces, ['TZIP-012', 'TZIP-016', 'TZIP-021']);
  assert.equal(metadata.license.name, 'CC0-1.0');
});

test('pin dry-run needs no credential and makes no writes', async () => {
  const before = await readFile(path.join(ROOT, 'contracts/kennel-club/pins.json'), 'utf8');
  const env = { ...process.env };
  delete env.PINATA_JWT;
  delete env.NFT_STORAGE_KEY;
  const run = spawnSync(process.execPath, ['scripts/kennel-club-pin.mjs', '--dry-run'], { cwd: ROOT, env, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /91-file plan/);
  assert.match(run.stdout, /Nothing was pinned or modified/);
  assert.equal(await readFile(path.join(ROOT, 'contracts/kennel-club/pins.json'), 'utf8'), before);

  const liveRun = spawnSync(process.execPath, ['scripts/kennel-club-pin.mjs'], { cwd: ROOT, env, encoding: 'utf8' });
  assert.equal(liveRun.status, 1);
  assert.match(liveRun.stderr, /Set PINATA_JWT or NFT_STORAGE_KEY/);
  assert.equal(await readFile(path.join(ROOT, 'contracts/kennel-club/pins.json'), 'utf8'), before);
});

test('September windows are LA midnights and Ghostnet fails closed', () => {
  const windows = septemberWindows();
  assert.equal(windows.length, 30);
  assert.deepEqual(windows[0], { tokenId: 0, open: '2026-09-01T07:00:00Z', close: '2026-09-02T07:00:00Z' });
  assert.deepEqual(windows[29], { tokenId: 29, open: '2026-09-30T07:00:00Z', close: '2026-10-01T07:00:00Z' });
  const run = spawnSync(process.execPath, ['scripts/kennel-club-originate.mjs', '--network', 'ghostnet'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Ghostnet is retired/);
});

test('origination uses Taquito 25 wallet operations and never raw payload signing', async () => {
  const packageJson = await readJson(path.join(ROOT, 'package.json'));
  for (const name of ['@taquito/taquito', '@taquito/beacon-wallet', '@taquito/signer', '@taquito/michel-codec', '@taquito/utils']) {
    assert.equal(packageJson.dependencies[name], '25.0.0', `${name} must stay pinned to the reviewed protocol-025-capable release`);
  }
  const source = await readFile(path.join(ROOT, 'scripts/kennel-club-originate.mjs'), 'utf8');
  assert.match(source, /tezos\.wallet\.originate/);
  assert.doesNotMatch(source, /\.requestSignPayload\s*\(/);
});

test('the temporary Kukai signing client bundles with the pinned wallet stack', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'kennel-club-wallet-build-'));
  try {
    await writeFile(path.join(tempDir, 'index.html'), '<script type="module" src="/client.mjs"></script>');
    await writeFile(path.join(tempDir, 'client.mjs'), browserClientSource({
      code: [],
      storage: {},
      rpc: 'https://mainnet.smartpy.io',
      admin: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
    }));
    await symlink(path.join(ROOT, 'node_modules'), path.join(tempDir, 'node_modules'), 'dir');
    const [{ build }, { nodePolyfills }] = await Promise.all([
      import('vite'),
      import('vite-plugin-node-polyfills'),
    ]);
    await build({
      configFile: false,
      root: tempDir,
      logLevel: 'silent',
      resolve: { preserveSymlinks: true },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.browser': 'true',
        'process.version': JSON.stringify('v22.0.0'),
      },
      plugins: [nodePolyfills({
        include: ['buffer', 'process', 'util', 'stream', 'events'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: false,
      })],
      build: { outDir: path.join(tempDir, 'dist'), emptyOutDir: true },
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
