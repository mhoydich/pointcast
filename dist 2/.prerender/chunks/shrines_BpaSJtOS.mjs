import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { a as absoluteUrl, U as UNFURL_SHRINES, S as SITE_URL, b as absoluteImage, c as SHRINE_SETS } from './unfurl-shrines_CZAaG8nC.mjs';

const $$Shrines = createComponent(($$result, $$props, $$slots) => {
  const title = "PointCast Shrine Sets";
  const description = "A visual gallery of PointCast URL unfurl shrines: element, block, room, system, and campaign sets with generated background art.";
  const pageUrl = absoluteUrl("/shrines");
  const shrinesBySlug = new Map(UNFURL_SHRINES.map((shrine) => [shrine.slug, shrine]));
  const featuredShrines = ["breathe-0304", "listening-room", "agents", "nouns-cola"].map((slug) => shrinesBySlug.get(slug)).filter(Boolean);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        name: title,
        description,
        url: pageUrl,
        isPartOf: { "@type": "WebSite", name: "PointCast", url: SITE_URL },
        image: absoluteImage("/images/shrines/shrine-background-sheet.png")
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#sets`,
        name: "PointCast shrine sets",
        itemListElement: SHRINE_SETS.map((set, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/shrines#${set.slug}`),
          name: set.title,
          description: set.description,
          image: absoluteImage(set.background)
        }))
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/shrines/shrine-background-sheet.png", "imageAlt": "Four generated PointCast URL shrine backgrounds", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/shrines.json", title: "PointCast shrine sets JSON" },
    { type: "application/json", href: "/unfurls.json", title: "PointCast unfurl shrine manifest" }
  ], "frame": {
    image: "https://pointcast.xyz/images/shrines/shrine-background-sheet.png",
    buttons: [
      { label: "Open shrines", action: "link", target: pageUrl },
      { label: "Build shrine", action: "link", target: absoluteUrl("/unfurls#builder") },
      { label: "Shrine JSON", action: "link", target: absoluteUrl("/shrines.json") }
    ]
  }, "data-astro-cid-oic7axhv": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="shrines-page" data-astro-cid-oic7axhv> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-oic7axhv> <a href="/" data-astro-cid-oic7axhv>Home</a> <span data-astro-cid-oic7axhv>/</span> <span data-astro-cid-oic7axhv>shrines</span> <a href="/shrines.json" data-astro-cid-oic7axhv>JSON</a> </nav> <header class="hero" data-astro-cid-oic7axhv> <img class="hero__art" src="/images/shrines/shrine-background-sheet.png" alt="Four generated visual backgrounds for PointCast URL shrines" width="1672" height="941" loading="eager" decoding="async" data-astro-cid-oic7axhv> <div class="hero__shade" data-astro-cid-oic7axhv></div> <div class="hero__copy" data-astro-cid-oic7axhv> <p class="kicker mono" data-astro-cid-oic7axhv>POINTCAST URL SHRINES</p> <h1 data-astro-cid-oic7axhv>Shrines for the URLs that need to arrive intact.</h1> <p data-astro-cid-oic7axhv>
Generated settings for the unfurl system: natural rooms, block
          plinths, ambient rooms, agent-readable grids, and campaign desks.
          Each set points at real PointCast routes with images, proof links,
          and a job.
</p> <div class="hero__actions" data-astro-cid-oic7axhv> <a href="#sets" data-astro-cid-oic7axhv>Browse Sets</a> <a href="/unfurls#builder" data-astro-cid-oic7axhv>Build Shrine</a> <a href="/unfurls" data-astro-cid-oic7axhv>Unfurl Wall</a> </div> </div> <div class="hero__rail" aria-label="Featured shrine routes" data-astro-cid-oic7axhv> ${featuredShrines.map((shrine) => renderTemplate`<a${addAttribute(shrine.path, "href")} data-astro-cid-oic7axhv> <span class="mono" data-astro-cid-oic7axhv>${shrine.kind}</span> <strong data-astro-cid-oic7axhv>${shrine.title}</strong> </a>`)} </div> </header> <section class="intro" aria-label="Shrine system summary" data-astro-cid-oic7axhv> <div data-astro-cid-oic7axhv> <span class="mono" data-astro-cid-oic7axhv>${SHRINE_SETS.length} SETS</span> <strong data-astro-cid-oic7axhv>generated backgrounds</strong> <p data-astro-cid-oic7axhv>Each visual set has its own raster scene in \`public/images/shrines\`.</p> </div> <div data-astro-cid-oic7axhv> <span class="mono" data-astro-cid-oic7axhv>${UNFURL_SHRINES.length} URLS</span> <strong data-astro-cid-oic7axhv>real routes</strong> <p data-astro-cid-oic7axhv>The page reuses the same canonical shrine manifest as \`/unfurls\`.</p> </div> <div data-astro-cid-oic7axhv> <span class="mono" data-astro-cid-oic7axhv>V2 BUILDER</span> <strong data-astro-cid-oic7axhv>ready to extend</strong> <p data-astro-cid-oic7axhv>The shrine builder lives at \`/unfurls#builder\` for quick drafts.</p> </div> </section> <section class="sets" id="sets" aria-label="Shrine sets" data-astro-cid-oic7axhv> ${SHRINE_SETS.map((set) => {
    const setShrines = set.slugs.map((slug) => shrinesBySlug.get(slug)).filter(Boolean);
    return renderTemplate`<article class="set"${addAttribute(set.slug, "id")} data-astro-cid-oic7axhv> <img class="set__background"${addAttribute(set.background, "src")} alt="" width="1400" height="788" loading="lazy" decoding="async" data-astro-cid-oic7axhv> <div class="set__shade" data-astro-cid-oic7axhv></div> <div class="set__copy" data-astro-cid-oic7axhv> <p class="kicker mono" data-astro-cid-oic7axhv>${set.label}</p> <h2 data-astro-cid-oic7axhv>${set.title}</h2> <p data-astro-cid-oic7axhv>${set.description}</p> <div class="set__tags" data-astro-cid-oic7axhv> ${set.kinds.map((kind) => renderTemplate`<span data-astro-cid-oic7axhv>${kind}</span>`)} </div> ${set.backgroundVariants && renderTemplate`<div class="set__variants"${addAttribute(`${set.title} generated background variants`, "aria-label")} data-astro-cid-oic7axhv> ${set.backgroundVariants.map((background) => renderTemplate`<img${addAttribute(background, "src")} alt="" width="1400" height="788" loading="lazy" decoding="async" data-astro-cid-oic7axhv>`)} </div>`} </div> <div class="set__links"${addAttribute(`${set.title} routes`, "aria-label")} data-astro-cid-oic7axhv> ${setShrines.map((shrine) => renderTemplate`<a${addAttribute(shrine.path, "href")} data-astro-cid-oic7axhv> <img${addAttribute(shrine.image, "src")} alt="" width="1200" height="630" loading="lazy" decoding="async" data-astro-cid-oic7axhv> <span data-astro-cid-oic7axhv> <small class="mono" data-astro-cid-oic7axhv>${shrine.path}</small> <strong data-astro-cid-oic7axhv>${shrine.title}</strong> </span> </a>`)} </div> </article>`;
  })} </section> <section class="builder-callout" aria-label="Shrine builder" data-astro-cid-oic7axhv> <div data-astro-cid-oic7axhv> <p class="kicker mono" data-astro-cid-oic7axhv>NEXT SHRINE</p> <h2 data-astro-cid-oic7axhv>Draft the next URL unfurl from the builder.</h2> <p data-astro-cid-oic7axhv>
The builder composes title, description, image, audience, ritual, and
          proof links, then previews the share object before it becomes permanent.
</p> </div> <div class="builder-callout__actions" data-astro-cid-oic7axhv> <a href="/unfurls#builder" data-astro-cid-oic7axhv>Open Builder</a> <a href="/shrines.json" data-astro-cid-oic7axhv>Shrine Sets JSON</a> <a href="/unfurls.json" data-astro-cid-oic7axhv>Unfurl Manifest</a> </div> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/shrines.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/shrines.astro";
const $$url = "/shrines";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Shrines,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
