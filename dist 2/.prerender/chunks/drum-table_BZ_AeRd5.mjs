import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumTable = createComponent(($$result, $$props, $$slots) => {
  const title = "Table · Five-Seat Conference Instrument · PointCast";
  const description = "Five large pads tuned for ambient layering. For an in-person group around a table or screen.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Table",
    url: "https://pointcast.xyz/drum-table",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const PADS = [
    { note: "C", freq: 130.81, label: "C3", hue: 22 },
    { note: "E", freq: 164.81, label: "E3", hue: 60 },
    { note: "G", freq: 196, label: "G3", hue: 200 },
    { note: "B", freq: 246.94, label: "B3", hue: 280 },
    { note: "D", freq: 293.66, label: "D4", hue: 320 }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dt" id="dt-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "table" })} <header class="dt__header"> <div class="dt__chrome"> <span>TABLE</span> <span class="dt__chrome-sep">·</span> <span>FIVE SEATS · CMAJ7 PAD</span> <span class="dt__chrome-sep">·</span> <span><span id="dt-taps">0</span> TAPS</span> </div> <h1 class="dt__title">TABLE</h1> <p class="dt__tagline">five seats · five tones · play together quietly</p> </header> <section class="dt__pads"> ${PADS.map((p, i) => renderTemplate`<button class="dt__pad" type="button"${addAttribute(i, "data-idx")}${addAttribute(p.freq, "data-freq")}${addAttribute(`Pad ${p.label}`, "aria-label")}> <span class="dt__pad-note">${p.note}</span> <span class="dt__pad-octave">${p.label}</span> <span class="dt__pad-glow"${addAttribute(`background: radial-gradient(circle, oklch(0.65 0.20 ${p.hue}) 0%, transparent 70%);`, "style")}></span> </button>`)} </section> <p class="dt__note">
Tones held softly with 1.6s decay. Tap multiple pads in succession or have a few people tap at once;
      Cmaj7 is forgiving. Built for in-person groups around a screen, with optional projection on a TV.
</p> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-table.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-table.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-table.astro";
const $$url = "/drum-table";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTable,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
