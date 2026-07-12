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
const $$Observatory = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("observatory");
  const title = app.name;
  const description = app.description;
  const lenses = [
    {
      id: "mint",
      label: "Mint Receipts",
      key: "pc:mint-studio:receipts",
      href: "/mint-studio",
      action: "Draft provenance",
      empty: "No mint stars yet.",
      color: "#bf6f54",
      x: 188,
      y: 190
    },
    {
      id: "harbor",
      label: "Harbor Watch",
      key: "pc:harbor-log:watchlist",
      href: "/harbor-log",
      action: "Watch a vessel",
      empty: "No harbor stars yet.",
      color: "#3f7681",
      x: 512,
      y: 170
    },
    {
      id: "ocean",
      label: "Morning Ocean",
      key: "pc:morning-ocean:collection",
      href: "/morning-ocean",
      action: "Collect a card",
      empty: "No ocean stars yet.",
      color: "#6b8e99",
      x: 694,
      y: 306
    },
    {
      id: "passport",
      label: "Cat Passport",
      key: "pc:cat-passport:stamps",
      href: "/cat-passport",
      action: "Stamp a route",
      empty: "No passport stars yet.",
      color: "#b84f55",
      x: 828,
      y: 188
    },
    {
      id: "gallery",
      label: "Gallery Shows",
      key: "pc:gallery-wall:shows",
      href: "/gallery-wall",
      action: "Curate a wall",
      empty: "No gallery stars yet.",
      color: "#875c9e",
      x: 914,
      y: 346
    },
    {
      id: "signal",
      label: "Signal Garden",
      key: "pc:signal-garden:plants",
      href: "/signal-garden",
      action: "Plant today",
      empty: "No garden stars yet.",
      color: "#2f8f5f",
      x: 528,
      y: 308
    },
    {
      id: "ritual",
      label: "Ritual Clock",
      key: "pc:ritual-clock:marks",
      href: "/ritual-clock",
      action: "Mark today",
      empty: "No ritual stars yet.",
      color: "#c38b35",
      x: 620,
      y: 556
    },
    {
      id: "exchange",
      label: "Exchange Table",
      key: "pc:exchange-table:wishes",
      href: "/exchange-table",
      action: "Add intent",
      empty: "No exchange stars yet.",
      color: "#7b8b53",
      x: 352,
      y: 562
    },
    {
      id: "provenance",
      label: "Provenance Proofs",
      key: "pc:provenance-ledger:exports",
      href: "/provenance-ledger",
      action: "Scan proofs",
      empty: "No proof stars yet.",
      color: "#586c8c",
      x: 86,
      y: 242
    },
    {
      id: "atlas",
      label: "World Atlas",
      key: "pc:world-atlas:stamps",
      href: "/world-atlas",
      action: "Stamp route",
      empty: "No atlas stars yet.",
      color: "#267f78",
      x: 902,
      y: 520
    },
    {
      id: "cats",
      label: "Zen Cats",
      key: "pc:zen-cats:collection",
      href: "/zen-cats",
      action: "Collect a cat",
      empty: "No daily cat stars yet.",
      color: "#d28c7a",
      x: 772,
      y: 480
    },
    {
      id: "journey",
      label: "Journey Prints",
      key: "pc:zen-cats:journey",
      href: "/zen-cats#journey",
      action: "Unlock a print",
      empty: "No journey stars yet.",
      color: "#6d8a55",
      x: 478,
      y: 488
    },
    {
      id: "sats",
      label: "Sats Path",
      key: "pc:sats-path:checks",
      href: "/sats-path",
      action: "Mark readiness",
      empty: "No capital habit stars yet.",
      color: "#c39b39",
      x: 238,
      y: 502
    },
    {
      id: "invites",
      label: "Invite Ledger",
      key: "pc:referral-garden:invites",
      href: "/referral-garden",
      action: "Record an invite",
      empty: "No invite stars yet.",
      color: "#7d6aa8",
      x: 112,
      y: 360
    }
  ];
  const images = [
    { src: MORNING_OCEAN_TOKENS[0].imageUrl, alt: `${MORNING_OCEAN_TOKENS[0].title} Morning Ocean card` },
    { src: ZEN_CAT_GENESIS_COLLECTIBLES[2].imageUrl, alt: `${ZEN_CAT_GENESIS_COLLECTIBLES[2].title} Zen Cat card` },
    { src: MORNING_OCEAN_TOKENS[10].imageUrl, alt: `${MORNING_OCEAN_TOKENS[10].title} Morning Ocean card` },
    { src: ZEN_CAT_GENESIS_COLLECTIBLES[8].imageUrl, alt: `${ZEN_CAT_GENESIS_COLLECTIBLES[8].title} Zen Cat card` },
    { src: MORNING_OCEAN_TOKENS[20].imageUrl, alt: `${MORNING_OCEAN_TOKENS[20].title} Morning Ocean card` },
    { src: ZEN_CAT_GENESIS_COLLECTIBLES[5].imageUrl, alt: `${ZEN_CAT_GENESIS_COLLECTIBLES[5].title} Zen Cat card` }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/observatory",
    name: app.name,
    description,
    url: app.url,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web"
  };
  return renderTemplate(_b || (_b = __template(["", " <script>\n  (() => {\n    const root = document.querySelector('[data-observatory]');\n    const dataEl = document.querySelector('#observatory-lenses');\n    if (!root || !dataEl) return;\n\n    const lenses = JSON.parse(dataEl.textContent || '[]');\n    const NS = 'http://www.w3.org/2000/svg';\n    const nameKey = 'pc:observatory:name';\n    const layer = root.querySelector('[data-star-layer]');\n    const links = root.querySelector('[data-star-links]');\n    const totalEl = root.querySelector('[data-star-total]');\n    const titleEl = root.querySelector('[data-reading-title]');\n    const copyEl = root.querySelector('[data-reading-copy]');\n    const primaryEl = root.querySelector('[data-primary-lens]');\n    const routesEl = root.querySelector('[data-active-routes]');\n    const nextEl = root.querySelector('[data-next-signal]');\n    const nameInput = root.querySelector('[data-sky-name]');\n    const nameDisplay = root.querySelector('[data-sky-name-display]');\n    const saveNote = root.querySelector('[data-save-note]');\n\n    const readItems = (key) => {\n      try {\n        const parsed = JSON.parse(localStorage.getItem(key) || '[]');\n        if (Array.isArray(parsed)) return parsed;\n        if (parsed && typeof parsed === 'object') return Object.values(parsed);\n      } catch {}\n      return [];\n    };\n\n    const labelFor = (item) => {\n      if (!item || typeof item !== 'object') return '';\n      return item.title || item.name || item.alias || item.country || item.vessel || item.id || '';\n    };\n\n    const seedFor = (text) => {\n      let seed = 0;\n      for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;\n      return seed || 1;\n    };\n\n    const rand = (seed) => {\n      let next = seed >>> 0;\n      return () => {\n        next = (next * 1664525 + 1013904223) >>> 0;\n        return next / 4294967296;\n      };\n    };\n\n    const svgEl = (tag, attrs = {}) => {\n      const el = document.createElementNS(NS, tag);\n      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));\n      return el;\n    };\n\n    const paintName = () => {\n      const saved = localStorage.getItem(nameKey) || '';\n      if (nameInput) nameInput.value = saved;\n      if (nameDisplay) nameDisplay.textContent = saved || 'Unnamed night';\n    };\n\n    const state = () => lenses.map((lens) => {\n      const items = readItems(lens.key);\n      return { ...lens, items, count: items.length, latest: items[items.length - 1] };\n    });\n\n    const readingFor = (total, active, strongest, next) => {\n      if (total === 0) {\n        return {\n          title: 'The sky is waiting.',\n          copy: 'Open a source app and collect something locally. The first object becomes the first fixed star.',\n        };\n      }\n      if (total < 4) {\n        return {\n          title: 'First navigation.',\n          copy: `${strongest.label} is carrying the night. Add ${next.label.toLowerCase()} to give the map a second point of view.`,\n        };\n      }\n      if (active < 5) {\n        return {\n          title: 'A working constellation.',\n          copy: `${active} routes are alive. The collection now has shape, not just objects.`,\n        };\n      }\n      return {\n        title: 'Named-sky territory.',\n        copy: `${total} local stars across ${active} routes. This is enough signal to curate a drop, a post, or a mint-ready story.`,\n      };\n    };\n\n    const render = () => {\n      const rows = state();\n      const total = rows.reduce((sum, row) => sum + row.count, 0);\n      const activeRows = rows.filter((row) => row.count > 0);\n      const strongest = activeRows.slice().sort((a, b) => b.count - a.count)[0] || rows[0];\n      const next = rows.find((row) => row.count === 0) || strongest;\n      const reading = readingFor(total, activeRows.length, strongest, next);\n\n      if (totalEl) totalEl.textContent = String(total);\n      if (titleEl) titleEl.textContent = reading.title;\n      if (copyEl) copyEl.textContent = reading.copy;\n      if (primaryEl) primaryEl.textContent = activeRows.length ? strongest.label : 'None yet';\n      if (routesEl) routesEl.textContent = String(activeRows.length);\n      if (nextEl) nextEl.textContent = next.label;\n\n      rows.forEach((row) => {\n        const countEl = root.querySelector(`[data-lens-count=\"${row.id}\"]`);\n        const previewEl = root.querySelector(`[data-lens-preview=\"${row.id}\"]`);\n        const cardEl = root.querySelector(`[data-lens=\"${row.id}\"]`);\n        if (countEl) countEl.textContent = String(row.count);\n        if (previewEl) previewEl.textContent = row.count > 0 ? (labelFor(row.latest) || `${row.count} saved`) : row.empty;\n        if (cardEl) cardEl.classList.toggle('lens-card--active', row.count > 0);\n      });\n\n      if (!layer || !links) return;\n      layer.replaceChildren();\n      links.replaceChildren();\n\n      const activePoints = rows.filter((row) => row.count > 0);\n      const linkRows = activePoints.length > 1 ? activePoints : rows.slice(0, 4);\n      linkRows.forEach((row, index) => {\n        const nextRow = linkRows[index + 1];\n        if (!nextRow) return;\n        links.appendChild(svgEl('line', {\n          x1: row.x,\n          y1: row.y,\n          x2: nextRow.x,\n          y2: nextRow.y,\n          stroke: activePoints.length > 1 ? '#f5dfb6' : '#9ba69d',\n          'stroke-width': activePoints.length > 1 ? 1.4 : 0.8,\n          'stroke-opacity': activePoints.length > 1 ? 0.48 : 0.18,\n        }));\n      });\n\n      rows.forEach((row) => {\n        const group = svgEl('g', { 'data-row': row.id });\n        const orbitCount = Math.max(1, Math.min(row.count || 1, 12));\n        const random = rand(seedFor(`${row.id}:${row.count}:${labelFor(row.latest)}`));\n        for (let i = 0; i < orbitCount; i++) {\n          const angle = (Math.PI * 2 * i) / orbitCount + random() * 0.7;\n          const radius = 22 + random() * (row.count > 0 ? 58 : 24);\n          const x = row.x + Math.cos(angle) * radius;\n          const y = row.y + Math.sin(angle) * radius;\n          const size = row.count > 0 ? 1.8 + random() * 3.6 : 1.2;\n          group.appendChild(svgEl('circle', {\n            cx: x.toFixed(2),\n            cy: y.toFixed(2),\n            r: size.toFixed(2),\n            fill: row.count > 0 ? row.color : '#f5eee0',\n            opacity: row.count > 0 ? 0.68 + random() * 0.25 : 0.22,\n          }));\n        }\n        group.appendChild(svgEl('circle', {\n          cx: row.x,\n          cy: row.y,\n          r: row.count > 0 ? 7 + Math.min(row.count, 9) : 4,\n          fill: row.color,\n          opacity: row.count > 0 ? 0.95 : 0.34,\n        }));\n        group.appendChild(svgEl('circle', {\n          cx: row.x,\n          cy: row.y,\n          r: row.count > 0 ? 18 + Math.min(row.count * 2, 28) : 12,\n          fill: row.color,\n          opacity: row.count > 0 ? 0.16 : 0.06,\n          filter: 'url(#soft-star)',\n        }));\n        layer.appendChild(group);\n      });\n    };\n\n    root.querySelector('[data-refresh-sky]')?.addEventListener('click', render);\n    root.querySelector('[data-sky-form]')?.addEventListener('submit', (event) => {\n      event.preventDefault();\n      const value = nameInput ? nameInput.value.trim().slice(0, 40) : '';\n      if (value) localStorage.setItem(nameKey, value);\n      else localStorage.removeItem(nameKey);\n      paintName();\n      if (saveNote) saveNote.textContent = value ? 'Night name saved locally.' : 'Night name cleared.';\n    });\n\n    paintName();\n    render();\n  })();\n<\/script>"], ["", " <script>\n  (() => {\n    const root = document.querySelector('[data-observatory]');\n    const dataEl = document.querySelector('#observatory-lenses');\n    if (!root || !dataEl) return;\n\n    const lenses = JSON.parse(dataEl.textContent || '[]');\n    const NS = 'http://www.w3.org/2000/svg';\n    const nameKey = 'pc:observatory:name';\n    const layer = root.querySelector('[data-star-layer]');\n    const links = root.querySelector('[data-star-links]');\n    const totalEl = root.querySelector('[data-star-total]');\n    const titleEl = root.querySelector('[data-reading-title]');\n    const copyEl = root.querySelector('[data-reading-copy]');\n    const primaryEl = root.querySelector('[data-primary-lens]');\n    const routesEl = root.querySelector('[data-active-routes]');\n    const nextEl = root.querySelector('[data-next-signal]');\n    const nameInput = root.querySelector('[data-sky-name]');\n    const nameDisplay = root.querySelector('[data-sky-name-display]');\n    const saveNote = root.querySelector('[data-save-note]');\n\n    const readItems = (key) => {\n      try {\n        const parsed = JSON.parse(localStorage.getItem(key) || '[]');\n        if (Array.isArray(parsed)) return parsed;\n        if (parsed && typeof parsed === 'object') return Object.values(parsed);\n      } catch {}\n      return [];\n    };\n\n    const labelFor = (item) => {\n      if (!item || typeof item !== 'object') return '';\n      return item.title || item.name || item.alias || item.country || item.vessel || item.id || '';\n    };\n\n    const seedFor = (text) => {\n      let seed = 0;\n      for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;\n      return seed || 1;\n    };\n\n    const rand = (seed) => {\n      let next = seed >>> 0;\n      return () => {\n        next = (next * 1664525 + 1013904223) >>> 0;\n        return next / 4294967296;\n      };\n    };\n\n    const svgEl = (tag, attrs = {}) => {\n      const el = document.createElementNS(NS, tag);\n      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));\n      return el;\n    };\n\n    const paintName = () => {\n      const saved = localStorage.getItem(nameKey) || '';\n      if (nameInput) nameInput.value = saved;\n      if (nameDisplay) nameDisplay.textContent = saved || 'Unnamed night';\n    };\n\n    const state = () => lenses.map((lens) => {\n      const items = readItems(lens.key);\n      return { ...lens, items, count: items.length, latest: items[items.length - 1] };\n    });\n\n    const readingFor = (total, active, strongest, next) => {\n      if (total === 0) {\n        return {\n          title: 'The sky is waiting.',\n          copy: 'Open a source app and collect something locally. The first object becomes the first fixed star.',\n        };\n      }\n      if (total < 4) {\n        return {\n          title: 'First navigation.',\n          copy: \\`\\${strongest.label} is carrying the night. Add \\${next.label.toLowerCase()} to give the map a second point of view.\\`,\n        };\n      }\n      if (active < 5) {\n        return {\n          title: 'A working constellation.',\n          copy: \\`\\${active} routes are alive. The collection now has shape, not just objects.\\`,\n        };\n      }\n      return {\n        title: 'Named-sky territory.',\n        copy: \\`\\${total} local stars across \\${active} routes. This is enough signal to curate a drop, a post, or a mint-ready story.\\`,\n      };\n    };\n\n    const render = () => {\n      const rows = state();\n      const total = rows.reduce((sum, row) => sum + row.count, 0);\n      const activeRows = rows.filter((row) => row.count > 0);\n      const strongest = activeRows.slice().sort((a, b) => b.count - a.count)[0] || rows[0];\n      const next = rows.find((row) => row.count === 0) || strongest;\n      const reading = readingFor(total, activeRows.length, strongest, next);\n\n      if (totalEl) totalEl.textContent = String(total);\n      if (titleEl) titleEl.textContent = reading.title;\n      if (copyEl) copyEl.textContent = reading.copy;\n      if (primaryEl) primaryEl.textContent = activeRows.length ? strongest.label : 'None yet';\n      if (routesEl) routesEl.textContent = String(activeRows.length);\n      if (nextEl) nextEl.textContent = next.label;\n\n      rows.forEach((row) => {\n        const countEl = root.querySelector(\\`[data-lens-count=\"\\${row.id}\"]\\`);\n        const previewEl = root.querySelector(\\`[data-lens-preview=\"\\${row.id}\"]\\`);\n        const cardEl = root.querySelector(\\`[data-lens=\"\\${row.id}\"]\\`);\n        if (countEl) countEl.textContent = String(row.count);\n        if (previewEl) previewEl.textContent = row.count > 0 ? (labelFor(row.latest) || \\`\\${row.count} saved\\`) : row.empty;\n        if (cardEl) cardEl.classList.toggle('lens-card--active', row.count > 0);\n      });\n\n      if (!layer || !links) return;\n      layer.replaceChildren();\n      links.replaceChildren();\n\n      const activePoints = rows.filter((row) => row.count > 0);\n      const linkRows = activePoints.length > 1 ? activePoints : rows.slice(0, 4);\n      linkRows.forEach((row, index) => {\n        const nextRow = linkRows[index + 1];\n        if (!nextRow) return;\n        links.appendChild(svgEl('line', {\n          x1: row.x,\n          y1: row.y,\n          x2: nextRow.x,\n          y2: nextRow.y,\n          stroke: activePoints.length > 1 ? '#f5dfb6' : '#9ba69d',\n          'stroke-width': activePoints.length > 1 ? 1.4 : 0.8,\n          'stroke-opacity': activePoints.length > 1 ? 0.48 : 0.18,\n        }));\n      });\n\n      rows.forEach((row) => {\n        const group = svgEl('g', { 'data-row': row.id });\n        const orbitCount = Math.max(1, Math.min(row.count || 1, 12));\n        const random = rand(seedFor(\\`\\${row.id}:\\${row.count}:\\${labelFor(row.latest)}\\`));\n        for (let i = 0; i < orbitCount; i++) {\n          const angle = (Math.PI * 2 * i) / orbitCount + random() * 0.7;\n          const radius = 22 + random() * (row.count > 0 ? 58 : 24);\n          const x = row.x + Math.cos(angle) * radius;\n          const y = row.y + Math.sin(angle) * radius;\n          const size = row.count > 0 ? 1.8 + random() * 3.6 : 1.2;\n          group.appendChild(svgEl('circle', {\n            cx: x.toFixed(2),\n            cy: y.toFixed(2),\n            r: size.toFixed(2),\n            fill: row.count > 0 ? row.color : '#f5eee0',\n            opacity: row.count > 0 ? 0.68 + random() * 0.25 : 0.22,\n          }));\n        }\n        group.appendChild(svgEl('circle', {\n          cx: row.x,\n          cy: row.y,\n          r: row.count > 0 ? 7 + Math.min(row.count, 9) : 4,\n          fill: row.color,\n          opacity: row.count > 0 ? 0.95 : 0.34,\n        }));\n        group.appendChild(svgEl('circle', {\n          cx: row.x,\n          cy: row.y,\n          r: row.count > 0 ? 18 + Math.min(row.count * 2, 28) : 12,\n          fill: row.color,\n          opacity: row.count > 0 ? 0.16 : 0.06,\n          filter: 'url(#soft-star)',\n        }));\n        layer.appendChild(group);\n      });\n    };\n\n    root.querySelector('[data-refresh-sky]')?.addEventListener('click', render);\n    root.querySelector('[data-sky-form]')?.addEventListener('submit', (event) => {\n      event.preventDefault();\n      const value = nameInput ? nameInput.value.trim().slice(0, 40) : '';\n      if (value) localStorage.setItem(nameKey, value);\n      else localStorage.removeItem(nameKey);\n      paintName();\n      if (saveNote) saveNote.textContent = value ? 'Night name saved locally.' : 'Night name cleared.';\n    });\n\n    paintName();\n    render();\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "frame": {
    image: "https://pointcast.xyz/images/morning-ocean/series-contact-sheet.png",
    buttons: [
      { label: "Open Observatory", action: "link", target: "https://pointcast.xyz/observatory" },
      { label: "Open Cabinet", action: "link", target: "https://pointcast.xyz/cabinet" },
      { label: "Morning Ocean", action: "link", target: "https://pointcast.xyz/morning-ocean" }
    ]
  }, "data-astro-cid-yaxdsztj": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", ' <script id="observatory-lenses" type="application/json">', "<\/script> "])), renderComponent($$result2, "MicroAppShell", $$MicroAppShell, { "app": app, "headline": "Turn the whole collection into a sky.", "dek": "The Observatory reads the same local collector state as the Cabinet, then arranges it as a private star chart. No sync, no account, no transmission - just the shape of what you have been gathering.", "images": images, "stats": [
    { label: "Lenses", value: lenses.length },
    { label: "Source", value: "local" },
    { label: "Map", value: "live" },
    { label: "Mode", value: "night" }
  ], "links": [
    { href: "/cabinet", label: "Cabinet" },
    { href: "/zen-cats", label: "Cats" },
    { href: "/morning-ocean", label: "Ocean" }
  ], "data-astro-cid-yaxdsztj": true }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<section class="app-section observatory" data-observatory data-astro-cid-yaxdsztj> <div class="sky-layout" data-astro-cid-yaxdsztj> <section class="sky-panel" aria-label="Local collection constellation" data-astro-cid-yaxdsztj> <div class="sky-panel__top" data-astro-cid-yaxdsztj> <div data-astro-cid-yaxdsztj> <p class="mono-note" data-astro-cid-yaxdsztj>Local Constellation</p> <h2 data-sky-name-display data-astro-cid-yaxdsztj>Unnamed night</h2> </div> <div class="sky-score" data-astro-cid-yaxdsztj> <span data-astro-cid-yaxdsztj>Total Stars</span> <strong data-star-total data-astro-cid-yaxdsztj>0</strong> </div> </div> <svg class="star-map" viewBox="0 0 1000 620" role="img" aria-labelledby="observatory-title observatory-desc" data-astro-cid-yaxdsztj> <title id="observatory-title">PointCast Observatory constellation map</title> <desc id="observatory-desc" data-astro-cid-yaxdsztj>A generated night-sky map based on local PointCast collection state.</desc> <defs data-astro-cid-yaxdsztj> <radialGradient id="night-glow" cx="50%" cy="42%" r="64%" data-astro-cid-yaxdsztj> <stop offset="0%" stop-color="#f5eee0" stop-opacity="0.28" data-astro-cid-yaxdsztj></stop> <stop offset="46%" stop-color="#6f8d84" stop-opacity="0.16" data-astro-cid-yaxdsztj></stop> <stop offset="100%" stop-color="#171d21" stop-opacity="0.95" data-astro-cid-yaxdsztj></stop> </radialGradient> <filter id="soft-star" data-astro-cid-yaxdsztj> <feGaussianBlur stdDeviation="1.4" data-astro-cid-yaxdsztj></feGaussianBlur> </filter> </defs> <rect width="1000" height="620" rx="0" fill="#171d21" data-astro-cid-yaxdsztj></rect> <rect width="1000" height="620" rx="0" fill="url(#night-glow)" data-astro-cid-yaxdsztj></rect> <g opacity="0.2" data-astro-cid-yaxdsztj> <path d="M76 522 C248 398 312 154 512 126 C690 102 792 244 928 118" fill="none" stroke="#f6dfb6" stroke-width="1" data-astro-cid-yaxdsztj></path> <path d="M112 152 C272 226 396 462 568 420 C722 382 766 236 894 306" fill="none" stroke="#d59b86" stroke-width="1" data-astro-cid-yaxdsztj></path> </g> <g data-star-links data-astro-cid-yaxdsztj></g> <g data-star-layer data-astro-cid-yaxdsztj></g> <g data-lens-labels data-astro-cid-yaxdsztj> ${lenses.map((lens) => renderTemplate`<text${addAttribute(lens.x, "x")}${addAttribute(lens.y + 34, "y")} text-anchor="middle" data-astro-cid-yaxdsztj>${lens.label}</text>`)} </g> </svg> </section> <aside class="reading-panel" data-astro-cid-yaxdsztj> <p class="mono-note" data-astro-cid-yaxdsztj>Night Reading</p> <h2 data-reading-title data-astro-cid-yaxdsztj>The sky is waiting.</h2> <p data-reading-copy data-astro-cid-yaxdsztj>Open a source app and collect something locally. The first object becomes the first fixed star.</p> <div class="tone-grid" aria-label="Observatory reading metrics" data-astro-cid-yaxdsztj> <article data-astro-cid-yaxdsztj> <span data-astro-cid-yaxdsztj>Strongest Lens</span> <strong data-primary-lens data-astro-cid-yaxdsztj>None yet</strong> </article> <article data-astro-cid-yaxdsztj> <span data-astro-cid-yaxdsztj>Active Routes</span> <strong data-active-routes data-astro-cid-yaxdsztj>0</strong> </article> <article data-astro-cid-yaxdsztj> <span data-astro-cid-yaxdsztj>Next Signal</span> <strong data-next-signal data-astro-cid-yaxdsztj>Mint receipt</strong> </article> </div> <form class="name-plate" data-sky-form data-astro-cid-yaxdsztj> <label for="sky-name" data-astro-cid-yaxdsztj>Name the night</label> <div data-astro-cid-yaxdsztj> <input id="sky-name" data-sky-name inputmode="text" maxlength="40" placeholder="Pacific cabinet, first light..." data-astro-cid-yaxdsztj> <button type="submit" data-astro-cid-yaxdsztj>Save</button> </div> <p data-save-note data-astro-cid-yaxdsztj>Stored only in this browser.</p> </form> <div class="button-row" data-astro-cid-yaxdsztj> <button type="button" data-refresh-sky data-astro-cid-yaxdsztj>Refresh sky</button> <a class="app-button" href="/cabinet" data-astro-cid-yaxdsztj>Open Cabinet</a> </div> </aside> </div> <section class="lens-grid" aria-label="Collection lenses" data-astro-cid-yaxdsztj> ${lenses.map((lens) => renderTemplate`<article class="lens-card"${addAttribute(lens.id, "data-lens")}${addAttribute(`--lens-color:${lens.color}`, "style")} data-astro-cid-yaxdsztj> <span class="lens-card__dot" aria-hidden="true" data-astro-cid-yaxdsztj></span> <div data-astro-cid-yaxdsztj> <p class="mono-note" data-astro-cid-yaxdsztj>${lens.label}</p> <strong${addAttribute(lens.id, "data-lens-count")} data-astro-cid-yaxdsztj>0</strong> <span${addAttribute(lens.id, "data-lens-preview")} data-astro-cid-yaxdsztj>${lens.empty}</span> </div> <a${addAttribute(lens.href, "href")} data-astro-cid-yaxdsztj>${lens.action}</a> </article>`)} </section> </section> ` }), unescapeHTML(JSON.stringify(lenses))) }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/observatory.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/observatory.astro";
const $$url = "/observatory";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Observatory,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
