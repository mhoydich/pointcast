import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { f as fetchFroggosData, F as FROGGOS_COLLECTION_URL } from './froggos_B8_CNvh8.mjs';

const $$Froggos = createComponent(async ($$result, $$props, $$slots) => {
  const data = await fetchFroggosData();
  const { collection, listedTokens, sampleTokens } = data;
  const heroToken = listedTokens[0] ?? sampleTokens[0] ?? null;
  function price(value) {
    return typeof value === "number" ? `${value.toFixed(value >= 10 ? 0 : 2)} XTZ` : "objkt";
  }
  function numberish(value) {
    return typeof value === "number" ? value.toLocaleString("en-US") : "live";
  }
  function shortAddr(value) {
    if (!value) return "seller";
    return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
  }
  const title = "Froggos";
  const description = `${collection.name} hosted on PointCast with live objkt market links. Sales settle on objkt; this page is the clean front door.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/froggos",
    name: "PointCast Froggos",
    description,
    url: "https://pointcast.xyz/froggos",
    image: heroToken?.image ?? collection.logo,
    about: {
      "@type": "CreativeWorkSeries",
      name: collection.name,
      description: collection.description,
      url: collection.objktUrl,
      identifier: collection.contract
    },
    offers: listedTokens.slice(0, 8).map((token) => ({
      "@type": "Offer",
      name: token.name,
      price: token.listing?.priceXtz ?? token.lowestAskXtz ?? void 0,
      priceCurrency: "XTZ",
      url: token.objktUrl,
      availability: "https://schema.org/InStock"
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": heroToken?.image ?? collection.logo, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/froggos.json", title: "Froggos market data (JSON)" }
  ], "frame": {
    image: heroToken?.image ?? collection.logo,
    aspectRatio: "1:1",
    buttons: [
      { label: "Open Froggos", action: "link", target: "https://pointcast.xyz/froggos" },
      { label: "Buy on objkt", action: "link", target: FROGGOS_COLLECTION_URL }
    ]
  }, "data-astro-cid-aem475p6": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-aem475p6> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-aem475p6> <a href="/" data-astro-cid-aem475p6>Home</a> <span aria-hidden="true" data-astro-cid-aem475p6>/</span> <span data-astro-cid-aem475p6>froggos</span> </nav> <header class="hero" data-astro-cid-aem475p6> <div class="hero__copy" data-astro-cid-aem475p6> <p class="kicker" data-astro-cid-aem475p6>FROGGOS · TEZOS MARKET</p> <h1 data-astro-cid-aem475p6>A clean little storefront for the pond.</h1> <p class="dek" data-astro-cid-aem475p6>
PointCast can host the front door: collection story, live market
          stats, active listings, JSON for agents, and direct routes to objkt.
          The sale still settles on Tezos through objkt, where wallet signing,
          royalties, and marketplace inventory already live.
</p> <div class="hero__actions" data-astro-cid-aem475p6> <a class="btn btn--primary"${addAttribute(FROGGOS_COLLECTION_URL, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6>Buy on objkt</a> <a class="btn" href="/froggos.json" data-astro-cid-aem475p6>JSON mirror</a> ${collection.website && renderTemplate`<a class="btn"${addAttribute(collection.website, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6>Project site</a>`} </div> </div> <figure class="hero__art" data-astro-cid-aem475p6> <img${addAttribute(heroToken?.image ?? collection.logo, "src")}${addAttribute(heroToken?.name ?? `${collection.name} collection logo`, "alt")} loading="eager"${addAttribute(heroToken?.ipfsFallback ?? collection.logo, "data-fallback")} onerror="if(this.dataset.fallback && this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}" data-astro-cid-aem475p6> <figcaption class="mono" data-astro-cid-aem475p6>${heroToken?.name ?? collection.name} · ${price(collection.floorXtz)} floor</figcaption> </figure> </header> ${data.error && renderTemplate`<section class="notice" aria-label="Data notice" data-astro-cid-aem475p6>
objkt data fallback active: ${data.error} </section>`} <section class="stats" aria-label="Collection stats" data-astro-cid-aem475p6> <article data-astro-cid-aem475p6> <span class="mono" data-astro-cid-aem475p6>CONTRACT</span> <strong data-astro-cid-aem475p6>${collection.contract.slice(0, 8)}...${collection.contract.slice(-5)}</strong> </article> <article data-astro-cid-aem475p6> <span class="mono" data-astro-cid-aem475p6>FLOOR</span> <strong data-astro-cid-aem475p6>${price(collection.floorXtz)}</strong> </article> <article data-astro-cid-aem475p6> <span class="mono" data-astro-cid-aem475p6>ITEMS</span> <strong data-astro-cid-aem475p6>${numberish(collection.items)}</strong> </article> <article data-astro-cid-aem475p6> <span class="mono" data-astro-cid-aem475p6>OWNERS</span> <strong data-astro-cid-aem475p6>${numberish(collection.owners)}</strong> </article> </section> <section class="host-sell" aria-label="Host and sell plan" data-astro-cid-aem475p6> <div class="section-head" data-astro-cid-aem475p6> <p class="kicker" data-astro-cid-aem475p6>HOW THIS WORKS</p> <h2 data-astro-cid-aem475p6>Host here. Sell there. Upgrade later.</h2> </div> <div class="steps" data-astro-cid-aem475p6> <article data-astro-cid-aem475p6> <span class="step-num mono" data-astro-cid-aem475p6>01</span> <h3 data-astro-cid-aem475p6>Host the page</h3> <p data-astro-cid-aem475p6>
PointCast owns the narrative surface at <code data-astro-cid-aem475p6>/froggos</code>:
            fast HTML, OG tags, schema.org offers, and a CORS-open JSON mirror.
</p> </article> <article data-astro-cid-aem475p6> <span class="step-num mono" data-astro-cid-aem475p6>02</span> <h3 data-astro-cid-aem475p6>Sell through objkt</h3> <p data-astro-cid-aem475p6>
Buyers click into objkt token pages. Sellers list from objkt with
            their wallet, so PointCast never touches custody, cards, or payout data.
</p> </article> <article data-astro-cid-aem475p6> <span class="step-num mono" data-astro-cid-aem475p6>03</span> <h3 data-astro-cid-aem475p6>Bring collect on-site</h3> <p data-astro-cid-aem475p6>
When ready, reuse the existing PointCast Tezos collector flow:
            active listing ask id, marketplace contract, Beacon wallet, then
            an objkt <code data-astro-cid-aem475p6>fulfill_ask</code> transaction.
</p> </article> </div> </section> <section class="market" aria-label="Active listings" data-astro-cid-aem475p6> <div class="section-head section-head--split" data-astro-cid-aem475p6> <div data-astro-cid-aem475p6> <p class="kicker" data-astro-cid-aem475p6>ACTIVE LISTINGS</p> <h2 data-astro-cid-aem475p6>For sale now.</h2> </div> <a${addAttribute(FROGGOS_COLLECTION_URL, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6>View all on objkt</a> </div> ${listedTokens.length > 0 ? renderTemplate`<div class="listing-grid" data-astro-cid-aem475p6> ${listedTokens.slice(0, 8).map((token) => renderTemplate`<article class="token-card" data-astro-cid-aem475p6> <a class="token-card__image"${addAttribute(token.objktUrl, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6> <img${addAttribute(token.image, "src")}${addAttribute(token.name, "alt")} loading="lazy"${addAttribute(token.ipfsFallback ?? "", "data-fallback")} onerror="if(this.dataset.fallback && this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.parentElement.style.display='none';}" data-astro-cid-aem475p6> </a> <div class="token-card__body" data-astro-cid-aem475p6> <h3 data-astro-cid-aem475p6>${token.name}</h3> <p class="token-card__price" data-astro-cid-aem475p6>${price(token.listing?.priceXtz ?? token.lowestAskXtz)}</p> <p class="token-card__seller mono" data-astro-cid-aem475p6>${shortAddr(token.listing?.seller)}</p> <a${addAttribute(token.objktUrl, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6>Buy on objkt</a> </div> </article>`)} </div>` : renderTemplate`<p class="empty" data-astro-cid-aem475p6>No active listings came back from objkt at build time. Use the collection link for live inventory.</p>`} </section> <section class="machine" aria-label="Machine-readable links" data-astro-cid-aem475p6> <p class="machine__label mono" data-astro-cid-aem475p6>MACHINE READABLE</p> <ul data-astro-cid-aem475p6> <li data-astro-cid-aem475p6><a href="/froggos.json" data-astro-cid-aem475p6>/froggos.json</a></li> <li data-astro-cid-aem475p6><a${addAttribute(FROGGOS_COLLECTION_URL, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6>objkt collection</a></li> <li data-astro-cid-aem475p6><a${addAttribute(`https://tzkt.io/${collection.contract}/tokens`, "href")} target="_blank" rel="noopener" data-astro-cid-aem475p6>TzKT tokens</a></li> <li data-astro-cid-aem475p6><a href="/collection" data-astro-cid-aem475p6>PointCast collection</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/froggos.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/froggos.astro";
const $$url = "/froggos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Froggos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
