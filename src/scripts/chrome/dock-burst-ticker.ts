// @ts-nocheck
import { track } from '../../lib/analytics';

  type BurstBy = { handle?: string; noun?: number };
  type Burst = {
    kind: 'mint' | 'tug' | 'bell' | 'ping-answered' | 'cast' | 'mail';
    at: number;
    by: BurstBy;
    meta: Record<string, string | number | boolean>;
  };

  function shortHandle(by: BurstBy): string {
    const handle = String(by?.handle || 'someone');
    if (/^(tz|KT1)/.test(handle) && handle.length > 12) return `${handle.slice(0, 5)}…${handle.slice(-4)}`;
    return handle.slice(0, 24);
  }

  function age(at: number): string {
    const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }

  function describe(burst: Burst): string {
    const who = shortHandle(burst.by);
    const label = String(burst.meta?.label || burst.meta?.spell || 'a signal').slice(0, 44);
    if (burst.kind === 'mint') return `${who} minted ${label} · ${age(burst.at)}`;
    if (burst.kind === 'seal') return `${who} attested ${label} · ${age(burst.at)}`;
    if (burst.kind === 'tug') return `${who} pulled the rope past ${label} · ${age(burst.at)}`;
    if (burst.kind === 'bell') return `${who} rang ${label} · ${age(burst.at)}`;
    if (burst.kind === 'ping-answered') return `${who} answered ${label} · ${age(burst.at)}`;
    if (burst.kind === 'mail') return `Town mail arrived · ${age(burst.at)}`;
    return `${who} cast +${label} · ${age(burst.at)}`;
  }

export function mountDockBurstTicker(scope) {
  const { on, setTimeout, clearTimeout } = scope;
  const hideTimers = new Map<HTMLElement, number>();

  on(window, 'pc:burst:seen', (event) => {
    const burst = (event as CustomEvent<Burst>).detail;
    if (!burst) return;
    document.querySelectorAll<HTMLElement>('[data-pc-ref="fb-burst"]').forEach((ticker) => {
      ticker.textContent = describe(burst);
      ticker.hidden = false;
      ticker.setAttribute('data-show', 'true');
      clearTimeout(hideTimers.get(ticker));
      hideTimers.set(ticker, setTimeout(() => {
        ticker.removeAttribute('data-show');
        setTimeout(() => { ticker.hidden = true; }, 240);
        hideTimers.delete(ticker);
      }, 5_000));
    });
    track('dock', { path: location.pathname.slice(0, 120), action: 'burst_seen', burstKind: burst.kind });
  });

  on(window, 'pc:dock-visibility', (event) => {
    const detail = (event as CustomEvent<{ open?: boolean; tray?: string }>).detail;
    if (detail?.open && detail.tray) track('dock', { path: location.pathname.slice(0, 120), action: 'tray_open', tray: detail.tray });
  });

  on(window, 'pc:room:chat', () => {
    track('dock', { path: location.pathname.slice(0, 120), action: 'say_sent' });
  });

  on(document, 'click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('.fb__action');
    if (!button) return;
    track('dock', {
      path: location.pathname.slice(0, 120),
      action: 'stamp_action',
      tray: button.dataset.tray || '',
      stampAction: button.dataset.action || '',
    });
  });

  on(window, 'pc:dock:metric', (event) => {
    const detail = (event as CustomEvent<Record<string, string | number | boolean>>).detail || {};
    track('dock', { path: location.pathname.slice(0, 120), ...detail });
  });

  scope.cleanup(() => hideTimers.clear());
}
