/** A voluntary, page-local action; private inputs are never read. */
export function initializePrayerLedgers() {
  document.querySelectorAll<HTMLElement>('[data-prayer-ledger]').forEach((root) => {
    if (root.dataset.ledgerReady) return;
    const station = root.dataset.station;
    if (station !== 'still-light' && station !== 'remembering') return;
    root.dataset.ledgerReady = 'true';
    const button = root.querySelector<HTMLButtonElement>('[data-ledger-offer]')!;
    const count = root.querySelector<HTMLElement>('[data-ledger-count]')!;
    const altar = root.querySelector<HTMLElement>('[data-ledger-altar]')!;
    const status = root.querySelector<HTMLElement>('[data-ledger-status]')!;
    let attempted = false;
    let disposed = false;
    const controllers = new Set<AbortController>();
    async function boundedJson(url: string, init: RequestInit = {}) {
      const controller = new AbortController();
      controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(url, { ...init, signal: controller.signal });
        if (!response.ok) throw new Error('unavailable');
        return await response.json();
      }
      finally { clearTimeout(timer); controllers.delete(controller); }
    }
    async function refresh() {
      try {
        const data = await boundedJson('/api/prayer-overview', { headers: { 'Cache-Control': 'no-cache' } });
        if (!data?.ok || !data.storageAvailable || !Number.isSafeInteger(data.prayer?.total) || data.prayer.total < 0 || !Number.isSafeInteger(data.drumAltar?.total) || data.drumAltar.total < 0 || !Number.isInteger(data.drumAltar?.week)) throw new Error('invalid');
        if (disposed) return;
        count.textContent = `About ${data.prayer.total.toLocaleString()} prayer actions recorded in the PointCast prayer ledger.`;
        altar.textContent = `Drum altars: about ${data.drumAltar.total.toLocaleString()} tributes this ISO week (${data.drumAltar.week}).`;
      } catch {
        if (!disposed) { count.textContent = 'The shared prayer count is unavailable right now.'; altar.textContent = 'The current week’s drum altar count is unavailable right now.'; }
      }
    }
    button.disabled = false;
    const offer = async () => {
      if (attempted || disposed) return;
      attempted = true;
      button.disabled = true;
      status.textContent = 'Sending your optional offering…';
      try {
        const sessionId = crypto.randomUUID();
        const result = await boundedJson('/api/prayer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ station, sessionId }) });
        if (!result?.ok) throw new Error('unconfirmed');
        if (!disposed) { status.textContent = 'Your offering was recorded. Thank you.'; void refresh(); }
      } catch {
        if (!disposed) status.textContent = 'We could not confirm your offering. It may have been recorded, so this visit will not send it again.';
      }
    };
    button.addEventListener('click', offer);
    void refresh();
    const dispose = () => {
      disposed = true;
      controllers.forEach(controller => controller.abort());
      button.removeEventListener('click', offer);
      document.removeEventListener('astro:before-swap', dispose);
    };
    document.addEventListener('astro:before-swap', dispose);
  });
}
