import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumTide = createComponent(($$result, $$props, $$slots) => {
  const title = "Tide · Slow Ocean Ambient · PointCast";
  const description = "A pink-noise tide piece. Two slow channels pan left and right; pixel waves roll across the screen.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tide",
    url: "https://pointcast.xyz/drum-tide",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dt" id="dt-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "tide" })} <header class="dt__header"> <div class="dt__chrome"> <span>TIDE</span> <span class="dt__chrome-sep">·</span> <span id="dt-state">OFF</span> <span class="dt__chrome-sep">·</span> <span id="dt-elapsed">--:--</span> </div> <h1 class="dt__title">TIDE</h1> <p class="dt__tagline">two channels of pink-noise water · pan slowly · listen long</p> </header> <section class="dt__sky" id="dt-sky"> <!-- Distant moon --> <div class="dt__moon"></div> <!-- Star dots --> <div class="dt__stars"></div> </section> <section class="dt__beach" id="dt-beach"> <!-- Three pixel waves rolling at different speeds --> <div class="dt__wave dt__wave--far"></div> <div class="dt__wave dt__wave--mid"></div> <div class="dt__wave dt__wave--near"></div> <div class="dt__sand"></div> </section> <footer class="dt__controls"> <button class="dt__btn dt__btn--primary" id="dt-toggle" type="button">START</button> <p class="dt__instructions">
Click START to begin. Volume rises slowly over 30 seconds. Open the page, leave it open, listen.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tide.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tide.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tide.astro";
const $$url = "/drum-tide";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTide,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
