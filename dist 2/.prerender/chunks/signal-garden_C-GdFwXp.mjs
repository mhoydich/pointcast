import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute, u as unescapeHTML } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$MicroAppShell } from './MicroAppShell_CtL0WlkJ.mjs';
import { M as MORNING_OCEAN_TOKENS } from './morning-ocean__lLVjAWo.mjs';
import { Z as ZEN_CAT_GENESIS_COLLECTIBLES } from './zen-cat-collectibles_BLrr4dOT.mjs';
import { g as getPointcastApp } from './pointcast-apps_DuRB6sfu.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a, _b;
const $$SignalGarden = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("signal-garden");
  const title = app.name;
  const description = app.description;
  const sourceData = [
    {
      id: "mint",
      label: "Mint Receipts",
      key: "pc:mint-studio:receipts",
      href: "/mint-studio",
      type: "sprout",
      color: "#bf6f54",
      empty: "Draft a first mint receipt."
    },
    {
      id: "harbor",
      label: "Harbor Watch",
      key: "pc:harbor-log:watchlist",
      href: "/harbor-log",
      type: "sprout",
      color: "#3f7681",
      empty: "Watch one morning vessel."
    },
    {
      id: "passport",
      label: "Cat Passport",
      key: "pc:cat-passport:stamps",
      href: "/cat-passport",
      type: "leaf",
      color: "#b84f55",
      empty: "Stamp one cat route."
    },
    {
      id: "gallery",
      label: "Gallery Shows",
      key: "pc:gallery-wall:shows",
      href: "/gallery-wall",
      type: "flower",
      color: "#875c9e",
      empty: "Curate one wall."
    },
    {
      id: "ritual",
      label: "Ritual Marks",
      key: "pc:ritual-clock:marks",
      href: "/ritual-clock",
      type: "flower",
      color: "#c38b35",
      empty: "Mark the day."
    },
    {
      id: "exchange",
      label: "Exchange Notes",
      key: "pc:exchange-table:wishes",
      href: "/exchange-table",
      type: "leaf",
      color: "#7b8b53",
      empty: "Write one private intent."
    },
    {
      id: "provenance",
      label: "Provenance Proofs",
      key: "pc:provenance-ledger:exports",
      href: "/provenance-ledger",
      type: "stone",
      color: "#586c8c",
      empty: "Scan the cabinet."
    },
    {
      id: "atlas",
      label: "World Atlas",
      key: "pc:world-atlas:stamps",
      href: "/world-atlas",
      type: "vine",
      color: "#267f78",
      empty: "Stamp a world route."
    },
    {
      id: "sats",
      label: "Sats Path",
      key: "pc:sats-path:checks",
      href: "/sats-path",
      type: "stone",
      color: "#c39b39",
      empty: "Mark one checkpoint."
    },
    {
      id: "ocean",
      label: "Morning Ocean",
      key: "pc:morning-ocean:collection",
      href: "/morning-ocean",
      type: "sprout",
      color: "#6b8e99",
      empty: "Collect one ocean card."
    },
    {
      id: "cats",
      label: "Zen Cats",
      key: "pc:zen-cats:collection",
      href: "/zen-cats",
      type: "flower",
      color: "#d28c7a",
      empty: "Collect a daily cat."
    },
    {
      id: "manual",
      label: "Garden Plants",
      key: "pc:signal-garden:plants",
      href: "/signal-garden",
      type: "flower",
      color: "#2f8f5f",
      empty: "Plant today."
    }
  ];
  const heroImages = [
    ZEN_CAT_GENESIS_COLLECTIBLES[7],
    ZEN_CAT_GENESIS_COLLECTIBLES[1],
    MORNING_OCEAN_TOKENS[6],
    ZEN_CAT_GENESIS_COLLECTIBLES[4],
    MORNING_OCEAN_TOKENS[10],
    ZEN_CAT_GENESIS_COLLECTIBLES[12]
  ].map((item) => ({
    src: item.imageUrl,
    alt: `${item.title} collectible signal`
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/signal-garden",
    name: app.name,
    description,
    url: app.url,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web"
  };
  return renderTemplate(_b || (_b = __template(["", " <script>\n  (() => {\n    const root = document.querySelector('[data-signal-garden]');\n    const dataEl = document.querySelector('#signal-sources');\n    if (!root || !dataEl) return;\n\n    const sources = JSON.parse(dataEl.textContent || '[]');\n    const plantKey = 'pc:signal-garden:plants';\n    const NS = 'http://www.w3.org/2000/svg';\n    const layer = root.querySelector('[data-garden-layer]');\n    const emptySeeds = root.querySelector('[data-empty-seeds]');\n\n    const readArray = (key) => {\n      try {\n        const parsed = JSON.parse(localStorage.getItem(key) || '[]');\n        if (Array.isArray(parsed)) return parsed;\n        if (parsed && typeof parsed === 'object') return Object.values(parsed);\n      } catch {}\n      return [];\n    };\n    const savePlants = (items) => localStorage.setItem(plantKey, JSON.stringify(items.slice(-80)));\n    const plantLabel = (item, fallback) => {\n      if (!item || typeof item !== 'object') return fallback;\n      return item.title || item.name || item.alias || item.subject || item.label || item.id || fallback;\n    };\n    const seedFor = (text) => {\n      let seed = 0;\n      for (let i = 0; i < text.length; i++) seed = (seed * 33 + text.charCodeAt(i)) >>> 0;\n      return seed || 1;\n    };\n    const rand = (seed) => {\n      let next = seed >>> 0;\n      return () => {\n        next = (next * 1664525 + 1013904223) >>> 0;\n        return next / 4294967296;\n      };\n    };\n    const svgEl = (tag, attrs = {}) => {\n      const el = document.createElementNS(NS, tag);\n      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));\n      return el;\n    };\n    const drawPlant = (plant) => {\n      const group = svgEl('g', { transform: `translate(${plant.x} ${plant.y})`, opacity: 0.92 });\n      const height = 34 + plant.growth * 10;\n      if (plant.type === 'stone') {\n        group.appendChild(svgEl('ellipse', { cx: 0, cy: 0, rx: 18 + plant.growth * 3, ry: 10 + plant.growth, fill: plant.color, opacity: 0.7 }));\n        group.appendChild(svgEl('ellipse', { cx: -5, cy: -3, rx: 5, ry: 2.5, fill: '#fffaf0', opacity: 0.44 }));\n      } else if (plant.type === 'vine') {\n        group.appendChild(svgEl('path', { d: `M-28 0 C-10 -${height}, 12 -${height * 0.4}, 28 -${height}`, fill: 'none', stroke: plant.color, 'stroke-width': 4, 'stroke-linecap': 'round' }));\n        group.appendChild(svgEl('ellipse', { cx: -10, cy: -height * 0.62, rx: 9, ry: 5, fill: plant.color, transform: 'rotate(-28)' }));\n        group.appendChild(svgEl('ellipse', { cx: 12, cy: -height * 0.48, rx: 9, ry: 5, fill: plant.color, transform: 'rotate(24)' }));\n      } else {\n        group.appendChild(svgEl('path', { d: `M0 0 C-4 -${height * 0.36}, 2 -${height * 0.7}, 0 -${height}`, fill: 'none', stroke: '#345b45', 'stroke-width': 4, 'stroke-linecap': 'round' }));\n        group.appendChild(svgEl('ellipse', { cx: -11, cy: -height * 0.46, rx: 13, ry: 6, fill: plant.color, opacity: 0.82, transform: 'rotate(-24)' }));\n        group.appendChild(svgEl('ellipse', { cx: 12, cy: -height * 0.62, rx: 12, ry: 6, fill: plant.color, opacity: 0.74, transform: 'rotate(26)' }));\n        if (plant.type === 'flower') {\n          for (let i = 0; i < 6; i++) {\n            const angle = (Math.PI * 2 * i) / 6;\n            group.appendChild(svgEl('ellipse', {\n              cx: Math.cos(angle) * 10,\n              cy: -height + Math.sin(angle) * 10,\n              rx: 6,\n              ry: 10,\n              fill: plant.color,\n              opacity: 0.78,\n              transform: `rotate(${i * 60} ${Math.cos(angle) * 10} ${-height + Math.sin(angle) * 10})`,\n            }));\n          }\n          group.appendChild(svgEl('circle', { cx: 0, cy: -height, r: 5, fill: '#fff1b8' }));\n        }\n      }\n      return group;\n    };\n    const gardenItems = () => {\n      const items = [];\n      sources.forEach((source) => {\n        const receipts = readArray(source.key);\n        root.querySelector(`[data-source-count=\"${source.id}\"]`).textContent = String(receipts.length);\n        receipts.slice(-10).forEach((receipt, index) => {\n          const random = rand(seedFor(`${source.id}:${index}:${plantLabel(receipt, source.label)}`));\n          items.push({\n            id: `${source.id}-${index}`,\n            source: source.id,\n            label: plantLabel(receipt, source.label),\n            type: source.type,\n            color: source.color,\n            growth: Math.min(6, Math.max(1, Math.ceil(receipts.length / 2))),\n            x: 90 + random() * 820,\n            y: 270 + random() * 230,\n          });\n        });\n      });\n      return items;\n    };\n    const render = () => {\n      const plants = gardenItems();\n      const total = plants.length;\n      layer.replaceChildren(...plants.map(drawPlant));\n      emptySeeds.style.display = total ? 'none' : '';\n      root.querySelector('[data-garden-total]').textContent = String(total);\n      root.querySelector('[data-garden-title]').textContent = total ? 'Signals taking root' : 'Quiet seed bed';\n      root.querySelector('[data-reading-title]').textContent = total ? `${total} signal${total === 1 ? '' : 's'} growing` : 'Nothing planted yet.';\n      root.querySelector('[data-reading-copy]').textContent = total\n        ? 'Your local activity is visible as an ambient garden. Nothing leaves this browser.'\n        : 'Open a source app or plant today. The garden stays in this browser.';\n    };\n    root.querySelector('[data-refresh-garden]')?.addEventListener('click', render);\n    root.querySelector('[data-plant-today]')?.addEventListener('click', () => {\n      const plants = readArray(plantKey);\n      plants.push({\n        id: `plant-${Date.now()}`,\n        source: 'manual',\n        label: 'Manual garden plant',\n        plantedAt: new Date().toISOString(),\n        color: '#2f8f5f',\n        growth: 1,\n      });\n      savePlants(plants);\n      render();\n    });\n    root.querySelector('[data-clear-garden]')?.addEventListener('click', () => {\n      localStorage.removeItem(plantKey);\n      render();\n    });\n    render();\n  })();\n<\/script>"], ["", " <script>\n  (() => {\n    const root = document.querySelector('[data-signal-garden]');\n    const dataEl = document.querySelector('#signal-sources');\n    if (!root || !dataEl) return;\n\n    const sources = JSON.parse(dataEl.textContent || '[]');\n    const plantKey = 'pc:signal-garden:plants';\n    const NS = 'http://www.w3.org/2000/svg';\n    const layer = root.querySelector('[data-garden-layer]');\n    const emptySeeds = root.querySelector('[data-empty-seeds]');\n\n    const readArray = (key) => {\n      try {\n        const parsed = JSON.parse(localStorage.getItem(key) || '[]');\n        if (Array.isArray(parsed)) return parsed;\n        if (parsed && typeof parsed === 'object') return Object.values(parsed);\n      } catch {}\n      return [];\n    };\n    const savePlants = (items) => localStorage.setItem(plantKey, JSON.stringify(items.slice(-80)));\n    const plantLabel = (item, fallback) => {\n      if (!item || typeof item !== 'object') return fallback;\n      return item.title || item.name || item.alias || item.subject || item.label || item.id || fallback;\n    };\n    const seedFor = (text) => {\n      let seed = 0;\n      for (let i = 0; i < text.length; i++) seed = (seed * 33 + text.charCodeAt(i)) >>> 0;\n      return seed || 1;\n    };\n    const rand = (seed) => {\n      let next = seed >>> 0;\n      return () => {\n        next = (next * 1664525 + 1013904223) >>> 0;\n        return next / 4294967296;\n      };\n    };\n    const svgEl = (tag, attrs = {}) => {\n      const el = document.createElementNS(NS, tag);\n      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));\n      return el;\n    };\n    const drawPlant = (plant) => {\n      const group = svgEl('g', { transform: \\`translate(\\${plant.x} \\${plant.y})\\`, opacity: 0.92 });\n      const height = 34 + plant.growth * 10;\n      if (plant.type === 'stone') {\n        group.appendChild(svgEl('ellipse', { cx: 0, cy: 0, rx: 18 + plant.growth * 3, ry: 10 + plant.growth, fill: plant.color, opacity: 0.7 }));\n        group.appendChild(svgEl('ellipse', { cx: -5, cy: -3, rx: 5, ry: 2.5, fill: '#fffaf0', opacity: 0.44 }));\n      } else if (plant.type === 'vine') {\n        group.appendChild(svgEl('path', { d: \\`M-28 0 C-10 -\\${height}, 12 -\\${height * 0.4}, 28 -\\${height}\\`, fill: 'none', stroke: plant.color, 'stroke-width': 4, 'stroke-linecap': 'round' }));\n        group.appendChild(svgEl('ellipse', { cx: -10, cy: -height * 0.62, rx: 9, ry: 5, fill: plant.color, transform: 'rotate(-28)' }));\n        group.appendChild(svgEl('ellipse', { cx: 12, cy: -height * 0.48, rx: 9, ry: 5, fill: plant.color, transform: 'rotate(24)' }));\n      } else {\n        group.appendChild(svgEl('path', { d: \\`M0 0 C-4 -\\${height * 0.36}, 2 -\\${height * 0.7}, 0 -\\${height}\\`, fill: 'none', stroke: '#345b45', 'stroke-width': 4, 'stroke-linecap': 'round' }));\n        group.appendChild(svgEl('ellipse', { cx: -11, cy: -height * 0.46, rx: 13, ry: 6, fill: plant.color, opacity: 0.82, transform: 'rotate(-24)' }));\n        group.appendChild(svgEl('ellipse', { cx: 12, cy: -height * 0.62, rx: 12, ry: 6, fill: plant.color, opacity: 0.74, transform: 'rotate(26)' }));\n        if (plant.type === 'flower') {\n          for (let i = 0; i < 6; i++) {\n            const angle = (Math.PI * 2 * i) / 6;\n            group.appendChild(svgEl('ellipse', {\n              cx: Math.cos(angle) * 10,\n              cy: -height + Math.sin(angle) * 10,\n              rx: 6,\n              ry: 10,\n              fill: plant.color,\n              opacity: 0.78,\n              transform: \\`rotate(\\${i * 60} \\${Math.cos(angle) * 10} \\${-height + Math.sin(angle) * 10})\\`,\n            }));\n          }\n          group.appendChild(svgEl('circle', { cx: 0, cy: -height, r: 5, fill: '#fff1b8' }));\n        }\n      }\n      return group;\n    };\n    const gardenItems = () => {\n      const items = [];\n      sources.forEach((source) => {\n        const receipts = readArray(source.key);\n        root.querySelector(\\`[data-source-count=\"\\${source.id}\"]\\`).textContent = String(receipts.length);\n        receipts.slice(-10).forEach((receipt, index) => {\n          const random = rand(seedFor(\\`\\${source.id}:\\${index}:\\${plantLabel(receipt, source.label)}\\`));\n          items.push({\n            id: \\`\\${source.id}-\\${index}\\`,\n            source: source.id,\n            label: plantLabel(receipt, source.label),\n            type: source.type,\n            color: source.color,\n            growth: Math.min(6, Math.max(1, Math.ceil(receipts.length / 2))),\n            x: 90 + random() * 820,\n            y: 270 + random() * 230,\n          });\n        });\n      });\n      return items;\n    };\n    const render = () => {\n      const plants = gardenItems();\n      const total = plants.length;\n      layer.replaceChildren(...plants.map(drawPlant));\n      emptySeeds.style.display = total ? 'none' : '';\n      root.querySelector('[data-garden-total]').textContent = String(total);\n      root.querySelector('[data-garden-title]').textContent = total ? 'Signals taking root' : 'Quiet seed bed';\n      root.querySelector('[data-reading-title]').textContent = total ? \\`\\${total} signal\\${total === 1 ? '' : 's'} growing\\` : 'Nothing planted yet.';\n      root.querySelector('[data-reading-copy]').textContent = total\n        ? 'Your local activity is visible as an ambient garden. Nothing leaves this browser.'\n        : 'Open a source app or plant today. The garden stays in this browser.';\n    };\n    root.querySelector('[data-refresh-garden]')?.addEventListener('click', render);\n    root.querySelector('[data-plant-today]')?.addEventListener('click', () => {\n      const plants = readArray(plantKey);\n      plants.push({\n        id: \\`plant-\\${Date.now()}\\`,\n        source: 'manual',\n        label: 'Manual garden plant',\n        plantedAt: new Date().toISOString(),\n        color: '#2f8f5f',\n        growth: 1,\n      });\n      savePlants(plants);\n      render();\n    });\n    root.querySelector('[data-clear-garden]')?.addEventListener('click', () => {\n      localStorage.removeItem(plantKey);\n      render();\n    });\n    render();\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-fcj64gln": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", ' <script id="signal-sources" type="application/json">', "<\/script> "])), renderComponent($$result2, "MicroAppShell", $$MicroAppShell, { "app": app, "headline": "Let the collection grow into a garden.", "dek": "Signal Garden reads your local PointCast activity and turns it into an ambient planting bed. Receipts become sprouts, rituals bloom, atlas stamps trail into vines, and proof sheets settle as stones.", "images": heroImages, "stats": [
    { label: "Sources", value: sourceData.length },
    { label: "Storage", value: "local" },
    { label: "Garden", value: "live" },
    { label: "Sync", value: "none" }
  ], "links": [
    { href: "/cabinet", label: "Cabinet" },
    { href: "/observatory", label: "Sky" },
    { href: "/apps", label: "Apps" }
  ], "data-astro-cid-fcj64gln": true }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<section class="app-section signal-garden" data-signal-garden data-astro-cid-fcj64gln> <div class="garden-layout" data-astro-cid-fcj64gln> <section class="garden-bed" aria-label="Local signal garden" data-astro-cid-fcj64gln> <div class="garden-bed__top" data-astro-cid-fcj64gln> <div data-astro-cid-fcj64gln> <p class="mono-note" data-astro-cid-fcj64gln>Local Growth</p> <h2 data-garden-title data-astro-cid-fcj64gln>Quiet seed bed</h2> </div> <div class="growth-meter" data-astro-cid-fcj64gln> <span data-astro-cid-fcj64gln>Signals</span> <strong data-garden-total data-astro-cid-fcj64gln>0</strong> </div> </div> <svg class="garden-canvas" viewBox="0 0 1000 600" role="img" aria-labelledby="garden-title garden-desc" data-astro-cid-fcj64gln> <title id="garden-title">Signal Garden generated from local PointCast receipts</title> <desc id="garden-desc" data-astro-cid-fcj64gln>A local-only garden where saved PointCast activity appears as sprouts, flowers, vines, leaves, and stones.</desc> <defs data-astro-cid-fcj64gln> <linearGradient id="garden-ground" x1="0" x2="1" y1="0" y2="1" data-astro-cid-fcj64gln> <stop offset="0%" stop-color="#f8f3e6" data-astro-cid-fcj64gln></stop> <stop offset="58%" stop-color="#dbe7d9" data-astro-cid-fcj64gln></stop> <stop offset="100%" stop-color="#a9c1ae" data-astro-cid-fcj64gln></stop> </linearGradient> <filter id="garden-soften" data-astro-cid-fcj64gln> <feGaussianBlur stdDeviation="0.6" data-astro-cid-fcj64gln></feGaussianBlur> </filter> </defs> <rect width="1000" height="600" fill="url(#garden-ground)" data-astro-cid-fcj64gln></rect> <path d="M40 472 C210 410 336 454 506 428 C680 400 764 338 958 380" fill="none" stroke="#345b45" stroke-width="2" opacity="0.16" data-astro-cid-fcj64gln></path> <path d="M88 516 C244 458 420 506 596 470 C748 438 848 448 950 490" fill="none" stroke="#8a6a38" stroke-width="2" opacity="0.18" data-astro-cid-fcj64gln></path> <g data-empty-seeds data-astro-cid-fcj64gln> <circle cx="312" cy="390" r="16" fill="#2f8f5f" opacity="0.28" data-astro-cid-fcj64gln></circle> <circle cx="492" cy="350" r="16" fill="#c38b35" opacity="0.28" data-astro-cid-fcj64gln></circle> <circle cx="672" cy="398" r="16" fill="#586c8c" opacity="0.28" data-astro-cid-fcj64gln></circle> </g> <g data-garden-layer data-astro-cid-fcj64gln></g> </svg> </section> <aside class="tool-panel tool-panel--ink garden-reading" data-astro-cid-fcj64gln> <p class="mono-note" data-astro-cid-fcj64gln>Garden Reading</p> <h2 data-reading-title data-astro-cid-fcj64gln>Nothing planted yet.</h2> <p data-reading-copy data-astro-cid-fcj64gln>Open a source app or plant today. The garden stays in this browser.</p> <div class="garden-actions" data-astro-cid-fcj64gln> <button type="button" data-refresh-garden data-astro-cid-fcj64gln>Refresh garden</button> <button type="button" data-plant-today data-astro-cid-fcj64gln>Plant today</button> <button type="button" data-clear-garden data-astro-cid-fcj64gln>Clear garden plants</button> </div> <ol class="suggestion-list" data-garden-suggestions data-astro-cid-fcj64gln> <li data-astro-cid-fcj64gln><a href="/mint-studio" data-astro-cid-fcj64gln>Draft a mint receipt</a></li> <li data-astro-cid-fcj64gln><a href="/ritual-clock" data-astro-cid-fcj64gln>Mark the day</a></li> <li data-astro-cid-fcj64gln><a href="/world-atlas" data-astro-cid-fcj64gln>Stamp a route</a></li> </ol> </aside> </div> <section class="source-grid" aria-label="Signal Garden source counts" data-astro-cid-fcj64gln> ${sourceData.map((source) => renderTemplate`<article${addAttribute(`--source-color:${source.color}`, "style")}${addAttribute(source.id, "data-source-card")} data-astro-cid-fcj64gln> <span class="source-dot" aria-hidden="true" data-astro-cid-fcj64gln></span> <div data-astro-cid-fcj64gln> <p class="mono-note" data-astro-cid-fcj64gln>${source.label}</p> <strong${addAttribute(source.id, "data-source-count")} data-astro-cid-fcj64gln>0</strong> <small data-astro-cid-fcj64gln>${source.type}</small> </div> <a${addAttribute(source.href, "href")} data-astro-cid-fcj64gln>${source.empty}</a> </article>`)} </section> </section> ` }), unescapeHTML(JSON.stringify(sourceData))) }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/signal-garden.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/signal-garden.astro";
const $$url = "/signal-garden";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$SignalGarden,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
