import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS, a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';

async function getStaticPaths() {
  return CHANNEL_LIST.map((ch) => ({
    params: { channel: ch.slug },
    props: { channelCode: ch.code }
  }));
}
const GET = async ({ props }) => {
  const ch = CHANNELS[props.channelCode];
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft && data.channel === props.channelCode)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: `PointCast · ${ch.name}`,
    home_page_url: `https://pointcast.xyz/c/${ch.slug}`,
    feed_url: `https://pointcast.xyz/c/${ch.slug}.json`,
    description: ch.purpose,
    language: "en-US",
    authors: [{ name: "Mike Hoydich × Claude", url: "https://pointcast.xyz/about" }],
    items: blocks.map((b) => ({
      id: `https://pointcast.xyz/b/${b.data.id}`,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      title: b.data.title,
      summary: b.data.dek ?? b.data.body?.slice(0, 200),
      content_text: b.data.body ?? b.data.dek ?? b.data.title,
      date_published: b.data.timestamp.toISOString(),
      _pointcast: {
        blockId: b.data.id,
        channel: ch.code,
        type: b.data.type,
        edition: b.data.edition
      }
    }))
  };
  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  getStaticPaths
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
