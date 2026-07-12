import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumNameCard = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Name Card · Per-Guest Welcome · PointCast";
  const description = "Type a name, pick a tone — your custom welcome card with patron Noun, frequency, and shareable URL.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Name Card",
    url: "https://pointcast.xyz/drum-name-card",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dnc" id="dnc-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "name-card" })} <header class="dnc__header"> <div class="dnc__chrome"> <span>NAME CARD</span> <span class="dnc__chrome-sep">·</span> <span>SHAREABLE URL</span> <span class="dnc__chrome-sep">·</span> <span id="dnc-mode">EDIT</span> </div> <h1 class="dnc__title">CARD</h1> <p class="dnc__tagline">type a name · pick a tone · the URL is the card</p> </header> <section class="dnc__form" id="dnc-form"> <div class="dnc__form-row"> <label class="dnc__label" for="dnc-name">name (or group)</label> <input class="dnc__input" id="dnc-name" type="text" maxlength="40" placeholder="e.g. anthropic-team"> </div> <div class="dnc__form-row"> <label class="dnc__label">tone</label> <div class="dnc__tones" id="dnc-tones"> <button data-tone="0" data-freq="261.63">C — STILLNESS</button> <button data-tone="1" data-freq="293.66">D — RISE</button> <button data-tone="2" data-freq="329.63">E — OPEN</button> <button data-tone="3" data-freq="392.00">G — CARRY</button> <button data-tone="4" data-freq="440.00">A — KEEP</button> </div> </div> <button class="dnc__btn dnc__btn--primary" id="dnc-make" type="button">MAKE THE CARD</button> </section> <section class="dnc__card" id="dnc-card" hidden> <div class="dnc__card-bg"></div> <header class="dnc__card-header"> <span class="dnc__card-eyebrow">POINTCAST · WELCOME</span> <span class="dnc__card-id" id="dnc-card-id">—</span> </header> <div class="dnc__card-body"> <img class="dnc__card-noun" id="dnc-card-noun" src="" alt=""> <div class="dnc__card-text"> <div class="dnc__card-name" id="dnc-card-name">—</div> <div class="dnc__card-tone" id="dnc-card-tone">—</div> </div> </div> <footer class="dnc__card-footer"> <span id="dnc-card-freq">—</span> <span>·</span> <span>PT</span> </footer> <button class="dnc__card-play" id="dnc-card-play" type="button" aria-label="Play tone">▶ PLAY</button> </section> <p class="dnc__share" id="dnc-share" hidden> <span>Shareable URL:</span> <input class="dnc__share-input" id="dnc-share-input" type="text" readonly> <button class="dnc__btn" id="dnc-share-copy" type="button">COPY</button> </p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-name-card.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-name-card.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-name-card.astro";
const $$url = "/drum-name-card";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumNameCard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
