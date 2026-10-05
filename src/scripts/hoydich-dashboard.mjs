const FILTERS = new Set(['focus', 'all', 'open', 'building', 'ready', 'native']);
const FILTER_LABELS = { focus: 'Focus desk', all: 'All projects', open: 'Open pages', building: 'Building', ready: 'Ready for approval', native: 'Delivered native' };
const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

export function initDashboard(root) {
  if (!root || root.dataset.dashboardReady === 'true') return;
  const controls = root.querySelector('[data-dashboard-controls]');
  const search = root.querySelector('[data-dashboard-search]');
  const reset = root.querySelector('[data-dashboard-reset]');
  const result = root.querySelector('[data-dashboard-result]');
  const empty = root.querySelector('[data-dashboard-empty]');
  const buttons = [...root.querySelectorAll('[data-dashboard-filter]')];
  const rows = [...root.querySelectorAll('[data-dashboard-row]')];
  // If an incomplete render is encountered, preserve the readable, unfiltered view.
  if (!controls || !search || !reset || !result || !empty || !buttons.length) return;
  root.dataset.dashboardReady = 'true';
  let filter = 'focus';
  const apply = () => {
    const query = normalize(search.value);
    // A search begun at the focus desk should discover the whole recorded studio.
    const effectiveFilter = query && filter === 'focus' ? 'all' : filter;
    const terms = query.split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const row of rows) {
      const statusMatches = effectiveFilter === 'all' || (effectiveFilter === 'focus' ? row.dataset.focus === 'true' : row.dataset.status === effectiveFilter);
      const text = normalize(row.dataset.search);
      const queryMatches = terms.every(term => text.includes(term));
      row.hidden = !(statusMatches && queryMatches);
      if (!row.hidden) visible += 1;
    }
    empty.hidden = visible !== 0;
    result.textContent = `${visible} of ${rows.length} ${rows.length === 1 ? 'project' : 'projects'} shown · ${FILTER_LABELS[effectiveFilter]}${query ? ' · Search results' : ''}.`;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.dashboardFilter === effectiveFilter));
  };
  search.addEventListener('input', apply);
  for (const button of buttons) button.addEventListener('click', () => {
    const next = button.dataset.dashboardFilter;
    if (!FILTERS.has(next)) return;
    filter = next;
    if (filter === 'focus') search.value = '';
    apply();
  });
  reset.addEventListener('click', () => { filter = 'focus'; search.value = ''; apply(); });
  controls.hidden = false;
  apply();
}
