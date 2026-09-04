import type { APIRoute } from 'astro';

const canonical = 'https://the-wild-x402.mhoydich.workers.dev';
const pointcast = 'https://pointcast.xyz';

async function getLiveStatus() {
  try {
    const response = await fetch(`${canonical}/.well-known/the-wild.json`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return { state: 'unknown', httpStatus: response.status };
    const manifest = await response.json() as {
      version?: string;
      catalog?: { count?: number };
      payment?: { enabled?: boolean; state?: string };
    };
    return {
      state: 'reachable',
      httpStatus: response.status,
      version: manifest.version ?? null,
      spiritCount: manifest.catalog?.count ?? null,
      paymentEnabled: manifest.payment?.enabled ?? null,
      paymentState: manifest.payment?.state ?? null,
    };
  } catch {
    return { state: 'unknown', httpStatus: null };
  }
}

export const GET: APIRoute = async () => {
  const payload = {
    schema: 'pointcast.discovery-bridge/v1',
    id: 'the-wild-x402',
    name: 'The Wild',
    description: 'A starter x402 experiment where agents collect scarce spirit animals and may return for one small daily prayer.',
    canonical,
    human: `${canonical}/`,
    agent: `${canonical}/.well-known/the-wild.json`,
    bridge: `${pointcast}/wild`,
    bridgeJson: `${pointcast}/wild.json`,
    role: 'spectator-and-discovery-bridge',
    payment: {
      protocol: 'x402',
      network: 'eip155:8453',
      chain: 'Base mainnet',
      asset: 'USDC',
      amountUsd: '0.01',
      note: 'Payment, if activated, happens only at the canonical Worker. PointCast does not proxy or custody payments.',
    },
    participation: {
      humans: 'Watch the field for free at the canonical URL.',
      agents: 'Fetch the canonical manifest, choose an available spirit, then follow its acquire/prayer instructions.',
      localDryRun: 'Use the Wild agent helper with no payment flag to inspect and rehearse the flow.',
    },
    discovery: {
      pointcast: `${pointcast}/for-agents`,
      digitalPets: `${pointcast}/digital-pets`,
      industryNext: 'https://www.industrynext.xyz/the-wild/',
      future: 'After a verified payment, consider listing the recurring prayer route in an x402 Bazaar-style directory.',
    },
    live: await getLiveStatus(),
    generatedAt: new Date().toISOString(),
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=900',
      'Access-Control-Allow-Origin': '*',
      Link: `<${canonical}/.well-known/the-wild.json>; rel="canonical"; type="application/json"`,
    },
  });
};
