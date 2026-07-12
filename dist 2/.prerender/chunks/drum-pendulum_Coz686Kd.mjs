import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumPendulum = createComponent(($$result, $$props, $$slots) => {
  const title = "Pendulum · Brass Bell on a Rope · PointCast";
  const description = "A single brass bell swings on a long rope. Click anywhere to push it; each apex rings. Energy decays over 30 seconds. Meditative bell-wing surface.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Pendulum",
    url: "https://pointcast.xyz/drum-pendulum",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dp" id="dp-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "pendulum" })} <header class="dp__header"> <div class="dp__chrome"> <span>BRASS BELL</span> <span class="dp__chrome-sep">·</span> <span>30-SECOND DECAY</span> <span class="dp__chrome-sep">·</span> <span>CLICK TO PUSH</span> </div> <h1 class="dp__title">PENDULUM</h1> <p class="dp__tagline">a single bell on a long rope, hanging in the dark</p> </header> <section class="dp__field" id="dp-field" aria-label="Pendulum field — click to push"> <!-- Pivot beam (decorative) --> <div class="dp__beam"></div> <div class="dp__pivot"></div> <!-- The pendulum itself: positioned absolutely, transforms apply rotation --> <div class="dp__arm" id="dp-arm"> <div class="dp__rope"></div> <div class="dp__bell"> <svg viewBox="0 0 60 70" shape-rendering="crispEdges" aria-hidden="true"> <!-- bell body --> <path d="M 12 14 L 48 14 L 50 56 L 10 56 Z" fill="#d4a437"></path> <rect x="10" y="56" width="40" height="3" fill="#b8862c"></rect> <rect x="8" y="59" width="44" height="3" fill="#6b4d12"></rect> <!-- highlight --> <rect x="16" y="22" width="2" height="22" fill="#fff5c0" opacity="0.55"></rect> <rect x="20" y="22" width="1" height="14" fill="#fff5c0" opacity="0.35"></rect> <!-- top ring --> <rect x="26" y="6" width="8" height="2" fill="#6b4d12"></rect> <rect x="24" y="8" width="12" height="6" fill="#b8862c"></rect> <rect x="26" y="10" width="8" height="2" fill="#fff5c0" opacity="0.4"></rect> <!-- clapper visible at bottom --> <rect x="29" y="62" width="2" height="6" fill="#3a2410"></rect> <circle cx="30" cy="68" r="2" fill="#3a2410"></circle> </svg> </div> </div> <!-- Strike post (fixed, doesn't move) - lives on left wall, bell strikes it on apex --> <div class="dp__post"></div> <div class="dp__caption">click anywhere on the velvet to push the pendulum</div> </section> <footer class="dp__readout"> <div class="dp__stat"> <span class="dp__stat-num" id="dp-swings">0</span> <span class="dp__stat-label">swings</span> </div> <div class="dp__stat"> <span class="dp__stat-num" id="dp-rings">0</span> <span class="dp__stat-label">rings</span> </div> <div class="dp__stat"> <span class="dp__stat-num" id="dp-arc">0°</span> <span class="dp__stat-label">widest arc</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-pendulum.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-pendulum.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-pendulum.astro";
const $$url = "/drum-pendulum";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumPendulum,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
