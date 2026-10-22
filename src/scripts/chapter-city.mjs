// CHAPTER CITY — the playable page: map, tools, the turn, and the book.
import {
  W, H, TOOLS, MONTHS, idx, newGame, build, canBuild, analyze, totals, stepMonth, finishYear,
  startNextYear, resolveDilemma, DILEMMAS, rngFrom, cleanName,
} from './chapter-city-sim.mjs';
import { prologue, writeChapter, epilogue, novelMarkdown } from './chapter-city-story.mjs';

export const SAVE_KEY = 'pointcast.chapter-city.v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)); return true; } catch { return false; } },
};

const T = 32; // tile pixels on the backing canvas
const n = v => Math.round(v).toLocaleString('en-US');

const COLORS = {
  water: '#3d7ea6', water2: '#5596bd', sand: '#e9d9a6', grass: '#8dbb68', grass2: '#84b360', trees: '#4f8a3c',
  road: '#5a5a60', roadLine: '#f2d36b', res: '#9fd38a', com: '#8fb8e6', ind: '#e6c27a',
  resB: '#f4efe4', comB: '#dbe8f7', indB: '#9a8f86', roof: '#c45f4a', roof2: '#7a5c8a', shadow: 'rgba(0,0,0,.18)',
};

export function initChapterCity(root) {
  if (!root || root.dataset.ready) return null;
  root.dataset.ready = 'true';
  const $ = s => root.querySelector(s);
  const $$ = s => [...root.querySelectorAll(s)];
  const canvas = $('[data-map]');
  const ctx = canvas.getContext('2d');
  canvas.width = W * T; canvas.height = H * T;

  let state = store.get();
  if (!state || state.v !== 1 || !Array.isArray(state.tiles)) {
    state = newGame({ seed: Math.floor(Math.random() * 1e9) });
    state.chapters.push(prologue(state));
  }
  let tool = 'road';
  let overlay = 'none';
  let cursor = idx(12, 8);
  let hover = -1;
  let painting = false;
  let busy = false;
  let reading = state.chapters.length - 1;
  let soundOn = true;
  let analysis = analyze(state);

  // ---------- sound ----------
  let ac = null;
  const blip = (freq = 520, len = 0.05, type = 'triangle', vol = 0.05) => {
    if (!soundOn) return;
    try {
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + len + 0.02);
    } catch {}
  };
  const pageTurn = () => {
    if (!soundOn) return;
    try {
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      const len = 0.35, buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2) * 0.25;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.6;
      src.buffer = buf; src.connect(f); f.connect(ac.destination); src.start();
    } catch {}
  };

  // ---------- helpers ----------
  const toast = msg => {
    const el = $('[data-toast]');
    el.textContent = msg; el.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('is-on'), 2200);
  };
  const save = () => { if (!store.set(state)) toast('Not saved: browser storage is off.'); };

  // ---------- drawing ----------
  const noise = i => ((i * 2654435761) >>> 0) / 4294967296;
  function drawTile(i, time) {
    const x = (i % W) * T, y = Math.floor(i / W) * T, tile = state.tiles[i];
    const g = ctx;
    if (tile.terrain === 'water') {
      g.fillStyle = COLORS.water; g.fillRect(x, y, T, T);
      g.strokeStyle = COLORS.water2; g.lineWidth = 2;
      const off = Math.sin(time / 900 + i) * 3;
      g.beginPath(); g.moveTo(x + 5 + off, y + 12); g.quadraticCurveTo(x + 11 + off, y + 8, x + 17 + off, y + 12); g.stroke();
      g.beginPath(); g.moveTo(x + 14 - off, y + 23); g.quadraticCurveTo(x + 20 - off, y + 19, x + 26 - off, y + 23); g.stroke();
      return;
    }
    g.fillStyle = tile.terrain === 'sand' ? COLORS.sand : noise(i) > 0.5 ? COLORS.grass : COLORS.grass2;
    g.fillRect(x, y, T, T);
    if (!tile.t) {
      if (tile.terrain === 'trees') {
        for (let k = 0; k < 3; k++) {
          const tx = x + 7 + ((noise(i + k * 7) * 18) | 0), ty = y + 8 + ((noise(i + k * 13) * 14) | 0);
          g.fillStyle = COLORS.shadow; g.beginPath(); g.arc(tx + 2, ty + 3, 6, 0, 7); g.fill();
          g.fillStyle = COLORS.trees; g.beginPath(); g.arc(tx, ty, 6, 0, 7); g.fill();
        }
      }
      return;
    }
    const t = tile.t;
    if (t === 'road') {
      g.fillStyle = COLORS.road; g.fillRect(x, y, T, T);
      const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => {
        const nx = (i % W) + dx, ny = Math.floor(i / W) + dy;
        return nx >= 0 && ny >= 0 && nx < W && ny < H && state.tiles[idx(nx, ny)].t === 'road';
      });
      g.strokeStyle = COLORS.roadLine; g.lineWidth = 1.5; g.setLineDash([4, 4]);
      const cx = x + T / 2, cy = y + T / 2;
      g.beginPath();
      if (nb[0]) { g.moveTo(cx, cy); g.lineTo(cx, y); }
      if (nb[2]) { g.moveTo(cx, cy); g.lineTo(cx, y + T); }
      if (nb[1]) { g.moveTo(cx, cy); g.lineTo(x + T, cy); }
      if (nb[3]) { g.moveTo(cx, cy); g.lineTo(x, cy); }
      if (!nb.some(Boolean)) { g.moveTo(x + 6, cy); g.lineTo(x + T - 6, cy); }
      g.stroke(); g.setLineDash([]);
      return;
    }
    if (TOOLS[t].zone) {
      g.fillStyle = COLORS[t]; g.fillRect(x + 1, y + 1, T - 2, T - 2);
      if (!tile.lvl) {
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeRect(x + 4.5, y + 4.5, T - 9, T - 9); g.setLineDash([]);
        g.fillStyle = 'rgba(0,0,0,.45)'; g.font = 'bold 11px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(t === 'res' ? 'R' : t === 'com' ? 'C' : 'I', x + T / 2, y + T / 2 + 1);
        if (!analysis.access[i]) { g.fillStyle = '#c0392b'; g.beginPath(); g.arc(x + T - 7, y + 7, 3.5, 0, 7); g.fill(); }
        return;
      }
      drawBuilding(t, tile.lvl, x, y, i, time);
      return;
    }
    drawService(t, x, y, time, i);
  }

  function box(x, y, w, h, depth, face, top) {
    const g = ctx;
    g.fillStyle = COLORS.shadow; g.fillRect(x + 3, y + 3, w, h);
    g.fillStyle = face; g.fillRect(x, y, w, h);
    g.fillStyle = top; g.fillRect(x, y, w, depth);
  }
  function drawBuilding(t, lvl, x, y, i, time) {
    const g = ctx;
    if (t === 'res') {
      if (lvl === 1) { box(x + 8, y + 12, 16, 13, 0, COLORS.resB, COLORS.resB); roof(x + 6, y + 12, 20, COLORS.roof); }
      else if (lvl === 2) { box(x + 3, y + 14, 12, 12, 0, COLORS.resB, COLORS.resB); roof(x + 2, y + 14, 14, COLORS.roof); box(x + 17, y + 10, 12, 15, 0, COLORS.resB, COLORS.resB); roof(x + 16, y + 10, 14, COLORS.roof2); }
      else { box(x + 6, y + 3, 20, 25, 5, '#e9e2d3', '#bfb5a2'); g.fillStyle = '#7fa7c9'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.fillRect(x + 9 + c * 6, y + 10 + r * 4.5, 3, 2.5); }
    } else if (t === 'com') {
      const h = [0, 12, 18, 26][lvl], w = lvl === 3 ? 22 : 20;
      box(x + (T - w) / 2, y + T - 4 - h, w, h, 4, COLORS.comB, '#9fb4cc');
      g.fillStyle = noise(i) > 0.5 ? '#d9534f' : '#3a8f6b';
      for (let k = 0; k < 4; k++) g.fillRect(x + (T - w) / 2 + k * (w / 4), y + T - 10, w / 8, 3);
      if (lvl >= 2) { g.fillStyle = '#ffe9a8'; g.fillRect(x + 10, y + T - 4 - h + 7, 12, 2); }
    } else {
      const w = [0, 18, 22, 26][lvl];
      box(x + (T - w) / 2, y + 12, w, 16, 4, COLORS.indB, '#7d736b');
      g.fillStyle = '#6b625b'; g.fillRect(x + T / 2 + w / 2 - 7, y + 3, 4, 10);
      const puff = (time / 600 + i) % 3;
      g.fillStyle = 'rgba(230,230,230,.65)'; g.beginPath(); g.arc(x + T / 2 + w / 2 - 5 + puff, y + 2 - puff * 2, 2.5 + puff, 0, 7); g.fill();
    }
  }
  function roof(x, y, w, color) {
    const g = ctx; g.fillStyle = color; g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + w / 2, y - 7); g.lineTo(x + w, y + 1); g.closePath(); g.fill();
  }
  function drawService(t, x, y, time, i) {
    const g = ctx;
    if (t === 'park') {
      g.fillStyle = '#6fae55'; g.fillRect(x + 1, y + 1, T - 2, T - 2);
      g.fillStyle = '#e3d6a8'; g.fillRect(x + 4, y + T / 2 - 1, T - 8, 3);
      g.fillStyle = COLORS.trees; g.beginPath(); g.arc(x + 10, y + 10, 6, 0, 7); g.arc(x + 22, y + 23, 5, 0, 7); g.fill();
      g.fillStyle = '#8a5a3c'; g.fillRect(x + 18, y + 9, 8, 2);
      return;
    }
    const spec = {
      power: ['#6e6e74', '#4d4d52'], water: ['#9fb9c9', '#6f8fa3'], school: ['#e9c46a', '#c79f3c'],
      clinic: ['#f6f6f6', '#cfcfcf'], fire: ['#d9534f', '#a93b37'], police: ['#4a6fa5', '#34507a'],
    }[t];
    if (t === 'water') {
      g.fillStyle = '#7d8c95'; g.fillRect(x + 9, y + 14, 2, 14); g.fillRect(x + 21, y + 14, 2, 14);
      g.fillStyle = COLORS.shadow; g.beginPath(); g.ellipse(x + 18, y + 12, 11, 8, 0, 0, 7); g.fill();
      g.fillStyle = spec[0]; g.beginPath(); g.ellipse(x + 16, y + 10, 11, 8, 0, 0, 7); g.fill();
      g.fillStyle = spec[1]; g.fillRect(x + 6, y + 9, 20, 2);
      return;
    }
    box(x + 4, y + 8, T - 8, T - 12, 5, spec[0], spec[1]);
    if (t === 'power') {
      g.fillStyle = '#8a8a90'; g.beginPath(); g.moveTo(x + 18, y + 22); g.lineTo(x + 20, y + 3); g.lineTo(x + 28, y + 3); g.lineTo(x + 30, y + 22); g.fill();
      const p = (time / 500) % 4;
      g.fillStyle = 'rgba(240,240,240,.7)'; g.beginPath(); g.arc(x + 24 + p, y + 1 - p, 3 + p, 0, 7); g.fill();
      g.fillStyle = '#f2d36b'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚡', x + 11, y + 19);
    } else if (t === 'school') {
      g.fillStyle = '#5a3d2b'; g.fillRect(x + 15, y + 2, 1.5, 9); g.fillStyle = '#e63946'; g.fillRect(x + 16.5, y + 2, 7, 4);
      g.fillStyle = '#5a3d2b'; g.fillRect(x + 13, y + 19, 6, 9);
    } else if (t === 'clinic') {
      g.fillStyle = '#d62828'; g.fillRect(x + 14, y + 13, 4, 12); g.fillRect(x + 10, y + 17, 12, 4);
    } else if (t === 'fire') {
      g.fillStyle = '#3a3a3a'; g.fillRect(x + 8, y + 18, 16, 10); g.fillStyle = '#fff'; g.fillRect(x + 8, y + 22, 16, 1);
    } else if (t === 'police') {
      g.fillStyle = '#f2d36b'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', x + T / 2, y + 20);
    }
  }

  function drawOverlay() {
    if (overlay === 'none') return;
    for (let i = 0; i < W * H; i++) {
      let v = 0, color = '0,0,0';
      if (overlay === 'pollution') { v = Math.min(1, analysis.pollution[i] / 8); color = '120,70,30'; }
      else if (overlay === 'crime') { v = Math.min(1, analysis.crime[i] / 6); color = '160,20,60'; }
      else if (overlay === 'land') { const l = analysis.land[i] / 100; v = 0.55; color = `${Math.round(220 * (1 - l))},${Math.round(200 * l)},60`; }
      else if (overlay === 'services') { const c = analysis.cover; v = Math.min(1, (Math.min(1, c.school[i]) + Math.min(1, c.clinic[i]) + Math.min(1, c.fire[i]) + Math.min(1, c.police[i])) / 4) * 0.8; color = '40,110,220'; }
      if (state.tiles[i].terrain === 'water') continue;
      ctx.fillStyle = `rgba(${color},${v})`;
      ctx.fillRect((i % W) * T, Math.floor(i / W) * T, T, T);
    }
  }

  function draw(time = performance.now()) {
    for (let i = 0; i < W * H; i++) drawTile(i, time);
    drawOverlay();
    const mark = (i, color) => {
      if (i < 0) return;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.strokeRect((i % W) * T + 1, Math.floor(i / W) * T + 1, T - 2, T - 2);
    };
    if (hover >= 0) mark(hover, canBuild(state, tool, hover).ok ? 'rgba(255,255,255,.95)' : 'rgba(220,40,40,.9)');
    if (document.activeElement === canvas) mark(cursor, '#ffd23f');
  }
  let raf = 0;
  const loop = time => { draw(time); raf = requestAnimationFrame(loop); };
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) draw(); else raf = requestAnimationFrame(loop);

  // ---------- HUD ----------
  function refreshHud() {
    const s = state.stats;
    $('[data-town]').textContent = state.name;
    $('[data-stat="year"]').textContent = state.over ? 'The End' : `${state.year}${state.month ? ` · ${MONTHS[state.month - 1].slice(0, 3)}` : ''}`;
    $('[data-stat="funds"]').textContent = n(state.funds);
    $('[data-stat="funds"]').classList.toggle('is-low', state.funds < 500);
    $('[data-stat="pop"]').textContent = n(s.pop || 0);
    $('[data-stat="approval"]').textContent = `${Math.round(state.approval)}%`;
    $('[data-stat="approval"]').classList.toggle('is-low', state.approval < 40);
    const tt = totals(state);
    const powerCap = (tt.count.power || 0) * 130, powerUse = tt.zones + tt.services * 2;
    const waterCap = (tt.count.water || 0) * 160, waterUse = tt.zones;
    $('[data-stat="power"]').textContent = `${powerUse}/${powerCap}`;
    $('[data-stat="power"]').classList.toggle('is-low', powerUse > powerCap);
    $('[data-stat="water"]').textContent = `${waterUse}/${waterCap}`;
    $('[data-stat="water"]').classList.toggle('is-low', waterUse > waterCap);
    for (const k of ['r', 'c', 'i']) {
      const v = s.demand?.[k] || 0;
      const bar = root.querySelector(`[data-bar="${k}"] i`);
      bar.style.height = `${Math.abs(v) * 50}%`;
      bar.style.bottom = v >= 0 ? '50%' : `${50 - Math.abs(v) * 50}%`;
      bar.className = v >= 0 ? 'is-up' : 'is-down';
    }
    $('[data-tax]').value = String(state.tax);
    $('[data-tax-out]').textContent = `${state.tax}%`;
    const turn = $('[data-act="turn"]');
    turn.textContent = state.over ? 'The book is finished' : state.pending ? 'Decide first ↓' : `Write Chapter ${state.year} →`;
    turn.disabled = !!state.over || !!state.pending || busy;
    $('[data-hint]').textContent = hintText();
  }
  function hintText() {
    if (state.over) return 'This novel is finished. Download it, or start a new one.';
    if (state.pending) return 'A decision is waiting at the end of the last chapter.';
    const c = totals(state).count;
    if (!c.road) return 'Start with a road. Click and drag on the grass.';
    if (!c.res) return 'Zone some homes (2) within two tiles of the road.';
    if (!c.power) return 'Nothing grows without electricity. Build a power plant (6).';
    if (!c.ind && !c.com) return 'People need jobs: zone some industry (4) or shops (3).';
    if (!c.water && state.stats.pop > 100) return 'Buildings stop at the first level without water. Build a water tower (7).';
    if (!c.fire && state.stats.pop > 200) return 'No fire station yet. Fires spread fast in a town without one.';
    if (!c.school && state.stats.pop > 400) return 'The biggest homes need a school nearby.';
    return 'When you are ready, write the next chapter.';
  }

  // ---------- book ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderBook() {
    const sel = $('[data-chapters]');
    sel.innerHTML = state.chapters.map((c, k) => `<option value="${k}"${k === reading ? ' selected' : ''}>${esc(c.title)}</option>`).join('');
    const ch = state.chapters[reading];
    const page = $('[data-page]');
    if (!ch) { page.innerHTML = ''; return; }
    page.innerHTML = `<p class="cc-kicker">${reading === 0 ? 'Prologue' : ch.title.startsWith('Epilogue') ? 'Epilogue' : `Year ${ch.year}`}</p>
      <h2>${esc(ch.title.replace(/^(Chapter \d+|Prologue): /, ''))}</h2>
      <figure class="cc-clip"><figcaption>The ${esc(state.name)} Ledger</figcaption><blockquote>${esc(ch.headline)}</blockquote></figure>
      ${ch.paras.map(p => `<p>${esc(p)}</p>`).join('')}
      ${ch.stats ? `<p class="cc-ledgerline">Ledger, end of year: ${n(ch.stats.pop)} people · treasury ${n(ch.stats.funds)} · approval ${ch.stats.approval}%</p>` : ''}`;
    $('[data-act="prev"]').disabled = reading <= 0;
    $('[data-act="next"]').disabled = reading >= state.chapters.length - 1;
    renderDilemma();
  }
  function renderDilemma() {
    const box = $('[data-dilemma]');
    const d = state.pending && DILEMMAS[state.pending];
    if (!d || reading !== state.chapters.length - 1) { box.hidden = true; return; }
    box.hidden = false;
    const btn = (k, o) => `<button type="button" data-choose="${k}"${o.cost && state.funds < o.cost ? ' disabled title="Not enough in the treasury"' : ''}>${esc(o.label)}${o.cost ? ` <small>−${n(o.cost)}</small>` : ''}</button>`;
    box.innerHTML = `<p class="cc-kicker">The Mayor decides</p><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p><div>${btn('a', d.a)}${btn('b', d.b)}</div>`;
  }

  // ---------- the turn ----------
  async function takeTurn() {
    if (busy || state.over || state.pending) return;
    busy = true;
    refreshHud();
    const step = reduced ? 0 : 140;
    while (state.month < 12) {
      stepMonth(state);
      analysis = analyze(state);
      refreshHud();
      if (step) { blip(300 + state.month * 25, 0.03, 'sine', 0.025); await new Promise(r => setTimeout(r, step)); }
    }
    const record = finishYear(state);
    startNextYear(state);
    const chapter = writeChapter(state, record);
    state.chapters.push(chapter);
    if (state.over) state.chapters.push(epilogue({ ...state, year: record.year }));
    analysis = analyze(state);
    reading = state.chapters.length - (state.over ? 2 : 1);
    busy = false;
    save();
    renderBook();
    refreshHud();
    pageTurn();
    $('[data-page]').focus?.();
    $('.cc-book').scrollIntoView?.({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    if (state.over) toast(state.over === 'election' ? 'You lost the election. The book has an epilogue.' : 'The treasury ran dry. The book has an epilogue.');
  }

  // ---------- building ----------
  function apply(i, quiet = false) {
    if (i < 0 || busy) return;
    const res = build(state, tool, i);
    if (!res.ok) { if (!quiet) toast(res.why); return; }
    analysis = analyze(state);
    blip(tool === 'doze' ? 180 : 440 + Math.random() * 120, 0.04);
    refreshHud();
    clearTimeout(apply.t); apply.t = setTimeout(save, 400);
  }
  const tileAt = e => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * W), y = Math.floor(((e.clientY - r.top) / r.height) * H);
    return x >= 0 && y >= 0 && x < W && y < H ? idx(x, y) : -1;
  };
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    painting = true; canvas.setPointerCapture?.(e.pointerId);
    const i = tileAt(e); cursor = i; apply(i);
  });
  canvas.addEventListener('pointermove', e => {
    const i = tileAt(e);
    hover = i;
    showTip(i, e);
    if (painting && (tool === 'road' || TOOLS[tool].zone || tool === 'doze' || tool === 'park') && i >= 0) apply(i, true);
  });
  canvas.addEventListener('pointerup', () => { painting = false; });
  canvas.addEventListener('pointerleave', () => { hover = -1; $('[data-tip]').hidden = true; if (reduced) draw(); });
  canvas.addEventListener('keydown', e => {
    const x = cursor % W, y = Math.floor(cursor / W);
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      cursor = idx(Math.max(0, Math.min(W - 1, x + dx)), Math.max(0, Math.min(H - 1, y + dy)));
      if (e.shiftKey) apply(cursor, true);
      describe(cursor);
    } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(cursor); describe(cursor); }
    if (reduced) draw();
  });
  canvas.addEventListener('focus', () => describe(cursor));

  const terrainName = { water: 'sea', sand: 'beach', grass: 'grass', trees: 'trees' };
  function tileText(i) {
    const t = state.tiles[i];
    const name = t.t ? TOOLS[t.t].label : terrainName[t.terrain];
    const bits = [name];
    if (t.t && TOOLS[t.t].zone) bits.push(t.lvl ? `level ${t.lvl}` : analysis.access[i] ? 'empty lot' : 'no road nearby');
    const dist = state.district[i] && state.districtNames[state.district[i]];
    if (dist) bits.push(dist);
    bits.push(`land value ${Math.round(analysis.land[i])}`);
    if (analysis.pollution[i] > 1) bits.push(`smoke ${analysis.pollution[i].toFixed(1)}`);
    const check = canBuild(state, tool, i);
    bits.push(check.ok ? `${TOOLS[tool].label}: ${check.cost}` : check.why);
    return bits.join(' · ');
  }
  function showTip(i, e) {
    const tip = $('[data-tip]');
    if (i < 0) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.textContent = tileText(i);
    const r = canvas.parentElement.getBoundingClientRect();
    tip.style.left = `${Math.min(r.width - 220, Math.max(4, e.clientX - r.left + 12))}px`;
    tip.style.top = `${Math.max(4, e.clientY - r.top + 14)}px`;
  }
  function describe(i) {
    const tip = $('[data-tip]');
    tip.hidden = false;
    tip.textContent = `${i % W + 1}, ${Math.floor(i / W) + 1}: ${tileText(i)}`;
    tip.style.left = '8px'; tip.style.top = '8px';
  }

  // ---------- controls ----------
  const setTool = t => {
    tool = t;
    $$('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
  };
  root.addEventListener('click', e => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    const toolBtn = el.closest('[data-tool]');
    if (toolBtn) { setTool(toolBtn.dataset.tool); blip(660, 0.03); return; }
    const choose = el.closest('[data-choose]');
    if (choose) {
      const d = DILEMMAS[state.pending];
      if (resolveDilemma(state, choose.dataset.choose)) {
        toast(`${d.title}: ${d[choose.dataset.choose].label.toLowerCase()}.`);
        blip(520, 0.08); blip(780, 0.1);
        analysis = analyze(state);
        save(); renderBook(); refreshHud();
      } else toast('Not enough in the treasury for that.');
      return;
    }
    const act = el.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'turn') takeTurn();
    else if (act === 'prev' && reading > 0) { reading--; renderBook(); pageTurn(); }
    else if (act === 'next' && reading < state.chapters.length - 1) { reading++; renderBook(); pageTurn(); }
    else if (act === 'download') download();
    else if (act === 'help') { const h = $('[data-help]'); h.hidden = !h.hidden; $('[data-act="help"]').setAttribute('aria-expanded', String(!h.hidden)); }
    else if (act === 'new') { const f = $('[data-newgame]'); f.hidden = false; f.querySelector('input').focus(); }
    else if (act === 'cancel-new') $('[data-newgame]').hidden = true;
    else if (act === 'sound') { soundOn = !soundOn; el.closest('[data-act]').setAttribute('aria-pressed', String(soundOn)); }
  });
  $('[data-chapters]').addEventListener('change', e => { reading = +e.target.value; renderBook(); pageTurn(); });
  $('[data-tax]').addEventListener('input', e => { state.tax = +e.target.value; refreshHud(); clearTimeout(apply.t); apply.t = setTimeout(save, 400); });
  $('[data-overlay]').addEventListener('change', e => { overlay = e.target.value; if (reduced) draw(); });
  $('[data-newgame]').addEventListener('submit', e => {
    e.preventDefault();
    const name = cleanName(new FormData(e.target).get('name'));
    state = newGame({ seed: Math.floor(Math.random() * 1e9), name });
    state.chapters.push(prologue(state));
    reading = 0;
    analysis = analyze(state);
    e.target.hidden = true;
    save(); renderBook(); refreshHud(); pageTurn();
    toast(`A new novel: ${name}.`);
  });
  root.addEventListener('keydown', e => {
    if (e.target.matches?.('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const found = Object.entries(TOOLS).find(([, t]) => t.key === k);
    if (found) { setTool(found[0]); }
    if (e.key === 'Escape') { $('[data-help]').hidden = true; $('[data-newgame]').hidden = true; }
  });

  function download() {
    const blob = new Blob([novelMarkdown(state)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'city'}-a-city-in-chapters.md`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    toast('Downloaded the novel so far.');
  }

  window.addEventListener('pagehide', () => { if (root.isConnected) save(); });
  renderBook();
  refreshHud();
  return { get state() { return state; }, takeTurn, apply: (t, i) => { setTool(t); apply(i); }, stop: () => cancelAnimationFrame(raf) };
}
