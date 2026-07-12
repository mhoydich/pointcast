import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumV8 = createComponent(async ($$result, $$props, $$slots) => {
  const SYMPHONY = [
    // ════ STRINGS ════ — sawtooth + lowpass + slow attack
    { key: "violin1", label: "Violin I", nounId: 11, family: "string", pitch: 659, decay: 1.4, accent: "#dc2626" },
    // E5
    { key: "violin2", label: "Violin II", nounId: 73, family: "string", pitch: 587, decay: 1.4, accent: "#ef4444" },
    // D5
    { key: "viola", label: "Viola", nounId: 145, family: "string", pitch: 440, decay: 1.5, accent: "#f87171" },
    // A4
    { key: "cello", label: "Cello", nounId: 217, family: "string", pitch: 220, decay: 1.6, accent: "#fb7185" },
    // A3
    { key: "doublebass", label: "Double Bass", nounId: 289, family: "string", pitch: 110, decay: 1.7, accent: "#e11d48" },
    // A2
    { key: "harp", label: "Harp", nounId: 361, family: "harp", pitch: 523, decay: 2.4, accent: "#be123c" },
    // C5 plucked
    { key: "pizz", label: "Pizzicato", nounId: 433, family: "pizz", pitch: 392, decay: 0.4, accent: "#9f1239" },
    // G4 plucked
    // ════ WOODWINDS ════ — sine + breath noise + soft bandpass
    { key: "piccolo", label: "Piccolo", nounId: 22, family: "wind", pitch: 1047, decay: 1, accent: "#f59e0b" },
    // C6
    { key: "flute", label: "Flute", nounId: 84, family: "wind", pitch: 784, decay: 1.1, accent: "#fbbf24" },
    // G5
    { key: "oboe", label: "Oboe", nounId: 156, family: "reed", pitch: 587, decay: 1, accent: "#fcd34d" },
    // D5 reedy
    { key: "clarinet", label: "Clarinet", nounId: 228, family: "reed", pitch: 392, decay: 1.2, accent: "#facc15" },
    // G4 reedy
    { key: "bassclar", label: "Bass Clar.", nounId: 300, family: "reed", pitch: 196, decay: 1.4, accent: "#eab308" },
    // G3 reedy
    { key: "bassoon", label: "Bassoon", nounId: 372, family: "reed", pitch: 147, decay: 1.5, accent: "#ca8a04" },
    // D3 reedy
    { key: "engl-horn", label: "English Horn", nounId: 444, family: "reed", pitch: 330, decay: 1.2, accent: "#a16207" },
    // E4 reedy
    // ════ BRASS ════ — sawtooth + bandpass formant + medium attack
    { key: "trumpet", label: "Trumpet", nounId: 33, family: "brass", pitch: 523, decay: 1, accent: "#84cc16" },
    // C5
    { key: "cornet", label: "Cornet", nounId: 95, family: "brass", pitch: 587, decay: 1, accent: "#a3e635" },
    // D5
    { key: "french-horn", label: "French Horn", nounId: 167, family: "horn", pitch: 392, decay: 1.4, accent: "#bef264" },
    // G4 mellow
    { key: "trombone", label: "Trombone", nounId: 239, family: "brass", pitch: 220, decay: 1.3, accent: "#65a30d" },
    // A3
    { key: "basstromb", label: "Bass Tromb.", nounId: 311, family: "brass", pitch: 165, decay: 1.4, accent: "#4d7c0f" },
    // E3
    { key: "tuba", label: "Tuba", nounId: 383, family: "brass", pitch: 87, decay: 1.6, accent: "#3f6212" },
    // F2
    { key: "sousaphone", label: "Sousaphone", nounId: 455, family: "brass", pitch: 73, decay: 1.7, accent: "#365314" },
    // D2
    // ════ PERCUSSION ════ — noise + tone with pitch drop
    { key: "timpani", label: "Timpani", nounId: 44, family: "timp", pitch: 110, decay: 0.9, accent: "#10b981" },
    // A2 tuned
    { key: "bassdrum", label: "Bass Drum", nounId: 106, family: "kick", pitch: 60, decay: 0.5, accent: "#14b8a6" },
    { key: "snare", label: "Snare", nounId: 178, family: "snare", pitch: 200, decay: 0.18, accent: "#2dd4bf" },
    { key: "tom", label: "Tom", nounId: 250, family: "tom", pitch: 180, decay: 0.4, accent: "#5eead4" },
    { key: "tambourine", label: "Tambourine", nounId: 322, family: "tamb", pitch: 0, decay: 0.25, accent: "#99f6e4" },
    { key: "cymbal", label: "Cymbal", nounId: 394, family: "cymbal", pitch: 0, decay: 1.2, accent: "#0d9488" },
    { key: "gong", label: "Gong", nounId: 466, family: "gong", pitch: 80, decay: 2.6, accent: "#0f766e" },
    // ════ MALLET ════ — pitched percussion with quick bright decay
    { key: "xylophone", label: "Xylophone", nounId: 55, family: "xylo", pitch: 880, decay: 0.4, accent: "#3b82f6" },
    { key: "marimba", label: "Marimba", nounId: 117, family: "marimba", pitch: 392, decay: 0.7, accent: "#6366f1" },
    { key: "glock", label: "Glockenspiel", nounId: 189, family: "glock", pitch: 1568, decay: 0.6, accent: "#8b5cf6" },
    // G6
    { key: "vibes", label: "Vibraphone", nounId: 261, family: "vibes", pitch: 523, decay: 1.2, accent: "#a855f7" },
    { key: "tubularbell", label: "Tubular Bell", nounId: 333, family: "tubular", pitch: 659, decay: 2, accent: "#c026d3" },
    { key: "triangle", label: "Triangle", nounId: 405, family: "triangle", pitch: 2349, decay: 1.6, accent: "#d946ef" },
    { key: "woodblock", label: "Wood Block", nounId: 477, family: "wood", pitch: 880, decay: 0.06, accent: "#e879f9" },
    // ════ VOICE ════ — vowel-formant choir voices (matches v6 architecture)
    { key: "soprano-c", label: "Soprano", nounId: 66, family: "voice", pitch: 523, decay: 1.6, accent: "#ec4899" },
    // C5 AH
    { key: "mezzo", label: "Mezzo", nounId: 128, family: "voice", pitch: 392, decay: 1.6, accent: "#f472b6" },
    // G4 EE
    { key: "alto", label: "Alto", nounId: 200, family: "voice", pitch: 330, decay: 1.6, accent: "#f9a8d4" },
    // E4 OH
    { key: "tenor", label: "Tenor", nounId: 272, family: "voice", pitch: 262, decay: 1.7, accent: "#fbcfe8" },
    // C4 AH
    { key: "baritone", label: "Baritone", nounId: 344, family: "voice", pitch: 196, decay: 1.7, accent: "#fb7185" },
    // G3 OH
    { key: "bass-voice", label: "Bass", nounId: 416, family: "voice", pitch: 131, decay: 1.8, accent: "#f43f5e" },
    // C3 OOH
    { key: "whistle", label: "Whistle", nounId: 488, family: "whistle", pitch: 1976, decay: 0.8, accent: "#e11d48" }
    // B6 pure tone
  ];
  const SECTIONS = [
    { id: "string", label: "Strings", emoji: "🎻", color: "#dc2626" },
    { id: "wind", label: "Woodwinds", emoji: "🎼", color: "#f59e0b" },
    { id: "brass", label: "Brass", emoji: "🎺", color: "#84cc16" },
    { id: "percussion", label: "Percussion", emoji: "🥁", color: "#10b981" },
    { id: "mallet", label: "Mallets", emoji: "🎵", color: "#3b82f6" },
    { id: "voice", label: "Voice", emoji: "🎤", color: "#ec4899" }
  ];
  const FAMILY_TO_SECTION = {
    string: "string",
    harp: "string",
    pizz: "string",
    wind: "wind",
    reed: "wind",
    brass: "brass",
    horn: "brass",
    timp: "percussion",
    kick: "percussion",
    snare: "percussion",
    tom: "percussion",
    tamb: "percussion",
    cymbal: "percussion",
    gong: "percussion",
    xylo: "mallet",
    marimba: "mallet",
    glock: "mallet",
    vibes: "mallet",
    tubular: "mallet",
    triangle: "mallet",
    wood: "mallet",
    voice: "voice",
    whistle: "voice"
  };
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room v8 · The Symphony", "description": "A 42-piece classical orchestra of Nouns. Strings, woodwinds, brass, percussion, mallets, voice. Tap any seat to play, hit auto for an algorithmic symphony.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="v8-root"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v8" })} <header class="v8-hero"> <p class="v8-hero-eyebrow">v8 · the symphony · 42 nouns</p> <h1 class="v8-hero-title">a giant orchestra of nouns</h1> <p class="v8-hero-dek">
forty-two seats across six sections — strings, woodwinds, brass,
      percussion, mallets, voice. tap any noun to play their instrument.
      hit auto and the conductor walks an algorithmic symphony. real-time
      over websocket — others hear you in tens of milliseconds.
</p> </header> <!-- ══ HUD ══ --> <div class="v8-hud"> <div class="v8-hud-card"> <div class="v8-hud-label">Seats</div> <div class="v8-hud-val"><span id="v8-played">0</span> / 42</div> <div class="v8-hud-sub">tap to claim</div> </div> <div class="v8-hud-card v8-hud-mode" id="v8-mode-card"> <div class="v8-hud-label">Mode</div> <div class="v8-hud-val" id="v8-mode-label">manual</div> <div class="v8-hud-sub">click any seat · or hit auto</div> </div> <div class="v8-hud-card v8-hud-jammers"> <div class="v8-hud-label">Players</div> <div class="v8-hud-val" id="v8-jammers">1</div> <div class="v8-hud-sub">live in the hall</div> </div> <div class="v8-hud-card v8-hud-stream"> <div class="v8-hud-label">Stream</div> <div class="v8-hud-val" id="v8-stream-mode">connecting…</div> <div class="v8-hud-sub" id="v8-stream-sub">resolving transport</div> </div> </div> <!-- ══ AUTO-PLAY — symphonic patterns ══ --> <section class="v8-auto" aria-label="Conductor controls"> <div class="v8-auto-row"> <button id="v8-auto-btn" class="v8-auto-btn" aria-pressed="false"> <span id="v8-auto-icon">▶</span> <span id="v8-auto-label">Conduct</span> </button> <input type="range" id="v8-auto-bpm" class="v8-auto-bpm" min="60" max="160" value="96" step="1"> <span class="v8-auto-bpm-val"><span id="v8-bpm-val">96</span> bpm</span> <select id="v8-auto-mvt" class="v8-auto-mvt"> <option value="overture">i. overture · grand opening</option> <option value="adagio">ii. adagio · slow lyrical</option> <option value="allegro">iii. allegro · fast joyful</option> <option value="finale">iv. finale · all sections</option> </select> </div> </section> <!-- ══ THE STAGE — 6 sections × 7 seats ══ --> <section class="v8-stage" aria-label="Orchestra stage"> ${SECTIONS.map((section) => renderTemplate`<div class="v8-row"${addAttribute(section.id, "data-section")}${addAttribute(`--section: ${section.color}`, "style")}> <div class="v8-row-label"> <span class="v8-row-emoji" aria-hidden="true">${section.emoji}</span> <span class="v8-row-name">${section.label}</span> </div> <div class="v8-row-seats"> ${SYMPHONY.filter((c) => FAMILY_TO_SECTION[c.family] === section.id).map((seat) => renderTemplate`<button type="button" class="v8-seat"${addAttribute(seat.key, "data-seat")}${addAttribute(String(seat.nounId), "data-noun")}${addAttribute(seat.family, "data-family")}${addAttribute(String(seat.pitch), "data-pitch")}${addAttribute(String(seat.decay), "data-decay")}${addAttribute(seat.label, "aria-label")}${addAttribute(`--accent: ${seat.accent}`, "style")}> <div class="v8-seat-card"> <img class="v8-seat-img"${addAttribute(`https://noun.pics/${seat.nounId}.svg`, "src")}${addAttribute(seat.label, "alt")} width="64" height="64" loading="lazy" style="image-rendering: pixelated;"> </div> <div class="v8-seat-name">${seat.label}</div> </button>`)} </div> </div>`)} </section> <!-- ══ FOOTER ══ --> <footer class="v8-footer"> <span>⌐◨-◨ PointCast · Drum Room · v8 the symphony</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div>  ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v8.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v8.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v8.astro";
const $$url = "/drum-v8";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumV8,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
