import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Cheers = createComponent(($$result, $$props, $$slots) => {
  const title = "/cheers — clink glasses with a Noun";
  const description = "Two glasses, two Nouns, one clink. Tap to toast — short animation + a synthesized tink tone. Pure single-player, no wallet, no signup, no KV. Sibling to /blow and /sing.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/cheers",
    name: "/cheers",
    alternateName: "clink glasses with a Noun",
    description,
    url: "https://pointcast.xyz/cheers",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Any (browser)"
  };
  function dailyNoun() {
    const today = /* @__PURE__ */ new Date();
    const dayIndex = Math.floor(today.getTime() / 864e5);
    return (dayIndex * 47 % 1200 + 1200) % 1200;
  }
  const FRIEND_NOUN = dailyNoun();
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-b7ecgmm2": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="cheers" data-astro-cid-b7ecgmm2> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-b7ecgmm2> <a href="/" data-astro-cid-b7ecgmm2>← All blocks</a> <span aria-hidden="true" data-astro-cid-b7ecgmm2>/</span> <span data-astro-cid-b7ecgmm2>cheers</span> </nav> <header class="head" data-astro-cid-b7ecgmm2> <p class="head__kicker mono" data-astro-cid-b7ecgmm2>★ CHEERS · CLINK WITH A NOUN</p> <h1 class="head__title" data-astro-cid-b7ecgmm2>To you.</h1> <p class="head__lede" data-astro-cid-b7ecgmm2>
Two glasses, two Nouns, one clink. Tap the table (or press space)
        to toast. <strong data-astro-cid-b7ecgmm2>Today's friend Noun rotates daily</strong> — same
        stranger for every visitor on the same day. Re-roll your own
        Noun via the input below.
</p> </header> <section class="stage" aria-label="The toast" data-astro-cid-b7ecgmm2> <div class="table" id="table" role="button" tabindex="0" aria-label="Tap the table to clink glasses" data-astro-cid-b7ecgmm2> <div class="glass glass--yours" id="glass-yours" data-astro-cid-b7ecgmm2> <img class="glass__noun" id="noun-yours"${addAttribute(`https://noun.pics/888.svg`, "src")} alt="Your Noun" width="48" height="48" loading="lazy" data-astro-cid-b7ecgmm2> <div class="glass__bowl" data-astro-cid-b7ecgmm2></div> <div class="glass__stem" data-astro-cid-b7ecgmm2></div> <div class="glass__base" data-astro-cid-b7ecgmm2></div> <p class="glass__label mono" data-astro-cid-b7ecgmm2>YOU</p> </div> <div class="glass glass--friend" id="glass-friend" data-astro-cid-b7ecgmm2> <img class="glass__noun" id="noun-friend"${addAttribute(`https://noun.pics/${FRIEND_NOUN}.svg`, "src")} alt="Friend Noun" width="48" height="48" loading="lazy" data-astro-cid-b7ecgmm2> <div class="glass__bowl" data-astro-cid-b7ecgmm2></div> <div class="glass__stem" data-astro-cid-b7ecgmm2></div> <div class="glass__base" data-astro-cid-b7ecgmm2></div> <p class="glass__label mono" data-astro-cid-b7ecgmm2>TODAY'S FRIEND · NOUN ${FRIEND_NOUN}</p> </div> </div> <p class="status mono" id="status" data-astro-cid-b7ecgmm2>· tap the table to clink</p> <div class="form" aria-label="Pick your Noun" data-astro-cid-b7ecgmm2> <label for="noun-input" class="form__label mono" data-astro-cid-b7ecgmm2>YOUR NOUN · 0–1199</label> <div class="form__row" data-astro-cid-b7ecgmm2> <input id="noun-input" type="number" min="0" max="1199" value="888" inputmode="numeric" data-astro-cid-b7ecgmm2> <button type="button" id="noun-random" class="form__mini mono" data-astro-cid-b7ecgmm2>RANDOM ↻</button> </div> </div> <p class="counter mono" id="counter" data-astro-cid-b7ecgmm2>· 0 clinks on this device</p> </section> <footer class="foot" data-astro-cid-b7ecgmm2> <p class="foot__line mono" data-astro-cid-b7ecgmm2> <strong data-astro-cid-b7ecgmm2>HOW IT WORKS.</strong> Tap the table — both glasses tilt
        toward each other, the rims meet, a synthesized "tink" tone
        plays, a small ripple radiates from the contact point, and the
        glasses settle back. ~700ms cooldown so visitors can't keyboard-
        mash the toast.
</p> <p class="foot__line mono" data-astro-cid-b7ecgmm2> <strong data-astro-cid-b7ecgmm2>WHY A FRIEND ROTATES.</strong> The friend Noun is picked
        deterministically from today's UTC date — every visitor on the
        same day toasts the same stranger. Tomorrow it'll be someone
        else. The act is a little less alone if everyone clinks the same
        glass.
</p> <p class="foot__brief mono" data-astro-cid-b7ecgmm2>
related: <a href="/sing" data-astro-cid-b7ecgmm2>/sing</a> · tap to sing
<span class="foot__sep" data-astro-cid-b7ecgmm2>·</span> <a href="/blow" data-astro-cid-b7ecgmm2>/blow</a> · blow out the candle
<span class="foot__sep" data-astro-cid-b7ecgmm2>·</span> <a href="/cake" data-astro-cid-b7ecgmm2>/cake</a> · the curated room
</p> </footer> </div> ` })} ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cheers.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cheers.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cheers.astro";
const $$url = "/cheers";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cheers,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
