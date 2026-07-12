import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const lines = blocks.map((b) => JSON.stringify({
    id: b.data.id,
    url: `https://pointcast.xyz/b/${b.data.id}`,
    jsonUrl: `https://pointcast.xyz/b/${b.data.id}.json`,
    channel: b.data.channel,
    type: b.data.type,
    title: b.data.title,
    dek: b.data.dek ?? null,
    body: b.data.body ?? null,
    timestamp: b.data.timestamp.toISOString(),
    author: b.data.author,
    source: b.data.source ?? null,
    mood: b.data.mood ?? null,
    hasClock: !!b.data.clock,
    hasMedia: !!b.data.media,
    hasEdition: !!b.data.edition,
    companions: (b.data.companions ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      surface: c.surface ?? "block"
    })),
    metaKeys: Object.keys(b.data.meta ?? {})
  })).join("\n") + "\n";
  return new Response(lines, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Total-Count": String(blocks.length)
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
