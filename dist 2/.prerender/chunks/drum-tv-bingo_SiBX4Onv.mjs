import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumTvBingo = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/drum-tv-bingo — DRUM BINGO · TV game";
  const description = "TV game for the drum hub. Every visitor gets a 5x5 bingo card pre-filled with drum-event types. The bus marks your cells as the room plays. First to BINGO wins. Cast to a TV.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-tv-bingo",
    name: "PointCast Drum · TV · Bingo",
    url: "https://pointcast.xyz/drum-tv-bingo",
    description
  };
  const CELLS = [
    { key: "drum", label: "DRUM", color: "#ff5c23" },
    { key: "orchestra", label: "ORCH", color: "#ffd400" },
    { key: "choir", label: "CHOIR", color: "#5fbafd" },
    { key: "lounge", label: "LOUNGE", color: "#b8431a" },
    { key: "theremin", label: "THEREMIN", color: "#ff8a4a" },
    { key: "symphony", label: "SYMPHONY", color: "#d6745f" },
    { key: "bells", label: "BELLS", color: "#fff7c2" },
    { key: "organ", label: "ORGAN", color: "#c9a449" },
    { key: "strings", label: "STRINGS", color: "#e8c896" },
    { key: "daily", label: "DAILY", color: "#94d4ff" },
    { key: "kettle", label: "KETTLE", color: "#5fbafd" },
    { key: "potato", label: "POTATO", color: "#fffaf0" },
    { key: "milestone", label: "★ MILESTONE", color: "#ffd400" },
    { key: "jam", label: "JAM", color: "#a83b2a" },
    { key: "confessional", label: "SOFT", color: "#ff8a4a" },
    // Drum-flavored extras (these match seed/inst/voice details when present)
    { key: "drum-combo3", label: "COMBO 3+", color: "#ff5c23" },
    { key: "choir-low", label: "BASS VOICE", color: "#185fa5" },
    { key: "orch-kick", label: "KICK", color: "#a83b2a" },
    { key: "organ-pedal", label: "PEDAL POINT", color: "#c9a449" },
    { key: "bells-c", label: "C BELL", color: "#fff7c2" },
    { key: "theremin-hi", label: "GLISS UP", color: "#ff8a4a" },
    { key: "kettle-boil", label: "🫖 BOIL", color: "#5fbafd" },
    { key: "jam-amp", label: "AMPLIFY", color: "#ffd400" },
    { key: "agent", label: "AGENT TAP", color: "#1a1a1a" }
  ];
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", `
  // Bake the cell pool directly into the same script tag — earlier
  // versions used a second \`define:vars\` script after this one, which
  // ran later than the main script and left POOL empty (so cards only
  // had the FREE center). Same-tag injection avoids the order bug.
  window.__bgCells = CELLS;
})();<\/script> <script>
  (function () {
    'use strict';
    const POOL = (window.__bgCells || []);

    const visitorsEl = document.getElementById('bg-visitors');
    const lastCallEl = document.getElementById('bg-lastcall');
    const roundEl = document.getElementById('bg-round');
    const winnerCountEl = document.getElementById('bg-winner-count');
    const cardsEl = document.getElementById('bg-cards');
    const emptyEl = document.getElementById('bg-empty');
    const winnerOverlay = document.getElementById('bg-winner');
    const winnerName = document.getElementById('bg-winner-name');
    const winnerNoun = document.getElementById('bg-winner-noun');
    const winnerLine = document.getElementById('bg-winner-line');

    // Hash → seeded shuffle
    function hash32(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) & 0x7fffffff;
      return h;
    }
    function seededShuffle(arr, seed) {
      const a = [...arr];
      let s = seed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        const j = s % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function buildCard(pid) {
      const seed = hash32(pid + 'bingo:r' + roundIdx);
      const shuffled = seededShuffle(POOL, seed);
      const cells = shuffled.slice(0, 24);
      // Insert FREE at center (index 12)
      cells.splice(12, 0, { key: 'free', label: 'ON AIR', color: '#ffd400', free: true });
      return cells;
    }

    let roundIdx = 1;
    let lastTs = 0;
    let cards = new Map(); // pid -> {cells: [], marked: Set<idx>, nounId, hasBingo: false}
    let calledKeys = new Set(['free']);
    let bingoOrder = [];

    function eventToKey(e) {
      // Map an /api/sounds event to one of our card cell keys
      const t = e.type || '';
      const keys = [];
      if (t === 'drum') {
        keys.push('drum');
        if ((e.seed || 1) >= 3) keys.push('drum-combo3');
      } else if (t === 'orchestra') {
        keys.push('orchestra');
        if ((e.inst || '').toLowerCase().includes('kick')) keys.push('orch-kick');
      } else if (t === 'choir') {
        keys.push('choir');
        const v = (e.voice || '').toLowerCase();
        if (v.includes('bass') || v.includes('low') || v.includes('tenor-c')) keys.push('choir-low');
      } else if (t === 'lounge') keys.push('lounge');
      else if (t === 'theremin') {
        keys.push('theremin');
        if ((e.hz || 0) > 700) keys.push('theremin-hi');
      } else if (t === 'symphony') keys.push('symphony');
      else if (t === 'bells') {
        keys.push('bells');
        if ((e.bellId || '').endsWith('c') || Math.abs((e.hz || 0) - 261.63) < 6 || Math.abs((e.hz || 0) - 523.25) < 6 || Math.abs((e.hz || 0) - 1047) < 6) {
          keys.push('bells-c');
        }
      } else if (t === 'organ') {
        keys.push('organ');
        if ((e.note || '').match(/[CDEFGAB][0-9]/) && (e.note || '').endsWith('2')) keys.push('organ-pedal');
        // Treat any organ note with stop=pedal-on context as pedal-point (we don't have that flag, so leave above heuristic)
      } else if (t === 'strings') keys.push('strings');
      else if (t === 'daily') keys.push('daily');
      else if (t === 'kettle') {
        keys.push('kettle');
        if (e.action === 'boil' || e.action === 'whistle') keys.push('kettle-boil');
      } else if (t === 'potato') keys.push('potato');
      else if (t === 'milestone') keys.push('milestone');
      else if (t === 'jam') {
        keys.push('jam');
        if (e.action === 'amplify') keys.push('jam-amp');
      } else if (t === 'confessional') keys.push('confessional');

      // pid-prefixed sessionId of mcp- means "agent tap"
      if ((e.pid || '').length === 10 && (e.sessionId || '').startsWith('mcp-')) keys.push('agent');

      return keys;
    }

    function makeCardEl(pid, nounId) {
      const card = document.createElement('article');
      card.className = 'bg__card';
      card.dataset.pid = pid;
      card.innerHTML = \`
        <header class="bg__card-head">
          <img class="bg__card-noun" src="https://noun.pics/\${nounId}.svg" alt="" width="56" height="56" loading="lazy" />
          <div class="bg__card-meta">
            <p class="bg__card-name">noun #\${nounId}</p>
            <p class="bg__card-pid mono">pid \${pid.slice(0, 8)}</p>
          </div>
          <span class="bg__card-bingo" data-state="off">—</span>
        </header>
        <div class="bg__card-grid"></div>
      \`;
      const grid = card.querySelector('.bg__card-grid');
      const cells = buildCard(pid);
      cells.forEach((c, i) => {
        const cell = document.createElement('div');
        cell.className = 'bg__cell' + (c.free ? ' bg__cell--free' : '') + (calledKeys.has(c.key) ? ' bg__cell--marked' : '');
        cell.dataset.key = c.key;
        cell.style.setProperty('--bg-cell-color', c.color);
        cell.textContent = c.label;
        grid.appendChild(cell);
      });
      cards.set(pid, { el: card, cells, nounId, hasBingo: false });
      return card;
    }

    function checkBingo(state) {
      const cells = state.cells;
      const marks = cells.map((c) => calledKeys.has(c.key));
      // Rows
      for (let r = 0; r < 5; r++) {
        if (marks.slice(r * 5, r * 5 + 5).every(Boolean)) return { kind: 'row', idx: r };
      }
      for (let c = 0; c < 5; c++) {
        if ([0,1,2,3,4].every((r) => marks[r * 5 + c])) return { kind: 'col', idx: c };
      }
      if ([0,6,12,18,24].every((i) => marks[i])) return { kind: 'diag', idx: 0 };
      if ([4,8,12,16,20].every((i) => marks[i])) return { kind: 'diag', idx: 1 };
      return null;
    }

    function recomputeMarks() {
      cards.forEach((state) => {
        const cellsEls = state.el.querySelectorAll('.bg__cell');
        state.cells.forEach((c, i) => {
          if (calledKeys.has(c.key)) cellsEls[i].classList.add('bg__cell--marked');
          else cellsEls[i].classList.remove('bg__cell--marked');
        });
        const result = checkBingo(state);
        const banner = state.el.querySelector('.bg__card-bingo');
        if (result && !state.hasBingo) {
          state.hasBingo = true;
          banner.dataset.state = 'on';
          banner.textContent = 'BINGO ✓';
          state.el.classList.add('bg__card--won');
          announceWinner(state, result);
        } else if (result) {
          banner.textContent = 'BINGO ✓';
        }
      });
      winnerCountEl.textContent = String([...cards.values()].filter((s) => s.hasBingo).length);
    }

    function announceWinner(state, result) {
      bingoOrder.push(state.nounId);
      winnerName.textContent = \`noun #\${state.nounId}\`;
      winnerNoun.src = \`https://noun.pics/\${state.nounId}.svg\`;
      const kind = result.kind === 'row' ? \`5 in a row · row \${result.idx + 1}\`
                : result.kind === 'col' ? \`5 in a column · col \${result.idx + 1}\`
                : \`diagonal · \${result.idx === 0 ? '↘' : '↙'}\`;
      winnerLine.textContent = kind;
      winnerOverlay.hidden = false;
      setTimeout(() => { winnerOverlay.hidden = true; }, 8000);
    }

    function newRound() {
      roundIdx += 1;
      roundEl.textContent = String(roundIdx);
      calledKeys = new Set(['free']);
      bingoOrder = [];
      // Rebuild every card with new seed (so each round has different layouts)
      cards.forEach((state, pid) => {
        const newCells = buildCard(pid);
        state.cells = newCells;
        state.hasBingo = false;
        const grid = state.el.querySelector('.bg__card-grid');
        grid.innerHTML = '';
        newCells.forEach((c) => {
          const cell = document.createElement('div');
          cell.className = 'bg__cell' + (c.free ? ' bg__cell--free' : '');
          cell.dataset.key = c.key;
          cell.style.setProperty('--bg-cell-color', c.color);
          cell.textContent = c.label;
          grid.appendChild(cell);
        });
        const banner = state.el.querySelector('.bg__card-bingo');
        banner.dataset.state = 'off';
        banner.textContent = '—';
        state.el.classList.remove('bg__card--won');
      });
      winnerCountEl.textContent = '0';
    }

    let restartTimer = null;

    function isHumanEntry(p) {
      // /api/visit returns mixed entries — humans + bots (type prefix
      // \`bot:\`). Filter to humans only so the TV doesn't deal cards to
      // crawler IPs.
      const t = (p && p.type) || '';
      return p && p.pid && typeof p.nounId === 'number' && !t.startsWith('bot:');
    }

    async function selfRegister() {
      // Make the cast device count as a present visitor so the TV game
      // never starts with an empty roster. Idempotent: /api/visit
      // throttles on IP, so reloading or coming back later is fine.
      try {
        let nounId = 0;
        try {
          const stored = localStorage.getItem('pc:nounId');
          const n = stored ? Number(stored) : NaN;
          nounId = Number.isFinite(n) ? n : (Math.abs(hash32(getSelfSession())) % 1200);
        } catch { nounId = Math.abs(hash32(getSelfSession())) % 1200; }
        try { localStorage.setItem('pc:nounId', String(nounId)); } catch {}
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nounId, note: 'tv-bingo' }),
        });
      } catch {}
    }
    function getSelfSession() {
      try {
        const k = 'pc:session';
        let s = localStorage.getItem(k);
        if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, s); }
        return s;
      } catch { return 'tv-' + Math.random().toString(36).slice(2, 10); }
    }
    selfRegister();

    async function pollVisit() {
      try {
        const r = await fetch('/api/visit', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const present = (Array.isArray(data.present) ? data.present : []).filter(isHumanEntry);
        // Add cards for new visitors
        present.forEach((p) => {
          if (!cards.has(p.pid)) {
            cardsEl.appendChild(makeCardEl(p.pid, p.nounId));
          }
        });
        // Remove cards for visitors that left
        const presentSet = new Set(present.map((p) => p.pid));
        cards.forEach((state, pid) => {
          if (!presentSet.has(pid)) {
            state.el.remove();
            cards.delete(pid);
          }
        });
        visitorsEl.textContent = String(cards.size);
        emptyEl.style.display = cards.size === 0 ? '' : 'none';
        recomputeMarks();
      } catch {}
    }

    async function pollSounds() {
      try {
        const r = await fetch(\`/api/sounds?since=\${lastTs}\`, { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const events = Array.isArray(data.events) ? data.events : [];
        if (events.length) {
          lastTs = events[events.length - 1].t || Date.now();
          let lastCall = '';
          for (const e of events) {
            const keys = eventToKey(e);
            keys.forEach((k) => calledKeys.add(k));
            if (keys.length) lastCall = keys[0].toUpperCase();
          }
          if (lastCall) lastCallEl.textContent = lastCall;
          recomputeMarks();
          // Auto-restart after first BINGO + 12s
          const bingoSeen = [...cards.values()].some((s) => s.hasBingo);
          if (bingoSeen && !restartTimer) {
            restartTimer = setTimeout(() => {
              newRound();
              restartTimer = null;
            }, 12000);
          }
        }
      } catch {}
    }

    pollVisit();
    pollSounds();
    setInterval(pollVisit, 5000);
    setInterval(pollSounds, 1500);

    // Hotkeys
    let overlayOn = true;
    function applyOverlay() {
      document.documentElement.classList.toggle('bg-no-overlay', !overlayOn);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
      if (e.key === 'm' || e.key === 'M') { overlayOn = !overlayOn; applyOverlay(); }
      if (e.key === '1') document.querySelector('.bg__board').dataset.palette = 'black';
      if (e.key === '2') document.querySelector('.bg__board').dataset.palette = 'paper';
      if (e.key === '3') document.querySelector('.bg__board').dataset.palette = 'sunset';
    });
  })();
<\/script>`], ["", " <script>(function(){", `
  // Bake the cell pool directly into the same script tag — earlier
  // versions used a second \\\`define:vars\\\` script after this one, which
  // ran later than the main script and left POOL empty (so cards only
  // had the FREE center). Same-tag injection avoids the order bug.
  window.__bgCells = CELLS;
})();<\/script> <script>
  (function () {
    'use strict';
    const POOL = (window.__bgCells || []);

    const visitorsEl = document.getElementById('bg-visitors');
    const lastCallEl = document.getElementById('bg-lastcall');
    const roundEl = document.getElementById('bg-round');
    const winnerCountEl = document.getElementById('bg-winner-count');
    const cardsEl = document.getElementById('bg-cards');
    const emptyEl = document.getElementById('bg-empty');
    const winnerOverlay = document.getElementById('bg-winner');
    const winnerName = document.getElementById('bg-winner-name');
    const winnerNoun = document.getElementById('bg-winner-noun');
    const winnerLine = document.getElementById('bg-winner-line');

    // Hash → seeded shuffle
    function hash32(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) & 0x7fffffff;
      return h;
    }
    function seededShuffle(arr, seed) {
      const a = [...arr];
      let s = seed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        const j = s % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function buildCard(pid) {
      const seed = hash32(pid + 'bingo:r' + roundIdx);
      const shuffled = seededShuffle(POOL, seed);
      const cells = shuffled.slice(0, 24);
      // Insert FREE at center (index 12)
      cells.splice(12, 0, { key: 'free', label: 'ON AIR', color: '#ffd400', free: true });
      return cells;
    }

    let roundIdx = 1;
    let lastTs = 0;
    let cards = new Map(); // pid -> {cells: [], marked: Set<idx>, nounId, hasBingo: false}
    let calledKeys = new Set(['free']);
    let bingoOrder = [];

    function eventToKey(e) {
      // Map an /api/sounds event to one of our card cell keys
      const t = e.type || '';
      const keys = [];
      if (t === 'drum') {
        keys.push('drum');
        if ((e.seed || 1) >= 3) keys.push('drum-combo3');
      } else if (t === 'orchestra') {
        keys.push('orchestra');
        if ((e.inst || '').toLowerCase().includes('kick')) keys.push('orch-kick');
      } else if (t === 'choir') {
        keys.push('choir');
        const v = (e.voice || '').toLowerCase();
        if (v.includes('bass') || v.includes('low') || v.includes('tenor-c')) keys.push('choir-low');
      } else if (t === 'lounge') keys.push('lounge');
      else if (t === 'theremin') {
        keys.push('theremin');
        if ((e.hz || 0) > 700) keys.push('theremin-hi');
      } else if (t === 'symphony') keys.push('symphony');
      else if (t === 'bells') {
        keys.push('bells');
        if ((e.bellId || '').endsWith('c') || Math.abs((e.hz || 0) - 261.63) < 6 || Math.abs((e.hz || 0) - 523.25) < 6 || Math.abs((e.hz || 0) - 1047) < 6) {
          keys.push('bells-c');
        }
      } else if (t === 'organ') {
        keys.push('organ');
        if ((e.note || '').match(/[CDEFGAB][0-9]/) && (e.note || '').endsWith('2')) keys.push('organ-pedal');
        // Treat any organ note with stop=pedal-on context as pedal-point (we don't have that flag, so leave above heuristic)
      } else if (t === 'strings') keys.push('strings');
      else if (t === 'daily') keys.push('daily');
      else if (t === 'kettle') {
        keys.push('kettle');
        if (e.action === 'boil' || e.action === 'whistle') keys.push('kettle-boil');
      } else if (t === 'potato') keys.push('potato');
      else if (t === 'milestone') keys.push('milestone');
      else if (t === 'jam') {
        keys.push('jam');
        if (e.action === 'amplify') keys.push('jam-amp');
      } else if (t === 'confessional') keys.push('confessional');

      // pid-prefixed sessionId of mcp- means "agent tap"
      if ((e.pid || '').length === 10 && (e.sessionId || '').startsWith('mcp-')) keys.push('agent');

      return keys;
    }

    function makeCardEl(pid, nounId) {
      const card = document.createElement('article');
      card.className = 'bg__card';
      card.dataset.pid = pid;
      card.innerHTML = \\\`
        <header class="bg__card-head">
          <img class="bg__card-noun" src="https://noun.pics/\\\${nounId}.svg" alt="" width="56" height="56" loading="lazy" />
          <div class="bg__card-meta">
            <p class="bg__card-name">noun #\\\${nounId}</p>
            <p class="bg__card-pid mono">pid \\\${pid.slice(0, 8)}</p>
          </div>
          <span class="bg__card-bingo" data-state="off">—</span>
        </header>
        <div class="bg__card-grid"></div>
      \\\`;
      const grid = card.querySelector('.bg__card-grid');
      const cells = buildCard(pid);
      cells.forEach((c, i) => {
        const cell = document.createElement('div');
        cell.className = 'bg__cell' + (c.free ? ' bg__cell--free' : '') + (calledKeys.has(c.key) ? ' bg__cell--marked' : '');
        cell.dataset.key = c.key;
        cell.style.setProperty('--bg-cell-color', c.color);
        cell.textContent = c.label;
        grid.appendChild(cell);
      });
      cards.set(pid, { el: card, cells, nounId, hasBingo: false });
      return card;
    }

    function checkBingo(state) {
      const cells = state.cells;
      const marks = cells.map((c) => calledKeys.has(c.key));
      // Rows
      for (let r = 0; r < 5; r++) {
        if (marks.slice(r * 5, r * 5 + 5).every(Boolean)) return { kind: 'row', idx: r };
      }
      for (let c = 0; c < 5; c++) {
        if ([0,1,2,3,4].every((r) => marks[r * 5 + c])) return { kind: 'col', idx: c };
      }
      if ([0,6,12,18,24].every((i) => marks[i])) return { kind: 'diag', idx: 0 };
      if ([4,8,12,16,20].every((i) => marks[i])) return { kind: 'diag', idx: 1 };
      return null;
    }

    function recomputeMarks() {
      cards.forEach((state) => {
        const cellsEls = state.el.querySelectorAll('.bg__cell');
        state.cells.forEach((c, i) => {
          if (calledKeys.has(c.key)) cellsEls[i].classList.add('bg__cell--marked');
          else cellsEls[i].classList.remove('bg__cell--marked');
        });
        const result = checkBingo(state);
        const banner = state.el.querySelector('.bg__card-bingo');
        if (result && !state.hasBingo) {
          state.hasBingo = true;
          banner.dataset.state = 'on';
          banner.textContent = 'BINGO ✓';
          state.el.classList.add('bg__card--won');
          announceWinner(state, result);
        } else if (result) {
          banner.textContent = 'BINGO ✓';
        }
      });
      winnerCountEl.textContent = String([...cards.values()].filter((s) => s.hasBingo).length);
    }

    function announceWinner(state, result) {
      bingoOrder.push(state.nounId);
      winnerName.textContent = \\\`noun #\\\${state.nounId}\\\`;
      winnerNoun.src = \\\`https://noun.pics/\\\${state.nounId}.svg\\\`;
      const kind = result.kind === 'row' ? \\\`5 in a row · row \\\${result.idx + 1}\\\`
                : result.kind === 'col' ? \\\`5 in a column · col \\\${result.idx + 1}\\\`
                : \\\`diagonal · \\\${result.idx === 0 ? '↘' : '↙'}\\\`;
      winnerLine.textContent = kind;
      winnerOverlay.hidden = false;
      setTimeout(() => { winnerOverlay.hidden = true; }, 8000);
    }

    function newRound() {
      roundIdx += 1;
      roundEl.textContent = String(roundIdx);
      calledKeys = new Set(['free']);
      bingoOrder = [];
      // Rebuild every card with new seed (so each round has different layouts)
      cards.forEach((state, pid) => {
        const newCells = buildCard(pid);
        state.cells = newCells;
        state.hasBingo = false;
        const grid = state.el.querySelector('.bg__card-grid');
        grid.innerHTML = '';
        newCells.forEach((c) => {
          const cell = document.createElement('div');
          cell.className = 'bg__cell' + (c.free ? ' bg__cell--free' : '');
          cell.dataset.key = c.key;
          cell.style.setProperty('--bg-cell-color', c.color);
          cell.textContent = c.label;
          grid.appendChild(cell);
        });
        const banner = state.el.querySelector('.bg__card-bingo');
        banner.dataset.state = 'off';
        banner.textContent = '—';
        state.el.classList.remove('bg__card--won');
      });
      winnerCountEl.textContent = '0';
    }

    let restartTimer = null;

    function isHumanEntry(p) {
      // /api/visit returns mixed entries — humans + bots (type prefix
      // \\\`bot:\\\`). Filter to humans only so the TV doesn't deal cards to
      // crawler IPs.
      const t = (p && p.type) || '';
      return p && p.pid && typeof p.nounId === 'number' && !t.startsWith('bot:');
    }

    async function selfRegister() {
      // Make the cast device count as a present visitor so the TV game
      // never starts with an empty roster. Idempotent: /api/visit
      // throttles on IP, so reloading or coming back later is fine.
      try {
        let nounId = 0;
        try {
          const stored = localStorage.getItem('pc:nounId');
          const n = stored ? Number(stored) : NaN;
          nounId = Number.isFinite(n) ? n : (Math.abs(hash32(getSelfSession())) % 1200);
        } catch { nounId = Math.abs(hash32(getSelfSession())) % 1200; }
        try { localStorage.setItem('pc:nounId', String(nounId)); } catch {}
        await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nounId, note: 'tv-bingo' }),
        });
      } catch {}
    }
    function getSelfSession() {
      try {
        const k = 'pc:session';
        let s = localStorage.getItem(k);
        if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, s); }
        return s;
      } catch { return 'tv-' + Math.random().toString(36).slice(2, 10); }
    }
    selfRegister();

    async function pollVisit() {
      try {
        const r = await fetch('/api/visit', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const present = (Array.isArray(data.present) ? data.present : []).filter(isHumanEntry);
        // Add cards for new visitors
        present.forEach((p) => {
          if (!cards.has(p.pid)) {
            cardsEl.appendChild(makeCardEl(p.pid, p.nounId));
          }
        });
        // Remove cards for visitors that left
        const presentSet = new Set(present.map((p) => p.pid));
        cards.forEach((state, pid) => {
          if (!presentSet.has(pid)) {
            state.el.remove();
            cards.delete(pid);
          }
        });
        visitorsEl.textContent = String(cards.size);
        emptyEl.style.display = cards.size === 0 ? '' : 'none';
        recomputeMarks();
      } catch {}
    }

    async function pollSounds() {
      try {
        const r = await fetch(\\\`/api/sounds?since=\\\${lastTs}\\\`, { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const events = Array.isArray(data.events) ? data.events : [];
        if (events.length) {
          lastTs = events[events.length - 1].t || Date.now();
          let lastCall = '';
          for (const e of events) {
            const keys = eventToKey(e);
            keys.forEach((k) => calledKeys.add(k));
            if (keys.length) lastCall = keys[0].toUpperCase();
          }
          if (lastCall) lastCallEl.textContent = lastCall;
          recomputeMarks();
          // Auto-restart after first BINGO + 12s
          const bingoSeen = [...cards.values()].some((s) => s.hasBingo);
          if (bingoSeen && !restartTimer) {
            restartTimer = setTimeout(() => {
              newRound();
              restartTimer = null;
            }, 12000);
          }
        }
      } catch {}
    }

    pollVisit();
    pollSounds();
    setInterval(pollVisit, 5000);
    setInterval(pollSounds, 1500);

    // Hotkeys
    let overlayOn = true;
    function applyOverlay() {
      document.documentElement.classList.toggle('bg-no-overlay', !overlayOn);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
      if (e.key === 'm' || e.key === 'M') { overlayOn = !overlayOn; applyOverlay(); }
      if (e.key === '1') document.querySelector('.bg__board').dataset.palette = 'black';
      if (e.key === '2') document.querySelector('.bg__board').dataset.palette = 'paper';
      if (e.key === '3') document.querySelector('.bg__board').dataset.palette = 'sunset';
    });
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-zkgeq7ol": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bg" id="bg-main" data-astro-cid-zkgeq7ol> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "tv-bingo", "data-astro-cid-zkgeq7ol": true })} <header class="bg__head" data-astro-cid-zkgeq7ol> <p class="bg__kicker" data-astro-cid-zkgeq7ol>DRUM HUB · TV GAME · BINGO · LIVE</p> <h1 class="bg__title" data-astro-cid-zkgeq7ol><em data-astro-cid-zkgeq7ol>DRUM BINGO.</em></h1> <p class="bg__dek" data-astro-cid-zkgeq7ol>
Cast this to a TV. Every visitor gets a 5×5 bingo card with their Noun on top. The bus marks your cells as the room plays. First card to BINGO wins the round.
</p> <p class="bg__hint mono" data-astro-cid-zkgeq7ol>F · fullscreen · M · hide chrome · 1·2·3 · palettes</p> </header> <section class="bg__board" data-palette="black" data-astro-cid-zkgeq7ol> <div class="bg__board-strip" id="bg-strip" data-astro-cid-zkgeq7ol> <span class="bg__board-stat mono" data-astro-cid-zkgeq7ol>visitors: <strong id="bg-visitors" data-astro-cid-zkgeq7ol>—</strong></span> <span class="bg__board-stat mono" data-astro-cid-zkgeq7ol>last call: <strong id="bg-lastcall" data-astro-cid-zkgeq7ol>—</strong></span> <span class="bg__board-stat mono" data-astro-cid-zkgeq7ol>round: <strong id="bg-round" data-astro-cid-zkgeq7ol>1</strong></span> <span class="bg__board-stat mono" data-astro-cid-zkgeq7ol>winners: <strong id="bg-winner-count" data-astro-cid-zkgeq7ol>0</strong></span> </div> <div class="bg__cards" id="bg-cards" data-astro-cid-zkgeq7ol> <p class="bg__empty mono" id="bg-empty" data-astro-cid-zkgeq7ol>— waiting for visitors —</p> </div> <div class="bg__winner" id="bg-winner" hidden data-astro-cid-zkgeq7ol> <p class="bg__winner-eyebrow mono" data-astro-cid-zkgeq7ol>★ BINGO ★</p> <p class="bg__winner-name" id="bg-winner-name" data-astro-cid-zkgeq7ol>—</p> <img class="bg__winner-noun" id="bg-winner-noun" alt="" width="240" height="240" data-astro-cid-zkgeq7ol> <p class="bg__winner-line mono" id="bg-winner-line" data-astro-cid-zkgeq7ol>5 in a row · row 3</p> </div> </section> <footer class="bg__foot" data-astro-cid-zkgeq7ol> <p class="mono" data-astro-cid-zkgeq7ol>v0.1 · 2026-04-28 · Mike Hoydich + Claude Code · El Segundo · TV game · sprint 1/3</p> </footer> </main> ` }), defineScriptVars({ CELLS }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv-bingo.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv-bingo.astro";
const $$url = "/drum-tv-bingo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTvBingo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
