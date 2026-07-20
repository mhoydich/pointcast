/**
 * observatory-seeds.mjs — the starting roster for the Agent-Web Observatory.
 *
 * The Observatory is a fully autonomous census of the agent-readable web:
 * which sites publish llms.txt, agents.json, .well-known/ai.json,
 * agent-payments discovery, AI-crawler robots stanzas, and machine feeds.
 * The scanner Worker (workers/observatory/) walks this roster daily.
 *
 * Three domain sources, in trust order:
 *   seed  — this curated list. Hand-picked, category-tagged.
 *   visit — operators of AI crawlers observed hitting pointcast.xyz
 *           (VISITS KV types mapped through CRAWLER_OPERATOR_DOMAINS).
 *   hop   — domains linked from a scanned site's valid agents.json
 *           (strict one-hop: hop domains never expand further).
 *
 * pointcast.xyz rides along as a control row — it publishes every surface
 * the rubric scores, so a healthy pipeline shows it at ~100 every day.
 * If the control row drops, the scanner is broken, not the site.
 */

import { OBSERVATORY_UA_TOKEN } from './observatory-score.mjs';

/** UA the scanner identifies itself with on every probe. Built from the
 *  same token the robots opt-out parser matches, so the string operators
 *  see in their logs is always the string that opts them out. */
export const OBSERVATORY_UA =
  `ai:${OBSERVATORY_UA_TOKEN} (+https://pointcast.xyz/agent-observatory)`;

/** Roster ceilings — the census stays small enough to scan daily. */
export const MAX_DOMAINS = 300;
export const MAX_DISCOVERED = 100;
export const MAX_HOPS_PER_SCAN = 3;

/**
 * Visit-log crawler type → the operator's apex domain. Same mapping the
 * reciprocal-crawl script uses, reduced to registrable domains so the
 * scanner probes where robots.txt + llms.txt actually live.
 */
export const CRAWLER_OPERATOR_DOMAINS = {
  'ai:openai': 'openai.com',
  'ai:anthropic': 'anthropic.com',
  'ai:perplexity': 'perplexity.ai',
  'ai:google': 'google.com',
  'ai:meta': 'meta.com',
  'ai:cohere': 'cohere.com',
  'ai:mistral': 'mistral.ai',
  'ai:bytedance': 'bytedance.com',
  'ai:commoncrawl': 'commoncrawl.org',
  'ai:you': 'you.com',
};

/**
 * The curated seed roster. Categories:
 *   control      — pointcast.xyz itself, the end-to-end pipeline check
 *   ai-lab       — model + agent companies (the ones running the crawlers)
 *   publisher    — mainstream media (the ones being crawled)
 *   dev-tool     — infrastructure and developer platforms
 *   agent-native — sites and projects betting on agent-readable surfaces
 */
export const OBSERVATORY_SEEDS = [
  { domain: 'pointcast.xyz', category: 'control' },

  // ── ai-lab ──────────────────────────────────────────────────────────
  { domain: 'openai.com', category: 'ai-lab' },
  { domain: 'anthropic.com', category: 'ai-lab' },
  { domain: 'perplexity.ai', category: 'ai-lab' },
  { domain: 'mistral.ai', category: 'ai-lab' },
  { domain: 'cohere.com', category: 'ai-lab' },
  { domain: 'huggingface.co', category: 'ai-lab' },
  { domain: 'x.ai', category: 'ai-lab' },
  { domain: 'stability.ai', category: 'ai-lab' },
  { domain: 'together.ai', category: 'ai-lab' },
  { domain: 'groq.com', category: 'ai-lab' },
  { domain: 'replicate.com', category: 'ai-lab' },
  { domain: 'commoncrawl.org', category: 'ai-lab' },
  { domain: 'you.com', category: 'ai-lab' },

  // ── publisher ───────────────────────────────────────────────────────
  { domain: 'nytimes.com', category: 'publisher' },
  { domain: 'theverge.com', category: 'publisher' },
  { domain: 'arstechnica.com', category: 'publisher' },
  { domain: 'wired.com', category: 'publisher' },
  { domain: 'theguardian.com', category: 'publisher' },
  { domain: 'bbc.com', category: 'publisher' },
  { domain: 'reuters.com', category: 'publisher' },
  { domain: 'bloomberg.com', category: 'publisher' },
  { domain: 'washingtonpost.com', category: 'publisher' },
  { domain: 'economist.com', category: 'publisher' },
  { domain: 'ft.com', category: 'publisher' },
  { domain: 'axios.com', category: 'publisher' },
  { domain: 'techcrunch.com', category: 'publisher' },
  { domain: '404media.co', category: 'publisher' },
  { domain: 'theatlantic.com', category: 'publisher' },
  { domain: 'npr.org', category: 'publisher' },
  { domain: 'vox.com', category: 'publisher' },
  { domain: 'semafor.com', category: 'publisher' },

  // ── dev-tool ────────────────────────────────────────────────────────
  { domain: 'cloudflare.com', category: 'dev-tool' },
  { domain: 'vercel.com', category: 'dev-tool' },
  { domain: 'netlify.com', category: 'dev-tool' },
  { domain: 'github.com', category: 'dev-tool' },
  { domain: 'gitlab.com', category: 'dev-tool' },
  { domain: 'stripe.com', category: 'dev-tool' },
  { domain: 'shopify.com', category: 'dev-tool' },
  { domain: 'twilio.com', category: 'dev-tool' },
  { domain: 'supabase.com', category: 'dev-tool' },
  { domain: 'deno.com', category: 'dev-tool' },
  { domain: 'bun.sh', category: 'dev-tool' },
  { domain: 'astro.build', category: 'dev-tool' },
  { domain: 'npmjs.com', category: 'dev-tool' },
  { domain: 'pypi.org', category: 'dev-tool' },
  { domain: 'docker.com', category: 'dev-tool' },
  { domain: 'kubernetes.io', category: 'dev-tool' },
  { domain: 'tailwindcss.com', category: 'dev-tool' },
  { domain: 'sentry.io', category: 'dev-tool' },
  { domain: 'linear.app', category: 'dev-tool' },
  { domain: 'notion.so', category: 'dev-tool' },
  { domain: 'figma.com', category: 'dev-tool' },
  { domain: 'slack.com', category: 'dev-tool' },
  { domain: 'zapier.com', category: 'dev-tool' },

  // ── agent-native ────────────────────────────────────────────────────
  { domain: 'llmstxt.org', category: 'agent-native' },
  { domain: 'mintlify.com', category: 'agent-native' },
  { domain: 'readme.com', category: 'agent-native' },
  { domain: 'gitbook.com', category: 'agent-native' },
  { domain: 'langchain.com', category: 'agent-native' },
  { domain: 'llamaindex.ai', category: 'agent-native' },
  { domain: 'crewai.com', category: 'agent-native' },
  { domain: 'browserbase.com', category: 'agent-native' },
  { domain: 'e2b.dev', category: 'agent-native' },
  { domain: 'exa.ai', category: 'agent-native' },
  { domain: 'firecrawl.dev', category: 'agent-native' },
  { domain: 'tavily.com', category: 'agent-native' },
  { domain: 'zed.dev', category: 'agent-native' },
  { domain: 'cursor.com', category: 'agent-native' },
  { domain: 'sourcegraph.com', category: 'agent-native' },
  { domain: 'warp.dev', category: 'agent-native' },
  { domain: 'modelcontextprotocol.io', category: 'agent-native' },
];
