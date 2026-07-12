import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const items = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    return {
      id: `https://pointcast.xyz/b/${b.data.id}`,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      external_url: b.data.external?.url ?? void 0,
      title: b.data.title,
      content_text: b.data.dek ?? b.data.body?.slice(0, 320) ?? b.data.title,
      summary: b.data.dek ?? void 0,
      date_published: b.data.timestamp.toISOString(),
      tags: [`CH.${ch.code}`, ch.name, b.data.type],
      image: `https://pointcast.xyz/images/og/b/${b.data.id}.png`,
      _pointcast: {
        id: b.data.id,
        channel: { code: ch.code, slug: ch.slug, name: ch.name, color: ch.color600 },
        type: b.data.type,
        edition: b.data.edition ?? null
      }
    };
  });
  const payload = {
    version: "https://jsonfeed.org/version/1.1",
    title: "PointCast",
    description: "A living broadcast from El Segundo. Every piece of content is a Block.",
    home_page_url: "https://pointcast.xyz/",
    feed_url: "https://pointcast.xyz/feed.json",
    icon: "https://pointcast.xyz/images/og/og-home-v2.png",
    favicon: "https://pointcast.xyz/favicon.svg",
    authors: [{ name: "Mike Hoydich", url: "https://pointcast.xyz/about" }],
    language: "en-US",
    items
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
