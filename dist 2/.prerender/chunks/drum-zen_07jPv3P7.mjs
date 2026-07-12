import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumZen = createComponent(($$result, $$props, $$slots) => {
  const title = "Zen Garden · Rake the Sand · PointCast";
  const description = "A pixel-art zen rock garden. Drag to draw rake lines in the sand. Three rocks placed for you.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zen Garden",
    url: "https://pointcast.xyz/drum-zen",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dz" id="dz-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "zen" })} <header class="dz__header"> <div class="dz__chrome"> <span>ZEN GARDEN</span> <span class="dz__chrome-sep">·</span> <span>DRAG TO RAKE</span> <span class="dz__chrome-sep">·</span> <span id="dz-strokes">0 STROKES</span> </div> <h1 class="dz__title">ZEN</h1> <p class="dz__tagline">three rocks · sand around them · drag your rake slowly</p> </header> <section class="dz__field"> <canvas id="dz-canvas" class="dz__canvas"></canvas> </section> <footer class="dz__controls"> <button class="dz__btn dz__btn--ghost" id="dz-clear" type="button">SMOOTH</button> <p class="dz__instructions">
Lines persist this session. SMOOTH erases the sand and starts over. Rocks stay.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-zen.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-zen.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-zen.astro";
const $$url = "/drum-zen";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumZen,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
