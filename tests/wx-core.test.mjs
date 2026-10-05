import test from 'node:test';
import assert from 'node:assert/strict';
import { WX } from '../src/lib/wx-core.mjs';

const body = [
  'Mostly clear over Tokyo, Japan at 4:00 AM local time.',
  '',
  "I'm a bot posting one reading for World Weather Wire. Source: Open-Meteo (open-meteo.com).",
  '',
  'wx: v=1 city=Tokyo cc=JP lat=35.68 lon=139.69 temp_c=19.2 sky=mostly-clear code=1 obs=2026-10-05T19:00Z tz=Asia/Tokyo src=open-meteo',
].join('\n');

test('parses a wx line and keeps the newest reading per city', () => {
  const posted = Date.parse('2026-10-05T19:05:00Z');
  const out = WX.extractReports([
    {
      height: 10,
      timestamp: posted,
      txs: [{ kind: 'publish_block', bot: 'grok', hash: 'abc', payload: { title: 'Tokyo', body, channel: 'BOT' } }],
    },
  ]);
  assert.equal(out.posts, 1);
  assert.equal(out.skipped.length, 0);
  assert.equal(out.reports[0].city, 'Tokyo');
  assert.equal(out.reports[0].sky, 'mostly-clear');
  const latest = WX.latestByCity(out.reports, posted);
  assert.equal(latest.length, 1);
});

test('rejects a hostile or incomplete tag', () => {
  const posted = Date.parse('2026-10-05T19:05:00Z');
  const bad = 'wx: v=1 city=<script> lat=35.68 lon=139.69 temp_c=19 sky=mostly-clear obs=2026-10-05T19:00Z tz=Asia/Tokyo';
  const out = WX.extractReports([
    { height: 11, timestamp: posted, txs: [{ kind: 'publish_block', bot: 'grok', hash: 'def', payload: { title: 'no', body: bad, channel: 'BOT' } }] },
  ]);
  assert.equal(out.reports.length, 0);
  assert.equal(out.skipped.length, 1);
});

test('a drafted report round-trips and does not post', () => {
  const reading = {
    tempC: 19.2, code: 1, sky: 'mostly-clear', phrase: 'Mostly clear',
    feelsC: 20, rh: 80, windKmh: 5, windDeg: 10, isDay: 0,
    obsMs: Date.parse('2026-10-05T19:00:00Z'), tz: 'Asia/Tokyo',
  };
  const place = { city: 'Tokyo', country: 'Japan', cc: 'JP', lat: 35.68, lon: 139.69 };
  const draft = WX.buildReport(place, reading, 'grok');
  assert.equal(draft.checks.ok, true);
  assert.match(draft.body, /^[\s\S]*\nwx: /);
  const back = WX.extractReports([
    { height: 12, timestamp: reading.obsMs + 60_000, txs: [{ kind: 'publish_block', bot: 'grok', hash: 'ghi', payload: { title: draft.title, body: draft.body, channel: 'BOT' } }] },
  ]);
  assert.equal(back.reports.length, 1);
  assert.equal(back.reports[0].city, 'Tokyo');
});
