import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumBellFallV2 = createComponent(($$result, $$props, $$slots) => {
  const title = "Bell Fall v2 · Drag Trail · PointCast";
  const description = "Drag your cursor across the velvet field — bells fall along your path. Each direction picks a pitch.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bell Fall v2",
    url: "https://pointcast.xyz/drum-bell-fall-v2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bf2" id="bf2-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "bell-fall" })} <header class="bf2__header"> <div class="bf2__chrome"> <span>BELL FALL</span> <span class="bf2__chrome-sep">·</span> <span class="bf2__chrome-version">v2 · DRAG TRAIL</span> <a class="bf2__prev-pill" href="/drum-bell-fall">← v1</a> </div> <h1 class="bf2__title">DRAG ME</h1> <p class="bf2__tagline">draw bell trails across the velvet · direction picks the note</p> </header> <section class="bf2__field" id="bf2-field" aria-label="Drag to drop bells along your path"> <div class="bf2__cue" id="bf2-cue">drag anywhere</div> </section> <footer class="bf2__readout"> <div class="bf2__panel"> <span class="bf2__panel-label">DROPPED</span> <span class="bf2__panel-value" id="bf2-dropped">0</span> </div> <div class="bf2__panel"> <span class="bf2__panel-label">IN AIR</span> <span class="bf2__panel-value" id="bf2-aloft">0</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-fall-v2.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-fall-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-fall-v2.astro";
const $$url = "/drum-bell-fall-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumBellFallV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
