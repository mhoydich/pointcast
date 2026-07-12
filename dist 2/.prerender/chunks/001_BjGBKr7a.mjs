import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

const $$001 = createComponent(($$result, $$props, $$slots) => {
  const PIECES = [
    {
      idx: "01",
      slug: "el-segundo-print",
      title: "El Segundo Print",
      dek: "A two-color screen print. Royal blue skyline over green wall with potted plant and lemon water.",
      blockId: "0340",
      imagePath: "/images/editions/drop-001/drop-001-01-el-segundo-print.png",
      medium: "two-color screen print (riso-ready)",
      proposedEdition: 20
    },
    {
      idx: "02",
      slug: "jacaranda-post",
      title: "Jacaranda Post",
      dek: "Single-story ES building, red-tile roof, jacaranda in full bloom, palm behind. Classic SoCal vernacular.",
      blockId: "0341",
      imagePath: "/images/editions/drop-001/drop-001-02-jacaranda-post.png",
      medium: "painted digital photograph",
      proposedEdition: 20
    },
    {
      idx: "03",
      slug: "sparrow-in-the-margin",
      title: "Sparrow in the Margin",
      dek: "Canvas-textured sparrow on deep indigo, jade ink foliage. The portrait of the reader.",
      blockId: "0342",
      imagePath: "/images/editions/drop-001/drop-001-03-sparrow-in-the-margin.png",
      medium: "canvas-textured print",
      proposedEdition: 15
    },
    {
      idx: "04",
      slug: "garden-of-the-future",
      title: "Garden of the Future",
      dek: "Retrofuturist garden terrace with planet rising, grid overlay, reference thumbnails. The manifesto poster.",
      blockId: "0343",
      imagePath: "/images/editions/drop-001/drop-001-04-garden-of-the-future.png",
      medium: "collage / retrofuturist poster",
      proposedEdition: 12
    }
  ];
  const totalEditions = PIECES.reduce((s, p) => s + p.proposedEdition, 0);
  const title = "Drop 001 — Four Fields (staged)";
  const description = "Four editorial pieces staged for Tezos mint via Visit Nouns FA2. El Segundo Print · Jacaranda Post · Sparrow in the Margin · Garden of the Future. Minting tomorrow.";
  const canonical = "https://pointcast.xyz/drops/001";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical,
    name: title,
    description,
    url: canonical,
    inLanguage: "en-US",
    hasPart: PIECES.map((p) => ({
      "@type": "VisualArtwork",
      name: p.title,
      description: p.dek,
      artMedium: p.medium,
      url: `https://pointcast.xyz/b/${p.blockId}`,
      image: `https://pointcast.xyz${p.imagePath}`
    })),
    about: ["drop", "nft", "tezos", "editorial", "el-segundo", "pointcast"]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-atif5stg": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="drop" data-astro-cid-atif5stg> <nav class="drop__crumb" aria-label="Breadcrumb" data-astro-cid-atif5stg> <a href="/" data-astro-cid-atif5stg>Home</a> <span aria-hidden="true" data-astro-cid-atif5stg>›</span> <a href="/drops" data-astro-cid-atif5stg>drops</a> <span aria-hidden="true" data-astro-cid-atif5stg>›</span> <span data-astro-cid-atif5stg>001</span> </nav> <header class="drop__hero" data-astro-cid-atif5stg> <p class="drop__kicker mono" data-astro-cid-atif5stg>DROP 001 · FOUR FIELDS · STAGED · 2026-04-24</p> <h1 class="drop__title" data-astro-cid-atif5stg>Four pieces. One drop. Minting tomorrow.</h1> <p class="drop__dek" data-astro-cid-atif5stg>
A small editorial set staged tonight for a Tezos mint via the
        Visit Nouns FA2 (<code class="mono" data-astro-cid-atif5stg>KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh</code>).
${totalEditions} total editions across four pieces. Free mint,
        one per wallet per piece — the full mint mechanics get nailed
        down alongside the origination run. Staging captures the
        intent; tomorrow lights it up.
</p> <ul class="drop__stats mono" data-astro-cid-atif5stg> <li data-astro-cid-atif5stg><span class="num" data-astro-cid-atif5stg>${PIECES.length}</span><span class="lbl" data-astro-cid-atif5stg>PIECES</span></li> <li data-astro-cid-atif5stg><span class="num" data-astro-cid-atif5stg>${totalEditions}</span><span class="lbl" data-astro-cid-atif5stg>EDITIONS</span></li> <li data-astro-cid-atif5stg><span class="num" data-astro-cid-atif5stg>0</span><span class="lbl" data-astro-cid-atif5stg>TEZ</span></li> <li data-astro-cid-atif5stg><span class="num" data-astro-cid-atif5stg>PENDING</span><span class="lbl" data-astro-cid-atif5stg>STATUS</span></li> </ul> </header> <section class="drop__grid" aria-label="Drop 001 pieces" data-astro-cid-atif5stg> ${PIECES.map((p) => renderTemplate`<article${addAttribute(`piece piece--${p.slug}`, "class")} data-astro-cid-atif5stg> <figure class="piece__fig" data-astro-cid-atif5stg> <img class="piece__img"${addAttribute(p.imagePath, "src")}${addAttribute(p.title, "alt")} loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" data-astro-cid-atif5stg> <div class="piece__ph" aria-hidden="true" data-astro-cid-atif5stg> <span class="mono" data-astro-cid-atif5stg>IMAGE COMING</span> <span class="mono" data-astro-cid-atif5stg>${p.idx}/04</span> </div> </figure> <header class="piece__head" data-astro-cid-atif5stg> <p class="piece__idx mono" data-astro-cid-atif5stg>DROP 001 · ${p.idx}/04</p> <h2 class="piece__title" data-astro-cid-atif5stg>${p.title}</h2> </header> <p class="piece__dek" data-astro-cid-atif5stg>${p.dek}</p> <dl class="piece__meta mono" data-astro-cid-atif5stg> <dt data-astro-cid-atif5stg>Medium</dt><dd data-astro-cid-atif5stg>${p.medium}</dd> <dt data-astro-cid-atif5stg>Edition</dt><dd data-astro-cid-atif5stg>${p.proposedEdition} (proposed)</dd> <dt data-astro-cid-atif5stg>Price</dt><dd data-astro-cid-atif5stg>free · gas only</dd> <dt data-astro-cid-atif5stg>Block</dt><dd data-astro-cid-atif5stg><a${addAttribute(`/b/${p.blockId}`, "href")} data-astro-cid-atif5stg>b/${p.blockId}</a></dd> </dl> </article>`)} </section> <section class="drop__how" data-astro-cid-atif5stg> <h2 class="drop__h2" data-astro-cid-atif5stg>How the mint runs</h2> <ol class="drop__steps" data-astro-cid-atif5stg> <li data-astro-cid-atif5stg><strong data-astro-cid-atif5stg>Tonight (staged):</strong> 4 blocks (0340–0343) describe each piece · this page lists them · mint runbook written at <code class="mono" data-astro-cid-atif5stg>docs/plans/2026-04-24-drop-001-mint-runbook.md</code></li> <li data-astro-cid-atif5stg><strong data-astro-cid-atif5stg>Tomorrow:</strong> Mike drops image files into <code class="mono" data-astro-cid-atif5stg>public/images/editions/drop-001/</code> · cards render with real imagery</li> <li data-astro-cid-atif5stg><strong data-astro-cid-atif5stg>Origination pass:</strong> transfer Visit Nouns admin off the throwaway signer to Mike's wallet (\`set_administrator\`)</li> <li data-astro-cid-atif5stg><strong data-astro-cid-atif5stg>Metadata:</strong> upload TZIP-21 JSONs for each piece to IPFS (or Cloudflare Pages via <code class="mono" data-astro-cid-atif5stg>/api/tezos-metadata/[tokenId]</code>)</li> <li data-astro-cid-atif5stg><strong data-astro-cid-atif5stg>Mint:</strong> run <code class="mono" data-astro-cid-atif5stg>scripts/mint-drop-001.mjs</code> · allocates 4 token IDs, mints each to a holding wallet, optionally distributes editions</li> <li data-astro-cid-atif5stg><strong data-astro-cid-atif5stg>Surface:</strong> <code class="mono" data-astro-cid-atif5stg>/editions</code> auto-picks up new tokens via the live TzKT fetch · <code class="mono" data-astro-cid-atif5stg>/drops/001</code> converts the cards to MINT-type with contract + tokenId populated</li> </ol> </section> <section class="drop__runbook" data-astro-cid-atif5stg> <h2 class="drop__h2" data-astro-cid-atif5stg>Tomorrow's runbook</h2> <p class="drop__p" data-astro-cid-atif5stg>
Full step-by-step at
<a href="https://github.com/mhoydich/pointcast/blob/main/docs/plans/2026-04-24-drop-001-mint-runbook.md" data-astro-cid-atif5stg><code class="mono" data-astro-cid-atif5stg>docs/plans/2026-04-24-drop-001-mint-runbook.md</code></a>
— covers image upload, metadata prep, origination handover, and
        the mint script. Safe to run against shadownet first.
</p> </section> <footer class="drop__foot mono" data-astro-cid-atif5stg> <span data-astro-cid-atif5stg>DROP 001 · STAGED · EL SEGUNDO · 2026-04-24</span> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drops/001.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drops/001.astro";
const $$url = "/drops/001";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$001,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
