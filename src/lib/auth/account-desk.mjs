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
 * Build the single view model used by the /auth hero and provider cards.
 * The session user is authoritative for account and linked-identity state.
 *
 * @param {import('./types').PointCastUser | null} user
 */
export function buildAccountDeskView(user) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const identityProviders = new Set(identities.map((identity) => identity.provider));
  const signedIn = Boolean(user);
  const googleConnected = identityProviders.has('google');
  const tezosProviders = identities
    .filter((identity) => TEZOS_PROVIDERS.has(identity.provider))
    .map((identity) => providerLabel(identity.provider));
  const primaryProvider = googleConnected
    ? 'Google'
    : identities[0]
      ? providerLabel(identities[0].provider)
      : 'PointCast';

  const providerState = (provider, signedOutAction) => {
    const connected = identityProviders.has(provider);
    const label = providerLabel(provider);
    return {
      connected,
      state: connected ? 'connected' : 'available',
      badge: connected ? 'LINKED' : 'AVAILABLE',
      status: connected ? `${label} is linked to this account.` : `${label} is ready when you choose it.`,
      action: connected ? `${label} linked` : signedIn ? `Link ${label} →` : signedOutAction,
    };
  };

  return {
    signedIn,
    preferredName: user?.preferredName || 'PointCast member',
    signedInWith: primaryProvider,
    identityChips: [...new Set(identities.map((identity) => providerLabel(identity.provider)))],
    result: signedIn
      ? 'Your PointCast account is active.'
      : 'No account is required to look around.',
    providers: {
      google: providerState('google', 'Sign in with Google →'),
      apple: providerState('apple', 'Sign in with Apple →'),
      kukai: {
        connected: tezosProviders.length > 0,
        state: tezosProviders.length > 0 ? 'connected' : 'available',
        badge: tezosProviders.length > 0 ? 'LINKED' : 'AVAILABLE',
        status: tezosProviders.length > 0
          ? `Tezos linked with ${[...new Set(tezosProviders)].join(' · ')}.`
          : 'Kukai is ready when you choose it.',
        action: tezosProviders.length > 0 ? 'Link another Tezos wallet →' : signedIn ? 'Link Kukai →' : 'Sign in with Kukai →',
      },
      metamask: providerState('metamask', 'Sign in with MetaMask →'),
      phantom: providerState('phantom', 'Sign in with Phantom →'),
    },
  };
}
