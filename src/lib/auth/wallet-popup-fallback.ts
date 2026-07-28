/**
 * Beacon opens web wallets in a new tab. When a browser blocks that popup,
 * Beacon receives `null` and its later pairing URL has nowhere to go.
 *
 * Keep the preferred new-tab behavior, but give Beacon a tiny Window-like
 * target that carries the generated pairing URL into the current tab when the
 * popup was blocked. This is installed only on the project handoff route.
 */
export function installWalletPopupFallback(): () => void {
  const nativeOpen = window.open.bind(window);

  window.open = ((url?: string | URL, target?: string, features?: string) => {
    let opened: Window | null = null;
    try {
      opened = nativeOpen(url, target, features);
    } catch {
      opened = null;
    }

    if (opened || target !== '_blank') return opened;

    const carryToCurrentTab = (destination: string | URL) => {
      const next = String(destination || '');
      if (!next) return;
      window.dispatchEvent(new CustomEvent('pc:wallet-popup-fallback'));
      window.location.assign(next);
    };

    if (url) carryToCurrentTab(url);

    const fallbackLocation = {} as Location;
    Object.defineProperty(fallbackLocation, 'href', {
      configurable: true,
      get: () => window.location.href,
      set: carryToCurrentTab,
    });

    return {
      opener: null,
      closed: false,
      close() {},
      focus() {},
      location: fallbackLocation,
    } as unknown as Window;
  }) as typeof window.open;

  return () => {
    window.open = nativeOpen as typeof window.open;
  };
}
