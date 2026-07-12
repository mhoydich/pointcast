import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumStation = createComponent(($$result, $$props, $$slots) => {
  const title = "Station · Five Intention Channels · PointCast";
  const description = "A drum radio station. Five intention modes — focus, work, calm, energize, dream. Generative ambient. Listen while.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Station",
    url: "https://pointcast.xyz/drum-station",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const STATIONS = [
    { id: "focus", label: "FOCUS", sub: "C drone · slow", hue: 200, freq: "92.5" },
    { id: "work", label: "WORK", sub: "Cmaj9 · 60 bpm", hue: 50, freq: "94.3" },
    { id: "calm", label: "CALM", sub: "Em7 · breath", hue: 280, freq: "96.1" },
    { id: "energize", label: "ENERGIZE", sub: "Bbmaj7 · 90 bpm", hue: 22, freq: "98.7" },
    { id: "dream", label: "DREAM", sub: "sine swells · arrhythmic", hue: 320, freq: "101.5" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ds" id="ds-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "station" })} <header class="ds__header"> <div class="ds__chrome"> <span>STATION</span> <span class="ds__chrome-sep">·</span> <span class="ds__chrome-state" id="ds-state">OFF AIR</span> <span class="ds__chrome-sep">·</span> <span class="ds__chrome-time" id="ds-elapsed">--:--</span> </div> <h1 class="ds__title">STATION</h1> <p class="ds__tagline">five intentions · listen while you work</p> </header> <section class="ds__dial" aria-label="Five station selector"> <div class="ds__dial-arc"> <svg viewBox="0 0 600 180" shape-rendering="crispEdges" aria-hidden="true" class="ds__dial-svg"> <!-- arc baseline --> <path d="M 60 150 Q 300 -10 540 150" fill="none" stroke="#6b4d12" stroke-width="2"></path> <path d="M 60 150 Q 300 -10 540 150" fill="none" stroke="#d4a437" stroke-width="1" opacity="0.5" stroke-dasharray="2 6"></path> <!-- station ticks (5 evenly spaced) --> ${STATIONS.map((_s, i) => {
    const t = i / 4;
    const x = 60 + 480 * t;
    const y = 150 - Math.sin(Math.PI * t) * 110;
    return renderTemplate`<circle${addAttribute(x, "cx")}${addAttribute(y, "cy")} r="3" fill="#d4a437"></circle>`;
  })} </svg> <!-- needle: positioned absolutely, JS sets transform --> <div class="ds__needle" id="ds-needle"></div> </div> <div class="ds__buttons"> ${STATIONS.map((s) => renderTemplate`<button class="ds__station" type="button"${addAttribute(s.id, "data-station")}${addAttribute(`Tune to ${s.label}`, "aria-label")}> <div class="ds__station-marker"${addAttribute(`background: oklch(0.65 0.20 ${s.hue}); box-shadow: 0 0 16px oklch(0.65 0.22 ${s.hue} / 0.55);`, "style")}></div> <div class="ds__station-text"> <div class="ds__station-freq">${s.freq}</div> <div class="ds__station-label">${s.label}</div> <div class="ds__station-sub">${s.sub}</div> </div> </button>`)} </div> </section> <section class="ds__transport"> <button class="ds__btn ds__btn--ghost" id="ds-mute" type="button" hidden>MUTE</button> <div class="ds__panel"> <span class="ds__panel-label">CURRENT</span> <span class="ds__panel-value" id="ds-current">—</span> </div> </section> <section class="ds__how"> <p>
Each station generates infinite ambient audio tuned to its intention. <strong>Focus</strong> is a
        single low drone for sustained attention. <strong>Work</strong> is a 60bpm pulse over a Cmaj9 pad.
<strong>Calm</strong> breathes with you (Em7, 4s-in/6s-out). <strong>Energize</strong> brightens
        the room with a Bbmaj7 stack at 90bpm. <strong>Dream</strong> drops rhythm entirely, layering slow
        sine swells in arrhythmia.
</p> <p>
Crossfade between stations is ~1.2 seconds. Open the page, pick a station, leave the tab in the
        background. Audio gates on first click — browsers don't allow autoplay.
</p> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-station.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-station.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-station.astro";
const $$url = "/drum-station";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumStation,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
