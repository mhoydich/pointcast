import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumTape = createComponent(($$result, $$props, $$slots) => {
  const title = "Tape · Scrolling Noun Tape · PointCast";
  const description = "A long tape of Nouns rolls past a tape head. Each segment plays its tone as it passes. Click to jump.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tape",
    url: "https://pointcast.xyz/drum-tape",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const TAPE_LEN = 60;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dt" id="dt-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "tape" })} <header class="dt__header"> <div class="dt__chrome"> <span>TAPE</span> <span class="dt__chrome-sep">·</span> <span id="dt-state">PAUSED</span> <span class="dt__chrome-sep">·</span> <span><span id="dt-position">--</span> / ${TAPE_LEN}</span> </div> <h1 class="dt__title">TAPE</h1> <p class="dt__tagline">a long tape of Nouns rolls past · the head plays the tone</p> </header> <section class="dt__deck"> <!-- Tape head — fixed in middle --> <div class="dt__head"> <span class="dt__head-mark"></span> <span class="dt__head-label">HEAD</span> </div> <!-- Tape --> <div class="dt__viewport"> <div class="dt__strip" id="dt-strip"> ${Array.from({ length: TAPE_LEN }, (_, i) => i).map((i) => renderTemplate`<div class="dt__seg"${addAttribute(i, "data-idx")}> <div class="dt__seg-bg"></div> <img class="dt__seg-noun" alt="" data-seg-noun loading="lazy"> <div class="dt__seg-tag"> <span data-seg-num>—</span> <span class="dt__seg-tone" data-seg-tone>—</span> </div> </div>`)} </div> </div> </section> <footer class="dt__transport"> <button class="dt__btn dt__btn--primary" id="dt-toggle" type="button">PLAY</button> <label class="dt__speed"> <span class="dt__speed-label">SPEED</span> <input type="range" id="dt-speed" min="0.4" max="3" step="0.1" value="1"> </label> <p class="dt__instructions">
Each segment passes under the head and plays its tone. Click any segment to JUMP. Drag the speed
        slider for slow brood (left) or quick patter (right).
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tape.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tape.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tape.astro";
const $$url = "/drum-tape";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTape,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
