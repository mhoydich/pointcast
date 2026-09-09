// @ts-nocheck
import type { AuthProvider, PointCastUser } from '../../lib/auth/types';
  import {
    getSession,
    getXAuthAvailability,
    loginWithX,
    loginWithApple,
    loginWithGoogle,
    loginWithKukai,
    loginWithMetaMask,
    loginWithPasskey,
    loginWithPhantom,
    logout,
    requestEmailMagicLink,
  } from '../../lib/auth/client';

  import { buildXConnectionView, xCallbackMessage, xConnectionMessage } from '../../lib/auth/x-connection.mjs';

  const menuStates = new WeakMap();

  function renderX(root) {
    const state = menuStates.get(root);
    if (!state) return;
    const view = buildXConnectionView(state.user, state.available);
    const button = root.querySelector('[data-provider="x"]');
    if (button) button.disabled = view.disabled || state.xPending;
    const name = root.querySelector('[data-auth-x-name]');
    const detail = root.querySelector('[data-auth-x-detail]');
    const badge = root.querySelector('[data-auth-x-badge]');
    if (name) name.textContent = view.connected ? 'X linked' : state.user ? 'Link X' : 'X';
    if (detail) detail.textContent = `${view.status} No posts or DMs.`;
    if (badge) badge.textContent = view.badge.toLowerCase();
  }

  const actions: Partial<Record<AuthProvider, () => Promise<PointCastUser | null>>> = {
    passkey: loginWithPasskey,
    kukai: loginWithKukai,
    google: loginWithGoogle,
    apple: loginWithApple,
    metamask: loginWithMetaMask,
    phantom: loginWithPhantom,
    temple: async () => {
      throw new Error('Temple sign-in is not scaffolded yet.');
    },
    umami: async () => {
      throw new Error('Umami sign-in is not scaffolded yet.');
    },
  };

  const providerLabels: Record<AuthProvider, string> = {
    passkey: 'Passkey',
    email: 'Email',
    kukai: 'Kukai',
    google: 'Google',
    x: 'X',
    apple: 'Apple',
    metamask: 'MetaMask',
    phantom: 'Phantom',
    temple: 'Temple',
    umami: 'Umami',
  };

  function closeMenu(root: HTMLElement): void {
    const trigger = root.querySelector('[data-auth-trigger]') as HTMLButtonElement | null;
    const panel = root.querySelector('[data-auth-panel]') as HTMLElement | null;
    panel?.classList.add('hidden');
    trigger?.setAttribute('aria-expanded', 'false');
  }

  function openMenu(root: HTMLElement): void {
    const trigger = root.querySelector('[data-auth-trigger]') as HTMLButtonElement | null;
    const panel = root.querySelector('[data-auth-panel]') as HTMLElement | null;
    panel?.classList.remove('hidden');
    trigger?.setAttribute('aria-expanded', 'true');
  }

  function setStatus(root: HTMLElement, message: string): void {
    const status = root.querySelector('[data-auth-status]');
    if (status) status.textContent = message;
  }

  function renderSession(
    root: HTMLElement,
    user: PointCastUser | null,
    announce = true,
  ): void {
    const state = menuStates.get(root);
    if (state) {
      state.user = user;
      state.revision += 1;
      state.xPending = false;
      renderX(root);
    }
    const triggerLabel = root.querySelector('[data-auth-trigger-label]');
    const account = root.querySelector('[data-auth-account]') as HTMLElement | null;
    const userName = root.querySelector('[data-auth-user-name]');
    const userMeta = root.querySelector('[data-auth-user-meta]');

    if (user) {
      if (triggerLabel) triggerLabel.textContent = user.preferredName || 'account';
      account?.classList.remove('hidden');
      if (userName) userName.textContent = user.preferredName;
      if (userMeta) userMeta.textContent = `${user.identities.length} linked provider${user.identities.length === 1 ? '' : 's'}`;
      if (announce) {
        window.dispatchEvent(new CustomEvent('pc:auth-change', {
          detail: { user, source: 'auth-menu' },
        }));
      }
      return;
    }

    if (triggerLabel) triggerLabel.textContent = 'sign in';
    account?.classList.add('hidden');
    if (userName) userName.textContent = '—';
    if (userMeta) userMeta.textContent = '—';
    if (announce) {
      window.dispatchEvent(new CustomEvent('pc:auth-change', {
        detail: { user: null, source: 'auth-menu' },
      }));
    }
  }

  async function refreshSession(root: HTMLElement): Promise<PointCastUser | null> {
    const state = menuStates.get(root);
    const revision = state?.revision;
    const live = () => state && !state.signal.aborted && root.isConnected && state.revision === revision;
    try {
      const user = await getSession();
      if (!live()) return state?.user ?? null;
      renderSession(root, user);
      return user;
    } catch {
      if (!live()) return state?.user ?? null;
      // Leave X disabled when the session is unknown; never guess login vs linking.
      setStatus(root, 'Sign-in requires the live session service.');
      return null;
    }
  }

  function initAuthMenu(root: HTMLElement, signal: AbortSignal): void {
    const state = { user: undefined, available: null, revision: 0, xPending: false, signal };
    menuStates.set(root, state);
    renderX(root);
    setStatus(root, xCallbackMessage(window.location.search));
    void getXAuthAvailability().then((available) => {
      if (signal.aborted || !root.isConnected) return;
      state.available = available;
      renderX(root);
    }).catch(() => {
      if (signal.aborted || !root.isConnected) return;
      state.available = false;
      renderX(root);
    });
    root.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest('[data-auth-trigger]')) {
        const panel = root.querySelector('[data-auth-panel]');
        if (panel?.classList.contains('hidden')) openMenu(root);
        else closeMenu(root);
        return;
      }

      if (target.closest('[data-auth-logout]')) {
        event.preventDefault();
        setStatus(root, 'logging out…');
        void logout()
          .then(() => refreshSession(root))
          .then(() => {
            setStatus(root, 'session cleared');
            closeMenu(root);
          })
          .catch((error) => {
            setStatus(root, error instanceof Error ? error.message : 'logout failed');
          });
        return;
      }

      const button = target.closest<HTMLButtonElement>('[data-provider]');
      if (!button || button.disabled) return;
      event.preventDefault();
      const provider = button.dataset.provider as AuthProvider;
      const action = provider === 'x'
        ? () => loginWithX({ intent: state.user ? 'link' : 'login', returnTo: '/me' })
        : actions[provider];
      if (provider === 'x') {
        state.xPending = true;
        renderX(root);
      }
      if (!action) return;
      setStatus(
        root,
        provider === 'kukai'
          ? 'Choose Kukai, then Use Browser.'
          : `${providerLabels[provider]}…`,
      );

      void action()
        .then((user) => {
          if (signal.aborted || !root.isConnected) return;
          if (user) {
            renderSession(root, user);
            setStatus(root, `${providerLabels[provider]} ready`);
            closeMenu(root);
            return;
          }
          setStatus(root, `${providerLabels[provider]} redirecting…`);
        })
        .catch((error) => {
          if (signal.aborted || !root.isConnected) return;
          state.xPending = false;
          renderX(root);
          setStatus(root, provider === 'x' ? xConnectionMessage(error instanceof Error ? error.message : '') : error instanceof Error ? error.message : `${providerLabels[provider]} failed`);
        });
    }, { signal });

    root.addEventListener('submit', (event) => {
      const form = (event.target instanceof Element ? event.target : null)
        ?.closest<HTMLFormElement>('[data-auth-email-form]');
      if (!form) return;
      event.preventDefault();
      const input = form.elements.namedItem('email');
      const email = input instanceof HTMLInputElement ? input.value.trim() : '';
      if (!email || !form.reportValidity()) return;
      const submit = form.querySelector<HTMLButtonElement>('[data-auth-email-submit]');
      if (submit) submit.disabled = true;
      setStatus(root, 'Sending a one-time sign-in link…');
      void requestEmailMagicLink(email)
        .then((message) => {
          setStatus(root, message || 'Check your email for a sign-in link.');
        })
        .catch((error) => {
          setStatus(root, error instanceof Error ? error.message : 'Email sign-in failed.');
        })
        .finally(() => {
          if (submit) submit.disabled = false;
        });
    }, { signal });

    window.addEventListener('pc:open-auth-menu', () => openMenu(root), { signal });

    document.addEventListener('click', (event) => {
      const target = event.target as Node;
      if (!root.contains(target)) closeMenu(root);
    }, { signal });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu(root);
    }, { signal });

    void refreshSession(root).then((user) => {
      if (!signal.aborted && root.isConnected && !user && root.dataset.authAutoOpen === 'true') openMenu(root);
    });
  }

  export function mountAuthMenus(scope): void {
    document.querySelectorAll('[data-auth-menu]').forEach((root) => {
      initAuthMenu(root as HTMLElement, scope.signal);
    });

    scope.on(window, 'pc:auth-change', (event) => {
      const detail = (event as CustomEvent).detail;
      document.querySelectorAll('[data-auth-menu]').forEach((root) => {
        renderSession(root as HTMLElement, detail?.user ?? null, false);
      });
    });
  }
