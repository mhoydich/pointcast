import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { r as resolveMoodTemplate } from './moods-soundtracks_CEitMVRv.mjs';

const getStaticPaths = async () => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  let gallery = [];
  try {
    gallery = await getCollection("gallery", ({ data }) => !data.draft);
  } catch {
    gallery = [];
  }
  const slugs = /* @__PURE__ */ new Set();
  for (const b of blocks) if (b.data.mood) slugs.add(b.data.mood);
  for (const g of gallery) if (g.data.mood) slugs.add(g.data.mood);
  return Array.from(slugs).map((slug) => {
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
};
const GET = async ({ props }) => {
  const { slug, blocks, gallery } = props;
  const template = resolveMoodTemplate(slug);
  const payload = {
    $schema: "https://pointcast.xyz/mood/{slug}.json",
    mood: slug,
    prettyMood: template.label,
    template,
    home: `https://pointcast.xyz/mood/${slug}`,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    counts: {
      blocks: blocks.length,
      gallery: gallery.length,
      total: blocks.length + gallery.length
    },
    blocks: blocks.map((b) => ({
      id: b.data.id,
      channel: b.data.channel,
      type: b.data.type,
      title: b.data.title,
      dek: b.data.dek ?? null,
      timestamp: b.data.timestamp.toISOString(),
      url: `https://pointcast.xyz/b/${b.data.id}`,
      jsonUrl: `https://pointcast.xyz/b/${b.data.id}.json`,
      author: b.data.author
    })),
    gallery: gallery.map((g) => ({
      slug: g.data.slug,
      title: g.data.title,
      imageUrl: g.data.imageUrl,
      tool: g.data.tool,
      createdAt: g.data.createdAt.toISOString(),
      url: `https://pointcast.xyz/gallery#${g.data.slug}`
    }))
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  getStaticPaths
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
