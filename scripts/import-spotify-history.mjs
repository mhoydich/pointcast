#!/usr/bin/env node
/**
 * Convert a Spotify "Extended streaming history" privacy export (or the
 * older short-form "account data" export) into the monthly documents
 * /station's play log stores in KV: one JSON array of StationPlay rows
 * per key `station:v1:broadcast:log:{YYYY-MM}`, oldest-first, capped at
 * 6000 rows. See functions/api/spotify/_station.ts for that shape.
 *
 * This script is entirely offline: it reads local export files, writes
 * local JSON files, and PRINTS (never runs) the wrangler commands that
 * would upload them. It never touches production KV.
 *
 * Usage:
 *   node scripts/import-spotify-history.mjs <export-dir> --out <dir> [options]
 *
 * Options:
 *   --out <dir>          Write station-log-YYYY-MM.json + summary.json here.
 *                         Required unless --dry-run.
 *   --min-ms <n>          Skip plays shorter than this many ms (default 30000).
 *   --from <YYYY-MM-DD>   Drop plays that started before this date (UTC).
 *   --to <YYYY-MM-DD>     Drop plays that started after this date (UTC).
 *   --merge-with <dir>    Directory of previously downloaded month documents
 *                         (e.g. via `wrangler kv key get`), one
 *                         station-log-YYYY-MM.json per month. Each month's
 *                         imported rows are merged into that file's rows
 *                         using the exact same rule /station uses in KV
 *                         (mergePlaysLikeStation below), so the output is
 *                         ready to upload without clobbering existing plays.
 *   --dry-run             Print the summary; write nothing.
 *
 * See docs/setup/spotify-history-import.md for the full walkthrough,
 * including how to request the export from Spotify.
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const DEFAULT_MIN_MS = 30000;
export const MAX_PER_MONTH = 6000; // must match _station.ts's MAX_PER_MONTH

// ── id/url derivation for the old short-form export (no track id) ────────

export function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Stable id for a track that has no Spotify id, per the task spec:
 *  'nouri-' + first 22 hex chars of sha256(artist + ' ' + track). */
export function deriveNoUriId(artist, track) {
  return `nouri-${sha256Hex(`${artist} ${track}`).slice(0, 22)}`;
}

export function noUriSearchUrl(artist, track) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${artist} ${track}`)}`;
}

export function trackIdFromUri(uri) {
  if (typeof uri !== 'string') return null;
  const m = /^spotify:track:([A-Za-z0-9]+)$/.exec(uri.trim());
  return m ? m[1] : null;
}

// ── record shape detection + conversion ───────────────────────────────────

/** 'extended' = Streaming_History_Audio_*.json (has `ts`); 'short' =
 *  StreamingHistory_music_*.json (has `endTime`); null = neither. */
export function detectRecordFormat(record) {
  if (!record || typeof record !== 'object') return null;
  if ('ts' in record) return 'extended';
  if ('endTime' in record) return 'short';
  return null;
}

/** "YYYY-MM-DD HH:mm" UTC, no seconds (the short-form export's endTime). */
function parseShortEndTime(value) {
  if (typeof value !== 'string') return NaN;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/.exec(value.trim());
  if (!m) return NaN;
  return Date.parse(`${m[1]}T${m[2]}:00Z`);
}

/** Convert one Extended-history record. Returns { play, skip } — exactly one is set. */
export function extendedRecordToPlay(record, { minMs = DEFAULT_MIN_MS } = {}) {
  const isPodcastLike = record.episode_name != null || record.spotify_episode_uri != null
    || record.master_metadata_track_name == null;
  if (isPodcastLike) return { play: null, skip: 'podcast' };
  if (record.incognito_mode === true) return { play: null, skip: 'incognito' };

  const msPlayed = Number(record.ms_played);
  if (!Number.isFinite(msPlayed)) return { play: null, skip: 'missingFields' };
  if (msPlayed < minMs) return { play: null, skip: 'tooShort' };

  const trackId = trackIdFromUri(record.spotify_track_uri);
  const title = typeof record.master_metadata_track_name === 'string' ? record.master_metadata_track_name.trim() : '';
  const artist = typeof record.master_metadata_album_artist_name === 'string' ? record.master_metadata_album_artist_name.trim() : '';
  const tsMs = Date.parse(record.ts);
  if (!trackId || !title || !artist || !Number.isFinite(tsMs)) return { play: null, skip: 'missingFields' };

  const play = {
    id: trackId,
    t: title.slice(0, 160),
    a: artist.slice(0, 160),
    url: `https://open.spotify.com/track/${trackId}`,
    at: new Date(tsMs - msPlayed).toISOString(), // `at` = START of the play
    ms: msPlayed,
    src: 'spotify',
    imp: true,
  };
  const album = typeof record.master_metadata_album_album_name === 'string' ? record.master_metadata_album_album_name.trim() : '';
  if (album) play.al = album.slice(0, 160);
  return { play, skip: null };
}

/** Convert one short-form ("account data") record. Returns { play, skip }. */
export function shortRecordToPlay(record, { minMs = DEFAULT_MIN_MS } = {}) {
  const msPlayed = Number(record.msPlayed);
  if (!Number.isFinite(msPlayed)) return { play: null, skip: 'missingFields' };
  if (msPlayed < minMs) return { play: null, skip: 'tooShort' };

  const title = typeof record.trackName === 'string' ? record.trackName.trim() : '';
  const artist = typeof record.artistName === 'string' ? record.artistName.trim() : '';
  const endMs = parseShortEndTime(record.endTime);
  if (!title || !artist || !Number.isFinite(endMs)) return { play: null, skip: 'missingFields' };

  const play = {
    id: deriveNoUriId(artist, title),
    t: title.slice(0, 160),
    a: artist.slice(0, 160),
    url: noUriSearchUrl(artist, title),
    at: new Date(endMs - msPlayed).toISOString(),
    ms: msPlayed,
    src: 'spotify',
    imp: true,
  };
  return { play, skip: null };
}

export function recordToPlay(record, opts = {}) {
  const format = detectRecordFormat(record);
  if (format === 'extended') return extendedRecordToPlay(record, opts);
  if (format === 'short') return shortRecordToPlay(record, opts);
  return { play: null, skip: 'missingFields' };
}

// ── dedupe / range filter / monthly cap ───────────────────────────────────

/** Identical (id, at-to-the-minute) rows are the same play logged twice. */
export function dedupeKey(play) {
  return `${play.id}|${play.at.slice(0, 16)}`; // YYYY-MM-DDTHH:MM
}

export function dedupePlays(plays) {
  const seen = new Set();
  const kept = [];
  let duplicates = 0;
  for (const p of plays) {
    const key = dedupeKey(p);
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key);
    kept.push(p);
  }
  return { plays: kept, duplicates };
}

export function filterByRange(plays, { from, to } = {}) {
  const fromMs = from ? Date.parse(`${from}T00:00:00.000Z`) : -Infinity;
  const toMs = to ? Date.parse(`${to}T23:59:59.999Z`) : Infinity;
  const kept = [];
  let outOfRange = 0;
  for (const p of plays) {
    const t = Date.parse(p.at);
    if (t < fromMs || t > toMs) { outOfRange++; continue; }
    kept.push(p);
  }
  return { plays: kept, outOfRange };
}

/** Group by the UTC month of `at` (the play's start) — this is what makes a
 * play that starts a few seconds into the previous month file under the
 * previous month's key, matching how the live log keys documents. */
export function groupByMonth(plays) {
  const byMonth = new Map();
  for (const p of plays) {
    const month = p.at.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(p);
  }
  for (const rows of byMonth.values()) rows.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  return byMonth;
}

export function capMonthRows(rows, cap = MAX_PER_MONTH) {
  if (rows.length <= cap) return { rows, dropped: 0 };
  return { rows: rows.slice(-cap), dropped: rows.length - cap }; // keep the newest `cap`
}

/**
 * Re-implementation of mergePlays() from functions/api/spotify/_station.ts.
 * This is a COPY, not an import — the source file runs in the Workers
 * runtime and this script runs under plain Node — but it is kept
 * byte-for-byte identical in BEHAVIOUR: same "near" match window (10 min,
 * or the incoming play's duration + 3 min, whichever is larger), same
 * seen-loses-to-spotify replace rule, same oldest-first sort, same
 * MAX_PER_MONTH cap. If _station.ts's mergePlays ever changes, update
 * this copy to match, or a --merge-with run here will silently diverge
 * from what uploading to KV would actually produce.
 */
export function mergePlaysLikeStation(existing, incoming) {
  const plays = [...existing];
  let added = 0;
  // Same rule as mergePlays in functions/api/spotify/_station.ts (2026-09-21): two Spotify rows of
  // the same provenance (both imported, or both live) are duplicates only at the identical
  // timestamp, so a track on repeat keeps every play; anything else matches within the track's length.
  const exact = (p) => (p.src === 'seen' ? '' : `${p.src}:${p.imp ? 'imp' : 'live'}`);
  const near = (x, y) => x.id === y.id && (exact(x) && exact(x) === exact(y)
    ? x.at === y.at
    : Math.abs(Date.parse(x.at) - Date.parse(y.at)) < Math.max(10 * 60000, (y.ms ?? 0) + 3 * 60000));
  for (const p of incoming) {
    const i = plays.findIndex((q) => near(q, p));
    if (i === -1) { plays.push(p); added++; continue; }
    if (plays[i].src === 'seen' && p.src !== 'seen') { plays[i] = p; added++; }
  }
  plays.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  return { plays: plays.slice(-MAX_PER_MONTH), added };
}

// ── summary ────────────────────────────────────────────────────────────

export function buildSummary(plays, meta = {}) {
  const { filesRead = 0, rowsRead = 0, skipped = {} } = meta;
  const sorted = [...plays].sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  let totalMs = 0;
  const artistCounts = new Map();
  const trackCounts = new Map();
  const perYear = new Map();
  for (const p of sorted) {
    totalMs += p.ms ?? 0;
    artistCounts.set(p.a, (artistCounts.get(p.a) ?? 0) + 1);
    const cur = trackCounts.get(p.id) ?? { t: p.t, a: p.a, plays: 0 };
    cur.plays++;
    trackCounts.set(p.id, cur);
    const year = p.at.slice(0, 4);
    perYear.set(year, (perYear.get(year) ?? 0) + 1);
  }
  const topArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, plays2]) => ({ name, plays: plays2 }));
  const topTracks = [...trackCounts.entries()]
    .sort((a, b) => b[1].plays - a[1].plays).slice(0, 15)
    .map(([id, v]) => ({ id, t: v.t, a: v.a, plays: v.plays }));
  const playsPerYear = Object.fromEntries([...perYear.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
  return {
    filesRead,
    rowsRead,
    rowsKept: sorted.length,
    skipped,
    dateRange: { from: sorted[0]?.at ?? null, to: sorted[sorted.length - 1]?.at ?? null },
    totalHours: +(totalMs / 3600000).toFixed(1),
    topArtists,
    topTracks,
    playsPerYear,
  };
}

export function formatSummary(summary) {
  const lines = [];
  lines.push(`Files read:  ${summary.filesRead}`);
  lines.push(`Rows read:   ${summary.rowsRead}`);
  lines.push(`Rows kept:   ${summary.rowsKept}`);
  lines.push('Skipped:');
  const reasons = Object.entries(summary.skipped).filter(([, n]) => n);
  if (reasons.length === 0) lines.push('  (none)');
  for (const [reason, n] of reasons) lines.push(`  ${reason.padEnd(16)} ${n}`);
  lines.push(`Date range:  ${summary.dateRange.from ?? '—'} .. ${summary.dateRange.to ?? '—'}`);
  lines.push(`Total hours: ${summary.totalHours}`);
  lines.push('Top 15 artists:');
  if (summary.topArtists.length === 0) lines.push('  (none)');
  summary.topArtists.forEach((a, i) => lines.push(`  ${i + 1}. ${a.name} — ${a.plays}`));
  lines.push('Top 15 tracks:');
  if (summary.topTracks.length === 0) lines.push('  (none)');
  summary.topTracks.forEach((t, i) => lines.push(`  ${i + 1}. ${t.t} — ${t.a} — ${t.plays}`));
  lines.push('Plays per year:');
  const years = Object.entries(summary.playsPerYear);
  if (years.length === 0) lines.push('  (none)');
  for (const [year, n] of years) lines.push(`  ${year}: ${n}`);
  if (summary.months?.length) {
    lines.push('Months:');
    for (const m of summary.months) {
      const bits = [];
      if (m.droppedByCap) bits.push(`cap dropped ${m.droppedByCap}`);
      if (m.mergedAdded != null) bits.push(`merge added ${m.mergedAdded}`);
      lines.push(`  ${m.month}: ${m.rows} row(s)${bits.length ? ` (${bits.join(', ')})` : ''}`);
    }
  }
  return lines.join('\n');
}

/** Printed only — this script never runs wrangler itself. */
export function formatWranglerCommands(months, { outDir = './out', namespaceBinding = 'USERS' } = {}) {
  const lines = [];
  lines.push('');
  lines.push('== wrangler commands (PRINTED ONLY — this script does not run them) ==');
  lines.push(`Uploading REPLACES that month's document in the ${namespaceBinding} namespace whole.`);
  lines.push("If the live log already has rows for an overlapping month, download that month first");
  lines.push('and re-run this script with --merge-with <dir> before uploading, or you will delete');
  lines.push('existing live plays for that month.');
  lines.push('Look up the namespace id in wrangler.toml, or: npx wrangler kv namespace list');
  lines.push('');
  for (const m of months) {
    const key = `station:v1:broadcast:log:${m.month}`;
    lines.push(`  # ${m.month} — fetch the current live document before merging:`);
    lines.push(`  npx wrangler kv key get "${key}" --namespace-id=<${namespaceBinding}_NAMESPACE_ID> --remote > <merge-dir>/station-log-${m.month}.json`);
    lines.push(`  # ${m.month} — upload (REPLACES the whole month):`);
    lines.push(`  npx wrangler kv key put "${key}" --path="${outDir}/station-log-${m.month}.json" --namespace-id=<${namespaceBinding}_NAMESPACE_ID> --remote`);
  }
  return lines.join('\n');
}

// ── file discovery ─────────────────────────────────────────────────────

export function collectJsonFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

// ── orchestration ──────────────────────────────────────────────────────

export async function run(options) {
  const { inputDir, out, minMs = DEFAULT_MIN_MS, from, to, dryRun = false, mergeWith } = options;
  if (!inputDir) throw new Error('An export directory is required.');
  if (!dryRun && !out) throw new Error('--out <dir> is required unless --dry-run is set.');

  const files = collectJsonFiles(inputDir);
  let filesRead = 0;
  let rowsRead = 0;
  const skipped = {
    podcast: 0, incognito: 0, tooShort: 0, missingFields: 0,
    outOfRange: 0, duplicate: 0, capped: 0, unrecognizedFile: 0,
  };
  let plays = [];

  for (const file of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { skipped.unrecognizedFile++; continue; }
    if (!Array.isArray(data) || data.length === 0 || !detectRecordFormat(data[0])) { skipped.unrecognizedFile++; continue; }
    filesRead++;
    for (const record of data) {
      rowsRead++;
      const { play, skip } = recordToPlay(record, { minMs });
      if (skip) { skipped[skip] = (skipped[skip] ?? 0) + 1; continue; }
      plays.push(play);
    }
  }

  plays.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));

  if (from || to) {
    const filtered = filterByRange(plays, { from, to });
    skipped.outOfRange += filtered.outOfRange;
    plays = filtered.plays;
  }

  const deduped = dedupePlays(plays);
  skipped.duplicate += deduped.duplicates;
  plays = deduped.plays;

  const byMonth = groupByMonth(plays);
  const months = [];
  const finalByMonth = new Map();
  for (const month of [...byMonth.keys()].sort()) {
    let rows = byMonth.get(month);
    let mergedAdded = null;
    if (mergeWith) {
      const existingPath = path.join(mergeWith, `station-log-${month}.json`);
      let existing = [];
      if (fs.existsSync(existingPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
          if (Array.isArray(parsed)) existing = parsed;
        } catch { /* treat an unreadable existing file as "nothing to merge" */ }
      }
      const merged = mergePlaysLikeStation(existing, rows);
      rows = merged.plays;
      mergedAdded = merged.added;
    }
    const capped = capMonthRows(rows, MAX_PER_MONTH);
    if (capped.dropped) {
      skipped.capped += capped.dropped;
      console.warn(`[import-spotify-history] ${month}: cap of ${MAX_PER_MONTH} dropped ${capped.dropped} older row(s)`);
    }
    finalByMonth.set(month, capped.rows);
    months.push({ month, rows: capped.rows.length, droppedByCap: capped.dropped, mergedAdded });
  }

  const allFinalPlays = [...finalByMonth.values()].flat();
  const summary = buildSummary(allFinalPlays, { filesRead, rowsRead, skipped });
  summary.months = months;

  if (!dryRun) {
    fs.mkdirSync(out, { recursive: true });
    for (const [month, rows] of finalByMonth) {
      fs.writeFileSync(path.join(out, `station-log-${month}.json`), `${JSON.stringify(rows, null, 2)}\n`);
    }
    fs.writeFileSync(path.join(out, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  }

  return summary;
}

// ── CLI ────────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = { minMs: DEFAULT_MIN_MS };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--min-ms') args.minMs = Number(argv[++i]);
    else if (a === '--from') args.from = argv[++i];
    else if (a === '--to') args.to = argv[++i];
    else if (a === '--merge-with') args.mergeWith = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else positional.push(a);
  }
  [args.inputDir] = positional;
  return args;
}

const USAGE = `Usage: node scripts/import-spotify-history.mjs <export-dir> --out <dir> [options]

  --out <dir>           write station-log-YYYY-MM.json + summary.json here
                         (required unless --dry-run)
  --min-ms <n>           skip plays shorter than this (default 30000)
  --from <YYYY-MM-DD>    drop plays that started before this date (UTC)
  --to <YYYY-MM-DD>      drop plays that started after this date (UTC)
  --merge-with <dir>     merge with previously downloaded month documents
                         using the same rule the live KV log uses
  --dry-run              print the summary; write nothing

See docs/setup/spotify-history-import.md.`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.inputDir) {
    console.log(USAGE);
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  if (!args.dryRun && !args.out) {
    console.error('Error: --out <dir> is required unless --dry-run is set.\n');
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  const summary = await run(args);
  console.log(formatSummary(summary));
  console.log(args.dryRun
    ? '\n(dry run — nothing was written; the play log at /station is public, so review this before uploading anything)'
    : `\nWrote ${summary.months.length} month file(s) + summary.json to ${args.out}`);
  console.log(formatWranglerCommands(summary.months, { outDir: args.out ?? './out' }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((err) => { console.error(err); process.exitCode = 1; });
}
