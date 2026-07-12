import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumZenV2 = createComponent(($$result, $$props, $$slots) => {
  const title = "Zen v2 · Living Sand · PointCast";
  const description = "A zen garden where the sand is always quietly drifting. Rake painterly lines. Rocks cast moving shadows.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zen v2",
    url: "https://pointcast.xyz/drum-zen-v2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="z2" id="z2-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "zen" })} <header class="z2__header"> <div class="z2__chrome"> <span>ZEN</span> <span class="z2__chrome-sep">·</span> <span class="z2__chrome-version">v2 · LIVING SAND</span> <a class="z2__prev-pill" href="/drum-zen">← v1</a> </div> <h1 class="z2__title">RAKE</h1> <p class="z2__tagline">painterly strokes · sand drifts · rocks shadow-cast</p> </header> <section class="z2__field"> <canvas id="z2-canvas" class="z2__canvas"></canvas> </section> <footer class="z2__controls"> <button class="z2__btn" id="z2-clear" type="button">SMOOTH</button> <p class="z2__instructions">
Sand grains drift on their own. Drag to add painterly rake lines. SMOOTH erases the strokes; rocks stay; the drift continues.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-zen-v2.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-zen-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-zen-v2.astro";
const $$url = "/drum-zen-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumZenV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
