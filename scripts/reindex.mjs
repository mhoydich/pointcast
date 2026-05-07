#!/usr/bin/env node
import { computeAtlas, reindex, resetOracle } from './lib/oracle-rag.mjs';

const args = new Set(process.argv.slice(2));

if (args.has('--reset')) {
  await resetOracle();
}

const result = await reindex({ force: args.has('--force'), recomputeAtlas: false });
const atlas = await computeAtlas();

console.log(JSON.stringify({
  ...result,
  atlas: atlas ? { points: atlas.pointCount, generatedAt: atlas.generatedAt } : null,
}, null, 2));
