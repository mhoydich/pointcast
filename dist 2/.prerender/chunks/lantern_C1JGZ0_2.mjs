import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Lantern = createComponent(($$result, $$props, $$slots) => {
  const title = "/lantern";
  const description = "A single paper lantern you can leave on. Color slowly shifts through the tide palette swatches. No controls, no audio. Local-only minutes counter.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';

  /* Palette ring — same swatches as /tide, but only the warm "glow"
     candidates (no STORM, no NIGHTTIDE darks, no KELP greens). The
     lantern wants warm light. */
  var GLOW_COLORS = [
    '#FFB496', // daybreak orb
    '#FFEEC2', // coral orb
    '#F5DEA8', // lagoon orb
    '#FFE9D8', // daybreak foam
    '#FFE0D6', // coral foam
    '#FFD4C2', // daybreak sky
    '#FFC4B0', // coral sky
  ];
  var SKY_COLORS = [
    '#0a0a0e',
    '#0a0c14',
    '#0c0a14',
    '#0e0a0a',
  ];
  var CYCLE_MS = 24 * 60 * 1000; // 24 min for one full glow loop
  var SKY_MS = 6 * 60 * 1000;    // 6 min for sky to nudge

  function lerpHex(a, b, t) {
    var ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + [r, g, bl].map(function (n) { return n.toString(16).padStart(2, '0'); }).join('');
  }
  function pickColor(arr, ms, cycleMs) {
    var n = arr.length;
    var pos = (ms % cycleMs) / cycleMs * n;
    var i = Math.floor(pos);
    var t = pos - i;
    return lerpHex(arr[i % n], arr[(i + 1) % n], t);
  }

  /* Apply current colors */
  var t0 = performance.now();
  var startedAt = Date.now();

  function tick() {
    var now = performance.now();
    var ms = now - t0;
    var glow = pickColor(GLOW_COLORS, ms, CYCLE_MS);
    var sky = pickColor(SKY_COLORS, ms, SKY_MS);
    var main = document.getElementById('ln-main');
    if (main) {
      main.style.setProperty('--glow', glow);
      main.style.setProperty('--sky', sky);
    }
  }
  tick();
  setInterval(tick, 4000);

  /* "kept on for" counter — local only */
  function loadMinutes() {
    try {
      var raw = localStorage.getItem('pc:lantern:minutes');
      var n = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch (e) { return 0; }
  }
  function saveMinutes(n) {
    try { localStorage.setItem('pc:lantern:minutes', String(n)); } catch (e) {}
  }
  var minutes = loadMinutes();
  var sessionStart = Date.now();

  function renderCount() {
    var sessionMin = Math.floor((Date.now() - sessionStart) / 60000);
    var total = minutes + sessionMin;
    var el = document.getElementById('ln-count');
    if (el) {
      if (total === 0) el.textContent = 'kept on · just lit';
      else if (total === 1) el.textContent = 'kept on · 1 minute';
      else el.textContent = 'kept on · ' + total + ' minutes';
    }
  }
  renderCount();
  // tick the visible counter every 30s; persist every 60s
  setInterval(renderCount, 30000);
  setInterval(function () {
    var sessionMin = Math.floor((Date.now() - sessionStart) / 60000);
    saveMinutes(minutes + sessionMin);
  }, 60000);
  // persist on unload too
  window.addEventListener('beforeunload', function () {
    var sessionMin = Math.floor((Date.now() - sessionStart) / 60000);
    saveMinutes(minutes + sessionMin);
  });
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ln" id="ln-main"> <div class="ln__sky" aria-hidden="true"></div> <div class="ln__lantern" aria-hidden="true"> <div class="ln__glow"></div> <div class="ln__paper"> <div class="ln__pleat ln__pleat--1"></div> <div class="ln__pleat ln__pleat--2"></div> <div class="ln__pleat ln__pleat--3"></div> <div class="ln__pleat ln__pleat--4"></div> <div class="ln__pleat ln__pleat--5"></div> </div> <div class="ln__top"></div> <div class="ln__bottom"></div> <div class="ln__cord"></div> </div> <div class="ln__wisp" aria-hidden="true"></div> <p class="ln__count mono" id="ln-count">kept on · — minutes</p> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/lantern.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/lantern.astro";
const $$url = "/lantern";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Lantern,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
