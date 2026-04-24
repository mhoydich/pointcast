/**
 * /lotto.json — agent manifest for Compute Lotto.
 *
 * Schema: pointcast-lotto-v0. CORS open, 15s cache. Works in both
 * origination states.
 */
import type { APIRoute } from 'astro';
import contracts from '../data/contracts.json';

// Keep this static until the live lotto contract is deployed or moved to a
// Cloudflare Pages Function. The repo currently has no Astro SSR adapter.
export const prerender = true;

export const GET: APIRoute = async () => {
  const lotto = (contracts as Record<string, unknown>).compute_lotto as
    | { base?: string; base_sepolia?: string }
    | undefined;
  const mainnetAddr = lotto?.base ?? '';
  const sepoliaAddr = lotto?.base_sepolia ?? '';
  const network: 'mainnet' | 'sepolia' = mainnetAddr ? 'mainnet' : 'sepolia';
  const contractAddr = mainnetAddr || sepoliaAddr;

  const base = {
    schema: 'pointcast-lotto-v0',
    host: 'pointcast.xyz',
    generated_at: new Date().toISOString(),
    chain: network === 'mainnet' ? 'base' : 'base-sepolia',
    contract: contractAddr || null,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    docs: {
      block: 'https://pointcast.xyz/b/0400',
      research: 'https://github.com/mhoydich/pointcast/blob/main/docs/research/2026-04-21-ethereum-lottery.md',
      brief: 'https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-21-compute-lotto-spec.md',
      contract_source: 'https://github.com/mhoydich/pointcast/blob/main/contracts/v2/compute_lotto.sol',
    },
    x402: {
      facilitator_endpoint: 'https://pointcast.xyz/.well-known/x402/compute-lotto.json',
      description:
        'HTTP 402 facilitator for agent ticket entries. Any valid 402 payment registers an agent-class ticket on-chain via the facilitator relayer.',
    },
    prize_rails: {
      human: 'USDC paid out on settle to a single VRF-drawn human entrant',
      agent: 'Compute credits accrued on-contract to a single VRF-drawn agent entrant. Redemption flow ships with compute-ledger v1.',
    },
  };

  if (!contractAddr) {
    return new Response(
      JSON.stringify(
        { ...base, status: 'not-deployed', note: 'Contract pending deploy. See docs for v0 scope.' },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      },
    );
  }

  return new Response(
    JSON.stringify(
      {
        ...base,
        status: 'configured',
        note:
          'Contract address is configured, but live reads are disabled in the static build until viem is installed or this route moves to a Cloudflare Pages Function.',
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    },
  );
};
