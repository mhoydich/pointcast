import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Wrapped = createComponent(($$result, $$props, $$slots) => {
  const title = "/wrapped — open a wrapped present";
  const description = "A wrapped birthday present on the page. Click to peel each layer — bow, two paper flaps, lid, Noun reveal. Five clicks to unwrap, one click to rewrap with a fresh Noun. Pure single-player.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/wrapped",
    name: "/wrapped",
    alternateName: "open a wrapped birthday present",
    description,
    url: "https://pointcast.xyz/wrapped",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Any (browser)"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-s5zotrkj": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="wrapped" data-astro-cid-s5zotrkj> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-s5zotrkj> <a href="/" data-astro-cid-s5zotrkj>← All blocks</a> <span aria-hidden="true" data-astro-cid-s5zotrkj>/</span> <span data-astro-cid-s5zotrkj>wrapped</span> </nav> <header class="head" data-astro-cid-s5zotrkj> <p class="head__kicker mono" data-astro-cid-s5zotrkj>★ WRAPPED · OPEN A PRESENT</p> <h1 class="head__title" data-astro-cid-s5zotrkj>Open it.</h1> <p class="head__lede" data-astro-cid-s5zotrkj>
A wrapped birthday present, sitting on the page. Click to peel
        each layer: <strong data-astro-cid-s5zotrkj>bow off, paper flaps back, lid up,
        Noun reveal</strong>. Five clicks. Then rewrap with a fresh
        Noun and do it again.
</p> </header> <section class="stage" aria-label="The present" data-astro-cid-s5zotrkj> <div class="present" id="present" data-stage="0" role="button" tabindex="0" aria-label="Click to peel a layer" data-astro-cid-s5zotrkj> <!-- The box --> <div class="present__box" data-astro-cid-s5zotrkj> <div class="present__noun-wrap" data-astro-cid-s5zotrkj> <img class="present__noun" id="noun-img" src="" alt="" width="100" height="100" loading="lazy" data-astro-cid-s5zotrkj> <p class="present__noun-label mono" id="noun-label" data-astro-cid-s5zotrkj>NOUN —</p> </div> </div> <!-- The lid --> <div class="present__lid" data-astro-cid-s5zotrkj> <div class="present__lid-skirt" data-astro-cid-s5zotrkj></div> </div> <!-- Wrapping paper, two flaps --> <div class="present__paper present__paper--left" data-astro-cid-s5zotrkj></div> <div class="present__paper present__paper--right" data-astro-cid-s5zotrkj></div> <!-- Ribbon (vertical + horizontal) --> <div class="present__ribbon present__ribbon--v" data-astro-cid-s5zotrkj></div> <div class="present__ribbon present__ribbon--h" data-astro-cid-s5zotrkj></div> <!-- Bow --> <div class="present__bow" data-astro-cid-s5zotrkj> <div class="present__bow-loop present__bow-loop--l" data-astro-cid-s5zotrkj></div> <div class="present__bow-loop present__bow-loop--r" data-astro-cid-s5zotrkj></div> <div class="present__bow-knot" data-astro-cid-s5zotrkj></div> <div class="present__bow-tail present__bow-tail--l" data-astro-cid-s5zotrkj></div> <div class="present__bow-tail present__bow-tail--r" data-astro-cid-s5zotrkj></div> </div> <!-- Tag --> <div class="present__tag" data-astro-cid-s5zotrkj> <p class="present__tag-line mono" data-astro-cid-s5zotrkj>TO YOU</p> <p class="present__tag-line present__tag-line--from mono" data-astro-cid-s5zotrkj>FROM /WRAPPED</p> </div> </div> <p class="status mono" id="status" data-astro-cid-s5zotrkj>· click the present to peel a layer</p> <div class="controls" data-astro-cid-s5zotrkj> <button type="button" id="rewrap-btn" class="control mono" data-astro-cid-s5zotrkj>↺ REWRAP · FRESH NOUN</button> <span class="counter mono" id="counter" data-astro-cid-s5zotrkj>· 0 presents opened</span> </div> </section> <footer class="foot" data-astro-cid-s5zotrkj> <p class="foot__line mono" data-astro-cid-s5zotrkj> <strong data-astro-cid-s5zotrkj>HOW IT WORKS.</strong> Each click advances the unwrap by one
        stage. Stage 1 unties the bow. Stage 2 folds the left paper flap
        back. Stage 3 folds the right one. Stage 4 lifts the lid off the
        box. Stage 5 fades in the Noun inside + fires confetti.
</p> <p class="foot__line mono" data-astro-cid-s5zotrkj> <strong data-astro-cid-s5zotrkj>WHAT'S INSIDE.</strong> A random Noun (0–1199) from the
        Nouns DAO CC0 collection via noun.pics. Each rewrap rolls a new
        one. The Noun is cached locally so the page remembers your
        unwrapped present between visits.
</p> <p class="foot__brief mono" data-astro-cid-s5zotrkj>
related: <a href="/sing" data-astro-cid-s5zotrkj>/sing</a> <span class="foot__sep" data-astro-cid-s5zotrkj>·</span> <a href="/blow" data-astro-cid-s5zotrkj>/blow</a> <span class="foot__sep" data-astro-cid-s5zotrkj>·</span> <a href="/cheers" data-astro-cid-s5zotrkj>/cheers</a> <span class="foot__sep" data-astro-cid-s5zotrkj>·</span> <a href="/cake" data-astro-cid-s5zotrkj>/cake</a> </p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wrapped.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wrapped.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wrapped.astro";
const $$url = "/wrapped";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Wrapped,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
