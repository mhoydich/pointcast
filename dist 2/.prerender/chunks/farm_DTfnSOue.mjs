import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Farm = createComponent(($$result, $$props, $$slots) => {
  const title = "Farm — Sam's Plot";
  const description = "A small, zen farming game on PointCast. Tend a 9-tile plot with four seed types. Plant, water, harvest. Async-friendly. LocalStorage-backed.";
  const canonical = "https://pointcast.xyz/farm";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    "@id": canonical,
    name: "Sam's Plot",
    alternateName: "PointCast Farm",
    description,
    url: canonical,
    gamePlatform: ["Web browser"],
    numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
    about: ["farming", "garden", "gamgee", "pointcast", "zen", "async"],
    inLanguage: "en-US"
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';
    var STORAGE_KEY = 'pc:farm:v0';
    var NOW = function () { return Date.now(); };

    // Seed catalog — wall-clock growth times (in ms)
    var SEEDS = {
      corn:     { name: 'Corn',     glyph: '🌽', seedEmoji: '·',  time: 30 * 1000,        water: 15 * 1000,        color: '#f59e0b' },
      tomato:   { name: 'Tomato',   glyph: '🍅', seedEmoji: '·',  time: 2 * 60 * 1000,    water: 60 * 1000,        color: '#ef4444' },
      tater:    { name: 'Tater',    glyph: '🥔', seedEmoji: '·',  time: 5 * 60 * 1000,    water: 120 * 1000,       color: '#b45309' },
      pipeweed: { name: 'Pipeweed', glyph: '🌿', seedEmoji: '·',  time: 10 * 60 * 1000,   water: 240 * 1000,       color: '#166534' },
    };

    // Growth stages by progress ratio
    function stageFor(progress) {
      if (progress < 0.15) return 'seed';
      if (progress < 0.45) return 'sprout';
      if (progress < 0.80) return 'young';
      if (progress < 1.00) return 'mature';
      return 'ripe';
    }

    function stageGlyph(seedKey, stage) {
      if (stage === 'ripe') return SEEDS[seedKey].glyph;
      if (stage === 'mature') return '🌿';
      if (stage === 'young') return '🌱';
      if (stage === 'sprout') return '・';
      return '·';
    }

    function loadState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1 && Array.isArray(parsed.plot) && parsed.plot.length === 9) {
            return parsed;
          }
        }
      } catch (e) {}
      return freshState();
    }

    function freshState() {
      var plot = [];
      for (var i = 0; i < 9; i++) plot.push({ idx: i, state: 'empty' });
      return { version: 1, plot: plot, harvested: [], started: NOW() };
    }

    function saveState(s) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
    }

    var state = loadState();
    var selectedSeed = null;

    var plotEl = document.getElementById('farm-plot');
    var tiles = Array.prototype.slice.call(plotEl.querySelectorAll('.tile'));
    var seedCards = Array.prototype.slice.call(document.querySelectorAll('.seed-card'));
    var hintEl = document.getElementById('farm-selected-hint');
    var waterAllBtn = document.getElementById('farm-water');
    var resetBtn = document.getElementById('farm-reset');
    var ledgerCountEl = document.getElementById('farm-ledger-count');
    var ledgerListEl = document.getElementById('farm-ledger-list');

    function relTimeShort(ms) {
      var s = Math.max(0, Math.floor(ms / 1000));
      if (s < 60) return s + 's';
      if (s < 3600) return Math.floor(s / 60) + 'm';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      return Math.floor(s / 86400) + 'd';
    }

    function progressFor(tile) {
      // A 'ripe' tile loaded from storage already completed growth — short-circuit
      // so render shows the ripe stage instead of recomputing back to 'seed'.
      if (tile.state === 'ripe') return 1;
      if (tile.state !== 'growing') return 0;
      var spec = SEEDS[tile.seed];
      if (!spec) return 0;
      var now = NOW();
      var elapsed = now - tile.plantedAt;
      // Water penalty: if long past lastWatered, growth slows by 40%
      var sinceWater = now - (tile.lastWatered || tile.plantedAt);
      var penalty = sinceWater > spec.water ? 0.6 : 1.0;
      return Math.min(1, (elapsed * penalty) / spec.time);
    }

    function render() {
      tiles.forEach(function (btn, i) {
        var tile = state.plot[i];
        btn.className = 'tile';
        btn.innerHTML = '';

        if (tile.state === 'empty') {
          btn.classList.add('tile--empty');
          if (selectedSeed) btn.classList.add('tile--plantable');
          btn.setAttribute('aria-label', 'Empty tile ' + (i + 1) + ' — click to plant ' + (selectedSeed || 'nothing'));
        } else if (tile.state === 'growing' || tile.state === 'ripe') {
          var progress = progressFor(tile);
          var stage = stageFor(progress);
          if (progress >= 1 && tile.state !== 'ripe') {
            tile.state = 'ripe';
            saveState(state);
          }
          btn.classList.add('tile--' + stage);
          btn.classList.add('tile--seed-' + tile.seed);

          var inner = document.createElement('div');
          inner.className = 'tile__inner';

          var glyph = document.createElement('div');
          glyph.className = 'tile__glyph';
          glyph.textContent = stageGlyph(tile.seed, stage);
          inner.appendChild(glyph);

          var meta = document.createElement('div');
          meta.className = 'tile__meta';
          if (stage === 'ripe') {
            meta.textContent = 'RIPE — TAP';
          } else {
            var remainingMs = SEEDS[tile.seed].time - (NOW() - tile.plantedAt);
            meta.textContent = stage.toUpperCase() + ' · ' + relTimeShort(remainingMs);
          }
          inner.appendChild(meta);

          var water = document.createElement('div');
          water.className = 'tile__water';
          var sinceWater = NOW() - (tile.lastWatered || tile.plantedAt);
          var needsWater = sinceWater > SEEDS[tile.seed].water;
          water.textContent = needsWater ? '💧 thirsty' : '💧 ok';
          if (needsWater) water.classList.add('tile__water--low');
          inner.appendChild(water);

          btn.appendChild(inner);

          btn.setAttribute('aria-label', SEEDS[tile.seed].name + ' tile ' + (i + 1) + ', stage ' + stage);
        }
      });

      // Ledger
      ledgerCountEl.textContent = state.harvested.length + ' HARVEST' + (state.harvested.length === 1 ? '' : 'S');
      ledgerListEl.innerHTML = '';
      if (state.harvested.length === 0) {
        var empty = document.createElement('li');
        empty.className = 'farm__ledger-empty';
        empty.textContent = 'Nothing harvested yet. Plant a seed.';
        ledgerListEl.appendChild(empty);
      } else {
        var recent = state.harvested.slice(-8).reverse();
        recent.forEach(function (h) {
          var li = document.createElement('li');
          var ago = relTimeShort(NOW() - h.at);
          li.innerHTML = '<span class="ledger__glyph">' + SEEDS[h.seed].glyph + '</span>' +
            '<span class="ledger__name">' + SEEDS[h.seed].name + '</span>' +
            '<span class="ledger__ago">' + ago + ' ago</span>';
          ledgerListEl.appendChild(li);
        });
      }
    }

    seedCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var key = card.getAttribute('data-seed');
        if (selectedSeed === key) {
          selectedSeed = null;
          card.classList.remove('seed-card--selected');
          hintEl.textContent = 'CHOOSE A SEED →';
        } else {
          selectedSeed = key;
          seedCards.forEach(function (c) { c.classList.remove('seed-card--selected'); });
          card.classList.add('seed-card--selected');
          hintEl.textContent = 'PLANTING: ' + SEEDS[key].name.toUpperCase();
        }
        render();
      });
    });

    plotEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.tile');
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-idx'), 10);
      var tile = state.plot[idx];
      if (tile.state === 'empty') {
        if (!selectedSeed) {
          hintEl.textContent = '↑ CHOOSE A SEED FIRST';
          hintEl.classList.add('hint--warn');
          setTimeout(function () { hintEl.classList.remove('hint--warn'); }, 900);
          return;
        }
        tile.state = 'growing';
        tile.seed = selectedSeed;
        tile.plantedAt = NOW();
        tile.lastWatered = NOW();
        saveState(state);
        render();
      } else if (tile.state === 'ripe') {
        state.harvested.push({ seed: tile.seed, at: NOW() });
        state.plot[idx] = { idx: idx, state: 'empty' };
        saveState(state);
        render();
      } else if (tile.state === 'growing') {
        // Tap growing tile = water just that one
        tile.lastWatered = NOW();
        saveState(state);
        render();
      }
    });

    waterAllBtn.addEventListener('click', function () {
      var now = NOW();
      state.plot.forEach(function (tile) {
        if (tile.state === 'growing') tile.lastWatered = now;
      });
      saveState(state);
      render();
    });

    resetBtn.addEventListener('click', function () {
      if (!confirm('Reset the whole plot? Your harvest ledger will be kept.')) return;
      var preservedLedger = state.harvested;
      state = freshState();
      state.harvested = preservedLedger;
      saveState(state);
      render();
    });

    render();
    setInterval(render, 1000);
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-p7rbuoyx": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="farm" data-astro-cid-p7rbuoyx> <nav class="farm__crumb" aria-label="Breadcrumb" data-astro-cid-p7rbuoyx> <a href="/" data-astro-cid-p7rbuoyx>Home</a> <span aria-hidden="true" data-astro-cid-p7rbuoyx>›</span> <span data-astro-cid-p7rbuoyx>farm</span> </nav> <header class="farm__hero" data-astro-cid-p7rbuoyx> <p class="farm__kicker mono" data-astro-cid-p7rbuoyx>FARM · SAM'S PLOT · v0</p> <h1 class="farm__title" data-astro-cid-p7rbuoyx>A small, careful garden.</h1> <p class="farm__dek" data-astro-cid-p7rbuoyx>
Nine tiles. Four seeds. Plant sparingly. Water with care. Come back
        tomorrow. A garden is slow on purpose — this one is no different.
</p> </header> <section class="farm__seeds" aria-label="Seed catalog" data-astro-cid-p7rbuoyx> <h2 class="farm__h2" data-astro-cid-p7rbuoyx>Seed catalog</h2> <div class="farm__seed-grid" data-astro-cid-p7rbuoyx> <button class="seed-card" data-seed="corn" type="button" data-astro-cid-p7rbuoyx> <div class="seed-card__glyph" aria-hidden="true" data-astro-cid-p7rbuoyx>🌽</div> <div class="seed-card__name" data-astro-cid-p7rbuoyx>Corn</div> <div class="seed-card__time mono" data-astro-cid-p7rbuoyx>30 SEC</div> <div class="seed-card__note" data-astro-cid-p7rbuoyx>Fast, sturdy, warm.</div> </button> <button class="seed-card" data-seed="tomato" type="button" data-astro-cid-p7rbuoyx> <div class="seed-card__glyph" aria-hidden="true" data-astro-cid-p7rbuoyx>🍅</div> <div class="seed-card__name" data-astro-cid-p7rbuoyx>Tomato</div> <div class="seed-card__time mono" data-astro-cid-p7rbuoyx>2 MIN</div> <div class="seed-card__note" data-astro-cid-p7rbuoyx>The summer one.</div> </button> <button class="seed-card" data-seed="tater" type="button" data-astro-cid-p7rbuoyx> <div class="seed-card__glyph" aria-hidden="true" data-astro-cid-p7rbuoyx>🥔</div> <div class="seed-card__name" data-astro-cid-p7rbuoyx>Tater</div> <div class="seed-card__time mono" data-astro-cid-p7rbuoyx>5 MIN</div> <div class="seed-card__note" data-astro-cid-p7rbuoyx>Sam's favorite. Boil 'em, mash 'em…</div> </button> <button class="seed-card" data-seed="pipeweed" type="button" data-astro-cid-p7rbuoyx> <div class="seed-card__glyph" aria-hidden="true" data-astro-cid-p7rbuoyx>🌿</div> <div class="seed-card__name" data-astro-cid-p7rbuoyx>Pipeweed</div> <div class="seed-card__time mono" data-astro-cid-p7rbuoyx>10 MIN</div> <div class="seed-card__note" data-astro-cid-p7rbuoyx>Old Toby. The slow one.</div> </button> </div> <p class="farm__hint" data-astro-cid-p7rbuoyx>Click a seed. Then click an empty tile to plant.</p> </section> <section class="farm__plot-section" aria-label="Your plot" data-astro-cid-p7rbuoyx> <div class="farm__plot-head" data-astro-cid-p7rbuoyx> <h2 class="farm__h2" data-astro-cid-p7rbuoyx>Sam's plot</h2> <div class="farm__selected-hint mono" id="farm-selected-hint" data-astro-cid-p7rbuoyx>CHOOSE A SEED →</div> </div> <div class="farm__plot" id="farm-plot" role="grid" aria-label="3 by 3 farming plot" data-astro-cid-p7rbuoyx> <button class="tile" data-idx="0" aria-label="Tile 1" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="1" aria-label="Tile 2" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="2" aria-label="Tile 3" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="3" aria-label="Tile 4" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="4" aria-label="Tile 5" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="5" aria-label="Tile 6" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="6" aria-label="Tile 7" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="7" aria-label="Tile 8" type="button" data-astro-cid-p7rbuoyx></button> <button class="tile" data-idx="8" aria-label="Tile 9" type="button" data-astro-cid-p7rbuoyx></button> </div> <div class="farm__actions" data-astro-cid-p7rbuoyx> <button id="farm-water" class="farm__btn" type="button" data-astro-cid-p7rbuoyx>Water everything 💧</button> <button id="farm-reset" class="farm__btn farm__btn--ghost" type="button" data-astro-cid-p7rbuoyx>Reset plot</button> </div> </section> <section class="farm__ledger" aria-label="Harvest ledger" data-astro-cid-p7rbuoyx> <h2 class="farm__h2" data-astro-cid-p7rbuoyx>Harvest ledger</h2> <p class="farm__ledger-line mono" id="farm-ledger-count" data-astro-cid-p7rbuoyx>0 HARVESTS</p> <ul class="farm__ledger-list mono" id="farm-ledger-list" aria-live="polite" data-astro-cid-p7rbuoyx> <li class="farm__ledger-empty" data-astro-cid-p7rbuoyx>Nothing harvested yet. Plant a seed.</li> </ul> </section> <section class="farm__rules" data-astro-cid-p7rbuoyx> <h2 class="farm__h2" data-astro-cid-p7rbuoyx>How a garden works</h2> <ul class="farm__rules-list" data-astro-cid-p7rbuoyx> <li data-astro-cid-p7rbuoyx>Pick a seed from the catalog. It lights up.</li> <li data-astro-cid-p7rbuoyx>Click an empty tile — the seed plants and starts growing.</li> <li data-astro-cid-p7rbuoyx>Growth stages: <code data-astro-cid-p7rbuoyx>seed → sprout → young → mature → ripe</code>.</li> <li data-astro-cid-p7rbuoyx>Water once or twice during growth. Unwatered plants grow slowly.</li> <li data-astro-cid-p7rbuoyx>When a tile is <strong data-astro-cid-p7rbuoyx>ripe</strong>, click it to harvest. That tile empties.</li> <li data-astro-cid-p7rbuoyx>Harvests go to your ledger below. No scoring, no leaderboard, no streak pressure.</li> <li data-astro-cid-p7rbuoyx>Everything is saved to your browser. If you clear storage, the plot resets.</li> <li data-astro-cid-p7rbuoyx>Come back in the morning. Something will be ripe.</li> </ul> </section> <section class="farm__related" data-astro-cid-p7rbuoyx> <h2 class="farm__h2" data-astro-cid-p7rbuoyx>Related</h2> <ul class="farm__links" data-astro-cid-p7rbuoyx> <li data-astro-cid-p7rbuoyx><a href="/gamgee" data-astro-cid-p7rbuoyx><code class="mono" data-astro-cid-p7rbuoyx>/gamgee</code></a> — the release this belongs to (named for Sam)</li> <li data-astro-cid-p7rbuoyx><a href="/garden-yield" data-astro-cid-p7rbuoyx><code class="mono" data-astro-cid-p7rbuoyx>/garden-yield</code></a> — the real-world native planting companion</li> <li data-astro-cid-p7rbuoyx><a href="/houseplants" data-astro-cid-p7rbuoyx><code class="mono" data-astro-cid-p7rbuoyx>/houseplants</code></a> — the indoor learning lab</li> <li data-astro-cid-p7rbuoyx><a href="/nature" data-astro-cid-p7rbuoyx><code class="mono" data-astro-cid-p7rbuoyx>/nature</code></a> — El Segundo field guide</li> <li data-astro-cid-p7rbuoyx><a href="/meditate" data-astro-cid-p7rbuoyx><code class="mono" data-astro-cid-p7rbuoyx>/meditate</code></a> — the quiet room</li> </ul> </section> <footer class="farm__foot mono" data-astro-cid-p7rbuoyx> <span data-astro-cid-p7rbuoyx>SAM'S PLOT · v0 · LOCAL-ONLY · EL SEGUNDO · 2026-04-23</span> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/farm.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/farm.astro";
const $$url = "/farm";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Farm,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
