import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../src/data/pointcast-tonight.json', import.meta.url), 'utf8'));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const sourceIds = new Set(data.sources.map((source) => source.id));

assert(data.block === '0560', 'edition must point to Block 0560');
assert(data.goOut.length >= 5, 'GO OUT needs at least five signals');
assert(data.stayIn.length >= 3, 'STAY IN needs at least three program signals');
assert(data.sources.some((source) => source.automation === 'allowed'), 'at least one refreshable source required');
assert(data.sources.some((source) => source.automation === 'manual-only'), 'manual-only source boundary must be represented');
assert(data.radius.boundary.includes('not a measured route'), 'radius must remain explicitly approximate');
assert(data.methodology.refreshPolicy.includes('candidate'), 'refresh must be candidate-only');

for (const item of [...data.goOut, ...data.stayIn, ...data.stations]) {
  assert(sourceIds.has(item.sourceId), `${item.id}: unknown source ${item.sourceId}`);
  assert(item.url.startsWith('https://'), `${item.id}: source URL must use HTTPS`);
}

for (const event of data.goOut) {
  assert(/^2026-08-\d{2}$/.test(event.date), `${event.id}: invalid edition date`);
  assert(['scheduled', 'canceled'].includes(event.status), `${event.id}: unsupported status`);
}

const canceled = data.stayIn.find((program) => program.status === 'canceled');
assert(canceled?.title.includes('CANCELED'), 'canceled broadcast slot must be visibly labeled');

if (failures.length) {
  console.error(`PointCast Tonight audit failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PointCast Tonight audit passed: ${data.goOut.length} outings, ${data.stayIn.length} programs, ${data.sources.length} official sources.`);
