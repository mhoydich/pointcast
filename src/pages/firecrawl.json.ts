import type { APIRoute } from 'astro';
import { FIRECRAWL_SETUP } from '../lib/pointcast-agent-kit';
import {
  BOUNDARIES,
  CRAWL_COMPACT,
  CRAWL_STAGES,
  FIRECRAWL_FIELD_GUIDE,
  FIRECRAWL_INTEREST,
  HISTORY,
  LENSES,
  SOURCE_LEDGER,
} from '../lib/firecrawl-field-guide';

export const GET: APIRoute = () => new Response(JSON.stringify({
  $schema: 'https://pointcast.xyz/BLOCKS.md',
  ...FIRECRAWL_FIELD_GUIDE,
  type: 'PointCast editorial field guide',
  whatFirecrawlIs: {
    summary: 'An open-source web data API that can search, map, scrape, crawl, render, interact with, and extract structured context from modern web pages.',
    interesting: FIRECRAWL_INTEREST,
    setup: FIRECRAWL_SETUP,
    relationship: 'Independent editorial coverage. PointCast has no sponsorship, partnership, or financial relationship with Firecrawl.',
  },
  crawlModel: CRAWL_STAGES,
  history: HISTORY,
  lenses: LENSES,
  crawlCompact: CRAWL_COMPACT,
  boundaries: BOUNDARIES,
  sourceLedger: SOURCE_LEDGER,
  interaction: {
    humanOnly: true,
    kind: 'bounded browser-local crawl trace and eight-lens selector',
    networkRequests: false,
    arbitraryExecution: false,
    storage: false,
    cookies: false,
    analytics: false,
    identity: false,
  },
  methodology: {
    checkedAt: '2026-08-02T10:20:00-07:00',
    sourcePolicy: 'Primary and official sources wherever possible. Product claims use Firecrawl-owned documentation or repository material. Historical claims use standards bodies, project pages, original papers, or official archives.',
    legalPolicy: 'The linked hiQ opinion is treated only as one narrow U.S. preliminary-injunction dispute involving public profile pages, not as a universal scraping rule or legal advice.',
    inferencePolicy: 'PointCast synthesis is kept in editorial thesis, lens arguments, and compact obligations; it is not represented as a statement by the cited sources.',
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
    Link: '<https://pointcast.xyz/firecrawl>; rel="alternate"; type="text/html"',
  },
});
