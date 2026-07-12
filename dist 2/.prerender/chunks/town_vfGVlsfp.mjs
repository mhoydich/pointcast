import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, d as defineScriptVars, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Town = createComponent(async ($$result, $$props, $$slots) => {
  const TILE_W = 96;
  const TILE_H = 48;
  const ORIGIN_X = 480;
  const ORIGIN_Y = 120;
  function isoX(gx, gy) {
    return ORIGIN_X + (gx - gy) * (TILE_W / 2);
  }
  function isoY(gx, gy) {
    return ORIGIN_Y + (gx + gy) * (TILE_H / 2);
  }
  const TOWN = [
    // Row 1 — back, far buildings (low gy)
    {
      gx: 0,
      gy: 0,
      height: 110,
      href: "/beacon",
      name: "Lighthouse",
      glyph: "☼",
      roof: "#fff7c2",
      side: "#9a6100",
      face: "#ffd400",
      door: "#1a1a1a",
      ornament: "lamp",
      ornamentColor: "#ffd400",
      category: "civic"
    },
    {
      gx: 1,
      gy: 0,
      height: 130,
      href: "/tv",
      name: "Broadcast Tower",
      glyph: "📡",
      roof: "#cfd6dc",
      side: "#3b3b3b",
      face: "#7f7f7f",
      door: "#1a1a1a",
      ornament: "antenna",
      ornamentColor: "#ff5c23",
      category: "civic"
    },
    {
      gx: 2,
      gy: 0,
      height: 90,
      href: "/archive",
      name: "Library",
      glyph: "📚",
      roof: "#5b3a1a",
      side: "#7d4d1f",
      face: "#c98744",
      door: "#2a1a08",
      ornament: "flag",
      ornamentColor: "#185fa5",
      category: "civic"
    },
    {
      gx: 3,
      gy: 0,
      height: 60,
      href: "/wire",
      name: "Mailbox",
      glyph: "✉",
      roof: "#185fa5",
      side: "#0c356b",
      face: "#3a82c8",
      door: "#fff",
      ornament: "sign",
      ornamentColor: "#ffd400",
      category: "civic"
    },
    // Row 2 — middle row
    {
      gx: 0,
      gy: 1,
      height: 100,
      href: "/residents",
      name: "Town Hall",
      glyph: "⌂",
      roof: "#a83b2a",
      side: "#7a2718",
      face: "#d6745f",
      door: "#2c1108",
      ornament: "dome",
      ornamentColor: "#ffd400",
      category: "civic"
    },
    {
      gx: 1,
      gy: 1,
      height: 95,
      href: "/drum",
      name: "Drum Hall",
      glyph: "♪",
      roof: "#ff5c23",
      side: "#a83207",
      face: "#ffa371",
      door: "#1a1a1a",
      ornament: "spire",
      ornamentColor: "#ffd400",
      category: "play"
    },
    {
      gx: 2,
      gy: 1,
      height: 70,
      href: "/coffee",
      name: "Café",
      glyph: "☕",
      roof: "#7a4a25",
      side: "#3a2110",
      face: "#c1845a",
      door: "#1f1106",
      ornament: "awning",
      ornamentColor: "#a83b2a",
      category: "commerce"
    },
    {
      gx: 3,
      gy: 1,
      height: 75,
      href: "/gallery",
      name: "Gallery",
      glyph: "◇",
      roof: "#f7f3e6",
      side: "#a89878",
      face: "#fffaf0",
      door: "#222",
      ornament: "sign",
      ornamentColor: "#185fa5",
      category: "play"
    },
    // Row 3 — front row
    {
      gx: 0,
      gy: 2,
      height: 80,
      href: "/connectors",
      name: "Agent Gate",
      glyph: "◉",
      roof: "#1a1a1a",
      side: "#000",
      face: "#3a3a3a",
      door: "#ffd400",
      ornament: "gear",
      ornamentColor: "#ffd400",
      category: "agent"
    },
    {
      gx: 1,
      gy: 2,
      height: 85,
      href: "/workbench",
      name: "Workbench",
      glyph: "⚒",
      roof: "#3b6e3b",
      side: "#1d3a1d",
      face: "#5e9e5e",
      door: "#2a1a08",
      ornament: "sign",
      ornamentColor: "#fff",
      category: "civic"
    },
    {
      gx: 2,
      gy: 2,
      height: 36,
      href: "/garden-yield",
      name: "Garden",
      glyph: "🌱",
      roof: "#3b6e3b",
      side: "#274d27",
      face: "#6fb56f",
      door: "#2c1f10",
      ornament: "plot",
      ornamentColor: "#a83b2a",
      category: "nature"
    },
    {
      gx: 3,
      gy: 2,
      height: 32,
      href: "/walk",
      name: "Boardwalk",
      glyph: "〰",
      roof: "#caa672",
      side: "#735428",
      face: "#e8c896",
      door: "#3a2110",
      ornament: "pier",
      ornamentColor: "#185fa5",
      category: "nature"
    }
  ];
  const SVG_W = 1200;
  const SVG_H = 760;
  const buildingIndex = TOWN.map((b) => ({
    name: b.name,
    url: `https://pointcast.xyz${b.href}`,
    category: b.category,
    glyph: b.glyph
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/town",
    name: "PointCast · /town",
    description: "A pixel-art isometric map of PointCast — every building is a real surface, every visitor is a Noun sprite walking between them.",
    url: "https://pointcast.xyz/town",
    hasPart: buildingIndex.map((b) => ({
      "@type": "WebPage",
      "@id": b.url,
      name: b.name,
      url: b.url
    }))
  };
  const alternates = [
    { type: "application/json", href: "/town.json", title: "Town map (JSON)" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "/town — PointCast as a small internet town", "description": "A pixel-art isometric map of PointCast. Every building is a real surface; every visitor is a Noun sprite walking between them. Click a building to enter.", "jsonLd": jsonLd, "alternates": alternates, "frame": {
    image: "https://pointcast.xyz/images/og/og-home-v2.png",
    buttons: [
      { label: "Open /drum", action: "link", target: "https://pointcast.xyz/drum" },
      { label: "Add connector", action: "link", target: "https://pointcast.xyz/connectors" },
      { label: "/agents.json", action: "link", target: "https://pointcast.xyz/agents.json" }
    ]
  }, "data-astro-cid-bseqsgsq": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="town-page" data-sky="day" data-astro-cid-bseqsgsq> <div class="town-frame" data-astro-cid-bseqsgsq> <header class="town-marquee" data-astro-cid-bseqsgsq> <span class="town-marquee__pulse" aria-hidden="true" data-astro-cid-bseqsgsq></span> <span class="town-marquee__text" data-astro-cid-bseqsgsq>\n★ POINTCAST · <strong data-astro-cid-bseqsgsq>/town</strong> · v0.1 — every building is a real surface · every visitor is a Noun sprite · click a building to enter ★\n          live presence: <span id="town-presence-count" data-count="—" data-astro-cid-bseqsgsq>—</span> visiting · drum activity:\n<span id="town-drum-pulse" data-pulse="0" data-astro-cid-bseqsgsq>·</span> </span> </header> <div class="town-stage" role="presentation" data-astro-cid-bseqsgsq> <svg class="town-svg"', ' xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="PointCast town map" role="img" data-astro-cid-bseqsgsq> <defs data-astro-cid-bseqsgsq> <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1" data-astro-cid-bseqsgsq> <stop offset="0%" stop-color="#bfe6ff" id="sky-stop-0" data-astro-cid-bseqsgsq></stop> <stop offset="50%" stop-color="#94d4ff" id="sky-stop-1" data-astro-cid-bseqsgsq></stop> <stop offset="100%" stop-color="#5fbafd" id="sky-stop-2" data-astro-cid-bseqsgsq></stop> </linearGradient> <linearGradient id="water" x1="0" y1="0" x2="0" y2="1" data-astro-cid-bseqsgsq> <stop offset="0%" stop-color="#3a82c8" data-astro-cid-bseqsgsq></stop> <stop offset="100%" stop-color="#0c356b" data-astro-cid-bseqsgsq></stop> </linearGradient> <pattern id="grass" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse" data-astro-cid-bseqsgsq> <rect width="48" height="24" fill="#7fb86e" data-astro-cid-bseqsgsq></rect> <rect x="2" y="6" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> <rect x="14" y="14" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> <rect x="28" y="3" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> <rect x="36" y="18" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> </pattern> <pattern id="road" x="0" y="0" width="16" height="8" patternUnits="userSpaceOnUse" data-astro-cid-bseqsgsq> <rect width="16" height="8" fill="#a89878" data-astro-cid-bseqsgsq></rect> <rect x="6" y="3" width="4" height="1" fill="#fffaf0" data-astro-cid-bseqsgsq></rect> </pattern> <filter id="hardShadow" x="-10%" y="-10%" width="120%" height="120%" data-astro-cid-bseqsgsq> <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#12110e" flood-opacity="0.85" data-astro-cid-bseqsgsq></feDropShadow> </filter> </defs> <!-- Sky --> <rect x="0" y="0"', "", ' fill="url(#sky)" data-astro-cid-bseqsgsq></rect> <!-- Distant sun / moon --> <circle id="town-sun"', "", ' r="34" fill="#ffd400" data-astro-cid-bseqsgsq></circle> <!-- Cloud blobs --> <g class="town-clouds" fill="#ffffff" opacity="0.85" data-astro-cid-bseqsgsq> <ellipse cx="180" cy="80" rx="56" ry="14" data-astro-cid-bseqsgsq></ellipse> <ellipse cx="420" cy="50" rx="38" ry="10" data-astro-cid-bseqsgsq></ellipse> <ellipse cx="700" cy="100" rx="64" ry="14" data-astro-cid-bseqsgsq></ellipse> <ellipse cx="980" cy="60" rx="42" ry="11" data-astro-cid-bseqsgsq></ellipse> </g> <!-- Ground (iso ground polygon spanning the 4×3 grid + margin) --> ', " <!-- Tile grid lines for sim-city texture --> ", " ", " <!-- Roads — central north-south + east-west connecting all rows --> ", " ", " <!-- Buildings — sorted back-to-front by gx+gy so iso depth works --> ", ' <!-- Drum Hall pulse ring (separate g so JS can drive it) --> <g id="drum-pulse" pointer-events="none" data-astro-cid-bseqsgsq> <circle', "", ` r="0" fill="none" stroke="#ff5c23" stroke-width="2" opacity="0.85" data-astro-cid-bseqsgsq></circle> </g> <!-- Visitor sprites get inserted here by JS --> <g id="town-sprites" pointer-events="none" data-astro-cid-bseqsgsq></g> </svg> </div> <footer class="town-foot" data-astro-cid-bseqsgsq> <p class="town-foot__line" data-astro-cid-bseqsgsq> <strong data-astro-cid-bseqsgsq>about /town · </strong>
The town is the website. Click a building to enter the room it stands for. Visitors are little Noun sprites — that's <em data-astro-cid-bseqsgsq>you</em> and everyone else here right now. The drum hall pulses when somebody is playing.
</p> <ul class="town-foot__list" role="list" data-astro-cid-bseqsgsq> `, ' </ul> <p class="town-foot__credit" data-astro-cid-bseqsgsq>\nv0.1 · 2026-04-27 · Mike Hoydich + Claude Code · Tezos · El Segundo · <a href="/agents.json" data-astro-cid-bseqsgsq>/agents.json</a> </p> </footer> </div> </main> <script type="module">', "\n    // ──────────────────────────────────────────────────────────\n    // Visitor sprites — random walk between buildings\n    // ──────────────────────────────────────────────────────────\n    const SVG_NS = 'http://www.w3.org/2000/svg';\n    const sprites = document.getElementById('town-sprites');\n    const presenceCount = document.getElementById('town-presence-count');\n    const drumPulse = document.getElementById('town-drum-pulse');\n    const drumRing = document.querySelector('#drum-pulse circle');\n\n    function isoX(gx, gy) { return isoOrigin.x + (gx - gy) * (isoOrigin.tw / 2); }\n    function isoY(gx, gy) { return isoOrigin.y + (gx + gy) * (isoOrigin.th / 2); }\n\n    // Pick a random ground position (not necessarily inside a building)\n    function randomTownPoint() {\n      const gx = Math.random() * 4 - 0.5;\n      const gy = Math.random() * 3 - 0.5;\n      return { x: isoX(gx, gy), y: isoY(gx, gy) + 8 };\n    }\n\n    // Each visitor → a Noun sprite + a destination + a position\n    const visitorSprites = new Map(); // nounId -> {el, x, y, tx, ty}\n\n    function ensureSprite(nounId, kind) {\n      if (visitorSprites.has(nounId)) return visitorSprites.get(nounId);\n      const g = document.createElementNS(SVG_NS, 'g');\n      g.setAttribute('class', `town-sprite town-sprite--${kind}`);\n      g.setAttribute('data-noun', String(nounId));\n\n      const img = document.createElementNS(SVG_NS, 'image');\n      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `https://noun.pics/${nounId}.svg`);\n      img.setAttribute('href', `https://noun.pics/${nounId}.svg`);\n      img.setAttribute('width', '20');\n      img.setAttribute('height', '20');\n      img.setAttribute('x', '-10');\n      img.setAttribute('y', '-22');\n      g.appendChild(img);\n\n      // Tiny shadow under sprite\n      const s = document.createElementNS(SVG_NS, 'ellipse');\n      s.setAttribute('rx', '6'); s.setAttribute('ry', '2.5');\n      s.setAttribute('fill', '#12110e'); s.setAttribute('opacity', '0.3');\n      s.setAttribute('cx', '0'); s.setAttribute('cy', '0');\n      g.insertBefore(s, img);\n\n      // Kind badge for agents\n      if (kind === 'agent') {\n        const badge = document.createElementNS(SVG_NS, 'circle');\n        badge.setAttribute('r', '3'); badge.setAttribute('fill', '#ffd400');\n        badge.setAttribute('stroke', '#12110e'); badge.setAttribute('stroke-width', '0.8');\n        badge.setAttribute('cx', '8'); badge.setAttribute('cy', '-22');\n        g.appendChild(badge);\n      }\n\n      const start = randomTownPoint();\n      const target = randomTownPoint();\n      const state = { el: g, x: start.x, y: start.y, tx: target.x, ty: target.y, kind };\n      visitorSprites.set(nounId, state);\n      sprites.appendChild(g);\n      g.setAttribute('transform', `translate(${state.x},${state.y})`);\n      return state;\n    }\n\n    function tickSprites() {\n      const speed = 0.5;\n      visitorSprites.forEach((s) => {\n        const dx = s.tx - s.x;\n        const dy = s.ty - s.y;\n        const d = Math.hypot(dx, dy);\n        if (d < 1.2) {\n          const nxt = randomTownPoint();\n          s.tx = nxt.x; s.ty = nxt.y;\n        } else {\n          s.x += (dx / d) * speed;\n          s.y += (dy / d) * speed;\n        }\n        s.el.setAttribute('transform', `translate(${s.x.toFixed(1)},${s.y.toFixed(1)})`);\n      });\n      requestAnimationFrame(tickSprites);\n    }\n    requestAnimationFrame(tickSprites);\n\n    async function pollPresence() {\n      try {\n        const r = await fetch('/api/presence/snapshot', { cache: 'no-store' });\n        if (!r.ok) return;\n        const data = await r.json();\n        const sessions = data.sessions || [];\n        const live = new Set();\n        for (const s of sessions) {\n          if (typeof s.nounId !== 'number') continue;\n          ensureSprite(s.nounId, s.kind || 'human');\n          live.add(s.nounId);\n        }\n        // remove sprites no longer present\n        for (const [id, st] of visitorSprites.entries()) {\n          if (!live.has(id)) { st.el.remove(); visitorSprites.delete(id); }\n        }\n        const total = (data.humans ?? 0) + (data.agents ?? 0);\n        if (presenceCount) {\n          presenceCount.textContent = String(total);\n          presenceCount.dataset.count = String(total);\n        }\n      } catch {}\n    }\n    pollPresence();\n    setInterval(pollPresence, 4000);\n\n    // ──────────────────────────────────────────────────────────\n    // Drum activity pulse — Drum Hall ring grows on /api/sounds events\n    // ──────────────────────────────────────────────────────────\n    let lastSoundsTs = 0;\n    let lastEventCount = 0;\n    async function pollSounds() {\n      try {\n        const r = await fetch(`/api/sounds?since=${lastSoundsTs}`, { cache: 'no-store' });\n        if (!r.ok) return;\n        const data = await r.json();\n        const events = data.events || [];\n        if (events.length) {\n          lastSoundsTs = events[events.length - 1].ts || Date.now();\n          lastEventCount += events.length;\n          if (drumRing) {\n            drumRing.setAttribute('r', '0');\n            drumRing.setAttribute('opacity', '0.85');\n            const start = performance.now();\n            const grow = (now) => {\n              const t = (now - start) / 800;\n              if (t > 1) { drumRing.setAttribute('r', '0'); drumRing.setAttribute('opacity', '0'); return; }\n              drumRing.setAttribute('r', String(60 * t));\n              drumRing.setAttribute('opacity', String(0.85 * (1 - t)));\n              requestAnimationFrame(grow);\n            };\n            requestAnimationFrame(grow);\n          }\n          if (drumPulse) {\n            drumPulse.textContent = '♪'.repeat(Math.min(events.length, 6));\n            drumPulse.dataset.pulse = String(events.length);\n            setTimeout(() => { drumPulse.textContent = '·'; drumPulse.dataset.pulse = '0'; }, 600);\n          }\n        }\n      } catch {}\n    }\n    pollSounds();\n    setInterval(pollSounds, 1500);\n\n    // ──────────────────────────────────────────────────────────\n    // Sky color by PT local hour\n    // ──────────────────────────────────────────────────────────\n    const skyStops = [\n      document.getElementById('sky-stop-0'),\n      document.getElementById('sky-stop-1'),\n      document.getElementById('sky-stop-2'),\n    ];\n    const sun = document.getElementById('town-sun');\n    const skies = {\n      dawn:  ['#ffe8b3', '#ffc69a', '#fda58a'],\n      day:   ['#bfe6ff', '#94d4ff', '#5fbafd'],\n      dusk:  ['#ffb070', '#e96a59', '#7a3d80'],\n      night: ['#0c1d3a', '#0a1228', '#050810'],\n    };\n    function pickSky() {\n      const ptStr = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false });\n      const h = Number(ptStr.match(/(\\d{1,2}):/)?.[1] ?? new Date().getHours());\n      if (h >= 5 && h < 8) return ['dawn', '#ffd400'];\n      if (h >= 8 && h < 17) return ['day', '#ffd400'];\n      if (h >= 17 && h < 20) return ['dusk', '#ffb070'];\n      return ['night', '#fffaf0'];\n    }\n    function applySky() {\n      const [bucket, sunColor] = pickSky();\n      const colors = skies[bucket];\n      if (skyStops[0] && colors) skyStops.forEach((s, i) => s && s.setAttribute('stop-color', colors[i]));\n      if (sun) sun.setAttribute('fill', sunColor);\n      document.querySelector('.town-page')?.setAttribute('data-sky', bucket);\n    }\n    applySky();\n    setInterval(applySky, 60000);\n  <\/script> "], [" ", '<main class="town-page" data-sky="day" data-astro-cid-bseqsgsq> <div class="town-frame" data-astro-cid-bseqsgsq> <header class="town-marquee" data-astro-cid-bseqsgsq> <span class="town-marquee__pulse" aria-hidden="true" data-astro-cid-bseqsgsq></span> <span class="town-marquee__text" data-astro-cid-bseqsgsq>\n★ POINTCAST · <strong data-astro-cid-bseqsgsq>/town</strong> · v0.1 — every building is a real surface · every visitor is a Noun sprite · click a building to enter ★\n          live presence: <span id="town-presence-count" data-count="—" data-astro-cid-bseqsgsq>—</span> visiting · drum activity:\n<span id="town-drum-pulse" data-pulse="0" data-astro-cid-bseqsgsq>·</span> </span> </header> <div class="town-stage" role="presentation" data-astro-cid-bseqsgsq> <svg class="town-svg"', ' xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="PointCast town map" role="img" data-astro-cid-bseqsgsq> <defs data-astro-cid-bseqsgsq> <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1" data-astro-cid-bseqsgsq> <stop offset="0%" stop-color="#bfe6ff" id="sky-stop-0" data-astro-cid-bseqsgsq></stop> <stop offset="50%" stop-color="#94d4ff" id="sky-stop-1" data-astro-cid-bseqsgsq></stop> <stop offset="100%" stop-color="#5fbafd" id="sky-stop-2" data-astro-cid-bseqsgsq></stop> </linearGradient> <linearGradient id="water" x1="0" y1="0" x2="0" y2="1" data-astro-cid-bseqsgsq> <stop offset="0%" stop-color="#3a82c8" data-astro-cid-bseqsgsq></stop> <stop offset="100%" stop-color="#0c356b" data-astro-cid-bseqsgsq></stop> </linearGradient> <pattern id="grass" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse" data-astro-cid-bseqsgsq> <rect width="48" height="24" fill="#7fb86e" data-astro-cid-bseqsgsq></rect> <rect x="2" y="6" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> <rect x="14" y="14" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> <rect x="28" y="3" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> <rect x="36" y="18" width="2" height="2" fill="#5e9e5e" data-astro-cid-bseqsgsq></rect> </pattern> <pattern id="road" x="0" y="0" width="16" height="8" patternUnits="userSpaceOnUse" data-astro-cid-bseqsgsq> <rect width="16" height="8" fill="#a89878" data-astro-cid-bseqsgsq></rect> <rect x="6" y="3" width="4" height="1" fill="#fffaf0" data-astro-cid-bseqsgsq></rect> </pattern> <filter id="hardShadow" x="-10%" y="-10%" width="120%" height="120%" data-astro-cid-bseqsgsq> <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#12110e" flood-opacity="0.85" data-astro-cid-bseqsgsq></feDropShadow> </filter> </defs> <!-- Sky --> <rect x="0" y="0"', "", ' fill="url(#sky)" data-astro-cid-bseqsgsq></rect> <!-- Distant sun / moon --> <circle id="town-sun"', "", ' r="34" fill="#ffd400" data-astro-cid-bseqsgsq></circle> <!-- Cloud blobs --> <g class="town-clouds" fill="#ffffff" opacity="0.85" data-astro-cid-bseqsgsq> <ellipse cx="180" cy="80" rx="56" ry="14" data-astro-cid-bseqsgsq></ellipse> <ellipse cx="420" cy="50" rx="38" ry="10" data-astro-cid-bseqsgsq></ellipse> <ellipse cx="700" cy="100" rx="64" ry="14" data-astro-cid-bseqsgsq></ellipse> <ellipse cx="980" cy="60" rx="42" ry="11" data-astro-cid-bseqsgsq></ellipse> </g> <!-- Ground (iso ground polygon spanning the 4×3 grid + margin) --> ', " <!-- Tile grid lines for sim-city texture --> ", " ", " <!-- Roads — central north-south + east-west connecting all rows --> ", " ", " <!-- Buildings — sorted back-to-front by gx+gy so iso depth works --> ", ' <!-- Drum Hall pulse ring (separate g so JS can drive it) --> <g id="drum-pulse" pointer-events="none" data-astro-cid-bseqsgsq> <circle', "", ` r="0" fill="none" stroke="#ff5c23" stroke-width="2" opacity="0.85" data-astro-cid-bseqsgsq></circle> </g> <!-- Visitor sprites get inserted here by JS --> <g id="town-sprites" pointer-events="none" data-astro-cid-bseqsgsq></g> </svg> </div> <footer class="town-foot" data-astro-cid-bseqsgsq> <p class="town-foot__line" data-astro-cid-bseqsgsq> <strong data-astro-cid-bseqsgsq>about /town · </strong>
The town is the website. Click a building to enter the room it stands for. Visitors are little Noun sprites — that's <em data-astro-cid-bseqsgsq>you</em> and everyone else here right now. The drum hall pulses when somebody is playing.
</p> <ul class="town-foot__list" role="list" data-astro-cid-bseqsgsq> `, ' </ul> <p class="town-foot__credit" data-astro-cid-bseqsgsq>\nv0.1 · 2026-04-27 · Mike Hoydich + Claude Code · Tezos · El Segundo · <a href="/agents.json" data-astro-cid-bseqsgsq>/agents.json</a> </p> </footer> </div> </main> <script type="module">', "\n    // ──────────────────────────────────────────────────────────\n    // Visitor sprites — random walk between buildings\n    // ──────────────────────────────────────────────────────────\n    const SVG_NS = 'http://www.w3.org/2000/svg';\n    const sprites = document.getElementById('town-sprites');\n    const presenceCount = document.getElementById('town-presence-count');\n    const drumPulse = document.getElementById('town-drum-pulse');\n    const drumRing = document.querySelector('#drum-pulse circle');\n\n    function isoX(gx, gy) { return isoOrigin.x + (gx - gy) * (isoOrigin.tw / 2); }\n    function isoY(gx, gy) { return isoOrigin.y + (gx + gy) * (isoOrigin.th / 2); }\n\n    // Pick a random ground position (not necessarily inside a building)\n    function randomTownPoint() {\n      const gx = Math.random() * 4 - 0.5;\n      const gy = Math.random() * 3 - 0.5;\n      return { x: isoX(gx, gy), y: isoY(gx, gy) + 8 };\n    }\n\n    // Each visitor → a Noun sprite + a destination + a position\n    const visitorSprites = new Map(); // nounId -> {el, x, y, tx, ty}\n\n    function ensureSprite(nounId, kind) {\n      if (visitorSprites.has(nounId)) return visitorSprites.get(nounId);\n      const g = document.createElementNS(SVG_NS, 'g');\n      g.setAttribute('class', \\`town-sprite town-sprite--\\${kind}\\`);\n      g.setAttribute('data-noun', String(nounId));\n\n      const img = document.createElementNS(SVG_NS, 'image');\n      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', \\`https://noun.pics/\\${nounId}.svg\\`);\n      img.setAttribute('href', \\`https://noun.pics/\\${nounId}.svg\\`);\n      img.setAttribute('width', '20');\n      img.setAttribute('height', '20');\n      img.setAttribute('x', '-10');\n      img.setAttribute('y', '-22');\n      g.appendChild(img);\n\n      // Tiny shadow under sprite\n      const s = document.createElementNS(SVG_NS, 'ellipse');\n      s.setAttribute('rx', '6'); s.setAttribute('ry', '2.5');\n      s.setAttribute('fill', '#12110e'); s.setAttribute('opacity', '0.3');\n      s.setAttribute('cx', '0'); s.setAttribute('cy', '0');\n      g.insertBefore(s, img);\n\n      // Kind badge for agents\n      if (kind === 'agent') {\n        const badge = document.createElementNS(SVG_NS, 'circle');\n        badge.setAttribute('r', '3'); badge.setAttribute('fill', '#ffd400');\n        badge.setAttribute('stroke', '#12110e'); badge.setAttribute('stroke-width', '0.8');\n        badge.setAttribute('cx', '8'); badge.setAttribute('cy', '-22');\n        g.appendChild(badge);\n      }\n\n      const start = randomTownPoint();\n      const target = randomTownPoint();\n      const state = { el: g, x: start.x, y: start.y, tx: target.x, ty: target.y, kind };\n      visitorSprites.set(nounId, state);\n      sprites.appendChild(g);\n      g.setAttribute('transform', \\`translate(\\${state.x},\\${state.y})\\`);\n      return state;\n    }\n\n    function tickSprites() {\n      const speed = 0.5;\n      visitorSprites.forEach((s) => {\n        const dx = s.tx - s.x;\n        const dy = s.ty - s.y;\n        const d = Math.hypot(dx, dy);\n        if (d < 1.2) {\n          const nxt = randomTownPoint();\n          s.tx = nxt.x; s.ty = nxt.y;\n        } else {\n          s.x += (dx / d) * speed;\n          s.y += (dy / d) * speed;\n        }\n        s.el.setAttribute('transform', \\`translate(\\${s.x.toFixed(1)},\\${s.y.toFixed(1)})\\`);\n      });\n      requestAnimationFrame(tickSprites);\n    }\n    requestAnimationFrame(tickSprites);\n\n    async function pollPresence() {\n      try {\n        const r = await fetch('/api/presence/snapshot', { cache: 'no-store' });\n        if (!r.ok) return;\n        const data = await r.json();\n        const sessions = data.sessions || [];\n        const live = new Set();\n        for (const s of sessions) {\n          if (typeof s.nounId !== 'number') continue;\n          ensureSprite(s.nounId, s.kind || 'human');\n          live.add(s.nounId);\n        }\n        // remove sprites no longer present\n        for (const [id, st] of visitorSprites.entries()) {\n          if (!live.has(id)) { st.el.remove(); visitorSprites.delete(id); }\n        }\n        const total = (data.humans ?? 0) + (data.agents ?? 0);\n        if (presenceCount) {\n          presenceCount.textContent = String(total);\n          presenceCount.dataset.count = String(total);\n        }\n      } catch {}\n    }\n    pollPresence();\n    setInterval(pollPresence, 4000);\n\n    // ──────────────────────────────────────────────────────────\n    // Drum activity pulse — Drum Hall ring grows on /api/sounds events\n    // ──────────────────────────────────────────────────────────\n    let lastSoundsTs = 0;\n    let lastEventCount = 0;\n    async function pollSounds() {\n      try {\n        const r = await fetch(\\`/api/sounds?since=\\${lastSoundsTs}\\`, { cache: 'no-store' });\n        if (!r.ok) return;\n        const data = await r.json();\n        const events = data.events || [];\n        if (events.length) {\n          lastSoundsTs = events[events.length - 1].ts || Date.now();\n          lastEventCount += events.length;\n          if (drumRing) {\n            drumRing.setAttribute('r', '0');\n            drumRing.setAttribute('opacity', '0.85');\n            const start = performance.now();\n            const grow = (now) => {\n              const t = (now - start) / 800;\n              if (t > 1) { drumRing.setAttribute('r', '0'); drumRing.setAttribute('opacity', '0'); return; }\n              drumRing.setAttribute('r', String(60 * t));\n              drumRing.setAttribute('opacity', String(0.85 * (1 - t)));\n              requestAnimationFrame(grow);\n            };\n            requestAnimationFrame(grow);\n          }\n          if (drumPulse) {\n            drumPulse.textContent = '♪'.repeat(Math.min(events.length, 6));\n            drumPulse.dataset.pulse = String(events.length);\n            setTimeout(() => { drumPulse.textContent = '·'; drumPulse.dataset.pulse = '0'; }, 600);\n          }\n        }\n      } catch {}\n    }\n    pollSounds();\n    setInterval(pollSounds, 1500);\n\n    // ──────────────────────────────────────────────────────────\n    // Sky color by PT local hour\n    // ──────────────────────────────────────────────────────────\n    const skyStops = [\n      document.getElementById('sky-stop-0'),\n      document.getElementById('sky-stop-1'),\n      document.getElementById('sky-stop-2'),\n    ];\n    const sun = document.getElementById('town-sun');\n    const skies = {\n      dawn:  ['#ffe8b3', '#ffc69a', '#fda58a'],\n      day:   ['#bfe6ff', '#94d4ff', '#5fbafd'],\n      dusk:  ['#ffb070', '#e96a59', '#7a3d80'],\n      night: ['#0c1d3a', '#0a1228', '#050810'],\n    };\n    function pickSky() {\n      const ptStr = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false });\n      const h = Number(ptStr.match(/(\\\\d{1,2}):/)?.[1] ?? new Date().getHours());\n      if (h >= 5 && h < 8) return ['dawn', '#ffd400'];\n      if (h >= 8 && h < 17) return ['day', '#ffd400'];\n      if (h >= 17 && h < 20) return ['dusk', '#ffb070'];\n      return ['night', '#fffaf0'];\n    }\n    function applySky() {\n      const [bucket, sunColor] = pickSky();\n      const colors = skies[bucket];\n      if (skyStops[0] && colors) skyStops.forEach((s, i) => s && s.setAttribute('stop-color', colors[i]));\n      if (sun) sun.setAttribute('fill', sunColor);\n      document.querySelector('.town-page')?.setAttribute('data-sky', bucket);\n    }\n    applySky();\n    setInterval(applySky, 60000);\n  <\/script> "])), maybeRenderHead(), addAttribute(`0 0 ${SVG_W} ${SVG_H}`, "viewBox"), addAttribute(SVG_W, "width"), addAttribute(SVG_H * 0.45, "height"), addAttribute(SVG_W * 0.78, "cx"), addAttribute(SVG_H * 0.12, "cy"), (() => {
    const a = { x: isoX(-1, -1), y: isoY(-1, -1) };
    const b = { x: isoX(4, -1), y: isoY(4, -1) };
    const c = { x: isoX(4, 3), y: isoY(4, 3) };
    const d = { x: isoX(-1, 3), y: isoY(-1, 3) };
    const points = `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;
    return renderTemplate`<polygon${addAttribute(points, "points")} fill="url(#grass)" stroke="#3a5a2c" stroke-width="1.5" data-astro-cid-bseqsgsq></polygon>`;
  })(), Array.from({ length: 5 }).map((_, gx) => renderTemplate`<line${addAttribute(isoX(gx - 1, -1), "x1")}${addAttribute(isoY(gx - 1, -1), "y1")}${addAttribute(isoX(gx - 1, 3), "x2")}${addAttribute(isoY(gx - 1, 3), "y2")} stroke="#5e9e5e" stroke-width="0.5" stroke-dasharray="2 4" data-astro-cid-bseqsgsq></line>`), Array.from({ length: 5 }).map((_, gy) => renderTemplate`<line${addAttribute(isoX(-1, gy - 1), "x1")}${addAttribute(isoY(-1, gy - 1), "y1")}${addAttribute(isoX(4, gy - 1), "x2")}${addAttribute(isoY(4, gy - 1), "y2")} stroke="#5e9e5e" stroke-width="0.5" stroke-dasharray="2 4" data-astro-cid-bseqsgsq></line>`), (() => {
    const y = 1.55;
    const a = { x: isoX(-1, y), y: isoY(-1, y) };
    const b = { x: isoX(4, y), y: isoY(4, y) };
    return renderTemplate`<line${addAttribute(a.x, "x1")}${addAttribute(a.y, "y1")}${addAttribute(b.x, "x2")}${addAttribute(b.y, "y2")} stroke="#a89878" stroke-width="14" stroke-linecap="round" data-astro-cid-bseqsgsq></line>`;
  })(), (() => {
    const x = 1.55;
    const a = { x: isoX(x, -1), y: isoY(x, -1) };
    const b = { x: isoX(x, 3), y: isoY(x, 3) };
    return renderTemplate`<line${addAttribute(a.x, "x1")}${addAttribute(a.y, "y1")}${addAttribute(b.x, "x2")}${addAttribute(b.y, "y2")} stroke="#a89878" stroke-width="14" stroke-linecap="round" data-astro-cid-bseqsgsq></line>`;
  })(), [...TOWN].sort((a, b) => a.gx + a.gy - (b.gx + b.gy)).map((b, i) => {
    const cx = isoX(b.gx, b.gy);
    const cy = isoY(b.gx, b.gy);
    const halfW = (b.width ?? 0.78) * (TILE_W / 2);
    const halfH = (b.depth ?? 0.78) * (TILE_H / 2);
    const t = { x: cx, y: cy - b.height };
    const tL = { x: cx - halfW, y: cy - b.height + halfH };
    const tF = { x: cx, y: cy - b.height + halfH * 2 };
    const tR = { x: cx + halfW, y: cy - b.height + halfH };
    const bL = { x: cx - halfW, y: cy + halfH };
    const bF = { x: cx, y: cy + halfH * 2 };
    const bR = { x: cx + halfW, y: cy + halfH };
    const roofPath = `M${t.x},${t.y} L${tR.x},${tR.y} L${tF.x},${tF.y} L${tL.x},${tL.y} Z`;
    const leftPath = `M${tL.x},${tL.y} L${tF.x},${tF.y} L${bF.x},${bF.y} L${bL.x},${bL.y} Z`;
    const rightPath = `M${tF.x},${tF.y} L${tR.x},${tR.y} L${bR.x},${bR.y} L${bF.x},${bF.y} Z`;
    const doorW = 14;
    const doorH = Math.min(28, b.height * 0.35);
    const doorCx = (tF.x + tR.x + bF.x + bR.x) / 4;
    const doorCy = bR.y - doorH / 2 - 4;
    const doorY0 = doorCy - doorH / 2;
    const doorX0 = doorCx - doorW / 2;
    const top = { cx, cy: cy - b.height };
    return renderTemplate`<a${addAttribute(b.href, "href")} class="town-building"${addAttribute(b.name, "data-name")}${addAttribute(b.href, "data-href")} data-astro-cid-bseqsgsq> <title>${b.name} → ${b.href}</title>  <ellipse${addAttribute(cx + 4, "cx")}${addAttribute(bF.y - 2, "cy")}${addAttribute(halfW * 0.95, "rx")}${addAttribute(halfH * 0.7, "ry")} fill="#12110e" opacity="0.18" data-astro-cid-bseqsgsq></ellipse>  <path${addAttribute(leftPath, "d")}${addAttribute(b.side, "fill")} stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></path> <path${addAttribute(rightPath, "d")}${addAttribute(b.face, "fill")} stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></path> <path${addAttribute(roofPath, "d")}${addAttribute(b.roof, "fill")} stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></path>  <rect${addAttribute(tL.x + 6, "x")}${addAttribute(tL.y + (bL.y - tL.y) * 0.25, "y")} width="12" height="10" fill="#cfe9ff" stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></rect>  <line${addAttribute(tL.x + 12, "x1")}${addAttribute(tL.y + (bL.y - tL.y) * 0.25, "y1")}${addAttribute(tL.x + 12, "x2")}${addAttribute(tL.y + (bL.y - tL.y) * 0.25 + 10, "y2")} stroke="#12110e" stroke-width="0.8" data-astro-cid-bseqsgsq></line>  ${b.height > 40 && renderTemplate`<rect${addAttribute(doorX0, "x")}${addAttribute(doorY0, "y")}${addAttribute(doorW, "width")}${addAttribute(doorH, "height")}${addAttribute(b.door, "fill")} stroke="#12110e" stroke-width="1" rx="1" data-astro-cid-bseqsgsq></rect>`}  ${b.height > 40 && renderTemplate`<g data-astro-cid-bseqsgsq> <rect${addAttribute(doorCx - 18, "x")}${addAttribute(doorY0 - 18, "y")} width="36" height="14" fill="#fffaf0" stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></rect> <text${addAttribute(doorCx, "x")}${addAttribute(doorY0 - 7, "y")} text-anchor="middle" font-size="11" font-family="JetBrains Mono, ui-monospace, monospace" fill="#12110e" font-weight="700" data-astro-cid-bseqsgsq> ${b.glyph} </text> </g>`}  ${b.ornament === "antenna" && renderTemplate`<g data-astro-cid-bseqsgsq> <line${addAttribute(top.cx, "x1")}${addAttribute(top.cy, "y1")}${addAttribute(top.cx, "x2")}${addAttribute(top.cy - 56, "y2")} stroke="#3a3a3a" stroke-width="2" data-astro-cid-bseqsgsq></line> <circle${addAttribute(top.cx, "cx")}${addAttribute(top.cy - 56, "cy")} r="4"${addAttribute(b.ornamentColor || "#ff5c23", "fill")} data-astro-cid-bseqsgsq> <animate attributeName="r" values="3;6;3" dur="1.4s" repeatCount="indefinite" data-astro-cid-bseqsgsq></animate> </circle> </g>`} ${b.ornament === "lamp" && renderTemplate`<g data-astro-cid-bseqsgsq> <rect${addAttribute(top.cx - 10, "x")}${addAttribute(top.cy - 22, "y")} width="20" height="14" fill="#1a1a1a" stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></rect> <circle${addAttribute(top.cx, "cx")}${addAttribute(top.cy - 15, "cy")} r="6"${addAttribute(b.ornamentColor || "#ffd400", "fill")} data-astro-cid-bseqsgsq> <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" data-astro-cid-bseqsgsq></animate> </circle> </g>`} ${b.ornament === "dome" && renderTemplate`<g data-astro-cid-bseqsgsq> <ellipse${addAttribute(top.cx, "cx")}${addAttribute(top.cy - 4, "cy")} rx="14" ry="9"${addAttribute(b.ornamentColor || "#ffd400", "fill")} stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></ellipse> <line${addAttribute(top.cx, "x1")}${addAttribute(top.cy - 13, "y1")}${addAttribute(top.cx, "x2")}${addAttribute(top.cy - 28, "y2")} stroke="#12110e" stroke-width="1.4" data-astro-cid-bseqsgsq></line> <circle${addAttribute(top.cx, "cx")}${addAttribute(top.cy - 30, "cy")} r="2.5" fill="#12110e" data-astro-cid-bseqsgsq></circle> </g>`} ${b.ornament === "awning" && renderTemplate`<g data-astro-cid-bseqsgsq> <path${addAttribute(`M${tF.x - halfW * 0.7},${tF.y} L${tF.x + halfW * 0.7},${tF.y} L${tF.x + halfW * 0.5},${tF.y + 8} L${tF.x - halfW * 0.5},${tF.y + 8} Z`, "d")}${addAttribute(b.ornamentColor || "#a83b2a", "fill")} stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></path> </g>`} ${b.ornament === "gear" && renderTemplate`<g data-astro-cid-bseqsgsq> <circle${addAttribute(top.cx, "cx")}${addAttribute(top.cy - 8, "cy")} r="11" fill="#1a1a1a" stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></circle> <circle${addAttribute(top.cx, "cx")}${addAttribute(top.cy - 8, "cy")} r="4"${addAttribute(b.ornamentColor || "#ffd400", "fill")} data-astro-cid-bseqsgsq></circle> ${Array.from({ length: 8 }).map((_, k) => {
      const ang = k / 8 * Math.PI * 2;
      const x1 = top.cx + Math.cos(ang) * 11;
      const y1 = top.cy - 8 + Math.sin(ang) * 11;
      const x2 = top.cx + Math.cos(ang) * 14;
      const y2 = top.cy - 8 + Math.sin(ang) * 14;
      return renderTemplate`<line${addAttribute(x1, "x1")}${addAttribute(y1, "y1")}${addAttribute(x2, "x2")}${addAttribute(y2, "y2")} stroke="#1a1a1a" stroke-width="2" data-astro-cid-bseqsgsq></line>`;
    })} </g>`} ${b.ornament === "flag" && renderTemplate`<g data-astro-cid-bseqsgsq> <line${addAttribute(top.cx, "x1")}${addAttribute(top.cy, "y1")}${addAttribute(top.cx, "x2")}${addAttribute(top.cy - 24, "y2")} stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></line> <polygon${addAttribute(`${top.cx},${top.cy - 24} ${top.cx + 14},${top.cy - 20} ${top.cx},${top.cy - 16}`, "points")}${addAttribute(b.ornamentColor || "#185fa5", "fill")} stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></polygon> </g>`} ${b.ornament === "sign" && renderTemplate`<g data-astro-cid-bseqsgsq> <rect${addAttribute(top.cx - 14, "x")}${addAttribute(top.cy - 20, "y")} width="28" height="10"${addAttribute(b.ornamentColor || "#185fa5", "fill")} stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></rect> </g>`} ${b.ornament === "spire" && renderTemplate`<g data-astro-cid-bseqsgsq> <polygon${addAttribute(`${top.cx - 8},${top.cy} ${top.cx + 8},${top.cy} ${top.cx},${top.cy - 30}`, "points")}${addAttribute(b.ornamentColor || "#ffd400", "fill")} stroke="#12110e" stroke-width="1.5" data-astro-cid-bseqsgsq></polygon> </g>`} ${b.ornament === "pier" && renderTemplate`<g data-astro-cid-bseqsgsq> <rect${addAttribute(cx - 4, "x")}${addAttribute(bR.y - 6, "y")} width="80" height="6" fill="#735428" stroke="#12110e" stroke-width="1" data-astro-cid-bseqsgsq></rect> </g>`} ${b.ornament === "plot" && renderTemplate`<g data-astro-cid-bseqsgsq> ${Array.from({ length: 5 }).map((_, k) => renderTemplate`<g data-astro-cid-bseqsgsq> <rect${addAttribute(tL.x + 6 + k * 9, "x")}${addAttribute(tL.y - 4, "y")} width="2" height="6" fill="#3a5a2c" data-astro-cid-bseqsgsq></rect> <circle${addAttribute(tL.x + 7 + k * 9, "cx")}${addAttribute(tL.y - 6, "cy")} r="2.5"${addAttribute(b.ornamentColor || "#a83b2a", "fill")} data-astro-cid-bseqsgsq></circle> </g>`)} </g>`}  <g class="town-building__label" data-astro-cid-bseqsgsq> <rect${addAttribute(cx - 44, "x")}${addAttribute(bF.y + 4, "y")} width="88" height="14" fill="#fffaf0" stroke="#12110e" stroke-width="1.2" data-astro-cid-bseqsgsq></rect> <text${addAttribute(cx, "x")}${addAttribute(bF.y + 14, "y")} text-anchor="middle" font-size="9" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="700" fill="#12110e" letter-spacing="0.04em" data-astro-cid-bseqsgsq> ${b.name.toUpperCase()} </text> </g> </a>`;
  }), addAttribute(isoX(1, 1), "cx"), addAttribute(isoY(1, 1), "cy"), TOWN.map((b) => renderTemplate`<li data-astro-cid-bseqsgsq><a${addAttribute(b.href, "href")} data-astro-cid-bseqsgsq><span aria-hidden="true" data-astro-cid-bseqsgsq>${b.glyph}</span> ${b.name} <code data-astro-cid-bseqsgsq>${b.href}</code></a></li>`), defineScriptVars({ TOWN, isoOrigin: { x: ORIGIN_X, y: ORIGIN_Y, tw: TILE_W, th: TILE_H } })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/town.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/town.astro";
const $$url = "/town";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Town,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
