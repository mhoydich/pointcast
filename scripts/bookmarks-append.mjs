#!/usr/bin/env node
/**
 * Append bookmarks to src/data/bookmarks/bookmarks.json.
 *
 *   node scripts/bookmarks-append.mjs --file new.json
 *   node scripts/bookmarks-append.mjs --account kansasdao --id 123 --text '...' --url 'https://x.com/i/status/123' --theme agents
 *
 * A row with no theme is refused. The script prints a suggestion and writes nothing.
 * It does not call X and it does not execute tweet text.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { planAppend, utcDay } from '../src/lib/bookmarks.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? '' : (args[index + 1] ?? '');
};

const fileUrl = new URL('../src/data/bookmarks/bookmarks.json', import.meta.url);
const data = JSON.parse(readFileSync(fileUrl, 'utf8'));
const today = flag('--date') || utcDay();
let incoming = [];

if (flag('--file')) {
  const parsed = JSON.parse(readFileSync(flag('--file'), 'utf8'));
  incoming = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(incoming)) {
    console.error('--file must be a JSON array, or an object with an items array.');
    process.exit(1);
  }
} else if (flag('--id')) {
  incoming = [{
    id: flag('--id'),
    account: flag('--account'),
    text: flag('--text'),
    url: flag('--url'),
    theme: flag('--theme'),
    first_seen: flag('--first-seen') || today,
    ...(flag('--article') ? { article: flag('--article') } : {}),
    ...(flag('--image') ? { image: flag('--image') } : {}),
  }];
} else {
  console.error('Pass --file new.json, or --account, --id, --text, --url, and --theme.');
  process.exit(1);
}

const plan = planAppend(data, incoming, today);
for (const skipped of plan.skipped) console.log(`skip ${skipped}`);
if (!plan.ok) {
  console.error('Nothing written.');
  for (const error of plan.errors) console.error(`- ${error}`);
  process.exit(1);
}
if (!plan.added.length) {
  console.log('Nothing new to add.');
  process.exit(0);
}
writeFileSync(fileUrl, `${JSON.stringify(plan.data, null, 2)}\n`);
console.log(`Appended ${plan.added.length}. Updated ${plan.data.updated}.`);
for (const key of plan.added) console.log(`+ ${key}`);
