import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumV5 = createComponent(async ($$result, $$props, $$slots) => {
  const INSTRUMENTS = [
    { key: "kick", label: "Kick", accent: "#ef4444" },
    { key: "snare", label: "Snare", accent: "#f59e0b" },
    { key: "hihat", label: "Hi-Hat", accent: "#facc15" },
    { key: "openhat", label: "Open Hat", accent: "#84cc16" },
    { key: "clap", label: "Clap", accent: "#22c55e" },
    { key: "tom", label: "Tom", accent: "#10b981" },
    { key: "bass", label: "Bass", accent: "#0ea5e9" },
    { key: "lead", label: "Lead", accent: "#3b82f6" },
    { key: "pad", label: "Pad", accent: "#8b5cf6" },
    { key: "bell", label: "Bell", accent: "#a855f7" },
    { key: "shaker", label: "Shaker", accent: "#ec4899" },
    { key: "cymbal", label: "Cymbal", accent: "#f43f5e" }
  ];
  const DEFAULT_TRACKS = [
    { inst: "kick", steps: "1000100010001000" },
    { inst: "snare", steps: "0000100000001000" },
    { inst: "hihat", steps: "1010101010101010" },
    { inst: "bass", steps: "1000000010000000" }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room v5 · Loop Studio", "description": "Build your own drum loop, share it as a URL. Four tracks, sixteen steps, twelve instruments, infinite combinations. Multiplayer.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="v5-root"> ', ` <header class="v5-hero"> <p class="v5-hero-eyebrow">v5 · loop studio · share</p> <h1 class="v5-hero-title">build a loop, share a url</h1> <p class="v5-hero-dek">
four tracks. sixteen steps. twelve instruments. tap a cell to toggle.
      hit play. paste a friend's loop URL and you'll hear the same beat.
</p> </header> <!-- ══ TRANSPORT ══ --> <section class="v5-transport" aria-label="Transport controls"> <div class="v5-transport-group"> <button id="v5-play-btn" class="v5-btn v5-btn-primary" aria-pressed="false"> <span class="v5-btn-icon" id="v5-play-icon">▶</span> <span id="v5-play-label">Play</span> </button> <button id="v5-rec-btn" class="v5-btn v5-btn-rec" aria-pressed="false"> <span class="v5-btn-icon">●</span> <span>Record</span> </button> <button id="v5-clear-btn" class="v5-btn v5-btn-ghost">Clear</button> </div> <div class="v5-transport-bpm"> <label for="v5-bpm-slider" class="v5-bpm-label">BPM</label> <input type="range" id="v5-bpm-slider" class="v5-bpm-slider" min="60" max="180" value="100" step="1"> <span class="v5-bpm-val" id="v5-bpm-val">100</span> </div> <div class="v5-transport-share"> <button id="v5-share-btn" class="v5-btn v5-btn-share">↗ Share loop</button> <button id="v5-randomize-btn" class="v5-btn v5-btn-ghost" title="Generate a random pattern">🎲 Randomize</button> </div> </section> <!-- ══ TRACKS — 4 rows ══ --> <section class="v5-tracks" id="v5-tracks" aria-label="Tracks"></section> <!-- ══ TICKER ══ --> <div class="v5-ticker" id="v5-ticker" aria-hidden="true"> `, ' </div> <!-- ══ STATUS BAR ══ --> <div class="v5-status" id="v5-status" aria-live="polite"> <span class="v5-status-mode" id="v5-status-mode">stopped · 100 bpm</span> <span class="v5-status-jammers"><span id="v5-jammers">1</span> live · <span id="v5-active-tracks">4</span> tracks</span> </div> <!-- ══ ACTIVITY FEED ══ --> <section class="v5-feed-wrap"> <div class="v5-feed-head"> <span class="v5-feed-title">Live Activity</span> <span class="v5-feed-rate" id="v5-rate">—/min</span> </div> <ul id="v5-feed" class="v5-feed"> <li class="v5-feed-empty">tap a cell or hit play to start the loop…</li> </ul> </section> <!-- ══ TOAST ══ --> <div id="v5-toast" class="v5-toast" hidden aria-live="assertive"> <div class="v5-toast-label" id="v5-toast-label">saved</div> <div class="v5-toast-title" id="v5-toast-title">—</div> </div> <!-- ══ FOOTER ══ --> <footer class="v5-footer"> <span>⌐◨-◨ PointCast · Drum Room · v5 loop studio</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div> <script type="application/json" id="v5-default-tracks">', '<\/script> <script type="application/json" id="v5-instruments">', "<\/script> "])), maybeRenderHead(), renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v5" }), Array.from({ length: 16 }).map((_, i) => renderTemplate`<span${addAttribute(`v5-tick${i % 4 === 0 ? " v5-tick--beat" : ""}`, "class")}${addAttribute(i, "data-step")}></span>`), unescapeHTML(JSON.stringify(DEFAULT_TRACKS)), unescapeHTML(JSON.stringify(INSTRUMENTS))) })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v5.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v5.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v5.astro";
const $$url = "/drum-v5";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumV5,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
