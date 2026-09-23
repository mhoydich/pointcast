#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContractMetadata, buildOnchainMetadata, canonicalScoreBytes, CONTENT_ART_DIR, loadBandmates, METADATA_DIR, scoreSha256 } from './lib/nouns-bandmates-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, METADATA_DIR);

await mkdir(output, { recursive: true });
await mkdir(path.join(root, CONTENT_ART_DIR), { recursive: true });
const bandmates = await loadBandmates(root);
const records = [];
for (const bandmate of bandmates) {
  const record = await buildOnchainMetadata(bandmate, { root });
  records.push(record);
  await copyFile(record.artwork.png.source, record.artwork.png.destination);
  await copyFile(record.artwork.webp.source, record.artwork.webp.destination);
  await writeFile(path.join(output, `${bandmate.id}.json`), record.json);
}
await writeFile(path.join(root, 'src/data/nouns-bandmates-scores.json'), `${JSON.stringify(records.map((record, index) => ({ hash: scoreSha256(bandmates[index].score), id: bandmates[index].id, name: bandmates[index].name, score: bandmates[index].score })), null, 2)}\n`);
const provenancePath = path.join(root, 'public/images/nouns-drum-club/bandmates/provenance.json');
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
provenance.mode = 'content-addressed-https';
provenance.artBase = 'https://pointcast.xyz/collectibles/nouns-bandmates/art';
provenance.items = provenance.items.map((item) => {
  const record = records.find((candidate) => candidate.id === item.id);
  return {
    ...item,
    contentAddressedArtwork: {
      png: `https://pointcast.xyz/collectibles/nouns-bandmates/art/${record.artwork.png.hash}.png`,
      webp: `https://pointcast.xyz/collectibles/nouns-bandmates/art/${record.artwork.webp.hash}.webp`,
      pngSha256: record.artwork.png.hash,
      webpSha256: record.artwork.webp.hash,
    },
  };
});
await mkdir(path.join(root, 'public/collectibles/nouns-bandmates'), { recursive: true });
await writeFile(path.join(root, 'public/collectibles/nouns-bandmates/provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
await writeFile(path.join(output, 'contract.json'), `${JSON.stringify(buildContractMetadata(), null, 2)}\n`);
console.log(`Generated ${bandmates.length + 1} on-chain metadata drafts and ${records.length * 2} content-addressed art files.`);
