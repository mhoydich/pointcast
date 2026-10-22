import {
  GRID_SIZE, LESSONS, TOOLS, STORAGE_KEY, TILES,
  analyze, build, canBuild, createCity, cityToText, monthLabel, readCity, renameCity, serializeCity, setTaxRate, tick, index,
} from '../lib/gridtown.mjs';
import type { City, TileId, ToolId } from '../lib/gridtown.mjs';

const COLORS: Record<string, string> = {
  grass: '#b9cf8e', water: '#7fb3d5', trees: '#6f9a5a', road: '#8f8f86',
  res: '#e6b85c', com: '#6c8fd6', ind: '#b37a5a', park: '#7cc27a', power: '#5a5a6e',
};
/** A touch must rest this long before it paints; a shorter touch is a tap or a scroll. */
const HOLD_MS = 200;
/** Finger travel, in CSS pixels, beyond which a touch is a swipe rather than a tap. */
const SLOP = 8;

let cleanUp: (() => void) | undefined;
let mountedPage: HTMLElement | undefined;

function boot() {
  const page = document.querySelector<HTMLElement>('[data-gridtown]');
  if (page && page === mountedPage) return;
  cleanUp?.();
  if (!page) return;
  mountedPage = page;
  const root: HTMLElement = page;
  const controller = new AbortController();
  const { signal } = controller;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const canvas = get<HTMLCanvasElement>('[data-map]');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const status = get('[data-status]');
  const hint = get('[data-hint]');
  const mapHelp = get('[data-map-help]');
  const say = (message: string) => { status.textContent = message; };

  /* ----------------------------- state ----------------------------- */
  let persistent = true;
  let city: City | null = null;
  try {
    city = readCity(localStorage.getItem(STORAGE_KEY));
    localStorage.setItem('pc:gridtown:probe', '1');
    localStorage.removeItem('pc:gridtown:probe');
  } catch { persistent = false; }
  const params = new URLSearchParams(location.search);
  const urlSeed = params.get('seed');
  /** A map link that could not replace a saved city; New city offers it first. */
  let pendingSeed: number | undefined;
  if (urlSeed !== null && (!city || String(city.seed) !== urlSeed)) {
    const untouched = !city || (city.month === 0 && city.tiles.every((t) => TILES[t.id].terrain));
    if (untouched) city = createCity(Number(urlSeed));
    else { pendingSeed = Number(urlSeed); say(`This link is for map ${urlSeed}. Your saved city is loaded; New city will offer that map.`); }
  }
  if (!city) city = createCity(Math.floor(Math.random() * 4294967296));
  let tool: ToolId = 'road';
  let cursor = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let showSmoke = false;
  let auto: number | undefined;
  let painting = false;
  let lastPainted = -1;
  let hover = -1;
  /** The city before the last build, for one step of undo. Cleared by a month, an import or a new city. */
  let undoCity: City | null = null;
  /** A touch that has started on the map and not yet decided whether it is a tap, a hold or a swipe. */
  let press: { x: number; y: number; tileX: number; tileY: number; id: number; moved: boolean; timer?: number } | null = null;

  const storageNote = get('[data-storage-note]');
  if (!persistent) storageNote.textContent = 'This browser is not keeping storage, so the city lives only on this page. Export it to keep it.';

  function save() {
    if (!persistent || !city) return;
    try { localStorage.setItem(STORAGE_KEY, serializeCity(city)); } catch { persistent = false; storageNote.textContent = 'Saving stopped working in this browser. Export the city to keep it.'; }
  }

  /** Replace the city. Lessons are announced only for play actions, never for loads. */
  function commit(next: City, message?: string, { announce = true } = {}) {
    const before = city;
    city = next;
    save();
    render();
    const fresh = announce && before ? next.lessons.filter((id) => !before.lessons.includes(id)) : [];
    const lessonText = fresh.map((id) => `Lesson done: ${LESSONS.find((l) => l.id === id)!.title}.`).join(' ');
    const finale = fresh.length && next.lessons.length === LESSONS.length ? ' That is every lesson. It is your city now.' : '';
    const text = [message, lessonText].filter(Boolean).join(' ') + finale;
    if (text) say(text);
  }

  /* ----------------------------- drawing ----------------------------- */
  function fit() {
    const size = Math.max(240, Math.floor(canvas.getBoundingClientRect().width));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    draw();
  }

  function draw() {
    if (!city) return;
    const px = canvas.width / GRID_SIZE;
    const { powered, roaded, pollution, value } = analyze(city);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_SIZE; y += 1) for (let x = 0; x < GRID_SIZE; x += 1) {
      const i = index(x, y);
      const tile = city.tiles[i];
      drawTile(ctx!, tile.id, tile.level, x * px, y * px, px);
      if (TILES[tile.id].zone) {
        if (!roaded[i]) corner(ctx!, x * px, y * px, px, '#d94c3d');
        if (!powered[i]) bolt(ctx!, x * px, y * px, px);
      }
      if (showSmoke) {
        if (pollution[i] > 0) { ctx!.fillStyle = `rgba(60,50,40,${Math.min(0.55, 0.18 * pollution[i])})`; ctx!.fillRect(x * px, y * px, px, px); }
        else if (value[i] > 0 && tile.id !== 'water') { ctx!.fillStyle = `rgba(120,200,120,${Math.min(0.35, 0.1 * value[i])})`; ctx!.fillRect(x * px, y * px, px, px); }
      }
    }
    // grid
    ctx!.strokeStyle = 'rgba(40,50,30,0.12)'; ctx!.lineWidth = 1;
    for (let k = 0; k <= GRID_SIZE; k += 1) {
      ctx!.beginPath(); ctx!.moveTo(k * px, 0); ctx!.lineTo(k * px, canvas.height); ctx!.stroke();
      ctx!.beginPath(); ctx!.moveTo(0, k * px); ctx!.lineTo(canvas.width, k * px); ctx!.stroke();
    }
    const focusTile = lastInput === 'keyboard' || hover < 0 ? index(cursor.x, cursor.y) : hover;
    const fx = focusTile % GRID_SIZE; const fy = Math.floor(focusTile / GRID_SIZE);
    const ok = canBuild(city, tool, fx, fy).ok;
    ctx!.strokeStyle = ok ? '#1f2a1f' : '#d94c3d'; ctx!.lineWidth = Math.max(2, px * 0.08);
    ctx!.strokeRect(fx * px + ctx!.lineWidth / 2, fy * px + ctx!.lineWidth / 2, px - ctx!.lineWidth, px - ctx!.lineWidth);
  }

  function drawTile(c: CanvasRenderingContext2D, id: TileId, level: number, x: number, y: number, s: number) {
    c.fillStyle = COLORS[id] ?? '#ccc';
    if (TILES[id].zone) c.fillStyle = COLORS.grass;
    c.fillRect(x, y, s, s);
    const u = s / 16;
    switch (id) {
      case 'water': {
        c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = Math.max(1, u * 0.6);
        c.beginPath(); c.moveTo(x + 3 * u, y + 6 * u); c.quadraticCurveTo(x + 6 * u, y + 4 * u, x + 9 * u, y + 6 * u); c.quadraticCurveTo(x + 11 * u, y + 7.5 * u, x + 13 * u, y + 6 * u); c.stroke();
        c.beginPath(); c.moveTo(x + 4 * u, y + 11 * u); c.quadraticCurveTo(x + 7 * u, y + 9 * u, x + 10 * u, y + 11 * u); c.stroke();
        break;
      }
      case 'trees': {
        c.fillStyle = '#4f7a3f';
        for (const [tx, ty, r] of [[5, 6, 3.2], [10.5, 5.5, 2.8], [8, 10.5, 3.4]]) { c.beginPath(); c.arc(x + tx * u, y + ty * u, r * u, 0, Math.PI * 2); c.fill(); }
        break;
      }
      case 'road': {
        c.strokeStyle = '#e8e3c8'; c.lineWidth = Math.max(1, u * 0.7); c.setLineDash([u * 2, u * 2]);
        c.beginPath(); c.moveTo(x, y + s / 2); c.lineTo(x + s, y + s / 2); c.stroke();
        c.beginPath(); c.moveTo(x + s / 2, y); c.lineTo(x + s / 2, y + s); c.stroke();
        c.setLineDash([]);
        break;
      }
      case 'park': {
        c.fillStyle = '#4f7a3f'; c.beginPath(); c.arc(x + 8 * u, y + 7 * u, 3.5 * u, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#7a5a3a'; c.fillRect(x + 7.3 * u, y + 9 * u, 1.4 * u, 4 * u);
        c.fillStyle = '#e8e3c8'; c.fillRect(x + 2 * u, y + 13 * u, 12 * u, 1 * u);
        break;
      }
      case 'power': {
        c.fillStyle = '#3f3f52'; c.fillRect(x + 2 * u, y + 7 * u, 12 * u, 7 * u);
        c.fillStyle = '#6e6e86'; c.fillRect(x + 4 * u, y + 2 * u, 2.2 * u, 6 * u); c.fillRect(x + 8 * u, y + 3 * u, 2.2 * u, 5 * u);
        c.fillStyle = '#ffd95a'; c.beginPath(); c.moveTo(x + 9 * u, y + 8 * u); c.lineTo(x + 6.5 * u, y + 11.2 * u); c.lineTo(x + 8.2 * u, y + 11.2 * u); c.lineTo(x + 7 * u, y + 13.5 * u); c.lineTo(x + 10 * u, y + 10 * u); c.lineTo(x + 8.3 * u, y + 10 * u); c.closePath(); c.fill();
        break;
      }
      case 'res': case 'com': case 'ind': {
        c.strokeStyle = COLORS[id]; c.lineWidth = Math.max(1, u * 0.8); c.setLineDash([u * 1.2, u * 1.2]);
        c.strokeRect(x + 1.5 * u, y + 1.5 * u, 13 * u, 13 * u); c.setLineDash([]);
        if (level === 0) break;
        c.fillStyle = COLORS[id];
        if (id === 'res') {
          const n = level; const w = 12 / n;
          for (let k = 0; k < n; k += 1) {
            const bx = x + (2 + k * w) * u; const bw = (w - 1) * u; const h = (3 + level * 2) * u;
            c.fillRect(bx, y + 14 * u - h, bw, h);
            c.fillStyle = '#a3462f'; c.beginPath(); c.moveTo(bx - u * 0.3, y + 14 * u - h); c.lineTo(bx + bw / 2, y + 14 * u - h - 2.5 * u); c.lineTo(bx + bw + u * 0.3, y + 14 * u - h); c.closePath(); c.fill();
            c.fillStyle = COLORS[id];
          }
        } else if (id === 'com') {
          const h = (4 + level * 3) * u;
          c.fillRect(x + 3 * u, y + 14 * u - h, 10 * u, h);
          c.fillStyle = '#dfe8ff';
          for (let r = 0; r < level; r += 1) for (let k = 0; k < 3; k += 1) c.fillRect(x + (4.2 + k * 3) * u, y + 14 * u - h + (1.2 + r * 2.6) * u, 1.6 * u, 1.6 * u);
        } else {
          const w = (6 + level * 2) * u;
          c.fillRect(x + 2 * u, y + 8 * u, w, 6 * u);
          c.fillStyle = '#7a4f38'; c.fillRect(x + 3 * u, y + 3 * u, 2 * u, 5 * u);
          if (level > 1) c.fillRect(x + 6.5 * u, y + 4 * u, 2 * u, 4 * u);
          c.fillStyle = 'rgba(80,80,80,0.5)'; c.beginPath(); c.arc(x + 4 * u, y + 2 * u, 1.3 * u, 0, Math.PI * 2); c.fill();
        }
        break;
      }
      default: break;
    }
  }

  function corner(c: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
    c.fillStyle = color; c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s, y + s * 0.3); c.lineTo(x + s * 0.7, y); c.closePath(); c.fill();
  }
  function bolt(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
    const u = s / 16;
    c.fillStyle = '#2b2b33'; c.beginPath(); c.arc(x + 3 * u, y + 3 * u, 2.4 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd95a'; c.beginPath(); c.moveTo(x + 3.6 * u, y + 1.4 * u); c.lineTo(x + 2 * u, y + 3.3 * u); c.lineTo(x + 3 * u, y + 3.3 * u); c.lineTo(x + 2.4 * u, y + 4.8 * u); c.lineTo(x + 4.1 * u, y + 2.8 * u); c.lineTo(x + 3.1 * u, y + 2.8 * u); c.closePath(); c.fill();
  }

  /* ----------------------------- panels ----------------------------- */
  const nameInput = get<HTMLInputElement>('[data-name]');
  const taxInput = get<HTMLInputElement>('[data-tax]');
  const taxOut = get('[data-tax-out]');
  const autoButton = get<HTMLButtonElement>('[data-auto]');
  const undoButton = get<HTMLButtonElement>('[data-undo]');
  const lessonCount = get('[data-lesson-count]');
  const logList = get('[data-log]');

  function render() {
    if (!city) return;
    if (document.activeElement !== nameInput) nameInput.value = city.name;
    get('[data-date]').textContent = monthLabel(city.month);
    get('[data-funds]').textContent = String(city.funds);
    get('[data-funds]').classList.toggle('is-broke', city.funds < 0);
    get('[data-pop]').textContent = String(city.stats.population);
    get('[data-jobs]').textContent = String(city.stats.jobs);
    get('[data-happy]').textContent = `${city.stats.happiness}%`;
    get('[data-power]').textContent = `${city.stats.powered} / ${city.stats.capacity}`;
    get('[data-ledger]').textContent = city.month === 0 ? 'no months yet' : `last month ${city.ledger.net >= 0 ? '+' : ''}${city.ledger.net} (in ${city.ledger.income}, out ${city.ledger.upkeep})`;
    for (const id of ['res', 'com', 'ind'] as const) {
      const bar = get<HTMLElement>(`[data-demand="${id}"]`);
      const d = city.stats.demand[id];
      bar.style.width = `${Math.abs(d) / 2}%`;
      bar.style.left = d < 0 ? `${50 - Math.abs(d) / 2}%` : '50%';
      bar.classList.toggle('is-negative', d < 0);
      bar.parentElement!.setAttribute('aria-valuenow', String(d));
      bar.parentElement!.setAttribute('aria-valuetext', `${d > 0 ? 'wanted' : d < 0 ? 'too many' : 'balanced'}, ${d}`);
    }
    if (document.activeElement !== taxInput) { taxInput.value = String(city.taxRate); taxOut.textContent = String(city.taxRate); }
    lessonCount.textContent = `${city.lessons.length} / ${LESSONS.length}`;
    let currentMarked = false;
    for (const lesson of LESSONS) {
      const li = get(`[data-lesson="${lesson.id}"]`);
      const done = city.lessons.includes(lesson.id);
      li.classList.toggle('is-done', done);
      const current = !done && !currentMarked;
      li.classList.toggle('is-current', current);
      if (current) currentMarked = true;
    }
    logList.replaceChildren(...(city.log.length === 0
      ? [Object.assign(document.createElement('li'), { className: 'gt-log-empty', textContent: 'Nothing has happened yet. Lay a road.' })]
      : city.log.map((entry) => {
        const li = document.createElement('li');
        const when = document.createElement('span'); when.className = 'gt-mono'; when.textContent = monthLabel(entry.month);
        const text = document.createElement('span'); text.textContent = entry.text;
        li.append(when, text);
        return li;
      })));
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
      const t = TOOLS.find((x) => x.id === button.dataset.tool)!;
      button.setAttribute('aria-pressed', t.id === tool ? 'true' : 'false');
      button.classList.toggle('is-unaffordable', t.id !== 'bulldoze' && city.funds < t.cost);
    }
    undoButton.disabled = !undoCity;
    draw();
  }

  function selectTool(id: ToolId) {
    tool = id;
    hint.textContent = TOOLS.find((t) => t.id === id)!.hint;
    render();
  }

  /* ----------------------------- input ----------------------------- */
  function tileAt(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * GRID_SIZE);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * GRID_SIZE);
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return null;
    return { x, y };
  }

  function place(x: number, y: number, fromDrag: boolean) {
    if (!city) return;
    const result = build(city, tool, x, y);
    if (result.ok) {
      undoCity = city;
      const label = TOOLS.find((t) => t.id === tool)!.label;
      commit(result.city, fromDrag ? undefined : `${tool === 'bulldoze' ? 'Cleared' : `${label} built at`} ${x + 1}, ${y + 1}. Funds ${result.city.funds}.`);
      return;
    }
    if (!fromDrag) say(result.reason ?? 'Cannot build there.');
  }

  const paintable = () => tool === 'road' || tool === 'res' || tool === 'com' || tool === 'ind' || tool === 'bulldoze';

  canvas.addEventListener('pointerdown', (event) => {
    const t = tileAt(event); if (!t) return;
    lastInput = 'pointer';
    canvas.focus({ preventScroll: true });
    cursor = t;
    if (event.pointerType === 'touch') {
      // A touch builds on release (a tap) or after a short hold (then it paints). A quick swipe scrolls the page.
      if (press?.timer) window.clearTimeout(press.timer);
      press = { x: event.clientX, y: event.clientY, tileX: t.x, tileY: t.y, id: event.pointerId, moved: false };
      if (paintable()) press.timer = window.setTimeout(() => {
        if (!press || press.moved) return;
        painting = true; lastPainted = index(press.tileX, press.tileY);
        try { canvas.setPointerCapture(press.id); } catch { /* capture is a nicety */ }
        if (navigator.vibrate) navigator.vibrate(8);
        place(press.tileX, press.tileY, false);
      }, HOLD_MS);
      return;
    }
    event.preventDefault();
    lastPainted = index(t.x, t.y);
    painting = paintable();
    if (painting) canvas.setPointerCapture(event.pointerId);
    place(t.x, t.y, false);
  }, { signal });
  canvas.addEventListener('pointermove', (event) => {
    if (press && !painting) {
      if (!press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) > SLOP) { press.moved = true; window.clearTimeout(press.timer); }
      return;
    }
    const t = tileAt(event);
    if (!t) return;
    const i = index(t.x, t.y);
    if (painting && i !== lastPainted) { lastPainted = i; cursor = t; place(t.x, t.y, true); return; }
    if (event.pointerType !== 'touch') { lastInput = 'pointer'; if (i !== hover) { hover = i; draw(); } }
  }, { signal });
  // Once a held touch is painting, keep the browser from turning the drag into a scroll.
  canvas.addEventListener('touchmove', (event) => { if (painting) event.preventDefault(); }, { passive: false, signal });
  const endPress = (event: PointerEvent, cancelled: boolean) => {
    if (press && event.pointerId === press.id) {
      window.clearTimeout(press.timer);
      if (!cancelled && !painting && !press.moved) place(press.tileX, press.tileY, false);
      press = null;
    }
    painting = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', (event) => endPress(event, false), { signal });
  canvas.addEventListener('pointercancel', (event) => endPress(event, true), { signal });
  canvas.addEventListener('pointerleave', () => { hover = -1; draw(); }, { signal });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });

  canvas.addEventListener('keydown', (event) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (moves[event.key]) {
      event.preventDefault();
      lastInput = 'keyboard';
      cursor = { x: Math.max(0, Math.min(GRID_SIZE - 1, cursor.x + moves[event.key][0])), y: Math.max(0, Math.min(GRID_SIZE - 1, cursor.y + moves[event.key][1])) };
      draw();
      const tile = city!.tiles[index(cursor.x, cursor.y)];
      const verdict = canBuild(city!, tool, cursor.x, cursor.y);
      mapHelp.textContent = `${cursor.x + 1}, ${cursor.y + 1}: ${TILES[tile.id].label}${tile.level ? ` level ${tile.level}` : ''}. ${verdict.ok ? `Enter builds ${TOOLS.find((t) => t.id === tool)!.label.toLowerCase()}.` : verdict.reason}`;
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lastInput = 'keyboard'; place(cursor.x, cursor.y, false); return; }
    if (event.key === 'n' || event.key === 'N') { event.preventDefault(); advance(); return; }
    if ((event.key === 'z' || event.key === 'Z') && !event.metaKey && !event.ctrlKey) { event.preventDefault(); undo(); return; }
    const byKey = TOOLS.find((t) => t.key === event.key);
    if (byKey) { event.preventDefault(); selectTool(byKey.id); say(`${byKey.label} selected.`); }
  }, { signal });
  canvas.addEventListener('focus', () => draw(), { signal });
  canvas.addEventListener('blur', () => draw(), { signal });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
    button.addEventListener('click', () => selectTool(button.dataset.tool as ToolId), { signal });
  }

  function undo() {
    if (!undoCity) { say('Nothing to undo.'); return; }
    const previous = undoCity;
    undoCity = null;
    commit(previous, `Undid the last build. Funds ${previous.funds}.`, { announce: false });
  }
  undoButton.addEventListener('click', undo, { signal });

  /* ----------------------------- time ----------------------------- */
  function advance() {
    if (!city) return;
    const next = tick(city);
    undoCity = null;
    commit(next, `${monthLabel(next.month)}: ${next.log[0]?.text ?? ''}`);
  }
  get('[data-next]').addEventListener('click', advance, { signal });
  function stopAuto() { if (auto !== undefined) { window.clearInterval(auto); auto = undefined; } autoButton.setAttribute('aria-pressed', 'false'); autoButton.textContent = 'Auto'; }
  autoButton.addEventListener('click', () => {
    if (auto !== undefined) { stopAuto(); say('Auto off.'); return; }
    auto = window.setInterval(() => { if (document.hidden) return; advance(); }, 2000);
    autoButton.setAttribute('aria-pressed', 'true'); autoButton.textContent = 'Auto on';
    say('A month every two seconds. Press Auto again to stop.');
  }, { signal });

  taxInput.addEventListener('input', () => { taxOut.textContent = taxInput.value; }, { signal });
  taxInput.addEventListener('change', () => { if (city) commit(setTaxRate(city, Number(taxInput.value)), `Tax set to ${taxInput.value}%.`); }, { signal });
  nameInput.addEventListener('change', () => { if (city) commit(renameCity(city, nameInput.value)); nameInput.value = city!.name; }, { signal });
  get<HTMLInputElement>('[data-smoke]').addEventListener('change', (event) => { showSmoke = (event.target as HTMLInputElement).checked; draw(); }, { signal });

  /* ----------------------------- ship ----------------------------- */
  const shareFallback = get('[data-share-fallback]');
  const shareUrl = () => `${location.origin}/gridtown/?seed=${city!.seed}`;
  const setUrlSeed = (seed: number) => { try { history.replaceState(null, '', `${location.pathname}?seed=${seed}`); } catch { /* history may be unavailable */ } };
  get('[data-share]').addEventListener('click', async () => {
    const url = shareUrl();
    try { await navigator.clipboard.writeText(url); say('Map link copied. Anyone who opens it starts on the same terrain.'); }
    catch { shareFallback.hidden = false; get<HTMLInputElement>('[data-share-url]').value = url; get<HTMLInputElement>('[data-share-url]').select(); }
  }, { signal });
  get('[data-copy-text]').addEventListener('click', async () => {
    const text = `${city!.name} · ${monthLabel(city!.month)} · ${city!.stats.population} people\n${cityToText(city!)}`;
    try { await navigator.clipboard.writeText(text); say('Map copied as text.'); }
    catch { shareFallback.hidden = false; get<HTMLInputElement>('[data-share-url]').value = text.replace(/\n/g, ' / '); }
  }, { signal });
  get('[data-export]').addEventListener('click', () => {
    const blob = new Blob([serializeCity(city!)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gridtown-${city!.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'city'}-${city!.seed}.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('City exported.');
  }, { signal });
  get<HTMLInputElement>('[data-import]').addEventListener('change', async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    const loaded = readCity(await file.text().catch(() => null));
    if (!loaded) { say('That file is not a Gridtown city.'); return; }
    stopAuto();
    undoCity = null;
    pendingSeed = undefined;
    setUrlSeed(loaded.seed);
    commit(loaded, `Loaded ${loaded.name}, ${monthLabel(loaded.month)}.`, { announce: false });
  }, { signal });

  const newForm = get<HTMLFormElement>('[data-new-form]');
  const seedInput = get<HTMLInputElement>('[data-seed]');
  get('[data-new]').addEventListener('click', () => {
    newForm.hidden = false;
    seedInput.value = String(pendingSeed ?? Math.floor(Math.random() * 4294967296));
    seedInput.focus({ preventScroll: true });
  }, { signal });
  get('[data-cancel-new]').addEventListener('click', () => { newForm.hidden = true; }, { signal });
  newForm.addEventListener('submit', (event) => {
    event.preventDefault();
    stopAuto();
    newForm.hidden = true;
    undoCity = null;
    pendingSeed = undefined;
    selectTool('road');
    commit(createCity(Number(seedInput.value)), 'New map. Lay a road.', { announce: false });
    setUrlSeed(city!.seed);
  }, { signal });

  /* ----------------------------- go ----------------------------- */
  const resize = new ResizeObserver(() => fit());
  resize.observe(canvas);
  fit();
  render();
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); }, { signal });
  cleanUp = () => { stopAuto(); if (press?.timer) window.clearTimeout(press.timer); resize.disconnect(); controller.abort(); cleanUp = undefined; mountedPage = undefined; };
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', () => cleanUp?.());
boot();
