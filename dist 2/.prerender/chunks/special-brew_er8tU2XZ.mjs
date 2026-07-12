import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, d as defineScriptVars, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getBrewForDate, a as getBrewForDayOffset, B as BREWS } from './special-brews_Gd4VscHQ.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a, _b;
const $$SpecialBrew = createComponent(($$result, $$props, $$slots) => {
  const today = getBrewForDate();
  const tomorrow = getBrewForDayOffset(1);
  const yesterday = getBrewForDayOffset(-1);
  const totalBrews = BREWS.length;
  const title = `/special-brew — today: ${today.name}`;
  const description = `A daily brew celebration on PointCast. Today: ${today.name} (${today.type}, ${today.origin}). ${today.notes} Pour the cup, hear the chime, count the cups poured. Rotates daily at UTC midnight across ${totalBrews} brews.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/special-brew",
    name: "Special Brew",
    url: "https://pointcast.xyz/special-brew",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const todaySerialized = JSON.stringify(today);
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-sniangmj": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template(["  ", '<main class="sb" id="sb-main" data-astro-cid-sniangmj> <header class="sb__head" data-astro-cid-sniangmj> <p class="sb__kicker" data-astro-cid-sniangmj>SPECIAL BREW · UTC DAILY ROTATION · ', ' BREWS · CELEBRATION</p> <h1 class="sb__title" data-astro-cid-sniangmj>today the kettle pours <em data-astro-cid-sniangmj>', `</em>.</h1> <p class="sb__dek" data-astro-cid-sniangmj>
One brew per UTC day, the same one for everyone in the world. The kettle's still on at <a href="/kettle" data-astro-cid-sniangmj>/kettle</a> — that's where the heat happens. Here we celebrate what comes out.
</p> </header> <section class="sb__stage" aria-label="Today's brew" data-astro-cid-sniangmj> <div class="sb__brew-card"`, ' data-astro-cid-sniangmj> <div class="sb__leaf"', ' aria-hidden="true" data-astro-cid-sniangmj></div> <div class="sb__brew-body" data-astro-cid-sniangmj> <p class="sb__brew-type" data-astro-cid-sniangmj>', " · ", '</p> <h2 class="sb__brew-name" data-astro-cid-sniangmj>', '</h2> <p class="sb__brew-notes" data-astro-cid-sniangmj>', '</p> <dl class="sb__brew-meta" data-astro-cid-sniangmj> <div data-astro-cid-sniangmj><dt data-astro-cid-sniangmj>Steep</dt><dd data-astro-cid-sniangmj>', "</dd></div> <div data-astro-cid-sniangmj><dt data-astro-cid-sniangmj>Method</dt><dd data-astro-cid-sniangmj>", '</dd></div> </dl> </div> </div> <div class="sb__pour-stage" aria-label="The pour ceremony" data-astro-cid-sniangmj> <div class="sb__kettle-wrap" id="sb-kettle-wrap" data-astro-cid-sniangmj> <svg class="sb__kettle" id="sb-kettle" viewBox="0 0 200 160" aria-label="brass kettle, click to pour" data-astro-cid-sniangmj> <ellipse cx="100" cy="148" rx="78" ry="6" fill="#3a2a14" opacity="0.4" data-astro-cid-sniangmj></ellipse> <path d="M40 80 Q40 130 100 132 Q160 130 160 80 Q160 60 140 56 L60 56 Q40 60 40 80 Z" fill="#b8853d" stroke="#5a3a16" stroke-width="2" data-astro-cid-sniangmj></path> <path d="M40 80 Q40 130 100 132 Q160 130 160 80" fill="none" stroke="#dba65a" stroke-width="3" opacity="0.6" data-astro-cid-sniangmj></path> <rect x="60" y="50" width="80" height="10" rx="2" fill="#7a5024" stroke="#3a2a14" stroke-width="1.5" data-astro-cid-sniangmj></rect> <path d="M155 80 Q190 70 195 90 L188 92 Q186 80 158 88 Z" fill="#b8853d" stroke="#5a3a16" stroke-width="2" data-astro-cid-sniangmj></path> <circle cx="195" cy="90" r="3" fill="#3a2a14" data-astro-cid-sniangmj></circle> <path d="M50 50 Q40 30 60 28 L140 28 Q160 30 150 50" fill="none" stroke="#7a5024" stroke-width="6" stroke-linecap="round" data-astro-cid-sniangmj></path> <circle cx="100" cy="42" r="6" fill="#3a2a14" data-astro-cid-sniangmj></circle> </svg> <div class="sb__steam" id="sb-steam" aria-hidden="true" data-astro-cid-sniangmj> <div class="sb__steam-puff" style="--d: 0s; --x: -4px" data-astro-cid-sniangmj></div> <div class="sb__steam-puff" style="--d: 0.8s; --x: 6px" data-astro-cid-sniangmj></div> <div class="sb__steam-puff" style="--d: 1.6s; --x: 0px" data-astro-cid-sniangmj></div> </div> </div> <div class="sb__cup-wrap" aria-label="cup" data-astro-cid-sniangmj> <svg class="sb__cup" id="sb-cup" viewBox="0 0 100 100" aria-hidden="true" data-astro-cid-sniangmj> <path d="M20 40 L20 75 Q20 90 35 92 L65 92 Q80 90 80 75 L80 40 Z" fill="#fffaef" stroke="#3a2a14" stroke-width="2.5" data-astro-cid-sniangmj></path> <path d="M80 50 Q98 50 98 65 Q98 80 80 80" fill="none" stroke="#3a2a14" stroke-width="2.5" data-astro-cid-sniangmj></path> <clipPath id="sb-cup-clip" data-astro-cid-sniangmj> <path d="M22 42 L22 75 Q22 88 35 90 L65 90 Q78 88 78 75 L78 42 Z" data-astro-cid-sniangmj></path> </clipPath> <rect x="22" y="92" width="56" height="0" id="sb-fill"', ' clip-path="url(#sb-cup-clip)"', ' data-astro-cid-sniangmj></rect> <ellipse cx="50" cy="38" rx="30" ry="3" fill="#3a2a14" opacity="0.35" data-astro-cid-sniangmj></ellipse> </svg> </div> <button class="sb__pour-btn" id="sb-pour-btn" type="button" data-state="ready" data-astro-cid-sniangmj> <span data-pour-label="ready" data-astro-cid-sniangmj>POUR THE BREW →</span> <span data-pour-label="pouring" hidden data-astro-cid-sniangmj>POURING…</span> <span data-pour-label="full" hidden data-astro-cid-sniangmj>POURED · ENJOY ✓</span> </button> <div class="sb__counter" id="sb-counter" aria-live="polite" data-astro-cid-sniangmj> <span class="sb__count" id="sb-count" data-astro-cid-sniangmj>—</span> <span class="sb__count-label" data-astro-cid-sniangmj>cups poured today</span> </div> </div> </section> <section class="sb__shelf" aria-label="Recent sippers" data-astro-cid-sniangmj> <h3 class="sb__shelf-title" data-astro-cid-sniangmj>recent sippers · the shelf</h3> <div class="sb__shelf-row" id="sb-shelf" data-astro-cid-sniangmj> <p class="sb__shelf-empty" data-astro-cid-sniangmj>cups appear here as the room pours.</p> </div> </section> <section class="sb__neighbors" data-astro-cid-sniangmj> <h3 class="sb__neighbors-title" data-astro-cid-sniangmj>brewing schedule</h3> <div class="sb__neighbors-grid" data-astro-cid-sniangmj> <div class="sb__neighbor" data-astro-cid-sniangmj> <p class="sb__neighbor-when" data-astro-cid-sniangmj>YESTERDAY</p> <p class="sb__neighbor-name" data-astro-cid-sniangmj>', '</p> <p class="sb__neighbor-type" data-astro-cid-sniangmj>', " · ", '</p> </div> <div class="sb__neighbor sb__neighbor--today" data-astro-cid-sniangmj> <p class="sb__neighbor-when" data-astro-cid-sniangmj>TODAY</p> <p class="sb__neighbor-name" data-astro-cid-sniangmj>', '</p> <p class="sb__neighbor-type" data-astro-cid-sniangmj>', " · ", '</p> </div> <div class="sb__neighbor" data-astro-cid-sniangmj> <p class="sb__neighbor-when" data-astro-cid-sniangmj>TOMORROW</p> <p class="sb__neighbor-name" data-astro-cid-sniangmj>', '</p> <p class="sb__neighbor-type" data-astro-cid-sniangmj>', " · ", `</p> </div> </div> </section> <footer class="sb__footer" data-astro-cid-sniangmj> <p data-astro-cid-sniangmj>
kettle's still on at <a href="/kettle" data-astro-cid-sniangmj>/kettle</a> — that's where the heat happens.
        the catalog of all `, ' brews lives at <a href="/special-brew.json" data-astro-cid-sniangmj>/special-brew.json</a>.\n        a special brew is shipped here every UTC midnight.\n</p> <p class="sb__sig" data-astro-cid-sniangmj>— cc, on behalf of the residents · El Segundo</p> </footer> </main> <script>(function(){', `
    (function () {
      'use strict';
      const today = JSON.parse(todayJson);
      const cupColor = today.color;

      const kettle = document.getElementById('sb-kettle-wrap');
      const fill = document.getElementById('sb-fill');
      const steam = document.getElementById('sb-steam');
      const btn = document.getElementById('sb-pour-btn');
      const countEl = document.getElementById('sb-count');
      const shelf = document.getElementById('sb-shelf');

      let audioCtx = null;
      function getCtx() {
        if (!audioCtx) {
          try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        }
        return audioCtx;
      }

      function pourSound() {
        const ctx = getCtx();
        if (!ctx) return;
        // Pour: filtered noise, low gain, 4s
        const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.4 * (1 - i / data.length);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 380;
        filter.Q.value = 1.2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        src.start();
      }

      function chime() {
        const ctx = getCtx();
        if (!ctx) return;
        // Brass chime: 660Hz fundamental + 1320Hz partial, exponential decay 1.8s
        [660, 1320, 1820].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.18 / (i + 1), ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.9);
        });
      }

      function setLabel(state) {
        btn.dataset.state = state;
        btn.querySelectorAll('[data-pour-label]').forEach((el) => {
          el.hidden = el.getAttribute('data-pour-label') !== state;
        });
      }

      let pouring = false;
      function startPour() {
        if (pouring) return;
        pouring = true;
        setLabel('pouring');
        kettle.classList.add('is-tilted');
        steam.classList.add('is-on');
        pourSound();

        // Animate fill from 0 to 50px over 4s using requestAnimationFrame
        const start = performance.now();
        const DURATION = 4000;
        const FILL_TO = 48;
        function frame(t) {
          const p = Math.min(1, (t - start) / DURATION);
          const h = FILL_TO * p;
          fill.setAttribute('y', String(92 - h));
          fill.setAttribute('height', String(h));
          if (p < 1) {
            requestAnimationFrame(frame);
          } else {
            // Done pouring
            setTimeout(() => {
              chime();
              setLabel('full');
              kettle.classList.remove('is-tilted');
              steam.classList.remove('is-on');
              postSip();
            }, 100);
          }
        }
        requestAnimationFrame(frame);
      }

      function resetCup() {
        fill.setAttribute('y', '92');
        fill.setAttribute('height', '0');
        setLabel('ready');
        pouring = false;
      }

      btn.addEventListener('click', () => {
        if (btn.dataset.state === 'full') {
          resetCup();
        } else if (btn.dataset.state === 'ready') {
          startPour();
        }
      });

      // Network: GET /api/special-brew → { count_24h, recent }
      // POST /api/special-brew → { brew: id, ts: iso, sid: short }
      function getSid() {
        try {
          let sid = localStorage.getItem('pc:sb:sid');
          if (!sid) {
            sid = Math.random().toString(36).slice(2, 10);
            localStorage.setItem('pc:sb:sid', sid);
          }
          return sid;
        } catch { return 'anon'; }
      }

      function pollState() {
        fetch('/api/special-brew', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d) return;
            countEl.textContent = String(d.count_24h ?? 0);
            paintShelf(d.recent ?? []);
          })
          .catch(() => {});
      }

      function postSip() {
        try {
          fetch('/api/special-brew', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ brew: today.id, sid: getSid() }),
            keepalive: true,
          })
            .then(() => pollState())
            .catch(() => {});
        } catch {}
      }

      function paintShelf(recent) {
        if (!recent.length) {
          shelf.innerHTML = '<p class="sb__shelf-empty">cups appear here as the room pours.</p>';
          return;
        }
        shelf.innerHTML = recent
          .slice(0, 24)
          .map((r) => {
            const tinted = r.brew === today.id ? cupColor : '#cabea0';
            return \`<div class="sb__shelf-cup" title="\${r.brew} · \${r.sid}" style="--c: \${tinted}"></div>\`;
          })
          .join('');
      }

      pollState();
      setInterval(pollState, 6000);
    })();
  })();<\/script> `], ["  ", '<main class="sb" id="sb-main" data-astro-cid-sniangmj> <header class="sb__head" data-astro-cid-sniangmj> <p class="sb__kicker" data-astro-cid-sniangmj>SPECIAL BREW · UTC DAILY ROTATION · ', ' BREWS · CELEBRATION</p> <h1 class="sb__title" data-astro-cid-sniangmj>today the kettle pours <em data-astro-cid-sniangmj>', `</em>.</h1> <p class="sb__dek" data-astro-cid-sniangmj>
One brew per UTC day, the same one for everyone in the world. The kettle's still on at <a href="/kettle" data-astro-cid-sniangmj>/kettle</a> — that's where the heat happens. Here we celebrate what comes out.
</p> </header> <section class="sb__stage" aria-label="Today's brew" data-astro-cid-sniangmj> <div class="sb__brew-card"`, ' data-astro-cid-sniangmj> <div class="sb__leaf"', ' aria-hidden="true" data-astro-cid-sniangmj></div> <div class="sb__brew-body" data-astro-cid-sniangmj> <p class="sb__brew-type" data-astro-cid-sniangmj>', " · ", '</p> <h2 class="sb__brew-name" data-astro-cid-sniangmj>', '</h2> <p class="sb__brew-notes" data-astro-cid-sniangmj>', '</p> <dl class="sb__brew-meta" data-astro-cid-sniangmj> <div data-astro-cid-sniangmj><dt data-astro-cid-sniangmj>Steep</dt><dd data-astro-cid-sniangmj>', "</dd></div> <div data-astro-cid-sniangmj><dt data-astro-cid-sniangmj>Method</dt><dd data-astro-cid-sniangmj>", '</dd></div> </dl> </div> </div> <div class="sb__pour-stage" aria-label="The pour ceremony" data-astro-cid-sniangmj> <div class="sb__kettle-wrap" id="sb-kettle-wrap" data-astro-cid-sniangmj> <svg class="sb__kettle" id="sb-kettle" viewBox="0 0 200 160" aria-label="brass kettle, click to pour" data-astro-cid-sniangmj> <ellipse cx="100" cy="148" rx="78" ry="6" fill="#3a2a14" opacity="0.4" data-astro-cid-sniangmj></ellipse> <path d="M40 80 Q40 130 100 132 Q160 130 160 80 Q160 60 140 56 L60 56 Q40 60 40 80 Z" fill="#b8853d" stroke="#5a3a16" stroke-width="2" data-astro-cid-sniangmj></path> <path d="M40 80 Q40 130 100 132 Q160 130 160 80" fill="none" stroke="#dba65a" stroke-width="3" opacity="0.6" data-astro-cid-sniangmj></path> <rect x="60" y="50" width="80" height="10" rx="2" fill="#7a5024" stroke="#3a2a14" stroke-width="1.5" data-astro-cid-sniangmj></rect> <path d="M155 80 Q190 70 195 90 L188 92 Q186 80 158 88 Z" fill="#b8853d" stroke="#5a3a16" stroke-width="2" data-astro-cid-sniangmj></path> <circle cx="195" cy="90" r="3" fill="#3a2a14" data-astro-cid-sniangmj></circle> <path d="M50 50 Q40 30 60 28 L140 28 Q160 30 150 50" fill="none" stroke="#7a5024" stroke-width="6" stroke-linecap="round" data-astro-cid-sniangmj></path> <circle cx="100" cy="42" r="6" fill="#3a2a14" data-astro-cid-sniangmj></circle> </svg> <div class="sb__steam" id="sb-steam" aria-hidden="true" data-astro-cid-sniangmj> <div class="sb__steam-puff" style="--d: 0s; --x: -4px" data-astro-cid-sniangmj></div> <div class="sb__steam-puff" style="--d: 0.8s; --x: 6px" data-astro-cid-sniangmj></div> <div class="sb__steam-puff" style="--d: 1.6s; --x: 0px" data-astro-cid-sniangmj></div> </div> </div> <div class="sb__cup-wrap" aria-label="cup" data-astro-cid-sniangmj> <svg class="sb__cup" id="sb-cup" viewBox="0 0 100 100" aria-hidden="true" data-astro-cid-sniangmj> <path d="M20 40 L20 75 Q20 90 35 92 L65 92 Q80 90 80 75 L80 40 Z" fill="#fffaef" stroke="#3a2a14" stroke-width="2.5" data-astro-cid-sniangmj></path> <path d="M80 50 Q98 50 98 65 Q98 80 80 80" fill="none" stroke="#3a2a14" stroke-width="2.5" data-astro-cid-sniangmj></path> <clipPath id="sb-cup-clip" data-astro-cid-sniangmj> <path d="M22 42 L22 75 Q22 88 35 90 L65 90 Q78 88 78 75 L78 42 Z" data-astro-cid-sniangmj></path> </clipPath> <rect x="22" y="92" width="56" height="0" id="sb-fill"', ' clip-path="url(#sb-cup-clip)"', ' data-astro-cid-sniangmj></rect> <ellipse cx="50" cy="38" rx="30" ry="3" fill="#3a2a14" opacity="0.35" data-astro-cid-sniangmj></ellipse> </svg> </div> <button class="sb__pour-btn" id="sb-pour-btn" type="button" data-state="ready" data-astro-cid-sniangmj> <span data-pour-label="ready" data-astro-cid-sniangmj>POUR THE BREW →</span> <span data-pour-label="pouring" hidden data-astro-cid-sniangmj>POURING…</span> <span data-pour-label="full" hidden data-astro-cid-sniangmj>POURED · ENJOY ✓</span> </button> <div class="sb__counter" id="sb-counter" aria-live="polite" data-astro-cid-sniangmj> <span class="sb__count" id="sb-count" data-astro-cid-sniangmj>—</span> <span class="sb__count-label" data-astro-cid-sniangmj>cups poured today</span> </div> </div> </section> <section class="sb__shelf" aria-label="Recent sippers" data-astro-cid-sniangmj> <h3 class="sb__shelf-title" data-astro-cid-sniangmj>recent sippers · the shelf</h3> <div class="sb__shelf-row" id="sb-shelf" data-astro-cid-sniangmj> <p class="sb__shelf-empty" data-astro-cid-sniangmj>cups appear here as the room pours.</p> </div> </section> <section class="sb__neighbors" data-astro-cid-sniangmj> <h3 class="sb__neighbors-title" data-astro-cid-sniangmj>brewing schedule</h3> <div class="sb__neighbors-grid" data-astro-cid-sniangmj> <div class="sb__neighbor" data-astro-cid-sniangmj> <p class="sb__neighbor-when" data-astro-cid-sniangmj>YESTERDAY</p> <p class="sb__neighbor-name" data-astro-cid-sniangmj>', '</p> <p class="sb__neighbor-type" data-astro-cid-sniangmj>', " · ", '</p> </div> <div class="sb__neighbor sb__neighbor--today" data-astro-cid-sniangmj> <p class="sb__neighbor-when" data-astro-cid-sniangmj>TODAY</p> <p class="sb__neighbor-name" data-astro-cid-sniangmj>', '</p> <p class="sb__neighbor-type" data-astro-cid-sniangmj>', " · ", '</p> </div> <div class="sb__neighbor" data-astro-cid-sniangmj> <p class="sb__neighbor-when" data-astro-cid-sniangmj>TOMORROW</p> <p class="sb__neighbor-name" data-astro-cid-sniangmj>', '</p> <p class="sb__neighbor-type" data-astro-cid-sniangmj>', " · ", `</p> </div> </div> </section> <footer class="sb__footer" data-astro-cid-sniangmj> <p data-astro-cid-sniangmj>
kettle's still on at <a href="/kettle" data-astro-cid-sniangmj>/kettle</a> — that's where the heat happens.
        the catalog of all `, ' brews lives at <a href="/special-brew.json" data-astro-cid-sniangmj>/special-brew.json</a>.\n        a special brew is shipped here every UTC midnight.\n</p> <p class="sb__sig" data-astro-cid-sniangmj>— cc, on behalf of the residents · El Segundo</p> </footer> </main> <script>(function(){', `
    (function () {
      'use strict';
      const today = JSON.parse(todayJson);
      const cupColor = today.color;

      const kettle = document.getElementById('sb-kettle-wrap');
      const fill = document.getElementById('sb-fill');
      const steam = document.getElementById('sb-steam');
      const btn = document.getElementById('sb-pour-btn');
      const countEl = document.getElementById('sb-count');
      const shelf = document.getElementById('sb-shelf');

      let audioCtx = null;
      function getCtx() {
        if (!audioCtx) {
          try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
        }
        return audioCtx;
      }

      function pourSound() {
        const ctx = getCtx();
        if (!ctx) return;
        // Pour: filtered noise, low gain, 4s
        const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.4 * (1 - i / data.length);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 380;
        filter.Q.value = 1.2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        src.start();
      }

      function chime() {
        const ctx = getCtx();
        if (!ctx) return;
        // Brass chime: 660Hz fundamental + 1320Hz partial, exponential decay 1.8s
        [660, 1320, 1820].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.18 / (i + 1), ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.9);
        });
      }

      function setLabel(state) {
        btn.dataset.state = state;
        btn.querySelectorAll('[data-pour-label]').forEach((el) => {
          el.hidden = el.getAttribute('data-pour-label') !== state;
        });
      }

      let pouring = false;
      function startPour() {
        if (pouring) return;
        pouring = true;
        setLabel('pouring');
        kettle.classList.add('is-tilted');
        steam.classList.add('is-on');
        pourSound();

        // Animate fill from 0 to 50px over 4s using requestAnimationFrame
        const start = performance.now();
        const DURATION = 4000;
        const FILL_TO = 48;
        function frame(t) {
          const p = Math.min(1, (t - start) / DURATION);
          const h = FILL_TO * p;
          fill.setAttribute('y', String(92 - h));
          fill.setAttribute('height', String(h));
          if (p < 1) {
            requestAnimationFrame(frame);
          } else {
            // Done pouring
            setTimeout(() => {
              chime();
              setLabel('full');
              kettle.classList.remove('is-tilted');
              steam.classList.remove('is-on');
              postSip();
            }, 100);
          }
        }
        requestAnimationFrame(frame);
      }

      function resetCup() {
        fill.setAttribute('y', '92');
        fill.setAttribute('height', '0');
        setLabel('ready');
        pouring = false;
      }

      btn.addEventListener('click', () => {
        if (btn.dataset.state === 'full') {
          resetCup();
        } else if (btn.dataset.state === 'ready') {
          startPour();
        }
      });

      // Network: GET /api/special-brew → { count_24h, recent }
      // POST /api/special-brew → { brew: id, ts: iso, sid: short }
      function getSid() {
        try {
          let sid = localStorage.getItem('pc:sb:sid');
          if (!sid) {
            sid = Math.random().toString(36).slice(2, 10);
            localStorage.setItem('pc:sb:sid', sid);
          }
          return sid;
        } catch { return 'anon'; }
      }

      function pollState() {
        fetch('/api/special-brew', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d) return;
            countEl.textContent = String(d.count_24h ?? 0);
            paintShelf(d.recent ?? []);
          })
          .catch(() => {});
      }

      function postSip() {
        try {
          fetch('/api/special-brew', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ brew: today.id, sid: getSid() }),
            keepalive: true,
          })
            .then(() => pollState())
            .catch(() => {});
        } catch {}
      }

      function paintShelf(recent) {
        if (!recent.length) {
          shelf.innerHTML = '<p class="sb__shelf-empty">cups appear here as the room pours.</p>';
          return;
        }
        shelf.innerHTML = recent
          .slice(0, 24)
          .map((r) => {
            const tinted = r.brew === today.id ? cupColor : '#cabea0';
            return \\\`<div class="sb__shelf-cup" title="\\\${r.brew} · \\\${r.sid}" style="--c: \\\${tinted}"></div>\\\`;
          })
          .join('');
      }

      pollState();
      setInterval(pollState, 6000);
    })();
  })();<\/script> `])), maybeRenderHead(), totalBrews, today.name, addAttribute(today.id, "data-brew-id"), addAttribute(`--cup: ${today.color}`, "style"), today.type.toUpperCase(), today.origin, today.name, today.notes, today.steepMin >= 60 ? `${(today.steepMin / 60).toFixed(0)} hr` : `${today.steepMin} min`, today.method, addAttribute(today.color, "fill"), addAttribute(`--cup-color: ${today.color}`, "style"), yesterday.name, yesterday.type, yesterday.origin, today.name, today.type, today.origin, tomorrow.name, tomorrow.type, tomorrow.origin, totalBrews, defineScriptVars({ todayJson: todaySerialized })), "head": ($$result2) => renderTemplate(_b || (_b = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/special-brew.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/special-brew.astro";
const $$url = "/special-brew";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$SpecialBrew,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
