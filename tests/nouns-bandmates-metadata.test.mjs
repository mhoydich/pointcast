import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { buildContractMetadata, buildOnchainMetadata, CREATOR, CONTENT_ART_DIR, loadBandmates, scoreSha256, sha256 } from '../scripts/lib/nouns-bandmates-metadata.mjs';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadataDir = path.join(root, 'contracts/nouns-bandmates/metadata');

test('draft metadata covers every canonical Bandmate with TZIP fields and no mint-state claims', async () => {
  const bandmates = await loadBandmates(root);
  assert.equal(bandmates.length, 12);
  for (const bandmate of bandmates) {
    const metadata = JSON.parse(await readFile(path.join(metadataDir, `${bandmate.id}.json`), 'utf8'));
    assert.equal(metadata.creators[0], CREATOR);
    assert.equal(metadata.decimals, 0);
    assert.equal(metadata.isBooleanAmount, false);
    assert.equal(metadata.mime, 'image/png');
    assert.match(metadata.artifactUri, /collectibles\/nouns-bandmates\/art\/[a-f0-9]{64}\.png$/);
    assert.match(metadata.displayUri, /collectibles\/nouns-bandmates\/art\/[a-f0-9]{64}\.webp$/);
    assert.match(metadata.artifactSha256, /^[a-f0-9]{64}$/);
    assert.match(metadata.displaySha256, /^[a-f0-9]{64}$/);
    assert.match(metadata.externalUri, /^https:\/\/pointcast\.xyz\/nouns\/drum-club\/bandmates\/play\/[a-f0-9]{64}\/$/);
    assert.ok(metadata.underlyingNoun.rights.startsWith('CC0'));
    assert.equal(metadata.scoreSha256, scoreSha256(bandmate.score));
    assert.ok((await readFile(path.join(metadataDir, `${bandmate.id}.json`))).length < 16384);
    assert.equal(metadata.attributes.find((item) => item.name === 'Source Noun ID').value, String(bandmate.nounId));
    assert.equal('status' in metadata, false);
    assert.equal('minted' in metadata, false);
    assert.equal('royalties' in metadata, false);
  }
});

test('frozen score manifest preserves every hash and exact score', async () => {
  const bandmates = await loadBandmates(root);
  const manifest = JSON.parse(await readFile(path.join(root, 'src/data/nouns-bandmates-scores.json'), 'utf8'));
  assert.equal(manifest.length, bandmates.length);
  for (const [index, entry] of manifest.entries()) {
    assert.equal(entry.id, bandmates[index].id);
    assert.equal(entry.hash, scoreSha256(entry.score));
    assert.deepEqual(entry.score, bandmates[index].score);
  }
});

test('contract draft declares TZIP interfaces and on-chain token metadata base', async () => {
  const contract = JSON.parse(await readFile(path.join(metadataDir, 'contract.json'), 'utf8'));
  assert.deepEqual(contract.interfaces, ['TZIP-012', 'TZIP-016', 'TZIP-021']);
  assert.equal(contract.metadata_base_uri, 'tezos-storage:bandmate-');
  assert.match(contract.homepage, /nouns\/drum-club\/bandmates\/$/);
  assert.equal(buildContractMetadata().name, contract.name);
});

test('the 37-file manifest scope is complete and byte-addressable', async () => {
  const bandmates = await loadBandmates(root);
  const files = [];
  for (const bandmate of bandmates) {
    const record = await buildOnchainMetadata(bandmate, { root });
    files.push(path.relative(root, record.artwork.png.destination), path.relative(root, record.artwork.webp.destination));
    files.push(`contracts/nouns-bandmates/metadata/${bandmate.id}.json`);
  }
  files.push('contracts/nouns-bandmates/metadata/contract.json');
  assert.equal(files.length, 37);
  for (const relative of files) {
    const bytes = await readFile(path.join(root, relative));
    assert.match(sha256(bytes), /^[a-f0-9]{64}$/);
  }
});

test('on-chain records expose complete JSON, URI, and content hashes for contract storage', async () => {
  const [bandmate] = await loadBandmates(root);
  const record = await buildOnchainMetadata(bandmate, { root });
  assert.equal(record.uri, `tezos-storage:bandmate-${bandmate.id}`);
  assert.equal(record.json, `${JSON.stringify(record.metadata)}\n`);
  assert.equal(record.metadataHash, sha256(Buffer.from(record.json)));
  assert.match(record.artwork.png.destination, new RegExp(`${CONTENT_ART_DIR}/[a-f0-9]{64}\\.png$`));
});

test('pin workflow defaults to a credential-free dry run', async () => {
  const { stdout, stderr } = await exec(process.execPath, ['scripts/nouns-bandmates-pin.mjs'], { cwd: root, env: { ...process.env, PINATA_JWT: '' } });
  assert.match(stdout, /37-file plan/);
  assert.match(stdout, /no network, credentials, or writes/);
  assert.equal(stderr, '');
});
