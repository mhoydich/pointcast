import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumV6 = createComponent(async ($$result, $$props, $$slots) => {
  const CHOIR = [
    // Sopranos — C5/E5/G5/C6
    { key: "sop-c", label: "Sop · C", nounId: 88, semitone: 36, vowel: "AH", row: "sop" },
    { key: "sop-e", label: "Sop · E", nounId: 144, semitone: 40, vowel: "EE", row: "sop" },
    { key: "sop-g", label: "Sop · G", nounId: 222, semitone: 43, vowel: "OH", row: "sop" },
    { key: "sop-c2", label: "Sop · C8", nounId: 333, semitone: 48, vowel: "OOH", row: "sop" },
    // Altos — G4/C5/E5/G5
    { key: "alt-g", label: "Alto · G", nounId: 77, semitone: 31, vowel: "AH", row: "alt" },
    { key: "alt-c", label: "Alto · C", nounId: 168, semitone: 36, vowel: "EE", row: "alt" },
    { key: "alt-e", label: "Alto · E", nounId: 247, semitone: 40, vowel: "OH", row: "alt" },
    { key: "alt-g2", label: "Alto · G2", nounId: 360, semitone: 43, vowel: "OOH", row: "alt" },
    // Tenors — C4/E4/G4/C5
    { key: "ten-c", label: "Ten · C", nounId: 42, semitone: 24, vowel: "AH", row: "ten" },
    { key: "ten-e", label: "Ten · E", nounId: 101, semitone: 28, vowel: "EE", row: "ten" },
    { key: "ten-g", label: "Ten · G", nounId: 200, semitone: 31, vowel: "OH", row: "ten" },
    { key: "ten-c2", label: "Ten · C8", nounId: 555, semitone: 36, vowel: "OOH", row: "ten" }
  ];
  const PROGRESSIONS = [
    { id: "hymn", label: "Hymn", sub: "I · IV · V · I", emoji: "⛪" },
    { id: "gospel", label: "Gospel", sub: "I · V/vi · vi · V · I", emoji: "🎶" },
    { id: "cinematic", label: "Cinematic", sub: "i · VI · III · VII", emoji: "🎬" },
    { id: "doowop", label: "Doo-Wop", sub: "I · vi · IV · V", emoji: "✨" }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room v6 · The Choir", "description": "Twelve Nouns sing a four-voice chord stack. Tap to sing, hit auto and the choir walks classical progressions. Vocal-formant synthesis.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="v6-root"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v6" })} <header class="v6-hero"> <p class="v6-hero-eyebrow">v6 · choir · vocal stack</p> <h1 class="v6-hero-title">a choir of twelve nouns</h1> <p class="v6-hero-dek">
sopranos, altos, tenors — three rows of four. each noun sings one
      note at one vowel. tap to sing. hold to sustain. press auto and the
      choir walks classical progressions. all combinations stay in tune.
</p> </header> <!-- ══ HUD ══ --> <div class="v6-hud"> <div class="v6-hud-card"> <div class="v6-hud-label">Chord</div> <div class="v6-hud-val" id="v6-chord">C major</div> <div class="v6-hud-sub">tap any noun</div> </div> <div class="v6-hud-card v6-hud-mode" id="v6-mode-card"> <div class="v6-hud-label">Mode</div> <div class="v6-hud-val" id="v6-mode-label">manual</div> <div class="v6-hud-sub">click any voice</div> </div> <div class="v6-hud-card"> <div class="v6-hud-label">Voicing</div> <div class="v6-hud-val" id="v6-voicing">12-part</div> <div class="v6-hud-sub">SAT × C E G C8</div> </div> <div class="v6-hud-card"> <div class="v6-hud-label">Jammers</div> <div class="v6-hud-val" id="v6-jammers">1</div> <div class="v6-hud-sub">live in the room</div> </div> </div> <!-- ══ AUTO-PLAY: progression selector + play/stop ══ --> <section class="v6-auto" aria-label="Auto-play progressions"> <div class="v6-auto-row"> <button id="v6-auto-btn" class="v6-auto-btn" aria-pressed="false"> <span id="v6-auto-icon" class="v6-auto-icon">▶</span> <span id="v6-auto-label" class="v6-auto-label">Play choir</span> </button> <div class="v6-progs" role="tablist" aria-label="Progression"> ${PROGRESSIONS.map((p, i) => renderTemplate`<button type="button" role="tab"${addAttribute(p.id, "data-prog")}${addAttribute(`v6-prog${i === 0 ? " v6-prog--active" : ""}`, "class")}${addAttribute(i === 0 ? "true" : "false", "aria-selected")}> <span class="v6-prog-emoji" aria-hidden="true">${p.emoji}</span> <span class="v6-prog-label">${p.label}</span> <span class="v6-prog-sub">${p.sub}</span> </button>`)} </div> </div> </section> <!-- ══ THE CHOIR — 3 rows × 4 voices ══ --> <section class="v6-stage" aria-label="The choir"> ${["sop", "alt", "ten"].map((row) => renderTemplate`<div${addAttribute(`v6-row v6-row--${row}`, "class")}> <div class="v6-row-label"> <span class="v6-row-name">${row === "sop" ? "Sopranos" : row === "alt" ? "Altos" : "Tenors"}</span> <span class="v6-row-range">${row === "sop" ? "C5 — C6" : row === "alt" ? "G4 — G5" : "C4 — C5"}</span> </div> <div class="v6-row-voices"> ${CHOIR.filter((v) => v.row === row).map((v) => renderTemplate`<button type="button" class="v6-voice"${addAttribute(v.key, "data-voice")}${addAttribute(String(v.nounId), "data-noun")}${addAttribute(String(v.semitone), "data-semitone")}${addAttribute(v.vowel, "data-vowel")}${addAttribute(`${v.label} singing ${v.vowel}`, "aria-label")}> <div class="v6-voice-card"> <div class="v6-voice-vowel" aria-hidden="true">${v.vowel}</div> <img class="v6-voice-img"${addAttribute(`https://noun.pics/${v.nounId}.svg`, "src")}${addAttribute(v.label, "alt")} width="80" height="80" loading="lazy" style="image-rendering: pixelated;" draggable="false"> <div class="v6-voice-mouth" aria-hidden="true"></div> </div> <div class="v6-voice-name">${v.label}</div> </button>`)} </div> </div>`)} </section> <!-- ══ ACTIVITY ══ --> <section class="v6-bottom"> <div class="v6-panel"> <div class="v6-panel-head"> <span class="v6-panel-title">Live Voices</span> <span class="v6-panel-dot"></span> <span id="v6-rate">—/min</span> </div> <ul id="v6-feed" class="v6-feed"> <li class="v6-feed-empty">tap a noun to sing…</li> </ul> </div> <div class="v6-panel"> <div class="v6-panel-head"> <span class="v6-panel-title">Held Right Now</span> <span id="v6-held-count">0 voices</span> </div> <div id="v6-held" class="v6-held"></div> </div> </section> <!-- ══ FOOTER ══ --> <footer class="v6-footer"> <span>⌐◨-◨ PointCast · Drum Room · v6 choir</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div>  ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v6.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v6.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v6.astro";
const $$url = "/drum-v6";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumV6,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
