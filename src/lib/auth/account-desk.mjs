const TEZOS_PROVIDERS = new Set(['kukai', 'temple', 'umami']);

const PROVIDER_LABELS = {
  kukai: 'Kukai',
  google: 'Google',
  apple: 'Apple',
  metamask: 'MetaMask',
  phantom: 'Phantom',
  temple: 'Temple',
  umami: 'Umami',
};

function providerLabel(provider) {
  return PROVIDER_LABELS[provider] || provider;
}

/**
 * Build the single view model used by the /auth hero, circuit, and provider
 * cards. The session user is authoritative for account and identity state;
 * Spotify and Shopify responses only describe broadcaster integrations.
 *
 * @param {import('./types').PointCastUser | null} user
 * @param {{ spotify?: Record<string, any> | null, shopify?: Record<string, any> | null }} integrations
 */
export function buildAccountDeskView(user, integrations = {}) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const identityProviders = new Set(identities.map((identity) => identity.provider));
  const signedIn = Boolean(user);
  const broadcaster = Boolean(user?.roles?.includes('broadcaster'));
  const googleConnected = identityProviders.has('google');
  const tezosIdentities = identities.filter((identity) => TEZOS_PROVIDERS.has(identity.provider));
  const spotify = integrations.spotify || null;
  const shopify = integrations.shopify || null;
  const spotifyConnected = broadcaster && spotify?.connected === true;
  const shopifyConnected = broadcaster && shopify?.connected === true;
  const primaryProvider = googleConnected
    ? 'Google'
    : identities[0]
      ? providerLabel(identities[0].provider)
      : 'PointCast';

  let spotifyStatus = 'Sign in with Google, then authorize Spotify.';
  let spotifyAction = 'Sign in, then Spotify →';
  let spotifyHref = '/api/auth/google?returnTo=/auth';
  if (signedIn && !broadcaster) {
    spotifyStatus = spotify?.connected
      ? 'The public signal is on air. Broadcaster authorization is account-specific.'
      : 'Spotify authorization is reserved for the PointCast broadcaster.';
    spotifyAction = 'Read the Spotify signal →';
    spotifyHref = '/now-playing.json';
  } else if (broadcaster && spotifyConnected) {
    const title = spotify?.nowPlaying?.title || 'Spotify signal';
    const artist = spotify?.nowPlaying?.artist ? ` · ${spotify.nowPlaying.artist}` : '';
    spotifyStatus = `${spotify?.nowPlaying?.live ? 'Live' : 'Connected'} · ${title}${artist}`;
    spotifyAction = 'Reauthorize Spotify →';
    spotifyHref = '/api/spotify/auth?returnTo=/auth';
  } else if (broadcaster) {
    spotifyStatus = spotify?.configured
      ? 'Broadcaster verified · Spotify is ready to authorize.'
      : 'Spotify provider setup required.';
    spotifyAction = 'Authorize Spotify →';
    spotifyHref = '/api/spotify/auth?returnTo=/auth';
  }

  let shopifyStatus = 'Sign in with Google to open the broadcaster lane.';
  if (!shopify?.configured) {
    shopifyStatus = 'OAuth lane built · Shopify app credentials still required.';
  } else if (shopifyConnected) {
    shopifyStatus = `${shopify?.connection?.label || 'Connected storefront'} · read-only catalog authorized`;
  } else if (signedIn && !broadcaster) {
    shopifyStatus = 'Shopify authorization is reserved for the PointCast broadcaster.';
  } else if (broadcaster) {
    shopifyStatus = 'Ready for a myshopify.com storefront.';
  }

  const tezosProviders = [...new Set(tezosIdentities.map((identity) => providerLabel(identity.provider)))];

  return {
    signedIn,
    broadcaster,
    preferredName: user?.preferredName || 'PointCast member',
    signedInWith: primaryProvider,
    identityChips: [...new Set(identities.map((identity) => providerLabel(identity.provider)))],
    result: signedIn
      ? googleConnected
        ? broadcaster
          ? 'Google verified. The broadcaster lane is open.'
          : 'Google verified. Your PointCast account is active.'
        : 'PointCast account active. Your linked identities are in sync.'
      : 'No account is required to look around.',
    providers: {
      google: {
        connected: googleConnected,
        state: googleConnected ? 'connected' : 'live',
        badge: googleConnected ? 'CONNECTED' : 'LIVE',
        status: googleConnected
          ? `Connected · ${user?.preferredName || 'PointCast member'}`
          : 'Ready for Google verification.',
        action: googleConnected ? 'Open PointCast account →' : 'Sign in with Google →',
      },
      spotify: {
        connected: spotifyConnected,
        state: spotifyConnected ? 'connected' : 'live',
        badge: spotifyConnected ? 'CONNECTED' : 'ON AIR',
        status: spotifyStatus,
        action: spotifyAction,
        href: spotifyHref,
      },
      shopify: {
        connected: shopifyConnected,
        state: shopifyConnected ? 'connected' : 'credential-gated',
        badge: shopifyConnected ? 'CONNECTED' : 'STAGED',
        status: shopifyStatus,
        enabled: Boolean(broadcaster && shopify?.configured),
      },
      tezos: {
        connected: tezosIdentities.length > 0,
        state: tezosIdentities.length > 0 ? 'connected' : 'live',
        badge: tezosIdentities.length > 0 ? 'CONNECTED' : 'LIVE',
        status: tezosIdentities.length > 0
          ? `Linked · ${tezosProviders.join(' · ')}`
          : 'Wallet approval remains explicit.',
        action: signedIn ? 'Link a wallet (Kukai) →' : 'Open wallet auth →',
      },
    },
  };
}
