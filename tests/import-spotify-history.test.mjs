// scripts/import-spotify-history.mjs — offline conversion of a Spotify privacy
// export into the /station monthly log documents. All fixtures below are
// invented, not real listening history.
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  DEFAULT_MIN_MS, MAX_PER_MONTH,
  sha256Hex, deriveNoUriId, noUriSearchUrl, trackIdFromUri, detectRecordFormat,
  extendedRecordToPlay, shortRecordToPlay, recordToPlay,
  dedupeKey, dedupePlays, filterByRange, groupByMonth, capMonthRows,
  mergePlaysLikeStation, buildSummary, formatSummary, formatWranglerCommands,
  collectJsonFiles, run, parseArgs,
} from '../scripts/import-spotify-history.mjs';

const tmp = async (prefix) => mkdtemp(path.join(tmpdir(), prefix));
const writeJson = async (dir, name, data) => writeFile(path.join(dir, name), JSON.stringify(data));

// ── pure function unit tests ──────────────────────────────────────────

test('detectRecordFormat tells extended from short-form from junk', () => {
  assert.equal(detectRecordFormat({ ts: '2021-01-01T00:00:00Z' }), 'extended');
  assert.equal(detectRecordFormat({ endTime: '2021-01-01 00:00' }), 'short');
  assert.equal(detectRecordFormat({ foo: 1 }), null);
  assert.equal(detectRecordFormat(null), null);
});

test('deriveNoUriId is a stable sha256-derived id; noUriSearchUrl encodes the query', () => {
  const id1 = deriveNoUriId('Boards of Canada', 'Roygbiv');
  const id2 = deriveNoUriId('Boards of Canada', 'Roygbiv');
  assert.equal(id1, id2);
  assert.match(id1, /^nouri-[0-9a-f]{22}$/);
  assert.equal(id1, `nouri-${sha256Hex('Boards of Canada Roygbiv').slice(0, 22)}`);
  assert.notEqual(id1, deriveNoUriId('Boards of Canada', 'Music Is Math'));
  assert.equal(noUriSearchUrl('Boards of Canada', 'Roygbiv'), `https://open.spotify.com/search/${encodeURIComponent('Boards of Canada Roygbiv')}`);
});

test('trackIdFromUri only accepts spotify:track:<id>', () => {
  assert.equal(trackIdFromUri('spotify:track:4uLU6hMCjMI75M1A2tKUQC'), '4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(trackIdFromUri('spotify:episode:abc'), null);
  assert.equal(trackIdFromUri(null), null);
  assert.equal(trackIdFromUri(undefined), null);
});

const extRow = (over = {}) => ({
  ts: '2021-06-15T20:04:22Z',
  ms_played: 210000,
  master_metadata_track_name: 'Weather Report',
  master_metadata_album_artist_name: 'The Fixture Band',
  master_metadata_album_album_name: 'Fixture LP',
  spotify_track_uri: 'spotify:track:aaaaaaaaaaaaaaaaaaaaaa',
  skipped: false,
  reason_end: 'trackdone',
  incognito_mode: false,
  ...over,
});

test('extended row: start time is ts minus ms_played, and the row carries no img/yr/pop', () => {
  const { play, skip } = extendedRecordToPlay(extRow());
  assert.equal(skip, null);
  assert.deepEqual(play, {
    id: 'aaaaaaaaaaaaaaaaaaaaaa',
    t: 'Weather Report',
    a: 'The Fixture Band',
    url: 'https://open.spotify.com/track/aaaaaaaaaaaaaaaaaaaaaa',
    at: '2021-06-15T20:00:52.000Z', // 20:04:22 - 210000ms (3m30s)
    ms: 210000,
    src: 'spotify',
    imp: true,
    al: 'Fixture LP',
  });
  assert.equal('img' in play, false);
  assert.equal('yr' in play, false);
  assert.equal('pop' in play, false);
});

test('extended row: podcast rows are skipped', () => {
  const podcastByEpisode = extRow({ master_metadata_track_name: null, episode_name: 'Ep. 12', spotify_episode_uri: 'spotify:episode:zzz', spotify_track_uri: null });
  assert.equal(extendedRecordToPlay(podcastByEpisode).skip, 'podcast');
  const podcastByNullTrack = extRow({ master_metadata_track_name: null });
  assert.equal(extendedRecordToPlay(podcastByNullTrack).skip, 'podcast');
});

test('extended row: incognito_mode === true is skipped', () => {
  assert.equal(extendedRecordToPlay(extRow({ incognito_mode: true })).skip, 'incognito');
  // only strict true skips — falsy/undefined does not
  assert.equal(extendedRecordToPlay(extRow({ incognito_mode: false })).skip, null);
  assert.equal(extendedRecordToPlay(extRow({ incognito_mode: undefined })).skip, null);
});

test('extended row: plays under --min-ms are skipped (default 30000)', () => {
  assert.equal(extendedRecordToPlay(extRow({ ms_played: 29999 })).skip, 'tooShort');
  assert.equal(extendedRecordToPlay(extRow({ ms_played: 30000 })).skip, null);
  assert.equal(extendedRecordToPlay(extRow({ ms_played: 5000 }), { minMs: 1000 }).skip, null);
});

test('extended row: missing track id / title / artist / bad ts is skipped as missingFields', () => {
  assert.equal(extendedRecordToPlay(extRow({ spotify_track_uri: null })).skip, 'missingFields');
  assert.equal(extendedRecordToPlay(extRow({ master_metadata_album_artist_name: '' })).skip, 'missingFields');
  assert.equal(extendedRecordToPlay(extRow({ ts: 'not-a-date' })).skip, 'missingFields');
});

const shortRow = (over = {}) => ({
  endTime: '2019-03-10 08:15',
  artistName: 'Fixture Artist',
  trackName: 'Fixture Track',
  msPlayed: 180000,
  ...over,
});

test('short-form row: derives a nouri- id, a search url, and start = endTime - msPlayed (UTC)', () => {
  const { play, skip } = shortRecordToPlay(shortRow());
  assert.equal(skip, null);
  assert.equal(play.id, deriveNoUriId('Fixture Artist', 'Fixture Track'));
  assert.equal(play.url, noUriSearchUrl('Fixture Artist', 'Fixture Track'));
  assert.equal(play.at, '2019-03-10T08:12:00.000Z'); // 08:15 - 180000ms (3m)
  assert.equal(play.ms, 180000);
  assert.equal(play.src, 'spotify');
  assert.equal(play.imp, true);
  assert.equal('al' in play, false);
});

test('short-form row: too-short and missing-field rows are skipped', () => {
  assert.equal(shortRecordToPlay(shortRow({ msPlayed: 1000 })).skip, 'tooShort');
  assert.equal(shortRecordToPlay(shortRow({ trackName: '' })).skip, 'missingFields');
  assert.equal(shortRecordToPlay(shortRow({ endTime: 'garbage' })).skip, 'missingFields');
});

test('recordToPlay dispatches on shape and falls back to missingFields for junk', () => {
  assert.equal(recordToPlay(extRow()).skip, null);
  assert.equal(recordToPlay(shortRow()).skip, null);
  assert.equal(recordToPlay({ nonsense: true }).skip, 'missingFields');
});

test('a month boundary: a play whose start (ts - ms_played) crosses into the previous month/year in UTC', () => {
  const row = extRow({ ts: '2021-01-01T00:00:10Z', ms_played: 40000 }); // starts 2020-12-31T23:59:30Z
  const { play } = extendedRecordToPlay(row);
  assert.equal(play.at, '2020-12-31T23:59:30.000Z');
  const grouped = groupByMonth([play]);
  assert.deepEqual([...grouped.keys()], ['2020-12']);
});

test('dedupePlays drops identical (id, at-to-the-minute) rows, keeping order', () => {
  const a = { id: 'x', at: '2021-01-01T00:00:10.000Z' };
  const b = { id: 'x', at: '2021-01-01T00:00:55.000Z' }; // same minute as a
  const c = { id: 'x', at: '2021-01-01T00:01:05.000Z' }; // next minute — kept
  const { plays, duplicates } = dedupePlays([a, b, c]);
  assert.equal(duplicates, 1);
  assert.deepEqual(plays, [a, c]);
  assert.equal(dedupeKey(a), 'x|2021-01-01T00:00');
});

test('filterByRange keeps only plays whose start falls within --from/--to (UTC, inclusive)', () => {
  const plays = [
    { at: '2021-01-01T00:00:00.000Z' },
    { at: '2021-06-15T12:00:00.000Z' },
    { at: '2021-12-31T23:59:59.000Z' },
  ];
  const { plays: kept, outOfRange } = filterByRange(plays, { from: '2021-02-01', to: '2021-11-30' });
  assert.equal(kept.length, 1);
  assert.equal(outOfRange, 2);
  assert.equal(filterByRange(plays, {}).outOfRange, 0);
});

test('capMonthRows keeps only the newest MAX_PER_MONTH rows and reports the drop', () => {
  const rows = Array.from({ length: MAX_PER_MONTH + 10 }, (_, i) => ({ id: `t${i}`, at: `2021-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`, seq: i }));
  const { rows: capped, dropped } = capMonthRows(rows, MAX_PER_MONTH);
  assert.equal(dropped, 10);
  assert.equal(capped.length, MAX_PER_MONTH);
  assert.equal(capped[0].seq, 10); // the 10 oldest (lowest seq) were dropped
  assert.equal(capMonthRows(rows.slice(0, 5), MAX_PER_MONTH).dropped, 0);
});

test('mergePlaysLikeStation matches _station.ts mergePlays: near-duplicates collapse, seen loses to spotify', () => {
  const seen = { id: 'aaa1', at: '2026-09-20T03:11:30.000Z', src: 'seen', t: 'X', a: 'Y', url: 'https://open.spotify.com/track/aaa1' };
  const spotifyExact = { id: 'aaa1', at: '2026-09-20T03:13:20.000Z', src: 'spotify', t: 'X', a: 'Y', url: 'https://open.spotify.com/track/aaa1' };
  const laterReplay = { id: 'aaa1', at: '2026-09-20T09:00:00.000Z', src: 'spotify', t: 'X', a: 'Y', url: 'https://open.spotify.com/track/aaa1' };
  let r = mergePlaysLikeStation([], [seen]);
  assert.equal(r.added, 1);
  r = mergePlaysLikeStation(r.plays, [spotifyExact]);
  assert.equal(r.plays.length, 1);
  assert.equal(r.plays[0].src, 'spotify');
  r = mergePlaysLikeStation(r.plays, [laterReplay]);
  assert.equal(r.plays.length, 2, 'a replay hours later is a distinct play');
  assert.equal(r.added, 1);
});

test('buildSummary + formatSummary: top artists/tracks, plays per year, total hours', () => {
  const plays = [
    { id: 't1', t: 'Song One', a: 'Artist A', at: '2020-01-01T00:00:00.000Z', ms: 3600000 },
    { id: 't1', t: 'Song One', a: 'Artist A', at: '2020-06-01T00:00:00.000Z', ms: 3600000 },
    { id: 't2', t: 'Song Two', a: 'Artist B', at: '2021-01-01T00:00:00.000Z', ms: 1800000 },
  ];
  const summary = buildSummary(plays, { filesRead: 2, rowsRead: 5, skipped: { podcast: 1, tooShort: 1 } });
  assert.equal(summary.filesRead, 2);
  assert.equal(summary.rowsRead, 5);
  assert.equal(summary.rowsKept, 3);
  assert.deepEqual(summary.skipped, { podcast: 1, tooShort: 1 });
  assert.equal(summary.dateRange.from, '2020-01-01T00:00:00.000Z');
  assert.equal(summary.dateRange.to, '2021-01-01T00:00:00.000Z');
  assert.equal(summary.totalHours, 2.5);
  assert.equal(summary.topArtists[0].name, 'Artist A');
  assert.equal(summary.topArtists[0].plays, 2);
  assert.equal(summary.topTracks[0].id, 't1');
  assert.deepEqual(summary.playsPerYear, { '2020': 2, '2021': 1 });
  const text = formatSummary(summary);
  assert.match(text, /Song One/);
  assert.match(text, /Artist A/);
  assert.match(text, /2020: 2/);
});

test('formatWranglerCommands prints get+put commands but never a real namespace id, and warns about replace', () => {
  const text = formatWranglerCommands([{ month: '2021-01' }], { outDir: './out' });
  assert.match(text, /wrangler kv key put "station:v1:broadcast:log:2021-01"/);
  assert.match(text, /wrangler kv key get "station:v1:broadcast:log:2021-01"/);
  assert.match(text, /REPLACES/);
  assert.match(text, /<USERS_NAMESPACE_ID>/);
});

test('parseArgs reads flags and the positional export dir', () => {
  const args = parseArgs(['/exports', '--out', '/out', '--min-ms', '5000', '--from', '2020-01-01', '--to', '2020-12-31', '--merge-with', '/merge', '--dry-run']);
  assert.equal(args.inputDir, '/exports');
  assert.equal(args.out, '/out');
  assert.equal(args.minMs, 5000);
  assert.equal(args.from, '2020-01-01');
  assert.equal(args.to, '2020-12-31');
  assert.equal(args.mergeWith, '/merge');
  assert.equal(args.dryRun, true);
});

// ── run() against real temp-dir fixtures ──────────────────────────────

test('run(): reads both export formats from a directory, skips podcasts/incognito/short/dupe, writes monthly files + summary.json', async () => {
  const inputDir = await tmp('pc-import-in-');
  const outDir = await tmp('pc-import-out-');

  await writeJson(inputDir, 'Streaming_History_Audio_2021_1.json', [
    extRow({ spotify_track_uri: 'spotify:track:bbbbbbbbbbbbbbbbbbbbbb', master_metadata_track_name: 'Song B', ts: '2021-02-01T00:05:00Z', ms_played: 60000 }),
    extRow({ master_metadata_track_name: null, episode_name: 'A podcast', spotify_track_uri: null }), // podcast
    extRow({ incognito_mode: true }), // incognito
    extRow({ ms_played: 1000 }), // too short
    // duplicate of the first row (same id, same minute)
    extRow({ spotify_track_uri: 'spotify:track:bbbbbbbbbbbbbbbbbbbbbb', master_metadata_track_name: 'Song B', ts: '2021-02-01T00:05:40Z', ms_played: 60000 }),
  ]);
  await writeJson(inputDir, 'StreamingHistory_music_0.json', [
    shortRow({ endTime: '2019-03-10 08:15', artistName: 'Old Artist', trackName: 'Old Track' }),
  ]);
  await writeJson(inputDir, 'Marquee.json', [{ segment: 'unrelated export file' }]); // not a streaming-history shape

  const summary = await run({ inputDir, out: outDir });

  assert.equal(summary.filesRead, 2); // Marquee.json is ignored
  assert.equal(summary.rowsRead, 6);
  assert.equal(summary.rowsKept, 2); // 1 kept from extended (dupe collapsed) + 1 from short-form
  assert.equal(summary.skipped.podcast, 1);
  assert.equal(summary.skipped.incognito, 1);
  assert.equal(summary.skipped.tooShort, 1);
  assert.equal(summary.skipped.duplicate, 1);
  assert.equal(summary.skipped.unrecognizedFile, 1);

  const feb2021 = JSON.parse(await readFile(path.join(outDir, 'station-log-2021-02.json'), 'utf8'));
  assert.equal(feb2021.length, 1);
  assert.equal(feb2021[0].t, 'Song B');
  assert.equal(feb2021[0].imp, true);

  const mar2019 = JSON.parse(await readFile(path.join(outDir, 'station-log-2019-03.json'), 'utf8'));
  assert.equal(mar2019.length, 1);
  assert.equal(mar2019[0].t, 'Old Track');
  assert.match(mar2019[0].id, /^nouri-/);

  const writtenSummary = JSON.parse(await readFile(path.join(outDir, 'summary.json'), 'utf8'));
  assert.equal(writtenSummary.rowsKept, 2);
});

test('run(): --dry-run writes nothing', async () => {
  const inputDir = await tmp('pc-import-in-');
  const outDir = await tmp('pc-import-out-');
  await writeJson(inputDir, 'Streaming_History_Audio_2021_1.json', [extRow()]);

  const summary = await run({ inputDir, dryRun: true });
  assert.equal(summary.rowsKept, 1);

  const { readdir } = await import('node:fs/promises');
  assert.deepEqual(await readdir(outDir), []);
});

test('run(): --from/--to trims the range before monthly grouping', async () => {
  const inputDir = await tmp('pc-import-in-');
  await writeJson(inputDir, 'Streaming_History_Audio_2021_1.json', [
    extRow({ ts: '2021-01-15T00:00:00Z' }),
    extRow({ ts: '2021-06-15T00:00:00Z', spotify_track_uri: 'spotify:track:cccccccccccccccccccccc' }),
    extRow({ ts: '2021-12-15T00:00:00Z', spotify_track_uri: 'spotify:track:dddddddddddddddddddddd' }),
  ]);
  const summary = await run({ inputDir, dryRun: true, from: '2021-02-01', to: '2021-11-30' });
  assert.equal(summary.rowsKept, 1);
  assert.equal(summary.skipped.outOfRange, 2);
});

test('run(): --merge-with folds imported rows into a previously downloaded month using the station merge rule', async () => {
  const inputDir = await tmp('pc-import-in-');
  const mergeDir = await tmp('pc-import-merge-');
  const outDir = await tmp('pc-import-out-');

  // Existing live doc for 2021-02 already has a "seen" row for the same play,
  // plus one unrelated play that must survive the merge untouched.
  await writeJson(mergeDir, 'station-log-2021-02.json', [
    { id: 'bbbbbbbbbbbbbbbbbbbbbb', t: 'Song B (seen)', a: 'The Fixture Band', url: 'https://open.spotify.com/track/bbbbbbbbbbbbbbbbbbbbbb', at: '2021-02-01T00:05:10.000Z', src: 'seen' },
    { id: 'zzzzzzzzzzzzzzzzzzzzzz', t: 'Unrelated', a: 'Someone Else', url: 'https://open.spotify.com/track/zzzzzzzzzzzzzzzzzzzzzz', at: '2021-02-10T00:00:00.000Z', src: 'spotify', ms: 200000 },
  ]);
  await writeJson(inputDir, 'Streaming_History_Audio_2021_1.json', [
    extRow({ spotify_track_uri: 'spotify:track:bbbbbbbbbbbbbbbbbbbbbb', master_metadata_track_name: 'Song B', ts: '2021-02-01T00:06:00Z', ms_played: 60000 }),
  ]);

  const summary = await run({ inputDir, out: outDir, mergeWith: mergeDir });
  const merged = JSON.parse(await readFile(path.join(outDir, 'station-log-2021-02.json'), 'utf8'));
  assert.equal(merged.length, 2, 'the near-duplicate seen/spotify rows collapse into one; the unrelated row survives');
  const song = merged.find((p) => p.id === 'bbbbbbbbbbbbbbbbbbbbbb');
  assert.equal(song.src, 'spotify', 'spotify replaces seen for the same play');
  assert.ok(merged.find((p) => p.id === 'zzzzzzzzzzzzzzzzzzzzzz'), 'unrelated existing row is preserved');
  // mergePlays (and this reimplementation) counts a seen->spotify replace as "added", same as _station.ts.
  assert.equal(summary.months[0].mergedAdded, 1);
});

test('run(): the 6000-per-month cap drops the oldest rows and is reported as a warning + skip count', async () => {
  const inputDir = await tmp('pc-import-in-');
  const outDir = await tmp('pc-import-out-');
  const rows = Array.from({ length: MAX_PER_MONTH + 3 }, (_, i) => extRow({
    spotify_track_uri: `spotify:track:${String(i).padStart(22, '0')}`,
    master_metadata_track_name: `Song ${i}`,
    ts: `2021-03-${String((i % 27) + 1).padStart(2, '0')}T12:00:${String(i % 60).padStart(2, '0')}Z`,
  }));
  await writeJson(inputDir, 'Streaming_History_Audio_2021_1.json', rows);
  const summary = await run({ inputDir, out: outDir });
  assert.equal(summary.skipped.capped, 3);
  const written = JSON.parse(await readFile(path.join(outDir, 'station-log-2021-03.json'), 'utf8'));
  assert.equal(written.length, MAX_PER_MONTH);
});

// ── CLI smoke test via child_process ──────────────────────────────────

test('CLI: node scripts/import-spotify-history.mjs --dry-run prints a summary and writes nothing', async () => {
  const inputDir = await tmp('pc-import-cli-in-');
  await writeJson(inputDir, 'Streaming_History_Audio_2021_1.json', [extRow()]);

  const result = spawnSync(process.execPath, [
    'scripts/import-spotify-history.mjs', inputDir, '--dry-run',
  ], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Rows kept:\s+1/);
  assert.match(result.stdout, /dry run/);
  assert.match(result.stdout, /wrangler kv key put/);
});

test('CLI: missing --out without --dry-run fails loudly instead of guessing', () => {
  const result = spawnSync(process.execPath, [
    'scripts/import-spotify-history.mjs', '/nonexistent-input-dir',
  ], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--out/);
});

// Added in review (cc): the merge rule changed on main the same day; the copy has to follow it.
test('a track on repeat keeps every imported play, and an import folds into the live row of the same play', async () => {
  const { mergePlaysLikeStation } = await import('../scripts/import-spotify-history.mjs');
  const row = (at, extra = {}) => ({ id: 'rep', t: 'Short Song', a: 'Band', url: 'https://open.spotify.com/track/rep', at, ms: 120000, src: 'spotify', ...extra });
  const imported = [row('2024-05-01T10:00:00.000Z', { imp: true }), row('2024-05-01T10:02:00.000Z', { imp: true }), row('2024-05-01T10:04:00.000Z', { imp: true })];
  assert.equal(mergePlaysLikeStation([], imported).plays.length, 3, 'three back-to-back plays stay three');
  assert.equal(mergePlaysLikeStation(imported, [row('2024-05-01T10:02:00.000Z', { imp: true })]).added, 0, 'the identical imported row is a duplicate');
  assert.equal(mergePlaysLikeStation([row('2024-05-01T10:01:55.000Z')], [row('2024-05-01T10:00:00.000Z', { imp: true })]).added, 0, 'live stamp vs import start time: same play');
});
