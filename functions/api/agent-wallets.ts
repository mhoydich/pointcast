import { ensureAgentWallets, type AgentWalletEnv } from '../_lib/agent-wallets';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=60',
};

// GET /api/agent-wallets — the public directory of PointCast agent wallets.
// Creates any wallet the roster lists but the database does not yet hold.
export const onRequestGet: PagesFunction<AgentWalletEnv> = async ({ env }) => {
  try {
    const wallets = await ensureAgentWallets(env);
    return new Response(JSON.stringify({
      network: 'mainnet',
      count: wallets.length,
      note: 'Public addresses only. Keys are held server-side by PointCast; no endpoint returns them.',
      wallets: wallets.map((wallet) => ({
        ...wallet,
        tzkt: `https://tzkt.io/${wallet.address}`,
        objkt: `https://objkt.com/profile/${wallet.address}`,
      })),
    }, null, 2), { headers: HEADERS });
  } catch (error) {
    // Fixed public code: dependency messages (D1, Web Crypto, Taquito) stay in the server log.
    console.error('agent-wallets-unavailable', error instanceof Error ? error.name : 'unknown');
    return new Response(JSON.stringify({ error: 'agent-wallets-unavailable' }), {
      status: 503,
      headers: { ...HEADERS, 'cache-control': 'no-store' },
    });
  }
};

export const onRequestOptions: PagesFunction = () => new Response(null, { status: 204, headers: HEADERS });
