import type { APIRoute } from 'astro';
import { SERIES, SERIES_META } from '../lib/labsSeries';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/labs.json',
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
      shipped: SERIES.filter((p) => p.status === 'shipped').length,
      forthcoming: SERIES.filter((p) => p.status === 'forthcoming').length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/labs',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: {
      ues: 'https://pointcast.xyz/university-of-el-segundo',
      trapperKeeper: 'https://pointcast.xyz/trapper-keeper',
      walkman: 'https://pointcast.xyz/walkman',
      marineLayer: 'https://pointcast.xyz/marine-layer',
      commons: 'https://pointcast.xyz/commons',
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};
