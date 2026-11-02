import { SITES, CATALOG, disconnected, demoSnapshot, normalizeWishlist } from './model.mjs';
import { SITE_CONFIG, observationEndpoint } from './site-config.mjs';
const $ = id => document.getElementById(id);
const state = { siteId: SITE_CONFIG.homeSiteId, demo: false, filter: 'observed', query: '', openCardId: null, wishlist: [], snapshots: new Map(), loading: false };
let requestId = 0;
let controller;
let memoryOnly = false;
const STORAGE_KEY = `${SITE_CONFIG.storageScope}:wishlist:v1`;
const RETURN_KEY = `${SITE_CONFIG.storageScope}:return:v1`;
const RETURN_TTL = 30 * 60 * 1000;
const ROW_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
let pendingReturnDisclosure = null;
let returnFocusReady = document.readyState === 'complete';
const make = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
try { state.wishlist = normalizeWishlist(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
catch { memoryOnly = true; }
// One short-lived UI bookmark, written only when entering the optional room.
// Never store snapshots, labels, timestamps of visits, counts or evidence here.
function consumeReturnContext() {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (typeof raw !== 'string' || raw.length > 1024) return null;
    const saved = JSON.parse(raw);
    const keys = ['version', 'siteId', 'demo', 'filter', 'query', 'openCardId', 'expiresAt'];
    const now = Date.now();
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) ||
        Object.keys(saved).length !== keys.length || Object.keys(saved).some(key => !keys.includes(key)) ||
        saved.version !== 1 || !SITES.some(site => site.id === saved.siteId) ||
        typeof saved.demo !== 'boolean' || !['observed', 'possible', 'wishlist'].includes(saved.filter) ||
        typeof saved.query !== 'string' || saved.query.length > 80 || /[\u0000-\u001f\u007f]/.test(saved.query) ||
        !Number.isSafeInteger(saved.expiresAt) || saved.expiresAt <= now || saved.expiresAt > now + RETURN_TTL ||
        (saved.openCardId !== null && (typeof saved.openCardId !== 'string' ||
          !/^[a-z0-9-]{1,120}$/.test(saved.openCardId) ||
          !saved.openCardId.startsWith(disclosurePrefix(saved.siteId, saved.demo, saved.filter))))) return null;
    return saved;
  } catch { return null; }
}
function disclosurePrefix(siteId = state.siteId, demo = state.demo, filter = state.filter) {
  return `atlas-${siteId}-${demo ? 'demo' : 'real'}-${filter === 'observed' ? 'observed' : 'possible'}-`;
}
function disclosureId(id) { return disclosurePrefix() + id; }
function primaryNavigation(event) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
function saveReturnContext() {
  const open = [...$('cards').querySelectorAll('details[open]')];
  const selected = open.find(details => details.id === state.openCardId) ?? open.at(-1);
  const saved = { version: 1, siteId: state.siteId, demo: state.demo, filter: state.filter,
    query: state.query.slice(0, 80), openCardId: selected?.id ?? null, expiresAt: Date.now() + RETURN_TTL };
  try { sessionStorage.setItem(RETURN_KEY, JSON.stringify(saved)); }
  catch { /* The room still works when return preferences cannot be saved. */ }
}
function focusDisclosure(id) {
  const details = document.getElementById(id);
  const summary = details?.querySelector('summary');
  if (!details || !summary || !$('cards').contains(details)) return false;
  details.open = true;
  state.openCardId = id;
  summary.focus({ preventScroll: true });
  summary.scrollIntoView({ block: 'center', behavior: 'instant' });
  return true;
}
function finishReturnFocus() {
  if (!returnFocusReady) return;
  if (pendingReturnDisclosure && focusDisclosure(pendingReturnDisclosure)) pendingReturnDisclosure = null;
  if (!state.loading) pendingReturnDisclosure = null;
}
function rememberDisclosure(details, id) {
  details.id = id;
  const summary = details.querySelector('summary');
  summary.id = id + '-summary';
  summary.dataset.atlasDisclosureId = id;
  details.open = state.openCardId === id;
  details.addEventListener('toggle', () => {
    if (!details.isConnected) return;
    if (details.open) state.openCardId = id;
    else if (state.openCardId === id) state.openCardId = null;
  });
  summary.addEventListener('focus', () => { if (details.open) state.openCardId = id; });
}
function restoreReturnContext() {
  const saved = consumeReturnContext();
  if (!saved) return false;
  state.siteId = saved.siteId;
  state.demo = saved.demo;
  state.filter = saved.filter;
  state.query = saved.query;
  state.openCardId = saved.openCardId;
  pendingReturnDisclosure = saved.openCardId;
  $('demo').checked = state.demo;
  $('search').value = state.query;
  return true;
}
function saveWishlist() {
  state.wishlist = normalizeWishlist(state.wishlist);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.wishlist)); }
  catch { memoryOnly = true; }
  $('storage-note').textContent = memoryOnly
    ? 'Browser storage is unavailable. Wishlist changes last only while this page is open.'
    : 'Your wishlist stays in this browser. It does not invite a bot or grant permission.';
}
function snapshot() {
  if (state.demo) return demoSnapshot(state.siteId);
  if (!observationEndpoint(state.siteId)) return { ...disconnected(state.siteId), coverage: null };
  return state.snapshots.get(state.siteId) ?? disconnected(state.siteId);
}
function siteButtons() {
  $('sites').replaceChildren(...SITES.map(site => {
    const button = make('button', undefined, 'site-button');
    button.type = 'button';
    button.dataset.siteId = site.id;
    button.setAttribute('aria-pressed', String(state.siteId === site.id));
    button.append(make('strong', site.name), make('span', site.strength));
    button.addEventListener('click', () => {
      if (state.siteId === site.id) return;
      state.siteId = site.id;
      requestId++;
      controller?.abort();
      state.loading = false;
      render();
      if (!state.demo && observationEndpoint(site.id) && !state.snapshots.has(site.id)) loadEvidence();
    });
    return button;
  }));
}
function evidenceStatus() {
  const data = snapshot();
  const box = $('source-status');
  box.classList.toggle('demo', state.demo);
  const heading = state.demo ? 'Invented demo'
    : state.loading ? 'Reading evidence'
    : data.status === 'limited' ? 'Limited evidence'
    : data.status === 'unavailable' ? 'Source unavailable' : 'Not connected';
  const explanation = state.demo
    ? 'Fictional characters and encounters. They never enter real collections or standings.'
    : state.loading ? 'One read of the existing PointCast log. No tracking or registration is being added.'
    : data.status === 'limited' ? 'A partial, retained sample of user-agent labels from the last 24 hours. Identity is unverified.'
    : data.status === 'unavailable' ? 'The source could not be read. Visits and collection totals are unknown.'
    : state.siteId === SITE_CONFIG.homeSiteId ? SITE_CONFIG.disconnectedNote
    : 'A traffic adapter has not been connected for this site. Unknown does not mean no visits.';
  box.replaceChildren(make('strong', heading), make('span', explanation));
  if (!state.demo && observationEndpoint(state.siteId)) {
    const retry = make('button', state.loading ? 'Reading…' : 'Refresh evidence');
    retry.type = 'button';
    retry.id = 'refresh-evidence';
    retry.setAttribute('aria-disabled', String(state.loading));
    retry.addEventListener('click', () => { if (!state.loading) loadEvidence(); });
    box.append(retry);
  }
  $('collection-count').textContent = state.demo ? data.observations.length + ' demo cards'
    : data.observedLabelCount === null ? 'Evidence unknown'
    : data.observedLabelCount + ' observed labels · partial sample';
  const details = $('coverage-details');
  details.replaceChildren();
  if (data.coverage) {
    details.append(make('p', data.coverage.source + (data.asOfDay ? ' · Read on ' + data.asOfDay + ' (UTC)' : '')));
    const list = make('ul');
    for (const caveat of data.coverage.caveats ?? []) list.append(make('li', caveat));
    details.append(list);
  } else details.append(make('p', 'No observation source is connected for this field. No collection completeness or traffic total can be calculated.'));
}
function robot(color) {
  const art = make('div', undefined, 'card-art ' + color);
  art.setAttribute('aria-hidden', 'true');
  const body = make('div', undefined, 'card-robot');
  const eyes = make('div', undefined, 'eyes');
  eyes.append(make('i'), make('i'));
  body.append(eyes);
  art.append(body);
  return art;
}
function observationCard(row, index) {
  const card = make('article', undefined, 'card');
  const top = make('div', undefined, 'card-top');
  top.append(make('span', 'Encounter ' + String(index + 1).padStart(2, '0')), make('span', state.demo ? 'Invented demo' : 'Observed · unverified', 'card-state'));
  const body = make('div', undefined, 'card-body');
  body.append(make('p', state.demo ? 'FICTIONAL SPECIMEN' : 'RETAINED UA LABEL', 'card-role'), make('h3', row.label));
  body.append(make('p', state.demo ? 'An invented encounter to explore the interface.' : 'A request carried this family label. Its operator is unknown.'));
  const details = make('details');
  details.append(make('summary', 'Inspect evidence'));
  details.append(make('p', state.demo ? 'Source: invented-fixture. This is not traffic evidence.' : 'Source: PointCast legacy log, user-agent classification. This label may combine several products.'));
  details.append(make('p', 'Last observed day: ' + row.lastObservedDay + ' UTC. ' + (state.demo ? 'Demonstration date.' : 'Dates are rounded for privacy.')));
  details.append(make('p', 'Not enrolled in the Circuit. No competition points.'));
  const practice = make('a', 'Try the local practice →');
  practice.dataset.atlasControlId = disclosureId(row.id) + '-practice';
  practice.href = '#practice';
  practice.addEventListener('click', event => {
    const answer = $('practice-answer');
    if (!primaryNavigation(event) || !answer) return;
    event.preventDefault();
    if (location.hash !== '#practice') history.pushState(history.state, '', '#practice');
    $('practice')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    answer.focus({ preventScroll: true });
  });
  details.append(practice);
  rememberDisclosure(details, disclosureId(row.id));
  body.append(details);
  card.append(top, robot(['gold', 'mint', 'blue'][index % 3]), body);
  return card;
}
function possibleCard(bot, index) {
  const card = make('article', undefined, 'card');
  const top = make('div', undefined, 'card-top');
  top.append(make('span', 'Catalog ' + String(index + 1).padStart(2, '0')), make('span', 'Possible', 'card-state'));
  const body = make('div', undefined, 'card-body');
  body.append(make('p', bot.family, 'card-role'), make('h3', bot.name), make('p', bot.role));
  const wanted = state.wishlist.includes(bot.id);
  const button = make('button', wanted ? 'Saved to wishlist ✓' : '+ Add to wishlist');
  button.type = 'button';
  button.setAttribute('aria-pressed', String(wanted));
  button.dataset.atlasControlId = disclosureId(bot.id) + '-wishlist';
  button.setAttribute('aria-label', (wanted ? 'Remove ' : 'Add ') + bot.name + (wanted ? ' from wishlist' : ' to wishlist'));
  button.addEventListener('click', () => {
    state.wishlist = wanted ? state.wishlist.filter(id => id !== bot.id) : [...state.wishlist, bot.id];
    saveWishlist();
    // Preserve keyboard position if removing the current card from a filtered list.
    const indexBefore = [...$('cards').querySelectorAll('button')].indexOf(button);
    renderCards();
    const buttons = [...$('cards').querySelectorAll('button')];
    if (buttons.length) buttons[Math.min(Math.max(indexBefore, 0), buttons.length - 1)].focus();
    else $('search').focus();
  });
  const details = make('details');
  details.append(make('summary', 'About this possibility'));
  details.append(make('p', 'Catalog entry only. No visit, absence, invitation, partnership or endorsement is claimed.'));
  const source = make('a', 'Official documentation ↗');
  source.dataset.atlasControlId = disclosureId(bot.id) + '-documentation';
  source.href = bot.source;
  source.rel = 'noreferrer';
  details.append(source);
  rememberDisclosure(details, disclosureId(bot.id));
  body.append(button, details);
  card.append(top, robot(bot.color), body);
  return card;
}
function renderCards() {
  $('wishlist-count').textContent = String(state.wishlist.length);
  $('clear-wishlist').disabled = state.wishlist.length === 0;
  for (const button of $('filters').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
  const data = snapshot();
  const observed = state.filter === 'observed';
  $('filter-note').textContent = observed
    ? state.demo ? 'DEMO ONLY — meet invented signal characters. No real visits are shown in this view.'
    : data.status === 'limited' ? 'These are family labels from a partial retained sample. They are not verified individuals, unique visitors or claimed participants.'
    : 'Observed cards appear only when a source is connected. Possible visitors is a separate catalog, not a record of visits.'
    : state.filter === 'wishlist' ? 'A private shortlist in this browser. Saving a card does not request traffic or enroll its operator.'
    : 'A documented catalog, separate from observations. “Possible” does not mean “has never visited.”';
  const candidates = observed ? data.observations : CATALOG.filter(bot => state.filter !== 'wishlist' || state.wishlist.includes(bot.id));
  const query = state.query.trim().toLocaleLowerCase();
  const selected = candidates.filter(row => (row.label ?? row.name).toLocaleLowerCase().includes(query));
  const grid = $('cards');
  grid.replaceChildren();
  for (const [index, row] of selected.entries()) grid.append(observed ? observationCard(row, index) : possibleCard(row, CATALOG.indexOf(row)));
  if (!selected.length) {
    const empty = make('div', undefined, 'empty');
    const title = query ? 'No matching cards.' : !observed ? 'Your next encounter starts with curiosity.'
      : data.status === 'limited' ? 'No matching labels in the retained sample.'
      : state.loading ? 'Reading the field…' : 'An open field, with evidence still to come.';
    const message = query ? 'Try another name or clear the search.'
      : !observed ? 'Open Possible visitors and add a card to your private wishlist.'
      : data.status === 'limited' ? 'This does not establish zero bot visits. The collector covers only some routes and retains a short shared log.'
      : 'We will show real observations when evidence is available. You can explore Possible visitors or the clearly labeled invented demo now.';
    empty.append(make('h3', title), make('p', message));
    grid.append(empty);
  }
}
function renderLeague() {
  $('league-rows').replaceChildren(...SITES.map(site => {
    const row = make('tr');
    const real = state.snapshots.get(site.id) ?? disconnected(site.id);
    const status = state.demo ? 'Demo view · excluded from standings'
      : real.status === 'limited' ? 'Partial UA-label sample'
      : real.status === 'unavailable' ? 'Unavailable · unknown' : 'Not connected';
    row.append(make('td', site.name), make('td', site.strength), make('td', status), make('td', 'Not open · unranked'));
    return row;
  }));
}
function render() {
  const active = document.activeElement;
  const focusedSite = active?.dataset?.siteId;
  const focusedRefresh = active?.id === 'refresh-evidence';
  const focusedDisclosure = active?.dataset?.atlasDisclosureId;
  const focusedControl = active?.dataset?.atlasControlId;
  if (focusedControl) {
    const openDetails = active.closest('details[open]');
    if (openDetails) state.openCardId = openDetails.id;
  }
  siteButtons(); evidenceStatus(); renderCards(); renderLeague();
  if (focusedSite) $('sites').querySelector('[data-site-id="' + focusedSite + '"]')?.focus();
  if (focusedRefresh) $('refresh-evidence')?.focus();
  if (focusedDisclosure) document.getElementById(focusedDisclosure + '-summary')?.focus({ preventScroll: true });
  if (focusedControl) {
    const replacement = [...$('cards').querySelectorAll('[data-atlas-control-id]')]
      .find(control => control.dataset.atlasControlId === focusedControl);
    (replacement ?? $('search')).focus({ preventScroll: true });
  }
  if (returnFocusReady && pendingReturnDisclosure && focusDisclosure(pendingReturnDisclosure)) pendingReturnDisclosure = null;
}
async function loadEvidence() {
  const endpoint = observationEndpoint(state.siteId);
  if (state.demo || !endpoint) return;
  const ticket = ++requestId;
  controller?.abort();
  controller = new AbortController();
  const activeController = controller;
  const timer = setTimeout(() => activeController.abort(), 5000);
  state.loading = true;
  render();
  let data = disconnected('pointcast', 'unavailable');
  try {
    const response = await fetch(endpoint, { signal: activeController.signal, credentials: 'omit', cache: 'no-store' });
    if (!response.ok) throw new Error('source unavailable');
    const received = await response.json();
    if (received?.version !== '0.1.0' || received.siteId !== 'pointcast' || received.mode !== 'real' ||
        !['limited', 'not_connected', 'unavailable'].includes(received.status) ||
        !Array.isArray(received.observations) || received.observations.length > 30) throw new Error('invalid snapshot');
    if (received.status === 'limited' &&
        (!received.coverage || typeof received.coverage.source !== 'string' || received.coverage.source.length > 120 ||
         !Array.isArray(received.coverage.caveats) || received.coverage.caveats.length > 8 ||
         received.coverage.caveats.some(value => typeof value !== 'string' || value.length > 400) ||
         typeof received.asOfDay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(received.asOfDay))) throw new Error('invalid coverage');
    if (received.status !== 'limited' && received.coverage !== null &&
        (!received.coverage || typeof received.coverage.source !== 'string' ||
         !Array.isArray(received.coverage.caveats) ||
         received.coverage.caveats.some(value => typeof value !== 'string' || value.length > 400))) throw new Error('invalid coverage');
    const rowIds = new Set();
    for (const row of received.observations) {
      if (!row || typeof row.id !== 'string' || !ROW_ID.test(row.id) || rowIds.has(row.id) ||
          row.state !== 'observed_unverified' || typeof row.label !== 'string' || row.label.length > 80 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(row.lastObservedDay)) throw new Error('invalid observation');
      rowIds.add(row.id);
    }
    if (received.status !== 'limited' && (received.observations.length !== 0 || received.observedLabelCount !== null)) throw new Error('invalid unknown state');
    if (received.status === 'limited' && received.observedLabelCount !== received.observations.length) throw new Error('invalid count');
    data = received;
  } catch { /* Fail closed. Private source errors are never rendered. */ }
  finally { clearTimeout(timer); }
  if (ticket !== requestId) return;
  state.snapshots.set('pointcast', data);
  state.loading = false;
  render();
  // A missing card must not make a later ordinary refresh move keyboard focus.
  finishReturnFocus();
}
$('start-tour')?.addEventListener('click', () => {
  pendingReturnDisclosure = null;
  state.demo = true;
  $('demo').checked = true;
  state.filter = 'observed';
  state.query = '';
  $('search').value = '';
  requestId++;
  controller?.abort();
  state.loading = false;
  state.openCardId = disclosureId(demoSnapshot(state.siteId).observations[0].id);
  render();
  focusDisclosure(state.openCardId);
});
$('show-evidence')?.addEventListener('click', event => {
  if (!primaryNavigation(event)) return;
  event.preventDefault();
  pendingReturnDisclosure = null;
  state.demo = false;
  $('demo').checked = false;
  state.filter = 'observed';
  state.query = '';
  state.openCardId = null;
  $('search').value = '';
  requestId++;
  controller?.abort();
  state.loading = false;
  render();
  if (observationEndpoint(state.siteId)) void loadEvidence();
  if (location.hash !== '#collection') history.pushState(history.state, '', '#collection');
  $('collection-title').focus({ preventScroll: true });
  $('collection').scrollIntoView({ block: 'start', behavior: 'instant' });
});
for (const link of document.querySelectorAll('.observatory-link')) {
  link.addEventListener('click', event => {
    if (primaryNavigation(event) && (!link.target || link.target === '_self') && new URL(link.href).origin === location.origin) saveReturnContext();
  });
}
// User activity wins over a delayed, fresh evidence read on return.
for (const type of ['pointerdown', 'keydown', 'input']) document.addEventListener(type, () => { pendingReturnDisclosure = null; }, { capture: true });
window.addEventListener('pageshow', event => {
  if (event.persisted && restoreReturnContext()) {
    returnFocusReady = false;
    render();
    void loadEvidence().finally(finishReturnFocus);
  }
  // Native fragment navigation can otherwise replace focus set during parsing.
  requestAnimationFrame(() => { returnFocusReady = true; finishReturnFocus(); });
});
$('demo').addEventListener('change', event => {
  state.demo = event.target.checked;
  requestId++;
  controller?.abort();
  state.loading = false;
  render();
  if (!state.demo && observationEndpoint(state.siteId)) loadEvidence();
});
$('filters').addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  renderCards();
});
$('search').addEventListener('input', event => { state.query = event.target.value; renderCards(); });
$('clear-wishlist').addEventListener('click', () => {
  state.wishlist = [];
  saveWishlist();
  renderCards();
  $('search').focus();
});
saveWishlist();
restoreReturnContext();
render();
void loadEvidence().finally(finishReturnFocus);
