#!/usr/bin/env node
/**
 * fetch-burnoff — pulls twelve months of hourly observed sky condition for
 * KLAX from the Iowa Environmental Mesonet ASOS archive and writes
 * src/lib/burnoff-record.json.
 *
 *   node scripts/fetch-burnoff.mjs
 *
 * Run this by hand. The record is committed. The build must never touch the
 * network — same fetch-and-commit shape as scripts/fetch-market.mjs.
 *
 * Why KLAX and not a weather model: the marine layer is a 300–600 m coastal
 * stratus deck sitting on maybe fifteen kilometres of coastline. Reanalysis
 * grids (ERA5 and friends) are ~25 km cells that snap inland of the shore and
 * do not resolve it at all — pulled for peak June Gloom they report clear
 * mornings clouding over by noon, which is the exact inverse of what happens
 * here. KLAX is a human-and-instrument station 4.7 km up the coast reporting
 * an actual observed ceiling every hour at :53. Observation, not model.
 *
 * What this script does NOT do: decide when the sky opened. It records what
 * was over the airport, hour by hour, and stops. The rule that turns those
 * hours into a burn-off time lives in src/lib/burnoff.ts, is applied at read
 * time, and is printed on /marine-layer so you can argue with it.
 *
 * Output shape — one entry per local date:
 *
 *   { "date": "2026-06-10", "obs": [[353, 900], [413, 1200], [473, null]] }
 *
 * Each observation is [minutesAfterLocalMidnight, lowestCeilingFeet]. The
 * second value is the lowest BKN / OVC / VV layer reported at that hour, in
 * feet above ground, or null when no such layer was reported (FEW and SCT are
 * not ceilings — you can see sky through them). Hours the station did not
 * report are simply absent. No height threshold is applied here: a 6,000 ft
 * overcast is recorded as 6,000 ft and the rule decides whether that counts.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../src/lib/burnoff-record.json');

const STATION = 'LAX';
const TZ = 'America/Los_Angeles';

/** Covers that make a ceiling. FEW and SCT do not. VV is indefinite — fog on the deck. */
const DECK_COVERS = new Set(['BKN', 'OVC', 'VV']);

/** Only the morning matters. 04:00 to 14:00 local, in minutes after midnight. */
const WINDOW_START_MINUTE = 4 * 60;
const WINDOW_END_MINUTE = 14 * 60;

const MONTHS_BACK = 12;

function endpoint(start, end) {
  const params = new URLSearchParams({
    station: STATION,
    year1: String(start.getUTCFullYear()),
    month1: String(start.getUTCMonth() + 1),
    day1: String(start.getUTCDate()),
    year2: String(end.getUTCFullYear()),
    month2: String(end.getUTCMonth() + 1),
    day2: String(end.getUTCDate()),
    tz: TZ,
    format: 'onlycomma',
    latlon: 'no',
    report_type: '3',
  });
  // URLSearchParams cannot express repeated `data=` keys cleanly alongside the
  // rest, so append them by hand in the documented order.
  const data = ['skyc1', 'skyc2', 'skyc3', 'skyc4', 'skyl1', 'skyl2', 'skyl3', 'skyl4']
    .map((d) => `data=${d}`)
    .join('&');
  return `https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?${data}&${params.toString()}`;
}

/**
 * Lowest ceiling in feet from one CSV row, or null if the sky had no deck.
 *
 * skycN pairs with skylN by index. ASOS reports layers bottom-up regardless of
 * cover, so a broken deck often lands in skyc2 or skyc3 with a few or scattered
 * layer beneath it in skyc1 — reading skyc1 alone misses the ceiling entirely.
 */
function lowestCeilingFeet(covers, heights) {
  let lowest = null;
  for (let i = 0; i < covers.length; i += 1) {
    const cover = (covers[i] || '').trim().toUpperCase();
    if (!DECK_COVERS.has(cover)) continue;
    const feet = Number.parseFloat(heights[i]);
    if (!Number.isFinite(feet)) continue;
    if (lowest === null || feet < lowest) lowest = feet;
  }
  return lowest;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Mesonet rate-limits generously but firmly — it will hand back a 429 if you
 * ask for thirteen months in thirteen seconds. Back off and wait; this script
 * runs by hand, once, and has nowhere to be.
 */
async function fetchChunk(start, end, attempt = 1) {
  const url = endpoint(start, end);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'pointcast.xyz /marine-layer burn-off record (one-off backfill)' },
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 6) throw new Error(`mesonet ${res.status} after ${attempt} attempts`);
    const wait = 15_000 * attempt;
    process.stdout.write(`(${res.status}, waiting ${wait / 1000}s) `);
    await sleep(wait);
    return fetchChunk(start, end, attempt + 1);
  }
  if (!res.ok) throw new Error(`mesonet ${res.status} ${res.statusText} for ${start.toISOString().slice(0, 10)}`);
  const text = await res.text();
  const lines = text.trim().split('\n');
  const header = lines.shift();
  if (!header || !header.startsWith('station,valid')) {
    throw new Error(`unexpected header: ${String(header).slice(0, 120)}`);
  }
  return lines;
}

function addMonths(date, n) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, date.getUTCDate()));
}

async function main() {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = addMonths(end, -MONTHS_BACK);

  /** @type {Map<string, Array<[number, number|null]>>} */
  const byDate = new Map();
  let rowsSeen = 0;
  let rowsKept = 0;

  let cursor = start;
  while (cursor < end) {
    const chunkEnd = addMonths(cursor, 1) > end ? end : addMonths(cursor, 1);
    process.stdout.write(`  ${cursor.toISOString().slice(0, 10)} → ${chunkEnd.toISOString().slice(0, 10)} `);
    const lines = await fetchChunk(cursor, chunkEnd);
    process.stdout.write(`${lines.length} rows\n`);

    for (const line of lines) {
      const cols = line.split(',');
      if (cols.length < 10) continue;
      rowsSeen += 1;
      const valid = cols[1];
      const [datePart, timePart] = valid.trim().split(' ');
      if (!datePart || !timePart) continue;
      const [hh, mm] = timePart.split(':').map(Number);
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue;
      const minute = hh * 60 + mm;
      if (minute < WINDOW_START_MINUTE || minute > WINDOW_END_MINUTE) continue;

      const ceiling = lowestCeilingFeet(cols.slice(2, 6), cols.slice(6, 10));
      const list = byDate.get(datePart) || [];
      // Keep one observation per hour — the first the station filed.
      if (!list.some(([m]) => Math.floor(m / 60) === hh)) {
        list.push([minute, ceiling === null ? null : Math.round(ceiling)]);
        rowsKept += 1;
      }
      byDate.set(datePart, list);
    }

    cursor = chunkEnd;
    await sleep(12_000);
  }

  const days = [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, obs]) => ({ date, obs: obs.sort((a, b) => a[0] - b[0]) }));

  const record = {
    station: STATION,
    stationName: 'Los Angeles International — KLAX',
    stationNote: 'ASOS, 4.7 km up the coast from El Segundo. Hourly routine reports at :53.',
    source: 'Iowa Environmental Mesonet ASOS archive — mesonet.agron.iastate.edu',
    timezone: TZ,
    deckCovers: [...DECK_COVERS],
    windowStartMinute: WINDOW_START_MINUTE,
    windowEndMinute: WINDOW_END_MINUTE,
    units: 'obs = [minutesAfterLocalMidnight, lowestBknOvcVvCeilingFeet | null]',
    fetchedAt: new Date().toISOString(),
    firstDate: days.length ? days[0].date : null,
    lastDate: days.length ? days[days.length - 1].date : null,
    dayCount: days.length,
    days,
  };

  // Refuse to write a pretty lie. If a future run comes back thin, or comes
  // back saying June mornings were clear, something upstream changed and the
  // right move is to look at it — not to ship a chart that flatters the coast.
  const problems = [];
  if (days.length < 300 || days.length > 400) {
    problems.push(`expected ~365 days, got ${days.length}`);
  }
  const junes = days.filter((d) => d.date.slice(5, 7) === '06');
  if (junes.length >= 20) {
    const withDeck = junes.filter((d) => d.obs.some(([, c]) => c !== null && c < 3000)).length;
    const share = withDeck / junes.length;
    console.log(`  june sanity: ${withDeck}/${junes.length} days had a deck below 3,000 ft`);
    if (share < 0.6) {
      problems.push(
        `only ${Math.round(share * 100)}% of June mornings show a low deck — June Gloom is ` +
          'not optional here, so this reads like the wrong station or the wrong columns',
      );
    }
  }
  if (problems.length) {
    console.error('\n  REFUSING TO WRITE:');
    for (const p of problems) console.error(`   · ${p}`);
    process.exit(1);
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(record, null, 0)}\n`, 'utf8');

  console.log(`\n  rows seen ${rowsSeen} · kept ${rowsKept} · days ${days.length}`);
  console.log(`  ${record.firstDate} → ${record.lastDate}`);
  console.log(`  wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
