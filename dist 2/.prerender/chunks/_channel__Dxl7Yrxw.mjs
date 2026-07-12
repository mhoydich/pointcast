import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS, a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';

async function getStaticPaths() {
  return CHANNEL_LIST.map((ch) => ({
    params: { channel: ch.slug },
    props: { channelCode: ch.code }
  }));
}
function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const GET = async ({ props }) => {
  const ch = CHANNELS[props.channelCode];
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft && data.channel === props.channelCode)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const items = blocks.map((b) => `
    <item>
      <title>${xmlEscape(b.data.title)}</title>
      <link>https://pointcast.xyz/b/${b.data.id}</link>
      <guid isPermaLink="true">https://pointcast.xyz/b/${b.data.id}</guid>
      <pubDate>${b.data.timestamp.toUTCString()}</pubDate>
      <description>${xmlEscape(b.data.dek ?? b.data.body ?? b.data.title)}</description>
      <category>CH.${ch.code}</category>
      <category>${b.data.type}</category>
    </item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PointCast · ${xmlEscape(ch.name)}</title>
    <link>https://pointcast.xyz/c/${ch.slug}</link>
    <description>${xmlEscape(ch.purpose)}</description>
    <language>en-US</language>
    <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="https://pointcast.xyz/c/${ch.slug}.rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  getStaticPaths
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
