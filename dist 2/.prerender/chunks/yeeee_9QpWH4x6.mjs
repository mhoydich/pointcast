import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Yeeee = createComponent(($$result, $$props, $$slots) => {
  const title = "YEEEE · Celebration Room · PointCast";
  const description = "Click anywhere. Noun confetti explodes with a chord chime. Hold for continuous bursts. Pop-art pure.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "YEEEE",
    url: "https://pointcast.xyz/yeeee",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ye" id="ye-main"> <div class="ye__bg" id="ye-bg"></div> <header class="ye__chrome"> <span class="ye__chrome-label">YEEEE</span> <span class="ye__chrome-sep">·</span> <span id="ye-bursts">0 BURSTS</span> <span class="ye__chrome-sep">·</span> <span id="ye-confetti">0 IN AIR</span> </header> <h1 class="ye__hero">YEEEE</h1> <p class="ye__tagline">click anywhere · hold to spray · turn it up</p> <canvas id="ye-canvas" class="ye__canvas"></canvas> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yeeee.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yeeee.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yeeee.astro";
const $$url = "/yeeee";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Yeeee,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
