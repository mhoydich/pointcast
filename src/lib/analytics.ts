/** Analytics events emitted by pointcast.xyz. */
export type AnalyticsEvent =
  | 'wallet_connect'
  | 'poll_vote'
  | 'drop_collect'
  | 'hello_earned'
  | 'mood_set'
  | 'node_connect'
  | 'page_view';

/** Payload sent to the analytics endpoint. */
export interface AnalyticsPayload {
  event: AnalyticsEvent;
  meta?: Record<string, string | number | boolean>;
  ts?: string;
}

const ENDPOINT = '/api/analytics';
const NO_TRACK_KEY = 'pc:no-track';

function isTrackingDisabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return (
      window.navigator.doNotTrack === '1' ||
      window.localStorage.getItem(NO_TRACK_KEY) === '1'
    );
  } catch {
    return window.navigator.doNotTrack === '1';
  }
}

function send(payload: AnalyticsPayload): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
    if (typeof fetch === 'function') {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

/** Track a single analytics event with optional metadata. */
export function track(
  event: AnalyticsEvent,
  meta?: Record<string, string | number | boolean>,
): void {
  if (isTrackingDisabled()) return;
  send({ event, meta, ts: new Date().toISOString() });
}

/** Track a page view using the provided path or the current location pathname. */
export function trackPageView(path?: string): void {
  const fallback =
    typeof location !== 'undefined' ? location.pathname : '/';
  track('page_view', { path: path ?? fallback });
}
