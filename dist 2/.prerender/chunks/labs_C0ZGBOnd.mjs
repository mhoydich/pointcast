import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { S as SERIES, a as SERIES_META } from './labsSeries_8nt0605C.mjs';

const $$Labs = createComponent(($$result, $$props, $$slots) => {
  const title = `${SERIES_META.title} — UES Working Papers series`;
  const description = SERIES_META.description;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/labs",
    name: SERIES_META.title,
    description,
    url: "https://pointcast.xyz/labs",
    isPartOf: { "@type": "Periodical", name: SERIES_META.publication },
    numberOfItems: SERIES.length
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/labs.json", title: "Labs series (JSON)" }], "data-astro-cid-ovtjjxhf": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="paper" data-astro-cid-ovtjjxhf> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ovtjjxhf> <a href="/" data-astro-cid-ovtjjxhf>Home</a><span aria-hidden="true" data-astro-cid-ovtjjxhf>/</span> <a href="/university-of-el-segundo" data-astro-cid-ovtjjxhf>university-of-el-segundo</a><span aria-hidden="true" data-astro-cid-ovtjjxhf>/</span> <span data-astro-cid-ovtjjxhf>labs</span> </nav> <header class="masthead" data-astro-cid-ovtjjxhf> <div class="masthead__rule" data-astro-cid-ovtjjxhf></div> <p class="masthead__pub" data-astro-cid-ovtjjxhf>${SERIES_META.publication} · Series</p> <p class="masthead__no" data-astro-cid-ovtjjxhf>UES-WP-2026-06 through 2026-10</p> </header> <article class="article" data-astro-cid-ovtjjxhf> <p class="kicker" data-astro-cid-ovtjjxhf>UES WORKING PAPERS · A 5-PAPER SERIES</p> <h1 data-astro-cid-ovtjjxhf>${SERIES_META.title}.</h1> <p class="subtitle" data-astro-cid-ovtjjxhf>${SERIES_META.subtitle}</p> <ol class="byline" data-astro-cid-ovtjjxhf>${SERIES_META.authors.map((a) => renderTemplate`<li data-astro-cid-ovtjjxhf><strong data-astro-cid-ovtjjxhf>${a.name}</strong> · ${a.dept} · ${SERIES_META.affiliation} · <a${addAttribute(`mailto:${a.email}`, "href")} data-astro-cid-ovtjjxhf>${a.email}</a></li>`)}</ol> <section class="thesis" data-astro-cid-ovtjjxhf> <h2 data-astro-cid-ovtjjxhf>Series thesis</h2> <p data-astro-cid-ovtjjxhf>${SERIES_META.thesis}</p> </section> <section class="overview" data-astro-cid-ovtjjxhf> <h2 data-astro-cid-ovtjjxhf>The five papers</h2> <ol class="papers" data-astro-cid-ovtjjxhf>${SERIES.map((p) => renderTemplate`<li${addAttribute(`p p--${p.status}`, "class")} data-astro-cid-ovtjjxhf> <div class="p__head" data-astro-cid-ovtjjxhf> <span class="p__no" data-astro-cid-ovtjjxhf>${p.paperNumber}</span> <span${addAttribute(`p__status p__status--${p.status}`, "class")} data-astro-cid-ovtjjxhf>${p.status === "shipped" ? "· SHIPPED ·" : "· FORTHCOMING ·"}</span> </div> <h3 data-astro-cid-ovtjjxhf>${p.shortTitle}</h3> <p class="p__title" data-astro-cid-ovtjjxhf>${p.title}</p> <p class="p__geo" data-astro-cid-ovtjjxhf><strong data-astro-cid-ovtjjxhf>Era:</strong> ${p.era} · <strong data-astro-cid-ovtjjxhf>Geography:</strong> ${p.geography} · <strong data-astro-cid-ovtjjxhf>Radius:</strong> ${p.radiusInMiles} mi</p> <p class="p__abstract" data-astro-cid-ovtjjxhf>${p.abstract}</p> <p class="p__thesis" data-astro-cid-ovtjjxhf><em data-astro-cid-ovtjjxhf>Thesis:</em> ${p.thesis}</p> ${p.status === "shipped" ? renderTemplate`<a class="p__link"${addAttribute(p.url, "href")} data-astro-cid-ovtjjxhf>Read ${p.shortTitle} →</a>` : renderTemplate`<span class="p__pending" data-astro-cid-ovtjjxhf>Forthcoming at ${p.url}</span>`} </li>`)}</ol> </section> <section class="preface" data-astro-cid-ovtjjxhf> <h2 data-astro-cid-ovtjjxhf>Companion papers</h2> <p data-astro-cid-ovtjjxhf>This series follows the prior diptych on pre-digital personal architecture:</p> <ul data-astro-cid-ovtjjxhf> <li data-astro-cid-ovtjjxhf><a href="/trapper-keeper" data-astro-cid-ovtjjxhf>UES-WP-2026-04 · Velcro and Memory: A Material History of the Mead Trapper Keeper, 1978–2001</a></li> <li data-astro-cid-ovtjjxhf><a href="/walkman" data-astro-cid-ovtjjxhf>UES-WP-2026-05 · Pocket Sound: A Material History of the Sony Walkman, 1979–2010</a></li> </ul> <p data-astro-cid-ovtjjxhf>The diptych studied pre-digital personal objects. This series studies the labs that preceded them.</p> </section> <section class="links" data-astro-cid-ovtjjxhf> <a href="/university-of-el-segundo" data-astro-cid-ovtjjxhf>UES tracks</a> <a href="/marine-layer" data-astro-cid-ovtjjxhf>Marine Layer</a> <a href="/commons" data-astro-cid-ovtjjxhf>Commons</a> <a href="/civic-layer" data-astro-cid-ovtjjxhf>Civic Layer</a> <a href="/labs.json" data-astro-cid-ovtjjxhf>JSON</a> </section> </article> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/labs.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/labs.astro";
const $$url = "/labs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Labs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
