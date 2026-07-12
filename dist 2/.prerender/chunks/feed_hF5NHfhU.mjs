import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const items = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    const description = b.data.dek ?? b.data.body?.slice(0, 240) ?? b.data.title;
    return `
    <item>
      <title>${xmlEscape(b.data.title)}</title>
      <link>https://pointcast.xyz/b/${b.data.id}</link>
      <guid isPermaLink="true">https://pointcast.xyz/b/${b.data.id}</guid>
      <pubDate>${b.data.timestamp.toUTCString()}</pubDate>
      <description>${xmlEscape(description)}</description>
      <category>CH.${ch.code}</category>
      <category>${xmlEscape(ch.name)}</category>
      <category>${b.data.type}</category>
    </item>`;
  }).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PointCast</title>
    <link>https://pointcast.xyz/</link>
    <description>A living broadcast from El Segundo. Every piece of content is a Block.</description>
    <language>en-US</language>
    <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="https://pointcast.xyz/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
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
