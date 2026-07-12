import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const GET = async () => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const pick = blocks[Math.floor(Math.random() * blocks.length)];
  const ch = CHANNELS[pick.data.channel];
  const payload = {
    $schema: "https://pointcast.xyz/BLOCKS.md",
    pickedAt: (/* @__PURE__ */ new Date()).toISOString(),
    id: pick.data.id,
    url: `https://pointcast.xyz/b/${pick.data.id}`,
    jsonUrl: `https://pointcast.xyz/b/${pick.data.id}.json`,
    channel: { code: ch.code, slug: ch.slug, name: ch.name },
    type: pick.data.type,
    title: pick.data.title,
    dek: pick.data.dek,
    timestamp: pick.data.timestamp.toISOString(),
    total: blocks.length
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
