#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve(process.cwd(), 'src/data/civic-packet-watch.json');
const data = JSON.parse(await readFile(path, 'utf8'));
const failures = [];
const requireValue = (condition, message) => { if (!condition) failures.push(message); };
const ids = new Set();
const officialHosts = new Set(['www.elsegundo.gov', 'elsegundo.gov']);

requireValue(data.schemaVersion === '1.0.0', 'schemaVersion must be 1.0.0');
requireValue(data.status === 'initial-baseline', 'first public snapshot must be labeled initial-baseline');
requireValue(data.official === false, 'resource must not claim official status');
requireValue(typeof data.affiliation === 'string' && data.affiliation.includes('Not affiliated'), 'non-affiliation language is required');
requireValue(typeof data.disclaimer === 'string' && data.disclaimer.includes('Official city pages'), 'official-source authority disclaimer is required');
requireValue(data.collection?.promotionRule?.includes('human'), 'human review promotion rule is required');
requireValue(data.edition?.mintStatus === 'not-minted', 'edition must not imply an unverified OBJKT mint');
requireValue(data.edition?.plannedSupply === 100, 'planned OBJKT supply must be 100');
requireValue(data.edition?.plannedPrice === 'free', 'planned OBJKT price must be free');

for (const source of data.sources || []) {
  requireValue(!ids.has(source.id), `duplicate id: ${source.id}`);
  ids.add(source.id);
  try {
    const url = new URL(source.url);
    requireValue(url.protocol === 'https:', `source must use https: ${source.id}`);
    requireValue(officialHosts.has(url.hostname), `source must be an approved official host: ${source.id}`);
  } catch {
    failures.push(`invalid source URL: ${source.id}`);
  }
}

for (const signal of data.signals || []) {
  requireValue(!ids.has(signal.id), `duplicate id: ${signal.id}`);
  ids.add(signal.id);
  requireValue(signal.change === 'baseline', `initial snapshot cannot label ${signal.id} as ${signal.change}`);
  requireValue(data.sources.some((source) => source.id === signal.sourceId), `unknown sourceId on ${signal.id}`);
  requireValue(!('people' in signal), `people field is out of scope: ${signal.id}`);
  requireValue(!('email' in signal), `email field is out of scope: ${signal.id}`);
}

const conflict = data.signals.find((signal) => signal.details?.deadlineConflict);
requireValue(Boolean(conflict), 'at least one preserved deadline conflict is expected in the baseline');
requireValue(conflict?.details?.packetDueAt !== conflict?.details?.listingCloseAt, 'deadline conflict must preserve both distinct values');

if (failures.length) {
  console.error(`Civic Packet Watch audit failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Civic Packet Watch audit passed: ${data.signals.length} signals, ${data.sources.length} sources, ${data.ledger.length} ledger entries.`);
