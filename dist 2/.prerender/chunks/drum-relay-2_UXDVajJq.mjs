import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumRelay2 = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Relay 2 · Pass the Beat · PointCast";
  const description = "Tap three times, leave a fragment. The chamber strings 12 fragments together and plays them as one chain.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Relay 2",
    url: "https://pointcast.xyz/drum-relay-2",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dr2" id="dr2-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "relay-2" })} <header class="dr2__header"> <div class="dr2__chrome"> <span>RELAY · CHAIN</span> <span class="dr2__chrome-sep">·</span> <span><span id="dr2-len">0</span> / 12 LINKS</span> <span class="dr2__chrome-sep">·</span> <span id="dr2-state">RECORD</span> </div> <h1 class="dr2__title">RELAY</h1> <p class="dr2__tagline">three taps · one fragment · twelve fragments make one chain</p> </header> <section class="dr2__stage"> <button class="dr2__pad" id="dr2-pad" type="button" aria-label="Tap to record fragment"> <svg viewBox="0 0 80 96" shape-rendering="crispEdges" aria-hidden="true"> <rect x="36" y="0" width="8" height="4" fill="#6b4d12"></rect> <rect x="32" y="4" width="16" height="6" fill="#b8862c"></rect> <path d="M 14 12 L 66 12 L 70 76 L 10 76 Z" fill="#d4a437"></path> <rect x="10" y="76" width="60" height="4" fill="#b8862c"></rect> <rect x="6" y="80" width="68" height="4" fill="#6b4d12"></rect> <rect x="38" y="84" width="4" height="8" fill="#3a2410"></rect> <rect x="20" y="22" width="3" height="40" fill="#fff5c0" opacity="0.5"></rect> </svg> </button> <div class="dr2__progress"> <span class="dr2__dot" data-i="0"></span> <span class="dr2__dot" data-i="1"></span> <span class="dr2__dot" data-i="2"></span> </div> <div class="dr2__cue" id="dr2-cue">tap three times to leave your fragment</div> </section> <section class="dr2__controls"> <button class="dr2__btn dr2__btn--primary" id="dr2-play" type="button">PLAY THE CHAIN</button> <button class="dr2__btn" id="dr2-record-again" type="button" hidden>RECORD AGAIN</button> </section> <section class="dr2__chain" id="dr2-chain"> <header>THE CHAIN</header> <ol id="dr2-chain-list"><li class="dr2__empty">— first fragment, then it fills —</li></ol> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-relay-2.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-relay-2.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-relay-2.astro";
const $$url = "/drum-relay-2";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumRelay2,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
