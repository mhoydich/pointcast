import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    name: 'Network El Segundo',
    status: 'participant-roster-live',
    canonicalUrl: 'https://pointcast.xyz/network-el-segundo',
    releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/',
    participantCounter: 'https://pointcast.xyz/api/network-el-segundo/participants',
    participantCounterSource: 'https://network-el-segundo.mhoydich.chatgpt.site/api/participants',
    publicFunnel: 'https://pointcast.xyz/api/network-el-segundo/funnel?days=7',
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
    relayKit: {
      human: 'https://pointcast.xyz/network-el-segundo/share',
      rule: 'One verified participant invites one Tezos artist, collector, builder, or curious friend.',
      oneToOne: 'Join Network El Segundo\'s first 100 verified Tezos wallets with one free Kukai message signature. No purchase, mint, funding, or transaction is required: https://pointcast.xyz/network-el-segundo',
      social: 'Network El Segundo is forming a public first 100: one free Kukai wallet signature, no purchase or transaction. Join, move the transparent counter, then invite one Tezos person: https://pointcast.xyz/network-el-segundo #Tezos #TezosArt',
      image: 'https://network-el-segundo.mhoydich.chatgpt.site/og.png',
      tags: ['Tezos', 'TezosArt', 'Kukai', 'cryptoart', 'participatory art'],
      ecosystemRooms: [
        {
          name: 'Tezos community directory',
          url: 'https://tezos.com/community',
          why: 'Official directory for Tezos X, Telegram, Discord, Reddit, YouTube, and community support.',
        },
        {
          name: 'objkt collector network',
          url: 'https://docs.objkt.com/product/getting-started/readme/collector-starter-guide',
          why: 'Official collector guide identifies objkt social discovery and @objktcom as active art-community paths.',
        },
        {
          name: 'Teia Community',
          url: 'https://blog.teia.art/about',
          why: 'Open-source Tezos art community with public social and community links.',
        },
      ],
      etiquette: 'Participate in context and ask for one free signature; do not mass-tag, promise returns, or describe the prototype payout rule as live.',
    },
    funnelMethodology: {
      events: ['landing', 'join', 'relay', 'copy', 'email', 'x', 'tezos_rooms'],
      identifiersStored: false,
      caveat: 'Browser events are not unique people; verified participation is proven only by the deduplicated signed-wallet counter.',
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
