import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumStickers = createComponent(($$result, $$props, $$slots) => {
  const title = "/drum-stickers — your drum-hub sticker binder";
  const description = "Twenty-two stickers, one per drum-hub surface. Earn a sticker by tapping on the surface. Local-first binder shows earned in color, unearned grayed out.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/drum-stickers",
    name: "PointCast · Drum Stickers",
    url: "https://pointcast.xyz/drum-stickers",
    description
  };
  const STICKERS = [
    { id: "classic", href: "/drum", name: "Classic", glyph: "◯", color: "#ff5c23", shape: "circle", evidence: "pc:drumLocalCount" },
    { id: "collab", href: "/drum-v2", name: "Collab", glyph: "∞", color: "#ffd400", shape: "rounded", evidence: "pc:drum-v2:tapped" },
    { id: "spotify", href: "/drum-v3", name: "Spotify", glyph: "♫", color: "#3b6e3b", shape: "pill", evidence: "pc:drum-v3:track-count" },
    { id: "orch", href: "/drum-v4", name: "Orchestra", glyph: "𝄞", color: "#185fa5", shape: "square", evidence: "pc:drum-v4:collected" },
    { id: "loops", href: "/drum-v5", name: "Loops", glyph: "◇", color: "#ff8a4a", shape: "diamond", evidence: "pc:drum-v5:shared-count" },
    { id: "choir", href: "/drum-v6", name: "Choir", glyph: "𝄢", color: "#5fbafd", shape: "rounded", evidence: "pc:drum-v6:sung" },
    { id: "big", href: "/drum-v7", name: "Big Board", glyph: "◧", color: "#a83b2a", shape: "square", evidence: "pc:drum-v7:played" },
    { id: "symph", href: "/drum-v8", name: "Symphony", glyph: "♪", color: "#d6745f", shape: "rounded", evidence: "pc:drum-v8:played" },
    { id: "lounge", href: "/drum-v9", name: "Lounge", glyph: "🎷", color: "#b8431a", shape: "pill", evidence: "pc:drum-v9:played" },
    { id: "theremin", href: "/drum-v10", name: "Theremin", glyph: "∿", color: "#ff8a4a", shape: "pill", evidence: "pc:drum-v10:notes" },
    { id: "bells", href: "/drum-v11", name: "Bells", glyph: "🔔", color: "#fff7c2", shape: "rounded", evidence: "pc:drum-v11:rung" },
    { id: "organ", href: "/drum-v12", name: "Pipe Organ", glyph: "⛪", color: "#c9a449", shape: "square", evidence: "pc:drum-v12:notes" },
    { id: "apr26", href: "/drum-apr26", name: "Sequencer Apr26", glyph: "▦", color: "#3a3a3a", shape: "square", evidence: "pc:drum-apr26:tapped" },
    { id: "potato", href: "/drum-potato", name: "Hot Potato", glyph: "🥔", color: "#caa672", shape: "rounded", evidence: "pc:drum-potato:wins" },
    { id: "pulse", href: "/drum-pulse", name: "Pulse", glyph: "♥", color: "#ff5c23", shape: "rounded", evidence: "pc:drum-pulse:milestones-seen" },
    { id: "agents", href: "/drum-agents", name: "Agents", glyph: "◉", color: "#1a1a1a", shape: "circle", evidence: "pc:drum-agents:visited" },
    { id: "daily", href: "/drum-daily", name: "Daily", glyph: "☀", color: "#ffd400", shape: "circle", evidence: "pc:drum-daily:days" },
    { id: "tv", href: "/drum-tv", name: "TV", glyph: "▶", color: "#185fa5", shape: "square", evidence: "pc:drum-tv:visited" },
    { id: "tv2", href: "/drum-tv-v2", name: "Venue", glyph: "★", color: "#ffd400", shape: "pill", evidence: "pc:drum-tv-v2:visited" },
    { id: "viz", href: "/drum-viz", name: "Visualizer", glyph: "✸", color: "#5fbafd", shape: "circle", evidence: "pc:drum-viz:seconds" },
    { id: "marquee", href: "/drum-marquee", name: "Marquee", glyph: "═", color: "#fffaf0", shape: "pill", evidence: "pc:drum-marquee:visited" },
    { id: "kettle", href: "/kettle", name: "Kettle", glyph: "🫖", color: "#5fbafd", shape: "rounded", evidence: "pc:kettle:my-stokes" },
    { id: "mcp", href: "/api/mcp", name: "MCP Gate", glyph: "◊", color: "#3a3a3a", shape: "diamond", evidence: "pc:drum-mcp:visited" },
    { id: "trophies", href: "/drum-trophies", name: "Trophies", glyph: "🏆", color: "#ffd400", shape: "square", evidence: "pc:drum-trophies:visited" }
  ];
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n\n    function isEarned(key) {\n      if (!key) return false;\n      try {\n        const v = localStorage.getItem(key);\n        if (v == null) return false;\n        if (v === '0' || v === '' || v === 'false' || v === '[]') return false;\n        return true;\n      } catch { return false; }\n    }\n\n    function paint() {\n      const cards = document.querySelectorAll('.st__sticker');\n      let earned = 0;\n      cards.forEach((card) => {\n        const key = card.getAttribute('data-evidence') || '';\n        const status = card.querySelector('.st__sticker-status');\n        if (isEarned(key)) {\n          card.classList.add('st__sticker--earned');\n          if (status) { status.textContent = 'COLLECTED'; status.dataset.status = 'earned'; }\n          earned += 1;\n        } else {\n          card.classList.remove('st__sticker--earned');\n          if (status) { status.textContent = 'UNCOLLECTED'; status.dataset.status = 'locked'; }\n        }\n      });\n      const prog = document.getElementById('st-progress');\n      if (prog) prog.textContent = `${earned} / ${cards.length} collected`;\n    }\n\n    // On clicking a sticker, mark a \"visited\" flag right away so the\n    // tile lights up the next time the user comes back, even if they\n    // didn't go all the way through to a real action on that surface.\n    document.querySelectorAll('.st__sticker').forEach((card) => {\n      card.addEventListener('click', () => {\n        const id = card.getAttribute('data-id');\n        if (!id) return;\n        // Only mark visited if there's no harder evidence already\n        const ev = card.getAttribute('data-evidence') || '';\n        if (!isEarned(ev)) {\n          try { localStorage.setItem(`pc:drum-${id}:visited`, '1'); } catch {}\n        }\n      });\n    });\n\n    paint();\n    // Poll because other tabs might play\n    setInterval(paint, 2000);\n  })();\n<\/script>"], ["", " <script>\n  (function () {\n    'use strict';\n\n    function isEarned(key) {\n      if (!key) return false;\n      try {\n        const v = localStorage.getItem(key);\n        if (v == null) return false;\n        if (v === '0' || v === '' || v === 'false' || v === '[]') return false;\n        return true;\n      } catch { return false; }\n    }\n\n    function paint() {\n      const cards = document.querySelectorAll('.st__sticker');\n      let earned = 0;\n      cards.forEach((card) => {\n        const key = card.getAttribute('data-evidence') || '';\n        const status = card.querySelector('.st__sticker-status');\n        if (isEarned(key)) {\n          card.classList.add('st__sticker--earned');\n          if (status) { status.textContent = 'COLLECTED'; status.dataset.status = 'earned'; }\n          earned += 1;\n        } else {\n          card.classList.remove('st__sticker--earned');\n          if (status) { status.textContent = 'UNCOLLECTED'; status.dataset.status = 'locked'; }\n        }\n      });\n      const prog = document.getElementById('st-progress');\n      if (prog) prog.textContent = \\`\\${earned} / \\${cards.length} collected\\`;\n    }\n\n    // On clicking a sticker, mark a \"visited\" flag right away so the\n    // tile lights up the next time the user comes back, even if they\n    // didn't go all the way through to a real action on that surface.\n    document.querySelectorAll('.st__sticker').forEach((card) => {\n      card.addEventListener('click', () => {\n        const id = card.getAttribute('data-id');\n        if (!id) return;\n        // Only mark visited if there's no harder evidence already\n        const ev = card.getAttribute('data-evidence') || '';\n        if (!isEarned(ev)) {\n          try { localStorage.setItem(\\`pc:drum-\\${id}:visited\\`, '1'); } catch {}\n        }\n      });\n    });\n\n    paint();\n    // Poll because other tabs might play\n    setInterval(paint, 2000);\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-qesvorth": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="st" id="st-main" data-astro-cid-qesvorth> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "stickers", "data-astro-cid-qesvorth": true })} <header class="st__head" data-astro-cid-qesvorth> <p class="st__kicker" data-astro-cid-qesvorth>DRUM HUB · STICKER BINDER · LOCAL-FIRST · ${STICKERS.length} STICKERS</p> <h1 class="st__title" data-astro-cid-qesvorth><em data-astro-cid-qesvorth>Earn one sticker per room.</em></h1> <p class="st__dek" data-astro-cid-qesvorth>
Twenty-four stickers in the binder, one per drum-hub surface. You earn a sticker by tapping (or singing, or stoking, or boiling) on that surface — your browser remembers. Earned stickers are in full color. Unearned stickers stay grayed out until you visit. No accounts, no chain, no mint — just a friendly local record of where you've been.
</p> <p class="st__progress mono" id="st-progress" data-astro-cid-qesvorth>— / —</p> </header> <section class="st__binder" aria-label="Sticker binder" data-astro-cid-qesvorth> ${STICKERS.map((s) => renderTemplate`<a${addAttribute(`st__sticker st__sticker--${s.shape}`, "class")}${addAttribute(s.href, "href")}${addAttribute(s.id, "data-id")}${addAttribute(s.evidence, "data-evidence")}${addAttribute(`--st-color: ${s.color};`, "style")}${addAttribute(`${s.name} sticker — visit ${s.href}`, "aria-label")} data-astro-cid-qesvorth> <span class="st__sticker-art" aria-hidden="true" data-astro-cid-qesvorth> <span class="st__sticker-shape" data-astro-cid-qesvorth></span> <span class="st__sticker-glyph" data-astro-cid-qesvorth>${s.glyph}</span> </span> <span class="st__sticker-meta" data-astro-cid-qesvorth> <span class="st__sticker-name" data-astro-cid-qesvorth>${s.name}</span> <span class="st__sticker-href mono" data-astro-cid-qesvorth>${s.href}</span> </span> <span class="st__sticker-status mono" data-status="locked" data-astro-cid-qesvorth>UNCOLLECTED</span> </a>`)} </section> <footer class="st__foot" data-astro-cid-qesvorth> <p data-astro-cid-qesvorth>
Stickers detect "you've been here" by reading the same localStorage
        keys the drum surfaces already use. If you've already played, your
        binder fills in automatically on this page load. Tap a grayed-out
        sticker to visit the surface; come back and it'll be in color.
</p> <p class="st__credit mono" data-astro-cid-qesvorth>v0.1 · 2026-04-28 · Mike Hoydich + Claude Code · El Segundo · sprint 3/4</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-stickers.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-stickers.astro";
const $$url = "/drum-stickers";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumStickers,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
