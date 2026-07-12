import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumShrine = createComponent(($$result, $$props, $$slots) => {
  const title = "Shrine · One Noun a Day · PointCast";
  const description = "A single Noun on display in a velvet pixel-art shrine. Rotates daily at UTC midnight. Click the bell to ring; click the sanctum to kneel.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Shrine",
    url: "https://pointcast.xyz/drum-shrine",
    description,
    applicationCategory: "MultimediaApplication"
  };
  const SSR_SEED = 411;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ds" id="ds-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "shrine" })} <header class="ds__header"> <div class="ds__chrome"> <span>TODAY'S SHRINE</span> <span class="ds__chrome-sep">·</span> <span id="ds-date">—</span> <span class="ds__chrome-sep">·</span> <span id="ds-day">DAY ---</span> </div> <h1 class="ds__title">SHRINE</h1> <p class="ds__tagline">a single Noun on display until UTC midnight</p> </header> <section class="ds__temple" aria-label="Click the bell or sanctum"> <!-- Temple silhouette --> <svg class="ds__temple-svg" viewBox="0 0 320 380" shape-rendering="crispEdges" aria-hidden="true"> <!-- pediment + roof tip --> <path d="M 160 8 L 280 70 L 40 70 Z" fill="#3a2410"></path> <path d="M 160 14 L 270 70 L 50 70 Z" fill="#5a3618"></path> <!-- roof apex bell housing --> <rect x="148" y="34" width="24" height="22" fill="#1a0820"></rect> <rect x="146" y="34" width="28" height="3" fill="#d4a437"></rect> <rect x="146" y="56" width="28" height="3" fill="#d4a437"></rect> <!-- pediment trim --> <rect x="40" y="68" width="240" height="4" fill="#d4a437"></rect> <!-- entablature --> <rect x="34" y="72" width="252" height="14" fill="#3a2410"></rect> <rect x="34" y="86" width="252" height="3" fill="#6b4d12"></rect> <!-- columns left --> <rect x="48" y="89" width="20" height="220" fill="#b8862c"></rect> <rect x="46" y="305" width="24" height="8" fill="#d4a437"></rect> <rect x="50" y="91" width="2" height="218" fill="#fff5c0" opacity="0.5"></rect> <rect x="62" y="91" width="2" height="218" fill="#6b4d12" opacity="0.7"></rect> <!-- columns right --> <rect x="252" y="89" width="20" height="220" fill="#b8862c"></rect> <rect x="250" y="305" width="24" height="8" fill="#d4a437"></rect> <rect x="254" y="91" width="2" height="218" fill="#fff5c0" opacity="0.5"></rect> <rect x="266" y="91" width="2" height="218" fill="#6b4d12" opacity="0.7"></rect> <!-- inner wall (recessed) --> <rect x="68" y="89" width="184" height="220" fill="#0c0410"></rect> <!-- floor --> <rect x="34" y="313" width="252" height="14" fill="#3a2410"></rect> <rect x="28" y="327" width="264" height="6" fill="#6b4d12"></rect> <rect x="22" y="333" width="276" height="4" fill="#3a2410"></rect> <!-- braziers --> <rect x="84" y="290" width="16" height="20" fill="#6b4d12"></rect> <rect x="80" y="288" width="24" height="4" fill="#d4a437"></rect> <rect x="220" y="290" width="16" height="20" fill="#6b4d12"></rect> <rect x="216" y="288" width="24" height="4" fill="#d4a437"></rect> </svg> <!-- Apex bell (clickable) --> <button class="ds__bell" id="ds-bell" type="button" aria-label="Ring the apex bell"> <svg viewBox="0 0 60 70" shape-rendering="crispEdges" aria-hidden="true"> <path d="M 12 14 L 48 14 L 50 56 L 10 56 Z" fill="#d4a437"></path> <rect x="10" y="56" width="40" height="3" fill="#b8862c"></rect> <rect x="8" y="59" width="44" height="3" fill="#6b4d12"></rect> <rect x="16" y="22" width="2" height="22" fill="#fff5c0" opacity="0.55"></rect> <rect x="26" y="6" width="8" height="2" fill="#6b4d12"></rect> <rect x="24" y="8" width="12" height="6" fill="#b8862c"></rect> </svg> </button> <!-- Inner sanctum (clickable for kneel) --> <button class="ds__sanctum" id="ds-sanctum" type="button" aria-label="Kneel before the Noun"> <div class="ds__sanctum-frame"> <img class="ds__noun" id="ds-noun"${addAttribute(`https://noun.pics/${SSR_SEED}.svg`, "src")}${addAttribute(`Today's Noun #${SSR_SEED}`, "alt")}> </div> <div class="ds__nameplate">
NOUN <span id="ds-noun-num">${String(SSR_SEED).padStart(4, "0")}</span> </div> </button> <!-- Incense smoke (CSS animation) --> <div class="ds__smoke ds__smoke--left"> <span></span><span></span><span></span> </div> <div class="ds__smoke ds__smoke--right"> <span></span><span></span><span></span> </div> </section> <section class="ds__readout"> <div class="ds__panel"> <div class="ds__panel-label">YOUR RINGS</div> <div class="ds__panel-value" id="ds-rings">0</div> </div> <div class="ds__panel"> <div class="ds__panel-label">YOUR KNEELS</div> <div class="ds__panel-value" id="ds-kneels">0</div> </div> <div class="ds__panel"> <div class="ds__panel-label">UNTIL ROTATION</div> <div class="ds__panel-value" id="ds-countdown">--:--</div> </div> </section> <section class="ds__how"> <p>
Today's Noun is a single fixed identity — derived from the UTC day-of-year so every visitor is
        looking at the same Noun, today, until midnight UTC. Click the brass apex bell to ring, click
        the inner sanctum to kneel. Two counts, both yours alone.
</p> <p>
Tomorrow brings a different Noun. The day after, another. There are 1200 Nouns, so the cycle
        recurs every ~3.3 years.
</p> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-shrine.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-shrine.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-shrine.astro";
const $$url = "/drum-shrine";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumShrine,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
