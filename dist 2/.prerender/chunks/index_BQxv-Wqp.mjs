import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const DROPS = [
    {
      id: "001",
      title: "Four Fields",
      date: "2026-04-24",
      status: "staged",
      kicker: "DROP 001",
      dek: "Four editorial pieces staged for Tezos mint via Visit Nouns FA2. El Segundo print · Jacaranda post · Sparrow in the margin · Garden of the future.",
      href: "/drops/001"
    }
  ];
  const title = "Drops — PointCast editorial editions";
  const description = "Curated drops of editorial editions on Tezos. Each drop is a small named set; mints go to the Visit Nouns FA2.";
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "data-astro-cid-f5agcxw3": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="drops" data-astro-cid-f5agcxw3> <nav class="drops__crumb" aria-label="Breadcrumb" data-astro-cid-f5agcxw3> <a href="/" data-astro-cid-f5agcxw3>Home</a> <span aria-hidden="true" data-astro-cid-f5agcxw3>›</span> <span data-astro-cid-f5agcxw3>drops</span> </nav> <header class="drops__hero" data-astro-cid-f5agcxw3> <p class="drops__kicker mono" data-astro-cid-f5agcxw3>DROPS · POINTCAST EDITORIAL EDITIONS</p> <h1 class="drops__title" data-astro-cid-f5agcxw3>Named sets. Free mints. Small editions.</h1> <p class="drops__dek" data-astro-cid-f5agcxw3>
Drops are curated editorial packs — a named set of pieces that
        ship together, mint to the Visit Nouns FA2, and stay listed on
<a href="/editions" data-astro-cid-f5agcxw3>/editions</a> once live.
</p> </header> <section class="drops__list" data-astro-cid-f5agcxw3> ${DROPS.map((d) => renderTemplate`<a${addAttribute(`drop-card drop-card--${d.status}`, "class")}${addAttribute(d.href, "href")} data-astro-cid-f5agcxw3> <p class="drop-card__kicker mono" data-astro-cid-f5agcxw3>${d.kicker} · ${d.date} · ${d.status.toUpperCase()}</p> <h2 class="drop-card__title" data-astro-cid-f5agcxw3>${d.title}</h2> <p class="drop-card__dek" data-astro-cid-f5agcxw3>${d.dek}</p> <p class="drop-card__cta mono" data-astro-cid-f5agcxw3>open →</p> </a>`)} </section> <footer class="drops__foot mono" data-astro-cid-f5agcxw3> <span data-astro-cid-f5agcxw3>DROPS INDEX · EL SEGUNDO</span> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drops/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drops/index.astro";
const $$url = "/drops";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
