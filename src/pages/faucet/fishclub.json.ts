import type { APIRoute } from 'astro';
import {
  FAUCET_DEFAULT_DAILY_CAP,
  FAUCET_SPEC,
  explorerTokenUrl,
  getFaucet,
} from '../../lib/faucet';
import { rewardProgramsForFaucet } from '../../lib/rewards';

/**
 * /faucet/fishclub.json — the FISHCLUB desk, as data.
 *
 * Static shape. Live counters and the per-account ledger are at
 * /api/faucet/fishclub, decided at request time. The reward program is listed
 * so an agent can see that this token has no daily button: it is earned by a
 * five minute run on Tone Bloom and claimed with a signed receipt.
 */
export const GET: APIRoute = () => {
  const faucet = getFaucet('fishclub')!;
  const payload = {
    spec: FAUCET_SPEC,
    name: 'FISHCLUB · the PointCast faucet',
    url: 'https://pointcast.xyz/faucet/fishclub',
    summary: 'One FISHCLUB for five credited minutes in the Fish Club room on Tone Bloom. Claim it with a PointCast account, no wallet and nothing to sign. Listening without an account is free and earns nothing, which is the point.',
    resets: 'midnight America/Los_Angeles',
    dailyCapDefault: FAUCET_DEFAULT_DAILY_CAP,
    faucet: {
      slug: faucet.slug,
      name: faucet.name,
      ticker: faucet.ticker,
      chain: faucet.chain,
      chainId: faucet.chainId,
      contract: faucet.contract,
      deployedYear: faucet.deployedYear,
      dailyAmount: faucet.dailyAmount,
      greeting: faucet.greeting,
      claim: faucet.claim,
      explorer: explorerTokenUrl(faucet),
      legacy: `https://pointcast.xyz${faucet.legacyHref}`,
      live: 'https://pointcast.xyz/api/faucet/fishclub',
    },
    programs: rewardProgramsForFaucet(faucet.slug).map((program) => ({
      id: program.id,
      issuer: program.issuer,
      start: `https://pointcast.xyz/rewards/start?program=${program.id}`,
      minCreditedSeconds: program.minCreditedSeconds,
      protocol: 'https://pointcast.xyz/docs/plans/2026-09-05-rewards-protocol.md',
    })),
    claim: {
      method: 'POST',
      url: 'https://pointcast.xyz/api/faucet/fishclub/claim',
      body: { receipt: 'v1.<base64url payload>.<base64url hmac>' },
      auth: 'PointCast session cookie',
      note: 'A signed completion receipt is required. There is no daily button for this token.',
    },
    deliver: {
      method: 'POST',
      url: 'https://pointcast.xyz/api/faucet/fishclub/deliver',
      body: { address: '0x…' },
      auth: 'PointCast session cookie',
      note: 'Closed for every faucet until the first watched send.',
    },
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
