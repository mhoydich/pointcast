/**
 * Integer money for the launchpad case study. Credits and coin tokens both
 * carry 6 decimals and live in BigInt micro-units, so every quote equals its
 * fill exactly. Rounding always favors the pool.
 */
export const DECIMALS = 6;
export const ONE = 1_000_000n;

export const ceilDiv = (a, b) => (a + b - 1n) / b;
export const bpsOf = (amount, bps) => (amount * BigInt(bps)) / 10_000n;
export const bpsOfCeil = (amount, bps) => ceilDiv(amount * BigInt(bps), 10_000n);
export const min = (a, b) => (a < b ? a : b);
export const max = (a, b) => (a > b ? a : b);

/** "12.5" → 12_500_000n. Accepts numbers, integer strings or decimals with up to 6 places. */
export function units(value) {
  if (typeof value === 'bigint') return value * ONE;
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(text)) throw new Error(`bad amount: ${value}`);
  const [whole, frac = ''] = text.split('.');
  return BigInt(whole) * ONE + BigInt(frac.padEnd(DECIMALS, '0'));
}

/** Micro-units → display string with a fixed number of decimals (rounded down). */
export function fmt(micro, digits = 2) {
  const neg = micro < 0n;
  const abs = neg ? -micro : micro;
  const whole = abs / ONE;
  const frac = (abs % ONE).toString().padStart(DECIMALS, '0').slice(0, digits);
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '−' : ''}${grouped}${digits ? '.' + frac : ''}`;
}

/** Micro-units → a plain Number of whole units (for charts and ratios only). */
export const toNumber = (micro) => Number(micro) / 1e6;
