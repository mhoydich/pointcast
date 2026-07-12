import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumVespers = createComponent(($$result, $$props, $$slots) => {
  const title = "Vespers · Bell on the Hour · PointCast";
  const description = "A bell tower that tolls automatically on every hour boundary. Open it, leave it open, listen. Bell-wing ambient surface.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Vespers",
    url: "https://pointcast.xyz/drum-vespers",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dv" id="dv-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "vespers" })} <header class="dv__header"> <div class="dv__chrome"> <span>BELLS ON THE HOUR</span> <span class="dv__chrome-sep">·</span> <span>12-COUNT</span> <span class="dv__chrome-sep">·</span> <span id="dv-clock">--:--</span> </div> <h1 class="dv__title">VESPERS</h1> <p class="dv__tagline">a bell tower that remembers the hour for you</p> </header> <section class="dv__stage" aria-label="Vespers bell tower"> <!-- Tower silhouette + tolling bell --> <div class="dv__tower"> <svg viewBox="0 0 240 320" shape-rendering="crispEdges" aria-hidden="true"> <!-- spire roof --> <path d="M 100 12 L 140 12 L 145 22 L 95 22 Z" fill="#6b4d12"></path> <path d="M 90 22 L 150 22 L 155 30 L 85 30 Z" fill="#b8862c"></path> <!-- belfry housing --> <rect x="78" y="30" width="84" height="76" fill="#3a2410"></rect> <rect x="80" y="32" width="80" height="72" fill="#1a0820"></rect> <!-- columns --> <rect x="86" y="32" width="6" height="72" fill="#6b4d12"></rect> <rect x="148" y="32" width="6" height="72" fill="#6b4d12"></rect> <!-- belfry top trim --> <rect x="76" y="106" width="88" height="6" fill="#d4a437"></rect> <rect x="74" y="112" width="92" height="3" fill="#6b4d12"></rect> <!-- main tower body --> <rect x="78" y="115" width="84" height="180" fill="#2c0d36"></rect> <rect x="80" y="115" width="80" height="180" fill="#1a0820"></rect> <!-- vertical highlight --> <rect x="84" y="115" width="2" height="180" fill="#6b4d12" opacity="0.6"></rect> <rect x="154" y="115" width="2" height="180" fill="#6b4d12" opacity="0.6"></rect> <!-- arched windows --> <rect x="106" y="140" width="28" height="40" fill="#0c0410"></rect> <path d="M 106 140 Q 120 132 134 140 Z" fill="#6b4d12"></path> <rect x="106" y="200" width="28" height="40" fill="#0c0410"></rect> <path d="M 106 200 Q 120 192 134 200 Z" fill="#6b4d12"></path> <!-- base --> <rect x="68" y="295" width="104" height="14" fill="#3a2410"></rect> <rect x="64" y="309" width="112" height="6" fill="#6b4d12"></rect> </svg> <!-- The bell hangs in the belfry, animated when tolling --> <div class="dv__bell" id="dv-bell"> <svg viewBox="0 0 60 70" shape-rendering="crispEdges" aria-hidden="true"> <path d="M 12 14 L 48 14 L 50 56 L 10 56 Z" fill="#d4a437"></path> <rect x="10" y="56" width="40" height="3" fill="#b8862c"></rect> <rect x="8" y="59" width="44" height="3" fill="#6b4d12"></rect> <rect x="16" y="22" width="2" height="22" fill="#fff5c0" opacity="0.55"></rect> <rect x="26" y="6" width="8" height="2" fill="#6b4d12"></rect> <rect x="24" y="8" width="12" height="6" fill="#b8862c"></rect> <rect x="29" y="62" width="2" height="6" fill="#3a2410"></rect> <circle cx="30" cy="68" r="2" fill="#3a2410"></circle> </svg> </div> </div> </section> <section class="dv__readout"> <div class="dv__panel"> <div class="dv__panel-label">NEXT TOLL</div> <div class="dv__panel-value" id="dv-countdown">--:--</div> </div> <div class="dv__panel"> <div class="dv__panel-label">LAST TOLL</div> <div class="dv__panel-value" id="dv-last">—</div> </div> <div class="dv__panel"> <div class="dv__panel-label">TOLLS TODAY</div> <div class="dv__panel-value" id="dv-today">0</div> </div> </section> <footer class="dv__footer"> <button class="dv__manual" id="dv-manual" type="button">TOLL NOW</button> <p class="dv__footer-text">
Sound is muted until you click. Browsers don't allow audio without a gesture; click any toll button or anywhere in the page once to unlock the bells. After that, hourly tolls play on their own.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-vespers.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-vespers.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-vespers.astro";
const $$url = "/drum-vespers";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumVespers,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
