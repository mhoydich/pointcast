import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { r as renderScript } from './script_AUITBxpA.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

const $$DrumScorebook = createComponent(async ($$result, $$props, $$slots) => {
  const title = "Scorebook · Machine-Readable Ledger · PointCast";
  const description = "The wing's ledger — every surface, group, audio palette, backing endpoint. Read at /scorebook.json.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Scorebook",
    url: "https://pointcast.xyz/drum-scorebook",
    description,
    applicationCategory: "CatalogPage"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-altars.png", "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ds" id="ds-main"> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "scorebook" })} <header class="ds__header"> <div class="ds__chrome"> <span>SCOREBOOK</span> <span class="ds__chrome-sep">·</span> <span><span id="ds-count">—</span> SURFACES</span> <span class="ds__chrome-sep">·</span> <a class="ds__chrome-link" href="/scorebook.json">/scorebook.json</a> </div> <h1 class="ds__title">SCOREBOOK</h1> <p class="ds__tagline">a ledger of the wing · readable by humans and agents</p> </header> <section class="ds__legend"> <p>
Every surface is grouped by its wing-section. Each row carries a one-line shape, audio palette,
        and persistence backing. The full machine-readable form lives at
<a href="/scorebook.json"><code>/scorebook.json</code></a> — agents and humans share the same source.
</p> </section> <section class="ds__groups" id="ds-groups"> <div class="ds__loading">— loading the ledger —</div> </section> </main> ` })}  ${renderScript($$result, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-scorebook.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-scorebook.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-scorebook.astro";
const $$url = "/drum-scorebook";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumScorebook,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
