import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Room = createComponent(($$result, $$props, $$slots) => {
  const PLAYLIST_ID = "70fhAntBCL9jp5VxH8BK5L";
  const title = "/room — a listening room for the mix";
  const description = "Press play. 10 tracks, 1h 11m. Katherine Jenkins, Pachelbel, Donna McKevitt, Thompson Twins, Sun Ra, and the spaces between. A reverent, eclectic room-mix curated by Mike.";
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n    // Tint the room by clock hour, sibling behavior to /tonight.\n    function paint() {\n      var now = new Date();\n      var h = now.getHours() + now.getMinutes() / 60;\n      var root = document.getElementById('room-main');\n      if (!root) return;\n      var hue, sat, light;\n      if (h < 6)           { hue = 240; sat = 22; light = 14; }\n      else if (h < 10)     { hue = 38;  sat = 52; light = 80; }\n      else if (h < 14)     { hue = 48;  sat = 40; light = 84; }\n      else if (h < 17)     { hue = 34;  sat = 52; light = 74; }\n      else if (h < 19)     { hue = 22;  sat = 58; light = 66; }\n      else if (h < 21)     { hue = 260; sat = 34; light = 30; }\n      else                 { hue = 240; sat = 30; light = 18; }\n      var bg1 = 'hsl(' + hue + ',' + sat + '%,' + light + '%)';\n      var bg2 = 'hsl(' + (hue + 24) + ',' + (sat - 10) + '%,' + Math.max(6, light - 12) + '%)';\n      root.style.background = 'linear-gradient(180deg,' + bg1 + ' 0%,' + bg2 + ' 100%)';\n      root.classList.toggle('room--dark', light < 50);\n\n      var clock = document.getElementById('room-clock');\n      if (clock) {\n        var hh = String(now.getHours()).padStart(2, '0');\n        var mm = String(now.getMinutes()).padStart(2, '0');\n        clock.textContent = hh + ':' + mm + ' PT';\n      }\n    }\n    paint();\n    setInterval(paint, 60 * 1000);\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-c26fofev": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="room" id="room-main" data-astro-cid-c26fofev> <div class="room__frame" data-astro-cid-c26fofev> <header class="room__head" data-astro-cid-c26fofev> <p class="room__kicker mono" data-astro-cid-c26fofev>ROOM · ✨🙌✨ · MIX · EL SEGUNDO</p> <h1 class="room__title" data-astro-cid-c26fofev>Press play. Stay a while.</h1> <p class="room__dek" data-astro-cid-c26fofev>
Ten tracks. An hour and eleven minutes. Starts at
<em data-astro-cid-c26fofev>Blinded By Your Grace</em> with Katherine Jenkins,
          passes through Pachelbel's canon and Donna McKevitt,
          lands on Thompson Twins, ends somewhere near Sun Ra's
          door of the cosmos. Put it on. Walk around. Fix something.
</p> </header> <section class="room__player" aria-label="The mix" data-astro-cid-c26fofev> <iframe${addAttribute(`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=pointcast`, "src")} width="100%" height="420" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="PointCast room — mhoydich's ✨🙌✨ mix" data-astro-cid-c26fofev></iframe> <p class="room__credit mono" data-astro-cid-c26fofev>
10 TRACKS · 1H 11M · CURATED BY MHOYDICH
</p> </section> <section class="room__texture" data-astro-cid-c26fofev> <p data-astro-cid-c26fofev>
Rooms have moods, not setlists. This one is the mix for when
          the marine layer holds past noon and the afternoon softens.
          The Pachelbel is the hinge. The Thompson Twins is the kindness.
          Sun Ra is the door you leave through, not the door you arrive at.
</p> <p data-astro-cid-c26fofev> <em data-astro-cid-c26fofev>Blinded by your grace</em> — the line lands like a benediction
          two minutes in. If the room feels right, stay another lap. If it
          doesn't, the mix doesn't mind. Pass through.
</p> </section> <nav class="room__links" aria-label="Other rooms" data-astro-cid-c26fofev> <a class="room__link room__link--primary" href="/tonight" data-astro-cid-c26fofev> <span class="room__link-label mono" data-astro-cid-c26fofev>/TONIGHT</span> <span class="room__link-desc" data-astro-cid-c26fofev>the single-song room · Kid Francescoli · marine layer</span> </a> <a class="room__link" href="/meditate" data-astro-cid-c26fofev> <span class="room__link-label mono" data-astro-cid-c26fofev>/MEDITATE</span> <span class="room__link-desc" data-astro-cid-c26fofev>the ocean room · timed breathing</span> </a> <a class="room__link" href="/gandalf" data-astro-cid-c26fofev> <span class="room__link-label mono" data-astro-cid-c26fofev>/GANDALF</span> <span class="room__link-desc" data-astro-cid-c26fofev>the hearth room · companion + keepsake</span> </a> <a class="room__link" href="/bath" data-astro-cid-c26fofev> <span class="room__link-label mono" data-astro-cid-c26fofev>/BATH</span> <span class="room__link-desc" data-astro-cid-c26fofev>the color-wave room · four moods, four fields</span> </a> <a class="room__link" href="/" data-astro-cid-c26fofev> <span class="room__link-label mono" data-astro-cid-c26fofev>/</span> <span class="room__link-desc" data-astro-cid-c26fofev>back to the broadcast</span> </a> </nav> <footer class="room__foot mono" data-astro-cid-c26fofev> <span data-astro-cid-c26fofev>on air · el segundo · fm 96.1 · cc0</span> <span class="room__time" id="room-clock" data-astro-cid-c26fofev>—</span> </footer> </div> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/room.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/room.astro";
const $$url = "/room";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Room,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
