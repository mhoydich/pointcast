import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$NounsGrid = createComponent(($$result, $$props, $$slots) => {
  const title = "Grid · 144 Nouns · PointCast";
  const description = "144 Nouns in a 12×12 grid. Click any to spotlight. REFRESH to re-roll.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Grid",
    url: "https://pointcast.xyz/nouns-grid",
    description,
    applicationCategory: "VisualArts"
  };
  const CELLS = 144;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ng" id="ng-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "grid" })} <header class="ng__header"> <div class="ng__chrome"> <span>GRID</span> <span class="ng__chrome-sep">·</span> <span>144 NOUNS · 12 × 12</span> <span class="ng__chrome-sep">·</span> <span id="ng-spotlight">— —</span> </div> <h1 class="ng__title">GRID</h1> <p class="ng__tagline">click any noun to spotlight · refresh to re-roll</p> </header> <section class="ng__grid" id="ng-grid"> ${Array.from({ length: CELLS }, (_, i) => i).map((i) => renderTemplate`<button class="ng__cell" type="button"${addAttribute(i, "data-idx")}${addAttribute(`Cell ${i + 1}`, "aria-label")}> <img class="ng__cell-noun" alt="" data-cell-noun loading="lazy"> </button>`)} </section> <footer class="ng__controls"> <button class="ng__btn ng__btn--primary" id="ng-refresh" type="button">REFRESH 144</button> <div class="ng__counter"> <span class="ng__counter-label">SPOTLIGHTS</span> <span class="ng__counter-value" id="ng-count">0</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-grid.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-grid.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-grid.astro";
const $$url = "/nouns-grid";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsGrid,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
