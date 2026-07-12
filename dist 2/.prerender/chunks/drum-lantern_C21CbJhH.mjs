import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumLantern = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Lantern · Release Into the Sky · PointCast";
  const description = "Tap the velvet sky to release a paper lantern carrying your Noun. They drift up over 30 seconds.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Lantern",
    url: "https://pointcast.xyz/drum-lantern",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dl" id="dl-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "lantern" })} <div class="dl__sky" id="dl-sky"> <!-- Ground gradient at bottom --> <div class="dl__ground"></div> <header class="dl__chrome"> <span class="dl__chrome-label">LANTERN</span> <span class="dl__chrome-sep">·</span> <span class="dl__chrome-stat" id="dl-released">0 RELEASED</span> <span class="dl__chrome-sep">·</span> <span class="dl__chrome-stat" id="dl-aloft">0 ALOFT</span> </header> <div class="dl__center"> <h1 class="dl__title">tap the sky</h1> <p class="dl__tagline">a lantern with your Noun rises from where you tap</p> </div> <footer class="dl__readout"> <div class="dl__yours"> <span class="dl__yours-label">YOUR NOUN</span> <span class="dl__yours-value" id="dl-your-noun">—</span> </div> </footer> </div> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-lantern.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-lantern.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-lantern.astro";
const $$url = "/drum-lantern";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumLantern,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
