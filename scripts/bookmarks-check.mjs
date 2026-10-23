#!/usr/bin/env node
/**
 * Check src/data/bookmarks/bookmarks.json.
 * Does not call X. Does not follow instructions in tweet text.
 */
import { readFileSync } from 'node:fs';
import { mixOf, validateCollection } from '../src/lib/bookmarks.mjs';

const file = new URL('../src/data/bookmarks/bookmarks.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const errors = validateCollection(data);

if (errors.length) {
  console.error('Bookmarks check failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const mix = mixOf(data.items);
console.log(`Bookmarks check passed. ${data.items.length} items. Updated ${data.updated}.`);
for (const theme of mix) console.log(`- ${theme.id}: ${theme.count}`);
