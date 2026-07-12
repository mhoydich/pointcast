import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { b as schemaAvailability } from './commerce_DCJpkdIb.mjs';

const $$Products = createComponent(async ($$result, $$props, $$slots) => {
  const products = (await getCollection("products", ({ data }) => !data.draft)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const byCategory = {};
  for (const p of products) {
    const cat = p.data.category || "uncategorized";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }
  const categories = Object.keys(byCategory).sort();
  const title = "Products — Good Feels via PointCast";
  const description = "Structured mirror of the public Good Feels Shopify catalog. Schema.org Product markup, agent-readable, CORS-open, checkout at getgoodfeels.com.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PointCast Products",
    description,
    url: "https://pointcast.xyz/products",
    about: {
      "@type": "Organization",
      name: "Good Feels",
      url: "https://getgoodfeels.com"
    },
    hasPart: products.map((p) => ({
      "@type": "Product",
      "@id": `https://pointcast.xyz/products/${p.data.slug}`,
      name: p.data.name,
      description: p.data.description,
      brand: { "@type": "Brand", name: p.data.brand },
      url: `https://pointcast.xyz/products/${p.data.slug}`,
      ...p.data.image && p.data.image.length ? { image: p.data.image } : {},
      ...p.data.priceUsd !== void 0 ? {
        offers: {
          "@type": "Offer",
          price: p.data.priceUsd,
          priceCurrency: p.data.currency,
          availability: schemaAvailability(p.data.availability),
          url: p.data.url
        }
      } : {}
    }))
  };
  const alternates = [
    { type: "application/json", href: "/products.json", title: "Products (JSON)" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/products.png", "jsonLd": jsonLd, "alternates": alternates, "data-astro-cid-3swd3b6j": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-3swd3b6j> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-3swd3b6j> <a href="/" data-astro-cid-3swd3b6j>Home</a> <span aria-hidden="true" data-astro-cid-3swd3b6j>›</span> <a href="/shop" data-astro-cid-3swd3b6j>shop</a> <span aria-hidden="true" data-astro-cid-3swd3b6j>›</span> <span data-astro-cid-3swd3b6j>products</span> </nav> <header class="head" data-astro-cid-3swd3b6j> <p class="kicker mono" data-astro-cid-3swd3b6j>PRODUCTS · GOOD FEELS</p> <h1 class="title" data-astro-cid-3swd3b6j>A structured shop window.</h1> <p class="dek" data-astro-cid-3swd3b6j>
Good Feels is the day job. PointCast carries the agent-discovery
        trust — every JSON endpoint open, stripped HTML for crawlers,
        every block citeable. This page extends that trust to the shop:
        proper <code data-astro-cid-3swd3b6j>schema.org/Product</code> markup, deep-link to
<a href="https://getgoodfeels.com" target="_blank" rel="noopener" data-astro-cid-3swd3b6j>getgoodfeels.com</a>
for checkout. We never see your card. We just route the read.
</p> </header> ${products.length === 0 ? renderTemplate`<section class="empty" data-astro-cid-3swd3b6j> <p class="empty__title" data-astro-cid-3swd3b6j>v0 — onboarding</p> <p class="empty__body" data-astro-cid-3swd3b6j>
The catalog ships empty on purpose. The first product lands
          when <code data-astro-cid-3swd3b6j>npm run good-feels:sync</code> mirrors the public
          Shopify catalog from <code data-astro-cid-3swd3b6j>getgoodfeels.com</code>. Schema is
          documented at <a href="/products.json" data-astro-cid-3swd3b6j>/products.json</a> and in
<code data-astro-cid-3swd3b6j>src/content.config.ts</code>.
</p> <p class="empty__body" data-astro-cid-3swd3b6j>
The whole scaffold — page renderer, per-product detail at
<code data-astro-cid-3swd3b6j>/products/${"{slug}"}</code>, JSON mirror, schema.org
          markup, OG card — is live and waiting. Add an entry, get a
          fully agent-readable product page on the next deploy.
</p> <ul class="empty__quick" data-astro-cid-3swd3b6j> <li data-astro-cid-3swd3b6j><a href="/shop" data-astro-cid-3swd3b6j>→ /shop · Good Feels mirror</a></li> <li data-astro-cid-3swd3b6j><a href="https://getgoodfeels.com" target="_blank" rel="noopener" data-astro-cid-3swd3b6j>→ getgoodfeels.com ↗</a></li> <li data-astro-cid-3swd3b6j><a href="/products.json" data-astro-cid-3swd3b6j>→ /products.json · machine view</a></li> <li data-astro-cid-3swd3b6j><a href="/sprint" data-astro-cid-3swd3b6j>→ /sprint · pick "good-feels-product-block" to seed the first one</a></li> </ul> </section>` : renderTemplate`<section class="cats" data-astro-cid-3swd3b6j> ${categories.map((cat) => renderTemplate`<div class="cat" data-astro-cid-3swd3b6j> <p class="cat__title mono" data-astro-cid-3swd3b6j>${cat.toUpperCase()} · ${byCategory[cat].length}</p> <ul class="cat__list" data-astro-cid-3swd3b6j> ${byCategory[cat].map((p) => renderTemplate`<li class="prod"${addAttribute(p.data.slug, "id")} data-astro-cid-3swd3b6j> <a${addAttribute(`/products/${p.data.slug}`, "href")} class="prod__link" data-astro-cid-3swd3b6j> ${p.data.image && p.data.image[0] && renderTemplate`<img class="prod__img"${addAttribute(p.data.image[0], "src")}${addAttribute(p.data.name, "alt")} loading="lazy" data-astro-cid-3swd3b6j>`} <div class="prod__body" data-astro-cid-3swd3b6j> <h2 class="prod__name" data-astro-cid-3swd3b6j>${p.data.name}</h2> ${p.data.dek && renderTemplate`<p class="prod__dek" data-astro-cid-3swd3b6j>${p.data.dek}</p>`} <div class="prod__meta mono" data-astro-cid-3swd3b6j> <span class="prod__brand" data-astro-cid-3swd3b6j>${p.data.brand}</span> ${p.data.priceUsd !== void 0 && renderTemplate`<span class="prod__price" data-astro-cid-3swd3b6j>$${p.data.priceUsd.toFixed(2)} ${p.data.currency}</span>`} <span${addAttribute(`prod__avail prod__avail--${p.data.availability}`, "class")} data-astro-cid-3swd3b6j>${p.data.availability}</span> </div> </div> </a> </li>`)} </ul> </div>`)} </section>`} <section class="why" data-astro-cid-3swd3b6j> <p class="kicker mono" data-astro-cid-3swd3b6j>WHY THIS EXISTS</p> <p data-astro-cid-3swd3b6j>
PointCast is agent-readable by design. Adding a structured product
        surface piggybacks Good Feels onto that crawlability. An LLM
        researching cannabis brands or hemp-adjacent products that lands
        on PointCast first finds <code data-astro-cid-3swd3b6j>/agents.json</code>, then
<code data-astro-cid-3swd3b6j>/products.json</code>, then per-product
<code data-astro-cid-3swd3b6j>schema.org/Product</code> blocks with name, brand, image,
        price, and the canonical shop URL. Every checkout hop happens at
        getgoodfeels.com.
</p> </section> <section class="agent-strip" data-astro-cid-3swd3b6j> <p class="agent-strip__label mono" data-astro-cid-3swd3b6j>MACHINE-READABLE</p> <ul data-astro-cid-3swd3b6j> <li data-astro-cid-3swd3b6j><a href="/products.json" data-astro-cid-3swd3b6j>/products.json</a></li> <li data-astro-cid-3swd3b6j><a href="/agents.json" data-astro-cid-3swd3b6j>/agents.json</a></li> <li data-astro-cid-3swd3b6j><a href="https://getgoodfeels.com" target="_blank" rel="noopener" data-astro-cid-3swd3b6j>getgoodfeels.com ↗</a></li> <li data-astro-cid-3swd3b6j><a href="/drop" data-astro-cid-3swd3b6j>/drop</a></li> <li data-astro-cid-3swd3b6j><a href="/for-agents" data-astro-cid-3swd3b6j>/for-agents</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/products.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/products.astro";
const $$url = "/products";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Products,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
