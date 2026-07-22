import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    name: 'Network El Segundo',
    status: 'participant-roster-live',
    canonicalUrl: 'https://pointcast.xyz/network-el-segundo',
    releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/',
    participantCounter: 'https://pointcast.xyz/api/network-el-segundo/participants',
    participantCounterSource: 'https://network-el-segundo.mhoydich.chatgpt.site/api/participants',
    targetVerifiedWallets: 100,
    authentication: {
      network: 'Tezos Mainnet',
      wallet: 'Kukai-compatible Beacon message signature',
      custodial: false,
      transactionRequired: false,
      purchaseRequired: false,
    },
    proposedRule: {
      saleDistributionList: 'A wallet completing a future qualifying art purchase would join the distribution list.',
      participantSharePercent: 50,
      timing: 'Reserved for eligible participant wallets after each recorded sale.',
      liveSaleContract: false,
      livePayoutContract: false,
      tokenLive: false,
      returnPromised: false,
    },
    pressRelease: 'https://pointcast.xyz/press/network-el-segundo-opens-first-100-tezos-wallet-roster',
    campaignReceipt: 'https://pointcast.xyz/ads.json',
    disclosure: 'The verified-wallet roster and public counter are live. Sale settlement, automated participant distribution, and any yield mechanism are prototypes and must not be represented as live.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
