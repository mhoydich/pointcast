import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute, u as unescapeHTML } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$MicroAppShell } from './MicroAppShell_CtL0WlkJ.mjs';
import { F as FEATURED_COLLECTIBLE_IMAGES, E as EXCHANGE_LANES } from './collection-layer_udKL4gHU.mjs';
import { g as getPointcastApp } from './pointcast-apps_DuRB6sfu.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a, _b;
const $$ExchangeTable = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("exchange-table");
  const title = app.name;
  const description = app.description;
  const heroImages = FEATURED_COLLECTIBLE_IMAGES.slice(8, 14).map((item) => ({
    src: item.imageUrl,
    alt: `${item.title} collectible artwork`
  }));
  const promptCards = [
    "Paris Moon Salon for a harbor rare",
    "Eclipse Carrier watch signal",
    "Genesis black cat wall slot",
    "World Atlas Tokyo route",
    "Mint Studio proof review",
    "Morning Ocean epic reserve"
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/exchange-table",
    name: app.name,
    description,
    url: app.url,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web"
  };
  return renderTemplate(_b || (_b = __template(["", " <script>\n  (() => {\n    const root = document.querySelector('[data-exchange-table]');\n    const dataEl = document.querySelector('#exchange-lanes');\n    if (!root || !dataEl) return;\n\n    const lanes = JSON.parse(dataEl.textContent || '[]');\n    const storageKey = 'pc:exchange-table:wishes';\n    const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({\n      '&': '&amp;',\n      '<': '&lt;',\n      '>': '&gt;',\n      '\"': '&quot;',\n      \"'\": '&#39;',\n    }[char]));\n    const readNotes = () => {\n      try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }\n    };\n    const saveNotes = (items) => localStorage.setItem(storageKey, JSON.stringify(items.slice(-60)));\n    const render = () => {\n      const notes = readNotes();\n      lanes.forEach((lane) => {\n        const list = root.querySelector(`[data-lane-list=\"${lane.id}\"]`);\n        const laneNotes = notes.filter((note) => note.lane === lane.id).slice(-8).reverse();\n        list.innerHTML = laneNotes.length ? laneNotes.map((note) => `\n          <li>\n            <strong>${escapeHtml(note.subject)}</strong>\n            <span>${escapeHtml(note.note)}</span>\n            <small>${escapeHtml(note.savedAt)}</small>\n          </li>\n        `).join('') : '<li><strong>Open slot</strong><span>Nothing resting here yet.</span><small>local</small></li>';\n      });\n    };\n    root.querySelectorAll('[data-prompt]').forEach((button) => {\n      button.addEventListener('click', () => {\n        root.querySelector('[data-exchange-subject]').value = button.dataset.prompt;\n      });\n    });\n    root.querySelector('[data-add-note]')?.addEventListener('click', () => {\n      const subject = root.querySelector('[data-exchange-subject]').value.trim();\n      const note = root.querySelector('[data-exchange-note]').value.trim();\n      if (!subject) return;\n      const notes = readNotes();\n      notes.push({\n        id: `intent-${Date.now()}`,\n        lane: root.querySelector('[data-exchange-lane]').value,\n        subject,\n        note,\n        savedAt: new Date().toLocaleString(),\n      });\n      saveNotes(notes);\n      render();\n    });\n    root.querySelector('[data-clear-table]')?.addEventListener('click', () => {\n      localStorage.removeItem(storageKey);\n      render();\n    });\n    render();\n  })();\n<\/script>"], ["", " <script>\n  (() => {\n    const root = document.querySelector('[data-exchange-table]');\n    const dataEl = document.querySelector('#exchange-lanes');\n    if (!root || !dataEl) return;\n\n    const lanes = JSON.parse(dataEl.textContent || '[]');\n    const storageKey = 'pc:exchange-table:wishes';\n    const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({\n      '&': '&amp;',\n      '<': '&lt;',\n      '>': '&gt;',\n      '\"': '&quot;',\n      \"'\": '&#39;',\n    }[char]));\n    const readNotes = () => {\n      try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }\n    };\n    const saveNotes = (items) => localStorage.setItem(storageKey, JSON.stringify(items.slice(-60)));\n    const render = () => {\n      const notes = readNotes();\n      lanes.forEach((lane) => {\n        const list = root.querySelector(\\`[data-lane-list=\"\\${lane.id}\"]\\`);\n        const laneNotes = notes.filter((note) => note.lane === lane.id).slice(-8).reverse();\n        list.innerHTML = laneNotes.length ? laneNotes.map((note) => \\`\n          <li>\n            <strong>\\${escapeHtml(note.subject)}</strong>\n            <span>\\${escapeHtml(note.note)}</span>\n            <small>\\${escapeHtml(note.savedAt)}</small>\n          </li>\n        \\`).join('') : '<li><strong>Open slot</strong><span>Nothing resting here yet.</span><small>local</small></li>';\n      });\n    };\n    root.querySelectorAll('[data-prompt]').forEach((button) => {\n      button.addEventListener('click', () => {\n        root.querySelector('[data-exchange-subject]').value = button.dataset.prompt;\n      });\n    });\n    root.querySelector('[data-add-note]')?.addEventListener('click', () => {\n      const subject = root.querySelector('[data-exchange-subject]').value.trim();\n      const note = root.querySelector('[data-exchange-note]').value.trim();\n      if (!subject) return;\n      const notes = readNotes();\n      notes.push({\n        id: \\`intent-\\${Date.now()}\\`,\n        lane: root.querySelector('[data-exchange-lane]').value,\n        subject,\n        note,\n        savedAt: new Date().toLocaleString(),\n      });\n      saveNotes(notes);\n      render();\n    });\n    root.querySelector('[data-clear-table]')?.addEventListener('click', () => {\n      localStorage.removeItem(storageKey);\n      render();\n    });\n    render();\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-vqx4eybc": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", ' <script id="exchange-lanes" type="application/json">', "<\/script> "])), renderComponent($$result2, "MicroAppShell", $$MicroAppShell, { "app": app, "headline": "Put collector intent on the table.", "dek": "A private board for wants, possible offers, and watch signals. It keeps the tone clean before anything graduates into a real sale, swap, or mint decision.", "images": heroImages, "stats": [
    { label: "Lanes", value: EXCHANGE_LANES.length },
    { label: "Mode", value: "private" },
    { label: "Custody", value: "none" },
    { label: "Terms", value: "manual" }
  ], "links": [
    { href: "/gallery-wall", label: "Gallery" },
    { href: "/provenance-ledger", label: "Ledger" },
    { href: "/sats-path", label: "Sats" }
  ], "data-astro-cid-vqx4eybc": true }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<section class="app-section exchange-table" data-exchange-table data-astro-cid-vqx4eybc> <div class="exchange-layout" data-astro-cid-vqx4eybc> <section class="table-surface" aria-label="Exchange lanes" data-astro-cid-vqx4eybc> ${EXCHANGE_LANES.map((lane) => renderTemplate`<article class="exchange-lane"${addAttribute(lane.id, "data-lane")} data-astro-cid-vqx4eybc> <p class="mono-note" data-astro-cid-vqx4eybc>${lane.label}</p> <span data-astro-cid-vqx4eybc>${lane.tone}</span> <ol${addAttribute(lane.id, "data-lane-list")} data-astro-cid-vqx4eybc></ol> </article>`)} </section> <aside class="tool-panel exchange-form" data-astro-cid-vqx4eybc> <p class="mono-note" data-astro-cid-vqx4eybc>Intent Card</p> <h2 data-astro-cid-vqx4eybc>New note</h2> <label data-astro-cid-vqx4eybc>
Lane
<select data-exchange-lane data-astro-cid-vqx4eybc> ${EXCHANGE_LANES.map((lane) => renderTemplate`<option${addAttribute(lane.id, "value")} data-astro-cid-vqx4eybc>${lane.label}</option>`)} </select> </label> <label data-astro-cid-vqx4eybc>
Subject
<input data-exchange-subject${addAttribute(promptCards[0], "value")} maxlength="80" data-astro-cid-vqx4eybc> </label> <label data-astro-cid-vqx4eybc>
Note
<textarea data-exchange-note data-astro-cid-vqx4eybc>Keep it friendly, disclosed, and small.</textarea> </label> <div class="prompt-grid" data-astro-cid-vqx4eybc> ${promptCards.map((prompt) => renderTemplate`<button type="button"${addAttribute(prompt, "data-prompt")} data-astro-cid-vqx4eybc>${prompt}</button>`)} </div> <div class="button-row" data-astro-cid-vqx4eybc> <button type="button" data-add-note data-astro-cid-vqx4eybc>Add note</button> <button type="button" data-clear-table data-astro-cid-vqx4eybc>Clear table</button> </div> </aside> </div> </section> ` }), unescapeHTML(JSON.stringify(EXCHANGE_LANES))) }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/exchange-table.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/exchange-table.astro";
const $$url = "/exchange-table";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ExchangeTable,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
