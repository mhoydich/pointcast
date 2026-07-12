import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$DrumLayout } from './DrumLayout_Dfyv0wmF.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumV9 = createComponent(async ($$result, $$props, $$slots) => {
  const VOICES = [
    // Sopranos (high, soaring) — top of the chord
    { key: "sop-1", label: "Songbird", nounId: 77, sax: "soprano", semitone: 60, accent: "#fbbf24", tagline: "1986 · sopr." },
    { key: "sop-2", label: "Forever in Love", nounId: 144, sax: "soprano", semitone: 64, accent: "#fb923c", tagline: "1992 · sopr." },
    // Altos (sweet, lyrical) — mid-range melody
    { key: "alt-1", label: "Going Home", nounId: 211, sax: "alto", semitone: 55, accent: "#f97316", tagline: "1989 · alto" },
    { key: "alt-2", label: "Silhouette", nounId: 278, sax: "alto", semitone: 59, accent: "#ea580c", tagline: "1988 · alto" },
    // Tenors (warm, romantic) — chord body
    { key: "ten-1", label: "By the Time", nounId: 345, sax: "tenor", semitone: 48, accent: "#dc2626", tagline: "1997 · tenor" },
    { key: "ten-2", label: "The Moment", nounId: 412, sax: "tenor", semitone: 52, accent: "#b91c1c", tagline: "1996 · tenor" },
    // Baritones (deep, anchoring) — chord roots
    { key: "bar-1", label: "Loving You", nounId: 479, sax: "baritone", semitone: 41, accent: "#a21caf", tagline: "1986 · bari" },
    { key: "bar-2", label: "Sentimental", nounId: 546, sax: "baritone", semitone: 36, accent: "#7e22ce", tagline: "1992 · bari" }
  ];
  return renderTemplate`${renderComponent($$result, "DrumLayout", $$DrumLayout, { "title": "Drum Room v9 · The Lounge", "description": "Eight saxophones in a smooth jazz lounge. Hold a Noun to sustain — a nod to Kenny G's circular-breathing world record. Rhodes + walking bass + brushes back you up while the sun sets.", "image": "/images/og-drum.png" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="v9-root"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "v9" })} <header class="v9-hero"> <div class="v9-hero-line"> <p class="v9-hero-eyebrow">v9 · the lounge · smooth jazz</p> <span class="v9-onair" id="v9-onair">● ON AIR</span> </div> <h1 class="v9-hero-title">an evening with the saxophone</h1> <p class="v9-hero-dek">
eight horns. one chord. infinite possibility. <em>hold</em> a noun
      and it sings forever — circular breathing, the Kenny way. tap
      multiple at once and you've made a jazz chord. press the lights
      and the rhythm section joins you. enjoy the night.
</p> </header> <!-- ══ HUD ══ --> <div class="v9-hud"> <div class="v9-hud-card"> <div class="v9-hud-label">Holding</div> <div class="v9-hud-val" id="v9-holding">silence</div> <div class="v9-hud-sub">press + hold a noun to sustain</div> </div> <div class="v9-hud-card v9-hud-mode" id="v9-mode-card"> <div class="v9-hud-label">Backing</div> <div class="v9-hud-val" id="v9-mode-label">off</div> <div class="v9-hud-sub" id="v9-mode-sub">rhodes · bass · brushes</div> </div> <div class="v9-hud-card v9-hud-jammers"> <div class="v9-hud-label">In the Lounge</div> <div class="v9-hud-val" id="v9-jammers">1</div> <div class="v9-hud-sub">live · jam together</div> </div> <div class="v9-hud-card"> <div class="v9-hud-label">Vibe</div> <div class="v9-hud-val" id="v9-vibe">F maj 9</div> <div class="v9-hud-sub">key · ii–V–I cycling</div> </div> </div> <!-- ══ BACKING TRACK CONTROLS ══ --> <section class="v9-backing"> <button id="v9-backing-btn" class="v9-backing-btn" aria-pressed="false"> <span id="v9-backing-icon">🎹</span> <span id="v9-backing-label">Press · light the candles</span> </button> <div class="v9-tempo"> <input type="range" id="v9-tempo" min="72" max="120" value="96" step="1"> <span class="v9-tempo-val"><span id="v9-tempo-num">96</span> bpm</span> </div> <div class="v9-backing-meta"> <span class="v9-backing-bar">▮▮▮▮ · <span id="v9-bar-pos">—</span></span> <span class="v9-backing-chord" id="v9-current-chord">—</span> </div> </section> <!-- ══ THE BAND ══ --> <section class="v9-stage" aria-label="The band"> <div class="v9-stage-grid"> ${VOICES.map((v) => renderTemplate`<button type="button" class="v9-voice"${addAttribute(v.key, "data-voice")}${addAttribute(String(v.nounId), "data-noun")}${addAttribute(v.sax, "data-sax")}${addAttribute(String(v.semitone), "data-semitone")}${addAttribute(`${v.label} — ${v.sax} sax, hold to sustain`, "aria-label")}${addAttribute(`--accent: ${v.accent}`, "style")}> <div class="v9-voice-card"> <img class="v9-voice-img"${addAttribute(`https://noun.pics/${v.nounId}.svg`, "src")}${addAttribute(v.label, "alt")} width="128" height="128" loading="lazy" style="image-rendering: pixelated;"> <div class="v9-voice-sax-pill">${v.sax.toUpperCase()}</div> </div> <div class="v9-voice-name">${v.label}</div> <div class="v9-voice-tagline">${v.tagline}</div> <div class="v9-voice-vu" aria-hidden="true"> <span class="v9-voice-vu-bar"></span> </div> </button>`)} </div> </section> <!-- ══ APPRECIATION FOOTER ══ --> <section class="v9-appreciation"> <p class="v9-appreciation-line"> <span class="v9-appreciation-glyph">⌐◨-◨</span> <em>for Kenneth Bruce Gorelick — born June 5, 1956 · Seattle</em> <span class="v9-appreciation-dot">·</span> <span>set a Guinness World Record holding an E-flat for 45m 47s</span> <span class="v9-appreciation-dot">·</span> <span>thank you for the soundtrack of every late drive home</span> </p> </section> <footer class="v9-footer"> <span>⌐◨-◨ PointCast · Drum Room · v9 the lounge</span> <span>Signed: Michael Hoydich · Claude Opus 4.7 (1M Max) · 2026</span> </footer> </div>  ${renderScript($$result2, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v9.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v9.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-v9.astro";
const $$url = "/drum-v9";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumV9,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
