/**
 * /ai-income.json — machine-readable version of the AI income field guide.
 * Same routes as /ai-income, structured for programmatic consumption.
 */
import type { APIRoute } from 'astro';

const LANES = [
  { key: 'expert',   title: 'Sell your judgment to the labs' },
  { key: 'queue',    title: 'The generalist queue' },
  { key: 'build',    title: 'Build with it' },
  { key: 'services', title: 'Sell services, amplified' },
  { key: 'content',  title: 'Sell what it makes' },
  { key: 'teach',    title: 'Teach it' },
  { key: 'agents',   title: 'Get paid by the agents' },
];

const ROUTES = [
  { name: 'micro1',                     operator: 'micro1',            lane: 'expert',   tier: 'selective', pay: '$15-200+/hr by tier; ~$72/hr listing average',        url: 'https://www.micro1.ai/experts' },
  { name: 'Mercor',                     operator: 'Mercor',            lane: 'expert',   tier: 'selective', pay: '$40-250+/hr; top US experts $100k-400k/yr part-time', url: 'https://www.mercor.com' },
  { name: 'Handshake AI (MOVE)',        operator: 'Handshake',         lane: 'expert',   tier: 'selective', pay: '$40-125/hr posted; $175-300/hr MD/JD ceilings; US-only', url: 'https://joinhandshake.com/ai' },
  { name: 'Surge AI',                   operator: 'Surge AI',          lane: 'expert',   tier: 'selective', pay: '$18-62/hr vetted; invite-gated',                       url: 'https://www.surgehq.ai' },
  { name: 'Turing',                     operator: 'Turing',            lane: 'expert',   tier: 'pays-now',  pay: '$15-40/hr tasks; ~$39/hr trainer average; global-friendly', url: 'https://www.turing.com' },
  { name: 'Pareto.ai',                  operator: 'Pareto',            lane: 'expert',   tier: 'selective', pay: '$35-60/hr; approved-hours review gate',                url: 'https://pareto.ai/experts' },
  { name: 'Snorkel expert community',   operator: 'Snorkel AI',        lane: 'expert',   tier: 'selective', pay: '$10-100 per accepted task',                            url: 'https://snorkel.ai/expert-community/' },
  { name: 'Alignerr',                   operator: 'Labelbox',          lane: 'expert',   tier: 'long-odds', pay: 'advertised to $150/hr; reported $15-60/hr; empty boards', url: 'https://www.alignerr.com' },
  { name: 'Lab-direct red teaming',     operator: 'labs/consultancies', lane: 'expert',  tier: 'long-odds', pay: 'per-engagement; small and shrinking',                  url: 'https://openai.com/index/red-teaming-network/' },
  { name: 'DataAnnotation.tech',        operator: 'Surge ecosystem',   lane: 'queue',    tier: 'pays-now',  pay: '$14-25/hr reliable; $30-40 specialist projects',       url: 'https://www.dataannotation.tech' },
  { name: 'Outlier',                    operator: 'Scale AI',          lane: 'queue',    tier: 'pays-now',  pay: '$15-56/hr; empty-queue risk; rates down YoY',          url: 'https://outlier.ai' },
  { name: 'Prolific',                   operator: 'Prolific',          lane: 'queue',    tier: 'pays-now',  pay: '$8/hr enforced floor; AI-tasker studies $20-40/hr',    url: 'https://www.prolific.com' },
  { name: 'Toloka / Mindrift',          operator: 'Toloka',            lane: 'queue',    tier: 'pays-now',  pay: '$1-6/hr base to ~$44/hr expert average; multilingual door', url: 'https://mindrift.ai' },
  { name: 'Appen',                      operator: 'Appen',             lane: 'queue',    tier: 'long-odds', pay: '$2.50-14/hr micro-tasks; $20-40 evaluator roles',      url: 'https://www.appen.com' },
  { name: 'Micro-SaaS & indie apps',    operator: 'independent',       lane: 'build',    tier: 'long-odds', pay: 'median subscription app $492/mo; outliers $20k-130k+/mo' },
  { name: 'Selling to the builders',    operator: 'independent',       lane: 'build',    tier: 'selective', pay: 'audience-first portfolios to $90k/mo; near zero without' },
  { name: 'AI-fluent freelancing',      operator: 'Upwork/Fiverr/direct', lane: 'services', tier: 'pays-now', pay: '+34%/hr for AI work; established $4-10k/mo' },
  { name: 'Automation consulting',      operator: 'independent',       lane: 'services', tier: 'selective', pay: 'projects $500-15k; solo operators $10-30k/mo revenue' },
  { name: 'Faceless video channels',    operator: 'YouTube/TikTok',    lane: 'content',  tier: 'long-odds', pay: 'survivors $1k-50k/mo as production businesses' },
  { name: 'AI music',                   operator: 'Suno/Udio to DSPs', lane: 'content',  tier: 'early',     pay: '$0-low hundreds per track/mo; legal ground still moving' },
  { name: 'KDP ebooks',                 operator: 'Amazon',            lane: 'content',  tier: 'long-odds', pay: 'median approximately $0 without marketing' },
  { name: 'Stock images',               operator: 'Adobe Stock',       lane: 'content',  tier: 'long-odds', pay: 'cents-to-dollars per license against a 29M-images/mo glut' },
  { name: 'Print-on-demand & Etsy',     operator: 'Etsy et al.',       lane: 'content',  tier: 'long-odds', pay: 'niche operators $500-3k/mo; most under $100/mo' },
  { name: 'Corporate workshops',        operator: 'direct',            lane: 'teach',    tier: 'pays-now',  pay: 'half-day $3-8k; full-day $6-15k; trainers $3-40k/mo' },
  { name: 'AI consulting / fractional CAIO', operator: 'direct',       lane: 'teach',    tier: 'selective', pay: '$80-300/hr; fractional $5-30k/mo per client' },
  { name: 'Cohort courses',             operator: 'Maven et al.',      lane: 'teach',    tier: 'selective', pay: '~$12k average per cohort; instructor keeps 90%' },
  { name: 'Apify actors',               operator: 'Apify',             lane: 'agents',   tier: 'pays-now',  pay: '80% share; ~$1.2M/mo total developer payouts',         url: 'https://apify.com' },
  { name: 'Metered MCP servers',        operator: 'various hosts',     lane: 'agents',   tier: 'early',     pay: '<5% of 20k+ servers ever earned a dollar; mode $0' },
  { name: 'x402 & crawl fees',          operator: 'Coinbase/Cloudflare', lane: 'agents', tier: 'early',     pay: '100M+ transactions, cent-sized payments; payouts small', url: 'https://www.x402.org' },
];

export const GET: APIRoute = async () => {
  const tierCounts: Record<string, number> = {};
  for (const r of ROUTES) tierCounts[r.tier] = (tierCounts[r.tier] ?? 0) + 1;

  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    site: 'https://pointcast.xyz',
    researched: '2026-08-31',
    total: ROUTES.length,
    lanes: LANES,
    tierCounts,
    tiers: {
      'pays-now': 'documented payouts at scale; startable this month',
      selective: 'real money behind a high bar, vetting gate, or high variance',
      early: 'rails live, money thin',
      'long-odds': 'winners real, median roughly $0',
    },
    routes: ROUTES,
    thesis:
      'AI raises the ceiling for people with expertise or distribution, and lowers the floor for undifferentiated work. Complex work delivered with AI grew earnings 45% YoY on Upwork; simple gen-AI execution fell 13% per contract.',
    deflators: [
      'Median US side hustle: ~$200/month (Bankrate 2025).',
      'Median subscription app: $492/month, down 22% YoY; top 10% of apps take 94.5% of revenue (RevenueCat 2026).',
      'Frontier-lab human-data spend: an identifiable $5-6B/yr across Surge, Mercor, Handshake, Scale, micro1, Turing.',
    ],
    smellTest: [
      'Anyone charging you to apply.',
      'Guaranteed income, dashboard screenshots, first-name case studies.',
      'Courses about making money with AI — the course is the business.',
      'Anything that only works before everyone finds out.',
      'Plans that assume smooth income.',
    ],
    links: {
      human: 'https://pointcast.xyz/ai-income',
      tools: 'https://pointcast.xyz/ai-stack',
      register: 'https://pointcast.xyz/register',
      yard: 'https://pointcast.xyz/yard',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
