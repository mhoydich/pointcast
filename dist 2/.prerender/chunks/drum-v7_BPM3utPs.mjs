import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumV7 = createComponent(async ($$result, $$props, $$slots) => {
  const ORCHESTRA = [
    // KICKS — five different tunings, color coded red
    { key: "kick-sub", label: "Kick · Sub", nounId: 1, accent: "#dc2626", cat: "kick", pitch: 60, decay: 0.45 },
    { key: "kick-deep", label: "Kick · Deep", nounId: 60, accent: "#ef4444", cat: "kick", pitch: 90, decay: 0.38 },
    { key: "kick-mid", label: "Kick · Mid", nounId: 120, accent: "#f87171", cat: "kick", pitch: 130, decay: 0.32 },
    { key: "kick-tight", label: "Kick · Tight", nounId: 180, accent: "#fb923c", cat: "kick", pitch: 170, decay: 0.22 },
    { key: "kick-tap", label: "Kick · Tap", nounId: 240, accent: "#fdba74", cat: "kick", pitch: 200, decay: 0.18 },
    // SNARES — five different snare colors
    { key: "snare-deep", label: "Snare · Deep", nounId: 10, accent: "#f59e0b", cat: "snare", pitch: 180, decay: 0.2 },
    { key: "snare-body", label: "Snare · Body", nounId: 70, accent: "#fbbf24", cat: "snare", pitch: 220, decay: 0.18 },
    { key: "snare-rim", label: "Snare · Rim", nounId: 130, accent: "#facc15", cat: "snare", pitch: 320, decay: 0.1 },
    { key: "snare-brush", label: "Snare · Brush", nounId: 190, accent: "#fde047", cat: "snare", pitch: 200, decay: 0.3 },
    { key: "snare-gated", label: "Snare · Gated", nounId: 250, accent: "#facc15", cat: "snare", pitch: 240, decay: 0.14 },
    // HATS — closed/open/half/long/sizzle
    { key: "hat-closed", label: "Hat · Closed", nounId: 20, accent: "#84cc16", cat: "hat", pitch: 0, decay: 0.05 },
    { key: "hat-open", label: "Hat · Open", nounId: 80, accent: "#a3e635", cat: "hat", pitch: 0, decay: 0.32 },
    { key: "hat-half", label: "Hat · Half", nounId: 140, accent: "#bef264", cat: "hat", pitch: 0, decay: 0.16 },
    { key: "hat-long", label: "Hat · Long", nounId: 200, accent: "#65a30d", cat: "hat", pitch: 0, decay: 0.55 },
    { key: "hat-sizzle", label: "Hat · Sizzle", nounId: 260, accent: "#4d7c0f", cat: "hat", pitch: 0, decay: 0.42 },
    // TOMS — five tunings
    { key: "tom-floor", label: "Tom · Floor", nounId: 30, accent: "#10b981", cat: "tom", pitch: 90, decay: 0.45 },
    { key: "tom-low", label: "Tom · Low", nounId: 90, accent: "#14b8a6", cat: "tom", pitch: 140, decay: 0.4 },
    { key: "tom-mid", label: "Tom · Mid", nounId: 150, accent: "#2dd4bf", cat: "tom", pitch: 200, decay: 0.36 },
    { key: "tom-high", label: "Tom · High", nounId: 210, accent: "#5eead4", cat: "tom", pitch: 280, decay: 0.32 },
    { key: "tom-rack", label: "Tom · Rack", nounId: 270, accent: "#99f6e4", cat: "tom", pitch: 360, decay: 0.28 },
    // BASS + LEAD — pitched, melodic, blue family
    { key: "sub-bass", label: "Sub Bass", nounId: 40, accent: "#0ea5e9", cat: "tonal", pitch: 41, decay: 0.7 },
    { key: "bass", label: "Bass", nounId: 100, accent: "#3b82f6", cat: "tonal", pitch: 82, decay: 0.55 },
    { key: "mid-lead", label: "Mid Lead", nounId: 160, accent: "#6366f1", cat: "tonal", pitch: 261, decay: 0.45 },
    { key: "high-lead", label: "High Lead", nounId: 220, accent: "#8b5cf6", cat: "tonal", pitch: 523, decay: 0.4 },
    { key: "pad", label: "Pad", nounId: 280, accent: "#a855f7", cat: "tonal", pitch: 130, decay: 1.4 },
    // COLOR — bell/clap/shaker/cymbal/cowbell, magenta/pink family
    { key: "bell", label: "Bell", nounId: 50, accent: "#d946ef", cat: "color", pitch: 660, decay: 1.4 },
    { key: "clap", label: "Clap", nounId: 110, accent: "#ec4899", cat: "color", pitch: 0, decay: 0.16 },
    { key: "shaker", label: "Shaker", nounId: 170, accent: "#f472b6", cat: "color", pitch: 0, decay: 0.16 },
    { key: "cymbal", label: "Cymbal", nounId: 230, accent: "#f43f5e", cat: "color", pitch: 0, decay: 0.9 },
    { key: "cowbell", label: "Cowbell", nounId: 290, accent: "#fb7185", cat: "color", pitch: 800, decay: 0.18 }
  ];
  const CATEGORIES = [
    { id: "kick", label: "Kicks", emoji: "🥁", accent: "#dc2626" },
    { id: "snare", label: "Snares", emoji: "🪘", accent: "#f59e0b" },
    { id: "hat", label: "Hats", emoji: "⚡", accent: "#84cc16" },
    { id: "tom", label: "Toms", emoji: "🪘", accent: "#10b981" },
    { id: "tonal", label: "Bass+Lead", emoji: "🎶", accent: "#3b82f6" },
    { id: "color", label: "Color", emoji: "✨", accent: "#d946ef" }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room v7 · The Big Orchestra", "description": "Thirty Nouns as a percussion section instrument board. Six categories — kicks, snares, hats, toms, bass+lead, color. Real-time multiplayer over WebSocket.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="v7-root"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v7" })} <header class="v7-hero"> <p class="v7-hero-eyebrow">v7 · big orchestra · 30 nouns</p> <h1 class="v7-hero-title">a thirty-piece instrument board</h1> <p class="v7-hero-dek">
thirty nouns laid out as a percussion section: five kicks, five
      snares, five hats, five toms, five bass+lead voices, five color
      hits. tap any cell to fire it. real-time over websocket — others
      hear you in ~30–60ms.
</p> </header> <!-- ══ HUD ══ --> <div class="v7-hud"> <div class="v7-hud-card"> <div class="v7-hud-label">Cells played</div> <div class="v7-hud-val"><span id="v7-played">0</span> / 30</div> <div class="v7-hud-sub">tap to claim</div> </div> <div class="v7-hud-card v7-hud-mode" id="v7-mode-card"> <div class="v7-hud-label">Mode</div> <div class="v7-hud-val" id="v7-mode-label">manual</div> <div class="v7-hud-sub">click any cell · or hit auto</div> </div> <div class="v7-hud-card v7-hud-jammers"> <div class="v7-hud-label">Jammers</div> <div class="v7-hud-val" id="v7-jammers">1</div> <div class="v7-hud-sub">live in the room</div> </div> <div class="v7-hud-card v7-hud-stream"> <div class="v7-hud-label">Stream</div> <div class="v7-hud-val" id="v7-stream-mode">connecting…</div> <div class="v7-hud-sub" id="v7-stream-sub">resolving transport</div> </div> </div> <!-- ══ AUTO-PLAY — runs through random walks of the board ══ --> <section class="v7-auto" aria-label="Auto-play"> <div class="v7-auto-row"> <button id="v7-auto-btn" class="v7-auto-btn" aria-pressed="false"> <span id="v7-auto-icon">▶</span> <span id="v7-auto-label">Play orchestra</span> </button> <input type="range" id="v7-auto-bpm" class="v7-auto-bpm" min="60" max="180" value="110" step="1"> <span class="v7-auto-bpm-val"><span id="v7-bpm-val">110</span> bpm</span> <select id="v7-auto-style" class="v7-auto-style"> <option value="walk">style · random walk</option> <option value="rolling">style · rolling thunder</option> <option value="conversation">style · call & response</option> <option value="dense">style · maximum density</option> </select> </div> </section> <!-- ══ THE BOARD — 30 cells in 5 cols × 6 rows by category ══ --> <section class="v7-stage" aria-label="Instrument board"> ${CATEGORIES.map((cat) => renderTemplate`<div class="v7-row"${addAttribute(cat.id, "data-cat")}> <div class="v7-row-label"${addAttribute(`--cat: ${cat.accent}`, "style")}> <span class="v7-row-emoji" aria-hidden="true">${cat.emoji}</span> <span class="v7-row-name">${cat.label}</span> </div> <div class="v7-row-cells"> ${ORCHESTRA.filter((c) => c.cat === cat.id).map((cell) => renderTemplate`<button type="button" class="v7-cell"${addAttribute(cell.key, "data-cell")}${addAttribute(String(cell.nounId), "data-noun")}${addAttribute(cell.cat, "data-cat")}${addAttribute(String(cell.pitch), "data-pitch")}${addAttribute(String(cell.decay), "data-decay")}${addAttribute(cell.label, "aria-label")}${addAttribute(`--accent: ${cell.accent}`, "style")}> <div class="v7-cell-inner"> <img class="v7-cell-img"${addAttribute(`https://noun.pics/${cell.nounId}.svg`, "src")}${addAttribute(cell.label, "alt")} width="80" height="80" loading="lazy" style="image-rendering: pixelated;"> </div> <div class="v7-cell-name">${cell.label}</div> </button>`)} </div> </div>`)} </section> <!-- ══ FOOTER ══ --> <footer class="v7-footer"> <span>⌐◨-◨ PointCast · Drum Room · v7 big orchestra</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div>  ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v7.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v7.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v7.astro";
const $$url = "/drum-v7";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumV7,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
