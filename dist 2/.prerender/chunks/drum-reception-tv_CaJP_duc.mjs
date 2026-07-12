import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$DrumReceptionTv = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Reception · Hands-Off Projection · PointCast";
  const description = "Auto-cycling projection mode for guest arrivals. Rotates between candles, offerings, altars, presence.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Reception",
    url: "https://pointcast.xyz/drum-reception-tv",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dr" id="dr-main"> <header class="dr__chrome"> <span class="dr__chrome-label">RECEPTION</span> <span class="dr__chrome-sep">·</span> <span class="dr__chrome-time" id="dr-time">--:--</span> <span class="dr__chrome-sep">·</span> <span class="dr__chrome-on">● LIVE</span> </header> <section class="dr__stage"> <div class="dr__panel" data-panel="threshold"> <header class="dr__panel-header"> <span class="dr__panel-eyebrow">CANDLES LIT TODAY</span> <span class="dr__panel-count" id="dr-threshold-count">—</span> </header> <div class="dr__panel-body" id="dr-threshold-body"> <div class="dr__loading">— gathering —</div> </div> </div> <div class="dr__panel" data-panel="offering" hidden> <header class="dr__panel-header"> <span class="dr__panel-eyebrow">RECENT OFFERINGS</span> <span class="dr__panel-count" id="dr-offering-count">—</span> </header> <div class="dr__panel-body" id="dr-offering-body"> <div class="dr__loading">— gathering —</div> </div> </div> <div class="dr__panel" data-panel="altar" hidden> <header class="dr__panel-header"> <span class="dr__panel-eyebrow">CHAMBER · ALTARS THIS WEEK</span> <span class="dr__panel-count" id="dr-altar-count">—</span> </header> <div class="dr__panel-body" id="dr-altar-body"> <div class="dr__loading">— gathering —</div> </div> </div> <div class="dr__panel" data-panel="now" hidden> <header class="dr__panel-header"> <span class="dr__panel-eyebrow">VISITORS · NOW</span> <span class="dr__panel-count" id="dr-now-count">—</span> </header> <div class="dr__panel-body" id="dr-now-body"> <div class="dr__loading">— gathering —</div> </div> </div> </section> <p class="dr__footer">pointcast.xyz · welcome to the wing · the chamber is awake</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-reception-tv.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-reception-tv.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-reception-tv.astro";
const $$url = "/drum-reception-tv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumReceptionTv,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
