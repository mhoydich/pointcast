#!/usr/bin/env node
/**
 * init-node.mjs — finish a fresh pointcast-template fork.
 *
 * Fetches the canonical lib + components + embed.js from
 * https://raw.githubusercontent.com/mhoydich/pointcast/main/
 * and writes them into this fork's src/lib/, src/components/, public/.
 *
 * Run from the repo root: `node scripts/init-node.mjs`.
 *
 * Re-run anytime to pull the latest contract versions. Lib files
 * are versioned via the `$schema` field in each contract, so an
 * upgrade is safe as long as you bump the matching contract version.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const RAW = 'https://raw.githubusercontent.com/mhoydich/pointcast/main';

const FILES = [
  'src/lib/room-contract.ts',
  'src/lib/federation-contract.ts',
  'src/lib/artifact-contract.ts',
  'src/lib/signal-contract.ts',
  'src/components/RoomRenderer.astro',
  'public/embed.js',
];

async function fetchFile(path) {
  const url = `${RAW}/${path}`;
  process.stdout.write(`  ${path} … `);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAILED (${res.status})`);
    return null;
  }
  const text = await res.text();
  const localPath = path;
  mkdirSync(dirname(localPath), { recursive: true });
  writeFileSync(localPath, text);
  console.log(`${text.length} bytes`);
  return text;
}

async function main() {
  console.log('init-node: pulling canonical files from pointcast.xyz/main\n');
  for (const f of FILES) {
    await fetchFile(f);
  }
  console.log('\nDone. Next steps:');
  console.log('  1. Edit src/data/rooms/welcome.ts to make the starter room yours.');
  console.log('  2. Edit src/pages/node.json.ts — set your id, name, location.');
  console.log('  3. npm install && npm run dev');
  console.log('  4. Deploy and add your /node.json URL to a neighbor\'s federatedFrom.');
}

main().catch((e) => {
  console.error('init-node failed:', e);
  process.exit(1);
});
