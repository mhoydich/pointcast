import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumMantraV2 = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Mantra v2 · Typewriter · PointCast";
  const description = "A mantra types itself, holds, erases, types again. Soft tone per character. Cycles through twelve.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mantra v2",
    url: "https://pointcast.xyz/drum-mantra-v2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="m2" id="m2-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "mantra" })} <header class="m2__header"> <div class="m2__chrome"> <span>MANTRA</span> <span class="m2__chrome-sep">·</span> <span class="m2__chrome-version">v2 · TYPEWRITER</span> <a class="m2__prev-pill" href="/drum-mantra">← v1</a> </div> <h1 class="m2__title">TYPE</h1> <p class="m2__tagline">it types itself. holds. erases. types again.</p> </header> <section class="m2__stage"> <div class="m2__phrase" id="m2-phrase"><span id="m2-text"></span><span class="m2__caret" id="m2-caret"></span></div> </section> <footer class="m2__controls"> <button class="m2__btn m2__btn--ghost" id="m2-pause" type="button">PAUSE</button> <input class="m2__input" id="m2-input" type="text" maxlength="80" placeholder="add your own (enter to queue)"> <button class="m2__btn m2__btn--ghost" id="m2-clear" type="button">RESET QUEUE</button> </footer> <p class="m2__note">
Twelve default phrases cycle. Type your own + Enter to queue it; queued mantras play next, then
      the cycle resumes. Audio gates on first interaction.
</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-mantra-v2.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-mantra-v2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-mantra-v2.astro";
const $$url = "/drum-mantra-v2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumMantraV2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
