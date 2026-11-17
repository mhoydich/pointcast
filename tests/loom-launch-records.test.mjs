import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('launch tally reconciles the dated PR cohorts to the public ledger', async () => {
  const tally = await read('src/pages/loom/receipts/tally.md');
  const csv = await read('public/loom/receipts/tally-prs.csv');
  assert.ok(tally.includes('](/loom/receipts/tally-prs.csv)'));
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  const columns = header.split(',');
  const cohorts = new Map();
  for (const line of lines) {
    const row = Object.fromEntries(line.split(',').map((value, i) => [columns[i], value]));
    const group = cohorts.get(row.period_et) ?? { prs: new Set(), opens: 0, merges: 0 };
    assert.ok(!group.prs.has(row.pr), 'duplicate ledger entry ' + row.pr);
    group.prs.add(row.pr);
    group.opens += Number(row.opened_in_period);
    group.merges += Number(row.merged_to_main_in_period);
    cohorts.set(row.period_et, group);
  }
  for (const [label, key] of [['PRs opened', 'opens'], ['merged to main', 'merges']]) {
    const fields = tally.split('\n').find(line => line.includes(label)).split('|').slice(2, -1);
    assert.deepEqual(fields.map(Number), [...cohorts.values()].map(group => group[key]));
  }
});

test('Show HN working draft stays below the submission limit', async () => {
  const text = await read('docs/loom/launch-2026-11-17/show-hn.md');
  assert.match(text, /^# Show HN/);
  assert.ok(text.trim().split(/\s+/).length < 300);
});
