import { a as PAPER_NOTES, R as REFERENCES, b as PLATES, S as SECTIONS, A as ABSTRACT, P as PAPER_META } from './menloParkPaper_CEyp5vTj.mjs';

const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/menlo-park.json",
    name: PAPER_META.title,
    publication: PAPER_META.publication,
    paperNumber: PAPER_META.paperNumber,
    series: PAPER_META.series,
    doi: PAPER_META.doi,
    authors: PAPER_META.authors,
    affiliation: PAPER_META.affiliation,
    date: PAPER_META.date,
    keywords: PAPER_META.keywords,
    abstract: ABSTRACT,
    sections: SECTIONS,
    plates: PLATES,
    references: REFERENCES,
    notes: PAPER_NOTES,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    human: "https://pointcast.xyz/menlo-park",
    parent: "https://pointcast.xyz/labs",
    related: {
      seriesHub: "https://pointcast.xyz/labs",
      ues: "https://pointcast.xyz/university-of-el-segundo",
      marineLayer: "https://pointcast.xyz/marine-layer",
      commons: "https://pointcast.xyz/commons",
      civicLayer: "https://pointcast.xyz/civic-layer",
      trapperKeeper: "https://pointcast.xyz/trapper-keeper",
      walkman: "https://pointcast.xyz/walkman"
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
