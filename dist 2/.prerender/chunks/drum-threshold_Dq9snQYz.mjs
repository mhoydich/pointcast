import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumThreshold = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Threshold · First Room · PointCast";
  const description = "Light a candle for your arrival. Type your name; the chamber adds it to the row of guests.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Threshold",
    url: "https://pointcast.xyz/drum-threshold",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dt" id="dt-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "threshold" })} <header class="dt__header"> <div class="dt__chrome"> <span>THRESHOLD</span> <span class="dt__chrome-sep">·</span> <span><span id="dt-count">0</span> CANDLES LIT TODAY</span> <span class="dt__chrome-sep">·</span> <span id="dt-mine">—</span> </div> <h1 class="dt__title">WELCOME</h1> <p class="dt__tagline">light a candle for your arrival · the chamber will remember</p> </header> <section class="dt__form" id="dt-form"> <input class="dt__input" id="dt-name" type="text" maxlength="40" placeholder="your name (or your group)"> <button class="dt__btn dt__btn--primary" id="dt-light" type="button">LIGHT MY CANDLE</button> </section> <section class="dt__row" id="dt-row"> <div class="dt__empty">— no candles lit yet —</div> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-threshold.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-threshold.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-threshold.astro";
const $$url = "/drum-threshold";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumThreshold,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
