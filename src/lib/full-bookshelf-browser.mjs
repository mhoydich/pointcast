import { normalizeReadingText } from './reading-map-browser.mjs';
const mounted = new WeakMap();
const params = { query: 'shelf-q', theme: 'shelf-theme', era: 'shelf-era', angle: 'shelf-angle', scope: 'shelf-scope' };

export function matchesFullBook(book, state) {
  const words = normalizeReadingText(state.query).split(' ').filter(Boolean);
  return words.every(word => normalizeReadingText(book.search).includes(word))
    && (state.theme === 'all' || book.theme === state.theme)
    && (state.era === 'all' || book.era === state.era)
    && (state.angle === 'all' || book.angles.split(' ').includes(state.angle))
    && (state.scope === 'all' || (state.scope === 'companions' ? book.companion === 'true' : book.context === 'true'));
}

export function mountFullBookshelf(root) {
  if (mounted.has(root)) return mounted.get(root);
  const win = root.ownerDocument.defaultView;
  const controls = root.querySelector('[data-full-controls]');
  const fields = Object.fromEntries(Object.keys(params).map(key => [key, root.querySelector(`${key === 'query' ? 'input' : 'select'}[data-full-${key}]`)]));
  const reset = root.querySelector('[data-full-reset]');
  const status = root.querySelector('[data-full-status]');
  const empty = root.querySelector('[data-full-empty]');
  const records = [...root.querySelectorAll('[data-full-record]')];
  if (!controls || !reset || !status || !empty || Object.values(fields).some(field => !field) || !records.length) return () => {};
  const listeners = [];
  const listen = (element, event, handler) => { element.addEventListener(event, handler); listeners.push([element,event,handler]); };
  const state = () => Object.fromEntries(Object.keys(params).map(key => [key, fields[key].value]));
  const clear = () => { for (const key of Object.keys(params)) fields[key].value = key === 'query' ? '' : 'all'; };
  const save = () => {
    const url = new URL(win.location.href);
    for (const [key, name] of Object.entries(params)) {
      const value = fields[key].value;
      if (value && value !== 'all') url.searchParams.set(name, value); else url.searchParams.delete(name);
    }
    if (records.some(record => record.id === url.hash.slice(1) && record.hidden)) url.hash = '';
    win.history.replaceState(win.history.state, '', url);
  };
  const update = (persist = true) => {
    let count = 0;
    for (const record of records) {
      record.hidden = !matchesFullBook({ search: record.dataset.fullSearch, theme: record.dataset.fullTheme, era: record.dataset.fullEra,
        angles: record.dataset.fullAngles, companion: record.dataset.fullCompanion, context: record.dataset.fullContext }, state());
      if (!record.hidden) count++;
    }
    status.textContent = `${count} of ${records.length} books shown. Expand any book for connections and source notes.`;
    empty.hidden = count !== 0;
    reset.disabled = Object.entries(state()).every(([key, value]) => key === 'query' ? !value : value === 'all');
    if (persist) save();
  };
  const openHash = () => {
    const id = win.location.hash.slice(1);
    const record = records.find(item => item.id === id);
    if (!record) return;
    if (record.hidden) { clear(); update(); }
    const detail = record.querySelector('details');
    detail.open = true;
    record.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  };
  const readUrl = () => {
    const url = new URL(win.location.href);
    clear();
    for (const [key, name] of Object.entries(params)) {
      const value = url.searchParams.get(name);
      if (value && (key === 'query' || [...fields[key].options].some(option => option.value === value))) fields[key].value = value;
    }
    update(false); openHash();
  };
  for (const [key, field] of Object.entries(fields)) listen(field, key === 'query' ? 'input' : 'change', () => update());
  listen(reset, 'click', () => { clear(); update(); fields.query.focus(); });
  for (const button of root.querySelectorAll('[data-full-choose-angle]')) listen(button, 'click', () => {
    clear(); fields.angle.value = button.dataset.fullChooseAngle; update(); controls.scrollIntoView?.({ block: 'start' }); fields.angle.focus();
  });
  for (const record of records) {
    const detail = record.querySelector('details');
    if (detail) listen(detail, 'toggle', () => {
      if (!root.isConnected || !detail.open || record.hidden) return;
      const url = new URL(win.location.href); url.hash = record.id; win.history.replaceState(win.history.state, '', url);
    });
  }
  listen(win, 'hashchange', openHash);
  listen(win, 'popstate', readUrl);
  controls.hidden = false;
  root.querySelectorAll('[data-full-choose-angle]').forEach(button => button.hidden = false);
  readUrl();
  const dispose = () => { listeners.forEach(([element,event,handler]) => element.removeEventListener(event,handler)); mounted.delete(root); };
  mounted.set(root, dispose);
  return dispose;
}
