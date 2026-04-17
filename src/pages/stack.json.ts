/**
 * /stack.json — technical disclosure as structured data.
 *
 * Mirrors /stack for agents that want to reason about the tech stack
 * programmatically (e.g., "which sites use SmartPy?", "how is this
 * hosted?", "what wallets does it support?").
 */
import type { APIRoute } from 'astro';

const LAYERS = [
  {
    code: 'RT',
    name: 'Runtime',
    note: 'Static site compiled once, served from the edge.',
    items: [
      { name: 'Astro', version: '6.1', url: 'https://astro.build', role: 'static-site framework' },
      { name: 'Cloudflare Pages', url: 'https://pages.cloudflare.com', role: 'static hosting + edge functions' },
      { name: 'Vite', url: 'https://vitejs.dev', role: 'bundler' },
      { name: 'TypeScript', url: 'https://www.typescriptlang.org', role: 'types' },
    ],
  },
  {
    code: 'CT',
    name: 'Content',
    note: 'Every block is a JSON file in src/content/blocks/.',
    items: [
      { name: 'Astro Content Collections', role: 'typed content layer' },
      { name: 'Markdown', role: 'long-form body format' },
      { name: 'Inter (Variable)', url: 'https://rsms.me/inter/', role: 'sans-serif' },
      { name: 'JetBrains Mono (Variable)', url: 'https://www.jetbrains.com/lp/mono/', role: 'monospace' },
    ],
  },
  {
    code: 'TZ',
    name: 'On-chain (Tezos)',
    note: 'Free mainnet FA2 for Visit Nouns; FA1.2 DRUM + Prize Cast in development.',
    items: [
      { name: 'SmartPy', version: '0.24', url: 'https://smartpy.io', role: 'contract language' },
      { name: 'Taquito', version: '24.2', url: 'https://tezostaquito.io', role: 'Tezos JS SDK' },
      { name: 'Beacon SDK', version: '24.2', url: 'https://walletbeacon.io', role: 'wallet connector' },
      { name: 'TzKT', url: 'https://tzkt.io', role: 'indexer + REST API' },
      { name: 'objkt.com', url: 'https://objkt.com', role: 'marketplace' },
      { name: 'noun.pics', url: 'https://noun.pics', role: 'CC0 Nouns avatars' },
    ],
  },
  {
    code: 'AG',
    name: 'Agent layer',
    items: [
      { name: '/agents.json', url: 'https://pointcast.xyz/agents.json', role: 'discovery manifest' },
      { name: 'JSON Feed v1.1', url: 'https://pointcast.xyz/feed.json', role: 'standards feed' },
      { name: 'JSON-LD (schema.org)', url: 'https://schema.org', role: 'inline structured data' },
      { name: 'Stripped HTML mode', role: 'UA-based CSS/JS strip at the edge' },
      { name: 'llms.txt', url: 'https://pointcast.xyz/llms.txt', role: 'LLM summary' },
    ],
  },
];

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    site: 'https://pointcast.xyz',
    layers: LAYERS,
    source: 'https://github.com/MikeHoydich/pointcast',
    humanUrl: 'https://pointcast.xyz/stack',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
