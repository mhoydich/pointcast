import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';

const $$DrumTv = createComponent(async ($$result, $$props, $$slots) => {
  const CAST = [
    { id: 42, label: "Drum", surface: "classic" },
    { id: 101, label: "High", surface: "collab" },
    { id: 200, label: "Bass", surface: "spotify" },
    { id: 300, label: "Lead", surface: "orchestra" },
    { id: 400, label: "Pad", surface: "orchestra" },
    { id: 500, label: "Bell", surface: "symphony" },
    { id: 555, label: "Shaker", surface: "orchestra" },
    { id: 666, label: "First", surface: "trophies" },
    { id: 777, label: "Master", surface: "trophies" },
    { id: 808, label: "Big", surface: "big" },
    { id: 888, label: "Choir", surface: "choir" },
    { id: 999, label: "Cymbal", surface: "symphony" },
    { id: 77, label: "Songbird", surface: "lounge" },
    { id: 144, label: "Forever", surface: "lounge" },
    { id: 211, label: "Going", surface: "lounge" },
    { id: 278, label: "Sil.", surface: "lounge" }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room · TV Cast", "description": "Full-screen cast view of the PointCast drum hub. Open on your TV via AirPlay or Chromecast — the room plays itself, lights up when anyone in the world is drumming. QR code on screen lets your phone drive.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tv-root" id="tv-root"> <!-- Cinematic top bar --> <header class="tv-top"> <div class="tv-top-left"> <span class="tv-onair" id="tv-onair">● ON AIR</span> <span class="tv-wordmark">POINTCAST</span> <span class="tv-tagline">drum room · cast mode</span> </div> <div class="tv-top-right"> <span class="tv-clock" id="tv-clock">—</span> </div> </header> <!-- The big stage --> <main class="tv-stage" id="tv-stage" data-scene="parade"> <!-- Parade scene — big noun strip auto-scrolling --> <section class="tv-scene tv-parade" data-scene="parade"> <div class="tv-parade-track" id="tv-parade-track"> ${[...CAST, ...CAST].map((c) => renderTemplate`<div class="tv-parade-cell"> <img${addAttribute(`https://noun.pics/${c.id}.svg`, "src")} alt="" loading="lazy" style="image-rendering: pixelated;"> <div class="tv-parade-label">${c.label}</div> </div>`)} </div> </section> <!-- Spotlight scene — one giant noun rotates --> <section class="tv-scene tv-spotlight" data-scene="spotlight"> <div class="tv-spotlight-frame"> <img id="tv-spotlight-img"${addAttribute(`https://noun.pics/${CAST[0].id}.svg`, "src")} alt=""> </div> <div class="tv-spotlight-label" id="tv-spotlight-label"> <span class="tv-spotlight-name">${CAST[0].label}</span> <span class="tv-spotlight-sub">noun #${CAST[0].id} · ${CAST[0].surface}</span> </div> </section> <!-- Mosaic scene — all nouns at once --> <section class="tv-scene tv-mosaic" data-scene="mosaic"> <div class="tv-mosaic-grid" id="tv-mosaic-grid"> ${CAST.map((c) => renderTemplate`<div class="tv-mosaic-cell"${addAttribute(String(c.id), "data-noun")}> <img${addAttribute(`https://noun.pics/${c.id}.svg`, "src")} alt="" loading="lazy" style="image-rendering: pixelated;"> </div>`)} </div> </section> <!-- Beach scene — smooth jazz vibe with sunset gradient --> <section class="tv-scene tv-beach" data-scene="beach"> <div class="tv-beach-sun" aria-hidden="true"></div> <div class="tv-beach-grid" aria-hidden="true"></div> <div class="tv-beach-content"> <p class="tv-beach-eyebrow">⌐◨-◨ THE LOUNGE · v9</p> <h2 class="tv-beach-title">an evening with the saxophone</h2> <p class="tv-beach-dek"><em>for kenny — thank you for the soundtrack of every late drive home</em></p> <div class="tv-beach-saxes"> <img src="https://noun.pics/77.svg" alt=""> <img src="https://noun.pics/144.svg" alt=""> <img src="https://noun.pics/211.svg" alt=""> <img src="https://noun.pics/278.svg" alt=""> </div> </div> </section> <!-- Starfield scene — particles drift --> <section class="tv-scene tv-starfield" data-scene="starfield"> <div class="tv-starfield-canvas" id="tv-starfield-canvas"></div> </section> <!-- Reactive layer — full-screen ripples that fire when remote players play --> <div class="tv-ripples" id="tv-ripples" aria-hidden="true"></div> <!-- The Crowd scene — gallery view of every visitor in the room.
         Populated by JS from /api/visit's \`present\` array. Each tile is
         a Noun avatar derived from the visitor's session, with a live
         "tapping" pulse when their pid fires an event. Per Mike: 'we
         can see everyone'. ══ --> <section class="tv-scene tv-crowd" data-scene="crowd"> <div class="tv-crowd-head"> <span class="tv-crowd-eyebrow">The Crowd</span> <span class="tv-crowd-count"><span id="tv-crowd-count-n">0</span> here right now</span> </div> <div class="tv-crowd-grid" id="tv-crowd-grid"></div> <div class="tv-crowd-empty" id="tv-crowd-empty"> <span>waiting for the room to fill…</span> </div> </section> <!-- Spotlight noun that pops on each remote tap --> <div class="tv-spotlight-popup" id="tv-spotlight-popup" aria-hidden="true"> <img id="tv-spotlight-popup-img" src="" alt=""> <div id="tv-spotlight-popup-label" class="tv-spotlight-popup-label"></div> </div> </main> <!-- AUDIENCE STRIP — always-visible roster of every active visitor.
       Independent of the cycling scenes; sits between the stage and
       the bottom info bar so Mike (or anyone watching) always sees
       who's in the room without waiting for The Crowd scene to come
       around. Populated by JS from /api/visit. ══ --> <aside class="tv-audience" aria-label="Live audience"> <span class="tv-audience-label">⌐◨-◨ in the room</span> <div class="tv-audience-strip" id="tv-audience-strip"></div> </aside> <!-- Bottom info bar --> <footer class="tv-bottom"> <div class="tv-bottom-left"> <div class="tv-bottom-stat"> <span class="tv-bottom-stat-label">In the room</span> <span class="tv-bottom-stat-val" id="tv-jammers">1</span> </div> <div class="tv-bottom-stat"> <span class="tv-bottom-stat-label">Now showing</span> <span class="tv-bottom-stat-val" id="tv-scene-name">The Parade</span> <span class="tv-bottom-stat-sub" id="tv-scene-sub">every noun, in turn</span> </div> <div class="tv-bottom-stat"> <span class="tv-bottom-stat-label">Stream</span> <span class="tv-bottom-stat-val" id="tv-stream">connecting…</span> </div> </div> <div class="tv-bottom-right"> <div class="tv-qr"> <div class="tv-qr-img-wrap"> <!-- Use external QR generator — no QR lib needed in build --> <img id="tv-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fpointcast.xyz%2Fdrum" alt="scan to play" width="120" height="120"> </div> <div class="tv-qr-text"> <span class="tv-qr-label">scan to play</span> <span class="tv-qr-url">pointcast.xyz/drum</span> </div> </div> </div> </footer> <!-- Live ticker tape — recent activity from every drum surface --> <div class="tv-ticker" aria-live="polite" aria-atomic="false"> <div class="tv-ticker-track" id="tv-ticker-track"> <span class="tv-ticker-item">⌐◨-◨ ready · waiting for the room…</span> </div> </div> </div>  ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-tv.astro";
const $$url = "/drum-tv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumTv,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
