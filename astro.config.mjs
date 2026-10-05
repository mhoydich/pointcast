// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { normalizeGeneratedSeo } from './src/lib/seo-build.mjs';
import { isNoindexPath, isRedirectPath } from './src/lib/seo-rules.mjs';

const githubPages = process.env.POINTCAST_GITHUB_PAGES === '1';
// The bespoke discovery and Block sitemaps own these routes. Deriving the
// literal portion from their source keeps the auto sitemap disjoint without
// maintaining a second 300-entry hand list here.
const discoverySitemapSource = readFileSync(new URL('./src/pages/sitemap-discovery.xml.ts', import.meta.url), 'utf8');
const discoveryStaticPaths = new Set([...discoverySitemapSource.matchAll(/\['https:\/\/pointcast\.xyz([^']+)'/g)]
  .map((match) => match[1].replace(/\/$/, '')));
const discoveryDynamicPrefixes = ['/paddles/', '/afterimage/', '/agents/', '/pairings/', '/products/', '/25/teams/', '/25/2029/', '/mascot-battler/'];
const isBespokeSitemapPath = (pathname) => {
  const normalized = pathname.replace(/\/$/, '');
  return normalized.startsWith('/b/') || discoveryStaticPaths.has(normalized) || discoveryDynamicPrefixes.some((prefix) => normalized.startsWith(prefix));
};

// Publication dates for routes that used to live only in sitemap-discovery.xml.
// sitemap-index.xml lists sitemap-0.xml, so prerendered HTML has to be here.
const SITEMAP_PUBLISHED = '2026-10-05T12:00:00.000Z';
const SITEMAP_DATED_PATHS = new Set([
  '/grok',
  '/sky-calls',
  '/prices',
  '/weather/world',
  '/case-studies/a-bots-visit',
  '/front-desk/agents',
]);

function sitemapLastmod(pageUrl) {
  const path = new URL(pageUrl).pathname.replace(/\/$/, '') || '/';
  const card = path.match(/^\/almanac\/(\d{4}-\d{2}-\d{2})$/);
  if (card) return new Date(`${card[1]}T12:00:00.000Z`);
  if (path === '/standards' || path.startsWith('/standards/')) return new Date(SITEMAP_PUBLISHED);
  if (SITEMAP_DATED_PATHS.has(path)) return new Date(SITEMAP_PUBLISHED);
  return undefined;
}

// https://astro.build/config
export default defineConfig({
  site: githubPages ? 'https://mhoydich.github.io' : 'https://pointcast.xyz',
  ...(githubPages ? { base: '/pointcast' } : {}),
  // publicDir stays the default ./public. On 2026-07-11 a nightly-automation
  // commit (369554e4) pointed it at an empty tmp dir, which silently dropped
  // the entire public/ tree — games, _redirects, decks, static .well-known —
  // from every deploy for two weeks. Do not point this at scratch paths.
  integrations: [
    sitemap({
      // Do not advertise retired URLs that Pages permanently redirects. This
      // mirrors public/_redirects and functions/_middleware.ts.
      filter: (page) => {
        const path = new URL(page).pathname;
        return !isNoindexPath(path) && !isRedirectPath(path) && !isBespokeSitemapPath(path);
      },
      // customPages is filtered by the same function, so it cannot resurrect a
      // path still listed in sitemap-discovery.xml.ts. Those HTML routes were
      // removed from the discovery list and fall through here as real pages.
      serialize(item) {
        const lastmod = sitemapLastmod(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    {
      name: 'pointcast-on-page-seo',
      hooks: {
        'astro:build:generated': ({ dir, logger }) => normalizeGeneratedSeo(dir, logger),
      },
    },
  ],
  markdown: {
    syntaxHighlight: false,
  },
  vite: {
    plugins: [
      // Taquito + its Beacon stack reference Node globals (process, Buffer,
      // etc.) that don't exist in the browser. Polyfill them so the on-chain
      // mint flow runs cleanly without "process is not defined" errors.
      nodePolyfills({
        // Taquito's browser bundles use Web Crypto directly. Polyfilling the
        // Node `crypto` module pulls crypto-browserify/randomfill into the
        // signer chunk and leaks CommonJS `exports` at runtime.
        include: ['buffer', 'process', 'util', 'stream', 'events'],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: false,
      }),
      tailwindcss(),
    ],
    define: {
      // Belt-and-suspenders — some libs check this at module load time.
      'process.env.NODE_ENV': JSON.stringify('production'),
      // readable-stream 3 checks these legacy browser shims while Taquito loads.
      // The process polyfill intentionally omits `version`, so make the browser
      // branch explicit and provide a harmless fallback for nested dependencies.
      'process.browser': 'true',
      'process.version': JSON.stringify('v22.0.0'),
      // Absolute public dir for src/lib/og-version.mjs — the process polyfill
      // above makes process.cwd() unreliable inside the production SSR bundle.
      __PC_PUBLIC_DIR__: JSON.stringify(fileURLToPath(new URL('./public', import.meta.url))),
    },
  },
});
