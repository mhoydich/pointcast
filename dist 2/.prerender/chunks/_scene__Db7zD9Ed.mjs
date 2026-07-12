import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, F as Fragment, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';

function getStaticPaths() {
  const PIDS = ["daybreak", "crystal", "kelp", "coral", "abyss", "storm", "lagoon", "nighttide"];
  const SIDS = ["waves", "starfield", "mystify", "bounce", "pipes", "tessellate"];
  const out = [];
  for (const p of PIDS) for (const s of SIDS) {
    out.push({ params: { palette: p, scene: s } });
  }
  return out;
}
const $$scene = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$scene;
  const PALETTES = [
    { id: "daybreak", name: "DAYBREAK", sky: "#FFD4C2", water: "#F4A78D", foam: "#FFE9D8", orb: "#FFB496", wave1: "#E08F73", wave2: "#C4715A", wave3: "#AA5443", dark: false, dek: "pearl pink · soft peach · lavender mist" },
    { id: "crystal", name: "CRYSTAL", sky: "#BFEFEC", water: "#7FE5DC", foam: "#F4FBFA", orb: "#FFFFFF", wave1: "#5DCBC0", wave2: "#3FA89C", wave3: "#1F8579", dark: false, dek: "aquamarine · soft cyan · white foam" },
    { id: "kelp", name: "KELP", sky: "#9FB28A", water: "#5C7A4E", foam: "#E0D4B8", orb: "#D9C46E", wave1: "#3F5E33", wave2: "#2A4424", wave3: "#1A2E18", dark: false, dek: "sage canopy · deep green · amber kelp" },
    { id: "coral", name: "CORAL", sky: "#FFC4B0", water: "#FF8675", foam: "#FFE0D6", orb: "#FFEEC2", wave1: "#E76B5C", wave2: "#C4493D", wave3: "#9B2D24", dark: false, dek: "coral pink · dusty rose · lavender" },
    { id: "abyss", name: "ABYSS", sky: "#1E2D5C", water: "#0A1F3A", foam: "#2EC4B6", orb: "#88E0D4", wave1: "#0E2548", wave2: "#06162D", wave3: "#020912", dark: true, dek: "midnight indigo · abyssal navy · phosphor teal" },
    { id: "storm", name: "STORM", sky: "#5A6470", water: "#2C2E33", foam: "#FFE15D", orb: "#FFE15D", wave1: "#1E2025", wave2: "#16181C", wave3: "#0C0E12", dark: true, dek: "slate · charcoal · lightning" },
    { id: "lagoon", name: "LAGOON", sky: "#A0E6DC", water: "#2EC4B6", foam: "#F5DEA8", orb: "#F5DEA8", wave1: "#26A89C", wave2: "#188076", wave3: "#0F5C55", dark: false, dek: "turquoise · teal · warm sand" },
    { id: "nighttide", name: "NIGHTTIDE", sky: "#3A0E5C", water: "#0E1845", foam: "#FF1493", orb: "#FF69B4", wave1: "#3D1276", wave2: "#1F1054", wave3: "#0A0830", dark: true, dek: "electric magenta · hot pink · deep ocean" }
  ];
  const SCENES = [
    { id: "waves", name: "WAVES", blurb: "sky · parallax wave layers · drifting orb · rising foam" },
    { id: "starfield", name: "STARFIELD", blurb: "warp-speed canvas particles flowing toward the viewer" },
    { id: "mystify", name: "MYSTIFY", blurb: "after-dark polylines bouncing inside the viewport" },
    { id: "bounce", name: "BOUNCE", blurb: "DVD-logo classic with a TIDE wordmark · color-cycles on hits" },
    { id: "pipes", name: "PIPES", blurb: "after-dark maze of growing palette-tinted pipes" },
    { id: "tessellate", name: "TESSELLATE", blurb: "hex-tile pattern with slow slot-shift drift" }
  ];
  const { palette: paletteId, scene: sceneId } = Astro2.params;
  const p = PALETTES.find((x) => x.id === paletteId);
  const s = SCENES.find((x) => x.id === sceneId);
  function det(i) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  const lineColors = [p.foam, p.orb, p.wave1, p.wave2];
  const seed = PALETTES.indexOf(p) * 7 + SCENES.indexOf(s) * 13 + 1;
  const STAR_DOTS = Array.from({ length: 60 }, (_, i) => ({
    x: det(i + 1) * 1200,
    y: det(i + 100) * 600,
    r: 1 + det(i + 200) * 3,
    c: det(i + 300)
  }));
  const MYSTIFY_LINES = [
    "120,180 280,420 480,200 760,520 980,300",
    "60,400 320,80 540,560 780,180 1140,460",
    "220,520 480,160 660,400 880,80 1100,520",
    "120,220 320,460 560,80 800,380 1080,120"
  ];
  function buildPipes() {
    const cell = 60, cols = 20, rows = 10;
    let x = Math.floor(det(seed) * cols);
    let y = Math.floor(det(seed + 1) * rows);
    let d = Math.floor(det(seed + 2) * 4);
    let ci = 0;
    const segs = [];
    for (let i = 0; i < 32; i++) {
      let nx = x, ny = y;
      if (d === 0) ny--;
      else if (d === 1) nx++;
      else if (d === 2) ny++;
      else nx--;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
        d = (d + 2) % 4;
        ci = (ci + 1) % 4;
        continue;
      }
      segs.push({ x1: x * cell + cell / 2, y1: y * cell + cell / 2, x2: nx * cell + cell / 2, y2: ny * cell + cell / 2, ci });
      x = nx;
      y = ny;
      if (det(seed + 10 + i) < 0.18) {
        d = (d + (det(seed + 20 + i) < 0.5 ? 1 : 3)) % 4;
        ci = (ci + 1) % 4;
      }
    }
    return segs;
  }
  const tHexSize = 38;
  const tHexW = tHexSize * 2;
  const tHexH = tHexSize * Math.sqrt(3);
  const tDx = tHexW * 0.75;
  const tCols = Math.ceil(1200 / tDx) + 1;
  const tRows = Math.ceil(600 / tHexH) + 1;
  const tessTiles = [];
  for (let r = 0; r < tRows; r++) for (let c = 0; c < tCols; c++) {
    tessTiles.push({
      cx: c * tDx,
      cy: r * tHexH + (c % 2 === 0 ? 0 : tHexH / 2),
      slot: Math.floor(det(seed + c * 17 + r * 31) * 4)
    });
  }
  const liveUrl = `https://pointcast.xyz/tide#${p.id}/${s.id}`;
  const shareUrl = `https://pointcast.xyz/tide/share/${p.id}/${s.id}`;
  const ogImageUrl = `${shareUrl}/og.svg`;
  const title = `tide · ${p.name} · ${s.name}`;
  const description = `${p.dek}. Scene: ${s.blurb}. Open in /tide.`;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="ts"${addAttribute(p.dark ? "1" : "0", "data-dark")}> <article class="ts__card"> <svg class="ts__hero" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"> <defs> <linearGradient id="ts-bg" x1="0" y1="0" x2="0" y2="1"> <stop offset="0%"${addAttribute(p.sky, "stop-color")}></stop> <stop offset="100%"${addAttribute(p.water, "stop-color")}></stop> </linearGradient> </defs> ${s.id === "waves" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="1200" height="600" fill="url(#ts-bg)"></rect> <circle cx="940" cy="140" r="78"${addAttribute(p.orb, "fill")} opacity="0.85"></circle> <path d="M 0 380 C 300 320, 600 460, 900 380 S 1200 340, 1200 380 L 1200 600 L 0 600 Z"${addAttribute(p.wave1, "fill")} opacity="0.55"></path> <path d="M 0 460 C 300 400, 600 520, 900 460 S 1200 420, 1200 460 L 1200 600 L 0 600 Z"${addAttribute(p.wave2, "fill")} opacity="0.78"></path> <path d="M 0 540 C 300 480, 600 580, 900 540 S 1200 500, 1200 540 L 1200 600 L 0 600 Z"${addAttribute(p.wave3, "fill")}></path> ` })}`} ${s.id === "starfield" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="1200" height="600" fill="url(#ts-bg)"></rect> ${STAR_DOTS.map((d) => renderTemplate`<circle${addAttribute(d.x, "cx")}${addAttribute(d.y, "cy")}${addAttribute(d.r, "r")}${addAttribute(d.c < 0.34 ? p.foam : d.c < 0.67 ? p.orb : p.wave1, "fill")}${addAttribute(0.55 + d.r * 0.06, "opacity")}></circle>`)}` })}`} ${s.id === "mystify" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="1200" height="600"${addAttribute(p.dark ? "#04060a" : p.wave3, "fill")}></rect> ${MYSTIFY_LINES.map((pts, li) => renderTemplate`<polyline${addAttribute(pts, "points")}${addAttribute(lineColors[li % lineColors.length], "stroke")} stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"></polyline>`)}` })}`} ${s.id === "bounce" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="1200" height="600"${addAttribute(p.dark ? "#04060a" : p.wave3, "fill")}></rect> <rect x="380" y="220" width="440" height="160" rx="14"${addAttribute(p.foam, "fill")} opacity="0.94"></rect> <text x="600" y="330" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="86" letter-spacing="14" fill="#0c0e12">TIDE</text> ` })}`} ${s.id === "pipes" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="1200" height="600" fill="#04060a"></rect> ${buildPipes().map((seg) => renderTemplate`<line${addAttribute(seg.x1, "x1")}${addAttribute(seg.y1, "y1")}${addAttribute(seg.x2, "x2")}${addAttribute(seg.y2, "y2")}${addAttribute(lineColors[seg.ci], "stroke")} stroke-width="14" stroke-linecap="round"></line>`)}` })}`} ${s.id === "tessellate" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="1200" height="600"${addAttribute(p.dark ? "#04060a" : p.wave3, "fill")}></rect> ${tessTiles.map((tile) => {
    const swatch = [p.foam, p.orb, p.wave1, p.wave2];
    const points = [];
    for (let v = 0; v < 6; v++) {
      const ang = Math.PI / 3 * v;
      points.push(`${(tile.cx + tHexSize * Math.cos(ang)).toFixed(1)},${(tile.cy + tHexSize * Math.sin(ang)).toFixed(1)}`);
    }
    return renderTemplate`<polygon${addAttribute(points.join(" "), "points")}${addAttribute(swatch[tile.slot], "fill")} fill-opacity="0.7" stroke="rgba(0,0,0,0.18)" stroke-width="1"></polygon>`;
  })}` })}`} <text x="48" y="62" font-family="JetBrains Mono, monospace" font-weight="700" font-size="20" letter-spacing="3"${addAttribute(p.dark ? "#ffffff" : "#0c0e12", "fill")} opacity="0.85">/TIDE</text> <text x="1152" y="62" text-anchor="end" font-family="JetBrains Mono, monospace" font-weight="700" font-size="20" letter-spacing="3"${addAttribute(p.dark ? "#ffffff" : "#0c0e12", "fill")} opacity="0.85">${p.name} · ${s.name}</text> </svg> <div class="ts__body"> <p class="ts__kicker mono">/TIDE · SHARE CARD</p> <h1 class="ts__title">${p.name} <span class="ts__sep">·</span> ${s.name}</h1> <p class="ts__dek">${p.dek}</p> <p class="ts__blurb">${s.blurb}</p> <div class="ts__actions"> <a class="ts__btn ts__btn--primary mono"${addAttribute(liveUrl, "href")}>OPEN IN /TIDE →</a> <a class="ts__btn mono" href="/tide/preview">SEE THE GALLERY</a> <a class="ts__btn mono"${addAttribute(ogImageUrl, "href")}>SVG ONLY</a> </div> <p class="ts__url mono">${shareUrl}</p> </div> </article> </main> `, "head": ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "head" }, { "default": ($$result3) => renderTemplate` <meta property="og:title"${addAttribute(title, "content")}> <meta property="og:description"${addAttribute(description, "content")}> <meta property="og:image"${addAttribute(ogImageUrl, "content")}> <meta property="og:type" content="website"> <meta property="og:url"${addAttribute(shareUrl, "content")}> <meta name="twitter:card" content="summary_large_image"> <meta name="twitter:title"${addAttribute(title, "content")}> <meta name="twitter:description"${addAttribute(description, "content")}> <meta name="twitter:image"${addAttribute(ogImageUrl, "content")}> ` })}` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tide/share/[palette]/[scene].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tide/share/[palette]/[scene].astro";
const $$url = "/tide/share/[palette]/[scene]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$scene,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
