import type { APIRoute } from 'astro';
import { ABSTRACT, PAPER_META, PAPER_NOTES, PLATES, REFERENCES, SECTIONS } from '../lib/menloParkPaper';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/menlo-park.json',
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
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/menlo-park',
    parent: 'https://pointcast.xyz/labs',
    related: {
      seriesHub: 'https://pointcast.xyz/labs',
      ues: 'https://pointcast.xyz/university-of-el-segundo',
      marineLayer: 'https://pointcast.xyz/marine-layer',
      commons: 'https://pointcast.xyz/commons',
      civicLayer: 'https://pointcast.xyz/civic-layer',
      trapperKeeper: 'https://pointcast.xyz/trapper-keeper',
      walkman: 'https://pointcast.xyz/walkman',
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};
