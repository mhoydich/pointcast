import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import 'clsx';
import { N as NATIVE_PLANTING_PALETTE, P as PLANTING_YIELD_SITES, a as PLANTING_VALUE_SYSTEM } from './local_DC-fTB3e.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$NativePlantingYield = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$NativePlantingYield;
  const { context = "nature" } = Astro2.props;
  const paletteBySlug = new Map(NATIVE_PLANTING_PALETTE.map((plant) => [plant.slug, plant]));
  const sites = PLANTING_YIELD_SITES.map((site) => ({
    ...site,
    mix: site.mix.map((item) => {
      const plant = paletteBySlug.get(item.slug);
      return {
        ...item,
        name: plant?.name ?? item.slug,
        scientific: plant?.scientific ?? "",
        form: plant?.form ?? "plant"
      };
    })
  }));
  const defaultSite = sites[0];
  return renderTemplate(_a || (_a = __template(["", "<section", ' id="planting-yield" data-planting-yield data-astro-cid-cmvq6pel> <div class="planting-yield__copy" data-astro-cid-cmvq6pel> <p class="planting-yield__kicker" data-astro-cid-cmvq6pel>BLOCK ', ' · VALUE YIELD SYSTEM</p> <h2 data-astro-cid-cmvq6pel>Turn the palette into a small local asset.</h2> <p class="planting-yield__dek" data-astro-cid-cmvq6pel>', '</p> <dl class="planting-yield__metrics" data-astro-cid-cmvq6pel> ', ' </dl> </div> <div class="planting-yield__system" data-astro-cid-cmvq6pel> <div class="planting-yield__controls" aria-label="Native planting yield controls" data-astro-cid-cmvq6pel> <div data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Site type</span> <div class="planting-yield__tabs" role="group" aria-label="Site type" data-astro-cid-cmvq6pel> ', ' </div> </div> <label class="planting-yield__select" data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Sun read</span> <select data-yield-sun data-astro-cid-cmvq6pel> <option value="full" data-astro-cid-cmvq6pel>Full coastal sun</option> <option value="part" data-astro-cid-cmvq6pel>Morning sun / part day</option> <option value="shade" data-astro-cid-cmvq6pel>Bright shade edge</option> </select> </label> <label class="planting-yield__select" data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Care mode</span> <select data-yield-care data-astro-cid-cmvq6pel> <option value="rain" data-astro-cid-cmvq6pel>Rain-season start</option> <option value="hand" data-astro-cid-cmvq6pel>Hand-water establishment</option> <option value="container" data-astro-cid-cmvq6pel>Container watch</option> </select> </label> </div> <article class="planting-yield__output" aria-live="polite" data-astro-cid-cmvq6pel> <div class="planting-yield__output-head" data-astro-cid-cmvq6pel> <div data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Plan</span> <h3 data-yield-name data-astro-cid-cmvq6pel>', '</h3> </div> <span class="planting-yield__scale" data-yield-scale data-astro-cid-cmvq6pel>', '</span> </div> <p class="planting-yield__read" data-yield-read data-astro-cid-cmvq6pel>', '</p> <p class="planting-yield__value" data-yield-value data-astro-cid-cmvq6pel>', '</p> <div class="planting-yield__columns" data-astro-cid-cmvq6pel> <div data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Plant mix</span> <ul class="planting-yield__mix" data-yield-mix data-astro-cid-cmvq6pel> ', ' </ul> </div> <div data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Next 90 days</span> <ol class="planting-yield__moves" data-yield-moves data-astro-cid-cmvq6pel> ', ' </ol> </div> </div> <div class="planting-yield__fit" data-astro-cid-cmvq6pel> <span class="planting-yield__label" data-astro-cid-cmvq6pel>Fit check</span> <p data-yield-fit data-astro-cid-cmvq6pel>', '</p> </div> </article> </div> <div class="planting-yield__footer" data-astro-cid-cmvq6pel> <span data-astro-cid-cmvq6pel>', '</span> <a href="/nature-yield.json" data-astro-cid-cmvq6pel>/nature-yield.json</a> </div> </section> <script>(function(){', `
  (function () {
    const root = document.currentScript?.closest('[data-planting-yield]') ||
      document.querySelector('[data-planting-yield]');
    if (!root) return;

    const siteMap = new Map(sites.map(function (site) { return [site.slug, site]; }));
    const buttons = Array.from(root.querySelectorAll('[data-yield-site]'));
    const sun = root.querySelector('[data-yield-sun]');
    const care = root.querySelector('[data-yield-care]');
    const name = root.querySelector('[data-yield-name]');
    const scale = root.querySelector('[data-yield-scale]');
    const read = root.querySelector('[data-yield-read]');
    const value = root.querySelector('[data-yield-value]');
    const mix = root.querySelector('[data-yield-mix]');
    const moves = root.querySelector('[data-yield-moves]');
    const fit = root.querySelector('[data-yield-fit]');

    function escapeHtml(input) {
      return String(input).replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        }[char];
      });
    }

    function fitNote(site) {
      const sunValue = sun ? sun.value : 'full';
      const careValue = care ? care.value : 'rain';
      const notes = [site.water];

      if (sunValue === 'part') {
        notes.push('Part-day sun favors buckwheat, coyote brush, and lemonade berry; expect fewer sunflower blooms.');
      } else if (sunValue === 'shade') {
        notes.push('Bright shade is a constraint: use the plan as a grammar, then reduce the hottest bloom plants.');
      } else {
        notes.push('Full sun supports the complete dune-to-scrub palette when drainage is fast.');
      }

      if (careValue === 'hand') {
        notes.push('Water deeply and infrequently so roots chase depth instead of surface sprinklers.');
      } else if (careValue === 'container') {
        notes.push('Containers need sharper drainage, mineral top-dress, and closer dry-down checks.');
      } else {
        notes.push('Rain-season starts create the best low-effort establishment window.');
      }

      return notes.join(' ');
    }

    function render(slug) {
      const site = siteMap.get(slug) || sites[0];
      if (!site) return;

      buttons.forEach(function (button) {
        button.classList.toggle('is-active', button.getAttribute('data-yield-site') === site.slug);
      });

      if (name) name.textContent = site.name;
      if (scale) scale.textContent = site.scale;
      if (read) read.textContent = site.siteRead;
      if (value) value.textContent = site.value;
      if (mix) {
        mix.innerHTML = site.mix.map(function (item) {
          return '<li><strong>' + escapeHtml(item.name) + '</strong><span>' +
            escapeHtml(item.units) + ' · ' + escapeHtml(item.role) + '</span></li>';
        }).join('');
      }
      if (moves) {
        moves.innerHTML = site.nextMoves.map(function (move) {
          return '<li>' + escapeHtml(move) + '</li>';
        }).join('');
      }
      if (fit) fit.textContent = fitNote(site);
      root.setAttribute('data-active-site', site.slug);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        render(button.getAttribute('data-yield-site'));
      });
    });

    [sun, care].forEach(function (control) {
      if (!control) return;
      control.addEventListener('change', function () {
        render(root.getAttribute('data-active-site') || sites[0].slug);
      });
    });

    render(sites[0]?.slug);
  })();
})();<\/script>`])), maybeRenderHead(), addAttribute(`planting-yield planting-yield--${context}`, "class"), PLANTING_VALUE_SYSTEM.sourceBlock, PLANTING_VALUE_SYSTEM.yieldDefinition, PLANTING_VALUE_SYSTEM.metrics.map((metric) => renderTemplate`<div data-astro-cid-cmvq6pel> <dt data-astro-cid-cmvq6pel>${metric.label}</dt> <dd data-astro-cid-cmvq6pel>${metric.signal}</dd> </div>`), sites.map((site, index) => renderTemplate`<button type="button"${addAttribute(["planting-yield__tab", { "is-active": index === 0 }], "class:list")}${addAttribute(site.slug, "data-yield-site")} data-astro-cid-cmvq6pel> ${site.name} </button>`), defaultSite.name, defaultSite.scale, defaultSite.siteRead, defaultSite.value, defaultSite.mix.map((item) => renderTemplate`<li data-astro-cid-cmvq6pel> <strong data-astro-cid-cmvq6pel>${item.name}</strong> <span data-astro-cid-cmvq6pel>${item.units} · ${item.role}</span> </li>`), defaultSite.nextMoves.map((move) => renderTemplate`<li data-astro-cid-cmvq6pel>${move}</li>`), defaultSite.water, PLANTING_VALUE_SYSTEM.operatingPrinciple, defineScriptVars({ sites }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/NativePlantingYield.astro", void 0);

export { $$NativePlantingYield as $ };
