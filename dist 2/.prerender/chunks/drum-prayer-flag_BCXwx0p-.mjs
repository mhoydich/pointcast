import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumPrayerFlag = createComponent(($$result, $$props, $$slots) => {
  const title = "Prayer Flags · Nine in the Wind · PointCast";
  const description = "Nine pixel-art prayer flags strung on a wire, each with a Noun. Swaying in the wind. Click a flag to raise it.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Prayer Flags",
    url: "https://pointcast.xyz/drum-prayer-flag",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const FLAG_COLORS = [
    { fill: "#c4351c", name: "crimson" },
    { fill: "#d4a437", name: "gold" },
    { fill: "#c9982a", name: "amber" },
    { fill: "#0d8c5e", name: "green" },
    { fill: "#0c5da8", name: "cobalt" },
    { fill: "#5a2e8e", name: "violet" },
    { fill: "#d6346a", name: "magenta" },
    { fill: "#3aa9c4", name: "cyan" },
    { fill: "#f4e7c8", name: "cream" }
  ];
  const SSR_SEEDS = [42, 156, 411, 678, 805, 96, 234, 1100, 808];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dpf" id="dpf-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "prayer-flag" })} <header class="dpf__header"> <div class="dpf__chrome"> <span>NINE FLAGS</span> <span class="dpf__chrome-sep">·</span> <span id="dpf-day">DAY ---</span> <span class="dpf__chrome-sep">·</span> <span id="dpf-raises">0 RAISES</span> </div> <h1 class="dpf__title">PRAYER FLAGS</h1> <p class="dpf__tagline">nine on a wire — the wind blows the Nouns</p> </header> <section class="dpf__sky" aria-label="Click a flag to raise it"> <!-- Wire across the top --> <div class="dpf__wire"></div> <div class="dpf__row"> ${FLAG_COLORS.map((c, i) => renderTemplate`<button class="dpf__flag" type="button"${addAttribute(i, "data-idx")}${addAttribute(`Flag ${i + 1}, ${c.name}`, "aria-label")}> <div class="dpf__flag-tie"></div> <svg class="dpf__flag-svg" viewBox="0 0 60 80" shape-rendering="crispEdges" aria-hidden="true"> <!-- Triangular flag silhouette --> <path d="M 0 4 L 60 4 L 60 60 L 30 80 L 0 60 Z"${addAttribute(c.fill, "fill")}></path> <!-- subtle inner border --> <path d="M 4 8 L 56 8 L 56 58 L 30 75 L 4 58 Z" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1"></path> <!-- Noun image lives in the flag's belly via overlaid <img> outside SVG so it can be inlined dynamically --> </svg> <img class="dpf__flag-noun"${addAttribute(`https://noun.pics/${SSR_SEEDS[i]}.svg`, "src")} alt=""${addAttribute(i, "data-seed-slot")}> </button>`)} </div> </section> <footer class="dpf__readout"> <p class="dpf__caption">click a flag · each color holds a different bell tone · raises persist this session</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-prayer-flag.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-prayer-flag.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-prayer-flag.astro";
const $$url = "/drum-prayer-flag";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumPrayerFlag,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
