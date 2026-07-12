import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumBellJar = createComponent(($$result, $$props, $$slots) => {
  const title = "Bell Jar · Shake the Glass · PointCast";
  const description = "A glass jar full of brass bells. Click the jar to shake; the bells inside jingle in random pentatonic notes. Pure ambient.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bell Jar",
    url: "https://pointcast.xyz/drum-bell-jar",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bj" id="bj-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "bell-jar" })} <header class="bj__header"> <div class="bj__chrome"> <span>SHAKE THE GLASS</span> <span class="bj__chrome-sep">·</span> <span>PENTATONIC</span> <span class="bj__chrome-sep">·</span> <span>SEVEN BELLS INSIDE</span> </div> <h1 class="bj__title">BELL JAR</h1> <p class="bj__tagline">a small chamber of bells under glass</p> </header> <section class="bj__stage" id="bj-stage" aria-label="Bell jar — click to shake"> <button class="bj__jar" id="bj-jar" type="button" aria-label="Shake the bell jar"> <!-- Jar SVG: glass body + cork stopper + brass band --> <svg class="bj__jar-svg" viewBox="0 0 200 280" aria-hidden="true" shape-rendering="crispEdges"> <!-- cork --> <rect x="80" y="0" width="40" height="14" fill="#5a3a18"></rect> <rect x="78" y="14" width="44" height="6" fill="#7a4a20"></rect> <!-- jar neck --> <rect x="74" y="20" width="52" height="22" fill="rgba(212, 164, 55, 0.18)" stroke="#d4a437" stroke-width="2"></rect> <rect x="70" y="42" width="60" height="6" fill="#d4a437"></rect> <!-- jar body (rounded glass) --> <path d="M 70 48 Q 30 60 30 130 L 30 240 Q 30 266 60 270 L 140 270 Q 170 266 170 240 L 170 130 Q 170 60 130 48 Z" fill="rgba(212, 164, 55, 0.10)" stroke="#d4a437" stroke-width="2.5"></path> <!-- highlight --> <path d="M 50 80 Q 40 110 40 180" fill="none" stroke="#fff5c0" stroke-width="2" opacity="0.5"></path> <path d="M 60 70 Q 50 100 50 160" fill="none" stroke="#fff5c0" stroke-width="1" opacity="0.3"></path> <!-- nameplate brass band --> <rect x="40" y="200" width="120" height="18" fill="#6b4d12" stroke="#d4a437" stroke-width="1"></rect> <text x="100" y="213" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="3" fill="#f4e7c8">BELL JAR · 7</text> </svg> <!-- Bells inside the jar (positioned absolutely) --> <div class="bj__bells" id="bj-bells"> <!-- 7 small bells, positioned in jar coordinates --> <span class="bj__bell" style="left: 38%; top: 36%; --rot: -8deg;"></span> <span class="bj__bell" style="left: 56%; top: 32%; --rot: 12deg;"></span> <span class="bj__bell" style="left: 30%; top: 52%; --rot: -16deg;"></span> <span class="bj__bell" style="left: 50%; top: 58%; --rot: 4deg;"></span> <span class="bj__bell" style="left: 64%; top: 56%; --rot: 18deg;"></span> <span class="bj__bell" style="left: 42%; top: 76%; --rot: -10deg;"></span> <span class="bj__bell" style="left: 58%; top: 80%; --rot: 8deg;"></span> </div> </button> <div class="bj__caption">click anywhere on the jar — or press <kbd>space</kbd></div> </section> <footer class="bj__readout"> <div class="bj__stat"> <span class="bj__stat-num" id="bj-shakes">0</span> <span class="bj__stat-label">shakes</span> </div> <div class="bj__stat"> <span class="bj__stat-num" id="bj-rings">0</span> <span class="bj__stat-label">rings</span> </div> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-jar.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-jar.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-bell-jar.astro";
const $$url = "/drum-bell-jar";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumBellJar,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
