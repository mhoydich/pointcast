import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Sing = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/sing — tap to sing happy birthday";
  const description = "Tap through the syllables to sing happy birthday. Single-player at N=1: you sing, the page sings back. Multiplayer at N>1: hear other people's taps as a soft chorus underneath. Web Audio synthesized — no audio files, works offline.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/sing",
    name: "/sing",
    alternateName: "tap to sing happy birthday",
    description,
    url: "https://pointcast.xyz/sing",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Any (browser with Web Audio)"
  };
  const ZONES = [
    { id: 1, color: "#C8102E", label: "HAP" },
    { id: 2, color: "#E36F1E", label: "PY" },
    { id: 3, color: "#F2C94C", label: "BIRTH" },
    { id: 4, color: "#2F8B3C", label: "DAY" },
    { id: 5, color: "#1F4FA5", label: "TO" },
    { id: 6, color: "#7C3AA0", label: "YOU" }
  ];
  const LINES = [
    { name: "line 1 — happy birthday to you", notes: ["G4", "G4", "A4", "G4", "C5", "B4"] },
    { name: "line 2 — happy birthday to you", notes: ["G4", "G4", "A4", "G4", "D5", "C5"] },
    { name: "line 3 — happy birthday dear ___", notes: ["G4", "G4", "G5", "E5", "C5", "B4"] },
    { name: "line 4 — happy birthday to you", notes: ["F5", "F5", "E5", "C5", "D5", "C5"] }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-5xt4qgid": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="sing" data-astro-cid-5xt4qgid> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-5xt4qgid> <a href="/" data-astro-cid-5xt4qgid>← All blocks</a> <span aria-hidden="true" data-astro-cid-5xt4qgid>/</span> <span data-astro-cid-5xt4qgid>sing</span> </nav> <header class="head" data-astro-cid-5xt4qgid> <p class="head__kicker mono" data-astro-cid-5xt4qgid>★ SING · TAP TO SING HAPPY BIRTHDAY</p> <h1 class="head__title" data-astro-cid-5xt4qgid>Tap to sing.</h1> <p class="head__lede" data-astro-cid-5xt4qgid>
Six tap-zones, one per syllable. Tap through the song to sing it
        — the notes are synthesized in your browser. <strong data-astro-cid-5xt4qgid>Works alone</strong>
— your taps are the song. <strong data-astro-cid-5xt4qgid>Better with friends</strong> — when
        others tap at the same time on the same page, you hear theirs as a
        soft chorus underneath.
</p> <p class="head__sub mono" data-astro-cid-5xt4qgid> <span id="status-line" data-astro-cid-5xt4qgid>· web audio loads on first tap</span> </p> </header> <section class="board" aria-label="Sing board" data-astro-cid-5xt4qgid> <div class="line-strip" id="line-strip" data-astro-cid-5xt4qgid> ${LINES.map((line, i) => renderTemplate`<div${addAttribute(`line${i === 0 ? " line--current" : ""}`, "class")}${addAttribute(i, "data-line-idx")} data-astro-cid-5xt4qgid> <p class="line__lyric" data-astro-cid-5xt4qgid>${line.name.toUpperCase()}</p> <div class="line__progress" data-astro-cid-5xt4qgid> ${line.notes.map((_, j) => renderTemplate`<span class="line__dot"${addAttribute(j, "data-syl-idx")} data-astro-cid-5xt4qgid></span>`)} </div> </div>`)} </div> <div class="zones" role="group" aria-label="Tap zones" data-astro-cid-5xt4qgid> ${ZONES.map((z) => renderTemplate`<button type="button" class="zone"${addAttribute(z.id, "data-zone-id")}${addAttribute(`background: ${z.color};`, "style")}${addAttribute(`Tap zone ${z.id}, syllable ${z.label}`, "aria-label")} data-astro-cid-5xt4qgid> <span class="zone__num mono" data-astro-cid-5xt4qgid>${z.id}</span> <span class="zone__label mono" data-astro-cid-5xt4qgid>${z.label}</span> </button>`)} </div> <div class="controls" data-astro-cid-5xt4qgid> <button type="button" id="reset-btn" class="control mono" data-astro-cid-5xt4qgid>↺ RESET</button> <button type="button" id="auto-btn" class="control mono" data-astro-cid-5xt4qgid>▶ AUTO-PLAY</button> <span class="controls__chorus mono" id="chorus-line" data-astro-cid-5xt4qgid>· chorus offline</span> </div> </section> <footer class="foot" data-astro-cid-5xt4qgid> <p class="foot__line mono" data-astro-cid-5xt4qgid> <strong data-astro-cid-5xt4qgid>HOW IT WORKS.</strong> Each tap-zone advances the song by one
        syllable. The note that plays depends on which line you're on (top
        strip shows your position). After completing all 4 lines the page
        celebrates briefly and resets so you can sing it again.
</p> <p class="foot__line mono" data-astro-cid-5xt4qgid> <strong data-astro-cid-5xt4qgid>WHY NO RECORDING.</strong> The act of tapping is the artifact.
        No "save your rendition" button — the singer is the human, not the
        page. Local cache only remembers your line position so the page
        picks up where you left off.
</p> <p class="foot__brief mono" data-astro-cid-5xt4qgid>
related: <a href="/parties" data-astro-cid-5xt4qgid>/parties</a> · all birthday rooms
<span class="foot__sep" data-astro-cid-5xt4qgid>·</span> <a href="/wish" data-astro-cid-5xt4qgid>/wish</a> · <a href="/decades" data-astro-cid-5xt4qgid>/decades</a> · <a href="/year" data-astro-cid-5xt4qgid>/year</a> · <a href="/cake" data-astro-cid-5xt4qgid>/cake</a> </p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sing.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sing.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sing.astro";
const $$url = "/sing";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sing,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
