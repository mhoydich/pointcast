import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$YeeeeV2 = createComponent(($$result, $$props, $$slots) => {
  const title = "YEEEE v2 · Fireworks · PointCast";
  const description = "Click anywhere — a shell launches, arcs to the sky, and bursts into a Noun shower. Boom. Chord. Repeat.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "YEEEE v2",
    url: "https://pointcast.xyz/yeeee-v2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ye2" id="ye2-main"> <div class="ye2__sky" id="ye2-sky"></div> <div class="ye2__city"></div> <header class="ye2__chrome"> <span class="ye2__chrome-label">YEEEE</span> <span class="ye2__chrome-sep">·</span> <span class="ye2__chrome-version">v2 · FIREWORKS</span> <a class="ye2__prev-pill" href="/yeeee">← v1</a> </header> <h1 class="ye2__hero">YEEEE</h1> <p class="ye2__tagline">click anywhere · shells launch · sky bursts</p> <canvas id="ye2-canvas" class="ye2__canvas"></canvas> <footer class="ye2__readout"> <div class="ye2__panel"> <span class="ye2__panel-label">SHELLS</span> <span class="ye2__panel-value" id="ye2-shells">0</span> </div> <div class="ye2__panel"> <span class="ye2__panel-label">BURSTS</span> <span class="ye2__panel-value" id="ye2-bursts">0</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yeeee-v2.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yeeee-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/yeeee-v2.astro";
const $$url = "/yeeee-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$YeeeeV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
