import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const data = JSON.parse(await readFile(resolve('src/data/civic-packet-watch.json'), 'utf8'));

test('Civic Packet Watch is an explicit first baseline', () => {
  assert.equal(data.status, 'initial-baseline');
  assert.ok(data.signals.length >= 6);
  assert.ok(data.signals.every((signal) => signal.change === 'baseline'));
});

test('every public signal retains an official source', () => {
  const sourceIds = new Set(data.sources.map((source) => source.id));
  for (const signal of data.signals) {
    assert.ok(sourceIds.has(signal.sourceId), signal.id);
    assert.equal(new URL(signal.sourceUrl).protocol, 'https:');
    assert.match(new URL(signal.sourceUrl).hostname, /(^|\.)elsegundo\.gov$/);
  }
});

test('the RFQ deadline conflict is preserved and not resolved silently', () => {
  const signal = data.signals.find((candidate) => candidate.details?.deadlineConflict);
  assert.ok(signal);
  assert.equal(signal.details.packetDueAt, '2026-09-16T11:00:00-07:00');
  assert.equal(signal.details.listingCloseAt, '2026-09-16T17:00:00-07:00');
  assert.match(signal.details.deadlineConflictNote, /does not resolve/i);
});

test('OBJKT edition metadata remains at the wallet boundary', () => {
  assert.equal(data.edition.plannedSupply, 100);
  assert.equal(data.edition.plannedPrice, 'free');
  assert.equal(data.edition.mintStatus, 'not-minted');
});

test('the public resource travels through PointCast discovery surfaces', async () => {
  const [page, jsonRoute, block, home, agents, sitemap, llms, pdf] = await Promise.all([
    readFile(resolve('src/pages/civic-packet-watch.astro'), 'utf8'),
    readFile(resolve('src/pages/civic-packet-watch.json.ts'), 'utf8'),
    readFile(resolve('src/content/blocks/0554.json'), 'utf8'),
    readFile(resolve('src/components/HomeNewEdition.astro'), 'utf8'),
    readFile(resolve('src/pages/agents.json.ts'), 'utf8'),
    readFile(resolve('src/pages/sitemap-discovery.xml.ts'), 'utf8'),
    readFile(resolve('public/llms.txt'), 'utf8'),
    readFile(resolve('public/downloads/civic-packet-watch-field-edition.pdf')),
  ]);
  assert.match(page, /Civic Packet Watch/);
  assert.match(jsonRoute, /Access-Control-Allow-Origin/);
  assert.equal(JSON.parse(block).author, 'codex');
  assert.match(home, /href: '\/civic-packet-watch'/);
  assert.match(agents, /civicPacketWatch/);
  assert.match(sitemap, /civic-packet-watch\.json/);
  assert.match(llms, /## Civic Packet Watch/);
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
});
