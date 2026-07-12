import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumAuroraV2 = createComponent(($$result, $$props, $$slots) => {
  const title = "Aurora v2 · Mouse-Responsive · PointCast";
  const description = "A soft OKLCH light follows your cursor across velvet. Move slow to swim, move fast to streak.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Aurora v2",
    url: "https://pointcast.xyz/drum-aurora-v2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="av2" id="av2-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "aurora" })} <div class="av2__field" id="av2-field"> <canvas id="av2-canvas" class="av2__canvas"></canvas> <div class="av2__cursor" id="av2-cursor"></div> <header class="av2__chrome"> <span>AURORA</span> <span class="av2__chrome-sep">·</span> <span class="av2__chrome-version">v2 · MOUSE</span> <a class="av2__prev-pill" href="/drum-aurora">← v1</a> </header> <div class="av2__center"> <h1 class="av2__title">FOLLOW</h1> <p class="av2__tagline">the light moves with your cursor · move slow to swim · fast to streak</p> </div> </div> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-aurora-v2.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-aurora-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-aurora-v2.astro";
const $$url = "/drum-aurora-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAuroraV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
