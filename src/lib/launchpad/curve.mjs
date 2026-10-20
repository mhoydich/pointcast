/**
 * The bonding curve: constant product over virtual reserves (k = Q·B), as in
 * Pump.fun's program. All amounts are BigInt micro-units; every division
 * rounds in the pool's favor, so k never decreases.
 */
import { ceilDiv } from './units.mjs';

export function newCurve(preset) {
  return { Q: preset.Q0, B: preset.B0, R: preset.R0, realQuote: 0n };
}

/** Gross quote → net, for a total fee rate `r` in millionths charged inside the gross (gross = net + fee). */
export const netOfRate = (gross, r) => (gross * 1_000_000n) / (1_000_000n + BigInt(r));

/** Tokens out for a net quote amount (exact in). */
export const buyOut = (c, net) => (net * c.B) / (c.Q + net);

/** Net quote needed to take exactly `out` tokens (exact out). */
export const netForOut = (c, out) => ceilDiv(c.Q * out, c.B - out);

/** Quote out, before fees, for selling `baseIn` tokens. */
export const sellOut = (c, baseIn) => (baseIn * c.Q) / (c.B + baseIn);

/** Market cap (= fully diluted value) in quote micro-units. */
export const marketCap = (c, supply) => (c.Q * supply) / c.B;

/** Price as a plain number of quote units per whole token (for charts and signals). */
export const priceOf = (c) => Number(c.Q) / Number(c.B);

/** Quote the curve must take in before it sells out. */
export function graduationRaise(preset) {
  return ceilDiv(preset.Q0 * preset.B0, preset.B0 - preset.R0) - preset.Q0;
}

/**
 * Both progress measures, in basis points: tokens sold of R0, and quote raised
 * of the graduation raise. The credits bar is clamped at 100%: rounding lets
 * realQuote at R = 0 creep slightly past the single-path minimum.
 */
export function progress(c, preset) {
  const credits = Number((c.realQuote * 10_000n) / graduationRaise(preset));
  return {
    tokensBps: Number(((preset.R0 - c.R) * 10_000n) / preset.R0),
    creditsBps: Math.min(10_000, credits),
  };
}

export function applyBuy(c, net, out) {
  c.Q += net;
  c.B -= out;
  c.R -= out;
  c.realQuote += net;
}

export function applySell(c, baseIn, grossOut) {
  c.Q -= grossOut;
  c.B += baseIn;
  c.R += baseIn;
  c.realQuote -= grossOut;
}
