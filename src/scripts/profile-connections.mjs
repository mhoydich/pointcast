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
  let busy = false;
  let notice = xCallbackMessage(win.location.search);
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
    } catch {
      if (!live() || request !== revision) return;
      user = undefined;
      notice = 'Your session could not be checked. Reload before managing X.';
    }
    render();
  }

  root.addEventListener('click', async (event) => {
    const button = event.target?.closest?.('[data-x-action]');
    if (!button || button.disabled || !root.contains(button) || busy) return;
    event.preventDefault();
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
      notice = xConnectionMessage(error instanceof Error ? error.message : '');
    } finally {
      if (live() && request === revision) {
        busy = false;
        render();
      }
    }
  }, { signal });

  win.addEventListener('pc:auth-change', (event) => {
    if (event.detail?.source === 'profile-connections') return;
    notice = '';
    void refreshSession();
  }, { signal });
  win.addEventListener('pc:auth-refresh', () => void refreshSession(), { signal });
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
