import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Preview = createComponent(($$result, $$props, $$slots) => {
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
    { id: "waves", name: "WAVES" },
    { id: "starfield", name: "STARFIELD" },
    { id: "mystify", name: "MYSTIFY" },
    { id: "bounce", name: "BOUNCE" },
    { id: "pipes", name: "PIPES" },
    { id: "tessellate", name: "TESSELLATE" }
  ];
  function det(i) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  const STAR_DOTS = Array.from({ length: 28 }, (_, i) => ({
    x: det(i + 1) * 100,
    y: det(i + 100) * 60,
    r: 0.5 + det(i + 200) * 1.4,
    c: det(i + 300)
  }));
  const MYSTIFY_LINES = [
    "14,12 22,42 38,18 64,52 86,28",
    "6,38 32,8 50,56 76,18 96,46",
    "20,52 46,16 60,40 80,8 92,52",
    "10,22 28,46 54,8 70,38 90,12"
  ];
  function buildPipeSegments(seed) {
    const segs = [];
    const cell = 8;
    const cols = 12, rows = 7;
    let x = Math.floor(det(seed) * cols);
    let y = Math.floor(det(seed + 1) * rows);
    let d = Math.floor(det(seed + 2) * 4);
    let ci = 0;
    for (let i = 0; i < 22; i++) {
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
      segs.push({
        x1: x * cell + cell / 2 + 2,
        y1: y * cell + cell / 2 + 2,
        x2: nx * cell + cell / 2 + 2,
        y2: ny * cell + cell / 2 + 2,
        ci
      });
      x = nx;
      y = ny;
      if (det(seed + 10 + i) < 0.18) {
        d = (d + (det(seed + 20 + i) < 0.5 ? 1 : 3)) % 4;
        ci = (ci + 1) % 4;
      }
    }
    return segs;
  }
  const description = "Full gallery of /tide combinations. 8 palettes × 5 scenes = 40 still mini-cards. Click any card to open /tide at that exact combo.";
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "/tide/preview — palette × scene gallery", "description": description }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="tp"> <header class="tp__head"> <p class="tp__kicker mono">/TIDE/PREVIEW · 8 PALETTES × 5 SCENES · 40 COMBOS</p> <h1 class="tp__title">tide gallery</h1> <p class="tp__lede">
Every palette in every scene, side by side. Mini-cards are static —
        no canvas, no audio. Click one to open the actual room at that combo.
</p> <p class="tp__links mono"> <a href="/tide">/tide →</a> <a href="/tide.json">/tide.json →</a> <a href="/tide/today.json">/tide/today.json →</a> <a href="/tide/moments">/tide/moments →</a> </p> </header> ${PALETTES.map((p) => {
    const lineColors = [p.foam, p.orb, p.wave1, p.wave2];
    return renderTemplate`<section class="tp__row"${addAttribute(p.dark ? "1" : "0", "data-dark")}> <header class="tp__row-head"> <h2 class="tp__row-title mono">${p.name}</h2> <p class="tp__row-dek mono">${p.dek}</p> </header> <div class="tp__cards"> ${SCENES.map((scene, si) => {
      const href = `/tide#${p.id}/${scene.id}`;
      const seed = PALETTES.indexOf(p) * 7 + si * 13 + 1;
      return renderTemplate`<a class="tp__card"${addAttribute(href, "href")}${addAttribute(`Open /tide ${p.name} ${scene.name}`, "aria-label")}> <svg class="tp__svg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"> ${scene.id === "waves" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <defs> <linearGradient${addAttribute(`bg-${p.id}-${scene.id}`, "id")} x1="0" y1="0" x2="0" y2="1"> <stop offset="0%"${addAttribute(p.sky, "stop-color")}></stop> <stop offset="100%"${addAttribute(p.water, "stop-color")}></stop> </linearGradient> </defs> <rect width="100" height="60"${addAttribute(`url(#bg-${p.id}-${scene.id})`, "fill")}></rect> <circle cx="78" cy="14" r="6"${addAttribute(p.orb, "fill")} opacity="0.8"></circle> <path d="M 0 38 C 25 30, 50 46, 75 38 S 100 32, 100 38 L 100 60 L 0 60 Z"${addAttribute(p.wave1, "fill")} opacity="0.55"></path> <path d="M 0 46 C 25 38, 50 52, 75 46 S 100 40, 100 46 L 100 60 L 0 60 Z"${addAttribute(p.wave2, "fill")} opacity="0.78"></path> <path d="M 0 54 C 25 48, 50 58, 75 54 S 100 50, 100 54 L 100 60 L 0 60 Z"${addAttribute(p.wave3, "fill")}></path> ` })}`} ${scene.id === "starfield" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <defs> <linearGradient${addAttribute(`bg-${p.id}-${scene.id}`, "id")} x1="0" y1="0" x2="0" y2="1"> <stop offset="0%"${addAttribute(p.sky, "stop-color")}></stop> <stop offset="100%"${addAttribute(p.water, "stop-color")}></stop> </linearGradient> </defs> <rect width="100" height="60"${addAttribute(`url(#bg-${p.id}-${scene.id})`, "fill")}></rect> ${STAR_DOTS.map((d) => renderTemplate`<circle${addAttribute(d.x, "cx")}${addAttribute(d.y, "cy")}${addAttribute(d.r, "r")}${addAttribute(d.c < 0.34 ? p.foam : d.c < 0.67 ? p.orb : p.wave1, "fill")}${addAttribute(0.55 + d.r * 0.2, "opacity")}></circle>`)}` })}`} ${scene.id === "mystify" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="100" height="60"${addAttribute(p.dark ? "#04060a" : p.wave3, "fill")}></rect> ${MYSTIFY_LINES.map((pts, li) => renderTemplate`<polyline${addAttribute(pts, "points")}${addAttribute(lineColors[li % lineColors.length], "stroke")} stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"></polyline>`)}` })}`} ${scene.id === "bounce" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="100" height="60"${addAttribute(p.dark ? "#04060a" : p.wave3, "fill")}></rect> <rect x="32" y="22" width="36" height="16" rx="2"${addAttribute(p.foam, "fill")} opacity="0.92"></rect> <text x="50" y="32" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="6" letter-spacing="1.2"${addAttribute(p.dark ? "#0c0e12" : "#0c0e12", "fill")}>TIDE</text> ` })}`} ${scene.id === "pipes" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="100" height="60" fill="#04060a"></rect> ${buildPipeSegments(seed).map((seg) => renderTemplate`<line${addAttribute(seg.x1, "x1")}${addAttribute(seg.y1, "y1")}${addAttribute(seg.x2, "x2")}${addAttribute(seg.y2, "y2")}${addAttribute(lineColors[seg.ci], "stroke")} stroke-width="2.4" stroke-linecap="round"></line>`)}` })}`} ${scene.id === "tessellate" && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <rect width="100" height="60"${addAttribute(p.dark ? "#04060a" : p.wave3, "fill")}></rect> ${(() => {
        const swatch = [p.foam, p.orb, p.wave1, p.wave2];
        const size = 4.2;
        const hexW = size * 2;
        const hexH = size * Math.sqrt(3);
        const dx = hexW * 0.75;
        const cols = Math.ceil(100 / dx) + 1;
        const rows = Math.ceil(60 / hexH) + 1;
        const tiles = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cx = c * dx;
            const cy = r * hexH + (c % 2 === 0 ? 0 : hexH / 2);
            const slot = Math.floor(det(seed + c * 17 + r * 31) * 4);
            const points = [];
            for (let v = 0; v < 6; v++) {
              const ang = Math.PI / 3 * v;
              points.push((cx + size * Math.cos(ang)).toFixed(1) + "," + (cy + size * Math.sin(ang)).toFixed(1));
            }
            tiles.push({ pts: points.join(" "), fill: swatch[slot] });
          }
        }
        return tiles.map((t) => renderTemplate`<polygon${addAttribute(t.pts, "points")}${addAttribute(t.fill, "fill")} fill-opacity="0.7" stroke="rgba(0,0,0,0.18)" stroke-width="0.4"></polygon>`);
      })()}` })}`} </svg> <p class="tp__card-label mono"> <span>${p.name}</span> <span class="tp__card-sep">·</span> <span>${scene.name}</span> </p> </a>`;
    })} </div> </section>`;
  })} <footer class="tp__foot mono"> <p>40 cards · all CC0 · derived from /tide.json</p> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tide/preview.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/tide/preview.astro";
const $$url = "/tide/preview";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Preview,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
