import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const GET = async () => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const base = "https://pointcast.xyz";
  const urls = [];
  for (const b of blocks) {
    urls.push({
      loc: `${base}/b/${b.data.id}`,
      lastmod: b.data.timestamp.toISOString(),
      priority: b.data.type === "READ" ? "0.8" : "0.6"
    });
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
