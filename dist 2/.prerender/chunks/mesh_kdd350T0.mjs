import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

const GET = async () => {
  const mesh = (await getCollection("mesh", ({ data }) => data.listed)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const lines = mesh.map((n) => JSON.stringify({
    slug: n.data.slug,
    name: n.data.name,
    url: n.data.url,
    feedUrl: n.data.feedUrl ?? null,
    kind: n.data.kind,
    status: n.data.status,
    description: n.data.description,
    trust: n.data.trust,
    region: n.data.region ?? null,
    coordinates: n.data.lat != null && n.data.lon != null ? { lat: n.data.lat, lon: n.data.lon } : null,
    vibeProfile: n.data.vibeProfile ?? null,
    noun: n.data.noun ?? null,
    tezosAddress: n.data.tezosAddress ?? null,
    addedAt: n.data.addedAt.toISOString(),
    author: n.data.author,
    source: n.data.source ?? null,
    federationUrl: `https://pointcast.xyz/federation`
  })).join("\n") + "\n";
  return new Response(lines, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Total-Count": String(mesh.length),
      "X-Imagined-Count": String(mesh.filter((m) => m.data.status === "imagined").length)
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
