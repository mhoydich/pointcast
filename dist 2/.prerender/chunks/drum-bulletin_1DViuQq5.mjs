import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumBulletin = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/drum-bulletin — community pinboard";
  const description = "Pin a one-line note to the PointCast bulletin board. Heart anyone's pin. KV-backed, 50 pins deep, 140 chars each. Six mood colors.";
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "@id": "https://pointcast.xyz/drum-bulletin", name: "PointCast Drum · Bulletin", url: "https://pointcast.xyz/drum-bulletin", description };
  const COLORS = [
    { id: "warm", label: "WARM", hex: "#ff8a4a" },
    { id: "bright", label: "BRIGHT", hex: "#ffd400" },
    { id: "ocean", label: "OCEAN", hex: "#5fbafd" },
    { id: "garden", label: "GARDEN", hex: "#8ec78a" },
    { id: "fog", label: "FOG", hex: "#cfc6df" },
    { id: "rose", label: "ROSE", hex: "#f5b3aa" }
  ];
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () { 'use strict';
  const COLORS = { warm: '#ff8a4a', bright: '#ffd400', ocean: '#5fbafd', garden: '#8ec78a', fog: '#cfc6df', rose: '#f5b3aa' };
  const HEARTED_KEY = 'pc:drum-bulletin:hearted';
  const board = document.getElementById('bu-board');
  const empty = document.getElementById('bu-empty');
  const input = document.getElementById('bu-input');
  const cc = document.getElementById('bu-cc');
  const send = document.getElementById('bu-send');
  const sig = document.getElementById('bu-sig');

  function getSession() { try { const k='pc:session'; let s=localStorage.getItem(k); if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem(k,s);} return s;} catch { return 'bu-' + Math.random().toString(36).slice(2,10);} }
  function nounIdFor(sid) { let h=5381; for(let i=0;i<sid.length;i++) h=(h*33+sid.charCodeAt(i))&0x7fffffff; return h%1200; }
  const sid = getSession();
  let storedNoun = 0;
  try { const s = localStorage.getItem('pc:nounId'); storedNoun = s ? Number(s) : nounIdFor(sid); }
  catch { storedNoun = nounIdFor(sid); }
  if (!Number.isFinite(storedNoun) || storedNoun < 0 || storedNoun > 1199) storedNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(storedNoun)); } catch {}
  sig.textContent = \`noun #\${storedNoun}\`;

  function getHearted() { try { return new Set(JSON.parse(localStorage.getItem(HEARTED_KEY) || '[]')); } catch { return new Set(); } }
  function saveHearted(set) { try { localStorage.setItem(HEARTED_KEY, JSON.stringify([...set].slice(-500))); } catch {} }
  let hearted = getHearted();

  let currentColor = 'warm';
  document.querySelectorAll('.bu__color').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.bu__color').forEach((x) => x.classList.remove('bu__color--on'));
      b.classList.add('bu__color--on');
      currentColor = b.getAttribute('data-color') || 'warm';
    });
  });
  input.addEventListener('input', () => { cc.textContent = \`\${input.value.length} / 140\`; });

  function fmtTimeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return \`\${s}s ago\`;
    if (s < 3600) return \`\${Math.floor(s / 60)}m ago\`;
    if (s < 86400) return \`\${Math.floor(s / 3600)}h ago\`;
    return \`\${Math.floor(s / 86400)}d ago\`;
  }

  function renderPins(pins) {
    if (empty && empty.parentNode) empty.remove();
    const existing = new Set(Array.from(board.querySelectorAll('.bu__pin')).map((el) => el.dataset.id));
    const incoming = new Set(pins.map((p) => p.id));
    // Remove pins no longer present
    Array.from(board.querySelectorAll('.bu__pin')).forEach((el) => { if (!incoming.has(el.dataset.id)) el.remove(); });
    if (pins.length === 0) {
      if (!board.querySelector('.bu__empty')) {
        const e = document.createElement('p');
        e.className = 'bu__empty mono';
        e.textContent = '— no pins yet · be the first —';
        board.appendChild(e);
      }
      return;
    }
    const empties = board.querySelectorAll('.bu__empty');
    empties.forEach((e) => e.remove());
    pins.forEach((p, idx) => {
      let el = board.querySelector(\`.bu__pin[data-id="\${p.id}"]\`);
      if (!el) {
        el = document.createElement('article');
        el.className = 'bu__pin';
        el.dataset.id = p.id;
        const tilt = ((parseInt(p.id.slice(0, 6), 36) || 0) % 9) - 4; // -4..+4 deg
        el.style.setProperty('--bu-tilt', \`\${tilt}deg\`);
        const color = COLORS[p.color] || COLORS.warm;
        el.style.setProperty('--bu-color', color);
        el.innerHTML = \`
          <span class="bu__pin-pin" aria-hidden="true">📍</span>
          <div class="bu__pin-head">
            <img src="https://noun.pics/\${p.nounId || 0}.svg" alt="" width="28" height="28" loading="lazy" />
            <span class="bu__pin-pid mono">noun #\${p.nounId || '—'}</span>
            <span class="bu__pin-time mono"></span>
          </div>
          <p class="bu__pin-body"></p>
          <div class="bu__pin-foot">
            <button type="button" class="bu__heart mono" aria-label="Heart this pin">♡ <span class="bu__heart-count">0</span></button>
            <span class="bu__pin-color mono"></span>
          </div>
        \`;
        board.appendChild(el);
      }
      // Update mutable bits
      el.querySelector('.bu__pin-time').textContent = fmtTimeAgo(p.t);
      el.querySelector('.bu__pin-body').textContent = p.body || '';
      el.querySelector('.bu__pin-color').textContent = (p.color || 'warm').toUpperCase();
      const hc = el.querySelector('.bu__heart-count');
      hc.textContent = String(p.hearts || 0);
      const heartBtn = el.querySelector('.bu__heart');
      if (hearted.has(p.id)) {
        heartBtn.classList.add('bu__heart--on');
        heartBtn.firstChild && (heartBtn.firstChild.nodeValue = '♥ ');
      } else {
        heartBtn.classList.remove('bu__heart--on');
        heartBtn.firstChild && (heartBtn.firstChild.nodeValue = '♡ ');
      }
      heartBtn.onclick = async () => {
        if (hearted.has(p.id)) return;
        hearted.add(p.id); saveHearted(hearted);
        heartBtn.classList.add('bu__heart--on');
        heartBtn.firstChild && (heartBtn.firstChild.nodeValue = '♥ ');
        const newCount = (p.hearts || 0) + 1; p.hearts = newCount; hc.textContent = String(newCount);
        try {
          await fetch('/api/bulletin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heart: p.id }) });
          // Also broadcast a light ping for cast surfaces
          fetch('/api/sounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'heart', sessionId: sid, pinId: p.id, nounId: storedNoun }) });
        } catch {}
      };
    });
  }

  async function fetchAll() {
    try {
      const r = await fetch('/api/bulletin', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      renderPins(Array.isArray(data.pins) ? data.pins : []);
    } catch {}
  }
  fetchAll();
  setInterval(fetchAll, 5000);

  document.getElementById('bu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (input.value || '').trim().slice(0, 140);
    if (!text) { input.focus(); return; }
    send.disabled = true; send.textContent = 'PINNING…';
    try {
      const r = await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, color: currentColor, nounId: storedNoun }),
      });
      const data = await r.json();
      if (data && data.ok) {
        input.value = ''; cc.textContent = '0 / 140';
        send.textContent = 'PINNED ✓';
        // Optimistically render
        if (data.pin) {
          // Insert at top of board
          renderPins([data.pin, ...Array.from(board.querySelectorAll('.bu__pin')).map((el) => {
            return {
              id: el.dataset.id,
              t: Date.now() - 60000,
              body: el.querySelector('.bu__pin-body').textContent,
              color: (el.querySelector('.bu__pin-color').textContent || 'warm').toLowerCase(),
              nounId: 0,
              hearts: Number(el.querySelector('.bu__heart-count').textContent || 0),
            };
          })]);
        }
        try { fetch('/api/sounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pin', sessionId: sid, color: currentColor, nounId: storedNoun }) }); } catch {}
        setTimeout(() => { send.textContent = 'PIN IT →'; send.disabled = false; }, 1400);
        setTimeout(fetchAll, 1500);
      } else {
        send.textContent = 'TRY AGAIN'; setTimeout(() => { send.textContent = 'PIN IT →'; send.disabled = false; }, 1600);
      }
    } catch {
      send.textContent = 'OFFLINE'; setTimeout(() => { send.textContent = 'PIN IT →'; send.disabled = false; }, 1600);
    }
  });
})();
<\/script>`], ["", ` <script>
(function () { 'use strict';
  const COLORS = { warm: '#ff8a4a', bright: '#ffd400', ocean: '#5fbafd', garden: '#8ec78a', fog: '#cfc6df', rose: '#f5b3aa' };
  const HEARTED_KEY = 'pc:drum-bulletin:hearted';
  const board = document.getElementById('bu-board');
  const empty = document.getElementById('bu-empty');
  const input = document.getElementById('bu-input');
  const cc = document.getElementById('bu-cc');
  const send = document.getElementById('bu-send');
  const sig = document.getElementById('bu-sig');

  function getSession() { try { const k='pc:session'; let s=localStorage.getItem(k); if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem(k,s);} return s;} catch { return 'bu-' + Math.random().toString(36).slice(2,10);} }
  function nounIdFor(sid) { let h=5381; for(let i=0;i<sid.length;i++) h=(h*33+sid.charCodeAt(i))&0x7fffffff; return h%1200; }
  const sid = getSession();
  let storedNoun = 0;
  try { const s = localStorage.getItem('pc:nounId'); storedNoun = s ? Number(s) : nounIdFor(sid); }
  catch { storedNoun = nounIdFor(sid); }
  if (!Number.isFinite(storedNoun) || storedNoun < 0 || storedNoun > 1199) storedNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(storedNoun)); } catch {}
  sig.textContent = \\\`noun #\\\${storedNoun}\\\`;

  function getHearted() { try { return new Set(JSON.parse(localStorage.getItem(HEARTED_KEY) || '[]')); } catch { return new Set(); } }
  function saveHearted(set) { try { localStorage.setItem(HEARTED_KEY, JSON.stringify([...set].slice(-500))); } catch {} }
  let hearted = getHearted();

  let currentColor = 'warm';
  document.querySelectorAll('.bu__color').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.bu__color').forEach((x) => x.classList.remove('bu__color--on'));
      b.classList.add('bu__color--on');
      currentColor = b.getAttribute('data-color') || 'warm';
    });
  });
  input.addEventListener('input', () => { cc.textContent = \\\`\\\${input.value.length} / 140\\\`; });

  function fmtTimeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return \\\`\\\${s}s ago\\\`;
    if (s < 3600) return \\\`\\\${Math.floor(s / 60)}m ago\\\`;
    if (s < 86400) return \\\`\\\${Math.floor(s / 3600)}h ago\\\`;
    return \\\`\\\${Math.floor(s / 86400)}d ago\\\`;
  }

  function renderPins(pins) {
    if (empty && empty.parentNode) empty.remove();
    const existing = new Set(Array.from(board.querySelectorAll('.bu__pin')).map((el) => el.dataset.id));
    const incoming = new Set(pins.map((p) => p.id));
    // Remove pins no longer present
    Array.from(board.querySelectorAll('.bu__pin')).forEach((el) => { if (!incoming.has(el.dataset.id)) el.remove(); });
    if (pins.length === 0) {
      if (!board.querySelector('.bu__empty')) {
        const e = document.createElement('p');
        e.className = 'bu__empty mono';
        e.textContent = '— no pins yet · be the first —';
        board.appendChild(e);
      }
      return;
    }
    const empties = board.querySelectorAll('.bu__empty');
    empties.forEach((e) => e.remove());
    pins.forEach((p, idx) => {
      let el = board.querySelector(\\\`.bu__pin[data-id="\\\${p.id}"]\\\`);
      if (!el) {
        el = document.createElement('article');
        el.className = 'bu__pin';
        el.dataset.id = p.id;
        const tilt = ((parseInt(p.id.slice(0, 6), 36) || 0) % 9) - 4; // -4..+4 deg
        el.style.setProperty('--bu-tilt', \\\`\\\${tilt}deg\\\`);
        const color = COLORS[p.color] || COLORS.warm;
        el.style.setProperty('--bu-color', color);
        el.innerHTML = \\\`
          <span class="bu__pin-pin" aria-hidden="true">📍</span>
          <div class="bu__pin-head">
            <img src="https://noun.pics/\\\${p.nounId || 0}.svg" alt="" width="28" height="28" loading="lazy" />
            <span class="bu__pin-pid mono">noun #\\\${p.nounId || '—'}</span>
            <span class="bu__pin-time mono"></span>
          </div>
          <p class="bu__pin-body"></p>
          <div class="bu__pin-foot">
            <button type="button" class="bu__heart mono" aria-label="Heart this pin">♡ <span class="bu__heart-count">0</span></button>
            <span class="bu__pin-color mono"></span>
          </div>
        \\\`;
        board.appendChild(el);
      }
      // Update mutable bits
      el.querySelector('.bu__pin-time').textContent = fmtTimeAgo(p.t);
      el.querySelector('.bu__pin-body').textContent = p.body || '';
      el.querySelector('.bu__pin-color').textContent = (p.color || 'warm').toUpperCase();
      const hc = el.querySelector('.bu__heart-count');
      hc.textContent = String(p.hearts || 0);
      const heartBtn = el.querySelector('.bu__heart');
      if (hearted.has(p.id)) {
        heartBtn.classList.add('bu__heart--on');
        heartBtn.firstChild && (heartBtn.firstChild.nodeValue = '♥ ');
      } else {
        heartBtn.classList.remove('bu__heart--on');
        heartBtn.firstChild && (heartBtn.firstChild.nodeValue = '♡ ');
      }
      heartBtn.onclick = async () => {
        if (hearted.has(p.id)) return;
        hearted.add(p.id); saveHearted(hearted);
        heartBtn.classList.add('bu__heart--on');
        heartBtn.firstChild && (heartBtn.firstChild.nodeValue = '♥ ');
        const newCount = (p.hearts || 0) + 1; p.hearts = newCount; hc.textContent = String(newCount);
        try {
          await fetch('/api/bulletin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ heart: p.id }) });
          // Also broadcast a light ping for cast surfaces
          fetch('/api/sounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'heart', sessionId: sid, pinId: p.id, nounId: storedNoun }) });
        } catch {}
      };
    });
  }

  async function fetchAll() {
    try {
      const r = await fetch('/api/bulletin', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      renderPins(Array.isArray(data.pins) ? data.pins : []);
    } catch {}
  }
  fetchAll();
  setInterval(fetchAll, 5000);

  document.getElementById('bu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (input.value || '').trim().slice(0, 140);
    if (!text) { input.focus(); return; }
    send.disabled = true; send.textContent = 'PINNING…';
    try {
      const r = await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, color: currentColor, nounId: storedNoun }),
      });
      const data = await r.json();
      if (data && data.ok) {
        input.value = ''; cc.textContent = '0 / 140';
        send.textContent = 'PINNED ✓';
        // Optimistically render
        if (data.pin) {
          // Insert at top of board
          renderPins([data.pin, ...Array.from(board.querySelectorAll('.bu__pin')).map((el) => {
            return {
              id: el.dataset.id,
              t: Date.now() - 60000,
              body: el.querySelector('.bu__pin-body').textContent,
              color: (el.querySelector('.bu__pin-color').textContent || 'warm').toLowerCase(),
              nounId: 0,
              hearts: Number(el.querySelector('.bu__heart-count').textContent || 0),
            };
          })]);
        }
        try { fetch('/api/sounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pin', sessionId: sid, color: currentColor, nounId: storedNoun }) }); } catch {}
        setTimeout(() => { send.textContent = 'PIN IT →'; send.disabled = false; }, 1400);
        setTimeout(fetchAll, 1500);
      } else {
        send.textContent = 'TRY AGAIN'; setTimeout(() => { send.textContent = 'PIN IT →'; send.disabled = false; }, 1600);
      }
    } catch {
      send.textContent = 'OFFLINE'; setTimeout(() => { send.textContent = 'PIN IT →'; send.disabled = false; }, 1600);
    }
  });
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-vrcefg5j": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bu" id="bu-main" data-astro-cid-vrcefg5j> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "bulletin", "data-astro-cid-vrcefg5j": true })} <header class="bu__head" data-astro-cid-vrcefg5j> <p class="bu__kicker" data-astro-cid-vrcefg5j>DRUM HUB · COMMS 5 · BULLETIN · 50 PINS · KV</p> <h1 class="bu__title" data-astro-cid-vrcefg5j><em data-astro-cid-vrcefg5j>Pin a note. Heart somebody else's.</em></h1> <p class="bu__dek" data-astro-cid-vrcefg5j>Community pinboard. One line each, 140 chars, six mood colors. Tap the heart on any pin you like. Older pins roll off the board after 50.</p> </header> <form class="bu__compose" id="bu-form" autocomplete="off" data-astro-cid-vrcefg5j> <input class="bu__compose-body" id="bu-input" maxlength="140" placeholder="Pin a one-liner — what's on your mind?" data-astro-cid-vrcefg5j> <div class="bu__compose-row" data-astro-cid-vrcefg5j> <span class="bu__compose-count mono" id="bu-cc" data-astro-cid-vrcefg5j>0 / 140</span> <div class="bu__compose-colors" role="radiogroup" aria-label="Pin color" data-astro-cid-vrcefg5j> ${COLORS.map((c, i) => renderTemplate`<button type="button"${addAttribute(`bu__color ${i === 0 ? "bu__color--on" : ""}`, "class")}${addAttribute(c.id, "data-color")}${addAttribute(`--bu-color: ${c.hex}`, "style")}${addAttribute(`Color ${c.label}`, "aria-label")} data-astro-cid-vrcefg5j> <span class="bu__color-swatch" data-astro-cid-vrcefg5j></span> </button>`)} </div> <span class="bu__sig mono" id="bu-sig" data-astro-cid-vrcefg5j>noun #—</span> <button type="submit" class="bu__send mono" id="bu-send" data-astro-cid-vrcefg5j>PIN IT →</button> </div> </form> <section class="bu__board" id="bu-board" aria-label="Pinned notes" data-astro-cid-vrcefg5j> <p class="bu__empty mono" id="bu-empty" data-astro-cid-vrcefg5j>— no pins yet · be the first —</p> </section> <footer class="bu__foot" data-astro-cid-vrcefg5j> <p data-astro-cid-vrcefg5j>Pins live in <code data-astro-cid-vrcefg5j>env.VISITS</code> KV at <code data-astro-cid-vrcefg5j>pin:*</code> with an index at <code data-astro-cid-vrcefg5j>pins:index</code>, capped at 50 entries. <code data-astro-cid-vrcefg5j>POST /api/bulletin</code> writes new pins; <code data-astro-cid-vrcefg5j>POST /api/bulletin &#123;heart: id&#125;</code> increments hearts.</p> <p class="bu__credit mono" data-astro-cid-vrcefg5j>v0.1 · 2026-04-28 · drum sprint · comms 5</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bulletin.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bulletin.astro";
const $$url = "/drum-bulletin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumBulletin,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
