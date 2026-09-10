import { buildXConnectionView, xCallbackMessage, xConnectionMessage } from '../lib/auth/x-connection.mjs';

/** Each mount owns its requests; a session change or navigation invalidates old results. */
export function mountProfileConnections(root, api) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const controller = new win.AbortController();
  const { signal } = controller;
  let user;
  let available = null;
  let revision = 0;
  let lastBridgeUser = null;
  const sessionFingerprint = (value) => typeof value?.userId === 'string' && value.userId
    ? JSON.stringify([value.userId, Array.isArray(value.identities)
      ? value.identities.map((identity) => [identity?.provider, identity?.id, identity?.username, identity?.verifiedAt]) : []]) : null;
  let busy = false;
  let notice = xCallbackMessage(win.location.search);
  let needsReauth = new URLSearchParams(win.location.search).get('auth_error') === 'x-fresh-sign-in-required';
  const reauthMethods = [
    ['passkey', 'Passkey'], ['google', 'Google'], ['email', 'Email'],
    ['kukai', 'Kukai'], ['metamask', 'MetaMask'], ['phantom', 'Phantom'],
  ];
  const recoveryMethod = () => reauthMethods.find(([provider]) => user?.identities?.some((identity) => identity.provider === provider));
  const live = () => !signal.aborted && root.isConnected;
  const text = (selector, value) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  };

  function render() {
    if (!live()) return;
    const view = buildXConnectionView(user, available);
    root.dataset.state = view.state;
    root.setAttribute('aria-busy', String(user === undefined || busy));
    text('[data-x-status]', view.status);
    text('[data-x-badge]', view.badge);
    text('[data-x-notice]', notice);
    text('[data-x-disconnect-hint]', view.disconnectHint);
    const method = recoveryMethod();
    const recovery = root.querySelector('[data-x-recovery]');
    if (recovery) recovery.hidden = !needsReauth;
    const reauth = root.querySelector('[data-x-action="reauth"]');
    if (reauth) {
      reauth.disabled = busy || user === undefined || !method;
      reauth.textContent = method ? `Sign in again with ${method[1]}` : 'Sign in again';
    }
    text('[data-x-recovery-hint]', method
      ? `Use your linked ${method[1]} sign-in. Then check the PointCast account name and retry X.`
      : 'Use a sign-in method already linked to this PointCast account, then retry X.');
    const link = root.querySelector('[data-x-handle]');
    if (link) {
      link.hidden = !view.href;
      link.textContent = view.username ? `@${view.username} ↗` : '';
      if (view.href) link.setAttribute('href', view.href);
      else link.removeAttribute('href');
    }
    const connect = root.querySelector('[data-x-action="connect"]');
    if (connect) {
      connect.hidden = view.connected;
      connect.textContent = busy ? 'Opening X…' : view.action;
      connect.disabled = busy || view.disabled;
    }
    const disconnect = root.querySelector('[data-x-action="disconnect"]');
    if (disconnect) {
      disconnect.hidden = !view.connected;
      disconnect.disabled = busy || !view.canDisconnect;
      disconnect.textContent = busy ? 'Disconnecting…' : 'Disconnect X';
    }
  }

  async function refreshSession() {
    const request = ++revision;
    user = undefined;
    busy = false;
    render();
    try {
      const next = await api.getSession();
      if (!live() || request !== revision) return;
      user = next;
      lastBridgeUser = sessionFingerprint(next);
    } catch {
      if (!live() || request !== revision) return;
      user = undefined;
      lastBridgeUser = null;
      notice = 'Your session could not be checked. Reload before managing X.';
    }
    render();
  }

  root.addEventListener('click', async (event) => {
    const button = event.target?.closest?.('[data-x-action]');
    if (!button || button.disabled || !root.contains(button) || busy) return;
    event.preventDefault();
    if (button.dataset.xAction === 'reauth') {
      // Reuse the existing menu, pointing only at an already-linked method.
      // Stop the initiating click from immediately closing it as an outside click.
      event.stopPropagation();
      const method = recoveryMethod();
      if (!method) return;
      const menu = root.closest('[data-me-root]')?.querySelector('[data-me-private] .me-auth-bridge [data-auth-menu]')
        || doc.querySelector('[data-auth-menu]');
      const trigger = menu?.querySelector('[data-auth-trigger]');
      const control = method[0] === 'email'
        ? menu?.querySelector('[data-auth-email]')
        : menu?.querySelector(`[data-provider="${method[0]}"]`);
      if (!trigger || !control || control.disabled) {
        notice = 'Open Manage sign-in methods and use your existing linked account, then return here to retry X.';
        render();
        return;
      }
      // Avoid carrying this old failure through the provider's return URL.
      const next = new URL(win.location.href);
      next.searchParams.delete('auth_error');
      next.searchParams.delete('auth');
      win.history.replaceState(win.history.state, '', next.pathname + next.search + next.hash);
      if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
      menu.scrollIntoView?.({ block: 'nearest' });
      control.focus();
      return;
    }
    needsReauth = false;
    const view = buildXConnectionView(user, available);
    const request = revision;
    busy = true;
    notice = '';
    render();
    try {
      if (button.dataset.xAction === 'connect') {
        if (view.disabled) return;
        await api.loginWithX({ intent: user ? 'link' : 'login', returnTo: '/me' });
        if (live() && request === revision) notice = 'Opening X to confirm your sign-in…';
      } else if (button.dataset.xAction === 'disconnect') {
        if (!view.canDisconnect) return;
        await api.disconnectX(view.id);
        if (!live() || request !== revision) return;
        const next = await api.getSession();
        if (!live() || request !== revision) return;
        user = next;
        notice = next?.identities?.some((item) => item.provider === 'x' && item.id === view.id)
          ? 'X still appears linked. Reload your profile before trying again.' : 'X disconnected from PointCast.';
        win.dispatchEvent(new win.CustomEvent('pc:auth-change', {
          detail: { user, source: 'profile-connections' },
        }));
      }
    } catch (error) {
      if (!live() || request !== revision) return;
      const reason = error instanceof Error ? error.message : '';
      needsReauth = reason === 'fresh-sign-in-required' || reason === 'x-fresh-sign-in-required';
      notice = xConnectionMessage(reason);
    } finally {
      if (live() && request === revision) {
        busy = false;
        render();
      }
    }
  }, { signal });

  win.addEventListener('pc:auth-change', (event) => {
    if (event.detail?.source === 'profile-connections') return;
    const bridgeUser = event.detail?.source === 'tezos-session-bridge'
      ? sessionFingerprint(event.detail.user) : null;
    // Coalesce unchanged bridge reports, including while the first read waits.
    // Real account/identity changes and explicit auth actions still invalidate.
    if (bridgeUser && bridgeUser === lastBridgeUser) return;
    lastBridgeUser = bridgeUser;
    if (!needsReauth) notice = '';
    void refreshSession();
  }, { signal });
  win.addEventListener('pc:auth-refresh', () => { lastBridgeUser = null; void refreshSession(); }, { signal });
  doc.addEventListener('astro:before-swap', () => controller.abort(), { signal });
  void refreshSession();
  void api.getXAuthAvailability().then((value) => {
    if (!live()) return;
    available = value === true;
    render();
  }).catch(() => {
    if (!live()) return;
    available = false;
    render();
  });
  return () => controller.abort();
}
