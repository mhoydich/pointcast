/**
 * The constant-product pool a coin moves to when its curve sells out. The LP
 * tokens are burned at creation, so liquidity can never be withdrawn; LP fees
 * stay in the pool and deepen it.
 */
export function isqrt(n) {
  if (n < 2n) return n;
  let x = n, y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x;
}

export function newPool(quote, base) {
  const lpSupply = isqrt(quote * base);
  return { quote, base, lpSupply, lpBurned: lpSupply };
}

export const poolBuyOut = (pool, net) => (net * pool.base) / (pool.quote + net);
export const poolSellOut = (pool, baseIn) => (baseIn * pool.quote) / (pool.base + baseIn);
export const poolMarketCap = (pool, supply) => (pool.quote * supply) / pool.base;
export const poolPrice = (pool) => Number(pool.quote) / Number(pool.base);

/** Pump's synthetic-migration overflow buy at the pool's opening reserves: out = (in−1)·base/(quote+in−1). */
export const overflowOut = (quote, base, amountIn) => (amountIn > 1n ? ((amountIn - 1n) * base) / (quote + amountIn - 1n) : 0n);
