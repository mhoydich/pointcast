import bundledSnapshot from '../data/business-feels-snapshot.json' with { type: 'json' };

export const SCHEMA_VERSION = 'pointcast.business-feels/v1';
export const SOURCE_LIMITS = Object.freeze({ timeoutMs: 5000, maxBytes: 2_000_000, stateMaxBytes: 1_000_000, cacheRetentionSeconds: 2_592_000 });
export const BLS_SERIES = Object.freeze(['CUUR0000SA0', 'LNS14000000', 'CES0000000001']);
export const TREASURY_TENORS = Object.freeze([
  { field: 'BC_3MONTH', tenor: '3m', years: 0.25 },
  { field: 'BC_2YEAR', tenor: '2y', years: 2 },
  { field: 'BC_5YEAR', tenor: '5y', years: 5 },
  { field: 'BC_10YEAR', tenor: '10y', years: 10 },
  { field: 'BC_30YEAR', tenor: '30y', years: 30 },
]);
const DAY_MS = 86400000;
const ECB_DAILY = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const ECB_HISTORY = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml';
const treasuryUrl = (year) => `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`;
const treasurySourceUrl = (date) => `https://home.treasury.gov/resource-center-data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=${date.slice(0, 4)}`;
const isoNow = (now = new Date()) => new Date(now).toISOString();
const clone = (value) => JSON.parse(JSON.stringify(value));

export function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function dateAge(date, now) {
  return Math.max(0, (Date.parse(isoNow(now)) - Date.parse(date)) / DAY_MS);
}
function assertXml(xml) {
  if (typeof xml !== 'string' || xml.length > SOURCE_LIMITS.maxBytes || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid or oversized public XML response');
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:.-]+)\s*=\s*(['"])(.*?)\2/g)].map((match) => [match[1], match[3]]));
}
function finiteNumber(value) {
  if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Dated EUR-base tables. No interpolation, mixing of dates, or executable quotes. */
export function parseEcbXml(xml) {
  assertXml(xml);
  const rows = [];
  for (const match of xml.matchAll(/<(?:[\w.-]+:)?Cube\b([^>]*\btime\s*=\s*['"][^'"]+['"][^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?Cube\s*>/g)) {
    const date = attributes(match[1]).time;
    if (!isDate(date)) throw new Error('Invalid ECB observation date');
    const rates = { EUR: 1 };
    for (const cube of match[2].matchAll(/<(?:[\w.-]+:)?Cube\b([^>]*)\/>/g)) {
      const entry = attributes(cube[1]);
      const rate = finiteNumber(entry.rate);
      if (!/^[A-Z]{3}$/.test(entry.currency ?? '') || entry.currency === 'EUR' || rate === null || rate <= 0 || rates[entry.currency] !== undefined) throw new Error('Invalid ECB reference rate');
      rates[entry.currency] = rate;
    }
    if (Object.keys(rates).length < 2) throw new Error('Empty ECB reference table');
    rows.push({ date, rates });
  }
  if (!rows.length || rows.length > 100) throw new Error('No bounded ECB reference observations');
  const dates = new Set(rows.map((row) => row.date));
  if (dates.size !== rows.length) throw new Error('Duplicate ECB observation date');
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
function xmlValue(entry, field) {
  const match = entry.match(new RegExp(`<(?:(?:[\\w.-]+):)?${field}\\b([^>]*)>([^<]*)<\\/(?:(?:[\\w.-]+):)?${field}\\s*>`));
  if (!match || /(?:m:)?null\s*=\s*['"]true['"]/.test(match[1])) return null;
  return match[2].trim();
}

/** Treasury daily par yields in percent. Every curve retains its own observation date. */
export function parseTreasuryXml(xml) {
  assertXml(xml);
  const rows = [];
  for (const match of xml.matchAll(/<(?:[\w.-]+:)?entry\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?entry\s*>/g)) {
    const rawDate = xmlValue(match[1], 'NEW_DATE');
    const date = rawDate?.slice(0, 10);
    if (!isDate(date)) continue;
    const points = TREASURY_TENORS.flatMap((tenor) => {
      const value = finiteNumber(xmlValue(match[1], tenor.field));
      return value !== null && value >= -5 && value <= 50 ? [{ tenor: tenor.tenor, years: tenor.years, value }] : [];
    });
    if (points.some((point) => point.tenor === '2y') && points.some((point) => point.tenor === '10y')) rows.push({ date, points });
  }
  if (!rows.length || rows.length > 370) throw new Error('No bounded Treasury yield observations');
  if (new Set(rows.map((row) => row.date)).size !== rows.length) throw new Error('Duplicate Treasury observation date');
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/** Offline/manual BLS adapter. The public route never calls the quota-limited v1 API. */
export function parseBls(data) {
  if (!data || data.status !== 'REQUEST_SUCCEEDED' || !Array.isArray(data.Results?.series)) throw new Error('BLS request did not succeed');
  const parsed = {};
  for (const series of data.Results.series) {
    if (!BLS_SERIES.includes(series.seriesID) || !Array.isArray(series.data)) continue;
    const rows = series.data.flatMap((row) => {
      if (!/^M(0[1-9]|1[0-2])$/.test(row.period) || !/^\d{4}$/.test(row.year)) return [];
      const date = `${row.year}-${row.period.slice(1)}-01`;
      const value = finiteNumber(row.value);
      if (!isDate(date) || value === null) return [];
      const preliminary = (row.footnotes ?? []).some((note) => /preliminary/i.test(note.text ?? '') || note.code === 'P');
      return [{ date, value, preliminary }];
    }).sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length || new Set(rows.map((row) => row.date)).size !== rows.length) throw new Error('Missing or duplicate BLS observations');
    parsed[series.seriesID] = rows;
  }
  if (BLS_SERIES.some((id) => !parsed[id])) throw new Error('Missing required BLS series');
  const cpi = parsed.CUUR0000SA0;
  const cpiByDate = new Map(cpi.map((row) => [row.date, row.value]));
  const inflation = cpi.flatMap((row) => {
    const prior = cpiByDate.get(`${Number(row.date.slice(0, 4)) - 1}${row.date.slice(4)}`);
    return prior > 0 ? [{ date: row.date, value: Number(((row.value / prior - 1) * 100).toFixed(3)) }] : [];
  });
  const payroll = parsed.CES0000000001;
  const payrollByDate = new Map(payroll.map((row) => [row.date, row]));
  const changes = payroll.flatMap((row) => {
    const previous = new Date(`${row.date}T00:00:00Z`);
    previous.setUTCMonth(previous.getUTCMonth() - 1);
    const prior = payrollByDate.get(previous.toISOString().slice(0, 10));
    return prior ? [{ date: row.date, value: row.value - prior.value, preliminary: row.preliminary || prior.preliminary }] : [];
  });
  return { 'us-cpi-yoy': inflation, 'us-unemployment': parsed.LNS14000000, 'us-payroll-change': changes };
}

export function signalStatus(signal, now = new Date(), source) {
  if (signal.status === 'setup-required') return 'setup-required';
  if (signal.value === null || signal.value === undefined || !isDate(signal.observationDate)) return 'unavailable';
  const date = signal.category === 'policy' ? signal.lastSuccessAt : signal.observationDate;
  if (!date || dateAge(date, now) > signal.staleAfterDays || source?.lastError) return 'stale';
  return signal.delivery === 'runtime' ? 'fresh' : 'snapshot';
}
function evaluateSnapshot(input, now) {
  const result = clone(input);
  result.generatedAt = isoNow(now);
  for (const source of result.sourceHealth) {
    if (source.status === 'setup-required') continue;
    const associated = result.series.filter((series) => series.sourceId === source.id);
    const dated = associated.filter((series) => series.value !== null);
    let isStale = false;
    for (const series of dated) {
      series.status = signalStatus(series, now, source);
      if (series.status === 'stale') isStale = true;
    }
    if (source.id === 'ecb-fx' && result.fx?.date) {
      const stale = dateAge(result.fx.date, now) > result.fx.staleAfterDays || Boolean(source.lastError);
      result.fx.status = stale ? 'stale' : result.fx.delivery === 'runtime' ? 'fresh' : 'snapshot';
      isStale ||= stale;
    }
    if (source.id === 'treasury' && result.yieldCurve) {
      result.yieldCurve.status = isStale ? 'stale' : result.yieldCurve.delivery === 'runtime' ? 'fresh' : 'snapshot';
    }
    const hasValue = dated.length || (source.id === 'ecb-fx' && result.fx?.date);
    source.status = hasValue ? isStale || source.lastError ? 'stale' : source.delivery === 'runtime' ? 'fresh' : 'snapshot' : 'unavailable';
    if (isStale && !source.lastError) source.reason = 'The dated observation or manual verification exceeds this feed’s freshness threshold.';
  }
  result.mode = result.sourceHealth.some((source) => source.delivery === 'runtime') ? 'mixed' : 'snapshot';
  return result;
}
export function getSnapshot(now = new Date()) {
  return evaluateSnapshot(bundledSnapshot, now);
}

export async function readBoundedResponse(response, maxBytes = SOURCE_LIMITS.maxBytes) {
  const size = Number(response.headers.get('Content-Length'));
  if (Number.isFinite(size) && size > maxBytes) {
    await response.body?.cancel();
    throw new Error('Public source response exceeds byte limit');
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let sizeRead = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sizeRead += value.byteLength;
      if (sizeRead > maxBytes) throw new Error('Public source response exceeds byte limit');
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
async function publicRead(url, fetcher, year, timeoutMs) {
  const allowed = [ECB_DAILY, ECB_HISTORY, treasuryUrl(year), treasuryUrl(year - 1)];
  if (!allowed.includes(url)) throw new Error('Public source URL is not allowlisted');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { method: 'GET', redirect: 'error', signal: controller.signal, headers: { Accept: 'application/xml,text/xml', 'User-Agent': 'PointCast-Business-Feels/1.0 (+https://pointcast.xyz/business-feels)' } });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Public source returned HTTP ${response.status}`);
    }
    return await readBoundedResponse(response);
  } finally {
    clearTimeout(timeout);
  }
}
const errorMessage = (error) => error?.name === 'AbortError' ? 'Public source timed out' : String(error?.message ?? 'Public source request failed').slice(0, 200);
function markSuccess(source, at, reason) {
  Object.assign(source, { fetchedAt: at, lastSuccessAt: at, lastAttemptAt: at, lastError: null, delivery: 'runtime', reason });
}
function markFailure(source, at, error) {
  source.lastAttemptAt = at;
  source.lastError = { at, message: errorMessage(error) };
  source.reason = 'Refresh failed. The last successful dated observation is retained when available.';
}
// Advisory cached retry intervals only: concurrent misses can duplicate fixed public reads.
function due(source, now) {
  return !source.lastAttemptAt || Date.parse(isoNow(now)) - Date.parse(source.lastAttemptAt) >= source.cacheSeconds * 1000;
}
function currentRows(rows, now) {
  const current = rows.filter((row) => row.date <= isoNow(now).slice(0, 10));
  if (!current.length) throw new Error('Public source contains no observation on or before today');
  return current;
}

/** Only ECB/Treasury are network-enabled. No user URLs, keys, accounts, or writes upstream. */
export async function refreshSignals(input = getSnapshot(), options = {}) {
  const now = options.now ?? new Date();
  const at = isoNow(now);
  const year = new Date(now).getUTCFullYear();
  const fetcher = options.fetch ?? globalThis.fetch;
  const timeoutMs = Math.min(options.timeoutMs ?? SOURCE_LIMITS.timeoutMs, SOURCE_LIMITS.timeoutMs);
  const result = evaluateSnapshot(input, now);
  const jobs = [];
  const fxSource = result.sourceHealth.find((source) => source.id === 'ecb-fx');
  if (fxSource?.runtimeEnabled && due(fxSource, now)) jobs.push((async () => {
    const reads = await Promise.allSettled([ECB_DAILY, ECB_HISTORY].map(async (url) => currentRows(parseEcbXml(await publicRead(url, fetcher, year, timeoutMs)), now)));
    const valid = reads.flatMap((read) => read.status === 'fulfilled' ? read.value : []);
    if (!valid.length) { markFailure(fxSource, at, reads[0].reason); return; }
    const latestRead = valid.reduce((latest, row) => row.date > latest.date ? row : latest);
    if (result.fx?.date && latestRead.date < result.fx.date) { markFailure(fxSource, at, new Error('ECB returned an older observation; last good reference table retained')); return; }
    const unique = new Map((result.fx?.history ?? []).filter((row) => row.date <= at.slice(0, 10)).map((row) => [row.date, row]));
    for (const row of valid) unique.set(row.date, row);
    const cutoff = new Date(Date.parse(latestRead.date) - 90 * DAY_MS).toISOString().slice(0, 10);
    const history = [...unique.values()].filter((row) => row.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date)).slice(-70);
    const latest = history.at(-1);
    if (['USD', 'GBP', 'JPY'].some((currency) => !latest.rates[currency])) { markFailure(fxSource, at, new Error('Incomplete ECB reference table')); return; }
    result.fx = { ...result.fx, base: 'EUR', date: latest.date, observationDate: latest.date, rates: latest.rates, history, sourceId: 'ecb-fx', sourceUrl: fxSource.sourceUrl, status: 'fresh', fetchedAt: at, lastSuccessAt: at, staleAfterDays: 5, delivery: 'runtime', disclaimer: 'Dated ECB reference rates for information only; not executable transaction quotes.' };
    markSuccess(fxSource, at, 'Keyless ECB reference table; observation dates stay unchanged over weekends and TARGET closing days.');
    const failed = reads.find((read) => read.status === 'rejected');
    if (failed) { fxSource.lastError = { at, message: errorMessage(failed.reason) }; fxSource.reason = 'A reference feed failed; available dated observations are retained. History may be incomplete.'; }
  })());
  const treasurySource = result.sourceHealth.find((source) => source.id === 'treasury');
  if (treasurySource?.runtimeEnabled && due(treasurySource, now)) jobs.push((async () => {
    try {
      let rows;
      try { rows = currentRows(parseTreasuryXml(await publicRead(treasuryUrl(year), fetcher, year, timeoutMs)), now); }
      catch (error) {
        // A year can open on a market holiday before any current-year observation exists.
        if (at.slice(5, 10) > '01-07') throw error;
        rows = currentRows(parseTreasuryXml(await publicRead(treasuryUrl(year - 1), fetcher, year, timeoutMs)), now);
      }
      const latest = rows.at(-1);
      if (result.yieldCurve?.date && latest.date < result.yieldCurve.date) throw new Error('Treasury returned an older observation; last good curve retained');
      rows = rows.slice(-65);
      treasurySource.sourceUrl = treasurySourceUrl(latest.date);
      result.yieldCurve = { date: latest.date, points: latest.points, sourceId: 'treasury', sourceUrl: treasurySource.sourceUrl, status: 'fresh', fetchedAt: at, lastSuccessAt: at, delivery: 'runtime' };
      for (const tenor of TREASURY_TENORS) {
        const series = result.series.find((series) => series.id === `treasury-${tenor.tenor}`);
        const newHistory = rows.flatMap((row) => {
          const point = row.points.find((point) => point.tenor === tenor.tenor);
          return point ? [{ date: row.date, value: point.value }] : [];
        });
        const byDate = new Map((series?.history ?? []).filter((row) => row.date <= at.slice(0, 10)).map((row) => [row.date, row]));
        for (const row of newHistory) byDate.set(row.date, row);
        const history = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-65);
        if (series && newHistory.length) Object.assign(series, { history, sourceUrl: treasurySourceUrl(history.at(-1).date), observationDate: history.at(-1).date, value: history.at(-1).value, fetchedAt: at, lastSuccessAt: at, delivery: 'runtime' });
      }
      markSuccess(treasurySource, at, 'Keyless U.S. Treasury daily par yields; the curve uses one observation date.');
    } catch (error) { markFailure(treasurySource, at, error); }
  })());
  await Promise.all(jobs);
  return evaluateSnapshot(result, now);
}

export function convertFx(fx, amount, from, to) {
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12 || !isDate(fx?.date)) throw new RangeError('Enter a finite nonnegative amount and a dated reference table');
  const fromRate = fx.rates?.[from];
  const toRate = fx.rates?.[to];
  if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) throw new RangeError('Currency is unavailable in this dated reference table');
  const rate = toRate / fromRate;
  return { amount, from, to, convertedAmount: amount * rate, rate, observationDate: fx.date, sourceId: fx.sourceId, disclaimer: 'Information only. Fees, spreads and executable quotes are excluded.' };
}
export function rateScenario({ principal, annualRatePercent, years }) {
  if (!Number.isFinite(principal) || principal <= 0 || principal > 1e9 || !Number.isFinite(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100 || !Number.isFinite(years) || years <= 0 || years > 50 || !Number.isInteger(years * 12)) throw new RangeError('Use a positive principal, a rate from 0 to 100%, and a term of 1 to 600 whole months');
  const months = years * 12;
  const rate = annualRatePercent / 1200;
  const denominator = rate === 0 ? 0 : -Math.expm1(-months * Math.log1p(rate));
  const monthlyPayment = rate === 0 ? principal / months : principal * (rate / denominator);
  const totalPaid = Math.max(principal, monthlyPayment * months);
  return { principal, annualRatePercent, years, monthlyPayment, totalPaid, totalInterest: totalPaid - principal, assumptions: ['Fixed rate with equal monthly payments.', 'Illustrative input, not a current mortgage quote.', 'Taxes, insurance, fees, points, and early repayments are excluded.'] };
}

const validTimestamp = (value) => value === null || typeof value === 'string' && Number.isFinite(Date.parse(value));
const validRates = (rates) => rates && typeof rates === 'object' && !Array.isArray(rates) && rates.EUR === 1 && Object.entries(rates).every(([currency, rate]) => /^[A-Z]{3}$/.test(currency) && Number.isFinite(rate) && rate > 0);
const validHistory = (history) => Array.isArray(history) && history.length <= 1000 && history.every((row) => row && isDate(row.date) && Number.isFinite(row.value));
/** Cached JSON is expendable: accept only the normalized fixed feed contract, otherwise use the bundle. */
export function isSignalSet(state) {
  if (!state || state.schemaVersion !== SCHEMA_VERSION || !Array.isArray(state.series) || !Array.isArray(state.sourceHealth) || !Array.isArray(state.disclosures)) return false;
  const expectedSources = bundledSnapshot.sourceHealth.map((source) => source.id);
  if (state.sourceHealth.length !== expectedSources.length || new Set(state.sourceHealth.map((source) => source?.id)).size !== expectedSources.length) return false;
  if (!state.sourceHealth.every((source) => source && expectedSources.includes(source.id) && typeof source.reason === 'string' && typeof source.runtimeEnabled === 'boolean' && Number.isFinite(source.cacheSeconds) && source.cacheSeconds >= 0 && source.cacheSeconds <= 86400 && validTimestamp(source.fetchedAt) && validTimestamp(source.lastSuccessAt) && validTimestamp(source.lastAttemptAt) && (source.lastError === null || source.lastError && validTimestamp(source.lastError.at) && typeof source.lastError.message === 'string'))) return false;
  const expectedSeries = bundledSnapshot.series.map((series) => series.id);
  if (state.series.length !== expectedSeries.length || new Set(state.series.map((series) => series?.id)).size !== expectedSeries.length) return false;
  if (!state.series.every((series) => series && expectedSeries.includes(series.id) && expectedSources.includes(series.sourceId) && typeof series.title === 'string' && typeof series.unit === 'string' && Number.isFinite(series.staleAfterDays) && series.staleAfterDays > 0 && series.staleAfterDays <= 365 && (series.value === null || Number.isFinite(series.value) && isDate(series.observationDate)) && validTimestamp(series.fetchedAt) && validTimestamp(series.lastSuccessAt) && validHistory(series.history))) return false;
  if (state.fx !== null && (!state.fx || !isDate(state.fx.date) || !validRates(state.fx.rates) || !Array.isArray(state.fx.history) || state.fx.history.length > 100 || !state.fx.history.every((row) => row && isDate(row.date) && validRates(row.rates)) || !Number.isFinite(state.fx.staleAfterDays) || state.fx.staleAfterDays <= 0 || !validTimestamp(state.fx.fetchedAt) || !validTimestamp(state.fx.lastSuccessAt))) return false;
  if (state.yieldCurve !== null && (!state.yieldCurve || !isDate(state.yieldCurve.date) || !Array.isArray(state.yieldCurve.points) || state.yieldCurve.points.length > TREASURY_TENORS.length || !state.yieldCurve.points.every((point) => point && TREASURY_TENORS.some((tenor) => tenor.tenor === point.tenor && tenor.years === point.years) && Number.isFinite(point.value)))) return false;
  return true;
}

export async function handleBusinessFeels(request, options = {}) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(JSON.stringify({ error: 'read-only-endpoint' }), { status: 405, headers: { ...headers, Allow: 'GET, HEAD, OPTIONS', 'Cache-Control': 'no-store' } });
  const now = options.now ?? new Date();
  const url = new URL(request.url);
  // Query parameters, cookies and client-supplied headers never alter cache keys or upstream URLs.
  let baseline = getSnapshot(now);
  // A reviewed evidence update starts a new cache generation, even if old entries stay warm.
  const key = new Request(`${url.origin}/api/business-feels/_cache/v1/${encodeURIComponent(baseline.verifiedAt)}`);
  let cacheError = null;
  if (options.cache) {
    try {
      const stored = await options.cache.match(key);
      if (stored) {
        const state = JSON.parse(await readBoundedResponse(stored, SOURCE_LIMITS.stateMaxBytes));
        if (!isSignalSet(state) || state.verifiedAt !== baseline.verifiedAt) throw new Error('Invalid public feed cache shape or evidence version');
        baseline = evaluateSnapshot(state, now);
      }
    } catch { cacheError = 'Stored public feed cache was unavailable; bundled dated observations were used.'; }
  }
  const result = await refreshSignals(baseline, { fetch: options.fetch, now, timeoutMs: options.timeoutMs });
  result.cache = { kind: options.cache ? 'best-effort-per-data-center' : 'none', retentionSeconds: SOURCE_LIMITS.cacheRetentionSeconds, error: cacheError, limitation: 'Concurrent cold misses or eviction can duplicate upstream reads. Another data center or eviction can fall back to bundled evidence. This cache is not durable storage and provides no hard per-data-center or global API quota cap.' };
  if (options.cache) {
    try {
      await options.cache.put(key, new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${SOURCE_LIMITS.cacheRetentionSeconds}` } }));
    } catch { result.cache.error = 'Public feed cache could not retain this response; bundled dated evidence remains the fallback.'; }
  }
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(result), { headers });
}
