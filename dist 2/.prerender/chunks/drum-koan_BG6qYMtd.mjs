import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumKoan = createComponent(($$result, $$props, $$slots) => {
  const title = "Koan · One Noun, One Phrase, One Tone · PointCast";
  const description = "A random Noun, a generated koan phrase, a single bell tone. Refresh for another. Meditative.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Koan",
    url: "https://pointcast.xyz/drum-koan",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dk" id="dk-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "koan" })} <header class="dk__header"> <div class="dk__chrome"> <span>ONE NOUN</span> <span class="dk__chrome-sep">·</span> <span>ONE PHRASE</span> <span class="dk__chrome-sep">·</span> <span>ONE TONE</span> </div> <h1 class="dk__title">KOAN</h1> </header> <section class="dk__stage"> <div class="dk__frame"> <img class="dk__noun" id="dk-noun" src="https://noun.pics/0.svg" alt="A Noun"> </div> <div class="dk__phrase" id="dk-phrase">—</div> <div class="dk__signature" id="dk-sig">—</div> <button class="dk__btn" id="dk-btn" type="button">GENERATE ANOTHER</button> </section> <footer class="dk__readout"> <div class="dk__panel"> <div class="dk__panel-label">KOANS HEARD</div> <div class="dk__panel-value" id="dk-heard">0</div> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-koan.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-koan.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-koan.astro";
const $$url = "/drum-koan";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumKoan,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
