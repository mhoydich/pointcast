import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumOffering = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Offering · Intentions Archive · PointCast";
  const description = "Leave one short intention. The chamber records it with your Noun and hue. 60-tile rolling archive.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Offering",
    url: "https://pointcast.xyz/drum-offering",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dof" id="dof-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "offering" })} <header class="dof__header"> <div class="dof__chrome"> <span>OFFERING</span> <span class="dof__chrome-sep">·</span> <span><span id="dof-count">0</span> IN ARCHIVE</span> </div> <h1 class="dof__title">OFFERING</h1> <p class="dof__tagline">leave one short intention · the chamber will hold it</p> </header> <section class="dof__form"> <input class="dof__input" id="dof-input" type="text" maxlength="80" placeholder="one short intention"> <button class="dof__btn" id="dof-leave" type="button">LEAVE</button> </section> <section class="dof__grid" id="dof-grid"> <div class="dof__empty">— first offering, then it will fill —</div> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-offering.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-offering.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-offering.astro";
const $$url = "/drum-offering";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumOffering,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
