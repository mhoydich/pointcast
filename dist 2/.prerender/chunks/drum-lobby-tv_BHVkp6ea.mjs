import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$DrumLobbyTv = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Lobby TV · Wing Presence Dashboard · PointCast";
  const description = "Big-screen projection of the wing's live presence: room visitors, wing visitors, procession steps, echo phrases.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Drum Lobby TV",
    url: "https://pointcast.xyz/drum-lobby-tv",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dlt" id="dlt-main"> <header class="dlt__chrome"> <span class="dlt__chrome-label">LOBBY TV</span> <span class="dlt__chrome-sep">·</span> <span class="dlt__chrome-time" id="dlt-time">--:--</span> <span class="dlt__chrome-sep">·</span> <span class="dlt__chrome-on">● ON AIR</span> </header> <section class="dlt__hero"> <div class="dlt__hero-num" id="dlt-hero-num">—</div> <div class="dlt__hero-label" id="dlt-hero-label">VISITORS IN THE WING</div> </section> <section class="dlt__panels"> <div class="dlt__panel"> <div class="dlt__panel-label">DRUM-ROOM</div> <div class="dlt__panel-num" id="dlt-room">—</div> <div class="dlt__panel-sub">brass lights live</div> </div> <div class="dlt__panel"> <div class="dlt__panel-label">PROCESSION</div> <div class="dlt__panel-num" id="dlt-procession">—</div> <div class="dlt__panel-sub">total steps walked</div> </div> <div class="dlt__panel"> <div class="dlt__panel-label">ECHO</div> <div class="dlt__panel-num" id="dlt-echo">—</div> <div class="dlt__panel-sub">phrases in chamber</div> </div> <div class="dlt__panel"> <div class="dlt__panel-label">ALTARS</div> <div class="dlt__panel-num" id="dlt-altars">—</div> <div class="dlt__panel-sub">tributes this week</div> </div> </section> <section class="dlt__feed"> <header class="dlt__feed-header">RECENT ACROSS THE WING</header> <ol class="dlt__feed-list" id="dlt-feed"> <li class="dlt__feed-empty">— gathering —</li> </ol> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-lobby-tv.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-lobby-tv.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-lobby-tv.astro";
const $$url = "/drum-lobby-tv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumLobbyTv,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
