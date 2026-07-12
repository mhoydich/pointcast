import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { r as resolveMoodTemplate } from './moods-soundtracks_CEitMVRv.mjs';

const $$Moods = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  let gallery = [];
  try {
    gallery = await getCollection("gallery", ({ data }) => !data.draft);
  } catch {
    gallery = [];
  }
  const rowsByMood = /* @__PURE__ */ new Map();
  function ensure(slug) {
    let r = rowsByMood.get(slug);
    if (!r) {
      r = { slug, template: resolveMoodTemplate(slug), blocks: 0, gallery: 0, total: 0, freshest: 0, sampleBlocks: [] };
      rowsByMood.set(slug, r);
    }
    return r;
  }
  for (const b of blocks) {
    if (!b.data.mood) continue;
    const r = ensure(b.data.mood);
    r.blocks += 1;
    r.total += 1;
    r.freshest = Math.max(r.freshest, b.data.timestamp.getTime());
  }
  for (const g of gallery) {
    if (!g.data.mood) continue;
    const r = ensure(g.data.mood);
    r.gallery += 1;
    r.total += 1;
    r.freshest = Math.max(r.freshest, g.data.createdAt.getTime());
  }
  for (const row of rowsByMood.values()) {
    row.sampleBlocks = blocks.filter((b) => b.data.mood === row.slug).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 3);
  }
  const rows = Array.from(rowsByMood.values()).sort((a, b) => b.total - a.total || b.freshest - a.freshest);
  const totalEntries = rows.reduce((sum, r) => sum + r.total, 0);
  const title = "Moods · tonal atlas";
  const description = `A tonal atlas of PointCast. ${rows.length} mood${rows.length === 1 ? "" : "s"} across ${totalEntries} entries — editorial classifiers that cut across channels and types.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/moods",
    name: title,
    description,
    url: "https://pointcast.xyz/moods",
    inLanguage: "en-US",
    hasPart: rows.map((r) => ({
      "@type": "CollectionPage",
      "@id": `https://pointcast.xyz/mood/${r.slug}`,
      name: r.template.label,
      description: r.template.dek,
      url: `https://pointcast.xyz/mood/${r.slug}`
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-luq7zjvl": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-luq7zjvl> <nav class="breadcrumb" aria-label="Breadcrumb" data-astro-cid-luq7zjvl> <a href="/" data-astro-cid-luq7zjvl>← All blocks</a> <span aria-hidden="true" data-astro-cid-luq7zjvl>/</span> <span data-astro-cid-luq7zjvl>moods</span> </nav> <header class="masthead" data-astro-cid-luq7zjvl> <h1 class="title" data-astro-cid-luq7zjvl>Moods · <em data-astro-cid-luq7zjvl>tonal atlas</em></h1> <p class="count mono" data-astro-cid-luq7zjvl>${rows.length} MOOD${rows.length === 1 ? "" : "S"} · ${totalEntries} ENTRIES</p> <p class="lede" data-astro-cid-luq7zjvl>
Not a channel, not a type — a <em data-astro-cid-luq7zjvl>register</em>. Moods cut across
        the feed by emotional or atmospheric fingerprint. A block tagged
        "rainy-week" and a gallery image tagged "quiet" can sit under
        different moods despite sharing a channel. This page lists every
        mood with at least one entry, sorted by population.
</p> <p class="lede lede--secondary" data-astro-cid-luq7zjvl>
Moods are additive. A future tick can coin a new slug the moment
        a block earns one — the route materializes on next build. See
<a href="/b/0275" data-astro-cid-luq7zjvl>0275</a> (rainy-week) or <a href="/mood/rainy-week" data-astro-cid-luq7zjvl>/mood/rainy-week</a> for the first set.
</p> </header> ${rows.length === 0 && renderTemplate`<p class="empty" data-astro-cid-luq7zjvl>No mood-tagged entries yet. (If you see this in production, something regressed — the sprint <code data-astro-cid-luq7zjvl>mood-primitive</code> seeded four blocks.)</p>`} ${rows.length > 0 && renderTemplate`<ul class="rows" data-astro-cid-luq7zjvl> ${rows.map((row) => renderTemplate`<li class="row" data-astro-cid-luq7zjvl> <a class="row__link"${addAttribute(`/mood/${row.slug}`, "href")}${addAttribute(`${row.template.label} — ${row.total} entries`, "aria-label")}${addAttribute(`--mood-accent:${row.template.accent};--mood-wash:${row.template.wash};--mood-ink:${row.template.ink}`, "style")} data-astro-cid-luq7zjvl> <div class="row__head" data-astro-cid-luq7zjvl> <span class="row__slug" data-astro-cid-luq7zjvl>${row.template.label}</span> <span class="row__count mono"${addAttribute(`${row.total} entries`, "aria-label")} data-astro-cid-luq7zjvl> ${row.total} <span class="row__count-sub" data-astro-cid-luq7zjvl> ${row.blocks > 0 ? `${row.blocks}B` : ""}${row.blocks > 0 && row.gallery > 0 ? "·" : ""}${row.gallery > 0 ? `${row.gallery}G` : ""} </span> </span> </div> <p class="row__dek" data-astro-cid-luq7zjvl>${row.template.dek}</p> <p class="row__register mono" data-astro-cid-luq7zjvl>${row.template.register}</p> ${row.sampleBlocks.length > 0 && renderTemplate`<ul class="row__samples" data-astro-cid-luq7zjvl> ${row.sampleBlocks.map((b) => renderTemplate`<li class="row__sample mono" data-astro-cid-luq7zjvl>№${b.data.id} · ${b.data.title.slice(0, 48)}${b.data.title.length > 48 ? "…" : ""}</li>`)} </ul>`} <span class="row__arrow" aria-hidden="true" data-astro-cid-luq7zjvl>→</span> </a> </li>`)} </ul>`} <aside class="agent-strip" data-astro-cid-luq7zjvl> <p class="agent-strip__label" data-astro-cid-luq7zjvl>MACHINE-READABLE</p> <ul data-astro-cid-luq7zjvl> <li data-astro-cid-luq7zjvl><a href="/moods.json" data-astro-cid-luq7zjvl>/moods.json</a></li> <li data-astro-cid-luq7zjvl><a href="/blocks.json" data-astro-cid-luq7zjvl>/blocks.json</a></li> <li data-astro-cid-luq7zjvl><a href="/for-agents" data-astro-cid-luq7zjvl>/for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/moods.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/moods.astro";
const $$url = "/moods";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Moods,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
