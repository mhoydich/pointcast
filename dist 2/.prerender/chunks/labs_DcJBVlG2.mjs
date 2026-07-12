import { S as SERIES, a as SERIES_META } from './labsSeries_8nt0605C.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/labs.json",
    name: SERIES_META.title,
    subtitle: SERIES_META.subtitle,
    description: SERIES_META.description,
    publication: SERIES_META.publication,
    authors: SERIES_META.authors,
    affiliation: SERIES_META.affiliation,
    thesis: SERIES_META.thesis,
    startedAt: SERIES_META.startedAt,
    prefaceTo: SERIES_META.prefaceTo,
    series: SERIES,
    counts: {
      total: SERIES.length,
      shipped: SERIES.filter((p) => p.status === "shipped").length,
      forthcoming: SERIES.filter((p) => p.status === "forthcoming").length
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    human: "https://pointcast.xyz/labs",
    parent: "https://pointcast.xyz/university-of-el-segundo",
    related: {
      ues: "https://pointcast.xyz/university-of-el-segundo",
      trapperKeeper: "https://pointcast.xyz/trapper-keeper",
      walkman: "https://pointcast.xyz/walkman",
      marineLayer: "https://pointcast.xyz/marine-layer",
      commons: "https://pointcast.xyz/commons"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
