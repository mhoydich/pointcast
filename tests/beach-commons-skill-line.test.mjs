import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('The Skill Line publishes eight voluntary lanes and six finishable seed briefs', async () => {
  const [data, page, blockText] = await Promise.all([
    read('src/lib/beach-commons-skill-line.ts'),
    read('src/pages/beach-commons/v18/skills.astro'),
    read('src/content/blocks/0549.json'),
  ]);
  const block = JSON.parse(blockText);
  for (const lane of ['Make + build', 'Repair + maintain', 'Teach + explain', 'Test + measure', 'Host + welcome', 'Document + translate', 'Move + source', 'Coordinate + steward']) {
    assert.match(data, new RegExp(lane.replace('+', '\\+')));
  }
  for (const brief of ['Salt-Air Repair Bench', 'Shade That Returns', 'Explain the Hard Thing', 'The Arrival Handoff', 'Field Sound Line', 'Elements Score']) assert.match(data, new RegExp(brief));
  assert.equal(block.meta.skillLanes, 8);
  assert.equal(block.meta.openBriefs, 6);
  assert.match(page, /Do not join “the community\.”/);
  assert.match(page, /Calls before/);
});

test('the declaration instrument is local until a visitor chooses a communication action', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v18/skills.astro'),
    read('src/pages/beach-commons/v18/skills.json.ts'),
    read('src/content/blocks/0549.json'),
  ]);
  const block = JSON.parse(blockText);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /mailto:hello@pointcast\.xyz/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|\bfetch\(/);
  assert.match(endpoint, /automaticPosting: false/);
  assert.match(endpoint, /automaticMatching: false/);
  assert.match(endpoint, /publicDirectory: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.equal(block.meta.communicationModes, 3);
  assert.equal(block.meta.networkWrites, false);
});

test('privacy, labor, match, activity, and publication boundaries travel with the board', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v18/skills.astro'),
    read('src/pages/beach-commons/v18/skills.json.ts'),
    read('src/content/blocks/0549.json'),
  ]);
  const block = JSON.parse(blockText);
  assert.match(page, /No participant names or declarations are published yet/);
  assert.match(page, /does not promise a reply or match/);
  assert.match(endpoint, /Skilled labor, hosting, production, and qualified review should be paid/);
  assert.match(endpoint, /No coalition, event, job, role, match, payment, funding, permit/);
  assert.match(block.body, /No real person is listed without their choice/);
  assert.match(block.body, /Nothing is submitted, saved, counted, matched, posted, or published automatically/);
});

test('The Skill Line has human, JSON, Block, homepage, discovery, and social twins', async () => {
  const [sitemap, llms, llmsFull, v18, v18json, edition, blockText] = await Promise.all([
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons/v18.astro'),
    read('src/pages/beach-commons/v18.json.ts'),
    read('src/components/HomeNewEdition.astro'),
    read('src/content/blocks/0549.json'),
  ]);
  const block = JSON.parse(blockText);
  assert.equal(block.id, '0549');
  assert.match(sitemap, /beach-commons\/v18\/skills\.json/);
  assert.match(llms, /PointCast Field Companion 018\.A/);
  assert.match(llmsFull, /THE SKILL LINE/);
  assert.match(v18, /Open the call for skill/);
  assert.match(v18json, /fieldCompanion/);
  assert.match(edition, /id: '0549', noun: 'Skill', title: 'The Skill Line'/);
  const imageUrl = new URL('../public/images/og/b/0549.png', import.meta.url);
  await access(imageUrl);
  assert.deepEqual(pngSize(await readFile(imageUrl)), { width: 1200, height: 630 });
});
