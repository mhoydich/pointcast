import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { Schema } from '@taquito/michelson-encoder';
import {
  buildFreshStorage,
  CC_WALLET,
  describeStorageShape,
  MIKE_KUKAI,
  parseArgs as parseOriginationArgs,
  SECRET_KEY_ENV,
  STANDARD_TIME_TZSAFE,
  tzSafeUrl,
  TZSAFE_CODE_HASH,
  TZSAFE_TYPE_HASH,
} from '../scripts/project-multisig-originate.mjs';
import {
  browserClientSource,
  KENNEL_CLUB,
  parseArgs as parseTreasuryArgs,
} from '../scripts/kennel-club-set-treasury.mjs';

const ROOT = process.cwd();
const STORAGE_TYPE = {
  prim: 'pair',
  args: [
    { prim: 'nat', annots: ['%proposal_counter'] },
    { prim: 'big_map', args: [{ prim: 'nat' }, { prim: 'string' }], annots: ['%proposals'] },
    { prim: 'big_map', args: [{ prim: 'nat' }, { prim: 'string' }], annots: ['%archives'] },
    { prim: 'set', args: [{ prim: 'address' }], annots: ['%owners'] },
    { prim: 'nat', annots: ['%threshold'] },
    { prim: 'int', annots: ['%effective_period'] },
    { prim: 'big_map', args: [{ prim: 'string' }, { prim: 'bytes' }], annots: ['%metadata'] },
  ],
};

test('fresh TzSafe storage has empty proposal state and exact 1-of-2 owners', () => {
  const owners = [MIKE_KUKAI, CC_WALLET];
  const storage = buildFreshStorage(STORAGE_TYPE, {
    owners,
    threshold: 1,
    effectivePeriod: 604_800,
    metadataEntries: [{ key: '', value: '697066733a2f2f516d54657374' }],
  });
  const decoded = new Schema(STORAGE_TYPE).Execute(storage);
  assert.equal(decoded.proposal_counter.toString(), '0');
  assert.equal(decoded.proposals.size, 0);
  assert.equal(decoded.archives.size, 0);
  assert.deepEqual(decoded.owners, [CC_WALLET, MIKE_KUKAI], 'Michelson set encoding sorts tz1 before tz2');
  assert.equal(decoded.threshold.toString(), '1');
  assert.equal(decoded.effective_period.toString(), '604800');
  assert.equal(decoded.metadata.get(''), '697066733a2f2f516d54657374');
  assert.deepEqual(owners, [MIKE_KUKAI, CC_WALLET], 'encoding must not mutate caller-owned configuration');
});

test('fresh TzSafe storage supports 2-of-2 and rejects unsafe owner/threshold shapes', () => {
  const storage = buildFreshStorage(STORAGE_TYPE, { owners: [MIKE_KUKAI, CC_WALLET], threshold: 2 });
  assert.equal(new Schema(STORAGE_TYPE).Execute(storage).threshold.toString(), '2');
  assert.throws(() => buildFreshStorage(STORAGE_TYPE, { owners: [MIKE_KUKAI, CC_WALLET], threshold: 0 }), /between 1 and 2/);
  assert.throws(() => buildFreshStorage(STORAGE_TYPE, { owners: [MIKE_KUKAI, CC_WALLET], threshold: 3 }), /between 1 and 2/);
  assert.throws(() => buildFreshStorage(STORAGE_TYPE, { owners: [MIKE_KUKAI, MIKE_KUKAI], threshold: 1 }), /unique addresses/);
  assert.throws(() => buildFreshStorage(STORAGE_TYPE, { owners: ['tz1-not-real'], threshold: 1 }), /Invalid owner address/);
});

test('documented storage shape is the seven-field TzSafe comb', () => {
  assert.deepEqual(describeStorageShape(STORAGE_TYPE), [
    { name: 'proposal_counter', prim: 'nat' },
    { name: 'proposals', prim: 'big_map' },
    { name: 'archives', prim: 'big_map' },
    { name: 'owners', prim: 'set' },
    { name: 'threshold', prim: 'nat' },
    { name: 'effective_period', prim: 'int' },
    { name: 'metadata', prim: 'big_map' },
  ]);
});

test('mainnet origination is gated by acknowledgement and the env-only key', () => {
  assert.equal(parseOriginationArgs([], {}).threshold, 1);
  assert.equal(parseOriginationArgs(['--threshold', '2'], {}).threshold, 2);
  assert.throws(() => parseOriginationArgs(['--threshold', '3'], {}), /must be 1 or 2/);
  assert.throws(() => parseOriginationArgs(['--execute'], { [SECRET_KEY_ENV]: 'edsk-fake' }), /I_UNDERSTAND_MAINNET/);
  assert.throws(() => parseOriginationArgs(['--execute', '--confirm-mainnet', 'I_UNDERSTAND_MAINNET'], {}), new RegExp(SECRET_KEY_ENV));
  const allowed = parseOriginationArgs(
    ['--execute', '--confirm-mainnet', 'I_UNDERSTAND_MAINNET'],
    { [SECRET_KEY_ENV]: 'edsk-fake' },
  );
  assert.equal(allowed.execute, true);
});

test('origination source and reviewed TzSafe fingerprints are pinned', async () => {
  const source = await readFile(path.join(ROOT, 'scripts/project-multisig-originate.mjs'), 'utf8');
  assert.match(source, new RegExp(STANDARD_TIME_TZSAFE));
  assert.match(source, new RegExp(String(TZSAFE_TYPE_HASH)));
  assert.match(source, new RegExp(String(TZSAFE_CODE_HASH).replace('-', '\\-')));
  assert.match(source, /chains\/main\/blocks\/head\/context\/contracts/);
  assert.match(source, /tezos\.contract\.originate\(\{ code, init: storage \}\)/);
  assert.equal(tzSafeUrl(STANDARD_TIME_TZSAFE), `https://tzsafe.org/import-wallet?address=${STANDARD_TIME_TZSAFE}`);
});

test('treasury cutover is preparation-first and Beacon calls set_treasury', () => {
  const target = 'KT1UCkcX1kXDiM4ML22Ck2LJdGeo3sT1F4eD';
  assert.equal(parseTreasuryArgs(['--multisig', target]).execute, false);
  assert.throws(() => parseTreasuryArgs(['--multisig', target, '--execute']), /I_UNDERSTAND_MAINNET/);
  const allowed = parseTreasuryArgs(['--multisig', target, '--execute', '--confirm-mainnet', 'I_UNDERSTAND_MAINNET']);
  assert.equal(allowed.execute, true);
  const client = browserClientSource({ rpc: 'https://mainnet.smartpy.io', contract: KENNEL_CLUB, admin: MIKE_KUKAI, multisig: target });
  assert.match(client, /methodsObject\.set_treasury\(payload\.multisig\)\.send\(\)/);
  assert.match(client, /account\.address !== payload\.admin/);
  assert.doesNotMatch(client, /requestSignPayload/);
});

test('the treasury cutover Beacon client bundles with the pinned wallet stack', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'project-multisig-wallet-build-'));
  try {
    await writeFile(path.join(tempDir, 'index.html'), '<script type="module" src="/client.mjs"></script>');
    await writeFile(path.join(tempDir, 'client.mjs'), browserClientSource({
      rpc: 'https://mainnet.smartpy.io',
      contract: KENNEL_CLUB,
      admin: MIKE_KUKAI,
      multisig: STANDARD_TIME_TZSAFE,
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

test('project multisig registry remains explicitly unoriginated', async () => {
  const contracts = JSON.parse(await readFile(path.join(ROOT, 'src/data/contracts.json'), 'utf8'));
  assert.equal(contracts.project_multisig.mainnet, '');
  assert.deepEqual(contracts.project_multisig.owners, [MIKE_KUKAI, CC_WALLET]);
  assert.equal(contracts.project_multisig.threshold, 1);
  assert.match(contracts.project_multisig.status, /no mainnet origination yet/);
});
