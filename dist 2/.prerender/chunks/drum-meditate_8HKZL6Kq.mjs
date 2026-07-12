import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumMeditate = createComponent(($$result, $$props, $$slots) => {
  const title = "Meditate · Five Minutes · PointCast";
  const description = "A five-minute breathing meditation. Slow breath circle, soft chime every 30 seconds. Pure static.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Meditate",
    url: "https://pointcast.xyz/drum-meditate",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dm" id="dm-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "meditate" })} <header class="dm__header"> <div class="dm__chrome"> <span>FIVE MINUTES</span> <span class="dm__chrome-sep">·</span> <span id="dm-state">READY</span> <span class="dm__chrome-sep">·</span> <span id="dm-elapsed">5:00</span> </div> <h1 class="dm__title">MEDITATE</h1> <p class="dm__tagline">four-second inhale · six-second exhale · five minutes</p> </header> <section class="dm__field" aria-label="Breathing circle"> <div class="dm__breath" id="dm-breath" aria-hidden="true"></div> <div class="dm__cue" id="dm-cue">PRESS START</div> </section> <footer class="dm__controls"> <button class="dm__btn dm__btn--primary" id="dm-start" type="button">START</button> <button class="dm__btn dm__btn--ghost" id="dm-pause" type="button" hidden>PAUSE</button> <button class="dm__btn dm__btn--ghost" id="dm-stop" type="button" hidden>STOP</button> <div class="dm__lifetime"> <span class="dm__lifetime-label">LIFETIME</span> <span class="dm__lifetime-value" id="dm-lifetime">0 MIN</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-meditate.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-meditate.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-meditate.astro";
const $$url = "/drum-meditate";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumMeditate,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
