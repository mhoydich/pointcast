import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$OceanMeditation } from './OceanMeditation_Dm2KHoFu.mjs';

const $$BreatheCalifornia = createComponent(($$result, $$props, $$slots) => {
  const token = {
    name: "Breathe California",
    contract: "KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP",
    tokenId: "10",
    image: "/images/tokens/10.png",
    url: "https://objkt.com/tokens/KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP/10",
    description: "Southern California breathwork token, routed back through PointCast as a quiet two-minute room."
  };
  const title = "Breathe California";
  const description = "A PointCast breathing room anchored to Mike Hoydich's Breathe California token on Tezos.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/breathe-california",
    name: "PointCast Breathe California",
    description,
    url: "https://pointcast.xyz/breathe-california",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    isPartOf: {
      "@type": "WebSite",
      name: "PointCast",
      url: "https://pointcast.xyz"
    },
    associatedMedia: {
      "@type": "ImageObject",
      name: token.name,
      url: `https://assets.objkt.media/file/assets-003/${token.contract}/${token.tokenId}/thumb400`,
      contentUrl: token.url
    },
    featureList: [
      "Tezos token-backed breathing timer",
      "2, 5, and 10 minute sessions",
      "Calm Bay, Deep Current, and Moon Tide programs",
      "Full-screen focus mode",
      "Local tide log stored in the browser",
      "Optional generated ocean tone"
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/meditate.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/breathe-california.json", title: "Breathe California room (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/meditate.png",
    buttons: [
      { label: "Open Breathe California", action: "link", target: "https://pointcast.xyz/breathe-california" },
      { label: "View on objkt", action: "link", target: token.url }
    ]
  }, "data-astro-cid-fcrzqevq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-fcrzqevq> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-fcrzqevq> <a href="/" data-astro-cid-fcrzqevq>Home</a> <span aria-hidden="true" data-astro-cid-fcrzqevq>/</span> <span data-astro-cid-fcrzqevq>breathe-california</span> </nav> <header class="hero" data-astro-cid-fcrzqevq> <div class="hero__copy" data-astro-cid-fcrzqevq> <p class="kicker" data-astro-cid-fcrzqevq>TEZOS RESET · POINTCAST</p> <h1 data-astro-cid-fcrzqevq>A California breath you can actually finish.</h1> <p class="dek" data-astro-cid-fcrzqevq>
One objkt token becomes a small room: pick a cadence, let the coast
          set the tempo, and leave with a local tide log instead of another tab
          asking for more.
</p> <div class="hero__actions" data-astro-cid-fcrzqevq> <a href="#session" class="hero__cta" data-astro-cid-fcrzqevq>Start session</a> <a${addAttribute(token.url, "href")} class="hero__link" target="_blank" rel="noopener" data-astro-cid-fcrzqevq>View on objkt</a> <a href="/breathe-california.json" class="hero__link" data-astro-cid-fcrzqevq>JSON mirror</a> </div> </div> <figure class="hero__art" data-astro-cid-fcrzqevq> <img${addAttribute(token.image, "src")}${addAttribute(`${token.name} token artwork`, "alt")} loading="eager" decoding="async" data-astro-cid-fcrzqevq> <figcaption class="mono" data-astro-cid-fcrzqevq>BREATHE CALIFORNIA · TEZOS TOKEN ${token.tokenId}</figcaption> </figure> </header> <section class="signals" aria-label="Breathing modes" data-astro-cid-fcrzqevq> <article data-astro-cid-fcrzqevq> <span class="mono" data-astro-cid-fcrzqevq>COAST LIGHT</span> <strong data-astro-cid-fcrzqevq>4-2-6-2</strong> <p data-astro-cid-fcrzqevq>Short reset for stepping out of the feed and back into the body.</p> </article> <article data-astro-cid-fcrzqevq> <span class="mono" data-astro-cid-fcrzqevq>HIGHWAY HUM</span> <strong data-astro-cid-fcrzqevq>5-2-7-2</strong> <p data-astro-cid-fcrzqevq>Longer exhale for clearing motion, noise, and task residue.</p> </article> <article data-astro-cid-fcrzqevq> <span class="mono" data-astro-cid-fcrzqevq>PACIFIC SQUARE</span> <strong data-astro-cid-fcrzqevq>4-4-4-4</strong> <p data-astro-cid-fcrzqevq>Even rhythm for closing the loop before the next block.</p> </article> </section> <div id="session" data-astro-cid-fcrzqevq> ${renderComponent($$result2, "OceanMeditation", $$OceanMeditation, { "artifact": {
    name: token.name,
    image: token.image,
    alt: `${token.name} token artwork`,
    description: token.description,
    url: token.url
  }, "data-astro-cid-fcrzqevq": true })} </div> <section class="notes" aria-label="Field notes" data-astro-cid-fcrzqevq> <div data-astro-cid-fcrzqevq> <p class="kicker" data-astro-cid-fcrzqevq>TOKEN NOTE</p> <h2 data-astro-cid-fcrzqevq>On-chain art as a place to pause.</h2> </div> <p data-astro-cid-fcrzqevq>
The objkt URL is the proof surface; this page is the use surface. The
        token stays collectible on Tezos, while PointCast turns it into a
        repeatable two-minute ritual.
</p> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/breathe-california.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/breathe-california.astro";
const $$url = "/breathe-california";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$BreatheCalifornia,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
