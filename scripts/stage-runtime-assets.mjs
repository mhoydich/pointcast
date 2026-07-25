#!/usr/bin/env node
import { cp, mkdir, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.find((arg) => arg.startsWith('--out-dir='));
const requestedOutDir = outArg?.slice('--out-dir='.length) || 'dist';
const outDir = isAbsolute(requestedOutDir)
  ? requestedOutDir
  : resolve(repoRoot, requestedOutDir);

const runtimeDirectories = [
  ['public/cola', 'cola'],
  ['public/images/nouns-cola', 'images/nouns-cola'],
];

for (const [sourcePath, destinationPath] of runtimeDirectories) {
  const source = resolve(repoRoot, sourcePath);
  const destination = join(outDir, destinationPath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

const requiredPosterPaths = [
  'images/nouns-cola/ads-generated-v2/poster-01-hero.png',
  'images/nouns-cola/ads-generated-v2/poster-02-night.png',
  'images/nouns-cola/ads-generated-v2/poster-03-pop.png',
  'images/nouns-cola/ads-generated-v2/poster-04-mural.png',
];

for (const relativePath of requiredPosterPaths) {
  const info = await stat(join(outDir, relativePath));
  if (!info.isFile() || info.size === 0) {
    throw new Error(`Runtime asset was not staged: ${relativePath}`);
  }
}

console.log(`[stage-runtime-assets] staged ${runtimeDirectories.length} directories into ${outDir}`);
