import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Moments = createComponent(($$result, $$props, $$slots) => {
  const title = "/tide/moments — what you saved from the tide";
  const description = "Saved moments from /tide — palettes you held long enough to keep. Each card has a re-open link back into /tide at that palette. Local-first; clearing browser data clears the list.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';

  // Mirror of /tide PALETTES — keep in sync. (Could be fetched from
  // /tide.json instead but synchronous render is faster.)
  var PALETTES = {
    daybreak:  { name:'DAYBREAK',  sky:'#FFD4C2', water:'#F4A78D', foam:'#FFE9D8', orb:'#FFB496', wave1:'#E08F73', wave2:'#C4715A', wave3:'#AA5443', dek:'pearl pink · soft peach · lavender mist' },
    crystal:   { name:'CRYSTAL',   sky:'#BFEFEC', water:'#7FE5DC', foam:'#F4FBFA', orb:'#FFFFFF', wave1:'#5DCBC0', wave2:'#3FA89C', wave3:'#1F8579', dek:'aquamarine · soft cyan · white foam' },
    kelp:      { name:'KELP',      sky:'#9FB28A', water:'#5C7A4E', foam:'#E0D4B8', orb:'#D9C46E', wave1:'#3F5E33', wave2:'#2A4424', wave3:'#1A2E18', dek:'sage canopy · deep green · amber kelp' },
    coral:     { name:'CORAL',     sky:'#FFC4B0', water:'#FF8675', foam:'#FFE0D6', orb:'#FFEEC2', wave1:'#E76B5C', wave2:'#C4493D', wave3:'#9B2D24', dek:'coral pink · dusty rose · lavender' },
    abyss:     { name:'ABYSS',     sky:'#1E2D5C', water:'#0A1F3A', foam:'#2EC4B6', orb:'#88E0D4', wave1:'#0E2548', wave2:'#06162D', wave3:'#020912', dek:'midnight indigo · abyssal navy · phosphor teal' },
    storm:     { name:'STORM',     sky:'#5A6470', water:'#2C2E33', foam:'#FFE15D', orb:'#FFE15D', wave1:'#1E2025', wave2:'#16181C', wave3:'#0C0E12', dek:'slate · charcoal · lightning' },
    lagoon:    { name:'LAGOON',    sky:'#A0E6DC', water:'#2EC4B6', foam:'#F5DEA8', orb:'#F5DEA8', wave1:'#26A89C', wave2:'#188076', wave3:'#0F5C55', dek:'turquoise · teal · warm sand' },
    nighttide: { name:'NIGHTTIDE', sky:'#3A0E5C', water:'#0E1845', foam:'#FF1493', orb:'#FF69B4', wave1:'#3D1276', wave2:'#1F1054', wave3:'#0A0830', dek:'electric magenta · hot pink · deep ocean' },
  };

  function escHtml(s) { return String(s).replace(/[&<>"']/g, function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);}); }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }); }
    catch (e) { return iso; }
  }
  function fmtDwell(s) {
    if (!Number.isFinite(s) || s < 0) return '—';
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    var rem = s % 60;
    if (m < 60) return m + 'm ' + rem + 's';
    var h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm';
  }

  function render() {
    var grid = document.getElementById('tm-grid');
    var status = document.getElementById('tm-status');
    if (!grid || !status) return;
    var moments = [];
    try { var raw = localStorage.getItem('pc:tide:moments'); if (raw) moments = JSON.parse(raw) || []; } catch (e) {}
    if (!Array.isArray(moments)) moments = [];

    if (moments.length === 0) {
      grid.innerHTML = '<div class="tm__empty"><p class="tm__empty-head mono">NO MOMENTS YET</p><p class="tm__empty-body">Visit <a href="/tide">/tide</a>, settle into a palette, open the gear (top right), tap <strong>SAVE THIS MOMENT</strong>. Each save lands here.</p></div>';
      status.textContent = '0 saved · cap 50';
      return;
    }

    grid.innerHTML = moments.map(function (m, i) {
      var p = PALETTES[m.palette] || PALETTES.daybreak;
      return '' +
        '<article class="tm-card" data-palette="' + escHtml(m.palette) + '">' +
          '<a class="tm-card__art" href="/tide#' + escHtml(m.palette) + '" title="Reopen ' + escHtml(p.name) + ' on /tide">' +
            '<span class="tm-card__strip" style="background:linear-gradient(180deg,' + p.sky + ' 0%,' + p.water + ' 50%,' + p.wave3 + ' 100%)"></span>' +
            '<span class="tm-card__orb" style="background:radial-gradient(circle at 35% 35%,' + p.orb + ' 0%, transparent 70%)"></span>' +
            '<div class="tm-card__swatches">' +
              '<span style="background:' + p.sky + '"></span>' +
              '<span style="background:' + p.water + '"></span>' +
              '<span style="background:' + p.foam + '"></span>' +
              '<span style="background:' + p.wave1 + '"></span>' +
              '<span style="background:' + p.wave2 + '"></span>' +
              '<span style="background:' + p.wave3 + '"></span>' +
            '</div>' +
          '</a>' +
          '<div class="tm-card__meta">' +
            '<p class="tm-card__name">' + escHtml(p.name) + '</p>' +
            '<p class="tm-card__dek">' + escHtml(p.dek) + '</p>' +
            '<p class="tm-card__row mono">' +
              '<span class="tm-card__pill">SAVED ' + fmtDate(m.savedAt) + '</span>' +
              '<span class="tm-card__pill">DWELL ' + fmtDwell(m.dwellSeconds) + '</span>' +
              (m.audio ? '<span class="tm-card__pill tm-card__pill--audio">SOUND</span>' : '') +
            '</p>' +
            '<div class="tm-card__actions">' +
              '<a class="tm-card__open mono" href="/tide#' + escHtml(m.palette) + '">REOPEN &rarr;</a>' +
              '<button class="tm-card__del mono" data-i="' + i + '" type="button">DELETE</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');

    status.textContent = moments.length + ' saved · cap 50';

    grid.querySelectorAll('[data-i]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-i'), 10);
        if (!Number.isFinite(i)) return;
        var arr = JSON.parse(localStorage.getItem('pc:tide:moments') || '[]');
        arr.splice(i, 1);
        localStorage.setItem('pc:tide:moments', JSON.stringify(arr));
        render();
      });
    });
  }

  function tick() {
    var el = document.getElementById('tm-clock');
    if (!el) return;
    var n = new Date();
    el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ' PT';
  }

  render();
  tick();
  setInterval(tick, 60_000);
  window.addEventListener('storage', function (e) { if (e.key === 'pc:tide:moments') render(); });
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="tm" id="tm-main"> <header class="tm__head"> <p class="tm__kicker">/TIDE · MOMENTS · EL SEGUNDO</p> <h1 class="tm__title">Moments you held long enough.</h1> <p class="tm__dek">
Each card is a palette you saved from <a href="/tide">/tide</a>. Click
        a card to reopen the tide at that palette.
        Cap 50, oldest gets dropped first.
</p> <p class="tm__status mono" id="tm-status">loading…</p> </header> <section class="tm__grid" id="tm-grid"></section> <nav class="tm__links" aria-label="Other rooms"> <a class="tm__link" href="/tide"><span class="tm__link-label mono">/TIDE</span><span class="tm__link-desc">eight palettes · tap anywhere</span></a> <a class="tm__link" href="/bath"><span class="tm__link-label mono">/BATH</span><span class="tm__link-desc">color room · Spotify saves</span></a> <a class="tm__link" href="/meditate"><span class="tm__link-label mono">/MEDITATE</span><span class="tm__link-desc">still room</span></a> <a class="tm__link" href="/pace"><span class="tm__link-label mono">/PACE</span><span class="tm__link-desc">movement room</span></a> <a class="tm__link" href="/"><span class="tm__link-label mono">/</span><span class="tm__link-desc">back to the broadcast</span></a> </nav> <footer class="tm__foot mono"> <span>tide · moments · cc0</span> <span id="tm-clock">—</span> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tide/moments.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tide/moments.astro";
const $$url = "/tide/moments";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Moments,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
