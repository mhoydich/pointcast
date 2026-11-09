/*
 * atlas-map.js — draws an Atlas (atlas.json or the merged index) as a basemap-free geodesic plot
 * with filters, search, a record list and a detail panel. Dependency-free. No requests other than
 * the atlas files it is pointed at. Kept identical in mhoydich/pointcast (public/cartography/atlas-map.js)
 * and mhoydich/hello-token-reserve (public/cartography/atlas-map.js). Spec: ATLAS.md §7.
 *
 *   <div id="atlas" data-atlas="/atlas.json" data-index="/atlas/index.json" data-site="pointcast.xyz"></div>
 *   <script src="/cartography/atlas-map.js" defer></script>
 *
 * data-index is optional: when present the page offers "all sites" (?site=all) and any ?site=<host> filter
 * reads the merged index. URL state: ?site=all|<host> &type=<type> &layer=<layer> &q=<words> &placed=1,
 * and #<record id> selects a record.
 */
(function () {
  'use strict';
  const SIZE = 760;
  const RING = 0.43; // 25 miles -> 326.8 px at SIZE 760, the same scale as the sites' other geodesic atlases
  const EARTH_MILES = 3958.7613;
  const TYPE_ORDER = ['place', 'court', 'player', 'gear', 'event', 'league', 'business', 'quiet-place', 'shrine', 'ping', 'page', 'bot', 'agent', 'route', 'area', 'dataset', 'feed', 'tool'];
  const TYPE_LABEL = { place: 'Places', court: 'Courts', player: 'Players', gear: 'Gear', event: 'Events', league: 'Leagues', business: 'Businesses', 'quiet-place': 'Quiet places', shrine: 'Shrines', ping: 'Ping zones', page: 'Pages', bot: 'Bots', agent: 'Agents', route: 'Routes', area: 'Areas', dataset: 'Datasets', feed: 'Feeds', tool: 'Tools' };
  const COLORS = { place: '#2f6f4e', court: '#1f5fa6', player: '#8a4b9c', gear: '#b3541e', event: '#c2262e', league: '#1f7a8c', business: '#6b6b6b', 'quiet-place': '#4f7f8f', shrine: '#7a5c99', ping: '#d08a00', page: '#444', bot: '#0f766e', agent: '#0f766e', route: '#3b7d23', area: '#8c7a4a', dataset: '#555', feed: '#555', tool: '#0e7490' };
  const rad = (d) => (d * Math.PI) / 180;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function distanceMiles(a, b) {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function bearing(a, b) {
    const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
    const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
    return (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
  }
  /* Azimuthal-equidistant about the atlas center: radial distance is true, like the sister atlases. */
  function project(center, point, radiusMiles) {
    const d = distanceMiles(center, point), b = bearing(center, point);
    const r = (Math.min(d, radiusMiles * 1.12) / radiusMiles) * SIZE * RING;
    return { x: SIZE / 2 + r * Math.sin(b), y: SIZE / 2 - r * Math.cos(b), miles: d, beyond: d > radiusMiles };
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === 'text') node.textContent = v; else if (k === 'html') node.innerHTML = v; else if (k.startsWith('on')) node.addEventListener(k.slice(2), v); else node.setAttribute(k, v === true ? '' : v); }
    for (const c of [].concat(children || [])) if (c != null) node.append(c);
    return node;
  }
  const svgEl = (tag, attrs) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) n.setAttribute(k, v); return n; };

  function readState() {
    const p = new URLSearchParams(location.search);
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (error) { /* a malformed hash selects nothing */ }
    return { site: p.get('site') || '', type: p.get('type') || '', layer: p.get('layer') || '', q: p.get('q') || '', placed: p.get('placed') === '1', id };
  }
  function writeState(s) {
    const p = new URLSearchParams();
    for (const k of ['site', 'type', 'layer', 'q']) if (s[k]) p.set(k, s[k]);
    if (s.placed) p.set('placed', '1');
    const qs = p.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${s.id ? `#${encodeURIComponent(s.id)}` : ''}`);
  }

  async function mount(root) {
    const own = root.dataset.atlas || '/atlas.json';
    const indexUrl = root.dataset.index || '';
    const ownSite = root.dataset.site || '';
    const state = readState();
    if (state.site && !indexUrl) state.site = ''; // without a merged index there is only this site
    root.classList.add('atlas-map');
    root.innerHTML = '<p class="am-loading">Loading the atlas…</p>';
    let atlas;
    try {
      const url = state.site && indexUrl ? indexUrl : own; // any ?site= filter needs the merged index
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      atlas = await res.json();
    } catch (error) {
      root.innerHTML = `<p class="am-error">The atlas could not be loaded (${esc(error.message)}). Read it directly: <a href="${esc(own)}">${esc(own)}</a>.</p>`;
      return;
    }
    root.dispatchEvent(new CustomEvent('atlas:loaded', { detail: atlas, bubbles: true })); // pages reuse the document instead of fetching it again
    const byId = new Map(atlas.records.map((r) => [r.id, r]));
    const center = { lat: atlas.center.lat, lon: atlas.center.lon };
    const radius = atlas.radiusMiles || 25;
    const types = TYPE_ORDER.filter((t) => atlas.records.some((r) => r.type === t));
    const layers = atlas.layers || [];
    const sites = [...new Set(atlas.records.map((r) => r.site))].sort();
    let selected = state.id && byId.has(state.id) ? state.id : '';
    let view = { k: 1, x: 0, y: 0 };

    /* ---------- chrome ---------- */
    const search = el('input', { type: 'search', class: 'am-search', placeholder: 'Search names, tags, layers…', value: state.q, 'aria-label': 'Search the atlas', oninput: () => { state.q = search.value.trim(); update(); } });
    const typeSel = el('select', { class: 'am-select', 'aria-label': 'Type', onchange: () => { state.type = typeSel.value; update(); } }, [el('option', { value: '', text: 'Every type' }), ...types.map((t) => el('option', { value: t, text: TYPE_LABEL[t] || t, selected: state.type === t }))]);
    const layerSel = el('select', { class: 'am-select', 'aria-label': 'Layer', onchange: () => { state.layer = layerSel.value; update(); } }, [el('option', { value: '', text: 'Every layer' }), ...layers.map((l) => el('option', { value: l.id, text: `${l.name} (${l.count})`, selected: state.layer === l.id }))]);
    const placedBox = el('input', { type: 'checkbox', checked: state.placed, onchange: () => { state.placed = placedBox.checked; update(); } });
    const siteSel = indexUrl || sites.length > 1 ? el('select', { class: 'am-select', 'aria-label': 'Site', onchange: () => { state.site = siteSel.value; writeState(state); location.reload(); } }, [
      el('option', { value: '', text: ownSite ? `This site (${ownSite})` : 'This site', selected: state.site !== 'all' }),
      indexUrl ? el('option', { value: 'all', text: 'All sites (merged index)', selected: state.site === 'all' }) : null,
    ]) : null;
    const controls = el('div', { class: 'am-controls' }, [search, typeSel, layerSel, el('label', { class: 'am-check' }, [placedBox, ' placed only']), siteSel]);
    const stats = el('p', { class: 'am-stats' });
    const legend = el('div', { class: 'am-legend', role: 'list' });
    const svg = svgEl('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'am-svg', role: 'img', 'aria-label': `Geodesic plot of ${atlas.name}: north up, ${radius}-mile ring` });
    const base = svgEl('g', { class: 'am-base' });
    const pins = svgEl('g', { class: 'am-pins' });
    const world = svgEl('g', { class: 'am-world' });
    world.append(base, pins);
    svg.append(world);
    const tools = el('div', { class: 'am-tools' }, [
      el('button', { type: 'button', 'aria-label': 'Zoom in', onclick: () => zoom(1.4) }, '＋'),
      el('button', { type: 'button', 'aria-label': 'Zoom out', onclick: () => zoom(1 / 1.4) }, '−'),
      el('button', { type: 'button', onclick: () => { view = { k: 1, x: 0, y: 0 }; applyView(); } }, 'Reset'),
    ]);
    const mapPanel = el('div', { class: 'am-map' }, [el('div', { class: 'am-map-top' }, [el('span', { class: 'am-mono', text: `North ↑ · ${radius}-mile ring · straight-line distance from ${atlas.center.name}` }), tools]), svg]);
    const list = el('ol', { class: 'am-list', 'aria-label': 'Records' });
    const more = el('button', { type: 'button', class: 'am-more', hidden: true, onclick: () => { listLimit += 200; renderList(); } }, 'Show more');
    const detail = el('aside', { class: 'am-detail', 'aria-live': 'polite' });
    const foot = el('p', { class: 'am-foot', html: `${esc(atlas.notOfficial || '')} License ${esc(atlas.license)}${atlas.licenseNote ? `: ${esc(atlas.licenseNote)}` : ''} Generated ${esc((atlas.generated || '').slice(0, 10))}. Distances are straight-line great-circle miles, never travel time. <a href="${esc(state.site === 'all' ? indexUrl : own)}">JSON</a>${atlas.spec ? ` · <a href="${esc(atlas.spec)}">spec</a>` : ''}` });
    root.replaceChildren(controls, stats, legend, el('div', { class: 'am-grid' }, [mapPanel, el('div', { class: 'am-side' }, [detail, list, more])]), foot);

    /* ---------- base map ---------- */
    const grid = svgEl('pattern', { id: 'am-grid', width: 38, height: 38, patternUnits: 'userSpaceOnUse' });
    grid.append(svgEl('path', { d: 'M38 0H0V38', class: 'am-gridline' }));
    const defs = svgEl('defs'); defs.append(grid); base.append(defs);
    base.append(svgEl('rect', { width: SIZE, height: SIZE, fill: 'url(#am-grid)' }));
    const px = (miles) => (miles / radius) * SIZE * RING;
    base.append(svgEl('circle', { cx: SIZE / 2, cy: SIZE / 2, r: px(radius), class: 'am-ring am-ring-outer' }));
    for (const m of [10, 20]) if (m < radius) base.append(svgEl('circle', { cx: SIZE / 2, cy: SIZE / 2, r: px(m), class: 'am-ring' }));
    base.append(svgEl('path', { d: `M${SIZE / 2} ${SIZE / 2 - px(radius) - 8}v${2 * px(radius) + 16}M${SIZE / 2 - px(radius) - 8} ${SIZE / 2}h${2 * px(radius) + 16}`, class: 'am-axis' }));
    for (const [m, label] of [[10, '10 mi'], [20, '20 mi'], [radius, `${radius} mi / N`]]) if (m <= radius) { const t = svgEl('text', { x: SIZE / 2 + 8, y: SIZE / 2 - px(m) - 4, class: 'am-label' }); t.textContent = label; base.append(t); }
    for (const [x, y, label] of [[SIZE / 2 - px(radius) - 30, SIZE / 2 + 5, 'W'], [SIZE / 2 + px(radius) + 14, SIZE / 2 + 5, 'E'], [SIZE / 2 - 5, SIZE / 2 + px(radius) + 26, 'S']]) { const t = svgEl('text', { x, y, class: 'am-label' }); t.textContent = label; base.append(t); }
    base.append(svgEl('circle', { cx: SIZE / 2, cy: SIZE / 2, r: 6, class: 'am-center' }));
    const ct = svgEl('text', { x: SIZE / 2 + 10, y: SIZE / 2 + 20, class: 'am-label' }); ct.textContent = atlas.center.name; base.append(ct);

    /* ---------- pan / zoom ---------- */
    function applyView() { world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.k})`); }
    function zoom(f, cx = SIZE / 2, cy = SIZE / 2) { const k = Math.min(12, Math.max(0.6, view.k * f)); const r = k / view.k; view = { k, x: cx - (cx - view.x) * r, y: cy - (cy - view.y) * r }; applyView(); }
    const toSvg = (e) => { const b = svg.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * SIZE, y: ((e.clientY - b.top) / b.height) * SIZE }; };
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const p = toSvg(e); zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y); }, { passive: false });
    let drag = null;
    let justDragged = false; // set on pointerup after a pan so the click that follows does not change the selection
    svg.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; justDragged = false; drag = { ...toSvg(e), vx: view.x, vy: view.y, moved: false }; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', (e) => { if (!drag) return; const p = toSvg(e); const dx = p.x - drag.x, dy = p.y - drag.y; if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true; view.x = drag.vx + dx; view.y = drag.vy + dy; applyView(); });
    svg.addEventListener('pointerup', () => { justDragged = Boolean(drag && drag.moved); drag = null; });
    svg.addEventListener('pointercancel', () => { justDragged = Boolean(drag && drag.moved); drag = null; });

    /* ---------- filtering ---------- */
    const norm = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
    function filtered() {
      const terms = norm(state.q).split(/\s+/).filter(Boolean);
      return atlas.records.filter((r) => {
        if (state.type && r.type !== state.type) return false;
        if (state.layer && r.layer !== state.layer) return false;
        if (state.site && state.site !== 'all' && r.site !== state.site) return false;
        if (state.placed && !r.location) return false;
        if (!terms.length) return true;
        const hay = norm([r.name, r.summary, r.type, r.layer, r.id, (r.tags || []).join(' '), r.location && r.location.area, r.location && r.location.address].filter(Boolean).join(' '));
        return terms.every((t) => hay.includes(t));
      });
    }

    /* ---------- rendering ---------- */
    let current = [];
    let listLimit = 200;
    function renderPins() {
      pins.replaceChildren();
      const placed = current.filter((r) => r.location);
      for (const r of placed) {
        const p = project(center, r.location, radius);
        const c = svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: r.id === selected ? 7 : 4.3, class: `am-pin${p.beyond ? ' am-beyond' : ''}${r.id === selected ? ' am-selected' : ''}`, fill: COLORS[r.type] || '#333', 'data-id': r.id, tabindex: 0, role: 'button', 'aria-label': `${r.name}, ${TYPE_LABEL[r.type] || r.type}, ${p.miles.toFixed(1)} miles` });
        const t = svgEl('title'); t.textContent = `${r.name} · ${TYPE_LABEL[r.type] || r.type} · ${p.miles.toFixed(1)} mi${p.beyond ? ' (beyond the ring)' : ''}`; c.append(t);
        c.addEventListener('click', (e) => { if (justDragged) { justDragged = false; return; } e.stopPropagation(); select(r.id); });
        c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.id); } });
        pins.append(c);
      }
    }
    function renderLegend() {
      legend.replaceChildren(...types.map((t) => { const n = current.filter((r) => r.type === t).length; return el('button', { type: 'button', role: 'listitem', class: `am-chip${state.type === t ? ' am-on' : ''}`, 'aria-pressed': state.type === t ? 'true' : 'false', onclick: () => { state.type = state.type === t ? '' : t; typeSel.value = state.type; update(); } }, [el('i', { style: `background:${COLORS[t] || '#333'}` }), ` ${TYPE_LABEL[t] || t} `, el('small', { text: String(n) })]); }));
    }
    function renderStats() {
      const placed = current.filter((r) => r.location).length;
      const beyond = current.filter((r) => r.location && distanceMiles(center, r.location) > radius).length;
      stats.textContent = `${current.length} of ${atlas.records.length} records · ${placed} placed${beyond ? ` (${beyond} beyond ${radius} mi)` : ''} · ${current.length - placed} without coordinates · ${layers.length} layers${atlas.kind === 'merged-index' ? ` · ${(atlas.sites || []).filter((s) => s.ok).length} sites` : ''}`;
    }
    function renderList() {
      const rows = [...current].sort((a, b) => (a.location ? 0 : 1) - (b.location ? 0 : 1) || TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.name.localeCompare(b.name));
      list.replaceChildren(...rows.slice(0, listLimit).map((r) => {
        const miles = r.location ? distanceMiles(center, r.location) : null;
        return el('li', { class: `am-row${r.id === selected ? ' am-selected' : ''}`, 'data-id': r.id }, [
          el('button', { type: 'button', class: 'am-row-btn', onclick: () => select(r.id, false) }, [
            el('i', { class: r.location ? 'am-dot' : 'am-dot am-dot-empty', style: `background:${r.location ? COLORS[r.type] || '#333' : 'transparent'};border-color:${COLORS[r.type] || '#333'}` }),
            el('span', { class: 'am-row-name', text: r.name }),
            el('span', { class: 'am-row-meta', text: `${TYPE_LABEL[r.type] || r.type}${miles != null ? ` · ${miles.toFixed(1)} mi` : r.location && r.location.area ? ` · ${r.location.area}` : ' · not placed'}${atlas.kind === 'merged-index' ? ` · ${r.site}` : ''}` }),
          ]),
        ]);
      }));
      more.hidden = rows.length <= listLimit;
      if (!rows.length) list.append(el('li', { class: 'am-empty', text: 'Nothing matches. Clear a filter or search for less.' }));
    }
    function sourceLine(s) { return el('li', {}, [el('a', { href: s.url, rel: 'noopener', text: s.title || s.url.replace(/^https:\/\//, '') }), ` · ${s.label} · checked ${s.checked}`, s.quote ? el('q', { text: s.quote }) : null]); }
    function locationHtml(r, miles) {
      if (!r.location) return 'No coordinates yet. Listed, not pinned.';
      const l = r.location;
      let out = `${miles.toFixed(2)} mi from ${esc(atlas.center.name)}, ${esc(l.precision)} precision`;
      if (l.area) out += `, area ${esc(l.area)}`;
      if (l.address) out += `<br>${esc(l.address)}`;
      if (l.method || l.source || l.license) {
        out += '<br><small>Coordinates';
        if (l.method) out += `: ${esc(l.method)}`;
        if (l.source) out += ` · <a href="${esc(l.source)}" rel="noopener">source</a>`;
        if (l.license) out += ` · ${esc(l.license)}`;
        out += '</small>';
      }
      return out;
    }
    function renderDetail() {
      const r = byId.get(selected);
      if (!r) { detail.replaceChildren(el('p', { class: 'am-hint', text: 'Select a pin or a row to read its record, sources and links.' })); return; }
      const miles = r.location ? distanceMiles(center, r.location) : null;
      const layer = layers.find((l) => l.id === r.layer);
      const linkRows = (r.links || []).map((l) => { const t = byId.get(l.id); return el('li', {}, [`${l.rel} → `, t ? el('button', { type: 'button', class: 'am-link', onclick: () => select(t.id), text: t.name }) : el('code', { text: l.id }), t ? ` (${TYPE_LABEL[t.type] || t.type})` : ' (another site’s atlas)', l.note ? ` · ${l.note}` : '']); });
      const incoming = atlas.records.filter((x) => (x.links || []).some((l) => l.id === r.id)).map((x) => el('li', {}, [el('button', { type: 'button', class: 'am-link', onclick: () => select(x.id), text: x.name }), ` → ${(x.links.find((l) => l.id === r.id) || {}).rel} this`]));
      detail.replaceChildren(...[
        el('p', { class: 'am-kicker' }, [el('i', { style: `background:${COLORS[r.type] || '#333'}` }), ` ${TYPE_LABEL[r.type] || r.type} · ${r.site}${r.status && r.status !== 'live' ? ` · ${r.status}` : ''}`]),
        el('h2', { text: r.name }),
        r.summary ? el('p', { text: r.summary }) : null,
        el('p', { class: 'am-meta', html: locationHtml(r, miles) }),
        el('p', { class: 'am-actions' }, [el('a', { href: r.url, rel: 'noopener', class: 'am-btn', text: 'Open page' }), r.data ? el('a', { href: r.data, rel: 'noopener', class: 'am-btn am-btn-quiet', text: 'Data' }) : null, r.location ? el('a', { href: `https://www.openstreetmap.org/?mlat=${r.location.lat}&mlon=${r.location.lon}#map=16/${r.location.lat}/${r.location.lon}`, rel: 'noopener', class: 'am-btn am-btn-quiet', text: 'On OpenStreetMap' }) : null]),
        el('h3', { text: 'Sources' }), el('ul', { class: 'am-sources' }, r.source.map(sourceLine)),
        linkRows.length || incoming.length ? el('h3', { text: 'Links' }) : null,
        linkRows.length ? el('ul', { class: 'am-links' }, linkRows) : null,
        incoming.length ? el('ul', { class: 'am-links am-incoming' }, incoming) : null,
        el('p', { class: 'am-fine', html: `<code>${esc(r.id)}</code> · layer ${esc(layer ? layer.name : r.layer)} · updated ${esc(r.updated)} · ${esc(r.license)}${r.attribution ? ` · ${esc(r.attribution)}` : ''}${(r.tags || []).length ? `<br>${r.tags.map((t) => `<span class="am-tag">${esc(t)}</span>`).join(' ')}` : ''}` }),
      ].filter(Boolean));
    }
    function select(id, toggle = true) {
      selected = toggle && id === selected ? '' : id;
      state.id = selected;
      writeState(state);
      renderPins(); renderDetail();
      for (const row of list.children) row.classList.toggle('am-selected', row.dataset.id === selected);
      const row = list.querySelector(`[data-id="${CSS.escape(selected)}"]`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    }
    function update() {
      current = filtered();
      listLimit = 200;
      writeState(state);
      renderStats(); renderLegend(); renderPins(); renderList(); renderDetail();
    }
    svg.addEventListener('click', (e) => { if (justDragged) { justDragged = false; return; } if (e.target === svg || e.target.closest('.am-base')) select(''); });
    window.addEventListener('hashchange', () => { let id = location.hash.slice(1); try { id = decodeURIComponent(id); } catch (error) { return; } if (byId.has(id) && id !== selected) select(id); });
    update();
    if (selected) renderDetail();
  }

  function boot() { document.querySelectorAll('[data-atlas]').forEach((root) => { mount(root); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.AtlasMap = { mount, project, distanceMiles };
})();
