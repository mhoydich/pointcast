import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$OceanMeditation } from './OceanMeditation_Dm2KHoFu.mjs';

const $$NewOcean = createComponent(($$result, $$props, $$slots) => {
  const token = {
    name: "Piet Mondrian",
    roomName: "New Ocean",
    contract: "KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP",
    tokenId: "5",
    image: "/images/tokens/5.png",
    url: "https://objkt.com/tokens/KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP/5",
    description: "Clipper Ship Ocean El Segundo, turned into a PointCast breathing room."
  };
  const title = "New Ocean";
  const description = "A new PointCast ocean room anchored to Mike Hoydich's Piet Mondrian token on Tezos.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/new-ocean",
    name: "PointCast New Ocean",
    description,
    url: "https://pointcast.xyz/new-ocean",
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
      "Tezos token-backed ocean room",
      "2, 5, and 10 minute breathing sessions",
      "Harbor Line, Blue Grid, and Night Crossing programs",
      "Full-screen focus mode",
      "Local tide log stored in the browser",
      "Optional generated ocean tone"
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/meditate.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/new-ocean.json", title: "New Ocean room (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/meditate.png",
    buttons: [
      { label: "Open New Ocean", action: "link", target: "https://pointcast.xyz/new-ocean" },
      { label: "View on objkt", action: "link", target: token.url }
    ]
  }, "data-astro-cid-chhisbh7": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-chhisbh7> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-chhisbh7> <a href="/" data-astro-cid-chhisbh7>Home</a> <span aria-hidden="true" data-astro-cid-chhisbh7>/</span> <span data-astro-cid-chhisbh7>new-ocean</span> </nav> <header class="hero" data-astro-cid-chhisbh7> <div class="hero__copy" data-astro-cid-chhisbh7> <p class="kicker" data-astro-cid-chhisbh7>NEW OCEAN · TEZOS ROOM</p> <h1 data-astro-cid-chhisbh7>A clean blue room for getting back to zero.</h1> <p class="dek" data-astro-cid-chhisbh7>
A ship, a grid, a horizon. This ocean keeps the current page's
          breath timer, but gives it a sharper visual anchor from Mike's
          Tezos collection.
</p> <div class="hero__actions" data-astro-cid-chhisbh7> <a href="#session" class="hero__cta" data-astro-cid-chhisbh7>Start session</a> <a${addAttribute(token.url, "href")} class="hero__link" target="_blank" rel="noopener" data-astro-cid-chhisbh7>View on objkt</a> <a href="/new-ocean.json" class="hero__link" data-astro-cid-chhisbh7>JSON mirror</a> </div> </div> <figure class="hero__art" data-astro-cid-chhisbh7> <img${addAttribute(token.image, "src")}${addAttribute(`${token.name} token artwork`, "alt")} loading="eager" decoding="async" data-astro-cid-chhisbh7> <figcaption class="mono" data-astro-cid-chhisbh7>NEW OCEAN · TEZOS TOKEN ${token.tokenId}</figcaption> </figure> </header> <section class="signals" aria-label="Ocean programs" data-astro-cid-chhisbh7> <article data-astro-cid-chhisbh7> <span class="mono" data-astro-cid-chhisbh7>HARBOR LINE</span> <strong data-astro-cid-chhisbh7>4-2-6-2</strong> <p data-astro-cid-chhisbh7>Fast return to center when the day gets jagged.</p> </article> <article data-astro-cid-chhisbh7> <span class="mono" data-astro-cid-chhisbh7>BLUE GRID</span> <strong data-astro-cid-chhisbh7>5-2-7-2</strong> <p data-astro-cid-chhisbh7>Longer exhale for quieting the screen and widening the frame.</p> </article> <article data-astro-cid-chhisbh7> <span class="mono" data-astro-cid-chhisbh7>NIGHT CROSSING</span> <strong data-astro-cid-chhisbh7>4-4-4-4</strong> <p data-astro-cid-chhisbh7>Even cadence for closing a loop without carrying it forward.</p> </article> </section> <div id="session" data-astro-cid-chhisbh7> ${renderComponent($$result2, "OceanMeditation", $$OceanMeditation, { "artifact": {
    name: token.roomName,
    image: token.image,
    alt: `${token.name} token artwork`,
    description: token.description,
    url: token.url
  }, "data-astro-cid-chhisbh7": true })} </div> <section class="notes" aria-label="Field notes" data-astro-cid-chhisbh7> <div data-astro-cid-chhisbh7> <p class="kicker" data-astro-cid-chhisbh7>OCEAN NOTE</p> <h2 data-astro-cid-chhisbh7>The collectible becomes a room.</h2> </div> <p data-astro-cid-chhisbh7>
The token remains a Tezos artifact on objkt. PointCast gives it a
        second life as a small, usable surface: breathe, reset, leave.
</p> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/new-ocean.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/new-ocean.astro";
const $$url = "/new-ocean";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NewOcean,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
