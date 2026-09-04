import type { APIRoute } from 'astro';
import {
  FAUCETS,
  FAUCET_CANONICAL,
  FAUCET_DEFAULT_DAILY_CAP,
  FAUCET_SPEC,
  FAUCET_STEPS,
  explorerTokenUrl,
} from '../../lib/faucet';

/**
 * /faucet.json — the faucet, as data. Static shape; the live counters and
 * the per-account ledger are at /api/faucet/{slug}, decided at request time.
 */
export const GET: APIRoute = () => {
  const payload = {
    spec: FAUCET_SPEC,
    name: 'The PointCast Faucet',
    url: FAUCET_CANONICAL,
    summary: 'A 2018-style token faucet with 2026 onboarding: claim with a PointCast account, no wallet; PointCast holds the drip in a ledger; paste any Ethereum address later and the spigot wallet sends what you are owed and pays the gas. Nobody signs anything.',
    resets: 'midnight America/Los_Angeles',
    dailyCapDefault: FAUCET_DEFAULT_DAILY_CAP,
    steps: FAUCET_STEPS,
    faucets: FAUCETS.map((faucet) => ({
      slug: faucet.slug,
      name: faucet.name,
      ticker: faucet.ticker,
      chain: faucet.chain,
      chainId: faucet.chainId,
      contract: faucet.contract,
      deployedYear: faucet.deployedYear,
      dailyAmount: faucet.dailyAmount,
      greeting: faucet.greeting,
      explorer: explorerTokenUrl(faucet),
      legacy: `https://pointcast.xyz${faucet.legacyHref}`,
      live: `https://pointcast.xyz/api/faucet/${faucet.slug}`,
      claim: { method: 'POST', url: `https://pointcast.xyz/api/faucet/${faucet.slug}/claim`, auth: 'PointCast session cookie' },
      deliver: { method: 'POST', url: `https://pointcast.xyz/api/faucet/${faucet.slug}/deliver`, body: { address: '0x…' }, auth: 'PointCast session cookie' },
    })),
    value: 'none, by design',
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
