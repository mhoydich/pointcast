import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('ENG/25 catalogs eighteen engineering capabilities across six useful layers', async () => {
  const [data, page, blockText] = await Promise.all([
    read('src/lib/radius25-engineering.ts'),
    read('src/pages/beach-commons/v18/engineering.astro'),
    read('src/content/blocks/0551.json'),
  ]);
  const block = JSON.parse(blockText);
  for (const capability of [
    'Systems architecture + interfaces', 'Mechanical design + mechanisms', 'Structures + loads',
    'Materials + corrosion', 'Thermal + fluid systems', 'Electrical power + energy',
    'Embedded systems + instrumentation', 'RF + communications', 'Software + controls + autonomy',
    'Manufacturing + tooling', 'Quality + metrology', 'Test + reliability',
    'Civil + site + geotechnical', 'Water + coastal + environmental', 'Chemical + process systems',
    'Industrial engineering + logistics', 'Safety + human factors + accessibility',
    'Commissioning + maintenance + repair',
  ]) assert.match(data, new RegExp(capability.replaceAll('+', '\\+')));
  for (const layer of ['architecture', 'matter', 'signal', 'field', 'proof', 'operations']) assert.match(data, new RegExp(`id: '${layer}'`));
  assert.equal(block.meta.capabilities, 18);
  assert.equal(block.meta.layers, 6);
  assert.match(page, /Eighteen ways to make something/);
  assert.match(page, /Open a man page to see inputs, outputs, proof, interfaces/);
});

test('the command desk is bounded, local, keyboard-friendly, and useful', async () => {
  const [data, page, endpoint, blockText] = await Promise.all([
    read('src/lib/radius25-engineering.ts'),
    read('src/pages/beach-commons/v18/engineering.astro'),
    read('src/pages/beach-commons/v18/engineering.json.ts'),
    read('src/content/blocks/0551.json'),
  ]);
  const block = JSON.parse(blockText);
  for (const command of ['help', 'ls skills', 'ls gateways', 'find salt air', 'layer signal', 'stack shade-return', 'proof', 'export', 'clear']) assert.match(data, new RegExp(command));
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /event\.key==='ArrowUp'/);
  assert.match(page, /event\.key==='\/'/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|\bfetch\(|\beval\(|new Function/);
  assert.match(endpoint, /arbitraryExecution: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.equal(block.meta.arbitraryExecution, false);
  assert.equal(block.meta.networkWrites, false);
  assert.equal(block.meta.storage, false);
});

test('six mission stacks compile deliverables and stop conditions before activity', async () => {
  const [data, page, endpoint, blockText] = await Promise.all([
    read('src/lib/radius25-engineering.ts'),
    read('src/pages/beach-commons/v18/engineering.astro'),
    read('src/pages/beach-commons/v18/engineering.json.ts'),
    read('src/content/blocks/0551.json'),
  ]);
  const block = JSON.parse(blockText);
  for (const mission of ['Shade That Returns', 'Salt-Air Repair Bench', 'Explain the Hard Thing', 'The Arrival Handoff', 'Field Sound Line', 'Elements Score']) assert.match(data, new RegExp(mission));
  assert.equal(block.meta.missionStacks, 6);
  assert.equal(block.meta.proofPacketFields, 8);
  assert.match(page, /STOP CONDITION/);
  assert.match(data, /A conceptual score is not an event permit/);
  assert.match(endpoint, /No crew, job, hiring process, contract, procurement, permit, site/);
  assert.match(block.body, /Nothing is sent automatically/);
});

test('official doors establish capability without publishing people or promising access', async () => {
  const [data, page, endpoint, blockText] = await Promise.all([
    read('src/lib/radius25-engineering.ts'),
    read('src/pages/beach-commons/v18/engineering.astro'),
    read('src/pages/beach-commons/v18/engineering.json.ts'),
    read('src/content/blocks/0551.json'),
  ]);
  const block = JSON.parse(blockText);
  for (const door of ['Space Systems Command', 'The Aerospace Corporation', 'SpaceX', 'LMU Seaver', 'El Camino College', 'LAWA Design', 'Port of Los Angeles', 'LADWP Student Engineer', 'USC Viterbi', 'UCLA Samueli', 'CSULB Hung', 'California engineering licensure', 'Cal/OSHA', 'FCC equipment', 'ABET']) assert.match(data, new RegExp(door.replace('/', '\\/')));
  assert.equal(block.meta.regionalDoors, 17);
  assert.equal(block.meta.privatePeopleCataloged, 0);
  assert.match(page, /No person, company, campus, agency, facility, site, job, contract, permit, credential, or piece of equipment is represented as available/);
  assert.match(endpoint, /No private-person catalog/);
});

test('ENG/25 has human, JSON, Block, Radius 25, homepage, discovery, and social twins', async () => {
  const [sitemap, llms, llmsFull, v18, v18json, front, edition, blockText] = await Promise.all([
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons/v18.astro'),
    read('src/pages/beach-commons/v18.json.ts'),
    read('src/pages/beach-commons.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/content/blocks/0551.json'),
  ]);
  const block = JSON.parse(blockText);
  assert.equal(block.id, '0551');
  assert.match(sitemap, /beach-commons\/v18\/engineering\.json/);
  assert.match(llms, /PointCast Field Companion 018\.B/);
  assert.match(llmsFull, /ENG\/25/);
  assert.match(v18, /Open the engineering catalog/);
  assert.match(v18json, /engineeringCompanion/);
  assert.match(front, /018\.B · The utility/);
  assert.match(edition, /id: '0551', noun: 'Engineering', title: 'ENG\/25'/);
  const imageUrl = new URL('../public/images/og/b/0551.png', import.meta.url);
  await access(imageUrl);
  assert.deepEqual(pngSize(await readFile(imageUrl)), { width: 1200, height: 630 });
});
