import type { APIRoute } from 'astro';
import { ANTI_TIME_PATTERNS, PAPER_META, PAPER_NOTES, PHILOSOPHICAL_NOTES, PRACTICE_LADDER, REFERENCES, TEN_TIME_FRAMES, THE_DIAGNOSIS, TIME_ATLAS } from '../lib/timePaper';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/time.json',
    name: PAPER_META.title, subtitle: PAPER_META.subtitle, thesis: PAPER_META.thesis,
    paperNumber: PAPER_META.paperNumber, parentSurface: PAPER_META.parentSurface, relatedSurfaces: PAPER_META.relatedSurfaces,
    authors: PAPER_META.authors, date: PAPER_META.date, keywords: PAPER_META.keywords,
    diagnosis: THE_DIAGNOSIS,
    tenTimeFrames: TEN_TIME_FRAMES,
    timeAtlas: TIME_ATLAS,
    antiTimePatterns: ANTI_TIME_PATTERNS,
    practiceLadder: PRACTICE_LADDER,
    philosophicalNotes: PHILOSOPHICAL_NOTES,
    notes: PAPER_NOTES,
    references: REFERENCES,
    counts: {
      timeFrames: TEN_TIME_FRAMES.length,
      atlasDaily: TIME_ATLAS.daily.length,
      atlasWeekly: TIME_ATLAS.weekly.length,
      atlasMonthly: TIME_ATLAS.monthly.length,
      atlasSeasonal: TIME_ATLAS.seasonal.length,
      atlasMultiYear: TIME_ATLAS.multiYear.length,
      antiPatterns: ANTI_TIME_PATTERNS.length,
      ladderWeeks: PRACTICE_LADDER.length,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/time',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { marineLayer: 'https://pointcast.xyz/marine-layer', p2pAi: 'https://pointcast.xyz/p2p-ai', bathHouse: 'https://pointcast.xyz/bath-house', federationCouncil: 'https://pointcast.xyz/federation-council', giantWorks: 'https://pointcast.xyz/giant-works', forkableRadius: 'https://pointcast.xyz/forkable-radius', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
