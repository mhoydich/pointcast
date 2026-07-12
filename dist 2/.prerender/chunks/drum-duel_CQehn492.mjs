import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumDuel = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Duel · 1v1 Tap Race · PointCast";
  const description = "Two visitors. One queue. Twenty seconds. Whoever has more taps wins. Tap fast.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Duel",
    url: "https://pointcast.xyz/drum-duel",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dd" id="dd-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "duel" })} <header class="dd__header"> <div class="dd__chrome"> <span>DUEL</span> <span class="dd__chrome-sep">·</span> <span id="dd-status">IDLE</span> <span class="dd__chrome-sep">·</span> <span id="dd-timer">--</span> </div> <h1 class="dd__title">DUEL</h1> <p class="dd__tagline">1v1 · 20 seconds · whoever taps more wins</p> </header> <section class="dd__stage"> <div class="dd__player dd__player--p1" id="dd-p1"> <div class="dd__player-noun-wrap"> <img class="dd__player-noun" id="dd-p1-noun" src="" alt=""> </div> <div class="dd__player-pid" id="dd-p1-pid">—</div> <div class="dd__player-score" id="dd-p1-score">0</div> </div> <div class="dd__vs">vs</div> <div class="dd__player dd__player--p2" id="dd-p2"> <div class="dd__player-noun-wrap"> <img class="dd__player-noun" id="dd-p2-noun" src="" alt=""> </div> <div class="dd__player-pid" id="dd-p2-pid">—</div> <div class="dd__player-score" id="dd-p2-score">0</div> </div> </section> <section class="dd__action"> <button class="dd__btn dd__btn--primary" id="dd-action" type="button">JOIN QUEUE</button> </section> <section class="dd__pad-wrap" id="dd-pad-wrap" hidden> <button class="dd__pad" id="dd-pad" type="button" aria-label="Tap to score"> <svg viewBox="0 0 80 96" shape-rendering="crispEdges" aria-hidden="true"> <rect x="36" y="0" width="8" height="4" fill="#6b4d12"></rect> <rect x="32" y="4" width="16" height="6" fill="#b8862c"></rect> <path d="M 14 12 L 66 12 L 70 76 L 10 76 Z" fill="#d4a437"></path> <rect x="10" y="76" width="60" height="4" fill="#b8862c"></rect> <rect x="6" y="80" width="68" height="4" fill="#6b4d12"></rect> <rect x="38" y="84" width="4" height="8" fill="#3a2410"></rect> <rect x="20" y="22" width="3" height="40" fill="#fff5c0" opacity="0.5"></rect> </svg> </button> <p class="dd__pad-cue">tap fast · keyboard SPACE works too</p> </section> <section class="dd__recent" id="dd-recent"> <header>RECENT MATCHES</header> <ol id="dd-recent-list"><li class="dd__empty">— no matches yet —</li></ol> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-duel.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-duel.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-duel.astro";
const $$url = "/drum-duel";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumDuel,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
