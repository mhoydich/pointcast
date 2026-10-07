import { statusAt, formatLocalTime, metresToFeet, compassPoint, waveModel, describeMorning, trendSegments } from './model.mjs';

const $ = (id) => document.getElementById(id);
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const numberText = (value, digits = 1) => finite(value) ? value.toFixed(digits) : '—';
const observedValue = (value, allowZero = true) => finite(value) && (allowZero ? value >= 0 : value > 0) ? value : null;
const sourceNumber = (value) => finite(value) ? value.toFixed(1) : 'Unavailable';
const setText = (id, text) => { const node = $(id); if (node.textContent !== text) node.textContent = text; };
const setTime = (id, value) => {
  const node = $(id);
  node.textContent = validDate(value) ? formatLocalTime(value) : 'Unavailable';
  if (validDate(value)) node.dateTime = value;
  else node.removeAttribute('datetime');
};

let packet = null;
let origin = null;
let unit = 'ft';
let busy = false;
let failedRefresh = false;
let failureText = '';
let retentionNotice = '';
let lastAttemptAt = 0;
let liveSucceeded = false;
let snapshotSettled = false;
let currentStatus = { state: 'unavailable', ageMinutes: null };
let currentModel = { wavelengthM: null, phaseSpeedMS: null, travelDeg: null };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let wantsMotion = !reducedMotion.matches;
let motionChosen = false;
let frame = null;
let frameTime = null;
let elapsed = 0;
let canvasWidth = 0;
let canvasHeight = 0;
const canvas = $('ocean-canvas');
const context = canvas.getContext('2d');

function usablePacket(value) {
  return value && value.schemaVersion === 'pointcast-waves-v1' && value.station?.id === '46221' &&
    (value.observation === null || (typeof value.observation === 'object' && !Array.isArray(value.observation))) &&
    Array.isArray(value.history) && value.upstream && ['ok', 'failed'].includes(value.upstream.status);
}

function observationTime(value) {
  const observation = value?.observation;
  return observation && validDate(observation.observedAt) && statusAt(observation).state !== 'unavailable' ? Date.parse(observation.observedAt) : null;
}

function acceptPacket(next, nextOrigin, replaceEqual = false) {
  const nextTime = observationTime(next);
  const previousTime = observationTime(packet);
  const newer = nextTime !== null && (previousTime === null || nextTime > previousTime || (replaceEqual && nextTime === previousTime));
  if (!packet || newer) {
    // Keep the chosen packet intact: its observation, history and retrieval belong together.
    packet = next;
    origin = nextOrigin;
    return true;
  }
  return false;
}

async function getJSON(url, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = await response.json();
    if (!usablePacket(value)) throw new Error('The response did not contain a valid buoy report.');
    return value;
  } finally { clearTimeout(timer); }
}

async function loadSavedObservation() {
  try {
    const saved = await getJSON('/waves/snapshot.json', 7000);
    if (acceptPacket(saved, 'saved')) {
      if (liveSucceeded) retentionNotice = 'The saved report contains a newer observation than the feed response. Showing that saved report with its original timestamps.';
      render();
    }
  } catch { /* The live request can still supply the observation. */ }
  finally {
    snapshotSettled = true;
    if (!packet && !busy) render();
  }
}

async function refresh() {
  if (busy) return;
  busy = true;
  lastAttemptAt = Date.now();
  $('refresh').disabled = true;
  $('refresh').setAttribute('aria-busy', 'true');
  $('refresh').querySelector('span').textContent = 'Checking…';
  try {
    const next = await getJSON('/api/waves');
    if (next.upstream.status !== 'ok') {
      acceptPacket(next, 'saved');
      throw new Error('The upstream buoy feed is unavailable.');
    }
    const accepted = acceptPacket(next, 'api', true);
    retentionNotice = accepted ? '' : observationTime(next) === null ? 'The refreshed feed contains no usable dated observation. Keeping the last known report and its original timestamps.' : 'The feed returned an earlier observation. Keeping the newer dated report already shown, with its original timestamps.';
    liveSucceeded = true;
    failedRefresh = false;
    failureText = '';
  } catch (error) {
    failedRefresh = true;
    failureText = error.name === 'AbortError' ? 'The request timed out.' : 'The buoy feed could not be refreshed.';
  } finally {
    busy = false;
    $('refresh').disabled = false;
    $('refresh').removeAttribute('aria-busy');
    $('refresh').querySelector('span').textContent = 'Refresh';
    render();
  }
}

function ageText(age) {
  if (!finite(age)) return 'age unavailable';
  const rounded = Math.max(0, Math.floor(age));
  if (rounded < 1) return 'less than a minute old';
  if (rounded < 60) return `${rounded} min old`;
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ''} old`;
}

function render() {
  const observation = packet?.observation ?? null;
  currentStatus = statusAt(observation);
  currentModel = waveModel(observation);
  renderStatus();
  renderMetrics(observation);
  renderHistory();
  setTime('retrieved-time', packet?.retrievedAt);
  setTime('assembled-time', packet?.assembledAt);
  renderMotion();
  drawOcean();
}

function renderStatus() {
  const state = currentStatus.state;
  const loading = !packet && (busy || !snapshotSettled);
  $('status-chip').dataset.state = loading ? 'loading' : state;
  $('ocean-window').dataset.state = loading ? 'loading' : state;
  let label = loading ? 'Loading observation' : 'Observation unavailable';
  if (packet && state !== 'unavailable') {
    const names = { fresh: 'Fresh', delayed: 'Delayed', stale: 'Stale', expired: 'Expired' };
    label = `${origin === 'saved' ? 'Saved · ' : ''}${names[state]} · ${ageText(currentStatus.ageMinutes)}`;
  }
  setText('status-label', label);
  if (loading) {
    setText('morning-summary', 'Reading the latest offshore observation…');
    setText('scene-kicker', 'Waiting for the buoy');
    $('scene-title').innerHTML = 'The Pacific<br>sets the pace.';
    setText('scene-observation', 'No measurement has been inferred.');
  } else if (!packet || state === 'unavailable') {
    setText('morning-summary', 'A usable offshore wave observation is unavailable. The station links and field notes are here to explore.');
    setText('scene-kicker', 'No usable wave observation');
    $('scene-title').innerHTML = 'The ocean keeps<br>its own time.';
    setText('scene-observation', 'A static original illustration. No current conditions are inferred.');
  } else {
    let summary = describeMorning(packet);
    if (origin === 'saved') summary = `Saved observation. ${summary}`;
    if (state === 'expired') summary = `Expired observation — ${formatLocalTime(packet.observation.observedAt)}. Motion is paused; these values do not describe current conditions.`;
    setText('morning-summary', summary);
    setText('scene-kicker', state === 'expired' ? 'A dated offshore observation' : origin === 'saved' ? 'From the saved buoy observation' : 'From the latest usable buoy observation');
    $('scene-title').innerHTML = state === 'expired' ? 'A moment,<br>held in time.' : 'The Pacific<br>sets the pace.';
    setText('scene-observation', `Observed ${formatLocalTime(packet.observation.observedAt)}. An approximate view of the measured sea state.`);
  }
  const banner = $('request-banner');
  banner.hidden = !failedRefresh && !retentionNotice && origin !== 'saved';
  if (failedRefresh) setText('request-banner', packet ? `${failureText} Keeping the last known observation and its original timestamp. Use Refresh to try again.` : `${failureText} No observation is available. Try Refresh or open the official NOAA station.`);
  else if (retentionNotice) setText('request-banner', retentionNotice);
  else if (origin === 'saved') setText('request-banner', busy ? 'Showing a saved, dated observation while the current buoy feed is checked. Its age is measured from the observation time.' : 'Showing a saved, dated observation with its original observation and retrieval times.');
}

function renderMetrics(observation) {
  const height = observedValue(observation?.heightM);
  const period = observedValue(observation?.dominantPeriodS, false);
  const averagePeriod = observedValue(observation?.averagePeriodS, false);
  const direction = finite(observation?.directionFromDeg) && observation.directionFromDeg >= 0 && observation.directionFromDeg <= 360 ? observation.directionFromDeg % 360 : null;
  const temperature = finite(observation?.waterTempC) ? observation.waterTempC : null;
  setText('height-value', numberText(height === null ? null : unit === 'ft' ? metresToFeet(height) : height));
  setText('height-unit', unit);
  setText('height-detail', height === null ? 'Unavailable in this observation' : `${numberText(unit === 'ft' ? height : metresToFeet(height))} ${unit === 'ft' ? 'metres' : 'feet'} · statistical sea-state height`);
  setText('period-value', numberText(period));
  setText('period-detail', period === null ? 'Unavailable in this observation' : averagePeriod === null ? 'Average period unavailable' : `${numberText(averagePeriod)} s average period`);
  setText('direction-value', direction === null ? '—' : compassPoint(direction));
  setText('direction-detail', direction === null ? 'Unavailable in this observation' : `${numberText(direction, 0)}° true · arriving from`);
  setText('temperature-value', numberText(temperature === null ? null : temperature * 9 / 5 + 32));
  setText('temperature-detail', temperature === null ? 'Unavailable in this observation' : `${numberText(temperature)} °C · offshore, at the buoy`);
  setTime('observed-time', observation?.observedAt);
  const windSpeed = observedValue(observation?.windSpeedMS);
  const windDirection = finite(observation?.windDirectionDeg) && observation.windDirectionDeg >= 0 && observation.windDirectionDeg <= 360 ? observation.windDirectionDeg % 360 : null;
  const gust = observedValue(observation?.gustMS);
  let wind = 'Unavailable from this wave-buoy report';
  if (windSpeed !== null) {
    wind = `${numberText(windSpeed)} m/s${windDirection === null ? ' · direction unavailable' : ` from ${compassPoint(windDirection)} (${numberText(windDirection, 0)}°)`}`;
    wind += gust === null ? ' · gust unavailable' : ` · gust ${numberText(gust)} m/s`;
  }
  setText('wind-reading', wind);
  const modelValid = finite(currentModel.wavelengthM) && finite(currentModel.phaseSpeedMS);
  setText('model-reading', modelValid ? `Approximate deep-water model: ${Math.round(currentModel.wavelengthM)} m wavelength · ${numberText(currentModel.phaseSpeedMS)} m/s phase speed. Spacing and relief are drawn to fit the study, not to scale.` : 'A model wavelength and speed need a valid dominant period.');
  const travel = currentModel.travelDeg;
  const arrow = $('travel-arrow');
  if (finite(travel) && direction !== null) {
    arrow.setAttribute('visibility', 'visible');
    arrow.setAttribute('transform', `rotate(${travel} 56 56)`);
    setText('compass-caption', `Traveling ${compassPoint(travel)} · ${numberText(travel, 0)}°`);
  } else {
    arrow.setAttribute('visibility', 'hidden');
    setText('compass-caption', 'Travel direction unavailable');
  }
  const description = height !== null && period !== null ? `Original north-up schematic ocean surface. Significant wave height ${numberText(height)} metres; dominant period ${numberText(period)} seconds; ${direction === null ? 'direction unavailable' : `arriving from ${numberText(direction, 0)} degrees true and traveling toward ${numberText(travel, 0)} degrees`}. ${currentStatus.state === 'expired' ? 'This observation is expired; motion is paused.' : 'This is a teaching model, not real wave phase or a beach forecast.'}` : 'A static original ocean illustration. A complete usable wave observation is unavailable; no current wave motion is inferred.';
  canvas.setAttribute('aria-label', description);
}

function historyRows() {
  if (!packet) return [];
  let end = validDate(packet.historyWindow?.to) ? Date.parse(packet.historyWindow.to) : validDate(packet.observation?.observedAt) ? Date.parse(packet.observation.observedAt) : null;
  if (end === null) return [];
  const statedStart = validDate(packet.historyWindow?.from) ? Date.parse(packet.historyWindow.from) : end - 86400000;
  const start = Math.max(statedStart, end - 86400000);
  const unique = new Map();
  for (const row of packet.history) {
    if (!row || !validDate(row.observedAt)) continue;
    const timestamp = Date.parse(row.observedAt);
    if (timestamp >= start && timestamp <= end) unique.set(timestamp, row);
  }
  return [...unique.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1]);
}

const svgNS = 'http://www.w3.org/2000/svg';
function svgNode(name, attributes = {}, text = null) {
  const node = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== null) node.textContent = text;
  return node;
}

function heightSegments(rows) {
  const result = [];
  // Missing heights split a path even when timestamps are close together.
  for (const timeSegment of trendSegments(rows)) {
    let segment = [];
    for (const row of timeSegment) {
      if (observedValue(row.heightM) === null) {
        if (segment.length) result.push(segment);
        segment = [];
      } else segment.push(row);
    }
    if (segment.length) result.push(segment);
  }
  return result;
}

function renderHistory() {
  const rows = historyRows();
  const svg = $('history-chart');
  const preserved = [svg.querySelector('title'), svg.querySelector('desc')];
  svg.replaceChildren(...preserved);
  const isSmall = window.matchMedia('(max-width: 700px)').matches;
  const width = isSmall ? 620 : 1040;
  const height = isSmall ? 280 : 230;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const left = 40, right = width - 12, top = 17, bottom = height - 33;
  const valid = rows.filter((row) => observedValue(row.heightM) !== null);
  const conversion = (value) => unit === 'ft' ? metresToFeet(value) : value;
  setText('chart-unit', `/ ${unit}`);
  setText('table-height-heading', `Height (${unit})`);
  const empty = $('chart-empty');
  empty.hidden = valid.length > 0;
  empty.textContent = !packet ? busy ? 'Waiting for observation history' : 'Observation history unavailable' : 'No valid height observations in this window';
  const end = validDate(packet?.historyWindow?.to) ? Date.parse(packet.historyWindow.to) : rows.length ? Date.parse(rows.at(-1).observedAt) : Date.now();
  const start = Math.max(validDate(packet?.historyWindow?.from) ? Date.parse(packet.historyWindow.from) : end - 86400000, end - 86400000);
  const timeSpan = Math.max(1, end - start);
  const maxHeight = valid.length ? Math.max(...valid.map((row) => conversion(row.heightM))) : unit === 'ft' ? 4 : 1.2;
  const tickStep = unit === 'ft' ? maxHeight > 10 ? 4 : maxHeight > 5 ? 2 : 1 : maxHeight > 3 ? 1 : maxHeight > 1.2 ? .5 : .25;
  const axisMax = Math.max(tickStep * 3, Math.ceil(maxHeight * 1.14 / tickStep) * tickStep);
  const x = (row) => left + (Date.parse(row.observedAt) - start) / timeSpan * (right - left);
  const y = (row) => bottom - conversion(row.heightM) / axisMax * (bottom - top);
  const gridTicks = 3;
  for (let i = 0; i <= gridTicks; i++) {
    const tickValue = axisMax * i / gridTicks;
    const tickY = bottom - i / gridTicks * (bottom - top);
    svg.append(svgNode('line', { x1: left, x2: right, y1: tickY, y2: tickY, class: 'chart-grid' }));
    svg.append(svgNode('text', { x: left - 12, y: tickY + 4, 'text-anchor': 'end', class: 'chart-axis-label' }, numberText(tickValue, unit === 'ft' ? tickValue % 1 ? 1 : 0 : 1)));
  }
  const labels = isSmall ? 3 : 5;
  const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
  for (let i = 0; i < labels; i++) {
    const fraction = i / (labels - 1);
    svg.append(svgNode('text', { x: left + fraction * (right - left), y: height - 8, 'text-anchor': i === 0 ? 'start' : i === labels - 1 ? 'end' : 'middle', class: 'chart-axis-label' }, timeFormatter.format(new Date(start + timeSpan * fraction))));
  }
  const defs = svgNode('defs');
  const gradient = svgNode('linearGradient', { id: 'chart-fill', x1: 0, y1: 0, x2: 0, y2: 1 });
  gradient.append(svgNode('stop', { offset: '0%', 'stop-color': '#bc654e', 'stop-opacity': '.15' }), svgNode('stop', { offset: '100%', 'stop-color': '#bc654e', 'stop-opacity': '.015' }));
  defs.append(gradient); svg.append(defs);
  for (const segment of heightSegments(rows)) {
    const points = segment.map((row) => `${x(row).toFixed(2)} ${y(row).toFixed(2)}`);
    if (segment.length > 1) {
      const path = `M${points.join('L')}`;
      const area = `${path}L${x(segment.at(-1))} ${bottom}L${x(segment[0])} ${bottom}Z`;
      svg.append(svgNode('path', { d: area, class: 'chart-area' }), svgNode('path', { d: path, class: 'chart-line' }));
    }
    for (const row of segment) {
      const dot = svgNode('circle', { cx: x(row), cy: y(row), r: segment.length === 1 ? 3 : 2, class: 'chart-dot' });
      dot.append(svgNode('title', {}, `${formatLocalTime(row.observedAt)} · ${numberText(conversion(row.heightM))} ${unit}`));
      svg.append(dot);
    }
  }
  const caption = rows.length ? `${rows.length} observed records · ${formatLocalTime(new Date(start).toISOString())} to ${formatLocalTime(new Date(end).toISOString())} · gaps over 45 minutes and missing heights remain open` : 'Pacific local time · no available history · gaps remain gaps';
  setText('history-caption', caption);
  setText('chart-desc', valid.length ? `${valid.length} valid height observations in the dated 24-hour window. Each line stops at its last measurement. Missing heights and gaps over 45 minutes break the line. Full values are available in the observations table below.` : 'No valid wave heights are available. No values are filled in or extrapolated.');
  const tbody = $('history-table');
  tbody.replaceChildren();
  if (!rows.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5; cell.textContent = 'No observations available.'; row.append(cell); tbody.append(row);
  }
  for (const observation of [...rows].reverse()) {
    const row = document.createElement('tr');
    const heightValue = observedValue(observation.heightM);
    const values = [formatLocalTime(observation.observedAt), heightValue === null ? 'Unavailable' : sourceNumber(conversion(heightValue)), sourceNumber(observedValue(observation.dominantPeriodS, false)), finite(observation.directionFromDeg) ? sourceNumber(observation.directionFromDeg) : 'Unavailable', sourceNumber(observation.waterTempC)];
    for (const value of values) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
    tbody.append(row);
  }
}

function observationCanMove() {
  const observation = packet?.observation;
  return context && currentStatus.state !== 'expired' && currentStatus.state !== 'unavailable' &&
    observedValue(observation?.heightM) !== null && observedValue(observation?.dominantPeriodS, false) !== null &&
    finite(currentModel.travelDeg) && finite(observation?.directionFromDeg) && observation.directionFromDeg >= 0 && observation.directionFromDeg <= 360;
}

function renderMotion() {
  const eligible = observationCanMove();
  const active = eligible && wantsMotion && !document.hidden;
  $('motion-toggle').disabled = !eligible;
  $('motion-toggle').setAttribute('aria-pressed', String(eligible && wantsMotion));
  let label = wantsMotion ? 'Pause motion' : 'Play motion';
  if (!eligible) label = currentStatus.state === 'expired' ? 'Motion paused' : 'Motion unavailable';
  else if (!wantsMotion && reducedMotion.matches && !motionChosen) label = 'Enable motion';
  setText('motion-label', label);
  setText('motion-icon', active ? 'Ⅱ' : '▷');
  let note = 'Static illustration · no usable wave motion';
  if (currentStatus.state === 'expired') note = 'Expired observation · motion paused';
  else if (eligible && !wantsMotion) note = reducedMotion.matches && !motionChosen ? 'Reduced motion · a quiet, static view' : 'Motion paused · observation unchanged';
  else if (eligible && document.hidden) note = 'Motion pauses while this tab is hidden';
  else if (eligible) note = `${numberText(packet.observation.dominantPeriodS)} seconds between modeled crests · relief is schematic`;
  setText('motion-note', note);
  if (active && frame === null) {
    frameTime = null;
    frame = requestAnimationFrame(animate);
  } else if (!active && frame !== null) {
    cancelAnimationFrame(frame); frame = null; frameTime = null;
  }
}

function animate(timestamp) {
  frame = null;
  if (!observationCanMove() || !wantsMotion || document.hidden) { frameTime = null; return; }
  if (frameTime !== null) elapsed += Math.max(0, (timestamp - frameTime) / 1000);
  frameTime = timestamp;
  drawOcean();
  frame = requestAnimationFrame(animate);
}

function sizeCanvas() {
  const rectangle = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = rectangle.width; canvasHeight = rectangle.height;
  canvas.width = Math.round(canvasWidth * ratio); canvas.height = Math.round(canvasHeight * ratio);
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawOcean();
}

function drawOcean() {
  if (!context || !canvasWidth || !canvasHeight) return;
  const w = canvasWidth, h = canvasHeight;
  context.clearRect(0, 0, w, h);
  const wash = context.createLinearGradient(w * .8, 0, w * .35, h);
  wash.addColorStop(0, '#f0d3b4'); wash.addColorStop(.28, '#d5ddd0'); wash.addColorStop(.63, '#a3c2c0'); wash.addColorStop(1, '#75a2ac');
  context.fillStyle = wash; context.fillRect(0, 0, w, h);
  // The dawn disc is original decorative geometry, not a sun-position calculation.
  const sunX = w * .75, sunY = h * .21, sunRadius = Math.min(w * .092, h * .225);
  const glow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.8);
  glow.addColorStop(0, '#ffeacf80'); glow.addColorStop(.45, '#fae3c24a'); glow.addColorStop(1, '#fae3c200');
  context.fillStyle = glow; context.fillRect(0, 0, w, h);
  context.beginPath(); context.arc(sunX, sunY, sunRadius, 0, Math.PI * 2); context.fillStyle = '#f8e6c8aa'; context.fill();
  const observation = packet?.observation;
  const hasHeight = observedValue(observation?.heightM) !== null;
  const hasPeriod = observedValue(observation?.dominantPeriodS, false) !== null;
  const modeled = hasHeight && hasPeriod && finite(currentModel.travelDeg);
  // Unknown observations use one static decorative field; they never animate.
  const travel = modeled ? currentModel.travelDeg * Math.PI / 180 : 70 * Math.PI / 180;
  const dx = Math.sin(travel), dy = -Math.cos(travel);
  const px = Math.cos(travel), py = Math.sin(travel);
  const wavelength = modeled && finite(currentModel.wavelengthM) ? Math.min(350, Math.max(76, currentModel.wavelengthM * .93)) : 173;
  const period = hasPeriod ? observation.dominantPeriodS : 1;
  const phase = modeled ? (elapsed / period % 1) * wavelength : 0;
  const relief = hasHeight ? Math.min(22, observation.heightM * 7) : 8;
  const diagonal = Math.hypot(w, h) * 1.15;
  const cx = w * .58, cy = h * .58;
  const start = -Math.ceil(diagonal / wavelength) - 1;
  const end = Math.ceil(diagonal / wavelength) + 1;
  const ridge = (q, shift = 0) => {
    context.beginPath();
    let first = true;
    for (let r = -diagonal; r <= diagonal; r += 8) {
      const bend = Math.sin(r / 170) * relief + Math.sin(r / 67) * relief * .2;
      const along = q + bend + shift;
      const x = cx + dx * along + px * r;
      const y = cy + dy * along + py * r;
      if (first) { context.moveTo(x, y); first = false; } else context.lineTo(x, y);
    }
  };
  context.save(); context.lineCap = 'round';
  for (let index = start; index <= end; index++) {
    const q = index * wavelength + phase;
    ridge(q, wavelength * .17); context.strokeStyle = '#466f7810'; context.lineWidth = Math.max(5, relief * 3); context.stroke();
    ridge(q, wavelength * .035); context.strokeStyle = '#37697815'; context.lineWidth = 1; context.stroke();
    ridge(q); context.strokeStyle = `rgba(245,245,220,${modeled ? Math.min(.5, .13 + observation.heightM * .07) : .24})`; context.lineWidth = Math.max(.6, relief * .14); context.stroke();
    ridge(q, -wavelength * .037); context.strokeStyle = '#f5f2d811'; context.lineWidth = 1; context.stroke();
    for (let sub = 1; sub <= 3; sub++) {
      ridge(q, -wavelength * (sub * .105 + .055)); context.strokeStyle = '#d6e8da1c'; context.lineWidth = .75; context.stroke();
    }
  }
  context.restore();
  const vignette = context.createLinearGradient(0, 0, w * .52, 0);
  vignette.addColorStop(0, '#ebeee16b'); vignette.addColorStop(1, '#ebeee100');
  context.fillStyle = vignette; context.fillRect(0, 0, w, h);
}

$('refresh').addEventListener('click', refresh);
$('motion-toggle').addEventListener('click', () => {
  wantsMotion = !wantsMotion; motionChosen = true; renderMotion(); drawOcean();
});
for (const button of document.querySelectorAll('[data-unit]')) button.addEventListener('click', () => {
  unit = button.dataset.unit;
  for (const other of document.querySelectorAll('[data-unit]')) other.setAttribute('aria-pressed', String(other === button));
  renderMetrics(packet?.observation); renderHistory();
});
reducedMotion.addEventListener('change', () => {
  if (!motionChosen) wantsMotion = !reducedMotion.matches;
  renderMotion(); drawOcean();
});
document.addEventListener('visibilitychange', () => {
  currentStatus = statusAt(packet?.observation ?? null);
  renderStatus(); renderMetrics(packet?.observation); renderMotion();
});
window.addEventListener('focus', () => {
  if (Date.now() - lastAttemptAt >= 600000) refresh();
  else { currentStatus = statusAt(packet?.observation ?? null); renderStatus(); renderMotion(); }
});
let resizeTimer;
window.addEventListener('resize', () => {
  sizeCanvas();
  clearTimeout(resizeTimer); resizeTimer = setTimeout(renderHistory, 150);
});
setInterval(() => {
  const oldState = currentStatus.state;
  currentStatus = statusAt(packet?.observation ?? null);
  renderStatus(); renderMotion();
  if (oldState !== currentStatus.state) renderMetrics(packet?.observation);
}, 30000);

sizeCanvas();
refresh();
loadSavedObservation();
