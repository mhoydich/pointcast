import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const payload = {
    name: 'Network El Segundo',
    status: 'living-signal-live',
    canonicalUrl: 'https://pointcast.xyz/network-el-segundo',
    joinUrl: 'https://pointcast.xyz/auth/project?target=network-el-segundo&return_to=https%3A%2F%2Fnetwork-el-segundo.mhoydich.chatgpt.site%2F&source=direct',
    releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/',
    participantCounter: 'https://pointcast.xyz/api/network-el-segundo/participants',
    participantCounterSource: 'https://network-el-segundo.mhoydich.chatgpt.site/api/participants',
    publicFunnel: 'https://pointcast.xyz/api/network-el-segundo/funnel?days=7',
    targetVerifiedWallets: 100,
    livingArtwork: {
      name: 'The First 100 Signal',
      url: 'https://network-el-segundo.mhoydich.chatgpt.site/#signal',
      rule: 'Each unique verified Tezos Mainnet wallet turns on one of 100 public lights.',
      refreshSeconds: 30,
      walletAddressesDisplayed: false,
      participantProof: 'Deduplicated public count only',
    },
    latestEdition: 'field-note-003',
    editions: [
      {
        id: 'signal-001',
        name: 'The First 100 Signal',
        canonicalUrl: 'https://pointcast.xyz/network-el-segundo',
        releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/#signal',
        form: 'One hundred radial lights',
        status: 'live',
      },
      {
        id: 'signal-002',
        name: '100 Windows',
        canonicalUrl: 'https://pointcast.xyz/network-el-segundo/v2',
        releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/v2',
        form: 'Ten-by-ten interactive nighttime window wall',
        localInteraction: 'Touch any window to send a visual pulse without changing the public roster.',
        shareImage: 'https://network-el-segundo.mhoydich.chatgpt.site/og-v2.png',
        status: 'live',
      },
      {
        id: 'field-note-003',
        name: 'Local Signal Field Kit',
        canonicalUrl: 'https://pointcast.xyz/network-el-segundo/field-kit',
        machineUrl: 'https://pointcast.xyz/network-el-segundo/field-kit.json',
        releaseUrl: 'https://network-el-segundo.mhoydich.chatgpt.site/field-kit',
        form: 'Eight product briefs, four shared signals, and a three-phase El Segundo rollout map',
        localInteraction: 'Choose products and signal codes, switch among 8, 16, and 24-node rollout phases, and run user-triggered light and low-volume audio rehearsals.',
        shareImage: 'https://network-el-segundo.mhoydich.chatgpt.site/og-field-kit.png',
        signedBy: 'MH',
        status: 'concept-system-published',
      },
    ],
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
      oneToOne: 'Turn on one light in Network El Segundo\'s First 100 Signal with a free Kukai message signature. No purchase, mint, funding, or transaction is required: https://pointcast.xyz/auth/project?target=network-el-segundo&return_to=https%3A%2F%2Fnetwork-el-segundo.mhoydich.chatgpt.site%2F&source=share_kit',
      social: 'Every verified wallet turns on one light in Network El Segundo’s First 100 Signal. Join with one free Kukai signature, zero tez, then transmit the signal to one Tezos person: https://pointcast.xyz/auth/project?target=network-el-segundo&return_to=https%3A%2F%2Fnetwork-el-segundo.mhoydich.chatgpt.site%2F&source=share_kit #Tezos #TezosArt',
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
      boundedSources: ['pointcast_home', 'pointcast_strip', 'pointcast_ad', 'pointcast_block', 'industrynext', 'allworthy', 'passportz', 'rally', 'common_hours', 'wordpress', 'tumblr', 'press', 'share_kit', 'participant_relay', 'tezos_discord', 'tezos_agora', 'teia', 'objkt', 'direct', 'other', 'legacy'],
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
