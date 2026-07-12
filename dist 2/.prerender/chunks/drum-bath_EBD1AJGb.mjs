import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumBath = createComponent(($$result, $$props, $$slots) => {
  const title = "Bath · Twelve-Minute Daylight Cycle · PointCast";
  const description = "A 12-minute compressed daylight cycle. Slow drone tone shifts with the OKLCH light. Hover to pause the moment.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bath",
    url: "https://pointcast.xyz/drum-bath",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="db" id="db-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "bath" })} <div class="db__field" id="db-field"> <div class="db__wash" id="db-wash"></div> <div class="db__sun" id="db-sun"></div> <header class="db__chrome"> <span class="db__chrome-label">BATH</span> <span class="db__chrome-sep">·</span> <span class="db__chrome-time" id="db-cycle-time">06:00</span> <span class="db__chrome-sep">·</span> <span class="db__chrome-state" id="db-state">FLOWING</span> </header> <div class="db__center"> <h1 class="db__title">stay</h1> <p class="db__tagline">12-minute compressed day · hover anywhere to pause the moment</p> </div> <footer class="db__readout"> <div class="db__panel"> <span class="db__panel-label">CYCLE</span> <span class="db__panel-value" id="db-cycle-progress">0%</span> </div> <div class="db__panel"> <span class="db__panel-label">LIFETIME</span> <span class="db__panel-value" id="db-lifetime">0 MIN</span> </div> </footer> </div> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bath.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bath.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bath.astro";
const $$url = "/drum-bath";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumBath,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
