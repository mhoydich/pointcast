import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$NounsWarhol = createComponent(($$result, $$props, $$slots) => {
  const title = "Nouns × Warhol · Four-Up Pop-Art · PointCast";
  const description = "Andy Warhol's serial pop-art treatment, applied to Nouns. Four panels, four palettes, one Noun.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nouns × Warhol",
    url: "https://pointcast.xyz/nouns-warhol",
    description,
    applicationCategory: "VisualArts"
  };
  const SSR_SEED = 42;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="nw" id="nw-main"> <header class="nw__header"> <div class="nw__chrome"> <span>NOUNS × WARHOL</span> <span class="nw__chrome-sep">·</span> <span>FOUR-UP POP-ART</span> <span class="nw__chrome-sep">·</span> <span id="nw-noun-num">NOUN ----</span> </div> <h1 class="nw__title">SERIAL</h1> <p class="nw__tagline">same Noun · four palettes · click any panel to re-roll · click refresh for a new Noun</p> </header> <section class="nw__grid" id="nw-grid"> ${[0, 1, 2, 3].map((i) => renderTemplate`<button class="nw__panel" type="button"${addAttribute(i, "data-panel")}${addAttribute(`Panel ${i + 1}, click to re-roll palette`, "aria-label")}> <div class="nw__panel-bg"></div> <div class="nw__panel-noun-wrap"> <img class="nw__panel-noun"${addAttribute(`https://noun.pics/${SSR_SEED}.svg`, "src")} alt=""> <!-- Color overlay layer for accent/mid blending --> <div class="nw__panel-overlay nw__panel-overlay--mid"></div> <div class="nw__panel-overlay nw__panel-overlay--accent"></div> </div> <div class="nw__panel-tag"> <span class="nw__panel-tag-num">${String(i + 1).padStart(2, "0")}</span> <span class="nw__panel-tag-name" data-panel-name>—</span> </div> </button>`)} </section> <footer class="nw__footer"> <button class="nw__btn nw__btn--primary" id="nw-refresh" type="button">REFRESH NOUN</button> <button class="nw__btn nw__btn--ghost" id="nw-reroll-all" type="button">RE-ROLL ALL PALETTES</button> <div class="nw__counter"> <span class="nw__counter-label">PRINTS PULLED</span> <span class="nw__counter-value" id="nw-pulled">0</span> </div> </footer> <p class="nw__note">
In the spirit of Warhol's screen-printing series — Marilyn, soup cans, Mao — this surface treats
      each Noun as a print plate, then runs it through four different ink combinations. Click a panel
      to re-roll just that panel's palette. Click REFRESH NOUN for a new subject. Twelve palettes in
      the pool, so a typical four-up has 11,880 possible orderings per Noun.
</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-warhol.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-warhol.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-warhol.astro";
const $$url = "/nouns-warhol";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsWarhol,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
