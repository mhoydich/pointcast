import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumV4 = createComponent(async ($$result, $$props, $$slots) => {
  const ORCHESTRA = [
    { key: "kick", label: "Kick", nounId: 1, accent: "#ef4444", row: "rhythm" },
    { key: "snare", label: "Snare", nounId: 50, accent: "#f59e0b", row: "rhythm" },
    { key: "hihat", label: "Hi-Hat", nounId: 100, accent: "#facc15", row: "rhythm" },
    { key: "openhat", label: "Open Hat", nounId: 150, accent: "#84cc16", row: "rhythm" },
    { key: "clap", label: "Clap", nounId: 200, accent: "#22c55e", row: "rhythm" },
    { key: "tom", label: "Tom", nounId: 250, accent: "#10b981", row: "rhythm" },
    { key: "bass", label: "Bass", nounId: 20, accent: "#0ea5e9", row: "melodic" },
    { key: "lead", label: "Lead", nounId: 300, accent: "#3b82f6", row: "melodic" },
    { key: "pad", label: "Pad", nounId: 400, accent: "#8b5cf6", row: "melodic" },
    { key: "bell", label: "Bell", nounId: 333, accent: "#a855f7", row: "melodic" },
    { key: "shaker", label: "Shaker", nounId: 555, accent: "#ec4899", row: "rhythm" },
    { key: "cymbal", label: "Cymbal", nounId: 999, accent: "#f43f5e", row: "rhythm" }
  ];
  const GENRES = [
    { id: "classical", label: "Classical", sub: "Vivaldi vibes", emoji: "🎻" },
    { id: "pop", label: "Pop", sub: "Post Malone", emoji: "✨" },
    { id: "rock", label: "Rock", sub: "Led Zeppelin", emoji: "⚡" },
    { id: "disco", label: "Disco", sub: "4-on-the-floor", emoji: "🪩" },
    { id: "funk", label: "Funk", sub: "Pocket grooves", emoji: "🕺" },
    { id: "summer", label: "Summer Madness", sub: "Kool & The Gang", emoji: "🌞" }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room v4 · Orchestra", "description": "A 12-Noun orchestra you can tap or set on auto-play through classical, pop, rock, disco, funk, summer madness. Collect every instrument.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="v4-root"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v4" })} <header class="v4-hero"> <p class="v4-hero-eyebrow">v4 · orchestra · collab</p> <h1 class="v4-hero-title">an orchestra of nouns</h1> <p class="v4-hero-dek">
twelve nouns, twelve instruments. tap one to play. press auto and
      the orchestra plays through classical, post malone, led zep, disco,
      funk, summer madness. collect every noun you touch.
</p> </header> <!-- ══ HUD: collection + auto-play status ══ --> <div class="v4-hud"> <div class="v4-hud-card v4-hud-collection"> <div class="v4-hud-label">Collected</div> <div class="v4-hud-val"> <span id="v4-collected-n">0</span> / 12
</div> <div class="v4-hud-sub">tap to claim a noun</div> </div> <div class="v4-hud-card v4-hud-mode"> <div class="v4-hud-label">Mode</div> <div class="v4-hud-val" id="v4-mode-label">manual</div> <div class="v4-hud-sub">click any noun · or hit auto</div> </div> <div class="v4-hud-card v4-hud-jammers"> <div class="v4-hud-label">Jammers</div> <div class="v4-hud-val" id="v4-jammers">1</div> <div class="v4-hud-sub">live in the room</div> </div> <div class="v4-hud-card v4-hud-bpm"> <div class="v4-hud-label">BPM</div> <div class="v4-hud-val" id="v4-bpm">—</div> <div class="v4-hud-sub" id="v4-bpm-sub">picks with genre</div> </div> </div> <!-- ══ AUTO-PLAY CONTROL — genre selector + play/stop ══ --> <section class="v4-auto" aria-label="Auto-play orchestra"> <div class="v4-auto-row"> <button type="button" id="v4-auto-btn" class="v4-auto-btn" aria-pressed="false"> <span class="v4-auto-icon" id="v4-auto-icon">▶</span> <span class="v4-auto-label" id="v4-auto-label">Play orchestra</span> </button> <div class="v4-genres" role="tablist" aria-label="Genre"> ${GENRES.map((g, i) => renderTemplate`<button type="button" role="tab"${addAttribute(g.id, "data-genre")}${addAttribute(`v4-genre${i === 0 ? " v4-genre--active" : ""}`, "class")}${addAttribute(i === 0 ? "true" : "false", "aria-selected")}> <span class="v4-genre-emoji" aria-hidden="true">${g.emoji}</span> <span class="v4-genre-label">${g.label}</span> <span class="v4-genre-sub">${g.sub}</span> </button>`)} </div> </div> <!-- 16-step ticker that lights up with the playhead --> <div class="v4-ticker" id="v4-ticker" aria-hidden="true"> ${Array.from({ length: 16 }).map((_, i) => renderTemplate`<span${addAttribute(`v4-tick${i % 4 === 0 ? " v4-tick--beat" : ""}`, "class")}${addAttribute(i, "data-step")}></span>`)} </div> </section> <!-- ══ THE ORCHESTRA — 12 noun-instruments ══ --> <section class="v4-stage" aria-label="The orchestra"> <div class="v4-grid"> ${ORCHESTRA.map((inst) => renderTemplate`<button type="button"${addAttribute(`v4-inst v4-inst--${inst.row}`, "class")}${addAttribute(inst.key, "data-inst")}${addAttribute(String(inst.nounId), "data-noun")}${addAttribute(`${inst.label} — tap to play`, "aria-label")}${addAttribute(`--accent: ${inst.accent}`, "style")}> <div class="v4-inst-card"> <div class="v4-inst-corner v4-inst-corner-tl" aria-hidden="true"></div> <div class="v4-inst-corner v4-inst-corner-tr" aria-hidden="true"></div> <div class="v4-inst-corner v4-inst-corner-bl" aria-hidden="true"></div> <div class="v4-inst-corner v4-inst-corner-br" aria-hidden="true"></div> <img class="v4-inst-img"${addAttribute(`https://noun.pics/${inst.nounId}.svg`, "src")}${addAttribute(inst.label, "alt")} width="96" height="96" loading="lazy" style="image-rendering: pixelated;" draggable="false"> <div class="v4-inst-collected" aria-hidden="true">⌐◨-◨</div> </div> <div class="v4-inst-name">${inst.label}</div> <div class="v4-inst-sub">noun #${inst.nounId}</div> </button>`)} </div> <div class="v4-ripples" id="v4-ripples" aria-hidden="true"></div> </section> <!-- ══ COLLABORATIVE ACTIVITY ══ --> <section class="v4-bottom"> <div class="v4-panel"> <div class="v4-panel-head"> <span class="v4-panel-title">Live Activity</span> <span class="v4-panel-dot"></span> <span id="v4-activity-rate">—/min</span> </div> <ul id="v4-activity-feed" class="v4-activity-list"> <li class="v4-activity-empty">tap a noun to start the orchestra…</li> </ul> </div> <div class="v4-panel"> <div class="v4-panel-head"> <span class="v4-panel-title">Your Collection</span> <span id="v4-collection-pct">0%</span> </div> <div id="v4-collection-grid" class="v4-collection-grid"></div> </div> </section> <!-- ══ TOAST + CONFETTI ══ --> <div id="v4-toast" class="v4-toast" hidden aria-live="assertive"> <div class="v4-toast-label" id="v4-toast-label">collected</div> <div class="v4-toast-title" id="v4-toast-title">—</div> </div> <div id="v4-confetti" class="v4-confetti" aria-hidden="true"></div> <!-- ══ FOOTER ══ --> <footer class="v4-footer"> <span>⌐◨-◨ PointCast · Drum Room · v4 orchestra</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v4.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v4.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v4.astro";
const $$url = "/drum-v4";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumV4,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
