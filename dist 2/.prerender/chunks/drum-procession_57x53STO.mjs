import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumProcession = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Procession · Collective Advance · PointCast";
  const description = "A shared ceremonial path. Each visitor advances it one step. Watch others move it forward.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Procession",
    url: "https://pointcast.xyz/drum-procession",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dp" id="dp-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "procession" })} <header class="dp__header"> <div class="dp__chrome"> <span>PROCESSION</span> <span class="dp__chrome-sep">·</span> <span><span id="dp-total">0</span> STEPS</span> <span class="dp__chrome-sep">·</span> <span id="dp-state">READY</span> </div> <h1 class="dp__title">PROCESSION</h1> <p class="dp__tagline">advance the path · the chamber remembers your step</p> </header> <section class="dp__path"> <div class="dp__step-display"> <span class="dp__step-label">CURRENT STEP</span> <span class="dp__step-num" id="dp-step">—</span> </div> <button class="dp__advance" id="dp-advance" type="button">ADVANCE</button> </section> <section class="dp__last"> <header class="dp__last-header">LAST FIVE STEPS</header> <ol class="dp__last-list" id="dp-last-list"> <li class="dp__last-empty">— waiting for the first advance —</li> </ol> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-procession.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-procession.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-procession.astro";
const $$url = "/drum-procession";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumProcession,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
