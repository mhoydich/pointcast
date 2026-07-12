import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumSaint = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Your Patron Saint · PointCast";
  const description = "Each visitor is assigned a patron Noun and an altar lane. Click to make an offering at your patron’s altar.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Patron Saint",
    url: "https://pointcast.xyz/drum-saint",
    description,
    applicationCategory: "MultimediaApplication"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ds" id="ds-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "saint" })} <header class="ds__header"> <div class="ds__chrome"> <span>PATRON</span> <span class="ds__chrome-sep">·</span> <span id="ds-week-chip">WEEK ---</span> <span class="ds__chrome-sep">·</span> <span id="ds-lane-chip">— LANE</span> </div> <h1 class="ds__title">YOUR SAINT</h1> <p class="ds__tagline">a single Noun assigned to you, kept by the chamber</p> </header> <section class="ds__altar"> <div class="ds__halo"></div> <div class="ds__frame"> <div class="ds__frame-inner"> <img class="ds__noun" id="ds-noun" src="https://noun.pics/0.svg" alt="Your patron Noun"> </div> </div> <div class="ds__plaque"> <div class="ds__plaque-rule"></div> <div class="ds__epithet"> <div class="ds__line ds__line--major">SAINT NOUN <span id="ds-noun-num">0000</span></div> <div class="ds__line ds__line--italic">of the <span id="ds-lane">—</span> Lane</div> <div class="ds__line ds__line--minor">keeper of the <span id="ds-virtue">—</span></div> </div> <div class="ds__plaque-rule"></div> </div> <button class="ds__offer" id="ds-offer" type="button" disabled>MAKE OFFERING</button> <div class="ds__hint" id="ds-hint">— assigning your saint —</div> </section> <section class="ds__readout"> <div class="ds__panel"> <div class="ds__panel-label">YOUR OFFERINGS</div> <div class="ds__panel-value" id="ds-mine">0</div> </div> <div class="ds__panel"> <div class="ds__panel-label">ALTAR THIS WEEK</div> <div class="ds__panel-value" id="ds-altar-count">—</div> </div> <div class="ds__panel"> <div class="ds__panel-label">CHAMBER TOTAL</div> <div class="ds__panel-value" id="ds-total">—</div> </div> </section> <section class="ds__how"> <p>
Two identities, one offering. Your <strong>patron Noun</strong> is yours forever — same browser,
        same Noun. Your <strong>altar lane</strong> (one of bell, bowl, chime, gong, drone) rotates with
        the ISO week and resolves to whichever Noun is enshrined there on Monday morning.
</p> <p>
When you make an offering, your patron Noun appears in this room — but your tribute lands at
<a href="/drum-altars">the chamber</a>'s active altar for your lane. Your saint travels with you.
        The altar belongs to the week.
</p> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-saint.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-saint.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-saint.astro";
const $$url = "/drum-saint";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumSaint,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
