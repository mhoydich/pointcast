/**
 * One browser-side Tezos session reconciler for every PointCast HTML page.
 *
 * The same self-contained script is rendered by the Astro layout component
 * and injected by the Cloudflare Pages middleware. The middleware copy covers
 * standalone/legacy project pages that do not use a shared Astro layout; the
 * global guard makes the duplicate harmless on normal layout-backed pages.
 *
 * This bridge never asks Kukai to sign and never submits an operation. It only
 * restores the verified address from PointCast's HttpOnly session cookie into
 * the legacy wallet mirrors that older mint/profile/project surfaces consume.
 */
export const POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT = String.raw`
(() => {
  const bridgeWindow = window;
  if (bridgeWindow.__pointCastTezosBridgeInstalled) {
    if (typeof bridgeWindow.__pointCastReconcileTezosSession === 'function') {
      void bridgeWindow.__pointCastReconcileTezosSession();
    }
    return;
  }

  bridgeWindow.__pointCastTezosBridgeInstalled = true;
  let reconciliation = null;
  const walletKey = 'pc:wallet';
  const walletsKey = 'pc:wallets';
  const activeKey = 'pc:wallet-active';

  function storedActiveAddress() {
    try {
      return localStorage.getItem(activeKey) || '';
    } catch {
      return '';
    }
  }

  function emitState(state, address, user) {
    document.documentElement.dataset.pcTezosAuth = state;
    window.dispatchEvent(new CustomEvent('pc:tezos-session', {
      detail: { state, address: address || null, user: user || null },
    }));
  }

  function mirrorVerifiedWallet(address) {
    const wallet = {
      chain: 'tezos',
      address,
      provider: 'kukai',
      addedAt: Date.now(),
    };

    try {
      let remembered = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(walletsKey) || '[]');
        if (Array.isArray(parsed)) remembered = parsed;
      } catch {
        // A malformed address book is replaced by the verified session.
      }
      const previous = remembered.find((item) => item && item.address === address);
      remembered = remembered.filter((item) => item && item.address !== address);
      remembered.push({ ...wallet, addedAt: previous?.addedAt || wallet.addedAt });
      localStorage.setItem(walletsKey, JSON.stringify(remembered));
      localStorage.setItem(walletKey, JSON.stringify(wallet));
      localStorage.setItem(activeKey, address);
    } catch {
      // Storage can be unavailable in privacy modes; the cookie remains valid.
    }

    window.dispatchEvent(new CustomEvent('pc:wallet-change', { detail: wallet }));
  }

  async function runReconciliation() {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });

      if (response.ok) {
        const payload = await response.json();
        const user = payload && payload.user ? payload.user : null;
        const identities = Array.isArray(user?.identities)
          ? user.identities.filter((item) => item && item.provider === 'kukai' && typeof item.id === 'string')
          : [];
        const rememberedAddress = storedActiveAddress();
        const identity = identities.find((item) => item.id === rememberedAddress)
          || identities[identities.length - 1]
          || null;

        if (identity) {
          mirrorVerifiedWallet(identity.id);
          emitState('authenticated', identity.id, user);
          window.dispatchEvent(new CustomEvent('pc:auth-change', {
            detail: { user, source: 'tezos-session-bridge' },
          }));
          return;
        }
      } else if (response.status !== 401) {
        throw new Error('session-service-unavailable');
      }
    } catch {
      const address = storedActiveAddress();
      emitState(address ? 'wallet-only' : 'unavailable', address, null);
      return;
    }

    const address = storedActiveAddress();
    emitState(address ? 'wallet-only' : 'anonymous', address, null);
  }

  function reconcilePointCastTezosSession() {
    if (reconciliation) return reconciliation;
    reconciliation = runReconciliation().finally(() => {
      reconciliation = null;
    });
    return reconciliation;
  }

  bridgeWindow.__pointCastReconcileTezosSession = reconcilePointCastTezosSession;

  document.addEventListener('astro:page-load', () => {
    void reconcilePointCastTezosSession();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void reconcilePointCastTezosSession();
  });
  window.addEventListener('online', () => {
    void reconcilePointCastTezosSession();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void reconcilePointCastTezosSession();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === activeKey || event.key === walletKey || event.key === walletsKey) {
      void reconcilePointCastTezosSession();
    }
  });
  window.addEventListener('pc:auth-refresh', () => {
    void reconcilePointCastTezosSession();
  });
  window.addEventListener('pc:auth-change', (event) => {
    const detail = event.detail;
    if (detail?.source !== 'tezos-session-bridge') {
      void reconcilePointCastTezosSession();
    }
  });

  void reconcilePointCastTezosSession();
})();
`;
