import { searchRows, SEARCH_KINDS } from '../lib/pointcast-search.mjs';

function mountSearch() {
  const form = document.getElementById('search-form');
  const source = document.getElementById('pointcast-search-index');
  if (!form || !source || form.dataset.ready) return;
  form.dataset.ready = 'true';
  const index = JSON.parse(source.textContent || '[]');
  const input = document.getElementById('q');
  const count = document.getElementById('count');
  const results = document.getElementById('results');
  const more = document.getElementById('search-more');
  const filters = [...form.querySelectorAll('[data-kind]')];
  let kind = 'ALL';
  let limit = 60;
  let hits = [];
  const span = (className, value) => {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = value;
    return node;
  };
  const show = () => {
    results.replaceChildren();
    const visible = hits.slice(0, limit);
    count.textContent = `${hits.length} matches · showing ${visible.length}`;
    if (!hits.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No matches here. Try fewer words or choose All to search every kind.';
      results.append(empty);
    }
    for (const row of visible) {
      const link = document.createElement('a');
      link.className = `hit hit--${row.kind.toLowerCase()}`;
      link.href = row.url;
      link.style.setProperty('--row-c50', row.labelBg);
      link.style.setProperty('--row-c8', row.labelFg);
      const chip = span('hit__ch', row.label);
      chip.style.background = row.labelBg;
      chip.style.color = row.labelFg;
      chip.style.borderColor = row.labelFg;
      const id = row.kind === 'BLOCK' ? `№${row.id}` : row.kind === 'PROJECT' ? 'Open ↗' : `/${row.id}`;
      const time = Date.parse(row.timestamp);
      const date = Number.isFinite(time) ? new Date(time).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit', timeZone:'America/Los_Angeles' }) : '';
      link.append(chip, span('hit__id mono', id), span('hit__type mono', row.type), span('hit__date mono', date), span('hit__title', row.title));
      if (row.dek) link.append(span('hit__dek', row.dek));
      results.append(link);
    }
    more.hidden = hits.length <= limit;
  };
  const run = (save = true) => {
    hits = searchRows(index, input.value, kind);
    limit = 60;
    filters.forEach(button => {
      const active = button.dataset.kind === kind;
      button.classList.toggle('kind-filter--active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (save) {
      const url = new URL(window.location.href);
      const query = input.value.trim();
      query ? url.searchParams.set('q', query) : url.searchParams.delete('q');
      kind !== 'ALL' ? url.searchParams.set('kind', kind) : url.searchParams.delete('kind');
      history.replaceState(null, '', url);
    }
    show();
  };
  const restore = () => {
    const params = new URLSearchParams(window.location.search);
    input.value = (params.get('q') || '').slice(0, 240);
    const requested = (params.get('kind') || 'ALL').toUpperCase();
    kind = SEARCH_KINDS.includes(requested) ? requested : 'ALL';
    run(false);
  };
  const controller = new AbortController();
  const options = { signal: controller.signal };
  window.addEventListener('popstate', restore, options);
  input.addEventListener('input', () => run(), options);
  form.addEventListener('submit', event => { event.preventDefault(); run(); }, options);
  filters.forEach(button => button.addEventListener('click', () => { kind = button.dataset.kind; run(); }, options));
  form.querySelectorAll('[data-q]').forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.q;
    kind = 'ALL';
    run();
    input.focus();
  }, options));
  more.addEventListener('click', () => { limit += 60; show(); }, options);
  document.addEventListener('astro:before-swap', () => controller.abort(), { once:true, signal:controller.signal });
  restore();
}
mountSearch();
document.addEventListener('astro:page-load', mountSearch);
