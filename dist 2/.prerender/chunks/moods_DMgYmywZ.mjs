import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { r as resolveMoodTemplate } from './moods-soundtracks_CEitMVRv.mjs';

const GET = async () => {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  let gallery = [];
  try {
    gallery = await getCollection("gallery", ({ data }) => !data.draft);
  } catch {
    gallery = [];
  }
  const byMood = /* @__PURE__ */ new Map();
  const freshestMs = /* @__PURE__ */ new Map();
  function ensure(slug) {
    let r = byMood.get(slug);
    if (!r) {
      r = {
        slug,
        blocks: 0,
        gallery: 0,
        total: 0,
        freshest: null,
        sampleBlockIds: [],
        template: resolveMoodTemplate(slug),
        url: `https://pointcast.xyz/mood/${slug}`,
        jsonUrl: `https://pointcast.xyz/mood/${slug}.json`
      };
      byMood.set(slug, r);
      freshestMs.set(slug, 0);
    }
    return r;
  }
  for (const b of blocks) {
    if (!b.data.mood) continue;
    const r = ensure(b.data.mood);
    r.blocks += 1;
    r.total += 1;
    const ms = b.data.timestamp.getTime();
    if (ms > (freshestMs.get(r.slug) ?? 0)) freshestMs.set(r.slug, ms);
  }
  for (const g of gallery) {
    if (!g.data.mood) continue;
    const r = ensure(g.data.mood);
    r.gallery += 1;
    r.total += 1;
    const ms = g.data.createdAt.getTime();
    if (ms > (freshestMs.get(r.slug) ?? 0)) freshestMs.set(r.slug, ms);
  }
  for (const row of byMood.values()) {
    row.freshest = new Date(freshestMs.get(row.slug) ?? 0).toISOString();
    row.sampleBlockIds = blocks.filter((b) => b.data.mood === row.slug).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 3).map((b) => b.data.id);
  }
  const rows = Array.from(byMood.values()).sort(
    (a, b) => b.total - a.total || (freshestMs.get(b.slug) ?? 0) - (freshestMs.get(a.slug) ?? 0)
  );
  const payload = {
    $schema: "https://pointcast.xyz/moods.json",
    name: "PointCast · tonal atlas",
    description: "Every mood slug with at least one entry, across the blocks + gallery collections. Each slug is a /mood/{slug} route. Moods are editorial classifiers that cut across channels and types.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    home: "https://pointcast.xyz/moods",
    moodCount: rows.length,
    totalEntries: rows.reduce((sum, r) => sum + r.total, 0),
    moods: rows
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
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
