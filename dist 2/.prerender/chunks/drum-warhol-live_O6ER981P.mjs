import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumWarholLive = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Warhol Live · Shared Pop-Art Wall · PointCast";
  const description = "Twenty-four tiles, one shared wall. Click a tile to repaint it your color. Everyone sees it.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Warhol Live",
    url: "https://pointcast.xyz/drum-warhol-live",
    description,
    applicationCategory: "VisualArts"
  };
  const NOUNS = [42, 156, 411, 678, 805, 96, 234, 567, 1100, 808, 333, 777, 21, 88, 444, 999, 17, 250, 615, 1023, 4, 391, 752, 1180];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dwl" id="dwl-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "warhol-live" })} <header class="dwl__header"> <div class="dwl__chrome"> <span>WARHOL · LIVE</span> <span class="dwl__chrome-sep">·</span> <span><span id="dwl-touches">0</span> TOUCHES</span> <span class="dwl__chrome-sep">·</span> <span><span id="dwl-mine">0</span> MINE</span> </div> <h1 class="dwl__title">WALL</h1> <p class="dwl__tagline">click a tile · paint it your color · everyone sees it</p> </header> <section class="dwl__grid" id="dwl-grid"> ${NOUNS.map((seed, i) => renderTemplate`<button class="dwl__tile"${addAttribute(i, "data-idx")}${addAttribute(seed, "data-seed")} type="button"${addAttribute(`Tile ${i + 1}`, "aria-label")}> <div class="dwl__tile-bg"${addAttribute(`background: oklch(0.65 0.20 ${i * 53 % 360})`, "style")}></div> <img class="dwl__tile-noun"${addAttribute(`https://noun.pics/${seed}.svg`, "src")} alt="" loading="lazy"> <span class="dwl__tile-tag" data-tile-tag>—</span> </button>`)} </section> <p class="dwl__note">
The wall is shared across every visitor. Each visitor has a unique hue derived from their session;
      tap any tile to repaint it your color. The chamber holds the wall for 7 days. Touch counter and
      "mine" counter are live.
</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-warhol-live.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-warhol-live.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-warhol-live.astro";
const $$url = "/drum-warhol-live";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumWarholLive,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
