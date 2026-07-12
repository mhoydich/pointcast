import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute, u as unescapeHTML } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$MicroAppShell } from './MicroAppShell_CtL0WlkJ.mjs';
import { Z as ZEN_CAT_GENESIS_COLLECTIBLES, a as ZEN_CAT_WORLD_COLLECTIBLES } from './zen-cat-collectibles_BLrr4dOT.mjs';
import { g as getPointcastApp } from './pointcast-apps_DuRB6sfu.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a, _b;
const $$CatPassport = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("cat-passport");
  const title = app.name;
  const description = app.description;
  const heroImages = [0, 2, 5, 8, 10, 14].map((index) => ZEN_CAT_GENESIS_COLLECTIBLES[index]).filter(Boolean);
  const countries = Array.from(new Set(ZEN_CAT_WORLD_COLLECTIBLES.map((item) => item.country))).sort((a, b) => a.localeCompare(b));
  const gems = Array.from(new Set(ZEN_CAT_WORLD_COLLECTIBLES.map((item) => item.gem))).sort((a, b) => a.localeCompare(b));
  const passportData = ZEN_CAT_WORLD_COLLECTIBLES.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    city: item.city,
    country: item.country,
    landmark: item.landmark,
    cat: item.cat,
    gem: item.gem,
    mood: item.mood,
    rarity: item.rarity,
    palette: item.palette
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/cat-passport",
    name: app.name,
    description,
    url: app.url,
    applicationCategory: "TravelApplication",
    operatingSystem: "Web"
  };
  return renderTemplate(_b || (_b = __template(["", " <script>\n  (() => {\n    const root = document.querySelector('[data-cat-passport]');\n    const dataEl = document.querySelector('#cat-passport-data');\n    if (!root || !dataEl) return;\n    const routes = JSON.parse(dataEl.textContent || '[]');\n    const storageKey = 'pc:cat-passport:stamps';\n    let selected = routes[0];\n    const els = {\n      country: root.querySelector('[data-filter-country]'),\n      gem: root.querySelector('[data-filter-gem]'),\n      count: root.querySelector('[data-route-count]'),\n      art: root.querySelector('[data-passport-art]'),\n      number: root.querySelector('[data-passport-number]'),\n      kicker: root.querySelector('[data-passport-kicker]'),\n      title: root.querySelector('[data-passport-title]'),\n      detail: root.querySelector('[data-passport-detail]'),\n      city: root.querySelector('[data-passport-city]'),\n      mood: root.querySelector('[data-passport-mood]'),\n      rarity: root.querySelector('[data-passport-rarity]'),\n      stampCount: root.querySelector('[data-stamp-count]'),\n      stampList: root.querySelector('[data-stamp-list]'),\n    };\n    const stamps = () => {\n      try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }\n    };\n    const saveStamps = (items) => localStorage.setItem(storageKey, JSON.stringify(items.slice(-50)));\n    const filtered = () => routes.filter((route) =>\n      (els.country.value === 'all' || route.country === els.country.value) &&\n      (els.gem.value === 'all' || route.gem === els.gem.value)\n    );\n    const renderRoute = (route) => {\n      selected = route || routes[0];\n      els.art.style.setProperty('--ground', selected.palette.ground);\n      els.art.style.setProperty('--accent', selected.palette.accent);\n      els.art.style.setProperty('--ink', selected.palette.ink);\n      els.number.textContent = `No. ${String(selected.number).padStart(2, '0')}`;\n      els.kicker.textContent = `${selected.country} · ${selected.gem}`;\n      els.title.textContent = selected.title;\n      els.detail.textContent = `${selected.cat} near ${selected.landmark}.`;\n      els.city.textContent = selected.city;\n      els.mood.textContent = selected.mood;\n      els.rarity.textContent = selected.rarity;\n    };\n    const renderCount = () => {\n      const pool = filtered();\n      els.count.textContent = `${pool.length} possible route${pool.length === 1 ? '' : 's'}.`;\n      return pool;\n    };\n    const renderStamps = () => {\n      const items = stamps();\n      els.stampCount.textContent = String(items.length);\n      els.stampList.innerHTML = items.slice().reverse().map((item) =>\n        `<li><strong>${item.title}</strong><span>${item.city}, ${item.country} · ${item.gem}</span></li>`\n      ).join('');\n    };\n    els.country.addEventListener('change', renderCount);\n    els.gem.addEventListener('change', renderCount);\n    root.querySelector('[data-find-route]')?.addEventListener('click', () => {\n      const pool = renderCount();\n      const index = Math.floor((Date.now() / 1709) % Math.max(pool.length, 1));\n      renderRoute(pool[index] || routes[0]);\n    });\n    root.querySelector('[data-stamp-route]')?.addEventListener('click', () => {\n      const items = stamps().filter((item) => item.id !== selected.id);\n      items.push({ ...selected, stampedAt: new Date().toLocaleDateString() });\n      saveStamps(items);\n      renderStamps();\n    });\n    root.querySelector('[data-clear-stamps]')?.addEventListener('click', () => {\n      localStorage.removeItem(storageKey);\n      renderStamps();\n    });\n    renderCount();\n    renderRoute(selected);\n    renderStamps();\n  })();\n<\/script>"], ["", " <script>\n  (() => {\n    const root = document.querySelector('[data-cat-passport]');\n    const dataEl = document.querySelector('#cat-passport-data');\n    if (!root || !dataEl) return;\n    const routes = JSON.parse(dataEl.textContent || '[]');\n    const storageKey = 'pc:cat-passport:stamps';\n    let selected = routes[0];\n    const els = {\n      country: root.querySelector('[data-filter-country]'),\n      gem: root.querySelector('[data-filter-gem]'),\n      count: root.querySelector('[data-route-count]'),\n      art: root.querySelector('[data-passport-art]'),\n      number: root.querySelector('[data-passport-number]'),\n      kicker: root.querySelector('[data-passport-kicker]'),\n      title: root.querySelector('[data-passport-title]'),\n      detail: root.querySelector('[data-passport-detail]'),\n      city: root.querySelector('[data-passport-city]'),\n      mood: root.querySelector('[data-passport-mood]'),\n      rarity: root.querySelector('[data-passport-rarity]'),\n      stampCount: root.querySelector('[data-stamp-count]'),\n      stampList: root.querySelector('[data-stamp-list]'),\n    };\n    const stamps = () => {\n      try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }\n    };\n    const saveStamps = (items) => localStorage.setItem(storageKey, JSON.stringify(items.slice(-50)));\n    const filtered = () => routes.filter((route) =>\n      (els.country.value === 'all' || route.country === els.country.value) &&\n      (els.gem.value === 'all' || route.gem === els.gem.value)\n    );\n    const renderRoute = (route) => {\n      selected = route || routes[0];\n      els.art.style.setProperty('--ground', selected.palette.ground);\n      els.art.style.setProperty('--accent', selected.palette.accent);\n      els.art.style.setProperty('--ink', selected.palette.ink);\n      els.number.textContent = \\`No. \\${String(selected.number).padStart(2, '0')}\\`;\n      els.kicker.textContent = \\`\\${selected.country} · \\${selected.gem}\\`;\n      els.title.textContent = selected.title;\n      els.detail.textContent = \\`\\${selected.cat} near \\${selected.landmark}.\\`;\n      els.city.textContent = selected.city;\n      els.mood.textContent = selected.mood;\n      els.rarity.textContent = selected.rarity;\n    };\n    const renderCount = () => {\n      const pool = filtered();\n      els.count.textContent = \\`\\${pool.length} possible route\\${pool.length === 1 ? '' : 's'}.\\`;\n      return pool;\n    };\n    const renderStamps = () => {\n      const items = stamps();\n      els.stampCount.textContent = String(items.length);\n      els.stampList.innerHTML = items.slice().reverse().map((item) =>\n        \\`<li><strong>\\${item.title}</strong><span>\\${item.city}, \\${item.country} · \\${item.gem}</span></li>\\`\n      ).join('');\n    };\n    els.country.addEventListener('change', renderCount);\n    els.gem.addEventListener('change', renderCount);\n    root.querySelector('[data-find-route]')?.addEventListener('click', () => {\n      const pool = renderCount();\n      const index = Math.floor((Date.now() / 1709) % Math.max(pool.length, 1));\n      renderRoute(pool[index] || routes[0]);\n    });\n    root.querySelector('[data-stamp-route]')?.addEventListener('click', () => {\n      const items = stamps().filter((item) => item.id !== selected.id);\n      items.push({ ...selected, stampedAt: new Date().toLocaleDateString() });\n      saveStamps(items);\n      renderStamps();\n    });\n    root.querySelector('[data-clear-stamps]')?.addEventListener('click', () => {\n      localStorage.removeItem(storageKey);\n      renderStamps();\n    });\n    renderCount();\n    renderRoute(selected);\n    renderStamps();\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-izpcalcg": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", ' <script id="cat-passport-data" type="application/json">', "<\/script> "])), renderComponent($$result2, "MicroAppShell", $$MicroAppShell, { "app": app, "headline": "Stamp a luxury cat route across the world.", "dek": "A calm passport for the Zen Cat world series: landmarks, gemstones, city moods, and a local stamp shelf for future mintable art cards.", "images": heroImages.map((item) => ({
    src: item.imageUrl,
    alt: `${item.title} Zen Cat genesis collectible`
  })), "stats": [
    { label: "World Cards", value: ZEN_CAT_WORLD_COLLECTIBLES.length },
    { label: "Countries", value: countries.length },
    { label: "Gems", value: gems.length },
    { label: "Mode", value: "passport" }
  ], "links": [
    { href: "/zen-cats", label: "Garden" },
    { href: "/zen-cats.json", label: "JSON" }
  ], "data-astro-cid-izpcalcg": true }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<section class="app-section passport" data-cat-passport data-astro-cid-izpcalcg> <div class="tool-grid" data-astro-cid-izpcalcg> <div class="tool-panel" data-astro-cid-izpcalcg> <h2 data-astro-cid-izpcalcg>Route Finder</h2> <div class="field-stack" data-astro-cid-izpcalcg> <label data-astro-cid-izpcalcg>
Country
<select data-filter-country data-astro-cid-izpcalcg> <option value="all" data-astro-cid-izpcalcg>All countries</option> ${countries.map((country) => renderTemplate`<option${addAttribute(country, "value")} data-astro-cid-izpcalcg>${country}</option>`)} </select> </label> <label data-astro-cid-izpcalcg>
Gem
<select data-filter-gem data-astro-cid-izpcalcg> <option value="all" data-astro-cid-izpcalcg>All gems</option> ${gems.map((gem) => renderTemplate`<option${addAttribute(gem, "value")} data-astro-cid-izpcalcg>${gem}</option>`)} </select> </label> </div> <div class="button-row" data-astro-cid-izpcalcg> <button type="button" data-find-route data-astro-cid-izpcalcg>Find route</button> <button type="button" data-stamp-route data-astro-cid-izpcalcg>Stamp passport</button> </div> <p class="mono-note" data-route-count data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES.length} possible routes.</p> </div> <article class="passport-card" data-passport-card data-astro-cid-izpcalcg> <div class="passport-card__art" data-passport-art${addAttribute(`--ground:${ZEN_CAT_WORLD_COLLECTIBLES[0].palette.ground};--accent:${ZEN_CAT_WORLD_COLLECTIBLES[0].palette.accent};--ink:${ZEN_CAT_WORLD_COLLECTIBLES[0].palette.ink};`, "style")} data-astro-cid-izpcalcg> <span data-passport-number data-astro-cid-izpcalcg>No. ${String(ZEN_CAT_WORLD_COLLECTIBLES[0].number).padStart(2, "0")}</span> </div> <div class="passport-card__copy" data-astro-cid-izpcalcg> <p class="mono-note" data-passport-kicker data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES[0].country} · ${ZEN_CAT_WORLD_COLLECTIBLES[0].gem}</p> <h2 data-passport-title data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES[0].title}</h2> <p data-passport-detail data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES[0].cat} near ${ZEN_CAT_WORLD_COLLECTIBLES[0].landmark}.</p> <dl data-astro-cid-izpcalcg> <div data-astro-cid-izpcalcg><dt data-astro-cid-izpcalcg>City</dt><dd data-passport-city data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES[0].city}</dd></div> <div data-astro-cid-izpcalcg><dt data-astro-cid-izpcalcg>Mood</dt><dd data-passport-mood data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES[0].mood}</dd></div> <div data-astro-cid-izpcalcg><dt data-astro-cid-izpcalcg>Rarity</dt><dd data-passport-rarity data-astro-cid-izpcalcg>${ZEN_CAT_WORLD_COLLECTIBLES[0].rarity}</dd></div> </dl> </div> </article> </div> <section class="stamp-ledger" aria-labelledby="stamp-title" data-astro-cid-izpcalcg> <div data-astro-cid-izpcalcg> <h2 id="stamp-title" data-astro-cid-izpcalcg>Passport Shelf</h2> <p class="mono-note" data-astro-cid-izpcalcg><span data-stamp-count data-astro-cid-izpcalcg>0</span> stamps collected locally.</p> </div> <button type="button" data-clear-stamps data-astro-cid-izpcalcg>Clear stamps</button> <ol class="stamp-list" data-stamp-list data-astro-cid-izpcalcg></ol> </section> </section> ` }), unescapeHTML(JSON.stringify(passportData))) }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cat-passport.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cat-passport.astro";
const $$url = "/cat-passport";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$CatPassport,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
