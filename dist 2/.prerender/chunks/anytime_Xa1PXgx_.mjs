import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Anytime = createComponent(($$result, $$props, $$slots) => {
  const TRACK_ID = "7c37wgrjBNMnxAvGTXBJTT";
  const title = "I'd Have You Anytime — George Harrison";
  const description = `A PointCast listening room for "I'd Have You Anytime" by George Harrison. Side A, track one of All Things Must Pass. 2 minutes 57 seconds of welcome, co-written with Bob Dylan. 1970.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": "https://pointcast.xyz/anytime",
    name: "I'd Have You Anytime",
    byArtist: { "@type": "MusicGroup", name: "George Harrison" },
    inAlbum: { "@type": "MusicAlbum", name: "All Things Must Pass" },
    duration: "PT2M57S",
    datePublished: "1970-11-27",
    description
  };
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n    // Clock-tinted background: Harrison palette.\n    // Dawn gold → midday garden → amber afternoon → copper dusk → indigo night.\n    function paint() {\n      var now = new Date();\n      var h = now.getHours() + now.getMinutes() / 60;\n      var root = document.getElementById('anytime-main');\n      if (!root) return;\n      var hue, sat, light;\n      if      (h < 5)  { hue = 238; sat = 30; light = 10; }   // pre-dawn: deep indigo\n      else if (h < 8)  { hue = 38;  sat = 62; light = 74; }   // dawn: golden morning\n      else if (h < 12) { hue = 44;  sat = 48; light = 80; }   // morning: garden green-gold\n      else if (h < 15) { hue = 36;  sat = 58; light = 72; }   // afternoon: warm amber\n      else if (h < 18) { hue = 28;  sat = 64; light = 60; }   // golden hour\n      else if (h < 20) { hue = 18;  sat = 54; light = 42; }   // copper dusk\n      else if (h < 22) { hue = 270; sat = 38; light = 24; }   // twilight: lavender-purple\n      else             { hue = 238; sat = 30; light = 12; }   // night: indigo\n      var bg1 = 'hsl(' + hue + ',' + sat + '%,' + light + '%)';\n      var bg2 = 'hsl(' + (hue + 20) + ',' + (sat - 8) + '%,' + Math.max(5, light - 16) + '%)';\n      root.style.background = 'linear-gradient(160deg,' + bg1 + ' 0%,' + bg2 + ' 100%)';\n      root.classList.toggle('anytime--dark', light < 55);\n      var clock = document.getElementById('anytime-clock');\n      if (clock) {\n        var hh = String(now.getHours()).padStart(2, '0');\n        var mm = String(now.getMinutes()).padStart(2, '0');\n        clock.textContent = hh + ':' + mm + ' PT';\n      }\n    }\n    paint();\n    setInterval(paint, 60 * 1000);\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-y4tjkyvd": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="anytime" id="anytime-main" data-astro-cid-y4tjkyvd> <!-- floating dust motes --> <div class="anytime__dust" aria-hidden="true" data-astro-cid-y4tjkyvd> <span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span> <span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span><span data-astro-cid-y4tjkyvd></span> </div> <div class="anytime__frame" data-astro-cid-y4tjkyvd> <header class="anytime__head" data-astro-cid-y4tjkyvd> <p class="anytime__kicker" data-astro-cid-y4tjkyvd>ROOM · SPN · GEORGE HARRISON · 1970</p> <!-- CSS vinyl record with counter-rotating label --> <div class="anytime__vinyl-wrap" aria-hidden="true" data-astro-cid-y4tjkyvd> <div class="anytime__vinyl" data-astro-cid-y4tjkyvd> <div class="anytime__label-ring" data-astro-cid-y4tjkyvd> <span class="anytime__label-text" data-astro-cid-y4tjkyvd>ALL THINGS<br data-astro-cid-y4tjkyvd>MUST PASS</span> <span class="anytime__spindle" data-astro-cid-y4tjkyvd></span> </div> </div> <div class="anytime__arm" data-astro-cid-y4tjkyvd></div> </div> <h1 class="anytime__title" data-astro-cid-y4tjkyvd><em data-astro-cid-y4tjkyvd>I'd Have You Anytime</em></h1> <p class="anytime__byline" data-astro-cid-y4tjkyvd>GEORGE HARRISON — ALL THINGS MUST PASS</p> <p class="anytime__dek" data-astro-cid-y4tjkyvd>
Side A, track one. The first sound on the record.
          Before the wall of sound, before the flood —
          two minutes fifty-seven seconds of someone opening the door.
</p> </header> <section class="anytime__player" aria-label="Listen" data-astro-cid-y4tjkyvd> <iframe${addAttribute(`https://open.spotify.com/embed/track/${TRACK_ID}?utm_source=pointcast`, "src")} width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="I'd Have You Anytime — George Harrison" data-astro-cid-y4tjkyvd></iframe> </section> <section class="anytime__chips" aria-label="Song notes" data-astro-cid-y4tjkyvd> <span class="anytime__chip" data-astro-cid-y4tjkyvd>CO-WRITTEN WITH BOB DYLAN</span> <span class="anytime__chip" data-astro-cid-y4tjkyvd>WOODSTOCK · AUTUMN 1968</span> <span class="anytime__chip" data-astro-cid-y4tjkyvd>SIDE A · TRACK 1</span> <span class="anytime__chip" data-astro-cid-y4tjkyvd>2 MIN · 57 SEC</span> <span class="anytime__chip" data-astro-cid-y4tjkyvd>PHIL SPECTOR · PROD.</span> <span class="anytime__chip" data-astro-cid-y4tjkyvd>APPLE RECORDS · NOV 1970</span> </section> <section class="anytime__texture" data-astro-cid-y4tjkyvd> <p data-astro-cid-y4tjkyvd>
Dylan and Harrison wrote it together in Woodstock in the autumn of 1968 —
          Dylan teaching Harrison a gentler way in. Harrison placed it first
          because it lands like a hand on a shoulder before three hours of
          everything else that follows on the album.
</p> <p data-astro-cid-y4tjkyvd> <em data-astro-cid-y4tjkyvd>Let me roll it to you.</em> That's the second verse. Spector's
          production is almost restrained here — close guitar, close voice, a
          prologue that already knows the weight of what comes next. All Things
          Must Pass earned its long shadow. This earned the quiet before it.
</p> </section> <nav class="anytime__links" aria-label="Other rooms" data-astro-cid-y4tjkyvd> <a class="anytime__link" href="/room" data-astro-cid-y4tjkyvd> <span class="anytime__link-label" data-astro-cid-y4tjkyvd>/ROOM</span> <span class="anytime__link-desc" data-astro-cid-y4tjkyvd>the mix room · 10 tracks · 1h 11m</span> </a> <a class="anytime__link" href="/meditate" data-astro-cid-y4tjkyvd> <span class="anytime__link-label" data-astro-cid-y4tjkyvd>/MEDITATE</span> <span class="anytime__link-desc" data-astro-cid-y4tjkyvd>the ocean room · timed breathing</span> </a> <a class="anytime__link" href="/gandalf" data-astro-cid-y4tjkyvd> <span class="anytime__link-label" data-astro-cid-y4tjkyvd>/GANDALF</span> <span class="anytime__link-desc" data-astro-cid-y4tjkyvd>the hearth room · companion</span> </a> <a class="anytime__link" href="/" data-astro-cid-y4tjkyvd> <span class="anytime__link-label" data-astro-cid-y4tjkyvd>/</span> <span class="anytime__link-desc" data-astro-cid-y4tjkyvd>back to the broadcast</span> </a> </nav> <footer class="anytime__foot" data-astro-cid-y4tjkyvd> <span data-astro-cid-y4tjkyvd>on air · el segundo · fm 96.1 · cc0</span> <span id="anytime-clock" data-astro-cid-y4tjkyvd>—</span> </footer> </div> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/anytime.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/anytime.astro";
const $$url = "/anytime";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Anytime,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
