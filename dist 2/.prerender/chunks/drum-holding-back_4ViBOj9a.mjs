import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumHoldingBack = createComponent(($$result, $$props, $$slots) => {
  const title = "Holding Back the Years · drum room · PointCast";
  const description = `A slow drum room around Simply Red's "Holding Back the Years". Five soft pads tuned to E-minor pentatonic. Spotify embed up top. Tap quietly.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Room · Holding Back the Years",
    url: "https://pointcast.xyz/drum-holding-back",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const TRACK_ID = "1yg7fwwYmx9DQ2TdXUmfpJ";
  const PADS = [
    { note: "E", freq: 164.81, label: "E2", hue: 22 },
    { note: "G", freq: 196, label: "G2", hue: 50 },
    { note: "A", freq: 220, label: "A2", hue: 80 },
    { note: "B", freq: 246.94, label: "B2", hue: 200 },
    { note: "D", freq: 293.66, label: "D3", hue: 320 }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dh" id="dh-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "holding-back" })} <header class="dh__header"> <div class="dh__chrome"> <span>DRUM ROOM</span> <span class="dh__chrome-sep">·</span> <span>SIMPLY RED</span> <span class="dh__chrome-sep">·</span> <span>E MINOR PENTATONIC</span> </div> <h1 class="dh__title">HOLDING BACK<br>THE YEARS</h1> <p class="dh__tagline">tap quietly. the room is built for sitting in.</p> </header> <section class="dh__embed-wrap"> <iframe class="dh__embed" title="Holding Back the Years — Simply Red"${addAttribute(`https://open.spotify.com/embed/track/${TRACK_ID}?utm_source=pointcast`, "src")} width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe> </section> <section class="dh__pads" aria-label="Five soft drum pads tuned to E minor pentatonic"> ${PADS.map((p, i) => renderTemplate`<button class="dh__pad" type="button"${addAttribute(i, "data-idx")}${addAttribute(p.freq, "data-freq")}${addAttribute(`Pad ${p.label}`, "aria-label")}> <span class="dh__pad-note">${p.note}</span> <span class="dh__pad-octave">${p.label}</span> <span class="dh__pad-glow"${addAttribute(`background: radial-gradient(circle, oklch(0.65 0.20 ${p.hue}) 0%, transparent 70%);`, "style")}></span> </button>`)} </section> <footer class="dh__readout"> <div class="dh__panel"> <div class="dh__panel-label">YOUR TAPS</div> <div class="dh__panel-value" id="dh-taps">0</div> </div> <div class="dh__quote"> <span class="dh__quote-mark">"</span> <span class="dh__quote-text">i'll keep holding on</span> <span class="dh__quote-mark">"</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-holding-back.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-holding-back.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-holding-back.astro";
const $$url = "/drum-holding-back";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumHoldingBack,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
