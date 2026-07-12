import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumMantra = createComponent(($$result, $$props, $$slots) => {
  const title = "Mantra · Type, Set, Hold · PointCast";
  const description = "Type a short phrase. The page becomes the phrase, pulsing slowly with a soft bell underline. Yours alone.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mantra",
    url: "https://pointcast.xyz/drum-mantra",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dm" id="dm-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "mantra" })} <header class="dm__header"> <div class="dm__chrome"> <span>YOUR MANTRA</span> <span class="dm__chrome-sep">·</span> <span id="dm-pulses">0 PULSES</span> <span class="dm__chrome-sep">·</span> <span id="dm-state">NEW</span> </div> <h1 class="dm__title">MANTRA</h1> <p class="dm__tagline">type a phrase. let it sit.</p> </header> <!-- Set state — the input form --> <section class="dm__set" id="dm-set"> <textarea id="dm-input" class="dm__input" rows="3" maxlength="120" placeholder="be still" aria-label="Type your mantra (max 120 characters)"></textarea> <div class="dm__counter"><span id="dm-charcount">0</span> / 120</div> <div class="dm__set-controls"> <button class="dm__btn" id="dm-set-btn" type="button" disabled>SET MANTRA</button> </div> </section> <!-- Hold state — the pulsing display --> <section class="dm__hold" id="dm-hold" hidden> <div class="dm__phrase" id="dm-phrase">—</div> <div class="dm__breath" id="dm-breath"></div> <div class="dm__hold-controls"> <button class="dm__btn dm__btn--ghost" id="dm-pause-btn" type="button">PAUSE</button> <button class="dm__btn dm__btn--ghost" id="dm-reset-btn" type="button">CHANGE</button> </div> </section> <footer class="dm__footer"> <p>
Mantras are private — kept in your browser only, never sent. The bell underline plays once
        per pulse, ~4 seconds apart, until you pause or change.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-mantra.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-mantra.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-mantra.astro";
const $$url = "/drum-mantra";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumMantra,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
