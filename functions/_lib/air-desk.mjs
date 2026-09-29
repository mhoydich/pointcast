// Pure parts of the Early Shift and the Desk (/r/desk, /r/agent/[call]) —
// feed buckets, detail validation, safe source URLs, agent rows, the judge,
// the agent card, calls and the Desk Log — kept in a plain module so tests run
// them under node without the Pages runtime. The early-shift Worker
// (workers/early-shift) and the Pages Functions import the same rules.
// Build spec: docs/plans/2026-09-28-early-shift-desk-spec.md.
//
// House rules this file holds:
// - Agents never earn points, air_stamps rows or cash. Their record, On time
//   and stamps (Clockwork, Checked) are computed here at read time.
// - A person's on-site report always outranks an agent row: agentReading()
//   is null while the human reading is live, and once a person overruled it.
// - Every agent row carries a source_url that passes safeSourceUrl().
// - Every sentence comes from config.desk.templates, filled with config
//   values and numbers (fill()). No agent-written text reaches a page.
// - Views never read pid_hash or ip_hash, and callers should not select them
//   for desk views. agentRowOf() builds the one object that carries them: an
//   air_reports row to INSERT, never a response body.
//
// Inputs are D1 rows as selected, snake_case:
//   report   { id, spot, kind, value, observed_at, created_at?, onsite, status?, source?, source_url?, extras_json?, schema_v? }
//   confirm  { report_id, verdict, onsite, at }
//   shift    { day, feed, agent, outcome, reason, report_id, at, value? }   (air_shift_feeds, + r.value joined for the log)
//   call     { id, spot, kind, asker, holder, report_id, day, status, asked_at, expires_at, answered_report_id, answered_at, relay_json }
// Times in and out of views are ISO seconds (isoSec); rows keep epoch ms.

import { hash16, isDeskKind, kindOf, kindRole, labelOf, newAirId, slotOf, spotOf } from './air-kinds.mjs';
import { bars, isoSec, laClock, laDate, laParts } from './air-reading.mjs';
import { laWallToMs } from './air-assign.mjs';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const FUTURE_MS = 60_000;

/** Every early-shift feed files on the beach spot. There is no `town` spot. */
export const DESK_SPOT = 'beach';
export const FEED_IDS = Object.freeze(['sky', 'tides', 'swell', 'sun', 'air']);
/** air_shift_feeds.reason. 'blocked' (the key is unset) is a house gap and never counts against On time. */
export const GAP_REASONS = Object.freeze(['blocked', 'upstream', 'stale', 'shape']);
export const PASS_REASONS = Object.freeze(['keeper', 'off-shift', 'better-source']);
export const CALL_STATUSES = Object.freeze(['open', 'answered', 'expired']);
export const VERDICTS = Object.freeze(['checked', 'overruled', 'pending', 'unjudged', 'no-check']);
export const LOG_KINDS = Object.freeze(['filed', 'gap', 'ask', 'pass', 'answer', 'expire']);

/**
 * Every refusal /api/air/desk, the desk MCP tools and the report gate answer
 * with, and its HTTP status. `bad-json`, `bad-action`, `bad-call` and
 * `bad-pass` are body shape; the rest are the spec's list.
 */
export const DESK_REFUSALS = Object.freeze({
  'bad-json': 400, 'bad-action': 400, 'unknown-agent': 400, 'bad-spot': 400, 'not-a-desk-kind': 400, 'bad-belief': 400,
  'bad-source-url': 400, 'source-unresolved': 400, 'bad-call': 400, 'bad-pass': 400,
  'not-a-resident': 403, 'not-holder': 403,
  'spot-busy': 409, 'too-soon': 409, 'pass-cap': 409, 'not-open': 409, 'no-open-call': 409,
  'daily-cap': 429,
  'resident-key-unset': 503,
});

/** newAirId('ac'): `ac_` + 20 hex. */
export const CALL_ID_RE = /^ac_[0-9a-f]{16,40}$/;
export const SOURCE_URL_MAX = 300;
/** A call's sourceUrl must answer a GET below 400 within this. */
export const RESOLVE_TIMEOUT_MS = 3_000;
/** Each early-shift fetch aborts after this. */
export const FEED_TIMEOUT_MS = 5_000;
/** The early shift runs in the 6 AM LA hour (crons at 13:00 and 14:00 UTC; one of them is 6 AM). */
export const SHIFT_HOUR = 6;
/** Stale limits in minutes: a METAR over 90 minutes old, an NDBC or AirNow reading over 3 hours. */
export const STALE_MIN = Object.freeze({ sky: 90, swell: 180, air: 180 });
export const LOG_SIZE = 50;
export const SHIFT_LOG_DAYS = 30;
/** GET /api/air/desk Cache-Control max-age. */
export const DESK_TTL_S = 30;
/** Agent stamps: their own book, levels dated the LA day each was first reached. Night Shift waits for the Night Desk. */
export const AGENT_BADGES = Object.freeze({
  clockwork: { label: 'CLOCKWORK', levels: Object.freeze([7, 30, 100]), rule: 'Every kept feed filed by 6:15 (or blocked), mornings running' },
  checked: { label: 'CHECKED', levels: Object.freeze([10, 50, 200]), rule: 'Rows an on-site person checked' },
});

export const TIDE_STATION = '9410660';
export const NDBC_STATION = '46221';
/** The stored Air source: the public page, never the API URL (which carries API_KEY). */
export const AIRNOW_PAGE = 'https://www.airnow.gov/?city=El%20Segundo&state=CA&country=USA';

/** The air_reports columns agentRowOf() fills, in INSERT order. */
export const AGENT_ROW_COLUMNS = Object.freeze([
  'id', 'spot', 'kind', 'value', 'extras_json', 'schema_v', 'observed_at', 'day', 'slot', 'pid_hash', 'ip_hash', 'user_id',
  'byline', 'onsite', 'geo', 'status', 'source', 'source_url', 'created_at', 'awarded_at',
]);

/** Placeholders each template may use. fill() prints any other as nothing. */
export const TEMPLATE_VARS = Object.freeze({
  byline: ['name', 'says', 'clock'],
  callHead: ['NAME'],
  belief: ['name', 'label', 'host'],
  answered: [],
  noHumanCheck: ['count', 'feeds'],
  noHumanCheckBare: ['count'],
  record: ['checked', 'overruled', 'judged'],
  onTime: ['filed', 'mornings', 'by'],
  calls: ['asked', 'answered', 'checked'],
  keepsNone: [],
  'log.filed': ['name', 'feed', 'label'],
  'log.filedBare': ['name', 'feed'],
  'log.gap': ['name', 'feed', 'reason'],
  'log.blocked': ['name', 'feed'],
  'log.ask': ['name', 'spot', 'question'],
  'log.pass': ['name', 'spot', 'to', 'reason'],
  'log.answer': ['name', 'spot'],
  'log.expire': ['name', 'spot'],
  'edition.sky': ['byline', 'label'],
  'edition.tides': ['first', 'firstAt', 'second', 'secondAt', 'name', 'says'],
  'edition.tide1': ['first', 'firstAt', 'name', 'says'],
});

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const CALL_SIGN_RE = /^[a-z][a-z0-9-]{0,15}$/;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => isObj(o) && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const on = (v) => v === 1 || v === true;
const ok = (r) => (r.status ?? 'ok') === 'ok';
const isInt = (v) => Number.isInteger(v);
const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const isIso = (s) => typeof s === 'string' && ISO_RE.test(s) && Number.isFinite(Date.parse(s)) && isoSec(Date.parse(s)) === s;
const keysAre = (o, keys) => isObj(o) && Object.keys(o).length === keys.length && keys.every((k) => own(o, k));
const addDay = (day) => new Date(Date.parse(`${day}T12:00:00Z`) + DAY).toISOString().slice(0, 10);

/** Whether a row is an agent's: source 'agent:<call>'. */
export const isAgentRow = (row) => typeof row?.source === 'string' && row.source.startsWith('agent:') && row.source.length > 6;
/** The call sign on an agent row ('agent:sol' → 'sol'), or null. */
export const agentCallOf = (row) => (isAgentRow(row) ? row.source.slice(6) : null);
const human = (r) => !String(r.source ?? 'page').startsWith('agent:');

/* ---------- config lookups ---------- */

/** An agent ({call, name, noun}) by call sign, or null. */
export function agentOf(config, call) {
  if (typeof call !== 'string') return null;
  return (config.desk?.agents ?? []).find((a) => a.call === call) ?? null;
}

/** A feed ({id, name, kind, keeper, says, needs?}) by id, or null. */
export function feedOf(config, id) {
  if (typeof id !== 'string') return null;
  return (config.desk?.feeds ?? []).find((f) => f.id === id) ?? null;
}

/** The feed that files a beach kind ('tide' → tides), or null. */
export function feedOfKind(config, kind) {
  return (config.desk?.feeds ?? []).find((f) => f.kind === kind) ?? null;
}

/** The feeds an agent keeps, in config order. */
export function keptFeeds(config, call) {
  return (config.desk?.feeds ?? []).filter((f) => f.keeper === call);
}

/** The agent's portrait URL (noun.pics for a Nouns seed), or null for a lettermark. */
export function portraitOf(agent) {
  return agent && Number.isInteger(agent.noun) ? `https://noun.pics/${agent.noun}.svg` : null;
}

const nameOf = (config, call) => agentOf(config, call)?.name ?? String(call);
const optionLabelOf = (cfg, v) => cfg.options.find((o) => o.v === v)?.label ?? labelOf(cfg, v);

/* ---------- templates ---------- */

/**
 * Fill a template's `{key}` placeholders from `vars` (strings and numbers).
 * A missing or non-scalar value prints as nothing, never as the placeholder.
 */
export function fill(template, vars = {}) {
  return String(template ?? '').replace(/\{([A-Za-z]+)\}/g, (_, k) => {
    const v = own(vars, k) ? vars[k] : null;
    return typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)) ? String(v) : '';
  });
}

/**
 * fill(), split into parts so a page can style one value (the belief label in
 * italics): [{text}, {text, key: 'label'}, …]. Joining every text is fill().
 */
export function fillParts(template, vars = {}) {
  const out = [];
  const t = String(template ?? '');
  const re = /\{([A-Za-z]+)\}/g;
  let last = 0;
  for (let m = re.exec(t); m; m = re.exec(t)) {
    if (m.index > last) out.push({ text: t.slice(last, m.index) });
    out.push({ text: fill(m[0], vars), key: m[1] });
    last = re.lastIndex;
  }
  if (last < t.length) out.push({ text: t.slice(last) });
  return out;
}

/** A template by key ('byline', 'log.gap'), or ''. */
export function deskTemplate(config, key) {
  let t = config.desk?.templates;
  for (const part of String(key).split('.')) t = own(t, part) ? t[part] : null;
  return typeof t === 'string' ? t : '';
}

/** deskTemplate() + fill(): deskText(config, 'onTime', {filed: 1, mornings: 1, by: '6:15'}). */
export const deskText = (config, key, vars = {}) => fill(deskTemplate(config, key), vars);

/** "6:15" for config.desk.onTimeBy "06:15". */
export function onTimeByLabel(config) {
  const [h, m] = String(config.desk?.onTimeBy ?? '06:15').split(':').map(Number);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** "Sol read NOAA at 6:02": the agent's name, the feed's `says`, the LA clock of `at` (filed time). */
export function deskByline(config, call, feedId, at) {
  const feed = feedOf(config, feedId);
  return deskText(config, 'byline', { name: nameOf(config, call), says: feed?.says ?? '', clock: laClock(at) });
}

/* ---------- the early shift: when, and where from ---------- */

/** Whether a scheduled run at `ms` is the morning's: the 6 AM LA hour. Exactly one of 13:00Z/14:00Z passes on any day, DST or not. */
export function shouldRun(ms) {
  return Number.isFinite(ms) && laParts(ms).hour === SHIFT_HOUR;
}

/** Epoch ms of a day's on-time cut (config.desk.onTimeBy, LA): '2026-11-01' → 14:15Z. */
export function onTimeCut(config, day) {
  return laWallToMs(day, config.desk?.onTimeBy ?? '06:15');
}

/** Epoch ms the day's shift opens (SHIFT_HOUR, LA): nothing filed before it is on time. */
export function shiftStart(day) {
  return laWallToMs(day, `${String(SHIFT_HOUR).padStart(2, '0')}:00`);
}

/** Whether an observation is too old to file (STALE_MIN; feeds without a limit never are). */
export function isStale(feedId, observedMs, nowMs) {
  const limit = STALE_MIN[feedId];
  return limit != null && nowMs - observedMs > limit * MIN;
}

/**
 * The source_url an early-shift row stores. Sky, tides and swell are the URLs
 * the Worker reads; sun is computed (NOAA's solar calculator is the check);
 * air is the public AirNow page, never the keyed API request.
 */
export function feedSourceUrl(feedId, nowMs) {
  switch (feedId) {
    case 'sky': return 'https://aviationweather.gov/api/data/metar?ids=KLAX&format=json&hours=3';
    case 'tides': {
      const d = new Date(nowMs).toISOString().slice(0, 10).replaceAll('-', '');
      return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=pointcast&begin_date=${d}&range=48&datum=MLLW&station=${TIDE_STATION}&time_zone=gmt&units=english&interval=hilo&format=json`;
    }
    case 'swell': return `https://www.ndbc.noaa.gov/data/realtime2/${NDBC_STATION}.txt`;
    case 'sun': return 'https://gml.noaa.gov/grad/solcalc/';
    case 'air': return AIRNOW_PAGE;
    default: return null;
  }
}

/* ---------- source URLs ---------- */

const SECRET_WORDS = ['key', 'token', 'secret', 'password', 'passwd', 'signature', 'credential', 'auth', 'session'];
const SECRET_NAMES = ['sig', 'pwd', 'jwt', 'code'];
const secretName = (name) => {
  const n = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  return SECRET_NAMES.includes(n) || SECRET_WORDS.some((w) => n.includes(w));
};
const LOCAL_HOST_RE = /(^|\.)(localhost|local|internal|test|invalid|example)$/;

/**
 * A source URL an agent row may store, normalized, or null. https only, 300
 * characters or fewer, no userinfo, no port, a dotted public host name (no IP
 * literal, no localhost), and no parameter (query or fragment) whose name
 * looks like a key, token, secret, signature, password, session or code.
 */
export function safeSourceUrl(input) {
  if (typeof input !== 'string' || input.length === 0 || input.length > SOURCE_URL_MAX) return null;
  if (/[\u0000- \u007f-\u009f]/.test(input)) return null;
  let url;
  try { url = new URL(input); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.endsWith('.') || host.startsWith('[') || /^[\d.]+$/.test(host) || LOCAL_HOST_RE.test(host)) return null;
  const params = [...url.searchParams.keys(), ...new URLSearchParams(url.hash.slice(1)).keys()];
  if (params.some(secretName)) return null;
  if (url.href.length > SOURCE_URL_MAX) return null;
  return url.href;
}

/** "citymb.info" for "https://www.citymb.info/…"; null for an unsafe URL. */
export function sourceHostOf(input) {
  const href = safeSourceUrl(input);
  return href ? new URL(href).hostname.toLowerCase().replace(/^www\./, '') : null;
}

/* ---------- buckets ---------- */

const wxTokens = (wx) => String(wx ?? '').toUpperCase().split(/\s+/).filter(Boolean).map((t) => t.replace(/^[+-]/, ''));
/** Whether METAR present weather has `code` at the field (a VC… token is in the vicinity, not at the field). */
function hasWx(wx, code) {
  for (const tok of wxTokens(wx)) {
    if (tok.startsWith('VC') || !/^(?:[A-Z]{2})+$/.test(tok)) continue;
    for (let i = 0; i < tok.length; i += 2) if (tok.slice(i, i + 2) === code) return true;
  }
  return false;
}

/**
 * The Sky rule, KLAX to the beach's fog buckets:
 * - 'none': visibility under 1 mi, or FG
 * - 'hazy': visibility under 5 mi, or BR/HZ, or a ceiling (ceilingOf()) under 1000 ft
 * - 'clear': anything else
 * `visMi` is a number (the Worker reads "10+" as 10); anything else is null (a shape gap).
 */
export function skyBucket({ visMi, wx = null, ceilFt = null } = {}) {
  if (!num(visMi, 0, Infinity)) return null;
  if (visMi < 1 || hasWx(wx, 'FG')) return 'none';
  const ceiling = num(ceilFt, 0, Infinity) ? ceilFt : null;
  if (visMi < 5 || hasWx(wx, 'BR') || hasWx(wx, 'HZ') || (ceiling != null && ceiling < 1000)) return 'hazy';
  return 'clear';
}

/** Wave height in feet to a swell bucket: [0,1) '0-1', [1,2) '1-2', [2,3) '2-3', [3,5) '3-5', 5+ '5+'. */
export function swellBucket(ft) {
  if (!num(ft, 0, Infinity)) return null;
  return ft < 1 ? '0-1' : ft < 2 ? '1-2' : ft < 3 ? '2-3' : ft < 5 ? '3-5' : '5+';
}

/** An AQI to its EPA category: 0–50 good, 51–100 moderate, 101–150 usg, 151–200 unhealthy, 201–300 very-unhealthy, 301+ hazardous. */
export function aqiBucket(aqi) {
  if (!isInt(aqi) || aqi < 0) return null;
  return aqi <= 50 ? 'good' : aqi <= 100 ? 'moderate' : aqi <= 150 ? 'usg' : aqi <= 200 ? 'unhealthy' : aqi <= 300 ? 'very-unhealthy' : 'hazardous';
}

const atMs = (at) => (typeof at === 'number' ? at : typeof at === 'string' ? Date.parse(at) : NaN);

/**
 * The next `n` tide events strictly after `nowMs`, oldest first, as a detail
 * stores them: [{type: 'H'|'L', at: ISO, ft}]. `at` in may be ms or ISO;
 * events with an unknown type, time or height are dropped.
 */
export function nextTides(events, nowMs, n = 4) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((e) => isObj(e) && (e.type === 'H' || e.type === 'L') && Number.isFinite(atMs(e.at)) && num(e.ft, -Infinity, Infinity) && atMs(e.at) > nowMs)
    .map((e) => ({ type: e.type, at: isoSec(atMs(e.at)), ft: e.ft }))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .slice(0, n);
}

/** 'rising' when the next event after `nowMs` is a high, 'falling' for a low, null with none ahead. */
export function tideValue(events, nowMs) {
  const next = nextTides(events, nowMs, 1)[0];
  return next ? (next.type === 'H' ? 'rising' : 'falling') : null;
}

/* ---------- details ---------- */

/** A fresh {reason: 'shape'}: callers may add to a refusal. */
const shape = () => ({ reason: 'shape' });

/**
 * A feed's detail, checked exactly and copied in a fixed key order, or
 * {reason: 'shape'}. No extra keys, finite numbers in range, ISO-second times.
 * - sky    {obsAt, visMi 0–100, ceilFt int|null, wx string|null}
 * - tides  {next: 1–4 × {type 'H'|'L', at, ft −15–20}, strictly ascending}
 * - swell  {ft 0–100, periodS 0–40|null, dirDeg int 0–360|null, waterF 28–100|null, obsAt}
 * - sun    {sunrise, sunset}, sunrise before sunset, under 24 h apart
 * - air    {aqi int 0–999, param like "PM2.5" or "O3", obsAt}
 */
export function validateDetail(feedId, detail) {
  const d = detail;
  switch (feedId) {
    case 'sky': {
      if (!keysAre(d, ['obsAt', 'visMi', 'ceilFt', 'wx']) || !isIso(d.obsAt) || !num(d.visMi, 0, 100)) return shape();
      if (!(d.ceilFt === null || (isInt(d.ceilFt) && d.ceilFt >= 0 && d.ceilFt <= 60_000))) return shape();
      if (!(d.wx === null || (typeof d.wx === 'string' && d.wx.length <= 40 && /^[A-Z+\- ]+$/.test(d.wx)))) return shape();
      return { detail: { obsAt: d.obsAt, visMi: d.visMi, ceilFt: d.ceilFt, wx: d.wx } };
    }
    case 'tides': {
      if (!keysAre(d, ['next']) || !Array.isArray(d.next) || d.next.length < 1 || d.next.length > 4) return shape();
      const next = [];
      for (const e of d.next) {
        if (!keysAre(e, ['type', 'at', 'ft']) || (e.type !== 'H' && e.type !== 'L') || !isIso(e.at) || !num(e.ft, -15, 20)) return shape();
        if (next.length && Date.parse(e.at) <= Date.parse(next.at(-1).at)) return shape();
        next.push({ type: e.type, at: e.at, ft: e.ft });
      }
      return { detail: { next } };
    }
    case 'swell': {
      if (!keysAre(d, ['ft', 'periodS', 'dirDeg', 'waterF', 'obsAt']) || !num(d.ft, 0, 100) || !isIso(d.obsAt)) return shape();
      if (!(d.periodS === null || num(d.periodS, 0, 40))) return shape();
      if (!(d.dirDeg === null || (isInt(d.dirDeg) && d.dirDeg >= 0 && d.dirDeg <= 360))) return shape();
      if (!(d.waterF === null || num(d.waterF, 28, 100))) return shape();
      return { detail: { ft: d.ft, periodS: d.periodS, dirDeg: d.dirDeg, waterF: d.waterF, obsAt: d.obsAt } };
    }
    case 'sun': {
      if (!keysAre(d, ['sunrise', 'sunset']) || !isIso(d.sunrise) || !isIso(d.sunset)) return shape();
      const span = Date.parse(d.sunset) - Date.parse(d.sunrise);
      if (!(span > 0 && span < DAY)) return shape();
      return { detail: { sunrise: d.sunrise, sunset: d.sunset } };
    }
    case 'air': {
      if (!keysAre(d, ['aqi', 'param', 'obsAt']) || !isInt(d.aqi) || d.aqi < 0 || d.aqi > 999 || !isIso(d.obsAt)) return shape();
      if (typeof d.param !== 'string' || !/^[A-Za-z0-9.]{1,12}$/.test(d.param)) return shape();
      return { detail: { aqi: d.aqi, param: d.param, obsAt: d.obsAt } };
    }
    default:
      return shape();
  }
}

/** The bucket a validated detail says at `atMs` (tides depend on the moment), or null. */
export function feedValue(feedId, detail, atMsValue) {
  switch (feedId) {
    case 'sky': return skyBucket(detail);
    case 'tides': return tideValue(detail?.next, atMsValue);
    case 'swell': return swellBucket(detail?.ft);
    case 'sun': return 'times';
    case 'air': return aqiBucket(detail?.aqi);
    default: return null;
  }
}

/* ---------- agent rows ---------- */

/** air_reports.pid_hash for an agent: hash16('air:agent:v1:' + call). */
export const agentPidHash = (call) => hash16(`air:agent:v1:${call}`);
/** air_reports.ip_hash for every agent row: hash16('air:agent:v1'). */
export const agentIpHash = () => hash16('air:agent:v1');

/**
 * An agent row to INSERT into air_reports (AGENT_ROW_COLUMNS), or {reason}.
 * Two shapes:
 * - A feed row: {agent, feed, detail, observedAt, now, value?, sourceUrl?}.
 *   The agent must keep the feed (not-keeper). The detail must validate
 *   (shape); the value is derived from it (feedValue) and a passed `value`
 *   must match it (shape). observedAt is not in the future (bad-observed-at)
 *   nor already past the kind's decay (stale). sourceUrl defaults to
 *   feedSourceUrl(). extras_json is the detail, schema_v 2.
 * - A call's belief: {agent, spot, kind, value, sourceUrl, now}. The kind is a
 *   desk kind (not-a-desk-kind), the value one of its buckets but never
 *   'cant' (bad-belief). extras_json '[]', schema_v 1, observed_at now.
 * Either way: onsite 0, geo 0, user_id null, byline the agent's name, source
 * 'agent:<call>', a safe source_url (bad-source-url), awarded_at null forever.
 * Other reasons: unknown-agent, unknown-feed, bad-spot, bad-kind.
 */
export async function agentRowOf(config, input = {}) {
  const { agent, feed = null, spot = null, kind = null, value = null, detail = null, sourceUrl = null, observedAt = null, now } = input;
  const who = agentOf(config, agent);
  if (!who) return { reason: 'unknown-agent' };
  if (!isInt(now)) return { reason: 'bad-observed-at' };
  let fields;
  if (feed != null) {
    const f = feedOf(config, feed);
    if (!f) return { reason: 'unknown-feed' };
    if (f.keeper !== who.call) return { reason: 'not-keeper' };
    const cfg = kindOf(config, DESK_SPOT, f.kind);
    if (!cfg) return { reason: 'bad-kind' };
    const v = validateDetail(f.id, detail);
    if (v.reason) return v;
    const at = observedAt ?? now;
    if (!isInt(at) || at > now + FUTURE_MS) return { reason: 'bad-observed-at' };
    const t = Math.min(at, now);
    if (now - t >= cfg.decayMin * MIN) return { reason: 'stale' };
    const derived = feedValue(f.id, v.detail, t);
    if (derived == null || !cfg.options.some((o) => o.v === derived)) return shape();
    if (value != null && value !== derived) return shape();
    const url = safeSourceUrl(sourceUrl ?? feedSourceUrl(f.id, now));
    if (!url) return { reason: 'bad-source-url' };
    fields = { spot: DESK_SPOT, kind: f.kind, value: derived, extras_json: JSON.stringify(v.detail), schema_v: 2, observed_at: t, source_url: url };
  } else {
    if (!spotOf(config, spot)) return { reason: 'bad-spot' };
    const cfg = kindOf(config, spot, kind);
    if (!cfg || !isDeskKind(cfg)) return { reason: 'not-a-desk-kind' };
    if (typeof value !== 'string' || value === 'cant' || !cfg.options.some((o) => o.v === value)) return { reason: 'bad-belief' };
    const url = safeSourceUrl(sourceUrl);
    if (!url) return { reason: 'bad-source-url' };
    fields = { spot, kind, value, extras_json: '[]', schema_v: 1, observed_at: now, source_url: url };
  }
  const [pid, ip] = await Promise.all([agentPidHash(who.call), agentIpHash()]);
  const row = {
    id: newAirId('ar'), spot: fields.spot, kind: fields.kind, value: fields.value, extras_json: fields.extras_json, schema_v: fields.schema_v,
    observed_at: fields.observed_at, day: laDate(fields.observed_at), slot: slotOf(fields.observed_at), pid_hash: pid, ip_hash: ip, user_id: null,
    byline: who.name, onsite: 0, geo: 0, status: 'ok', source: `agent:${who.call}`, source_url: fields.source_url, created_at: now, awarded_at: null,
  };
  return { row };
}

/* ---------- the judge ---------- */

/**
 * Pure: how people judged one agent row. → {verdict, at, via} | null (not an agent row).
 * - A fact kind (or a kind no longer in config): 'no-check'.
 * - Otherwise the earliest of: an on-site ok human report of the same spot and
 *   kind observed in [row.observed_at, + decayMin), not 'cant' (same value
 *   'checked', different 'overruled', via 'report'); an on-site 'still' or
 *   'changed' confirm on the row ('checked' / 'overruled', via 'confirm').
 * - Nothing yet: 'pending' until observed_at + decayMin, then 'unjudged'.
 * `humans` may hold any rows (other spots, agents, remote rows are skipped);
 * `confirms` any confirms (only those on this row count). `at` is epoch ms.
 */
export function judgeRow(config, row, { humans = [], confirms = [], now } = {}) {
  if (!isAgentRow(row)) return null;
  const cfg = kindOf(config, row.spot, row.kind);
  if (!cfg || kindRole(cfg) === 'fact') return { verdict: 'no-check', at: null, via: null };
  const end = row.observed_at + cfg.decayMin * MIN;
  let best = null;
  for (const h of humans) {
    if (h.spot !== row.spot || h.kind !== row.kind || !human(h) || !on(h.onsite) || !ok(h) || h.value === 'cant') continue;
    if (!(h.observed_at >= row.observed_at && h.observed_at < end)) continue;
    if (!best || h.observed_at < best.at) best = { verdict: h.value === row.value ? 'checked' : 'overruled', at: h.observed_at, via: 'report' };
  }
  for (const c of confirms) {
    if (c.report_id !== row.id || !on(c.onsite) || (c.verdict !== 'still' && c.verdict !== 'changed')) continue;
    if (!best || c.at < best.at) best = { verdict: c.verdict === 'still' ? 'checked' : 'overruled', at: c.at, via: 'confirm' };
  }
  if (best) return best;
  return { verdict: now < end ? 'pending' : 'unjudged', at: null, via: null };
}

/* ---------- facts and readings ---------- */

/**
 * Pure: an early-shift agent row as a DeskFact, or null (not an agent row on
 * the beach, not a feed kind, no schema_v 2 detail that validates, expired, or
 * an unsafe stored URL). Tides are re-read at `now`: `detail.next` keeps the
 * events still ahead and `value` points at the next one; none ahead is null.
 * → {feed, agent, value, label, detail, filedAt, observedAt, byline, sourceUrl, bars}
 */
export function deskFact(config, row, now) {
  if (!isAgentRow(row) || !ok(row) || row.spot !== DESK_SPOT) return null;
  const feed = feedOfKind(config, row.kind);
  const cfg = kindOf(config, DESK_SPOT, row.kind);
  if (!feed || !cfg || Number(row.schema_v) !== 2) return null;
  let raw;
  try { raw = JSON.parse(row.extras_json); } catch { return null; }
  const v = validateDetail(feed.id, raw);
  if (v.reason) return null;
  const b = bars(now - row.observed_at, cfg.decayMin);
  if (b === 0) return null;
  let { detail } = v;
  let value = row.value;
  if (feed.id === 'tides') {
    const next = nextTides(detail.next, now);
    if (!next.length) return null;
    detail = { next };
    value = tideValue(next, now);
  }
  if (!cfg.options.some((o) => o.v === value)) return null;
  const sourceUrl = safeSourceUrl(row.source_url);
  if (!sourceUrl) return null;
  const agent = agentCallOf(row);
  const filed = isInt(row.created_at) ? row.created_at : row.observed_at;
  return {
    feed: feed.id, agent, value, label: optionLabelOf(cfg, value), detail,
    filedAt: isoSec(filed), observedAt: isoSec(row.observed_at), byline: deskByline(config, agent, feed.id, filed), sourceUrl, bars: b,
  };
}

const newestFirst = (a, b) => b.observed_at - a.observed_at || (b.created_at ?? 0) - (a.created_at ?? 0);

/**
 * Pure: every feed's fact from the newest ok agent row of its kind on the
 * beach (only the newest is read; a gap leaves yesterday's to expire).
 * → {sky, tides, swell, sun, air}, each a DeskFact or null. The board takes
 * {tides, swell, sun, air}; the edition takes sky's fog and tides.
 */
export function deskFactsByFeed(config, rows, now) {
  const out = {};
  for (const feed of config.desk?.feeds ?? []) {
    const newest = rows.filter((r) => isAgentRow(r) && ok(r) && r.spot === DESK_SPOT && r.kind === feed.kind).sort(newestFirst)[0];
    out[feed.id] = newest ? deskFact(config, newest, now) : null;
  }
  return out;
}

/**
 * Pure: GET /api/air/[spot]'s `desk`, a DeskReading, or null. Only for a
 * feed's kind on the beach, only while the human reading's status is 'none'
 * (pass `human`, the reading() result), and never once a person overruled the
 * newest agent row. `rows` are the spot+kind rows the reading used (people
 * and agents); `confirms` the confirms on them. `reportId` is confirmable.
 * → DeskFact + {reportId, liveUntil}
 */
export function agentReading(config, { spot, kind, rows = [], confirms = [], now, human: humanReading = null }) {
  if (humanReading && humanReading.status !== 'none') return null;
  if (spot !== DESK_SPOT || !feedOfKind(config, kind)) return null;
  const cfg = kindOf(config, spot, kind);
  const newest = rows.filter((r) => isAgentRow(r) && ok(r) && r.spot === spot && r.kind === kind).sort(newestFirst)[0];
  if (!cfg || !newest) return null;
  const fact = deskFact(config, newest, now);
  if (!fact) return null;
  if (judgeRow(config, newest, { humans: rows, confirms, now })?.verdict === 'overruled') return null;
  return { ...fact, reportId: newest.id, liveUntil: isoSec(newest.observed_at + cfg.decayMin * MIN) };
}

/* ---------- calls ---------- */

/**
 * Pure: a POST /api/air/desk body, or {reason}. Checks in order:
 * ask  {action:'ask', agent, spot, kind, belief, sourceUrl}: unknown-agent,
 *      bad-spot, not-a-desk-kind, bad-belief (a bucket, never 'cant'),
 *      bad-source-url (safeSourceUrl; the result is the normalized URL).
 * pass {action:'pass', agent, callId, to, reason}: unknown-agent, bad-call
 *      (CALL_ID_RE), unknown-agent (to), bad-pass (to is the agent, or a
 *      reason outside PASS_REASONS).
 * Anything else: bad-json (not an object) or bad-action.
 */
export function parseDeskPost(config, body) {
  if (!isObj(body)) return { reason: 'bad-json' };
  if (body.action === 'ask') {
    const agent = agentOf(config, body.agent);
    if (!agent) return { reason: 'unknown-agent' };
    if (!spotOf(config, body.spot)) return { reason: 'bad-spot' };
    const cfg = kindOf(config, body.spot, body.kind);
    if (!cfg || !isDeskKind(cfg)) return { reason: 'not-a-desk-kind' };
    if (typeof body.belief !== 'string' || body.belief === 'cant' || !cfg.options.some((o) => o.v === body.belief)) return { reason: 'bad-belief' };
    const sourceUrl = safeSourceUrl(body.sourceUrl);
    if (!sourceUrl) return { reason: 'bad-source-url' };
    return { action: 'ask', agent: agent.call, spot: body.spot, kind: body.kind, belief: body.belief, sourceUrl };
  }
  if (body.action === 'pass') {
    const agent = agentOf(config, body.agent);
    if (!agent) return { reason: 'unknown-agent' };
    if (typeof body.callId !== 'string' || !CALL_ID_RE.test(body.callId)) return { reason: 'bad-call' };
    const to = agentOf(config, body.to);
    if (!to) return { reason: 'unknown-agent' };
    if (to.call === agent.call || !PASS_REASONS.includes(body.reason)) return { reason: 'bad-pass' };
    return { action: 'pass', agent: agent.call, callId: body.callId, to: to.call, reason: body.reason };
  }
  return { reason: 'bad-action' };
}

/** {day, askedAt, expiresAt} for a call put out at `now`: expireHours (48) later, inside air_calls' CHECK. */
export function callWindow(config, now) {
  const hours = config.desk?.calls?.expireHours ?? 48;
  return { day: laDate(now), askedAt: now, expiresAt: now + Math.min(hours, 48) * HOUR };
}

/** An air_calls row to INSERT for an ask whose belief row is `reportId`. `id` defaults to newAirId('ac'). */
export function callRowOf(config, { id = newAirId('ac'), agent, spot, kind, reportId, now }) {
  const w = callWindow(config, now);
  return {
    id, spot, kind, asker: agent, holder: agent, report_id: reportId, day: w.day, status: 'open',
    asked_at: w.askedAt, expires_at: w.expiresAt, answered_report_id: null, answered_at: null, relay_json: '[]',
  };
}

/** Whether a call can still be answered at `now`: open and not past expires_at. */
export const isLiveCall = (call, now) => !!call && call.status === 'open' && call.expires_at > now;

/** The live call on a spot+kind, or null: the one a desk-kind report answers (no-open-call without it). */
export function liveCall(calls, spot, kind, now) {
  return (calls ?? []).find((c) => c.spot === spot && c.kind === kind && isLiveCall(c, now)) ?? null;
}

/**
 * Pure: why an ask may not go out now, or null. Checked in order:
 * daily-cap (the asker already put out perAgentPerDay today, LA),
 * spot-busy (openPerSpot live calls on the spot),
 * too-soon (an on-site human answered this spot+kind within its decayMin:
 * `lastHumanAt`, the newest on-site ok non-'cant' report's observed_at, or null).
 */
export function askRefusal(config, { asksToday = 0, openOnSpot = 0, lastHumanAt = null, cfg, now }) {
  const caps = config.desk?.calls ?? {};
  if (asksToday >= (caps.perAgentPerDay ?? 5)) return 'daily-cap';
  if (openOnSpot >= (caps.openPerSpot ?? 1)) return 'spot-busy';
  if (isInt(lastHumanAt) && cfg && now - lastHumanAt < cfg.decayMin * MIN) return 'too-soon';
  return null;
}

/** The relay chain on a call row: [{from, to, reason, at (ms)}], malformed entries dropped. */
export function relayOf(call) {
  let list;
  try { list = JSON.parse(call?.relay_json ?? '[]'); } catch { return []; }
  if (!Array.isArray(list)) return [];
  return list.filter((e) => isObj(e) && CALL_SIGN_RE.test(e.from) && CALL_SIGN_RE.test(e.to) && PASS_REASONS.includes(e.reason) && isInt(e.at));
}

/** Pure: why `agent` may not pass `call` now, or null. not-open (missing, answered, expired), not-holder, pass-cap (maxPasses relays). */
export function canPass(config, { call, agent, now }) {
  if (!isLiveCall(call, now)) return 'not-open';
  if (call.holder !== agent) return 'not-holder';
  if (relayOf(call).length >= (config.desk?.calls?.maxPasses ?? 3)) return 'pass-cap';
  return null;
}

/** The relay_json after a pass: the chain plus {from, to, reason, at}. */
export function passRelay(call, { from, to, reason, at }) {
  return JSON.stringify([...relayOf(call), { from, to, reason, at }]);
}

/** A call's status at `now`: an open call past expires_at reads 'expired' before any sweep. */
export function callStatus(call, now) {
  if (!CALL_STATUSES.includes(call?.status)) return 'expired';
  return call.status === 'open' && call.expires_at <= now ? 'expired' : call.status;
}

/**
 * Pure: a call as pages and the API show it, or null (its kind left config,
 * or the belief row is missing or has an unsafe URL). `belief` is the asker's
 * row {value, source_url} (air_reports where id = call.report_id).
 * → {id, spot, kind, agent (holder), asker, question, belief: {value, label}, sourceHost, sourceUrl, options, status, askedAt, expiresAt, relay}
 */
export function callView(config, call, belief, now) {
  const cfg = kindOf(config, call?.spot, call?.kind);
  const sourceUrl = safeSourceUrl(belief?.source_url);
  if (!cfg || !sourceUrl || typeof belief.value !== 'string') return null;
  return {
    id: call.id, spot: call.spot, kind: call.kind, agent: call.holder, asker: call.asker, question: cfg.question,
    belief: { value: belief.value, label: optionLabelOf(cfg, belief.value) },
    sourceHost: sourceHostOf(sourceUrl), sourceUrl,
    options: cfg.options.map((o) => ({ v: o.v, label: o.label })),
    status: callStatus(call, now), askedAt: isoSec(call.asked_at), expiresAt: isoSec(call.expires_at),
    relay: relayOf(call).map((e) => ({ from: e.from, to: e.to, reason: e.reason, at: isoSec(e.at) })),
  };
}

/** "CALL FROM THE DESK · SOL" for a CallView (the holder). */
export const callHead = (config, view) => deskText(config, 'callHead', { NAME: nameOf(config, view.agent).toUpperCase() });

/** "Sol read {Weekends and school breaks} on citymb.info." as fillParts(): the `label` part is the belief. */
export const beliefParts = (config, view) => fillParts(deskTemplate(config, 'belief'), { name: nameOf(config, view.asker), label: view.belief.label, host: view.sourceHost });

/* ---------- the shift, On time and stamps ---------- */

/**
 * One feed on one morning. On time means filed inside the shift's own window,
 * [SHIFT_HOUR, onTimeBy] LA: the 6 AM cron's run. A resident re-run can't
 * write before the cut (the Worker's POST /run answers too-early), and a row
 * stamped before 6 AM never counts either.
 */
function feedView(config, feed, row, day, now) {
  const cut = onTimeCut(config, day);
  const open = shiftStart(day);
  if (!row) {
    const waiting = now < cut;
    return { feed: feed.id, keeper: feed.keeper, outcome: waiting ? 'waiting' : 'gap', reason: waiting ? null : 'missed', at: null, onTime: false, reportId: null };
  }
  const filed = row.outcome === 'filed';
  return {
    feed: feed.id, keeper: typeof row.agent === 'string' ? row.agent : feed.keeper, outcome: filed ? 'filed' : 'gap',
    reason: filed ? null : GAP_REASONS.includes(row.reason) ? row.reason : 'upstream',
    at: isInt(row.at) ? isoSec(row.at) : null, onTime: filed && isInt(row.at) && row.at >= open && row.at <= cut, reportId: filed ? row.report_id ?? null : null,
  };
}

const rowKey = (day, feed) => `${day}|${feed}`;

/**
 * Pure: GET /api/air/desk's `shift`, today's (LA) feeds in config order.
 * `rows` are air_shift_feeds rows (today's, or more; others are ignored).
 * → {day, onTimeBy, feeds: [{feed, keeper, outcome, reason, at, onTime, reportId}]}
 */
export function shiftView(config, { rows = [], now }) {
  const day = laDate(now);
  const byKey = new Map(rows.filter((r) => r.day === day).map((r) => [rowKey(r.day, r.feed), r]));
  return { day, onTimeBy: config.desk?.onTimeBy ?? '06:15', feeds: (config.desk?.feeds ?? []).map((f) => feedView(config, f, byKey.get(rowKey(day, f.id)), day, now)) };
}

/**
 * Pure: an agent's mornings, oldest first, from its first air_shift_feeds row
 * through today: [{day, feeds: ShiftFeedView[]}] over the feeds it keeps now.
 * A kept feed with no row that morning is a 'missed' gap (a shift that never
 * ran counts); today before onTimeBy it is 'waiting'.
 */
export function agentMornings(config, call, rows, now) {
  const kept = keptFeeds(config, call);
  const mine = (rows ?? []).filter((r) => r.agent === call && DAY_RE.test(r.day) && kept.some((f) => f.id === r.feed));
  if (!kept.length || !mine.length) return [];
  const byKey = new Map(mine.map((r) => [rowKey(r.day, r.feed), r]));
  const today = laDate(now);
  let day = mine.reduce((a, r) => (r.day < a ? r.day : a), mine[0].day);
  const out = [];
  for (let i = 0; day <= today && i < 3660; i++, day = addDay(day)) {
    out.push({ day, feeds: kept.map((f) => feedView(config, f, byKey.get(rowKey(day, f.id)), day, now)) });
  }
  return out;
}

/** A morning is complete once its on-time cut has passed. */
const complete = (config, m, now) => now >= onTimeCut(config, m.day);
/** Counted toward On time: any kept feed that was not blocked. */
const counted = (m) => m.feeds.some((f) => f.reason !== 'blocked');
/** On time (and a Clockwork morning): every non-blocked feed filed by the cut, at least one of them. */
const onTimeMorning = (m) => counted(m) && m.feeds.every((f) => f.reason === 'blocked' || (f.outcome === 'filed' && f.onTime));

/** Pure: On time over complete mornings: {filed: on-time mornings, mornings: mornings with any non-blocked feed}. */
export function onTimeOf(config, mornings, now) {
  const done = mornings.filter((m) => complete(config, m, now) && counted(m));
  return { filed: done.filter(onTimeMorning).length, mornings: done.length };
}

/**
 * Pure: Clockwork stamps over complete mornings (oldest first): consecutive
 * mornings where every kept feed filed by the cut or was blocked, with at
 * least one filed. A level (7, 30, 100) is dated the morning it is first
 * reached and survives any later break. → [{badge: 'clockwork', level, day}]
 */
export function clockworkStamps(config, mornings, now) {
  const levels = AGENT_BADGES.clockwork.levels;
  const out = [];
  let run = 0;
  for (const m of mornings) {
    if (!complete(config, m, now)) break;
    run = onTimeMorning(m) ? run + 1 : 0;
    for (const level of levels) if (run === level && !out.some((s) => s.level === level)) out.push({ badge: 'clockwork', level, day: m.day });
  }
  return out;
}

/** Pure: Checked stamps from judged rows ([{verdict, at}]): the 10th, 50th, 200th 'checked', dated its LA day. */
export function checkedStamps(judged) {
  const times = judged.filter((j) => j?.verdict === 'checked' && isInt(j.at)).map((j) => j.at).sort((a, b) => a - b);
  return AGENT_BADGES.checked.levels.filter((n) => times.length >= n).map((level) => ({ badge: 'checked', level, day: laDate(times[level - 1]) }));
}

/**
 * Pure: /r/agent/[call]'s card, or null for an unknown call sign.
 * - rows: the agent's air_reports rows (source 'agent:<call>'), any status.
 * - humans: on-site human rows of the same spots and kinds, for the judge.
 * - confirms: confirms on the agent's rows.
 * - shift: the agent's air_shift_feeds rows (all of them: Clockwork reads history).
 * - calls: air_calls rows the agent asked.
 * record counts ok rows by verdict (judged = checked + overruled; noHumanCheck = facts);
 * calls.checked counts answered calls whose belief was checked.
 */
export function agentCard(config, { agent: call, rows = [], humans = [], confirms = [], shift = [], calls = [], now }) {
  const agent = agentOf(config, call);
  if (!agent) return null;
  const source = `agent:${agent.call}`;
  const mine = rows.filter((r) => r.source === source && ok(r));
  const verdicts = new Map(mine.map((r) => [r.id, judgeRow(config, r, { humans, confirms, now })]));
  const tally = (v) => [...verdicts.values()].filter((j) => j?.verdict === v).length;
  const checked = tally('checked');
  const overruled = tally('overruled');
  const asked = calls.filter((c) => c.asker === agent.call);
  const answered = asked.filter((c) => c.status === 'answered');
  const mornings = agentMornings(config, agent.call, shift, now);
  const stamps = [...clockworkStamps(config, mornings, now), ...checkedStamps([...verdicts.values()])]
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0) || a.level - b.level);
  return {
    agent: { call: agent.call, name: agent.name, noun: agent.noun ?? null, portrait: portraitOf(agent) },
    keeps: keptFeeds(config, agent.call).map((f) => ({ feed: f.id, name: f.name, kind: f.kind, says: f.says })),
    record: { checked, overruled, judged: checked + overruled, pending: tally('pending'), noHumanCheck: tally('no-check') },
    onTime: onTimeOf(config, mornings, now),
    calls: { asked: asked.length, answered: answered.length, checked: answered.filter((c) => verdicts.get(c.report_id)?.verdict === 'checked').length },
    stamps,
    shiftLog: mornings.slice(-SHIFT_LOG_DAYS).reverse(),
    nightEditor: null,
  };
}

/** "Checked 12, overruled 3 of 15 judged." */
export const recordLine = (config, card) => deskText(config, 'record', card.record);
/** "Filed 27 of 28 mornings by 6:15." */
export const onTimeLine = (config, card) => deskText(config, 'onTime', { ...card.onTime, by: onTimeByLabel(config) });
/** "Put out 3, answered 2, 1 checked." */
export const callsLine = (config, card) => deskText(config, 'calls', card.calls);
/**
 * "42 filed with no human check: Tides, Swell." — the rows nobody can check
 * (fact kinds), named by the fact feeds the agent keeps; '' when there are none.
 */
export function noHumanCheckLine(config, card) {
  const count = card?.record?.noHumanCheck ?? 0;
  if (!isInt(count) || count <= 0) return '';
  const feeds = (card.keeps ?? []).filter((k) => kindRole(kindOf(config, DESK_SPOT, k.kind) ?? {}) === 'fact').map((k) => k.name);
  return feeds.length ? deskText(config, 'noHumanCheck', { count, feeds: feeds.join(', ') }) : deskText(config, 'noHumanCheckBare', { count });
}

/* ---------- the Morning Edition's sky lines ---------- */

/** "cc read KLAX at 6:02: hazy." for the Sky fact (the edition prints it when the marine line is missing), else null. */
export function editionSkyLine(config, fact) {
  if (!fact || fact.feed !== 'sky') return null;
  return deskText(config, 'edition.sky', { byline: fact.byline, label: String(fact.label).toLowerCase() });
}

/** "High tide 7:12 AM, low 1:40 PM (Sol, NOAA)." from the Tides fact's next two events (one ahead: tide1), else null. */
export function editionTideLine(config, fact) {
  const [a, b] = fact?.feed === 'tides' && Array.isArray(fact.detail?.next) ? fact.detail.next : [];
  if (!a) return null;
  const word = (e) => deskTemplate(config, `tideWords.${e.type}`);
  const clock = (e) => laClock(Date.parse(e.at), { ampm: true });
  const first = word(a);
  const vars = { first: first.charAt(0).toUpperCase() + first.slice(1), firstAt: clock(a), name: nameOf(config, fact.agent), says: feedOf(config, 'tides')?.says ?? '' };
  return b ? deskText(config, 'edition.tides', { ...vars, second: word(b), secondAt: clock(b) }) : deskText(config, 'edition.tide1', vars);
}

/* ---------- the Desk Log ---------- */

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Pure: Desk Log lines (deskLog(), newest first) under LA day heads for
 * /r/desk, so a line always says when: [{day, head, lines: [{clock, kind,
 * agent, text}]}]. `head` is 'Today', 'Yesterday' or 'Fri Oct 2'; `clock` the
 * LA time ('6:02'). Lines without a readable `at` are dropped.
 */
export function logDays(lines, now) {
  const today = laDate(now);
  const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - DAY).toISOString().slice(0, 10);
  const out = [];
  for (const l of lines ?? []) {
    const ms = atMs(l?.at);
    if (!Number.isFinite(ms)) continue;
    const p = laParts(ms);
    let group = out.at(-1);
    if (!group || group.day !== p.day) {
      const [, m, d] = p.day.split('-').map(Number);
      const head = p.day === today ? 'Today' : p.day === yesterday ? 'Yesterday' : `${WEEKDAY_NAMES[p.weekday]} ${MONTH_NAMES[m - 1]} ${d}`;
      group = { day: p.day, head, lines: [] };
      out.push(group);
    }
    group.lines.push({ clock: laClock(ms), kind: l.kind, agent: l.agent, text: l.text });
  }
  return out;
}

const LOG_RANK = Object.fromEntries(LOG_KINDS.map((k, i) => [k, i]));

/**
 * Pure: the Desk Log, newest first, `limit` lines (50). Every line is a
 * config template filled with names, spots, feeds and labels; people are
 * never named ("answered on site").
 * - shift rows ({day, feed, agent, outcome, reason, report_id, at, value?}):
 *   'filed' (with the bucket label when `value` is joined in) or 'gap'.
 * - call rows: 'ask' at asked_at, a 'pass' per relay entry, 'answer' at
 *   answered_at, 'expire' at expires_at once passed unanswered.
 * Lines after `now` are left out. → [{at, kind, agent, spot, text}]
 */
export function deskLog(config, { shift = [], calls = [], now, limit = LOG_SIZE }) {
  const lines = [];
  const push = (at, kind, agent, spot, text) => { if (isInt(at) && at <= now) lines.push({ at, kind, agent, spot, text }); };
  const spotName = (id) => spotOf(config, id)?.name ?? String(id);
  for (const r of shift) {
    const feed = feedOf(config, r.feed);
    if (!feed) continue;
    const name = nameOf(config, r.agent);
    if (r.outcome === 'filed') {
      const cfg = kindOf(config, DESK_SPOT, feed.kind);
      const has = cfg && typeof r.value === 'string' && cfg.options.some((o) => o.v === r.value);
      push(r.at, 'filed', r.agent, DESK_SPOT, has
        ? deskText(config, 'log.filed', { name, feed: feed.name, label: optionLabelOf(cfg, r.value) })
        : deskText(config, 'log.filedBare', { name, feed: feed.name }));
    } else if (r.outcome === 'gap') {
      const reason = GAP_REASONS.includes(r.reason) ? r.reason : 'upstream';
      // A blocked feed is a house gap (no key yet), never worded as the keeper's miss.
      push(r.at, 'gap', r.agent, DESK_SPOT, reason === 'blocked'
        ? deskText(config, 'log.blocked', { name, feed: feed.name })
        : deskText(config, 'log.gap', { name, feed: feed.name, reason: deskTemplate(config, `gapReasons.${reason}`) }));
    }
  }
  for (const c of calls) {
    const cfg = kindOf(config, c.spot, c.kind);
    if (!cfg) continue;
    const spot = spotName(c.spot);
    push(c.asked_at, 'ask', c.asker, c.spot, deskText(config, 'log.ask', { name: nameOf(config, c.asker), spot, question: cfg.question }));
    for (const e of relayOf(c)) {
      push(e.at, 'pass', e.from, c.spot, deskText(config, 'log.pass', {
        name: nameOf(config, e.from), spot, to: nameOf(config, e.to), reason: deskTemplate(config, `passReasons.${e.reason}`),
      }));
    }
    if (c.status === 'answered') push(c.answered_at, 'answer', c.holder, c.spot, deskText(config, 'log.answer', { name: nameOf(config, c.holder), spot }));
    else if (isInt(c.expires_at) && c.expires_at <= now) push(c.expires_at, 'expire', c.holder, c.spot, deskText(config, 'log.expire', { name: nameOf(config, c.holder), spot }));
  }
  return lines
    .sort((a, b) => b.at - a.at || LOG_RANK[b.kind] - LOG_RANK[a.kind])
    .slice(0, limit)
    .map((l) => ({ at: isoSec(l.at), kind: l.kind, agent: l.agent, spot: l.spot, text: l.text }));
}
