import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const directory = new URL('../public/sketches/shareables/day/', import.meta.url);
const html = readFileSync(new URL('index.html', directory), 'utf8');
const preview = readFileSync(new URL('day.png', directory));
const publicImage = 'https://pointcast.xyz/sketches/shareables/day/day.png';

test('the shareable and its preview fit the 60 KB budget together', () => {
  assert.ok(Buffer.byteLength(html) + preview.length < 60_000);
  assert.match(html, /SPDX-License-Identifier: CC0-1.0/);
  assert.doesNotMatch(html, /<script\b|<link\b[^>]*rel="stylesheet"/i);
});

test('saving the standalone page offline gives the social preview at its real size', () => {
  assert.deepEqual([...preview.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 630);
  const embedded = html.match(/href="data:image\/png;base64,([^"]+)"/);
  assert.ok(embedded);
  assert.deepEqual(Buffer.from(embedded[1], 'base64'), preview);
  assert.ok(html.includes('property="og:image" content="' + publicImage + '"'));
  assert.ok(html.includes('&lt;img src="' + publicImage + '"'));
});

test('the thirteen release marks and the evidence link stay with the dated card', () => {
  const marks = [...html.matchAll(/<i style="left:([\d.]+)%"/g)].map(match => Number(match[1]));
  assert.equal(marks.length, 13);
  assert.ok(marks.every((position, i) => position > (marks[i - 1] ?? 0) && position < 100));
  assert.match(html, /datetime="2026-11-18"/);
  assert.match(html, /href="https:\/\/github\.com\/mhoydich\/pointcast\/pull\/1895"/);
});
