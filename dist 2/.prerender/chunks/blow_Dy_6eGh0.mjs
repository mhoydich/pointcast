import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Blow = createComponent(($$result, $$props, $$slots) => {
  const title = "/blow — blow out the candle";
  const description = "One candle on the page. Tap it five times fast to blow it out, make a wish, get confetti. Single-player, pure static, no wallet, no signup. The simplest birthday ritual on PointCast.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/blow",
    name: "/blow",
    alternateName: "blow out the candle",
    description,
    url: "https://pointcast.xyz/blow",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Any (browser)"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-qciahxfe": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="blow" data-astro-cid-qciahxfe> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-qciahxfe> <a href="/" data-astro-cid-qciahxfe>← All blocks</a> <span aria-hidden="true" data-astro-cid-qciahxfe>/</span> <span data-astro-cid-qciahxfe>blow</span> </nav> <header class="head" data-astro-cid-qciahxfe> <p class="head__kicker mono" data-astro-cid-qciahxfe>★ BLOW · ONE CANDLE, ONE WISH</p> <h1 class="head__title" data-astro-cid-qciahxfe>Blow out the candle.</h1> <p class="head__lede" data-astro-cid-qciahxfe>
Tap the candle five times in two seconds to blow it out. Make a
        wish. The candle relights. <strong data-astro-cid-qciahxfe>Pure single-player</strong> —
        no wallet, no signup, no nothing. The simplest birthday ritual
        on the site.
</p> </header> <section class="stage" aria-label="The candle" data-astro-cid-qciahxfe> <div class="candle" id="candle" role="button" tabindex="0" aria-label="Tap the candle to blow on it" data-astro-cid-qciahxfe> <div class="candle__halo" id="halo" data-astro-cid-qciahxfe></div> <div class="candle__flame" id="flame" data-astro-cid-qciahxfe> <div class="candle__flame-inner" data-astro-cid-qciahxfe></div> </div> <div class="candle__wick" data-astro-cid-qciahxfe></div> <div class="candle__stick" data-astro-cid-qciahxfe></div> <div class="candle__cake" data-astro-cid-qciahxfe></div> </div> <p class="status mono" id="status" data-astro-cid-qciahxfe>· tap the candle to blow</p> <div class="meter mono" id="meter" data-astro-cid-qciahxfe> <span class="meter__label" data-astro-cid-qciahxfe>BREATH</span> <span class="meter__bar" data-astro-cid-qciahxfe><span class="meter__fill" id="meter-fill" style="width:0%" data-astro-cid-qciahxfe></span></span> </div> <p class="counter mono" id="counter" data-astro-cid-qciahxfe>· 0 candles blown out today</p> </section> <footer class="foot" data-astro-cid-qciahxfe> <p class="foot__line mono" data-astro-cid-qciahxfe> <strong data-astro-cid-qciahxfe>HOW TO PLAY.</strong> Tap or click the candle. Each tap
        adds to your "breath" meter. Reach 100% within 2 seconds and you
        blow the candle out — confetti fires, the page says "make a
        wish", the candle relights after 4 seconds. If you stop tapping
        before 100%, the meter slowly decays back to zero.
</p> <p class="foot__line mono" data-astro-cid-qciahxfe> <strong data-astro-cid-qciahxfe>WHY SO SIMPLE.</strong> The other birthday rooms (/cake,
        /cake/register, and the cluster I'm rebuilding) all carry state.
        This one carries nothing. It's the smallest possible birthday
        ritual: one candle, one wish, one tap-flurry. Refreshes the page
        and you start over.
</p> <p class="foot__brief mono" data-astro-cid-qciahxfe>
related: <a href="/cake" data-astro-cid-qciahxfe>/cake</a> · the curated room
<span class="foot__sep" data-astro-cid-qciahxfe>·</span> <a href="/sing" data-astro-cid-qciahxfe>/sing</a> · tap to sing happy birthday
</p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/blow.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/blow.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/blow.astro";
const $$url = "/blow";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Blow,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
