import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const prerender = true;
const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const top = blocks.slice(0, 24);
  const payload = {
    $schema: "https://pointcast.xyz/sparrow/api/latest.json",
    total: blocks.length,
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    window: 24,
    // The canonical base for every `url` below. Kept explicit so a
    // native client pointed at a fork/dev host (via its own feedURL
    // setting) has a clear origin to resolve against.
    origin: "https://pointcast.xyz",
    blocks: top.map((b) => ({
      id: b.data.id,
      title: b.data.title,
      dek: b.data.dek ?? "",
      channel: b.data.channel,
      type: b.data.type,
      mood: b.data.mood ?? null,
      timestamp: b.data.timestamp.toISOString(),
      author: b.data.author,
      url: `/b/${b.data.id}`,
      sparrow_url: `/sparrow/b/${b.data.id}`
    }))
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=120",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
