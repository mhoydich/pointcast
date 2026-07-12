import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumEcho = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Echo · Call and Response · PointCast";
  const description = "Record a 5-hit rhythmic phrase. The chamber plays you another visitor's phrase to echo. Async.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Echo",
    url: "https://pointcast.xyz/drum-echo",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="de" id="de-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "echo" })} <header class="de__header"> <div class="de__chrome"> <span>ECHO</span> <span class="de__chrome-sep">·</span> <span id="de-state">RECEIVE</span> <span class="de__chrome-sep">·</span> <span><span id="de-phrases">0</span> PHRASES IN CHAMBER</span> </div> <h1 class="de__title">ECHO</h1> <p class="de__tagline">listen first · then leave one</p> </header> <section class="de__stage"> <button class="de__bell" id="de-bell" type="button" aria-label="Tap the bell"> <svg viewBox="0 0 80 96" shape-rendering="crispEdges" aria-hidden="true"> <rect x="36" y="0" width="8" height="4" fill="#6b4d12"></rect> <rect x="32" y="4" width="16" height="6" fill="#b8862c"></rect> <path d="M 14 12 L 66 12 L 70 76 L 10 76 Z" fill="#d4a437"></path> <rect x="10" y="76" width="60" height="4" fill="#b8862c"></rect> <rect x="6" y="80" width="68" height="4" fill="#6b4d12"></rect> <rect x="38" y="84" width="4" height="8" fill="#3a2410"></rect> <rect x="20" y="22" width="3" height="40" fill="#fff5c0" opacity="0.5"></rect> <rect x="26" y="22" width="2" height="28" fill="#fff5c0" opacity="0.30"></rect> </svg> <span class="de__bell-glow"></span> </button> <div class="de__cue" id="de-cue">tap to begin</div> <div class="de__progress"> <span class="de__dot" data-i="0"></span> <span class="de__dot" data-i="1"></span> <span class="de__dot" data-i="2"></span> <span class="de__dot" data-i="3"></span> <span class="de__dot" data-i="4"></span> </div> </section> <footer class="de__controls"> <button class="de__btn" id="de-listen" type="button">RECEIVE A PHRASE</button> <button class="de__btn de__btn--primary" id="de-record" type="button">LEAVE A PHRASE</button> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-echo.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-echo.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-echo.astro";
const $$url = "/drum-echo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumEcho,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
