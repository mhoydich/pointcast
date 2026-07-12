import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { r as resolveMoodTemplate } from './moods-soundtracks_CEitMVRv.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const [blocks, products] = await Promise.all([
    getCollection("blocks", ({ data }) => !data.draft),
    getCollection("products", ({ data }) => !data.draft)
  ]);
  const rowMap = /* @__PURE__ */ new Map();
  blocks.forEach((b) => {
    if (!b.data.mood) return;
    const row = rowMap.get(b.data.mood) ?? { mood: b.data.mood, template: resolveMoodTemplate(b.data.mood), blocks: 0, products: 0 };
    row.blocks += 1;
    rowMap.set(b.data.mood, row);
  });
  products.forEach((p) => {
    (p.data.pairsWithMood ?? []).forEach((m) => {
      const row = rowMap.get(m) ?? { mood: m, template: resolveMoodTemplate(m), blocks: 0, products: 0 };
      row.products += 1;
      rowMap.set(m, row);
    });
  });
  const rows = Array.from(rowMap.values()).sort((a, b) => b.blocks + b.products - (a.blocks + a.products));
  const withProducts = rows.filter((r) => r.products > 0).length;
  const title = "Pairings · blocks × products × vibe";
  const description = `${rows.length} moods indexed. ${withProducts} have at least one Good Feels product pairing. Each pairing cross-links the editorial feed, the commerce catalog, and a procedural soundtrack.`;
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/polls.png", "data-astro-cid-o7e5gldl": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-o7e5gldl> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-o7e5gldl> <a href="/" data-astro-cid-o7e5gldl>Home</a> <span aria-hidden="true" data-astro-cid-o7e5gldl>›</span> <span data-astro-cid-o7e5gldl>pairings</span> </nav> <header class="head" data-astro-cid-o7e5gldl> <p class="kicker mono" data-astro-cid-o7e5gldl>PAIRINGS · ${rows.length} MOODS · ${withProducts} WITH GOOD FEELS</p> <h1 class="title" data-astro-cid-o7e5gldl>Every mood, paired.</h1> <p class="dek" data-astro-cid-o7e5gldl>
A mood is a coordinate that blocks and products can both occupy. This
        is the cross-index. Every mood row below clicks through to the full
        pairing page — editorial on the left, commerce on the right, a
        procedural Sonic Postcard on top when a vibe is declared.
</p> </header> <ul class="list" data-astro-cid-o7e5gldl> ${rows.map((r) => renderTemplate`<li data-astro-cid-o7e5gldl> <a class="row"${addAttribute(`/pairings/${r.mood}`, "href")}${addAttribute(`--mood-accent:${r.template.accent};--mood-wash:${r.template.wash}`, "style")} data-astro-cid-o7e5gldl> <span class="row__mood" data-astro-cid-o7e5gldl>${r.template.label}</span> <span class="row__slug mono" data-astro-cid-o7e5gldl>/${r.mood}</span> <span class="row__dek mono" data-astro-cid-o7e5gldl>${r.template.register}</span> <span class="row__counts mono" data-astro-cid-o7e5gldl> <span class="count count--blocks" data-astro-cid-o7e5gldl>${r.blocks} BLOCK${r.blocks === 1 ? "" : "S"}</span> <span class="count count--products"${addAttribute(r.products > 0 ? "true" : "false", "data-has")} data-astro-cid-o7e5gldl>${r.products} PROD${r.products === 1 ? "" : "S"}</span> </span> </a> </li>`)} </ul> <section class="agent-strip" data-astro-cid-o7e5gldl> <p class="agent-strip__label mono" data-astro-cid-o7e5gldl>MACHINE-READABLE</p> <ul data-astro-cid-o7e5gldl> <li data-astro-cid-o7e5gldl><a href="/api/products.jsonl" data-astro-cid-o7e5gldl>/api/products.jsonl</a></li> <li data-astro-cid-o7e5gldl><a href="/api/blocks.jsonl" data-astro-cid-o7e5gldl>/api/blocks.jsonl</a></li> <li data-astro-cid-o7e5gldl><a href="/moods" data-astro-cid-o7e5gldl>/moods (full list)</a></li> <li data-astro-cid-o7e5gldl><a href="/for-agents" data-astro-cid-o7e5gldl>/for-agents</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/pairings/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/pairings/index.astro";
const $$url = "/pairings";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
