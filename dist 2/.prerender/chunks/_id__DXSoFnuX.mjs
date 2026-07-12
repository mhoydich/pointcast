import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { a as BLOCK_TYPES } from './block-types_l5R3rOkI.mjs';

async function getStaticPaths() {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  return blocks.map((block) => ({
    params: { id: block.data.id },
    props: { block }
  }));
}
const GET = async ({ props }) => {
  const { block } = props;
  const ch = CHANNELS[block.data.channel];
  const t = BLOCK_TYPES[block.data.type];
  const payload = {
    $schema: "https://pointcast.xyz/BLOCKS.md",
    id: block.data.id,
    url: `https://pointcast.xyz/b/${block.data.id}`,
    channel: {
      code: ch.code,
      slug: ch.slug,
      name: ch.name,
      purpose: ch.purpose,
      color600: ch.color600,
      color800: ch.color800
    },
    type: {
      code: t.code,
      label: t.label,
      description: t.description
    },
    title: block.data.title,
    dek: block.data.dek,
    body: block.data.body,
    timestamp: block.data.timestamp.toISOString(),
    size: block.data.size,
    noun: block.data.noun,
    readingTime: block.data.readingTime,
    edition: block.data.edition,
    media: block.data.media,
    external: block.data.external,
    visitor: block.data.visitor,
    meta: block.data.meta,
    // Editorial + graph fields — added 2026-04-19 sprint `blocks-json-enrich`.
    // Optional; default to null/[] when absent so existing consumers don't
    // break on the new keys.
    author: block.data.author,
    source: block.data.source ?? null,
    mood: block.data.mood ?? null,
    moodUrl: block.data.mood ? `https://pointcast.xyz/mood/${block.data.mood}` : null,
    companions: block.data.companions ?? [],
    clock: block.data.clock ? {
      ...block.data.clock,
      companionUrl: `https://pointcast.xyz/clock/${block.data.id}`
    } : null
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
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
