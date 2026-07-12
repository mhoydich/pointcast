import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$NounsPortraitStrip } from './NounsPortraitStrip_3imNU3-4.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

const $$NounsPortraits = createComponent(($$result, $$props, $$slots) => {
  const KT1 = contracts.visit_nouns?.mainnet;
  const description = "Five PointCast Visit Nouns portraits, mintable on Tezos mainnet through the Visit Nouns FA2.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/nouns-portraits",
    name: "PointCast Nouns Portraits",
    description,
    url: "https://pointcast.xyz/nouns-portraits",
    isPartOf: {
      "@type": "WebSite",
      name: "PointCast",
      url: "https://pointcast.xyz/"
    },
    about: {
      "@type": "CreativeWork",
      name: "Visit Nouns FA2",
      identifier: KT1,
      url: `https://tzkt.io/${KT1}`
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Nouns Portraits", "description": description, "jsonLd": jsonLd, "data-astro-cid-em3ylso5": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-em3ylso5> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-em3ylso5> <a href="/" data-astro-cid-em3ylso5>Home</a> <span aria-hidden="true" data-astro-cid-em3ylso5>/</span> <span data-astro-cid-em3ylso5>Nouns Portraits</span> </nav> <header class="hero" data-astro-cid-em3ylso5> <p class="hero__kicker" data-astro-cid-em3ylso5>PointCast collection surface</p> <h1 data-astro-cid-em3ylso5>Nouns portraits, ready to mint.</h1> <p data-astro-cid-em3ylso5>
A tight set of five CC0 Nouns seeds for the PointCast front door.
        Each one routes through the live Visit Nouns FA2 on Tezos mainnet.
</p> </header> ${renderComponent($$result2, "NounsPortraitStrip", $$NounsPortraitStrip, { "context": "page", "data-astro-cid-em3ylso5": true })} <aside class="note" data-astro-cid-em3ylso5> <p data-astro-cid-em3ylso5>
Contract: <code data-astro-cid-em3ylso5>${KT1}</code>.
        Minted tokens appear on <a href="/collection/visit-nouns" data-astro-cid-em3ylso5>/collection/visit-nouns</a> and objkt after indexing.
</p> </aside> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-portraits.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-portraits.astro";
const $$url = "/nouns-portraits";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsPortraits,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
