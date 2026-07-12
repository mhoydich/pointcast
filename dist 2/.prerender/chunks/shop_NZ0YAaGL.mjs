import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { s as sourceKind, c as checkoutHost, C as CHECKOUT_POLICY, a as sourceLabel } from './commerce_DCJpkdIb.mjs';

const $$Shop = createComponent(async ($$result, $$props, $$slots) => {
  const products = (await getCollection("products", ({ data }) => !data.draft)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const categories = Array.from(new Set(products.map((p) => p.data.category || "catalog"))).sort();
  const moodSlugs = Array.from(new Set(products.flatMap((p) => p.data.pairsWithMood ?? []))).sort();
  const goodFeelsProducts = products.filter((p) => sourceKind(p.data) === "good-feels");
  const pointcastMerchProducts = products.filter((p) => sourceKind(p.data) === "pointcast-merch");
  const seltzerCount = products.filter((p) => /seltzer|drink|mix seltzer/i.test(p.data.category || p.data.name)).length;
  const gummyCount = products.filter((p) => /gumm/i.test(p.data.category || p.data.name)).length;
  const enhancerCount = products.filter((p) => /enhancer/i.test(p.data.category || p.data.name)).length;
  const hosts = Array.from(new Set(products.map((p) => checkoutHost(p.data.url)))).sort();
  const title = "PointCast Commerce";
  const description = "Unified commerce hub for Good Feels product discovery, PointCast merch lanes, pairings, and agent-readable catalog routes. Checkout stays outbound at canonical shop surfaces.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://pointcast.xyz/shop",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://pointcast.xyz/products/${product.data.slug}`,
        item: {
          "@type": "Product",
          name: product.data.name,
          description: product.data.description,
          brand: { "@type": "Brand", name: product.data.brand },
          url: product.data.url,
          ...product.data.image?.length ? { image: product.data.image } : {}
        }
      }))
    }
  };
  const alternates = [
    { type: "application/json", href: "/shop.json", title: "Shop (JSON)" },
    { type: "application/json", href: "/products.json", title: "Products (JSON)" },
    { type: "application/x-ndjson", href: "/api/products.jsonl", title: "Products (JSONL)" }
  ];
  function price(product) {
    if (product.data.priceUsd === void 0) return "see shop";
    return `$${product.data.priceUsd.toFixed(2)} ${product.data.currency}`;
  }
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/products.png", "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-5w43p2qc": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="shop" data-astro-cid-5w43p2qc> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-5w43p2qc> <a href="/" data-astro-cid-5w43p2qc>Home</a> <span aria-hidden="true" data-astro-cid-5w43p2qc>/</span> <span data-astro-cid-5w43p2qc>shop</span> </nav> <header class="hero" data-astro-cid-5w43p2qc> <div class="hero__copy" data-astro-cid-5w43p2qc> <p class="kicker mono" data-astro-cid-5w43p2qc>COMMERCE HUB · OUTBOUND CHECKOUT</p> <h1 class="title" data-astro-cid-5w43p2qc>PointCast Commerce</h1> <p class="dek" data-astro-cid-5w43p2qc>
Good Feels products, PointCast merch lanes, mood pairings, and
          machine-readable feeds in one place. PointCast routes the read;
          canonical shops handle carts, payment, shipping, and fulfillment.
</p> <div class="endpoint-row mono" aria-label="Machine-readable commerce endpoints" data-astro-cid-5w43p2qc> <a href="/shop.json" data-astro-cid-5w43p2qc>/shop.json</a> <a href="/products.json" data-astro-cid-5w43p2qc>/products.json</a> <a href="/api/products.jsonl" data-astro-cid-5w43p2qc>/api/products.jsonl</a> </div> </div> <aside class="policy" aria-label="Checkout policy" data-astro-cid-5w43p2qc> <p class="policy__label mono" data-astro-cid-5w43p2qc>CHECKOUT POLICY</p> <p class="policy__mode mono" data-astro-cid-5w43p2qc>${CHECKOUT_POLICY.mode}</p> <p data-astro-cid-5w43p2qc>${CHECKOUT_POLICY.summary}</p> </aside> </header> <dl class="stats" aria-label="Commerce summary" data-astro-cid-5w43p2qc> <div data-astro-cid-5w43p2qc> <dt class="mono" data-astro-cid-5w43p2qc>PUBLIC PRODUCTS</dt> <dd data-astro-cid-5w43p2qc>${products.length}</dd> </div> <div data-astro-cid-5w43p2qc> <dt class="mono" data-astro-cid-5w43p2qc>GOOD FEELS LIVE</dt> <dd data-astro-cid-5w43p2qc>${goodFeelsProducts.length}</dd> </div> <div data-astro-cid-5w43p2qc> <dt class="mono" data-astro-cid-5w43p2qc>MOOD PAIRINGS</dt> <dd data-astro-cid-5w43p2qc>${moodSlugs.length}</dd> </div> <div data-astro-cid-5w43p2qc> <dt class="mono" data-astro-cid-5w43p2qc>CHECKOUT HOST</dt> <dd data-astro-cid-5w43p2qc>${hosts.length === 1 ? hosts[0] : "external"}</dd> </div> </dl> <section class="lanes" aria-label="Shop lanes" data-astro-cid-5w43p2qc> <a class="lane lane--good-feels" href="#catalog" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>LIVE MIRROR</span> <span class="lane__title" data-astro-cid-5w43p2qc>Good Feels</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>${goodFeelsProducts.length} entries</span> </a> <a class="lane lane--seltzers" href="#catalog" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>CATEGORY</span> <span class="lane__title" data-astro-cid-5w43p2qc>Seltzers</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>${seltzerCount} entries</span> </a> <a class="lane lane--gummies" href="#catalog" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>CATEGORY</span> <span class="lane__title" data-astro-cid-5w43p2qc>Gummies</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>${gummyCount} entries</span> </a> <a class="lane lane--enhancers" href="#catalog" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>CATEGORY</span> <span class="lane__title" data-astro-cid-5w43p2qc>Enhancers</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>${enhancerCount} entries</span> </a> <a class="lane lane--merch" href="#pointcast-merch" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>COMING SOON</span> <span class="lane__title" data-astro-cid-5w43p2qc>PointCast Merch</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>${pointcastMerchProducts.length} public entries</span> </a> <a class="lane lane--pairings" href="/pairings" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>CROSS-INDEX</span> <span class="lane__title" data-astro-cid-5w43p2qc>Pairings</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>${moodSlugs.length} moods</span> </a> <a class="lane lane--json" href="/shop.json" data-astro-cid-5w43p2qc> <span class="lane__kicker mono" data-astro-cid-5w43p2qc>MACHINE VIEW</span> <span class="lane__title" data-astro-cid-5w43p2qc>JSON / API</span> <span class="lane__meta mono" data-astro-cid-5w43p2qc>agent route</span> </a> </section> <section id="catalog" class="products" aria-labelledby="products-title" data-astro-cid-5w43p2qc> <div class="section-head" data-astro-cid-5w43p2qc> <div data-astro-cid-5w43p2qc> <p class="kicker mono" data-astro-cid-5w43p2qc>CATALOG · ${categories.length} CATEGORIES</p> <h2 id="products-title" data-astro-cid-5w43p2qc>Public commerce catalog</h2> </div> <a class="section-link mono" href="/products" data-astro-cid-5w43p2qc>Open /products</a> </div> ${products.length === 0 ? renderTemplate`<div class="empty" data-astro-cid-5w43p2qc> <p class="empty__title mono" data-astro-cid-5w43p2qc>NO PRODUCTS SYNCED YET</p> <p data-astro-cid-5w43p2qc>
Run <code data-astro-cid-5w43p2qc>npm run good-feels:sync</code> to mirror the public
            Good Feels Shopify catalog into this storefront.
</p> </div>` : renderTemplate`<ul class="grid" role="list" data-astro-cid-5w43p2qc> ${products.map((product) => {
    const kind = sourceKind(product.data);
    const host = checkoutHost(product.data.url);
    const moods = product.data.pairsWithMood ?? [];
    return renderTemplate`<li class="card" data-astro-cid-5w43p2qc> <a class="card__media"${addAttribute(`/products/${product.data.slug}`, "href")}${addAttribute(`Open ${product.data.name}`, "aria-label")} data-astro-cid-5w43p2qc> ${product.data.image?.[0] ? renderTemplate`<img${addAttribute(product.data.image[0], "src")}${addAttribute(product.data.name, "alt")} loading="lazy" data-astro-cid-5w43p2qc>` : renderTemplate`<span class="card__fallback mono" data-astro-cid-5w43p2qc>${sourceLabel(kind)}</span>`} </a> <div class="card__body" data-astro-cid-5w43p2qc> <div class="card__topline mono" data-astro-cid-5w43p2qc> <span${addAttribute(`source source--${kind}`, "class")} data-astro-cid-5w43p2qc>${sourceLabel(kind)}</span> <span data-astro-cid-5w43p2qc>${product.data.category || "product"}</span> <span${addAttribute(`availability availability--${product.data.availability}`, "class")} data-astro-cid-5w43p2qc>${product.data.availability}</span> </div> <h3 data-astro-cid-5w43p2qc><a${addAttribute(`/products/${product.data.slug}`, "href")} data-astro-cid-5w43p2qc>${product.data.name}</a></h3> ${product.data.dek && renderTemplate`<p class="card__dek" data-astro-cid-5w43p2qc>${product.data.dek}</p>`} <p class="card__price mono" data-astro-cid-5w43p2qc>${price(product)}</p> ${moods.length > 0 && renderTemplate`<ul class="moods"${addAttribute(`${product.data.name} pairings`, "aria-label")} data-astro-cid-5w43p2qc> ${moods.map((mood) => renderTemplate`<li data-astro-cid-5w43p2qc><a class="mood mono"${addAttribute(`/pairings/${mood}`, "href")} data-astro-cid-5w43p2qc>${mood}</a></li>`)} </ul>`} <div class="card__actions" data-astro-cid-5w43p2qc> <a class="btn btn--primary mono"${addAttribute(product.data.url, "href")} target="_blank" rel="noopener" data-astro-cid-5w43p2qc>Buy at ${host}</a> <a class="btn mono"${addAttribute(`/products/${product.data.slug}`, "href")} data-astro-cid-5w43p2qc>Details</a> </div> </div> </li>`;
  })} </ul>`} </section> <section id="pointcast-merch" class="coming" aria-labelledby="merch-title" data-astro-cid-5w43p2qc> <div data-astro-cid-5w43p2qc> <p class="kicker mono" data-astro-cid-5w43p2qc>POINTCAST MERCH · STAGED</p> <h2 id="merch-title" data-astro-cid-5w43p2qc>Postcards, prints, mugs, and field goods stay hidden until active.</h2> <p data-astro-cid-5w43p2qc>
The Shopify bridge can sync PointCast products, but draft or
          out-of-stock listings do not appear in the public catalog. When a
          listing is ready, it joins the same cards, JSON feeds, and outbound
          checkout policy.
</p> </div> <a class="btn mono" href="/postcards" data-astro-cid-5w43p2qc>Preview postcards</a> </section> ${moodSlugs.length > 0 && renderTemplate`<section class="pairing-strip" aria-labelledby="pairings-title" data-astro-cid-5w43p2qc> <div class="section-head" data-astro-cid-5w43p2qc> <div data-astro-cid-5w43p2qc> <p class="kicker mono" data-astro-cid-5w43p2qc>PAIRINGS</p> <h2 id="pairings-title" data-astro-cid-5w43p2qc>Commerce by mood</h2> </div> <a class="section-link mono" href="/pairings" data-astro-cid-5w43p2qc>Open /pairings</a> </div> <ul class="pairing-list" role="list" data-astro-cid-5w43p2qc> ${moodSlugs.map((mood) => renderTemplate`<li data-astro-cid-5w43p2qc><a class="pairing-chip mono"${addAttribute(`/pairings/${mood}`, "href")} data-astro-cid-5w43p2qc>${mood}</a></li>`)} </ul> </section>`} <section class="agent-strip" data-astro-cid-5w43p2qc> <p class="agent-strip__label mono" data-astro-cid-5w43p2qc>MACHINE-READABLE</p> <ul data-astro-cid-5w43p2qc> <li data-astro-cid-5w43p2qc><a href="/shop.json" data-astro-cid-5w43p2qc>/shop.json</a></li> <li data-astro-cid-5w43p2qc><a href="/products.json" data-astro-cid-5w43p2qc>/products.json</a></li> <li data-astro-cid-5w43p2qc><a href="/api/products.jsonl" data-astro-cid-5w43p2qc>/api/products.jsonl</a></li> <li data-astro-cid-5w43p2qc><a href="/pairings" data-astro-cid-5w43p2qc>/pairings</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/shop.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/shop.astro";
const $$url = "/shop";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Shop,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
