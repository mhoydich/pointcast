import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumConductor = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Conductor · Wing Ops Console · PointCast";
  const description = "Live operational state across the wing's endpoints. Read-only ops glance for operators.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Conductor",
    url: "https://pointcast.xyz/drum-conductor",
    description,
    applicationCategory: "OperationsConsole"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dc" id="dc-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "conductor" })} <header class="dc__header"> <div class="dc__chrome"> <span>CONDUCTOR</span> <span class="dc__chrome-sep">·</span> <span id="dc-time">--:--:--</span> <span class="dc__chrome-sep">·</span> <span class="dc__chrome-on">● LIVE</span> </div> <h1 class="dc__title">CONDUCTOR</h1> <p class="dc__tagline">live ops glance · all endpoints, one page</p> </header> <section class="dc__rows"> <div class="dc__row" data-endpoint="altar"> <div class="dc__row-label">/api/altar</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> <div class="dc__row" data-endpoint="quintet"> <div class="dc__row-label">/api/quintet</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> <div class="dc__row" data-endpoint="lobby"> <div class="dc__row-label">/api/chamber?kind=lobby</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> <div class="dc__row" data-endpoint="now"> <div class="dc__row-label">/api/chamber?kind=now</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> <div class="dc__row" data-endpoint="procession"> <div class="dc__row-label">/api/chamber?kind=procession</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> <div class="dc__row" data-endpoint="echo"> <div class="dc__row-label">/api/chamber?kind=echo</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> <div class="dc__row" data-endpoint="scorebook"> <div class="dc__row-label">/scorebook.json</div> <div class="dc__row-summary" data-summary>—</div> <div class="dc__row-status" data-status>...</div> </div> </section> <section class="dc__totals"> <div class="dc__panel"> <div class="dc__panel-label">VISITORS · NOW</div> <div class="dc__panel-value" id="dc-now-count">—</div> </div> <div class="dc__panel"> <div class="dc__panel-label">RINGS · ALL TIME</div> <div class="dc__panel-value" id="dc-rings">—</div> </div> <div class="dc__panel"> <div class="dc__panel-label">PROCESSION STEPS</div> <div class="dc__panel-value" id="dc-steps">—</div> </div> <div class="dc__panel"> <div class="dc__panel-label">ALTAR TRIBUTES THIS WK</div> <div class="dc__panel-value" id="dc-tributes">—</div> </div> </section> <p class="dc__note">
Polls every 4 seconds. Status lights show response time bucket: ● green &lt; 200ms · ● amber &lt; 500ms · ● red ≥ 500ms or error.
</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-conductor.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-conductor.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-conductor.astro";
const $$url = "/drum-conductor";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumConductor,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
