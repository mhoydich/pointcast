import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumAurora = createComponent(($$result, $$props, $$slots) => {
  const title = "Aurora · Time-Bathed Light · PointCast";
  const description = "A breathing OKLCH aurora that accretes color the longer you stay. Slow pad drone underneath. Click to ripple.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Aurora",
    url: "https://pointcast.xyz/drum-aurora",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="da" id="da-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "aurora" })} <div class="da__field" id="da-field"> <div class="da__layer da__layer--bg"></div> <div class="da__layer da__layer--mid" id="da-layer-mid"></div> <div class="da__layer da__layer--fg" id="da-layer-fg"></div> <header class="da__chrome"> <span class="da__chrome-label">AURORA</span> <span class="da__chrome-sep">·</span> <span class="da__chrome-time" id="da-elapsed">00:00</span> <span class="da__chrome-sep">·</span> <span class="da__chrome-bands"><span id="da-bands">0</span>/12 BANDS</span> </header> <div class="da__center"> <h1 class="da__title">stay still</h1> <p class="da__tagline">a band lights up every 30 seconds you stay on this page</p> </div> <footer class="da__readout"> <div class="da__lifetime"> <span class="da__lifetime-label">LIFETIME BATHED</span> <span class="da__lifetime-value" id="da-lifetime">0 MIN</span> </div> </footer> </div> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-aurora.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-aurora.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-aurora.astro";
const $$url = "/drum-aurora";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAurora,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
