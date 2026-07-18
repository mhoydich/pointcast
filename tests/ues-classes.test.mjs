import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('The Local Transmission defines eight complete six-week course rooms', async () => {
  const source = await read('../src/lib/ues-classes.ts');
  const codes = source.match(/code: 'UES-20[1-8]'/g) ?? [];
  const courseWeekBlocks = source.match(/^    weeks: \[$/gm) ?? [];
  const weeks = source.match(/^        week: [1-6],$/gm) ?? [];
  const receipts = source.match(/^        publicReceipt: '/gm) ?? [];
  const paths = source.match(/^    path: '\/ues\/[a-z0-9-]+',$/gm) ?? [];
  const jsonPaths = source.match(/^    jsonPath: '\/ues\/[a-z0-9-]+\.json',$/gm) ?? [];

  assert.equal(codes.length, 8);
  assert.equal(new Set(codes).size, 8);
  assert.equal(courseWeekBlocks.length, 8);
  assert.equal(weeks.length, 48);
  assert.equal(receipts.length, 48);
  assert.equal(paths.length, 8);
  assert.equal(jsonPaths.length, 8);
  assert.match(source, /totalUsd: 39_650/);
  assert.match(source, /coursePoolUsd: 27_550/);
  assert.match(source, /sharedPoolUsd: 12_100/);
  assert.match(source, /learnerCapacity: 96/);
  assert.match(source, /minimum: 12/);
  assert.doesNotMatch(source, /status: 'open'/);
});

test('UES publishes one shared catalog, public syllabus routes, and machine-readable course data', async () => {
  const [catalog, room, roomJson, catalogJson, program] = await Promise.all([
    read('../src/pages/ues/index.astro'),
    read('../src/pages/ues/[slug].astro'),
    read('../src/pages/ues/[slug].json.ts'),
    read('../src/pages/ues/classes.json.ts'),
    read('../src/lib/ues-program.ts'),
  ]);

  assert.match(catalog, /UES_SEASON_ONE_COURSES/);
  assert.match(catalog, /href="\/ues\/track-05"/);
  assert.doesNotMatch(catalog, /<main(?:\s|>)/);
  assert.match(room, /getStaticPaths/);
  assert.match(room, /href="\/ues" aria-current="page"/);
  assert.match(room, /href="\/el-segundo-school#gallery"/);
  assert.match(room, /href="\/university-of-el-segundo#fund"/);
  assert.match(room, /wallet, public identity, and public artifact are never required/);
  assert.match(room, /courseWorkload: `\$\{course\.weeklyCommitment\.total\}/);
  assert.doesNotMatch(room, /instructor: \{ '@type': 'Person'/);
  assert.doesNotMatch(room, /import\([^)]*ues-fund/);
  assert.match(roomJson, /transactionPolicy/);
  assert.match(catalogJson, /current:/);
  assert.match(program, /nextOnlineTerm: ONLINE_SEASON_ONE/);
  assert.match(program, /nextCourses: UES_SEASON_ONE_COURSES/);
});

test('School discovery surfaces link the art archive, classes, and funding program', async () => {
  const [home, archive, funding] = await Promise.all([
    read('../src/components/ElSegundoSchoolHome.astro'),
    read('../src/pages/el-segundo-school.astro'),
    read('../src/pages/university-of-el-segundo.astro'),
  ]);

  assert.match(home, /href="\/ues">Take a class/);
  assert.match(archive, /href="\/ues">Classes/);
  assert.match(funding, /id="next-term"/);
  assert.match(funding, /href="\/ues">Class catalog/);
  assert.match(funding, /Open all six weeks/);
  assert.match(funding, /SEASON 0 EXPANSION TOTAL/);
  assert.match(funding, /not included in this Season 0 expansion calculator/);
});
