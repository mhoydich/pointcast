#!/usr/bin/env node
/**
 * Publish one preselected exhibition. Never search seeds or tune the rules here.
 * A checked-in record is immutable: later rule changes require a new issue.
 * Usage: node scripts/generate-battler-rivalry-record.mjs [--verify-live]
 */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { catalog, parseMatchInput, rulesVersion, runArena, matchHash } from '../functions/_lib/nouns-battler-arena.ts';
import { canonicalJson } from '../src/lib/x402.ts';

export const EXPECTED_RULES_VERSION = 'nouns-nation.exhibition.1';
export const INPUT = parseMatchInput({
  seed: 20260915,
  left: { gang: 'tomato-noggles', tactic: 'rush' },
  right: { gang: 'cobalt-frames', tactic: 'guard' },
});
export const API_URL = 'https://pointcast.xyz/api/nouns-battler/arena';
export const RECORD_PATH = fileURLToPath(new URL('../public/games/nouns-nation-battler/records/rivalry-night-001.json', import.meta.url));

async function runLocally() {
  assert.equal(rulesVersion, EXPECTED_RULES_VERSION, 'The original rules have changed. Preserve issue 001 and publish a new issue.');
  const response = await runArena(new Request(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(INPUT),
  }));
  assert.equal(response.status, 200);
  return response.json();
}

export async function verifyLiveMatch(local, fetcher = fetch) {
  const response = await fetcher(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INPUT), signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, 'The live free API must succeed before publication.');
  const live = await response.json();
  assert.equal(live.ok, true);
  assert.equal(live.saved, false, 'This publication must use the free exhibition endpoint.');
  assert.equal(live.price, 'free');
  assert.equal(live.matchHash, local.matchHash, 'Live API hash differs from the shared server engine.');
  assert.equal(await matchHash(live.match), local.matchHash, 'Live match does not match its advertised hash.');
  assert.equal(canonicalJson(live.match), canonicalJson(local.match), 'Live API result or replay differs.');
  return live;
}

export async function createPublishedRecord({ now = new Date().toISOString(), fetcher = fetch } = {}) {
  const local = await runLocally();
  await verifyLiveMatch(local, fetcher);
  return {
    schemaVersion: 'pointcast.battler-rivalry-night.v1',
    kind: 'published-exhibition',
    metadata: {
      id: '001', title: 'Rivalry Night 001', tagline: 'Red pressure. Blue patience.',
      date: '2026-09-15', publishedAt: now,
      path: '/nouns-nation-battler-rivalry-night/001/',
      canonical: 'https://pointcast.xyz/nouns-nation-battler-rivalry-night/001/',
      jsonUrl: '/nouns-nation-battler-rivalry-night.json',
      recordUrl: '/games/nouns-nation-battler/records/rivalry-night-001.json',
      rematchUrl: '/nouns-nation-battler-arena/?seed=20260915&leftGang=tomato-noggles&leftTactic=rush&rightGang=cobalt-frames&rightTactic=guard',
    },
    provenance: {
      method: 'Generated with the shared server exhibition engine and independently checked against the live free API.',
      generatedAt: now,
      engine: '/games/nouns-nation-battler/agent-engine.mjs',
      rulesVersion: EXPECTED_RULES_VERSION,
      apiVerification: { endpoint: API_URL, method: 'POST', checkedAt: now, matchHash: local.matchHash, exactMatch: true, sourceResponseSaved: false },
      storage: 'Checked-in static publication containing the complete result, replay frames and catalog snapshot.',
      boundary: 'A published exhibition, separate from browser-local league standings. No payment, wager, prize, wallet signature or commissioned receipt.',
      hashMethod: 'SHA-256 of the match object serialized with recursively sorted object keys; array order is preserved.',
    },
    catalog: JSON.parse(JSON.stringify(catalog)),
    matchHash: local.matchHash,
    match: local.match,
  };
}

export async function writeImmutableRecord(path, record) {
  const serialized = JSON.stringify(record, null, 2) + '\n';
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, serialized, { flag: 'wx' });
    return 'created';
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const previous = await readFile(path, 'utf8');
    assert.equal(previous, serialized, 'Refusing to overwrite a published record. Create a new issue instead.');
    return 'unchanged';
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--verify-live')) throw new Error('Usage: node scripts/generate-battler-rivalry-record.mjs [--verify-live]');
  let existing;
  try { existing = JSON.parse(await readFile(RECORD_PATH, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing) {
    const local = await runLocally();
    assert.equal(existing.matchHash, local.matchHash, 'The original engine result changed. Do not overwrite this issue.');
    assert.equal(await matchHash(existing.match), existing.matchHash, 'Stored match hash is invalid.');
    assert.equal(canonicalJson(existing.match), canonicalJson(local.match), 'Stored replay differs from the original engine.');
    assert.equal(canonicalJson(existing.catalog), canonicalJson(catalog), 'The original catalog changed. Preserve the published snapshot.');
    if (args.includes('--verify-live')) await verifyLiveMatch(local);
    console.log(`Rivalry Night 001 unchanged; ${existing.matchHash}${args.includes('--verify-live') ? '; live API matched' : ''}`);
    return;
  }
  const record = await createPublishedRecord();
  const state = await writeImmutableRecord(RECORD_PATH, record);
  console.log(`Rivalry Night 001 ${state}; live API matched; ${record.matchHash}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
