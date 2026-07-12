import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumFives = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Fives & Bells · Wing Index · PointCast";
  const description = "Eight surfaces in two wings — the chamber and its bell variants. Fives wing: quintet, altars, altars-tv. Bell wing: fall, jar, pendulum, vespers, saint.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Fives & Bells Wing Index",
    url: "https://pointcast.xyz/drum-fives",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const FIVES = [
    { id: "quintet", href: "/drum-quintet", title: "QUINTET", sub: "five seats, one loop", glyph: "✦", kind: "fives" },
    { id: "altars", href: "/drum-altars", title: "ALTARS", sub: "weekly noun rotation", glyph: "◉", kind: "fives" },
    { id: "altars-tv", href: "/drum-altars-tv", title: "ALTARS · TV", sub: "projection cast", glyph: "◈", kind: "fives" }
  ];
  const BELLS = [
    { id: "bell-fall", href: "/drum-bell-fall", title: "BELL FALL", sub: "pentatonic rain", glyph: "✧", kind: "bell" },
    { id: "bell-jar", href: "/drum-bell-jar", title: "BELL JAR", sub: "shake the glass", glyph: "◯", kind: "bell" },
    { id: "pendulum", href: "/drum-pendulum", title: "PENDULUM", sub: "meditative swing", glyph: "◐", kind: "bell" },
    { id: "vespers", href: "/drum-vespers", title: "VESPERS", sub: "bells on the hour", glyph: "⛧", kind: "bell" },
    { id: "saint", href: "/drum-saint", title: "SAINT", sub: "patron noun · altar lane", glyph: "✦", kind: "bell" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="df" id="df-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "fives" })} <header class="df__header"> <div class="df__chrome"> <span>WING INDEX</span> <span class="df__chrome-sep">·</span> <span id="df-week">WEEK ---</span> <span class="df__chrome-sep">·</span> <span id="df-total">— TRIBUTES</span> </div> <h1 class="df__title">FIVES &amp; BELLS</h1> <p class="df__tagline">eight surfaces in two wings · the chamber and its bell variants</p> </header> <section class="df__wing"> <header class="df__wing-header"> <span class="df__wing-label">FIVES WING</span> <span class="df__wing-rule"></span> </header> <div class="df__grid"> ${FIVES.map((s) => renderTemplate`<a class="df__card"${addAttribute(s.href, "href")}${addAttribute(s.id, "data-card")}> <div class="df__glyph">${s.glyph}</div> <div class="df__meta"> <div class="df__card-title">${s.title}</div> <div class="df__card-sub">${s.sub}</div> <div class="df__card-stat"${addAttribute(s.id, "data-stat")}>—</div> </div> </a>`)} </div> </section> <section class="df__wing"> <header class="df__wing-header"> <span class="df__wing-label">BELL WING</span> <span class="df__wing-rule"></span> </header> <div class="df__grid"> ${BELLS.map((s) => renderTemplate`<a class="df__card df__card--bell"${addAttribute(s.href, "href")}${addAttribute(s.id, "data-card")}> <div class="df__glyph">${s.glyph}</div> <div class="df__meta"> <div class="df__card-title">${s.title}</div> <div class="df__card-sub">${s.sub}</div> <div class="df__card-stat"${addAttribute(s.id, "data-stat")}>—</div> </div> </a>`)} </div> </section> <footer class="df__footer"> <p>
Pure-static surfaces (bell-fall, bell-jar, pendulum, vespers) keep their counts in your browser.
        Chamber-bus surfaces (quintet, altars, altars-tv, saint) share state via <a href="/api/altar">/api/altar</a> +
<a href="/api/quintet">/api/quintet</a>. Receipts in <a href="/b/0421">Block 0421</a>,
<a href="/b/0423">Block 0423</a>, <a href="/b/0426">Block 0426</a>.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-fives.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-fives.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-fives.astro";
const $$url = "/drum-fives";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumFives,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
