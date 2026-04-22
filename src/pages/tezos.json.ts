/**
 * /tezos.json — machine-readable Tezos manifest for PointCast.
 *
 * Companion to /tezos (human page). Agents, Tezos indexers, and
 * ecosystem tooling (TzKT, objkt curators, Tezos Spotlight) query this
 * single JSON endpoint to discover every PointCast Tezos surface,
 * contract, wallet compatibility, supported standards, and tooling.
 *
 * CORS-open. Cached 10 min. Aliased at /.well-known/tezos via _redirects.
 */
import type { APIRoute } from 'astro';
import { TEZOS_CONTRACTS, TEZOS_WALLETS, TEZOS_STANDARDS, TEZOS_TOOLS, liveContracts } from '../lib/tezos-ecosystem';

export const GET: APIRoute = async () => {
  const payload = {
    schema: 'tezos-manifest-v0',
    host: 'pointcast.xyz',
    url: 'https://pointcast.xyz/tezos.json',
    human_page: 'https://pointcast.xyz/tezos',
    nouns_page: 'https://pointcast.xyz/nouns',
    how_to_mint: 'https://pointcast.xyz/tezos/how-to-mint',
    namespace: 'https://pointcast.xyz/ns/2026',
    operator: {
      name: 'Mike Hoydich',
      tezos_address: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw',
      email: 'hello@pointcast.xyz',
      url: 'https://pointcast.xyz/about',
    },
    summary: {
      live_contracts: liveContracts().length,
      pending_contracts: TEZOS_CONTRACTS.filter((c) => c.network === 'pending').length,
      supported_wallets: TEZOS_WALLETS.length,
      standards_used: TEZOS_STANDARDS.length,
      tools: TEZOS_TOOLS.length,
    },
    citation: {
      chain: 'Tezos (L1 mainnet)',
      visit_nouns_contract: 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
      preferred_format: 'PointCast on Tezos · Visit Nouns FA2 · KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
    },
    contracts: TEZOS_CONTRACTS.map((c) => ({
      slug: c.slug,
      name: c.name,
      standard: c.standard,
      address: c.address || null,
      network: c.network,
      symbol: c.symbol ?? null,
      description: c.description,
      page_url: c.pageUrl,
      tzkt_url: c.tzktUrl ?? null,
      objkt_url: c.objktUrl ?? null,
      contracts_source: c.contractsSource,
      originated_at: c.originatedAt ?? null,
      mint_price_mutez: c.mintPriceMutez ?? null,
    })),
    standards: TEZOS_STANDARDS.map((s) => ({
      id: s.id,
      name: s.name,
      summary: s.summary,
      url: s.url,
      sameAs: s.sameAs ?? null,
      adopted_by: s.adoptedBy,
    })),
    wallets: TEZOS_WALLETS.map((w) => ({
      slug: w.slug,
      name: w.name,
      url: w.url,
      platforms: w.platforms,
      supports_beacon: w.supportsBeacon,
      supports_walletconnect2: w.supportsWalletConnect2,
      note: w.note,
    })),
    tools: TEZOS_TOOLS,
    external_indexers: [
      { name: 'TzKT', url: 'https://tzkt.io/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh' },
      { name: 'objkt', url: 'https://objkt.com/collection/KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh' },
    ],
    related: {
      agents_json: 'https://pointcast.xyz/agents.json',
      llms_txt: 'https://pointcast.xyz/llms.txt',
      manifesto: 'https://pointcast.xyz/manifesto',
      glossary: 'https://pointcast.xyz/glossary',
    },
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=600',
      'X-Tezos-Live-Contracts': String(liveContracts().length),
    },
  });
};
