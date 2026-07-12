import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

const $$DrumAltars = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Noun Altar · Tribute Chamber · PointCast";
  const description = "Five Noun altars rotating weekly. Ring the bell, leave a tribute. Bell, bowl, chime, gong, drone — five timbres in a velvet shrine.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Noun Tribute Altar",
    url: "https://pointcast.xyz/drum-altars",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const SSR_SEEDS = [42, 156, 411, 678, 805];
  const ALTAR_META = [
    { idx: 0, instrument: "bell", glyph: "✦", subtitle: "long brass" },
    { idx: 1, instrument: "bowl", glyph: "◉", subtitle: "singing" },
    { idx: 2, instrument: "chime", glyph: "✧", subtitle: "three-note" },
    { idx: 3, instrument: "gong", glyph: "◈", subtitle: "low strike" },
    { idx: 4, instrument: "drone", glyph: "✦", subtitle: "sustained" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="da" id="da-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "altars" })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "altars" })} <header class="da__header"> <div class="da__chrome"> <span class="da__week-label">WEEK</span> <span class="da__week" id="da-week">—</span> <span class="da__sep">·</span> <span class="da__total-label">TRIBUTES</span> <span class="da__total" id="da-total">—</span> </div> <h1 class="da__title">NOUN ALTAR</h1> <p class="da__tagline">
tribute chamber · five altars rotating weekly · ring the bell, leave a beat
</p> </header> <section class="da__altars" id="da-altars"> ${ALTAR_META.map((m, i) => renderTemplate`<article class="da__altar"${addAttribute(m.idx, "data-altar-idx")}${addAttribute(SSR_SEEDS[i], "data-seed")}> <div class="da__pediment" aria-hidden="true">${m.glyph}</div> <div class="da__frame"> <div class="da__frame-inner"> <img class="da__noun"${addAttribute(`https://noun.pics/${SSR_SEEDS[i]}.svg`, "src")}${addAttribute(`Noun #${SSR_SEEDS[i]}`, "alt")} loading="lazy"> </div> </div> <div class="da__nameplate">
NOUN <span class="da__nameplate-num" data-seed-text>${String(SSR_SEEDS[i]).padStart(4, "0")}</span> </div> <div class="da__instrument"> <span class="da__inst-name">${m.instrument.toUpperCase()}</span> <span class="da__inst-sub">${m.subtitle}</span> </div> <div class="da__count" data-count="0"> <span class="da__count-num" data-count-text>—</span> <span class="da__count-label">tributes offered</span> </div> <button class="da__ring" type="button" data-ring>RING</button> <div class="da__candle" aria-hidden="true"> <div class="da__flame"></div> <div class="da__wax"></div> </div> </article>`)} </section> <section class="da__feed"> <header class="da__feed-header"> <span class="da__feed-title">RECENT TRIBUTES</span> <span class="da__feed-sub">live · last 8</span> </header> <ol class="da__feed-list" id="da-feed"> <li class="da__feed-empty">— waiting for the first ring —</li> </ol> </section> <section class="da__how"> <h2>HOW THIS WORKS</h2> <ol class="da__how-list"> <li>
Five altars rotate every Monday. Seeds are deterministic from the ISO
          week — predictable but distinct each week.
</li> <li>
Tap <span class="da__kbd">RING</span> to leave a tribute. The altar's
          tone plays, the candle flares, the count goes up for everyone watching.
</li> <li>
Counts persist 14 days. Each week is its own shrine. Rate-limited to
          one tribute per altar per 5 seconds.
</li> <li>
Five timbres — <em>bell, bowl, chime, gong, drone</em> — pitched to
          stack pleasantly when more than one visitor rings at the same time.
</li> </ol> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-altars.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-altars.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-altars.astro";
const $$url = "/drum-altars";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAltars,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
