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
const $$Cabinet = createComponent(($$result, $$props, $$slots) => {
  const app = getPointcastApp("cabinet");
  const title = app.name;
  const description = app.description;
  const images = [
    { src: ZEN_CAT_GENESIS_COLLECTIBLES[0].imageUrl, alt: `${ZEN_CAT_GENESIS_COLLECTIBLES[0].title} Zen Cat collectible` },
    { src: MORNING_OCEAN_TOKENS[7].imageUrl, alt: `${MORNING_OCEAN_TOKENS[7].title} Morning Ocean collectible` },
    { src: ZEN_CAT_GENESIS_COLLECTIBLES[4].imageUrl, alt: `${ZEN_CAT_GENESIS_COLLECTIBLES[4].title} Zen Cat collectible` },
    { src: MORNING_OCEAN_TOKENS[22].imageUrl, alt: `${MORNING_OCEAN_TOKENS[22].title} Morning Ocean collectible` },
    { src: ZEN_CAT_GENESIS_COLLECTIBLES[10].imageUrl, alt: `${ZEN_CAT_GENESIS_COLLECTIBLES[10].title} Zen Cat collectible` },
    { src: MORNING_OCEAN_TOKENS[16].imageUrl, alt: `${MORNING_OCEAN_TOKENS[16].title} Morning Ocean collectible` }
  ];
  const shelves = [
    {
      id: "mint",
      label: "Mint Receipts",
      key: "pc:mint-studio:receipts",
      href: "/mint-studio",
      action: "Draft one collectible brief",
      empty: "No mint receipts yet."
    },
    {
      id: "harbor",
      label: "Harbor Watchlist",
      key: "pc:harbor-log:watchlist",
      href: "/harbor-log",
      action: "Draw a morning vessel",
      empty: "No ocean vessels watched yet."
    },
    {
      id: "passport",
      label: "Cat Passport",
      key: "pc:cat-passport:stamps",
      href: "/cat-passport",
      action: "Stamp one world cat route",
      empty: "No passport stamps yet."
    },
    {
      id: "gallery",
      label: "Gallery Shows",
      key: "pc:gallery-wall:shows",
      href: "/gallery-wall",
      action: "Curate one wall",
      empty: "No curated walls yet."
    },
    {
      id: "signal",
      label: "Signal Garden",
      key: "pc:signal-garden:plants",
      href: "/signal-garden",
      action: "Plant today",
      empty: "No garden plants yet."
    },
    {
      id: "ritual",
      label: "Ritual Clock",
      key: "pc:ritual-clock:marks",
      href: "/ritual-clock",
      action: "Mark today",
      empty: "No daily ritual marks yet."
    },
    {
      id: "exchange",
      label: "Exchange Table",
      key: "pc:exchange-table:wishes",
      href: "/exchange-table",
      action: "Add one intent note",
      empty: "No exchange notes yet."
    },
    {
      id: "provenance",
      label: "Provenance Ledger",
      key: "pc:provenance-ledger:exports",
      href: "/provenance-ledger",
      action: "Generate proof sheet",
      empty: "No proof sheets yet."
    },
    {
      id: "atlas",
      label: "World Atlas",
      key: "pc:world-atlas:stamps",
      href: "/world-atlas",
      action: "Stamp one atlas stop",
      empty: "No atlas stamps yet."
    },
    {
      id: "referrals",
      label: "Invite Ledger",
      key: "pc:referral-garden:invites",
      href: "/referral-garden",
      action: "Record one disclosed invite",
      empty: "No invite receipts yet."
    },
    {
      id: "sats",
      label: "Sats Path",
      key: "pc:sats-path:checks",
      href: "/sats-path",
      action: "Mark one learning checkpoint",
      empty: "No readiness checkpoints yet."
    },
    {
      id: "ocean",
      label: "Morning Ocean",
      key: "pc:morning-ocean:collection",
      href: "/morning-ocean",
      action: "Collect one ocean card locally",
      empty: "No Morning Ocean cards yet."
    },
    {
      id: "cats",
      label: "Zen Cats",
      key: "pc:zen-cats:collection",
      href: "/zen-cats",
      action: "Complete today's cat ritual",
      empty: "No daily cats collected yet."
    },
    {
      id: "journey",
      label: "Journey Prints",
      key: "pc:zen-cats:journey",
      href: "/zen-cats#journey",
      action: "Unlock one journey print",
      empty: "No journey prints yet."
    }
  ];
  const featured = [
    {
      href: "/zen-cats",
      eyebrow: "Cats",
      title: "Daily calm, world routes, and gem cards.",
      image: ZEN_CAT_GENESIS_COLLECTIBLES[1].imageUrl
    },
    {
      href: "/morning-ocean",
      eyebrow: "Ocean",
      title: "Boats, dawn water, and mintable maritime cards.",
      image: MORNING_OCEAN_TOKENS[5].imageUrl
    },
    {
      href: "/mint-studio",
      eyebrow: "Mint",
      title: "Draft the provenance before the chain.",
      image: MORNING_OCEAN_TOKENS[19].imageUrl
    },
    {
      href: "/world-atlas",
      eyebrow: "Path",
      title: "Landmarks, gemstones, and the route map.",
      image: ZEN_CAT_GENESIS_COLLECTIBLES[8].imageUrl
    },
    {
      href: "/gallery-wall",
      eyebrow: "Gallery",
      title: "Arrange the collection into quiet rooms.",
      image: ZEN_CAT_GENESIS_COLLECTIBLES[12].imageUrl
    },
    {
      href: "/signal-garden",
      eyebrow: "Garden",
      title: "Let local signals grow in place.",
      image: ZEN_CAT_GENESIS_COLLECTIBLES[7].imageUrl
    }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/cabinet",
    name: app.name,
    description,
    url: app.url,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web"
  };
  return renderTemplate(_b || (_b = __template(["", " <script>\n  (() => {\n    const root = document.querySelector('[data-cabinet]');\n    const dataEl = document.querySelector('#cabinet-shelves');\n    if (!root || !dataEl) return;\n    const shelves = JSON.parse(dataEl.textContent || '[]');\n    const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({\n      '&': '&amp;',\n      '<': '&lt;',\n      '>': '&gt;',\n      '\"': '&quot;',\n      \"'\": '&#39;',\n    }[char]));\n    const readItems = (key) => {\n      try {\n        const parsed = JSON.parse(localStorage.getItem(key) || '[]');\n        if (Array.isArray(parsed)) return parsed;\n        if (parsed && typeof parsed === 'object') return Object.values(parsed);\n      } catch {}\n      return [];\n    };\n    const itemLabel = (item) => {\n      if (item == null) return 'receipt';\n      if (typeof item === 'string' || typeof item === 'number') return String(item);\n      return item.title || item.name || item.alias || item.id || item.tokenId || item.code || 'receipt';\n    };\n    const itemDetail = (item) => {\n      if (!item || typeof item !== 'object') return '';\n      return [\n        item.collection,\n        item.city && item.country ? `${item.city}, ${item.country}` : item.country,\n        item.vessel,\n        item.gem,\n        item.rarity,\n        item.savedAt || item.date || item.stampedAt,\n      ].filter(Boolean).slice(0, 3).join(' - ');\n    };\n    const render = () => {\n      const shelfStates = shelves.map((shelf) => {\n        const items = readItems(shelf.key);\n        const count = items.length;\n        const latest = items[count - 1];\n        const countEl = root.querySelector(`[data-shelf-count=\"${shelf.id}\"]`);\n        const previewEl = root.querySelector(`[data-shelf-preview=\"${shelf.id}\"]`);\n        const cardEl = root.querySelector(`[data-shelf=\"${shelf.id}\"]`);\n        if (countEl) countEl.textContent = String(count);\n        if (previewEl) {\n          previewEl.textContent = count ? itemLabel(latest) : shelf.empty;\n        }\n        if (cardEl) cardEl.toggleAttribute('data-filled', count > 0);\n        return { ...shelf, items, count, latest };\n      });\n      const total = shelfStates.reduce((sum, shelf) => sum + shelf.count, 0);\n      const filled = shelfStates.filter((shelf) => shelf.count > 0).length;\n      const scoreEl = root.querySelector('[data-cabinet-score]');\n      const statusEl = root.querySelector('[data-cabinet-status]');\n      const nextTitleEl = root.querySelector('[data-cabinet-next-title]');\n      const nextCopyEl = root.querySelector('[data-cabinet-next-copy]');\n      const nextLinkEl = root.querySelector('[data-cabinet-next-link]');\n      const latestTitleEl = root.querySelector('[data-latest-title]');\n      const latestCopyEl = root.querySelector('[data-latest-copy]');\n      const ledgerEl = root.querySelector('[data-cabinet-ledger]');\n      if (scoreEl) scoreEl.textContent = String(total);\n      if (statusEl) {\n        statusEl.textContent = total\n          ? `${filled} of ${shelves.length} shelves have something on them.`\n          : 'Open a source app to start filling the shelf.';\n      }\n      const next = shelfStates.find((shelf) => shelf.count === 0) || shelfStates.sort((a, b) => a.count - b.count)[0];\n      if (nextTitleEl && next) nextTitleEl.textContent = next.count ? `Balance ${next.label}` : next.label;\n      if (nextCopyEl && next) nextCopyEl.textContent = next.count ? next.action : next.empty;\n      if (nextLinkEl && next) nextLinkEl.href = next.href;\n      const latestItems = shelfStates\n        .flatMap((shelf) => shelf.items.slice(-3).map((item, index) => ({ shelf, item, index })))\n        .slice(-8)\n        .reverse();\n      if (latestTitleEl) latestTitleEl.textContent = latestItems.length ? 'Fresh on the shelf.' : 'Nothing on the velvet yet.';\n      if (latestCopyEl) {\n        latestCopyEl.textContent = latestItems.length\n          ? 'Newest local objects from the connected PointCast apps.'\n          : 'As you collect locally, your newest receipts appear here without leaving your browser.';\n      }\n      if (ledgerEl) {\n        ledgerEl.innerHTML = latestItems.map(({ shelf, item }) => {\n          const detail = itemDetail(item);\n          return `<li><span>${escapeHtml(shelf.label)}</span><strong>${escapeHtml(itemLabel(item))}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</li>`;\n        }).join('');\n      }\n    };\n    root.querySelector('[data-refresh-cabinet]')?.addEventListener('click', render);\n    window.addEventListener('storage', render);\n    render();\n  })();\n<\/script>"], ["", " <script>\n  (() => {\n    const root = document.querySelector('[data-cabinet]');\n    const dataEl = document.querySelector('#cabinet-shelves');\n    if (!root || !dataEl) return;\n    const shelves = JSON.parse(dataEl.textContent || '[]');\n    const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (char) => ({\n      '&': '&amp;',\n      '<': '&lt;',\n      '>': '&gt;',\n      '\"': '&quot;',\n      \"'\": '&#39;',\n    }[char]));\n    const readItems = (key) => {\n      try {\n        const parsed = JSON.parse(localStorage.getItem(key) || '[]');\n        if (Array.isArray(parsed)) return parsed;\n        if (parsed && typeof parsed === 'object') return Object.values(parsed);\n      } catch {}\n      return [];\n    };\n    const itemLabel = (item) => {\n      if (item == null) return 'receipt';\n      if (typeof item === 'string' || typeof item === 'number') return String(item);\n      return item.title || item.name || item.alias || item.id || item.tokenId || item.code || 'receipt';\n    };\n    const itemDetail = (item) => {\n      if (!item || typeof item !== 'object') return '';\n      return [\n        item.collection,\n        item.city && item.country ? \\`\\${item.city}, \\${item.country}\\` : item.country,\n        item.vessel,\n        item.gem,\n        item.rarity,\n        item.savedAt || item.date || item.stampedAt,\n      ].filter(Boolean).slice(0, 3).join(' - ');\n    };\n    const render = () => {\n      const shelfStates = shelves.map((shelf) => {\n        const items = readItems(shelf.key);\n        const count = items.length;\n        const latest = items[count - 1];\n        const countEl = root.querySelector(\\`[data-shelf-count=\"\\${shelf.id}\"]\\`);\n        const previewEl = root.querySelector(\\`[data-shelf-preview=\"\\${shelf.id}\"]\\`);\n        const cardEl = root.querySelector(\\`[data-shelf=\"\\${shelf.id}\"]\\`);\n        if (countEl) countEl.textContent = String(count);\n        if (previewEl) {\n          previewEl.textContent = count ? itemLabel(latest) : shelf.empty;\n        }\n        if (cardEl) cardEl.toggleAttribute('data-filled', count > 0);\n        return { ...shelf, items, count, latest };\n      });\n      const total = shelfStates.reduce((sum, shelf) => sum + shelf.count, 0);\n      const filled = shelfStates.filter((shelf) => shelf.count > 0).length;\n      const scoreEl = root.querySelector('[data-cabinet-score]');\n      const statusEl = root.querySelector('[data-cabinet-status]');\n      const nextTitleEl = root.querySelector('[data-cabinet-next-title]');\n      const nextCopyEl = root.querySelector('[data-cabinet-next-copy]');\n      const nextLinkEl = root.querySelector('[data-cabinet-next-link]');\n      const latestTitleEl = root.querySelector('[data-latest-title]');\n      const latestCopyEl = root.querySelector('[data-latest-copy]');\n      const ledgerEl = root.querySelector('[data-cabinet-ledger]');\n      if (scoreEl) scoreEl.textContent = String(total);\n      if (statusEl) {\n        statusEl.textContent = total\n          ? \\`\\${filled} of \\${shelves.length} shelves have something on them.\\`\n          : 'Open a source app to start filling the shelf.';\n      }\n      const next = shelfStates.find((shelf) => shelf.count === 0) || shelfStates.sort((a, b) => a.count - b.count)[0];\n      if (nextTitleEl && next) nextTitleEl.textContent = next.count ? \\`Balance \\${next.label}\\` : next.label;\n      if (nextCopyEl && next) nextCopyEl.textContent = next.count ? next.action : next.empty;\n      if (nextLinkEl && next) nextLinkEl.href = next.href;\n      const latestItems = shelfStates\n        .flatMap((shelf) => shelf.items.slice(-3).map((item, index) => ({ shelf, item, index })))\n        .slice(-8)\n        .reverse();\n      if (latestTitleEl) latestTitleEl.textContent = latestItems.length ? 'Fresh on the shelf.' : 'Nothing on the velvet yet.';\n      if (latestCopyEl) {\n        latestCopyEl.textContent = latestItems.length\n          ? 'Newest local objects from the connected PointCast apps.'\n          : 'As you collect locally, your newest receipts appear here without leaving your browser.';\n      }\n      if (ledgerEl) {\n        ledgerEl.innerHTML = latestItems.map(({ shelf, item }) => {\n          const detail = itemDetail(item);\n          return \\`<li><span>\\${escapeHtml(shelf.label)}</span><strong>\\${escapeHtml(itemLabel(item))}</strong>\\${detail ? \\`<small>\\${escapeHtml(detail)}</small>\\` : ''}</li>\\`;\n        }).join('');\n      }\n    };\n    root.querySelector('[data-refresh-cabinet]')?.addEventListener('click', render);\n    window.addEventListener('storage', render);\n    render();\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "frame": {
    image: "https://pointcast.xyz/images/morning-ocean/series-contact-sheet.png",
    buttons: [
      { label: "Open Cabinet", action: "link", target: "https://pointcast.xyz/cabinet" },
      { label: "Zen Cats", action: "link", target: "https://pointcast.xyz/zen-cats" },
      { label: "Morning Ocean", action: "link", target: "https://pointcast.xyz/morning-ocean" }
    ]
  }, "data-astro-cid-ygzvly33": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", ' <script id="cabinet-shelves" type="application/json">', "<\/script> "])), renderComponent($$result2, "MicroAppShell", $$MicroAppShell, { "app": app, "headline": "Everything you picked up gets a place to live.", "dek": "The Cabinet is a local-only shelf for PointCast collectibles, receipts, stamps, invites, and learning checkpoints. It reads your browser's existing app state and turns it into a calm collector dashboard.", "images": images, "stats": [
    { label: "Shelves", value: shelves.length },
    { label: "Storage", value: "local" },
    { label: "Sharing", value: "manual" },
    { label: "Custody", value: "yours" }
  ], "links": [
    { href: "/zen-cats", label: "Cats" },
    { href: "/morning-ocean", label: "Ocean" },
    { href: "/apps", label: "Apps" }
  ], "data-astro-cid-ygzvly33": true }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<section class="app-section cabinet" data-cabinet data-astro-cid-ygzvly33> <div class="cabinet-status" data-astro-cid-ygzvly33> <article class="cabinet-score" data-astro-cid-ygzvly33> <p class="mono-note" data-astro-cid-ygzvly33>Cabinet Score</p> <strong data-cabinet-score data-astro-cid-ygzvly33>0</strong> <span data-cabinet-status data-astro-cid-ygzvly33>Open a source app to start filling the shelf.</span> </article> <article class="cabinet-next" data-astro-cid-ygzvly33> <p class="mono-note" data-astro-cid-ygzvly33>Next Best Move</p> <strong data-cabinet-next-title data-astro-cid-ygzvly33>Start with a receipt</strong> <span data-cabinet-next-copy data-astro-cid-ygzvly33>Mint Studio is the fastest way to add a first object.</span> <a class="app-button" data-cabinet-next-link href="/mint-studio" data-astro-cid-ygzvly33>Open source</a> </article> </div> <section class="shelf-grid" aria-label="Cabinet shelves" data-astro-cid-ygzvly33> ${shelves.map((shelf) => renderTemplate`<article class="shelf-card"${addAttribute(shelf.id, "data-shelf")} data-astro-cid-ygzvly33> <div data-astro-cid-ygzvly33> <p class="mono-note" data-astro-cid-ygzvly33>${shelf.label}</p> <strong${addAttribute(shelf.id, "data-shelf-count")} data-astro-cid-ygzvly33>0</strong> <span${addAttribute(shelf.id, "data-shelf-preview")} data-astro-cid-ygzvly33>${shelf.empty}</span> </div> <a${addAttribute(shelf.href, "href")} data-astro-cid-ygzvly33>${shelf.action}</a> </article>`)} </section> <section class="tool-grid tray" aria-label="Featured source apps" data-astro-cid-ygzvly33> <div class="tool-panel" data-astro-cid-ygzvly33> <h2 data-astro-cid-ygzvly33>Featured Tray</h2> <p data-astro-cid-ygzvly33>Four doors into the collection loop. Each one adds a different kind of object to the Cabinet.</p> <div class="feature-grid" data-astro-cid-ygzvly33> ${featured.map((item) => renderTemplate`<a class="feature-card"${addAttribute(item.href, "href")} data-astro-cid-ygzvly33> <img${addAttribute(item.image, "src")} alt="" width="1024" height="1024" loading="lazy" decoding="async" data-astro-cid-ygzvly33> <span data-astro-cid-ygzvly33>${item.eyebrow}</span> <strong data-astro-cid-ygzvly33>${item.title}</strong> </a>`)} </div> </div> <aside class="tool-panel tool-panel--ink" data-astro-cid-ygzvly33> <p class="mono-note" data-astro-cid-ygzvly33>Latest Objects</p> <h2 data-latest-title data-astro-cid-ygzvly33>Nothing on the velvet yet.</h2> <p data-latest-copy data-astro-cid-ygzvly33>As you collect locally, your newest receipts appear here without leaving your browser.</p> <ol class="cabinet-ledger" data-cabinet-ledger data-astro-cid-ygzvly33></ol> <div class="button-row" data-astro-cid-ygzvly33> <button type="button" data-refresh-cabinet data-astro-cid-ygzvly33>Refresh cabinet</button> <a class="app-button" href="/apps" data-astro-cid-ygzvly33>Open app index</a> </div> </aside> </section> </section> ` }), unescapeHTML(JSON.stringify(shelves))) }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cabinet.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cabinet.astro";
const $$url = "/cabinet";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cabinet,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
