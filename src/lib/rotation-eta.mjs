/**
 * rotation-eta.mjs — the sequencer-rotation ETA on /chain/net.
 *
 * The devnet-2 rotation delay is counted in blocks (launch record 2,
 * rotation_delay_blocks). The Worker seals on traffic or a heartbeat, so the
 * clock time is an estimate from the observed seal rate over the last 1,000
 * blocks, said as "N blocks (≈ T at the current rate)", never as a promise.
 *
 * Plain JS, no DOM at import, no network at import.
 */
export const RATE_SPAN = 1000;

/** blocks per hour from two block timestamps (ms) `span` blocks apart, or null. */
export function sealRate(span, fromMs, toMs) {
  if (!(Number.isSafeInteger(span) && span > 10)) return null;
  if (!(Number.isFinite(fromMs) && Number.isFinite(toMs) && toMs > fromMs)) return null;
  return span / ((toMs - fromMs) / 3_600_000);
}

/** "1,200 blocks (≈ 97 h at the current rate)" */
export function etaText(delay, perHour) {
  const n = Number(delay).toLocaleString('en-US');
  if (!(perHour > 0)) return `${n} blocks`;
  const h = delay / perHour;
  const t = h < 48 ? `${Math.max(1, Math.round(h))} h` : `${(h / 24).toFixed(1)} days`;
  return `${n} blocks (≈ ${t} at the current rate)`;
}

/** Read /status and the block RATE_SPAN back; returns {perHour, span, hours} or null. GET only. */
export async function readRate(api, fetchImpl = globalThis.fetch) {
  const get = async (p) => {
    const r = await fetchImpl(api + p, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };
  const st = await get('/status');
  const tip = Number(st?.height);
  const tipMs = Number(st?.tip_timestamp);
  const span = Math.min(RATE_SPAN, tip - 1);
  if (!(span > 10)) return null;
  const old = await get(`/raw/blocks?from=${tip - span}&limit=1`);
  const fromMs = Number(old?.blocks?.[0]?.header?.timestamp);
  const perHour = sealRate(span, fromMs, tipMs);
  return perHour ? { perHour, span, hours: (tipMs - fromMs) / 3_600_000 } : null;
}
