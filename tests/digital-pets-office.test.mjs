import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadOfficeData() {
  const script = `
    import {
      DIGITAL_PETS_DECISION_GATES,
      DIGITAL_PETS_LAUNCH_EVIDENCE,
      DIGITAL_PETS_NEXT_ACTIONS,
      DIGITAL_PETS_READ_LOOP,
      DIGITAL_PETS_ROLES,
      DIGITAL_PETS_SCORECARD,
      DIGITAL_PETS_WEEKS,
    } from './src/lib/digital-pets-operations.ts';
    process.stdout.write(JSON.stringify({
      gates: DIGITAL_PETS_DECISION_GATES,
      launch: DIGITAL_PETS_LAUNCH_EVIDENCE,
      next: DIGITAL_PETS_NEXT_ACTIONS,
      loop: DIGITAL_PETS_READ_LOOP,
      roles: DIGITAL_PETS_ROLES,
      scorecard: DIGITAL_PETS_SCORECARD,
      weeks: DIGITAL_PETS_WEEKS,
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('six-week office has a complete cadence and honest empty scorecard', () => {
  const office = loadOfficeData();
  const dispatches = office.weeks.flatMap((week) => week.dispatches);

  assert.equal(office.weeks.length, 6);
  assert.equal(dispatches.length, 12);
  assert.deepEqual(office.weeks.map((week) => week.dispatches.length), [2, 2, 2, 2, 2, 2]);
  assert.equal(new Set(dispatches.map((dispatch) => dispatch.number)).size, 12);
  assert.equal(office.scorecard.length, 12);
  assert.ok(office.scorecard.every((row) =>
    row.michaelReaction === null &&
    row.externalSignal === null &&
    row.editorialRead === null
  ));
  assert.match(office.loop.stopRule, /two dispatches in a row/);
  assert.equal(office.gates.length, 2);
});

test('launch evidence and organizational decision rights are explicit', () => {
  const office = loadOfficeData();

  assert.equal(office.launch.status, 'launched');
  assert.equal(office.launch.posts, 7);
  assert.equal(
    office.launch.url,
    'https://x.com/mhoydich/status/2081936870641205589',
  );
  assert.equal(office.next[0].status, 'complete');
  assert.equal(office.roles.length, 4);
  assert.deepEqual(
    office.roles.map((role) => role.name),
    ['Michael Hoydich', 'Codex / OpenAI', 'Sol / ChatGPT', 'Readers'],
  );
});

test('office is published across human, JSON, and discovery surfaces', async () => {
  const [page, json, operations, share, sitemap, agents, forAgents, llms, llmsFull] =
    await Promise.all([
      read('src/pages/digital-pets/office.astro'),
      read('src/pages/digital-pets/office.json.ts'),
      read('src/lib/digital-pets-operations.ts'),
      read('src/pages/digital-pets/share.astro'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/agents.json.ts'),
      read('src/pages/for-agents.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
    ]);

  assert.match(page, /DIGITAL_PETS_SCORECARD\.map/);
  assert.match(page, /Two unread dispatches stop production/);
  assert.match(json, /\.\.\.DIGITAL_PETS_OFFICE_META/);
  assert.match(operations, /pointcast\.digital-pets-office\/v1/);
  assert.match(share, /View live X thread/);
  assert.match(share, /href="\/digital-pets\/office"/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\/office\.json/);
  assert.match(agents, /digitalPetsOffice: 'https:\/\/pointcast\.xyz\/digital-pets\/office\.json'/);
  assert.match(forAgents, /six-week read loop/);
  assert.match(llms, /two-unread-piece stop rule/);
  assert.match(llmsFull, /hard pause after two/);
});
