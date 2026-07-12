import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumAltarsTv = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Noun Altar TV · Tribute Chamber Cast · PointCast";
  const description = "Projection cast of the five-altar tribute chamber. Watch tributes land in real time. Bell, bowl, chime, gong, drone — five timbres in a velvet shrine, sized for a TV.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Noun Altar TV",
    url: "https://pointcast.xyz/drum-altars-tv",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const ALTAR_META = [
    { idx: 0, instrument: "bell", glyph: "✦", subtitle: "long brass" },
    { idx: 1, instrument: "bowl", glyph: "◉", subtitle: "singing" },
    { idx: 2, instrument: "chime", glyph: "✧", subtitle: "three-note" },
    { idx: 3, instrument: "gong", glyph: "◈", subtitle: "low strike" },
    { idx: 4, instrument: "drone", glyph: "✦", subtitle: "sustained" }
  ];
  const SSR_SEEDS = [42, 156, 411, 678, 805];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dat" id="dat-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "altars-tv" })} <header class="dat__header"> <div class="dat__chrome-row"> <div class="dat__chrome"> <span class="dat__chrome-label">WEEK</span> <span class="dat__chrome-val" id="dat-week">—</span> </div> <div class="dat__chrome"> <span class="dat__chrome-label">TRIBUTES</span> <span class="dat__chrome-val" id="dat-total">—</span> </div> <div class="dat__chrome"> <span class="dat__chrome-label">LIVE</span> <span class="dat__chrome-val" id="dat-live"><span class="dat__pulse"></span> ON AIR</span> </div> </div> <h1 class="dat__title">NOUN ALTAR</h1> <p class="dat__tagline">tribute chamber · cast view · sized for a sixty-inch screen</p> </header> <section class="dat__altars" id="dat-altars"> ${ALTAR_META.map((m, i) => renderTemplate`<article class="dat__altar"${addAttribute(m.idx, "data-altar-idx")}${addAttribute(SSR_SEEDS[i], "data-seed")}> <div class="dat__pediment" aria-hidden="true">${m.glyph}</div> <div class="dat__frame"> <div class="dat__frame-inner"> <img class="dat__noun"${addAttribute(`https://noun.pics/${SSR_SEEDS[i]}.svg`, "src")}${addAttribute(`Noun #${SSR_SEEDS[i]}`, "alt")} loading="lazy"> </div> </div> <div class="dat__nameplate">
NOUN <span class="dat__nameplate-num" data-seed-text>${String(SSR_SEEDS[i]).padStart(4, "0")}</span> </div> <div class="dat__instrument"> <span class="dat__inst-name">${m.instrument.toUpperCase()}</span> <span class="dat__inst-sub">${m.subtitle}</span> </div> <div class="dat__count"> <span class="dat__count-num" data-count-text>—</span> <span class="dat__count-label">tributes</span> </div> <div class="dat__candle" aria-hidden="true"> <div class="dat__flame"></div> <div class="dat__wax"></div> </div> </article>`)} </section> <footer class="dat__feed"> <div class="dat__feed-label">LATEST</div> <div class="dat__feed-marquee"> <div class="dat__feed-track" id="dat-feed-track"> <span class="dat__feed-empty">— waiting for the first ring —</span> </div> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-altars-tv.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-altars-tv.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-altars-tv.astro";
const $$url = "/drum-altars-tv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAltarsTv,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
