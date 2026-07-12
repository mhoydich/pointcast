import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
const GET = async () => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const updated = blocks[0]?.data.timestamp.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString();
  const entries = blocks.slice(0, 60).map((b) => {
    const ch = CHANNELS[b.data.channel];
    const summary = b.data.dek ?? b.data.body?.slice(0, 280) ?? b.data.title;
    const url = `https://pointcast.xyz/b/${b.data.id}`;
    return `
  <entry>
    <id>${url}</id>
    <title type="text">${xmlEscape(b.data.title)}</title>
    <link rel="alternate" type="text/html" href="${url}"/>
    <link rel="alternate" type="application/json" href="${url}.json"/>
    <updated>${b.data.timestamp.toISOString()}</updated>
    <published>${b.data.timestamp.toISOString()}</published>
    <category term="${ch.code}" label="${xmlEscape(ch.name)}"/>
    <category term="${b.data.type}" label="${b.data.type}"/>
    <summary type="text">${xmlEscape(summary)}</summary>
  </entry>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>https://pointcast.xyz/sparrow/feed.xml</id>
  <title>Sparrow · a reader for PointCast</title>
  <subtitle>Tune in at dawn — broadcasts arriving at the perch.</subtitle>
  <link rel="self" href="https://pointcast.xyz/sparrow/feed.xml"/>
  <link rel="alternate" type="text/html" href="https://pointcast.xyz/sparrow"/>
  <link rel="alternate" type="application/json" href="https://pointcast.xyz/sparrow.json"/>
  <updated>${updated}</updated>
  <author>
    <name>Mike Hoydich</name>
    <uri>https://pointcast.xyz</uri>
  </author>
  <generator uri="https://pointcast.xyz/sparrow" version="0.1">Sparrow</generator>
  <rights>CC BY 4.0 — see https://pointcast.xyz/for-agents</rights>${entries}
</feed>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
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
