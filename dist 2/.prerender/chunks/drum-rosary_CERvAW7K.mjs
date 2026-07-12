import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumRosary = createComponent(($$result, $$props, $$slots) => {
  const title = "Rosary · Twenty Beads · PointCast";
  const description = "Twenty brass beads on a wood field. Walk them in sequence; the twentieth completes a blessing.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Rosary",
    url: "https://pointcast.xyz/drum-rosary",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const BEADS = Array.from({ length: 20 }, (_, i) => i);
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dr" id="dr-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "rosary" })} <header class="dr__header"> <div class="dr__chrome"> <span>TWENTY BEADS</span> <span class="dr__chrome-sep">·</span> <span id="dr-progress">0 / 20</span> <span class="dr__chrome-sep">·</span> <span id="dr-completed">0 COMPLETED</span> </div> <h1 class="dr__title">ROSARY</h1> <p class="dr__tagline">walk the beads in sequence — slowly</p> </header> <section class="dr__field" id="dr-field" aria-label="Twenty brass beads in a sequence"> <svg class="dr__path" viewBox="0 0 600 400" aria-hidden="true"> <!-- the path the beads sit on, drawn as a faint dotted ellipse --> <ellipse cx="300" cy="200" rx="250" ry="160" fill="none" stroke="#6b4d12" stroke-width="2" stroke-dasharray="2 6" opacity="0.5"></ellipse> </svg> <div class="dr__beads"> ${BEADS.map((i) => renderTemplate`<button class="dr__bead" type="button"${addAttribute(i, "data-idx")}${addAttribute(`Bead ${i + 1}`, "aria-label")}> <span class="dr__bead-num">${i + 1}</span> </button>`)} </div> <div class="dr__center"> <div class="dr__center-glyph" id="dr-center-glyph">✦</div> <div class="dr__center-text" id="dr-center-text">walk slowly</div> </div> </section> <footer class="dr__controls"> <button class="dr__reset" id="dr-reset" type="button">RESET</button> <p class="dr__instructions">
Beads enable in order. Click bead 1 to begin. Each bead rises a step on the pentatonic scale.
        When you reach bead 20, the sequence plays back as a blessing.
</p> </footer> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-rosary.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-rosary.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-rosary.astro";
const $$url = "/drum-rosary";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumRosary,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
