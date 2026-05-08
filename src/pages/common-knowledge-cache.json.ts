import type { APIRoute } from 'astro';
import { ANTI_PATTERNS, ARCHITECTURE, CACHE_META, CACHE_NOTES, PERMISSION_DESIGN, QUERY_PATTERNS, REFERENCES, ROADMAP, WHATS_IN } from '../lib/commonKnowledgeCache';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/common-knowledge-cache.json',
    name: CACHE_META.title, subtitle: CACHE_META.subtitle, thesis: CACHE_META.thesis,
    paperNumber: CACHE_META.paperNumber, parentPaper: CACHE_META.parentPaper, status: CACHE_META.status, date: CACHE_META.date,
    architecture: ARCHITECTURE,
    whatsIn: WHATS_IN,
    queryPatterns: QUERY_PATTERNS,
    permissionDesign: PERMISSION_DESIGN,
    antiPatterns: ANTI_PATTERNS,
    roadmap: ROADMAP,
    notes: CACHE_NOTES,
    references: REFERENCES,
    counts: { categories: WHATS_IN.length, queryPatterns: QUERY_PATTERNS.length, antiPatterns: ANTI_PATTERNS.length, roadmapMilestones: ROADMAP.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/common-knowledge-cache',
    parent: 'https://pointcast.xyz/p2p-ai',
    related: { p2pAi: 'https://pointcast.xyz/p2p-ai', federationCouncil: 'https://pointcast.xyz/federation-council', pointcastConnectors: 'https://pointcast.xyz/pointcast-connectors', forkableRadius: 'https://pointcast.xyz/forkable-radius', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
