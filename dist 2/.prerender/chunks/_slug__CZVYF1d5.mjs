import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$BlockCard } from './BlockCard_BfWFl5A7.mjs';
import { r as resolveMoodTemplate, M as MOOD_SOUNDTRACKS } from './moods-soundtracks_CEitMVRv.mjs';

async function getStaticPaths() {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  let gallery = [];
  try {
    gallery = await getCollection("gallery", ({ data }) => !data.draft);
  } catch {
    gallery = [];
  }
  const moods = /* @__PURE__ */ new Set();
  for (const b of blocks) if (b.data.mood) moods.add(b.data.mood);
  for (const g of gallery) if (g.data.mood) moods.add(g.data.mood);
  return Array.from(moods).map((slug) => {
    const matchingBlocks = blocks.filter((b) => b.data.mood === slug).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
    const matchingGallery = gallery.filter((g) => g.data.mood === slug).sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
    return {
      params: { slug },
      props: {
        slug,
        blocks: matchingBlocks,
        gallery: matchingGallery
      }
    };
  });
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug, blocks, gallery } = Astro2.props;
  const template = resolveMoodTemplate(slug);
  const soundtrack = MOOD_SOUNDTRACKS[template.soundtrack];
  const prettyMood = template.label;
  const title = `mood · ${prettyMood}`;
  const description = `${template.dek} Every block and gallery entry on PointCast tagged with the "${slug}" mood.`;
  const totalCount = blocks.length + gallery.length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `https://pointcast.xyz/mood/${slug}`,
    name: title,
    description,
    url: `https://pointcast.xyz/mood/${slug}`,
    inLanguage: "en-US",
    hasPart: [
      ...blocks.slice(0, 20).map((b) => ({
        "@type": "CreativeWork",
        "@id": `https://pointcast.xyz/b/${b.data.id}`,
        name: b.data.title,
        datePublished: b.data.timestamp.toISOString(),
        url: `https://pointcast.xyz/b/${b.data.id}`
      })),
      ...gallery.slice(0, 20).map((g) => ({
        "@type": "ImageObject",
        "@id": `https://pointcast.xyz/gallery#${g.data.slug}`,
        name: g.data.title,
        contentUrl: g.data.imageUrl,
        datePublished: g.data.createdAt.toISOString()
      }))
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-n4si44li": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-n4si44li> <nav class="breadcrumb" aria-label="Breadcrumb" data-astro-cid-n4si44li> <a href="/" data-astro-cid-n4si44li>← All blocks</a> <span aria-hidden="true" data-astro-cid-n4si44li>/</span> <span data-astro-cid-n4si44li>mood</span> <span aria-hidden="true" data-astro-cid-n4si44li>/</span> <span data-astro-cid-n4si44li>${slug}</span> </nav> <header class="masthead" data-astro-cid-n4si44li> <h1 class="title" data-astro-cid-n4si44li>mood · <em data-astro-cid-n4si44li>${prettyMood}</em></h1> <p class="count mono" data-astro-cid-n4si44li>${totalCount} ITEM${totalCount === 1 ? "" : "S"} · ${blocks.length} BLOCK${blocks.length === 1 ? "" : "S"}${gallery.length > 0 ? ` · ${gallery.length} GALLERY` : ""}</p> <p class="lede" data-astro-cid-n4si44li> ${template.dek} </p> </header> <section class="mood-template"${addAttribute(`${prettyMood} mood template`, "aria-label")}${addAttribute(`--mood-accent:${template.accent};--mood-wash:${template.wash};--mood-ink:${template.ink}`, "style")} data-astro-cid-n4si44li> <div data-astro-cid-n4si44li> <p class="mood-template__kicker mono" data-astro-cid-n4si44li>TEMPLATE · ${slug}</p> <h2 class="mood-template__title" data-astro-cid-n4si44li>${template.register}</h2> <p class="mood-template__dek" data-astro-cid-n4si44li>${template.agentUse}</p> </div> <div class="mood-template__meta" data-astro-cid-n4si44li> <p class="mood-template__label mono" data-astro-cid-n4si44li>SOUNDTRACK</p> <p class="mood-template__value" data-astro-cid-n4si44li>${soundtrack.label}</p> <p class="mood-template__note" data-astro-cid-n4si44li>${soundtrack.description}</p> </div> <ul class="mood-template__prompts" aria-label="Agent prompts" data-astro-cid-n4si44li> ${template.prompts.map((prompt) => renderTemplate`<li data-astro-cid-n4si44li>${prompt}</li>`)} </ul> </section> ${blocks.length > 0 && renderTemplate`<section class="section"${addAttribute(`Blocks tagged ${slug}`, "aria-label")} data-astro-cid-n4si44li> <h2 class="section__kicker mono" data-astro-cid-n4si44li>BLOCKS · ${blocks.length}</h2> <div class="grid" data-astro-cid-n4si44li> ${blocks.map((block) => renderTemplate`${renderComponent($$result2, "BlockCard", $$BlockCard, { "block": block, "data-astro-cid-n4si44li": true })}`)} </div> </section>`} ${gallery.length > 0 && renderTemplate`<section class="section"${addAttribute(`Gallery items tagged ${slug}`, "aria-label")} data-astro-cid-n4si44li> <h2 class="section__kicker mono" data-astro-cid-n4si44li>GALLERY · ${gallery.length}</h2> <ul class="gallery-list" data-astro-cid-n4si44li> ${gallery.map((g) => renderTemplate`<li class="gallery-item" data-astro-cid-n4si44li> <a${addAttribute(`/gallery#${g.data.slug}`, "href")} class="gallery-item__link" data-astro-cid-n4si44li> <img${addAttribute(g.data.imageUrl, "src")}${addAttribute(g.data.title, "alt")} loading="lazy" class="gallery-item__img" data-astro-cid-n4si44li> <div class="gallery-item__meta" data-astro-cid-n4si44li> <p class="gallery-item__title" data-astro-cid-n4si44li>${g.data.title}</p> <p class="gallery-item__tool mono" data-astro-cid-n4si44li>${g.data.tool.toUpperCase()}</p> </div> </a> </li>`)} </ul> </section>`} ${totalCount === 0 && renderTemplate`<p class="empty" data-astro-cid-n4si44li>No entries yet for this mood. (Unreachable if the route rendered at build time — but safe fallback.)</p>`} <aside class="agent-strip" data-astro-cid-n4si44li> <p class="agent-strip__label" data-astro-cid-n4si44li>MACHINE-READABLE</p> <ul data-astro-cid-n4si44li> <li data-astro-cid-n4si44li><a${addAttribute(`/mood/${slug}.json`, "href")} data-astro-cid-n4si44li>/mood/${slug}.json</a></li> <li data-astro-cid-n4si44li><a href="/moods.json" data-astro-cid-n4si44li>/moods.json</a></li> <li data-astro-cid-n4si44li><a href="/blocks.json" data-astro-cid-n4si44li>/blocks.json</a></li> <li data-astro-cid-n4si44li><a href="/for-agents" data-astro-cid-n4si44li>/for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/mood/[slug].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/mood/[slug].astro";
const $$url = "/mood/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
