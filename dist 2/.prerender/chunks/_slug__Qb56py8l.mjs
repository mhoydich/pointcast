import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { c as checkoutHost, s as sourceKind, b as schemaAvailability, a as sourceLabel } from './commerce_DCJpkdIb.mjs';

async function getStaticPaths() {
  const products = await getCollection("products", ({ data }) => !data.draft);
  return products.map((p) => ({ params: { slug: p.data.slug }, props: { product: p } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { product } = Astro2.props;
  const d = product.data;
  const title = `${d.name} — ${d.brand}`;
  const description = d.dek || d.description.slice(0, 200);
  const ogImage = d.image && d.image[0] || `/images/og/products.png`;
  const sourceUrl = new URL(d.url);
  const sourceOrigin = sourceUrl.origin;
  const sourceHost = checkoutHost(d.url);
  const source = sourceKind(d);
  const sourceName = sourceLabel(source);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://pointcast.xyz/products/${d.slug}`,
    name: d.name,
    description: d.description,
    brand: { "@type": "Brand", name: d.brand },
    url: `https://pointcast.xyz/products/${d.slug}`,
    ...d.image && d.image.length ? { image: d.image } : {},
    ...d.category ? { category: d.category } : {},
    ...d.priceUsd !== void 0 ? {
      offers: {
        "@type": "Offer",
        price: d.priceUsd,
        priceCurrency: d.currency,
        availability: schemaAvailability(d.availability),
        url: d.url,
        seller: { "@type": "Organization", name: d.brand, url: sourceOrigin }
      }
    } : {},
    ...d.ingredients && d.ingredients.length ? { material: d.ingredients.join(", ") } : {}
  };
  const alternates = [
    { type: "text/html", href: "/products", title: "All products" },
    { type: "application/json", href: "/products.json", title: "Products (JSON)" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": ogImage, "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-o422f4lv": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-o422f4lv> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-o422f4lv> <a href="/" data-astro-cid-o422f4lv>Home</a> <span aria-hidden="true" data-astro-cid-o422f4lv>›</span> <a href="/shop" data-astro-cid-o422f4lv>shop</a> <span aria-hidden="true" data-astro-cid-o422f4lv>›</span> <a href="/products" data-astro-cid-o422f4lv>products</a> <span aria-hidden="true" data-astro-cid-o422f4lv>›</span> <span data-astro-cid-o422f4lv>${d.slug}</span> </nav> <article class="prod" data-astro-cid-o422f4lv> <header class="prod__head" data-astro-cid-o422f4lv> <p class="kicker mono" data-astro-cid-o422f4lv>${sourceName.toUpperCase()} · ${d.category ? d.category.toUpperCase() : "PRODUCT"}</p> <h1 class="title" data-astro-cid-o422f4lv>${d.name}</h1> ${d.dek && renderTemplate`<p class="dek" data-astro-cid-o422f4lv>${d.dek}</p>`} </header> ${d.image && d.image.length > 0 && renderTemplate`<div class="gallery" data-astro-cid-o422f4lv> ${d.image.map((src, i) => renderTemplate`<img class="gallery__img"${addAttribute(src, "src")}${addAttribute(`${d.name} — image ${i + 1}`, "alt")}${addAttribute(i === 0 ? "eager" : "lazy", "loading")} data-astro-cid-o422f4lv>`)} </div>`} <section class="body" data-astro-cid-o422f4lv> <p data-astro-cid-o422f4lv>${d.description}</p> </section> <aside class="facts" data-astro-cid-o422f4lv> <dl data-astro-cid-o422f4lv> <div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>PRICE</dt><dd data-astro-cid-o422f4lv>${d.priceUsd !== void 0 ? `$${d.priceUsd.toFixed(2)} ${d.currency}` : "see shop"}</dd></div> <div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>AVAILABILITY</dt><dd${addAttribute(`avail avail--${d.availability}`, "class")} data-astro-cid-o422f4lv>${d.availability}</dd></div> ${d.category && renderTemplate`<div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>CATEGORY</dt><dd data-astro-cid-o422f4lv>${d.category}</dd></div>`} <div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>SOURCE</dt><dd data-astro-cid-o422f4lv>${sourceName}</dd></div> <div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>CHECKOUT</dt><dd data-astro-cid-o422f4lv>${sourceHost}</dd></div> ${d.effects && d.effects.length > 0 && renderTemplate`<div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>EFFECTS</dt><dd data-astro-cid-o422f4lv>${d.effects.join(" · ")}</dd></div>`} ${d.ingredients && d.ingredients.length > 0 && renderTemplate`<div data-astro-cid-o422f4lv><dt class="mono" data-astro-cid-o422f4lv>INGREDIENTS</dt><dd data-astro-cid-o422f4lv>${d.ingredients.join(", ")}</dd></div>`} </dl> </aside> ${d.pairsWithMood && d.pairsWithMood.length > 0 && renderTemplate`<section class="pairings" aria-labelledby="pairings-title" data-astro-cid-o422f4lv> <p id="pairings-title" class="pairings__label mono" data-astro-cid-o422f4lv>PAIRINGS</p> <ul data-astro-cid-o422f4lv> ${d.pairsWithMood.map((mood) => renderTemplate`<li data-astro-cid-o422f4lv><a class="mood mono"${addAttribute(`/pairings/${mood}`, "href")} data-astro-cid-o422f4lv>${mood}</a></li>`)} </ul> </section>`} <a class="cta"${addAttribute(d.url, "href")} target="_blank" rel="noopener" data-astro-cid-o422f4lv>→ Buy on ${sourceHost}</a> <p class="disclaimer mono" data-astro-cid-o422f4lv>
POINTCAST DOES NOT SELL, FULFILL, PROCESS PAYMENT, OR COLLECT CARD/PII · CHECKOUT HAPPENS AT ${sourceHost.toUpperCase()} </p> </article> <section class="agent-strip" data-astro-cid-o422f4lv> <p class="agent-strip__label mono" data-astro-cid-o422f4lv>MACHINE-READABLE</p> <ul data-astro-cid-o422f4lv> <li data-astro-cid-o422f4lv><a href="/products.json" data-astro-cid-o422f4lv>/products.json</a></li> <li data-astro-cid-o422f4lv><a href="/products" data-astro-cid-o422f4lv>/products</a></li> <li data-astro-cid-o422f4lv><a href="/agents.json" data-astro-cid-o422f4lv>/agents.json</a></li> <li data-astro-cid-o422f4lv><a href="/for-agents" data-astro-cid-o422f4lv>/for-agents</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/products/[slug].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/products/[slug].astro";
const $$url = "/products/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
