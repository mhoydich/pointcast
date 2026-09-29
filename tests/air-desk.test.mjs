import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import {
  AGENT_BADGES, AGENT_ROW_COLUMNS, AIRNOW_PAGE, CALL_ID_RE, DESK_REFUSALS, DESK_SPOT, FEED_IDS, GAP_REASONS, LOG_KINDS, PASS_REASONS,
  STALE_MIN, TEMPLATE_VARS, agentCard, agentIpHash, agentMornings, agentPidHash, agentReading, agentRowOf, aqiBucket, askRefusal,
  beliefParts, callHead, callRowOf, callsLine, callStatus, callView, canPass, checkedStamps, clockworkStamps, deskByline, deskFact, deskFactsByFeed, deskLog,
  deskTemplate, deskText, editionSkyLine, editionTideLine, feedSourceUrl, feedValue, fill, fillParts, isStale, judgeRow, liveCall, logDays, nextTides, noHumanCheckLine, onTimeCut, onTimeLine,
  onTimeOf, parseDeskPost, passRelay, recordLine, safeSourceUrl, shiftView, shouldRun, skyBucket, sourceHostOf, swellBucket, tideValue,
  validateDetail,
} from '../functions/_lib/air-desk.mjs';
import { confirmable, hash16, isDeskKind, isFactKind, kindOf, kindRole, newAirId, spotOf } from '../functions/_lib/air-kinds.mjs';
import { isoSec, laDate } from '../functions/_lib/air-reading.mjs';
import { laWallToMs } from '../functions/_lib/air-assign.mjs';

// Early Shift + the Desk, group F (docs/plans/2026-09-28-early-shift-desk-spec.md
// §3, §4): the config, migration 0025, and the pure rules every other group
// builds on — buckets, details, safe URLs, agent rows, the judge, Clockwork
// and On time, shouldRun across DST, calls, templates and the Desk Log.

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const la = (day, hhmm) => laWallToMs(day, hhmm);
const T0 = la('2026-10-02', '06:02'); // Fri 6:02 AM in El Segundo
const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const SKY = { obsAt: isoSec(la('2026-10-02', '05:53')), visMi: 3, ceilFt: 800, wx: 'BR' };
const SIGN_URL = 'https://www.citymb.info/departments/parks-and-recreation/tennis';

/** A human on-site report row, as the judge and reading read it. */
const person = (over = {}) => ({ id: newAirId(), spot: 'beach', kind: 'fog', value: 'hazy', observed_at: T0 + 30 * MIN, onsite: 1, status: 'ok', source: 'page', pid_hash: 'feedfacefeedface', ip_hash: 'cafebabecafebabe', ...over });
const skyRow = async (over = {}) => (await agentRowOf(config, { agent: 'cc', feed: 'sky', detail: SKY, observedAt: Date.parse(SKY.obsAt), now: T0, ...over })).row;

/* ---------- config ---------- */

test('config: six agents, Frog is Noun 779, keepers as the spec sets them, five feeds in order', () => {
  const { desk } = config;
  assert.deepEqual(desk.agents, [
    { call: 'cc', name: 'cc', noun: null },
    { call: 'sol', name: 'Sol', noun: null },
    { call: 'terra', name: 'Terra', noun: null },
    { call: 'luna', name: 'Luna', noun: null },
    { call: 'manus', name: 'Manus', noun: null },
    { call: 'frog', name: 'Frog', noun: 779 },
  ]);
  assert.deepEqual(desk.feeds.map((f) => [f.id, f.kind, f.keeper]), [
    ['sky', 'fog', 'cc'], ['tides', 'tide', 'sol'], ['swell', 'swell', 'sol'], ['sun', 'sun', 'frog'], ['air', 'aqi', 'frog'],
  ]);
  assert.deepEqual(desk.feeds.map((f) => f.id), FEED_IDS);
  assert.deepEqual(desk.feeds.filter((f) => f.needs).map((f) => [f.id, f.needs]), [['air', 'AIRNOW_API_KEY']]);
  for (const f of desk.feeds) {
    assert.deepEqual(Object.keys(f).filter((k) => k !== 'needs').sort(), ['id', 'keeper', 'kind', 'name', 'says'], `${f.id}: no free text`);
    assert.ok(desk.agents.some((a) => a.call === f.keeper), `${f.id} keeper is an agent`);
  }
  assert.equal(desk.onTimeBy, '06:15');
  assert.deepEqual(desk.calls, { perAgentPerDay: 5, openPerSpot: 1, expireHours: 48, maxPasses: 3 });
  for (const a of desk.agents) assert.ok(!config.spots.some((s) => s.id === a.call), `${a.call} is not a spot id`);
});

test('config: the beach gains four fact kinds behind fog; nobody can report or confirm one', () => {
  const beach = spotOf(config, 'beach');
  assert.deepEqual(Object.keys(beach.kinds), ['fog', 'tide', 'swell', 'sun', 'aqi']);
  assert.equal(kindRole(beach.kinds.fog), 'live', 'Sky reuses fog: the one feed people can check');
  const buckets = {
    tide: ['rising', 'falling'], swell: ['0-1', '1-2', '2-3', '3-5', '5+'], sun: ['times'],
    aqi: ['good', 'moderate', 'usg', 'unhealthy', 'very-unhealthy', 'hazardous'],
  };
  const decay = { tide: 1440, swell: 180, sun: 1440, aqi: 120 };
  for (const [kind, values] of Object.entries(buckets)) {
    const cfg = beach.kinds[kind];
    assert.equal(cfg.role, 'fact', kind);
    assert.ok(isFactKind(cfg) && !confirmable(cfg) && !isDeskKind(cfg), kind);
    assert.deepEqual(cfg.options.map((o) => o.v), values, kind);
    assert.equal(cfg.decayMin, decay[kind], kind);
    assert.ok(!values.includes('cant'), `${kind}: an agent never says "Can't say"`);
  }
  assert.ok(confirmable(beach.kinds.fog) && confirmable(kindOf(config, 'courts', 'parking')) && !confirmable(kindOf(config, 'courts', 'vibe')));
  for (const f of config.desk.feeds) assert.ok(kindOf(config, DESK_SPOT, f.kind), `${f.id} files beach.${f.kind}`);
  assert.equal(spotOf(config, 'town'), null, 'no town spot');
});

test('config: exactly three desk kinds, each a side kind with a 30-day decay, 3 points and Can\'t say last', () => {
  const desk = [];
  for (const s of config.spots) for (const [k, cfg] of Object.entries(s.kinds)) if (cfg.desk) desk.push([s.id, k, cfg]);
  assert.deepEqual(desk.map(([s, k, cfg]) => [s, k, cfg.question, cfg.options.map((o) => o.v)]), [
    ['courts', 'sign', 'Which days does the posted sign allow public play?', ['weekends', 'daily', 'other', 'cant']],
    ['el-segundo', 'lights', 'Does the court have lights?', ['lights', 'none', 'cant']],
    ['manhattan-heights', 'closes', 'What closing time is on the posted sign?', ['20:00', '21:00', 'other', 'cant']],
  ]);
  for (const [s, k, cfg] of desk) {
    assert.ok(isDeskKind(cfg), `${s}.${k}`);
    assert.deepEqual([cfg.role, cfg.decayMin, cfg.points, cfg.payEvery], ['side', 43200, 3, undefined], `${s}.${k}`);
    assert.ok(cfg.options.length >= 3 && cfg.options.length <= 4, `${s}.${k}: 2–3 buckets plus Can't say`);
    assert.equal(cfg.options.at(-1).v, 'cant');
    assert.deepEqual(cfg.extras, []);
    assert.ok(Object.keys(spotOf(config, s).kinds).indexOf(k) >= 3, `${s}.${k} trails wait, parking, vibe`);
    const asked = config.spots.find((x) => x.id === s);
    assert.equal(asked.channel, 'CRT');
  }
  assert.equal(kindOf(config, 'courts', 'sign').options[0].label, 'Weekends and school breaks');
  assert.equal(isDeskKind({ desk: true, role: 'rating' }), false, 'a desk kind is a side kind');
});

test('src/lib/air.ts: the Desk contract other groups build against', async () => {
  const src = await read('src/lib/air.ts');
  assert.match(src, /export type AirRole = 'live' \| 'side' \| 'rating' \| 'fact';/);
  assert.match(src, /desk\?: boolean;/);
  assert.match(src, /export type AirConfig = \{[^}]*desk: AirDesk \};/);
  for (const name of [
    'AirDeskAgent', 'AirDeskFeedId', 'AirDeskFeed', 'AirDeskTemplates', 'AirDesk', 'GapReason', 'PassReason', 'CallStatus', 'Verdict',
    'SkyDetail', 'TideEvent', 'TidesDetail', 'SwellDetail', 'SunDetail', 'AirDetail', 'DeskDetail', 'DeskFact', 'DeskReading', 'DeskFacts',
    'CallRelay', 'CallView', 'ShiftFeedView', 'ShiftDay', 'ShiftView', 'AgentBadge', 'AgentStamp', 'AgentCard', 'DeskLogKind', 'DeskLogLine', 'DeskPayload',
  ]) assert.match(src, new RegExp(`export type ${name} = `), name);
  for (const name of ['AIR_DESK', 'DESK_URL', 'agentUrl', 'agentMark']) assert.match(src, new RegExp(`export const ${name}\\b`), name);
  for (const name of ['deskAgent', 'deskFeed', 'agentPortrait', 'agentPaths', 'deskKinds']) assert.match(src, new RegExp(`export function ${name}\\(`), name);
  assert.match(src, /type DeskFact = \{\s*feed: AirDeskFeedId; agent: string; value: string; label: string; detail: DeskDetail;\s*filedAt: string; observedAt: string; byline: string; sourceUrl: string; bars: number;\s*\};/);
  assert.match(src, /export type DeskReading = DeskFact & \{ reportId: string; liveUntil: string \};/);
  assert.match(src, /export type DeskLogLine = \{ at: string; kind: DeskLogKind; agent: string; spot: string; text: string \};/);
  assert.match(src, /export type DeskPayload = \{ calls: CallView\[\]; shift: ShiftView; log: DeskLogLine\[\]; nightEditor: null; serverTime: string \};/);
  assert.match(src, /nightEditor: null;/);
  assert.doesNotMatch(src, /pid_hash|ip_hash/);
});

/* ---------- buckets ---------- */

test('skyBucket: under 1 mi or FG is none; under 5 mi, BR, HZ or a ceiling under 1000 ft is hazy; else clear', () => {
  assert.equal(skyBucket({ visMi: 0.5 }), 'none');
  assert.equal(skyBucket({ visMi: 0.99, wx: null, ceilFt: 5000 }), 'none');
  assert.equal(skyBucket({ visMi: 10, wx: 'FG' }), 'none', 'FG at the field');
  assert.equal(skyBucket({ visMi: 6, wx: 'MIFG' }), 'none', 'shallow fog is still FG');
  assert.equal(skyBucket({ visMi: 10, wx: 'VCFG' }), 'clear', 'fog in the vicinity is not at the field');
  assert.equal(skyBucket({ visMi: 1 }), 'hazy');
  assert.equal(skyBucket({ visMi: 4.99 }), 'hazy');
  assert.equal(skyBucket({ visMi: 10, wx: 'BR' }), 'hazy');
  assert.equal(skyBucket({ visMi: 10, wx: '-DZ HZ' }), 'hazy');
  assert.equal(skyBucket({ visMi: 10, ceilFt: 900 }), 'hazy', 'a low deck');
  assert.equal(skyBucket({ visMi: 10, ceilFt: 1000 }), 'clear', '1000 ft is not under 1000');
  assert.equal(skyBucket({ visMi: 5 }), 'clear');
  assert.equal(skyBucket({ visMi: 10, wx: '-DZ' }), 'clear', 'drizzle alone is not haze');
  assert.equal(skyBucket({ visMi: '10+' }), null, 'the Worker reads "10+" as 10; a string is a shape gap');
  assert.equal(skyBucket({ visMi: null }), null);
  assert.equal(skyBucket({ visMi: Number.NaN }), null);
  assert.equal(skyBucket({ visMi: -1 }), null);
  assert.equal(skyBucket(), null);
});

test('swellBucket and aqiBucket: every edge, and nothing invented from junk', () => {
  const swell = [[0, '0-1'], [0.99, '0-1'], [1, '1-2'], [1.99, '1-2'], [2, '2-3'], [2.99, '2-3'], [3, '3-5'], [4.99, '3-5'], [5, '5+'], [12.5, '5+']];
  for (const [ft, b] of swell) assert.equal(swellBucket(ft), b, `${ft} ft`);
  for (const bad of [-0.1, Number.NaN, Infinity, null, '2', undefined]) assert.equal(swellBucket(bad), null, String(bad));
  const aqi = [[0, 'good'], [50, 'good'], [51, 'moderate'], [100, 'moderate'], [101, 'usg'], [150, 'usg'], [151, 'unhealthy'], [200, 'unhealthy'],
    [201, 'very-unhealthy'], [300, 'very-unhealthy'], [301, 'hazardous'], [512, 'hazardous']];
  for (const [n, b] of aqi) assert.equal(aqiBucket(n), b, `AQI ${n}`);
  for (const bad of [-1, 42.5, Number.NaN, '42', null]) assert.equal(aqiBucket(bad), null, `AirNow's -1 and junk: ${bad}`);
  for (const b of new Set(aqi.map(([, v]) => v))) assert.ok(kindOf(config, 'beach', 'aqi').options.some((o) => o.v === b), b);
  for (const b of new Set(swell.map(([, v]) => v))) assert.ok(kindOf(config, 'beach', 'swell').options.some((o) => o.v === b), b);
});

test('tides: the next four events after now, oldest first; rising toward a high, falling toward a low', () => {
  const events = [
    { type: 'L', at: '2026-10-02T08:10:00Z', ft: 1.2 },
    { type: 'H', at: Date.parse('2026-10-02T14:12:00Z'), ft: 5.1 },
    { type: 'L', at: '2026-10-02T20:40:00Z', ft: 0.4 },
    { type: 'X', at: '2026-10-02T21:00:00Z', ft: 1 },
    { type: 'H', at: '2026-10-03T02:50:00Z', ft: 4.0 },
    { type: 'L', at: '2026-10-03T08:10:00Z', ft: 1.9 },
    { type: 'H', at: '2026-10-03T14:50:00Z', ft: 5.3 },
  ];
  const next = nextTides(events, T0);
  assert.deepEqual(next.map((e) => [e.type, e.at]), [
    ['H', '2026-10-02T14:12:00Z'], ['L', '2026-10-02T20:40:00Z'], ['H', '2026-10-03T02:50:00Z'], ['L', '2026-10-03T08:10:00Z'],
  ]);
  assert.equal(tideValue(events, T0), 'rising');
  assert.equal(tideValue(events, Date.parse('2026-10-02T15:00:00Z')), 'falling');
  assert.equal(tideValue(events, Date.parse('2026-10-02T14:12:00Z')), 'falling', 'an event exactly now is behind us');
  assert.equal(tideValue([], T0), null);
  assert.deepEqual(nextTides('nope', T0), []);
});

/* ---------- details ---------- */

test('validateDetail: exact keys and ranges per feed; a copy in a fixed key order; anything else is a shape gap', () => {
  const ok = {
    sky: SKY,
    tides: { next: [{ type: 'H', at: '2026-10-02T14:12:00Z', ft: 5.1 }, { type: 'L', at: '2026-10-02T20:40:00Z', ft: -0.2 }] },
    swell: { ft: 3.9, periodS: 13, dirDeg: 160, waterF: 73.6, obsAt: '2026-10-02T12:40:00Z' },
    sun: { sunrise: '2026-10-02T13:48:00Z', sunset: '2026-10-03T01:32:00Z' },
    air: { aqi: 42, param: 'PM2.5', obsAt: '2026-10-02T12:00:00Z' },
  };
  for (const [feed, d] of Object.entries(ok)) {
    const v = validateDetail(feed, d);
    assert.deepEqual(v, { detail: d }, feed);
    assert.notEqual(v.detail, d, `${feed}: a copy, not the caller's object`);
    assert.equal(validateDetail(feed, { ...d, extra: 1 }).reason, 'shape', `${feed}: an extra key`);
  }
  assert.deepEqual(validateDetail('sky', { wx: null, ceilFt: null, visMi: 10, obsAt: SKY.obsAt }).detail && Object.keys(validateDetail('sky', { wx: null, ceilFt: null, visMi: 10, obsAt: SKY.obsAt }).detail), ['obsAt', 'visMi', 'ceilFt', 'wx']);
  const bad = [
    ['sky', { ...SKY, visMi: '10+' }], ['sky', { ...SKY, visMi: Number.NaN }], ['sky', { ...SKY, ceilFt: 800.5 }], ['sky', { ...SKY, wx: 'fog <b>' }],
    ['sky', { ...SKY, obsAt: '2026-10-02T12:53:00.000Z' }], ['sky', { ...SKY, obsAt: '2026-02-30T12:00:00Z' }], ['sky', null], ['sky', []],
    ['tides', { next: [] }], ['tides', { next: Array(5).fill({ type: 'H', at: '2026-10-02T14:12:00Z', ft: 1 }) }],
    ['tides', { next: [{ type: 'H', at: '2026-10-02T14:12:00Z', ft: 1 }, { type: 'L', at: '2026-10-02T14:12:00Z', ft: 0 }] }],
    ['tides', { next: [{ type: 'high', at: '2026-10-02T14:12:00Z', ft: 1 }] }], ['tides', { next: [{ type: 'H', at: '2026-10-02T14:12:00Z', ft: 99 }] }],
    ['swell', { ...ok.swell, ft: -1 }], ['swell', { ...ok.swell, dirDeg: 160.5 }], ['swell', { ...ok.swell, waterF: 999 }], ['swell', { ...ok.swell, periodS: '13' }],
    ['sun', { sunrise: ok.sun.sunset, sunset: ok.sun.sunrise }], ['sun', { sunrise: '2026-10-02T13:48:00Z', sunset: '2026-10-04T01:32:00Z' }],
    ['air', { ...ok.air, aqi: -1 }], ['air', { ...ok.air, aqi: 42.5 }], ['air', { ...ok.air, param: 'PM 2.5; drop' }],
    ['town', {}],
  ];
  for (const [feed, d] of bad) assert.deepEqual(validateDetail(feed, d), { reason: 'shape' }, `${feed} ${JSON.stringify(d)}`);
  assert.equal(feedValue('sky', SKY, T0), 'hazy');
  assert.equal(feedValue('tides', ok.tides, T0), 'rising');
  assert.equal(feedValue('swell', ok.swell, T0), '3-5');
  assert.equal(feedValue('sun', ok.sun, T0), 'times');
  assert.equal(feedValue('air', ok.air, T0), 'good');
});

test('isStale: a METAR over 90 minutes, NDBC or AirNow over 3 hours; tides and sun never', () => {
  assert.deepEqual(STALE_MIN, { sky: 90, swell: 180, air: 180 });
  assert.equal(isStale('sky', T0 - 90 * MIN, T0), false, '90 minutes is the edge');
  assert.equal(isStale('sky', T0 - 91 * MIN, T0), true);
  assert.equal(isStale('swell', T0 - 181 * MIN, T0), true);
  assert.equal(isStale('air', T0 - 3 * HOUR, T0), false);
  assert.equal(isStale('tides', T0 - 10 * DAY, T0), false);
});

/* ---------- source URLs ---------- */

test('safeSourceUrl: https only, 300 characters, no userinfo, no port, a public host, no key or token params', () => {
  assert.equal(safeSourceUrl(SIGN_URL), SIGN_URL);
  assert.equal(safeSourceUrl('https://Example.org/a b'.replace(' ', '%20')), 'https://example.org/a%20b', 'normalized');
  const refused = [
    'http://www.citymb.info/', 'ftp://citymb.info/x', 'javascript:alert(1)', 'data:text/html,hi', '//citymb.info/x', 'citymb.info',
    'https://user:pw@citymb.info/', 'https://user@citymb.info/', 'https://citymb.info:8443/', 'https://localhost/x', 'https://api.localhost/x',
    'https://printer.local/', 'https://127.0.0.1/', 'https://10.0.0.8/x', 'https://[::1]/', 'https://intranet/', ' https://citymb.info/',
    'https://citymb.info/\nx', `https://citymb.info/${'a'.repeat(290)}`,
    'https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=33.9&longitude=-118.4&distance=25&API_KEY=abc',
    'https://x.org/?api_key=1', 'https://x.org/?apikey=1', 'https://x.org/?key=1', 'https://x.org/?token=1', 'https://x.org/?access_token=1',
    'https://x.org/?X-Amz-Signature=1', 'https://x.org/?sig=1', 'https://x.org/?client_secret=1', 'https://x.org/?password=1', 'https://x.org/?session=1',
    'https://x.org/?auth=1', 'https://x.org/?c=1&code=FRI7', 'https://x.org/#access_token=1', 'https://x.org/?jwt=1',
    null, 7, {}, '',
  ];
  for (const u of refused) assert.equal(safeSourceUrl(u), null, String(u));
  assert.equal(safeSourceUrl(`https://citymb.info/${'a'.repeat(280)}`)?.length, 300, '300 is the edge');
  assert.equal(sourceHostOf('https://www.citymb.info/x'), 'citymb.info');
  assert.equal(sourceHostOf('http://citymb.info/x'), null);
});

test('feedSourceUrl: every stored early-shift URL is safe, keyless, and Air is the public page', () => {
  for (const f of FEED_IDS) {
    const u = feedSourceUrl(f, T0);
    assert.equal(safeSourceUrl(u), u, f);
    assert.doesNotMatch(u, /key|token|airnowapi/i, f);
  }
  assert.equal(feedSourceUrl('air', T0), AIRNOW_PAGE);
  assert.equal(feedSourceUrl('swell', T0), 'https://www.ndbc.noaa.gov/data/realtime2/46221.txt');
  assert.equal(feedSourceUrl('sun', T0), 'https://gml.noaa.gov/grad/solcalc/');
  const tides = new URL(feedSourceUrl('tides', T0));
  assert.deepEqual(
    ['station', 'product', 'datum', 'interval', 'time_zone', 'begin_date'].map((k) => tides.searchParams.get(k)),
    ['9410660', 'predictions', 'MLLW', 'hilo', 'gmt', '20261002'],
  );
  assert.equal(feedSourceUrl('town', T0), null);
});

test('feedSourceUrl: sky is marine-oracle\'s awcUrl(3)', async () => {
  // marine-oracle.ts imports extensionless modules node cannot load bare; read its one-line awcUrl instead.
  const src = await read('src/lib/marine-oracle.ts');
  const m = src.match(/export const awcUrl = \(hours: number\) => `([^`]+)`;/);
  assert.ok(m, 'awcUrl is still the one-line template');
  assert.equal(feedSourceUrl('sky', T0), m[1].replace('${hours}', '3'));
});

/* ---------- agent rows ---------- */

test('agentRowOf: a feed row derives its value from the detail and carries the agent fingerprint', async () => {
  const row = await skyRow();
  assert.deepEqual(Object.keys(row), AGENT_ROW_COLUMNS);
  assert.deepEqual(
    { ...row, id: 'x', slot: 0 },
    {
      id: 'x', spot: 'beach', kind: 'fog', value: 'hazy', extras_json: JSON.stringify(SKY), schema_v: 2, observed_at: Date.parse(SKY.obsAt),
      day: '2026-10-02', slot: 0, pid_hash: await hash16('air:agent:v1:cc'), ip_hash: await hash16('air:agent:v1'), user_id: null, byline: 'cc',
      onsite: 0, geo: 0, status: 'ok', source: 'agent:cc', source_url: feedSourceUrl('sky', T0), created_at: T0, awarded_at: null,
    },
  );
  assert.match(row.id, /^ar_[0-9a-f]{20}$/);
  assert.equal(row.pid_hash, await agentPidHash('cc'));
  assert.equal(row.ip_hash, await agentIpHash());
  assert.notEqual(await agentPidHash('sol'), row.pid_hash, 'one fingerprint per call sign');
  const reason = async (over) => (await agentRowOf(config, { agent: 'cc', feed: 'sky', detail: SKY, observedAt: Date.parse(SKY.obsAt), now: T0, ...over })).reason;
  assert.equal(await reason({ agent: 'nobody' }), 'unknown-agent');
  assert.equal(await reason({ agent: 'sol' }), 'not-keeper', 'Sol does not keep Sky');
  assert.equal(await reason({ feed: 'town' }), 'unknown-feed');
  assert.equal(await reason({ detail: { ...SKY, visMi: 'lots' } }), 'shape');
  assert.equal(await reason({ value: 'clear' }), 'shape', 'a passed value must match the detail');
  assert.equal(await reason({ observedAt: T0 + 2 * MIN }), 'bad-observed-at');
  assert.equal(await reason({ observedAt: T0 - 120 * MIN }), 'stale', 'already past its decay');
  assert.equal(await reason({ sourceUrl: 'https://www.airnowapi.org/?API_KEY=x' }), 'bad-source-url');
  assert.equal(await reason({ now: String(T0) }), 'bad-observed-at');
  const air = await agentRowOf(config, { agent: 'frog', feed: 'air', detail: { aqi: 42, param: 'O3', obsAt: '2026-10-02T12:00:00Z' }, observedAt: Date.parse('2026-10-02T12:00:00Z'), now: T0 });
  assert.equal(air.row.source_url, AIRNOW_PAGE, 'the stored Air source is never the API URL');
  assert.equal(air.row.value, 'good');
});

test('agentRowOf: a call\'s belief is a desk-kind bucket with a safe URL, never "Can\'t say"', async () => {
  const { row } = await agentRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', value: 'weekends', sourceUrl: SIGN_URL, now: T0 });
  assert.deepEqual([row.spot, row.kind, row.value, row.extras_json, row.schema_v, row.observed_at, row.source, row.source_url, row.onsite, row.byline],
    ['courts', 'sign', 'weekends', '[]', 1, T0, 'agent:sol', SIGN_URL, 0, 'Sol']);
  const reason = async (over) => (await agentRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', value: 'weekends', sourceUrl: SIGN_URL, now: T0, ...over })).reason;
  assert.equal(await reason({ spot: 'confirm' }), 'bad-spot');
  assert.equal(await reason({ kind: 'wait', value: '0' }), 'not-a-desk-kind', 'live kinds are out: the receipt just answered them');
  assert.equal(await reason({ spot: 'beach', kind: 'tide', value: 'rising' }), 'not-a-desk-kind');
  assert.equal(await reason({ value: 'cant' }), 'bad-belief');
  assert.equal(await reason({ value: 'Weekends' }), 'bad-belief');
  assert.equal(await reason({ sourceUrl: 'http://citymb.info/' }), 'bad-source-url');
  assert.equal(await reason({ sourceUrl: null }), 'bad-source-url', 'no URL, no belief');
});

/* ---------- the judge ---------- */

test('judge: facts say no human check; the earliest on-site person decides checked or overruled', async () => {
  const row = await skyRow({ observedAt: T0, detail: { ...SKY, obsAt: isoSec(T0) } });
  const j = (humans = [], confirms = [], now = T0 + HOUR) => judgeRow(config, row, { humans, confirms, now });
  assert.deepEqual(j(), { verdict: 'pending', at: null, via: null });
  assert.deepEqual(j([], [], T0 + 120 * MIN), { verdict: 'unjudged', at: null, via: null }, 'the window closes at decayMin');
  const same = person({ observed_at: T0 + 30 * MIN });
  assert.deepEqual(j([same]), { verdict: 'checked', at: T0 + 30 * MIN, via: 'report' });
  assert.deepEqual(j([person({ value: 'clear' })]), { verdict: 'overruled', at: T0 + 30 * MIN, via: 'report' });
  // Skipped: Can't say, remote, flagged, an agent, another spot or kind, before the row, after its decay.
  const skipped = [
    person({ value: 'cant', observed_at: T0 + MIN }), person({ onsite: 0, value: 'clear', observed_at: T0 + MIN }),
    person({ status: 'flagged', value: 'clear', observed_at: T0 + MIN }), person({ source: 'agent:sol', value: 'clear', observed_at: T0 + MIN }),
    person({ spot: 'courts', kind: 'wait', value: '0', observed_at: T0 + MIN }), person({ kind: 'tide', value: 'rising', observed_at: T0 + MIN }),
    person({ value: 'clear', observed_at: T0 - MIN }), person({ value: 'clear', observed_at: T0 + 120 * MIN }),
  ];
  assert.deepEqual(j(skipped), { verdict: 'pending', at: null, via: null });
  assert.deepEqual(j([...skipped, same]), { verdict: 'checked', at: T0 + 30 * MIN, via: 'report' });
  const confirm = (verdict, at, over = {}) => ({ report_id: row.id, verdict, onsite: 1, at, ...over });
  assert.deepEqual(j([same], [confirm('changed', T0 + 20 * MIN)]), { verdict: 'overruled', at: T0 + 20 * MIN, via: 'confirm' }, 'the earlier one decides');
  assert.deepEqual(j([person({ value: 'none', observed_at: T0 + 10 * MIN })], [confirm('still', T0 + 20 * MIN)]).verdict, 'overruled');
  assert.deepEqual(j([], [confirm('still', T0 + 5 * MIN)]), { verdict: 'checked', at: T0 + 5 * MIN, via: 'confirm' });
  assert.deepEqual(j([], [confirm('still', T0 + 5 * MIN, { onsite: 0 }), confirm('cant', T0 + 6 * MIN), confirm('still', T0 + 7 * MIN, { report_id: 'ar_other' })]).verdict, 'pending');
  const tide = (await agentRowOf(config, { agent: 'sol', feed: 'tides', detail: { next: [{ type: 'H', at: '2026-10-02T14:12:00Z', ft: 5.1 }] }, now: T0 })).row;
  assert.deepEqual(judgeRow(config, tide, { humans: [person({ kind: 'tide', value: 'falling' })], now: T0 }), { verdict: 'no-check', at: null, via: null });
  assert.equal(judgeRow(config, same, { now: T0 }), null, 'a person\'s row is never judged');
  const belief = (await agentRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', value: 'weekends', sourceUrl: SIGN_URL, now: T0 })).row;
  const answer = person({ spot: 'courts', kind: 'sign', value: 'daily', observed_at: T0 + 26 * HOUR });
  assert.deepEqual(judgeRow(config, belief, { humans: [answer], now: T0 + 27 * HOUR }), { verdict: 'overruled', at: T0 + 26 * HOUR, via: 'report' });
  assert.equal(judgeRow(config, belief, { now: T0 + 29 * DAY }).verdict, 'pending', 'a desk kind waits its 30 days');
});

test('agentReading and deskFact: a person outranks the desk; expired, overruled and junk rows never show', async () => {
  const row = await skyRow({ observedAt: T0, detail: { ...SKY, obsAt: isoSec(T0) } });
  const none = { status: 'none' };
  const r = agentReading(config, { spot: 'beach', kind: 'fog', rows: [row], now: T0 + 10 * MIN, human: none });
  assert.deepEqual(r, {
    feed: 'sky', agent: 'cc', value: 'hazy', label: 'Hazy', detail: { ...SKY, obsAt: isoSec(T0) }, filedAt: isoSec(T0), observedAt: isoSec(T0),
    byline: 'cc read KLAX at 6:02', sourceUrl: feedSourceUrl('sky', T0), bars: 5, reportId: row.id, liveUntil: isoSec(T0 + 120 * MIN),
  });
  assert.equal(editionSkyLine(config, r), 'cc read KLAX at 6:02: hazy.', 'spec §4 edition line');
  assert.equal(editionSkyLine(config, null), null);
  assert.equal(agentReading(config, { spot: 'beach', kind: 'fog', rows: [row], now: T0 + 10 * MIN, human: { status: 'single' } }), null, 'a live person wins');
  assert.equal(agentReading(config, { spot: 'beach', kind: 'fog', rows: [row], now: T0 + 120 * MIN, human: none }), null, 'expired');
  const changed = [{ report_id: row.id, verdict: 'changed', onsite: 1, at: T0 + 5 * MIN }];
  assert.equal(agentReading(config, { spot: 'beach', kind: 'fog', rows: [row], confirms: changed, now: T0 + 10 * MIN, human: none }), null, 'overruled');
  assert.equal(agentReading(config, { spot: 'beach', kind: 'fog', rows: [row, person({ value: 'clear', observed_at: T0 + MIN })], now: T0 + 10 * MIN, human: none }), null);
  assert.equal(agentReading(config, { spot: 'courts', kind: 'wait', rows: [row], now: T0, human: none }), null, 'only a feed kind on the beach');
  const older = await skyRow({ observedAt: T0 - 30 * MIN, now: T0 - 25 * MIN, detail: { ...SKY, obsAt: isoSec(T0 - 30 * MIN), visMi: 10, ceilFt: null, wx: null } });
  assert.equal(agentReading(config, { spot: 'beach', kind: 'fog', rows: [older, row], now: T0 + MIN, human: none }).reportId, row.id, 'the newest agent row');
  for (const junk of [{ ...row, schema_v: 1 }, { ...row, extras_json: '{' }, { ...row, extras_json: '[]' }, { ...row, source_url: 'http://x.org/' }, { ...row, status: 'removed' }, { ...row, source: 'page' }]) {
    assert.equal(deskFact(config, junk, T0 + MIN), null, JSON.stringify(junk).slice(0, 60));
  }
});

test('deskFactsByFeed: the board\'s facts; tides are re-read at now and run out', async () => {
  const now = la('2026-10-02', '06:00');
  const tides = (await agentRowOf(config, { agent: 'sol', feed: 'tides', now, detail: { next: [
    { type: 'H', at: '2026-10-02T14:12:00Z', ft: 5.1 }, { type: 'L', at: '2026-10-02T20:40:00Z', ft: 0.4 },
    { type: 'H', at: '2026-10-03T02:50:00Z', ft: 4 }, { type: 'L', at: '2026-10-03T08:10:00Z', ft: 1.9 },
  ] } })).row;
  const swell = (await agentRowOf(config, { agent: 'sol', feed: 'swell', now, observedAt: now - 20 * MIN, detail: { ft: 2.3, periodS: 13, dirDeg: 160, waterF: 71.2, obsAt: isoSec(now - 20 * MIN) } })).row;
  const sun = (await agentRowOf(config, { agent: 'frog', feed: 'sun', now, detail: { sunrise: '2026-10-02T13:48:00Z', sunset: '2026-10-03T01:32:00Z' } })).row;
  const facts = deskFactsByFeed(config, [tides, swell, sun, person()], now + MIN);
  assert.deepEqual(Object.keys(facts), ['sky', 'tides', 'swell', 'sun', 'air']);
  assert.equal(facts.sky, null);
  assert.equal(facts.air, null, 'a gap is omitted');
  assert.deepEqual([facts.tides.value, facts.tides.label, facts.tides.detail.next.length, facts.tides.byline], ['rising', 'Rising', 4, 'Sol read NOAA at 6:00']);
  assert.deepEqual([facts.swell.value, facts.swell.label, facts.swell.byline], ['2-3', '2–3 ft', 'Sol read buoy 46221 at 6:00']);
  assert.deepEqual([facts.sun.value, facts.sun.agent, facts.sun.detail], ['times', 'frog', { sunrise: '2026-10-02T13:48:00Z', sunset: '2026-10-03T01:32:00Z' }]);
  assert.equal(editionTideLine(config, facts.tides), 'High tide 7:12 AM, low 1:40 PM (Sol, NOAA).', 'spec §4 edition line');
  assert.equal(editionTideLine(config, { ...facts.tides, detail: { next: facts.tides.detail.next.slice(0, 1) } }), 'High tide 7:12 AM (Sol, NOAA).');
  assert.equal(editionTideLine(config, facts.swell), null);
  const afternoon = deskFactsByFeed(config, [tides], Date.parse('2026-10-02T21:00:00Z')).tides;
  assert.deepEqual([afternoon.value, afternoon.detail.next.map((e) => e.type)], ['rising', ['H', 'L']], 'only events still ahead');
  assert.equal(deskFactsByFeed(config, [tides], Date.parse('2026-10-03T09:00:00Z')).tides, null, 'no event ahead');
});

/* ---------- shouldRun, On time and Clockwork ---------- */

test('shouldRun: exactly one of the 13:00Z and 14:00Z crons is 6 AM in LA, on 2026-11-01, 11-02, 03-08 and every day of a year', () => {
  const at = (day, h) => Date.parse(`${day}T${h}:00:00Z`);
  assert.deepEqual([shouldRun(at('2026-11-01', 13)), shouldRun(at('2026-11-01', 14))], [false, true], 'fall back: 13:00Z is 5 AM PST');
  assert.deepEqual([shouldRun(at('2026-11-02', 13)), shouldRun(at('2026-11-02', 14))], [false, true]);
  assert.deepEqual([shouldRun(at('2026-03-08', 13)), shouldRun(at('2026-03-08', 14))], [true, false], 'spring forward: 13:00Z is 6 AM PDT');
  assert.deepEqual([shouldRun(at('2026-03-07', 13)), shouldRun(at('2026-03-07', 14))], [false, true]);
  assert.deepEqual([shouldRun(at('2026-10-31', 13)), shouldRun(at('2026-10-31', 14))], [true, false]);
  assert.equal(shouldRun(at('2026-10-02', 13) + 59 * MIN), true, 'a late trigger inside the hour still runs');
  assert.equal(shouldRun(Number.NaN), false);
  let day = '2026-01-01';
  for (let i = 0; i < 400; i++, day = addDays(day, 1)) {
    const runs = [13, 14].filter((h) => shouldRun(at(day, h)));
    assert.equal(runs.length, 1, `${day}: ${runs}`);
    assert.equal(laDate(at(day, runs[0])), day);
  }
});

/** air_shift_feeds rows for cc (keeps Sky) from `from`, one per day: [day offset, 'HH:MM' | gap reason | null (no row)]. */
const ccShift = (from, plan) => plan.map((p, i) => [addDays(from, i), p]).filter(([, p]) => p !== null).map(([day, p]) => (/^\d\d:\d\d$/.test(p)
  ? { day, feed: 'sky', agent: 'cc', outcome: 'filed', reason: null, report_id: `ar_${day.replaceAll('-', '')}00000000`, at: la(day, p) }
  : { day, feed: 'sky', agent: 'cc', outcome: 'gap', reason: p, report_id: null, at: la(day, '06:00') }));

test('On time: mornings every non-blocked feed filed by 6:15, out of mornings with any non-blocked feed; a missed morning counts', () => {
  const rows = ccShift('2026-10-01', ['06:02', '06:15', '06:16', 'upstream', null, 'blocked', '06:01']);
  const now = la('2026-10-07', '06:16');
  const mornings = agentMornings(config, 'cc', rows, now);
  assert.deepEqual(mornings.map((m) => [m.day, m.feeds[0].outcome, m.feeds[0].reason, m.feeds[0].onTime]), [
    ['2026-10-01', 'filed', null, true], ['2026-10-02', 'filed', null, true], ['2026-10-03', 'filed', null, false],
    ['2026-10-04', 'gap', 'upstream', false], ['2026-10-05', 'gap', 'missed', false], ['2026-10-06', 'gap', 'blocked', false],
    ['2026-10-07', 'filed', null, true],
  ]);
  assert.deepEqual(onTimeOf(config, mornings, now), { filed: 3, mornings: 6 }, 'the blocked morning is not counted');
  assert.deepEqual(onTimeOf(config, mornings, la('2026-10-07', '06:10')), { filed: 2, mornings: 5 }, 'today counts once its 6:15 passes');
  const card = agentCard(config, { agent: 'cc', shift: rows, now });
  assert.equal(onTimeLine(config, card), 'Filed 3 of 6 mornings by 6:15.');
  // Frog keeps Sun and Air; Air blocked every morning never counts against it.
  const frog = ['2026-10-01', '2026-10-02'].flatMap((day, i) => [
    { day, feed: 'sun', agent: 'frog', outcome: 'filed', reason: null, report_id: `ar_sun${i}0000000000000`, at: la(day, '06:00') },
    { day, feed: 'air', agent: 'frog', outcome: 'gap', reason: 'blocked', report_id: null, at: la(day, '06:00') },
  ]);
  assert.deepEqual(agentCard(config, { agent: 'frog', shift: frog, now: la('2026-10-02', '07:00') }).onTime, { filed: 2, mornings: 2 });
  assert.deepEqual(agentCard(config, { agent: 'terra', shift: frog, now }).onTime, { filed: 0, mornings: 0 }, 'Terra keeps no feed');
  // The first morning of the fall-back: the cut is 6:15 PST (14:15Z).
  assert.equal(onTimeCut(config, '2026-11-01'), Date.parse('2026-11-01T14:15:00Z'));
  assert.equal(onTimeCut(config, '2026-10-31'), Date.parse('2026-10-31T13:15:00Z'));
  const dst = agentMornings(config, 'cc', ccShift('2026-11-01', ['06:05']), la('2026-11-01', '07:00'));
  assert.equal(dst[0].feeds[0].onTime, true);
  assert.equal(dst[0].feeds[0].at, '2026-11-01T14:05:00Z');
  // Only the shift's own window counts: a row stamped before 6 AM (a forced run after midnight) is never on time.
  const beforeSix = agentMornings(config, 'cc', ccShift('2026-10-05', ['00:30', '05:59', '06:00']), la('2026-10-07', '07:00'));
  assert.deepEqual(beforeSix.map((m) => m.feeds[0].onTime), [false, false, true]);
  assert.deepEqual(onTimeOf(config, beforeSix, la('2026-10-07', '07:00')), { filed: 1, mornings: 3 });
});

test('Clockwork: 7, 30 and 100 mornings running; dated the day reached; a break never takes one back', () => {
  const plan = [...Array(7).fill('06:02'), '06:30', ...Array(29).fill('06:01'), 'blocked', '06:01'];
  const rows = ccShift('2026-10-01', plan);
  const now = la(addDays('2026-10-01', plan.length - 1), '09:00');
  const mornings = agentMornings(config, 'cc', rows, now);
  assert.deepEqual(clockworkStamps(config, mornings, now), [{ badge: 'clockwork', level: 7, day: '2026-10-07' }], 'a late morning resets the run; the blocked-only morning breaks it (nothing filed)');
  const longer = ccShift('2026-10-01', [...Array(7).fill('06:02'), '06:30', ...Array(30).fill('06:01')]);
  const n2 = la('2026-11-07', '09:00');
  assert.deepEqual(clockworkStamps(config, agentMornings(config, 'cc', longer, n2), n2), [
    { badge: 'clockwork', level: 7, day: '2026-10-07' }, { badge: 'clockwork', level: 30, day: '2026-11-07' },
  ]);
  const hundred = ccShift('2026-01-01', Array(100).fill('06:00'));
  const n3 = la('2026-04-10', '12:00');
  assert.deepEqual(clockworkStamps(config, agentMornings(config, 'cc', hundred, n3), n3).map((s) => [s.level, s.day]), [[7, '2026-01-07'], [30, '2026-01-30'], [100, '2026-04-10']], 'across the March change');
  const early = la('2026-10-07', '06:10');
  assert.deepEqual(clockworkStamps(config, agentMornings(config, 'cc', ccShift('2026-10-01', Array(7).fill('06:02')), early), early), [], 'today is not a morning until 6:15');
  assert.deepEqual(AGENT_BADGES.clockwork.levels, [7, 30, 100]);
  assert.deepEqual(AGENT_BADGES.checked.levels, [10, 50, 200]);
});

test('Checked stamps: the 10th, 50th and 200th checked row, dated its LA day', () => {
  const j = Array.from({ length: 50 }, (_, i) => ({ verdict: 'checked', at: T0 + i * HOUR }));
  const noise = [{ verdict: 'overruled', at: T0 }, { verdict: 'pending', at: null }, null];
  assert.deepEqual(checkedStamps([...noise, ...j]), [
    { badge: 'checked', level: 10, day: laDate(T0 + 9 * HOUR) }, { badge: 'checked', level: 50, day: laDate(T0 + 49 * HOUR) },
  ]);
  assert.deepEqual(checkedStamps(j.slice(0, 9)), []);
});

/* ---------- the card ---------- */

test('agentCard: keeps, the record, On time, calls, stamps and the Shift Log; no points, no night editor yet', async () => {
  const now = la('2026-10-02', '12:00');
  const d1 = la('2026-10-01', '06:02');
  const fogA = await skyRow({ now: d1, observedAt: d1, detail: { ...SKY, obsAt: isoSec(d1) } });
  const fogB = await skyRow({ now: T0, observedAt: T0, detail: { ...SKY, obsAt: isoSec(T0), visMi: 10, ceilFt: null, wx: null } });
  const fogC = { ...(await skyRow({ now: T0, observedAt: T0 - MIN, detail: { ...SKY, obsAt: isoSec(T0 - MIN) } })), status: 'removed' };
  const humans = [person({ observed_at: d1 + 20 * MIN, value: 'hazy' }), person({ observed_at: T0 + 10 * MIN, value: 'none' })];
  const shift = ccShift('2026-10-01', ['06:02', '06:02']);
  const card = agentCard(config, { agent: 'cc', rows: [fogA, fogB, fogC], humans, shift, now });
  assert.deepEqual(card.agent, { call: 'cc', name: 'cc', noun: null, portrait: null });
  assert.deepEqual(card.keeps, [{ feed: 'sky', name: 'Sky', kind: 'fog', says: 'KLAX' }]);
  assert.deepEqual(card.record, { checked: 1, overruled: 1, judged: 2, pending: 0, noHumanCheck: 0 });
  assert.equal(recordLine(config, card), 'Checked 1, overruled 1 of 2 judged.');
  assert.deepEqual(card.onTime, { filed: 2, mornings: 2 });
  assert.deepEqual(card.calls, { asked: 0, answered: 0, checked: 0 });
  assert.deepEqual(card.stamps, []);
  assert.deepEqual(card.shiftLog.map((d) => d.day), ['2026-10-02', '2026-10-01'], 'newest first');
  assert.equal(card.nightEditor, null);
  assert.deepEqual(Object.keys(card), ['agent', 'keeps', 'record', 'onTime', 'calls', 'stamps', 'shiftLog', 'nightEditor']);
  const frog = agentCard(config, { agent: 'frog', now });
  assert.deepEqual(frog.agent, { call: 'frog', name: 'Frog', noun: 779, portrait: 'https://noun.pics/779.svg' });
  assert.deepEqual(frog.keeps.map((k) => k.feed), ['sun', 'air']);
  assert.equal(agentCard(config, { agent: 'mike', now }), null, 'people have no agent card');
  // Sol's calls: one answered and checked, one answered and overruled, one open.
  const sol = [];
  const calls = [];
  for (const [i, answer] of [['weekends', 'weekends'], ['lights', 'none'], ['20:00', null]].entries()) {
    const spot = ['courts', 'el-segundo', 'manhattan-heights'][i];
    const kind = ['sign', 'lights', 'closes'][i];
    const b = (await agentRowOf(config, { agent: 'sol', spot, kind, value: answer[0], sourceUrl: SIGN_URL, now: T0 })).row;
    sol.push(b);
    const c = callRowOf(config, { agent: 'sol', spot, kind, reportId: b.id, now: T0 });
    if (answer[1]) {
      const h = person({ spot, kind, value: answer[1], observed_at: T0 + HOUR });
      humans.push(h);
      Object.assign(c, { status: 'answered', answered_report_id: h.id, answered_at: T0 + HOUR });
    }
    calls.push(c);
  }
  const solCard = agentCard(config, { agent: 'sol', rows: sol, humans, calls, now });
  assert.deepEqual(solCard.calls, { asked: 3, answered: 2, checked: 1 });
  assert.deepEqual(solCard.record, { checked: 1, overruled: 1, judged: 2, pending: 1, noHumanCheck: 0 });
});

/* ---------- calls ---------- */

test('parseDeskPost: every refusal in order; the URL comes back normalized', () => {
  const ask = (over = {}) => parseDeskPost(config, { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL, ...over });
  assert.deepEqual(ask(), { action: 'ask', agent: 'sol', spot: 'courts', kind: 'sign', belief: 'weekends', sourceUrl: SIGN_URL });
  assert.equal(parseDeskPost(config, null).reason, 'bad-json');
  assert.equal(parseDeskPost(config, { action: 'answer' }).reason, 'bad-action');
  assert.equal(ask({ agent: 'mike' }).reason, 'unknown-agent');
  assert.equal(ask({ spot: 'desk' }).reason, 'bad-spot');
  assert.equal(ask({ kind: 'parking', belief: 'easy' }).reason, 'not-a-desk-kind');
  assert.equal(ask({ kind: 'constructor' }).reason, 'not-a-desk-kind');
  assert.equal(ask({ belief: 'cant' }).reason, 'bad-belief');
  assert.equal(ask({ belief: 'lights' }).reason, 'bad-belief', "another kind's bucket");
  assert.equal(ask({ sourceUrl: 'https://x.org/?token=1' }).reason, 'bad-source-url');
  const id = newAirId('ac');
  assert.match(id, CALL_ID_RE);
  const pass = (over = {}) => parseDeskPost(config, { action: 'pass', agent: 'cc', callId: id, to: 'sol', reason: 'keeper', ...over });
  assert.deepEqual(pass(), { action: 'pass', agent: 'cc', callId: id, to: 'sol', reason: 'keeper' });
  assert.equal(pass({ agent: 'x' }).reason, 'unknown-agent');
  assert.equal(pass({ callId: 'ar_0123456789abcdef0123' }).reason, 'bad-call');
  assert.equal(pass({ to: 'mike' }).reason, 'unknown-agent');
  assert.equal(pass({ to: 'cc' }).reason, 'bad-pass');
  assert.equal(pass({ reason: 'because' }).reason, 'bad-pass');
  for (const r of ['bad-json', 'bad-action', 'unknown-agent', 'bad-spot', 'not-a-desk-kind', 'bad-belief', 'bad-source-url', 'bad-call', 'bad-pass']) {
    assert.equal(DESK_REFUSALS[r], 400, r);
  }
  assert.deepEqual(
    Object.fromEntries(['resident-key-unset', 'not-a-resident', 'not-holder', 'spot-busy', 'too-soon', 'pass-cap', 'not-open', 'no-open-call', 'daily-cap', 'source-unresolved'].map((r) => [r, DESK_REFUSALS[r]])),
    { 'resident-key-unset': 503, 'not-a-resident': 403, 'not-holder': 403, 'spot-busy': 409, 'too-soon': 409, 'pass-cap': 409, 'not-open': 409, 'no-open-call': 409, 'daily-cap': 429, 'source-unresolved': 400 },
  );
});

test('calls: caps, the 48-hour window, passing, and a view that expires on read', async () => {
  const cfg = kindOf(config, 'courts', 'sign');
  assert.equal(askRefusal(config, { asksToday: 4, openOnSpot: 0, cfg, now: T0 }), null);
  assert.equal(askRefusal(config, { asksToday: 5, openOnSpot: 1, cfg, now: T0 }), 'daily-cap');
  assert.equal(askRefusal(config, { asksToday: 0, openOnSpot: 1, cfg, now: T0 }), 'spot-busy');
  assert.equal(askRefusal(config, { lastHumanAt: T0 - 29 * DAY, cfg, now: T0 }), 'too-soon', 'answered on site inside 30 days');
  assert.equal(askRefusal(config, { lastHumanAt: T0 - 30 * DAY, cfg, now: T0 }), null);
  const belief = (await agentRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', value: 'weekends', sourceUrl: SIGN_URL, now: T0 })).row;
  const call = callRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', reportId: belief.id, now: T0 });
  assert.deepEqual({ ...call, id: 'x' }, {
    id: 'x', spot: 'courts', kind: 'sign', asker: 'sol', holder: 'sol', report_id: belief.id, day: '2026-10-02', status: 'open',
    asked_at: T0, expires_at: T0 + 48 * HOUR, answered_report_id: null, answered_at: null, relay_json: '[]',
  });
  assert.equal(liveCall([call], 'courts', 'sign', T0 + 47 * HOUR), call);
  assert.equal(liveCall([call], 'courts', 'sign', T0 + 48 * HOUR), null, 'expires_at is exclusive');
  assert.equal(liveCall([call], 'courts', 'wait', T0), null);
  assert.equal(canPass(config, { call, agent: 'cc', now: T0 }), 'not-holder');
  assert.equal(canPass(config, { call, agent: 'sol', now: T0 + 48 * HOUR }), 'not-open');
  assert.equal(canPass(config, { call: { ...call, status: 'answered' }, agent: 'sol', now: T0 }), 'not-open');
  assert.equal(canPass(config, { call: null, agent: 'sol', now: T0 }), 'not-open');
  let passed = { ...call };
  for (const [from, to] of [['sol', 'frog'], ['frog', 'cc'], ['cc', 'sol']]) {
    assert.equal(canPass(config, { call: passed, agent: from, now: T0 + MIN }), null);
    passed = { ...passed, holder: to, relay_json: passRelay(passed, { from, to, reason: 'better-source', at: T0 + MIN }) };
  }
  assert.equal(canPass(config, { call: passed, agent: 'sol', now: T0 + MIN }), 'pass-cap', 'three passes at most');
  const view = callView(config, passed, belief, T0 + 2 * MIN);
  assert.deepEqual(view, {
    id: call.id, spot: 'courts', kind: 'sign', agent: 'sol', asker: 'sol', question: 'Which days does the posted sign allow public play?',
    belief: { value: 'weekends', label: 'Weekends and school breaks' }, sourceHost: 'citymb.info', sourceUrl: SIGN_URL,
    options: cfg.options, status: 'open', askedAt: isoSec(T0), expiresAt: isoSec(T0 + 48 * HOUR),
    relay: [['sol', 'frog'], ['frog', 'cc'], ['cc', 'sol']].map(([from, to]) => ({ from, to, reason: 'better-source', at: isoSec(T0 + MIN) })),
  });
  assert.equal(callView(config, call, belief, T0 + 48 * HOUR).status, 'expired', 'before any sweep');
  assert.equal(callStatus({ ...call, status: 'answered' }, T0 + 49 * HOUR), 'answered');
  assert.equal(callView(config, { ...call, relay_json: '{bad' }, belief, T0).relay.length, 0);
  assert.equal(callView(config, { ...call, relay_json: JSON.stringify([{ from: 'sol', to: 'frog', reason: 'free text', at: T0 }]) }, belief, T0).relay.length, 0);
  assert.equal(callView(config, call, null, T0), null, 'no belief, no call');
  assert.equal(callView(config, call, { ...belief, source_url: 'http://x.org' }, T0), null);
  assert.equal(callHead(config, view), 'CALL FROM THE DESK · SOL');
  assert.deepEqual(beliefParts(config, view), [
    { text: 'Sol', key: 'name' }, { text: ' read ' }, { text: 'Weekends and school breaks', key: 'label' }, { text: ' on ' }, { text: 'citymb.info', key: 'host' }, { text: '.' },
  ]);
});

/* ---------- templates and the log ---------- */

const flatTemplates = (t, prefix = '') => Object.entries(t).flatMap(([k, v]) => (typeof v === 'string' ? [[`${prefix}${k}`, v]] : flatTemplates(v, `${prefix}${k}.`)));

test('templates: every sentence is config; placeholders are the known ones; nothing unfilled ever prints', () => {
  const all = flatTemplates(config.desk.templates);
  for (const [key, t] of all) {
    const used = [...t.matchAll(/\{([A-Za-z]+)\}/g)].map((m) => m[1]);
    const allowed = TEMPLATE_VARS[key] ?? [];
    for (const u of used) assert.ok(allowed.includes(u), `${key} uses {${u}}`);
    if (/^(gapReasons|passReasons|tideWords)\./.test(key)) assert.equal(used.length, 0, `${key} is a phrase`);
    else assert.ok(Object.prototype.hasOwnProperty.call(TEMPLATE_VARS, key), `${key} has a TEMPLATE_VARS entry`);
    assert.doesNotMatch(t, /[<>]/, `${key}: no markup`);
  }
  for (const key of Object.keys(TEMPLATE_VARS)) assert.ok(deskTemplate(config, key), `${key} exists`);
  assert.deepEqual(Object.keys(config.desk.templates.gapReasons).sort(), [...GAP_REASONS, 'missed'].sort());
  assert.deepEqual(Object.keys(config.desk.templates.passReasons).sort(), [...PASS_REASONS].sort());
  assert.equal(config.desk.templates.answered, 'answered on site');
  assert.equal(fill('{name} read {says} at {clock}', { name: 'Sol', says: 'NOAA', clock: '6:02' }), 'Sol read NOAA at 6:02');
  assert.equal(fill('{name} and {nope}', { name: 'Sol', nope: { toString: () => 'x' } }), 'Sol and ', 'an object never prints');
  assert.equal(fill('{constructor}{toString}{hasOwnProperty}', {}), '', 'prototype keys are not vars');
  assert.equal(fillParts('a {x} b', { x: 1 }).map((p) => p.text).join(''), fill('a {x} b', { x: 1 }));
  assert.equal(deskText(config, 'onTime', { filed: 1, mornings: 1, by: '6:15' }), 'Filed 1 of 1 mornings by 6:15.');
  assert.equal(deskTemplate(config, 'log.nope'), '');
});

test('deskLog: agents are named, people never are; newest first; capped; nothing from the future', async () => {
  const now = T0 + 50 * HOUR;
  const belief = (await agentRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', value: 'weekends', sourceUrl: SIGN_URL, now: T0 })).row;
  const answered = { ...callRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', reportId: belief.id, now: T0 }), status: 'answered', answered_report_id: 'ar_0123456789abcdef0123', answered_at: T0 + 2 * HOUR };
  answered.relay_json = passRelay(answered, { from: 'sol', to: 'frog', reason: 'off-shift', at: T0 + HOUR });
  answered.holder = 'frog';
  const expired = callRowOf(config, { agent: 'cc', spot: 'el-segundo', kind: 'lights', reportId: 'ar_1123456789abcdef0123', now: T0 + MIN });
  const future = callRowOf(config, { agent: 'cc', spot: 'manhattan-heights', kind: 'closes', reportId: 'ar_2123456789abcdef0123', now: now + MIN });
  const shift = [
    { day: '2026-10-02', feed: 'sky', agent: 'cc', outcome: 'filed', reason: null, report_id: 'ar_x', at: T0, value: 'hazy' },
    { day: '2026-10-02', feed: 'tides', agent: 'sol', outcome: 'filed', reason: null, report_id: 'ar_y', at: T0 + 1 },
    { day: '2026-10-02', feed: 'air', agent: 'frog', outcome: 'gap', reason: 'blocked', report_id: null, at: T0 + 2 },
    { day: '2026-10-02', feed: 'town', agent: 'cc', outcome: 'filed', reason: null, report_id: 'ar_z', at: T0 + 3 },
  ];
  const log = deskLog(config, { shift, calls: [answered, expired, future], now });
  assert.deepEqual(log.map((l) => [l.kind, l.agent, l.spot, l.text]), [
    ['expire', 'cc', 'el-segundo', "cc's call at El Segundo Recreation Park courts expired unanswered."],
    ['answer', 'frog', 'courts', "Frog's call at Manhattan Middle School courts: answered on site."],
    ['pass', 'sol', 'courts', 'Sol passed the call at Manhattan Middle School courts to Frog: off shift.'],
    ['ask', 'cc', 'el-segundo', 'cc put out a call at El Segundo Recreation Park courts: Does the court have lights?'],
    ['gap', 'frog', 'beach', 'Air waits on the house: no key yet.'],
    ['filed', 'sol', 'beach', 'Sol filed Tides.'],
    ['ask', 'sol', 'courts', 'Sol put out a call at Manhattan Middle School courts: Which days does the posted sign allow public play?'],
    ['filed', 'cc', 'beach', 'cc filed Sky: Hazy.'],
  ]);
  assert.equal(log[0].at, isoSec(T0 + MIN + 48 * HOUR));
  for (const l of log) {
    assert.deepEqual(Object.keys(l), ['at', 'kind', 'agent', 'spot', 'text']);
    assert.ok(LOG_KINDS.includes(l.kind));
  }
  assert.equal(deskLog(config, { shift, calls: [answered, expired], now, limit: 3 }).length, 3);
  const many = Array.from({ length: 80 }, (_, i) => ({ day: '2026-10-02', feed: 'sky', agent: 'cc', outcome: 'gap', reason: 'upstream', report_id: null, at: T0 + i }));
  assert.equal(deskLog(config, { shift: many, now }).length, 50);
  assert.equal(deskLog(config, { shift: [{ ...shift[2], reason: 'upstream' }], now })[0].text, 'Frog missed Air: the source did not answer.', 'a real miss still names the keeper');
});

test('logDays: every Desk Log line says when — LA day heads (Today, Yesterday, Fri Oct 2) and the clock', () => {
  const lines = [
    { at: isoSec(la('2026-10-04', '06:02')), kind: 'filed', agent: 'cc', spot: 'beach', text: 'cc filed Sky: Clear.' },
    { at: isoSec(la('2026-10-04', '00:10')), kind: 'expire', agent: 'sol', spot: 'courts', text: 'x' },
    { at: isoSec(la('2026-10-03', '23:59')), kind: 'filed', agent: 'sol', spot: 'beach', text: 'Sol filed Tides: Rising.' },
    { at: isoSec(la('2026-10-02', '06:00')), kind: 'filed', agent: 'sol', spot: 'beach', text: 'Sol filed Tides: Falling.' },
    { at: 'not a time', kind: 'filed', agent: 'sol', spot: 'beach', text: 'dropped' },
  ];
  const days = logDays(lines, la('2026-10-04', '09:00'));
  assert.deepEqual(days.map((d) => [d.day, d.head, d.lines.map((l) => `${l.clock} ${l.text}`)]), [
    ['2026-10-04', 'Today', ['6:02 cc filed Sky: Clear.', '0:10 x']],
    ['2026-10-03', 'Yesterday', ['23:59 Sol filed Tides: Rising.']],
    ['2026-10-02', 'Fri Oct 2', ['6:00 Sol filed Tides: Falling.']],
  ]);
  assert.equal(logDays(lines, la('2026-11-02', '00:30'))[0].head, 'Sun Oct 4', 'the day after the fall-back change');
  assert.equal(logDays([{ ...lines[0], at: isoSec(la('2026-11-01', '23:00')) }], la('2026-11-02', '00:30'))[0].head, 'Yesterday');
  assert.deepEqual(logDays([], T0), []);
});

test('the agent card lines: calls, and no human check named by the fact feeds kept', () => {
  const card = (call, record, calls = { asked: 3, answered: 2, checked: 1 }) => ({ record: { checked: 0, overruled: 0, judged: 0, pending: 0, ...record }, calls, keeps: config.desk.feeds.filter((f) => f.keeper === call).map((f) => ({ feed: f.id, name: f.name, kind: f.kind, says: f.says })) });
  assert.equal(callsLine(config, card('sol', {})), 'Put out 3, answered 2, 1 checked.');
  assert.equal(noHumanCheckLine(config, card('sol', { noHumanCheck: 42 })), '42 filed with no human check: Tides, Swell.');
  assert.equal(noHumanCheckLine(config, card('frog', { noHumanCheck: 1 })), '1 filed with no human check: Sun, Air.');
  assert.equal(noHumanCheckLine(config, card('sol', { noHumanCheck: 0 })), '', 'nothing to say with none');
  assert.equal(noHumanCheckLine(config, card('cc', { noHumanCheck: 2 })), '2 filed with no human check.', 'Sky is checkable: no fact feed to name');
  assert.equal(deskTemplate(config, 'keepsNone'), 'Keeps no early-shift feed; can put out calls.');
  // Sun is worked out, not fetched: its byline never claims a read of a public source.
  assert.equal(deskByline(config, 'frog', 'sun', la('2026-10-02', '06:00')), 'Frog read the almanac at 6:00');
});

test('views never carry a phone or network hash', async () => {
  const now = T0 + 10 * MIN;
  const row = await skyRow({ observedAt: T0, detail: { ...SKY, obsAt: isoSec(T0) } });
  const humans = [person({ value: 'clear' })];
  const belief = (await agentRowOf(config, { agent: 'cc', spot: 'courts', kind: 'sign', value: 'daily', sourceUrl: SIGN_URL, now: T0 })).row;
  const call = callRowOf(config, { agent: 'cc', spot: 'courts', kind: 'sign', reportId: belief.id, now: T0 });
  const shift = ccShift('2026-10-01', ['06:02', '06:02']);
  const bodies = [
    agentReading(config, { spot: 'beach', kind: 'fog', rows: [row], now, human: { status: 'none' } }),
    deskFactsByFeed(config, [row], now),
    agentCard(config, { agent: 'cc', rows: [row, belief], humans, confirms: [{ report_id: row.id, verdict: 'still', onsite: 1, at: now, pid_hash: 'feedfacefeedface' }], shift, calls: [call], now }),
    callView(config, call, belief, now),
    shiftView(config, { rows: shift, now }),
    deskLog(config, { shift, calls: [call], now }),
  ];
  const text = JSON.stringify(bodies);
  for (const needle of ['pid_hash', 'ip_hash', row.pid_hash, row.ip_hash, belief.pid_hash, 'feedfacefeedface', 'cafebabecafebabe']) {
    assert.ok(!text.includes(needle), `no ${needle} in any view`);
  }
});

test('shiftView: today\'s five feeds; waiting before 6:15, missed after', () => {
  const rows = [
    { day: '2026-10-02', feed: 'sky', agent: 'cc', outcome: 'filed', reason: null, report_id: 'ar_a', at: la('2026-10-02', '06:02') },
    { day: '2026-10-02', feed: 'air', agent: 'frog', outcome: 'gap', reason: 'blocked', report_id: null, at: la('2026-10-02', '06:02') },
    { day: '2026-10-01', feed: 'tides', agent: 'sol', outcome: 'filed', reason: null, report_id: 'ar_b', at: la('2026-10-01', '06:02') },
  ];
  const early = shiftView(config, { rows, now: la('2026-10-02', '06:05') });
  assert.equal(early.day, '2026-10-02');
  assert.equal(early.onTimeBy, '06:15');
  assert.deepEqual(early.feeds.map((f) => [f.feed, f.keeper, f.outcome, f.reason, f.onTime, f.reportId]), [
    ['sky', 'cc', 'filed', null, true, 'ar_a'], ['tides', 'sol', 'waiting', null, false, null], ['swell', 'sol', 'waiting', null, false, null],
    ['sun', 'frog', 'waiting', null, false, null], ['air', 'frog', 'gap', 'blocked', false, null],
  ]);
  const late = shiftView(config, { rows, now: la('2026-10-02', '06:16') });
  assert.deepEqual(late.feeds.map((f) => f.reason), [null, 'missed', 'missed', 'missed', 'blocked']);
  for (const f of late.feeds) assert.deepEqual(Object.keys(f), ['feed', 'keeper', 'outcome', 'reason', 'at', 'onTime', 'reportId']);
});

/* ---------- migration 0025 ---------- */

const M0025 = 'migrations/auth/0025_air_desk.sql';
const [init, air, assign, desk] = await Promise.all(['migrations/auth/0001_init.sql', 'migrations/auth/0023_air.sql', 'migrations/auth/0024_air_assignments.sql', M0025].map(read));
const deskDb = () => {
  const db = new DatabaseSync(':memory:');
  for (const sql of [init, air, assign, desk]) db.exec(sql);
  return db;
};
const insertRow = (db, row) => db.prepare(`INSERT INTO air_reports (${AGENT_ROW_COLUMNS.join(', ')}) VALUES (${AGENT_ROW_COLUMNS.map(() => '?').join(', ')})`)
  .run(...AGENT_ROW_COLUMNS.map((c) => row[c]));
const insertCall = (db, c) => db.prepare(`INSERT INTO air_calls (id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(c.id, c.spot, c.kind, c.asker, c.holder, c.report_id, c.day, c.status, c.asked_at, c.expires_at, c.answered_report_id, c.answered_at, c.relay_json);

test('migration 0025: the only 0025, additive only, applies after 0023 and 0024 (twice, harmlessly)', async () => {
  const files = await readdir(new URL('migrations/auth/', root));
  assert.deepEqual(files.filter((f) => f.startsWith('0025')), ['0025_air_desk.sql']);
  const statements = desk.replace(/--[^\n]*/g, '');
  // One index on air_reports (by source, for the agent card and the shift's once-a-day guard); otherwise new tables only.
  const SOURCE_INDEX = 'CREATE INDEX IF NOT EXISTS air_reports_source ON air_reports(source, observed_at);';
  assert.equal(statements.split(SOURCE_INDEX).length, 2, 'the air_reports_source index, once');
  assert.doesNotMatch(statements.replace(SOURCE_INDEX, ''), /ALTER TABLE|DROP |air_points|air_stamps|air_reports|INSERT/i, 'new tables only; agents never get points or stamps rows');
  const db = deskDb();
  db.exec(desk);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('air_shift_feeds', 'air_calls') ORDER BY name").all().map((r) => r.name);
  assert.deepEqual(tables, ['air_calls', 'air_shift_feeds']);
  const idx = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND (name LIKE 'air_calls%' OR name LIKE 'air_shift%') ORDER BY name").all().map((r) => r.name);
  assert.deepEqual(idx, ['air_calls_asker', 'air_calls_live', 'air_calls_open_spot', 'air_shift_feeds_agent']);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name = 'air_reports_source'").get().n, 1);
});

test('migration 0025: agent rows satisfy 0023\'s CHECKs; air_shift_feeds takes filed or gap, never both; a later run upgrades a gap', async () => {
  const db = deskDb();
  const row = await skyRow();
  insertRow(db, row);
  const belief = (await agentRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', value: 'weekends', sourceUrl: SIGN_URL, now: T0 })).row;
  insertRow(db, belief);
  assert.throws(() => insertRow(db, { ...row, id: newAirId(), slot: row.slot + 1, source_url: null }), /CHECK/, 'an agent row without a source_url');
  assert.throws(() => insertRow(db, { ...row, id: newAirId(), slot: row.slot + 2, onsite: 1 }), /CHECK/, 'an agent row is never on site');
  const shift = (o) => db.prepare('INSERT INTO air_shift_feeds (day, feed, agent, outcome, reason, report_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(o.day ?? '2026-10-02', o.feed ?? 'sky', o.agent ?? 'cc', o.outcome, o.reason ?? null, o.report_id ?? null, o.at ?? T0);
  assert.throws(() => shift({ outcome: 'filed' }), /CHECK/, 'filed needs a report');
  assert.throws(() => shift({ outcome: 'filed', report_id: row.id, reason: 'stale' }), /CHECK/, 'filed has no reason');
  assert.throws(() => shift({ outcome: 'gap' }), /CHECK/, 'a gap needs a reason');
  assert.throws(() => shift({ outcome: 'gap', reason: 'missed' }), /CHECK/, "'missed' is a view word, never stored");
  assert.throws(() => shift({ outcome: 'gap', reason: 'upstream', report_id: row.id }), /CHECK/);
  assert.throws(() => shift({ outcome: 'late', reason: 'upstream' }), /CHECK/);
  shift({ outcome: 'gap', reason: 'upstream', at: T0 });
  // The spec's upsert (§4 Worker): a later run upgrades a gap, and never files twice.
  const upsert = (reportId, at) => db.prepare(`INSERT INTO air_shift_feeds (day, feed, agent, outcome, reason, report_id, at) VALUES (?, 'sky', 'cc', 'filed', NULL, ?, ?)
    ON CONFLICT (day, feed) DO UPDATE SET outcome = excluded.outcome, reason = NULL, report_id = excluded.report_id, at = excluded.at WHERE air_shift_feeds.outcome = 'gap'`)
    .run('2026-10-02', reportId, at);
  assert.equal(upsert(row.id, T0 + HOUR).changes, 1);
  assert.equal(upsert('ar_other', T0 + 2 * HOUR).changes, 0);
  assert.deepEqual({ ...db.prepare("SELECT outcome, reason, report_id, at FROM air_shift_feeds WHERE day = '2026-10-02' AND feed = 'sky'").get() },
    { outcome: 'filed', reason: null, report_id: row.id, at: T0 + HOUR });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM air_points').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM air_stamps').get().n, 0);
});

test('migration 0025: one open call per spot, 48 hours at most, answered iff it has an answer', async () => {
  const db = deskDb();
  const call = (over = {}) => ({ ...callRowOf(config, { agent: 'sol', spot: 'courts', kind: 'sign', reportId: newAirId(), now: T0 }), ...over });
  const a = call();
  insertCall(db, a);
  assert.throws(() => insertCall(db, call()), /UNIQUE/, 'the spot is busy');
  insertCall(db, call({ spot: 'el-segundo', kind: 'lights' }));
  assert.throws(() => insertCall(db, call({ spot: 'perry', report_id: a.report_id })), /UNIQUE/, 'one call per belief row');
  assert.throws(() => insertCall(db, call({ spot: 'perry', expires_at: T0 + 48 * HOUR + 1 })), /CHECK/);
  assert.throws(() => insertCall(db, call({ spot: 'perry', expires_at: T0 })), /CHECK/);
  assert.throws(() => insertCall(db, call({ spot: 'perry', status: 'answered' })), /CHECK/, 'answered needs the answer');
  assert.throws(() => insertCall(db, call({ spot: 'perry', answered_report_id: 'ar_x' })), /CHECK/, 'an answer closes the call');
  assert.throws(() => insertCall(db, call({ spot: 'perry', relay_json: '{oops' })), /CHECK/);
  assert.throws(() => insertCall(db, call({ spot: 'perry', status: 'held' })), /CHECK/);
  db.prepare("UPDATE air_calls SET status = 'expired' WHERE id = ?").run(a.id);
  insertCall(db, call());
  const b = call({ spot: 'anderson' });
  insertCall(db, b);
  db.prepare("UPDATE air_calls SET status = 'answered', answered_report_id = 'ar_0123456789abcdef0123', answered_at = ? WHERE id = ?").run(T0 + HOUR, b.id);
  insertCall(db, call({ spot: 'anderson' }));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM air_calls WHERE status = 'open'").get().n, 3);
});
