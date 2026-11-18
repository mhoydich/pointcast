import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../src/data/project-progress.json', import.meta.url)));
const page = await readFile(new URL('../src/pages/project-kanban.astro', import.meta.url), 'utf8');
const endpoint = await readFile(new URL('../src/pages/project-kanban.json.ts', import.meta.url), 'utf8');

test('snapshot has valid public records, timestamps, and evidence', () => {
  assert.equal(data.schemaVersion, 1);
  assert.deepEqual(data.statuses, ['Live', 'Building', 'Ready for review', 'Blocked', 'Planned']);
  const ids = new Set();
  const validTime = (s) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(s) && new Date(s).toISOString() === s.replace('Z', '.000Z');
  assert.ok(validTime(data.checkedAt));
  for (const p of data.projects) {
    assert.match(p.id, /^[a-z0-9-]+$/); assert.ok(!ids.has(p.id)); ids.add(p.id);
    assert.ok(data.statuses.includes(p.status));
    for (const key of ['title', 'kind', 'summary', 'nextAction', 'blocker']) assert.ok(p[key]?.trim(), `${p.id}: ${key}`);
    assert.ok(validTime(p.checkedAt)); assert.ok(p.checkedAt <= data.checkedAt);
    assert.ok(p.links.length || p.sourceNote, `${p.id}: evidence`);
    for (const link of p.links) {
      assert.ok(link.label);
      assert.ok(/^\/(?!\/)[a-z0-9/.-]*$/.test(link.url) || /^https:\/\/github\.com\/mhoydich\/pointcast\/pull\/\d+$/.test(link.url), link.url);
    }
  }
  assert.doesNotMatch(JSON.stringify(data), /(?:\/Users\/|\/home\/|chatgpt\.site|@|task-[0-9]|approval payload)/i);
});

test('page and JSON endpoint use one snapshot and retain the local board', () => {
  assert.match(page, /import progress from '\.\.\/data\/project-progress\.json'/);
  assert.match(endpoint, /import snapshot from '\.\.\/data\/project-progress\.json'/);
  assert.match(page, /progress\.statuses\.map/);
  assert.match(page, /progress\.projects\.filter/);
  assert.match(page, /pointcast:project-kanban:v1/);
  assert.match(page, /progress-filter/);
});
