/**
 * A wallet's portfolio for the launchpad case study: positions at what selling
 * them now would return, net credits (realized and unrealized), creator fees
 * for coins it launched, its trade history, and its rank by net credits.
 *
 * The ledger identity it reports must hold to the micro-credit:
 *   credits + Σ cost basis + escrowed auction orders = starting credits + realized + creator fees received
 */
import { quoteSell } from './engine.mjs';

const started = (world, walletId) => world.events.find((e) => e.type === 'WALLET' && e.wallet === walletId)?.credits ?? 0n;

/** Credits still escrowed in a wallet's open auction orders (each order's amount plus its priority fee). */
function escrowOf(world, walletId) {
  let total = 0n;
  for (const coin of world.coins.values()) {
    const o = coin.orders.get(walletId);
    if (o) total += o.amount + o.priorityFee;
  }
  return total;
}

/** Net credits for every wallet that has traded, best first: the season ranking. */
export function standings(world) {
  const rows = [];
  for (const w of world.wallets.values()) {
    if (!w.positions.size) continue;
    let unrealized = 0n;
    for (const [coinId, p] of w.positions) if (p.base > 0n) unrealized += quoteSell(world, coinId, p.base) - p.cost;
    rows.push({ wallet: w.id, role: w.role, net: w.realized + unrealized });
  }
  return rows.sort((a, b) => (b.net > a.net ? 1 : b.net < a.net ? -1 : a.wallet.localeCompare(b.wallet)));
}

export function portfolio(world, index, walletId, { historyLimit = 30, withRank = true } = {}) {
  const w = world.wallets.get(walletId);
  if (!w) return null;
  const positions = [];
  let cost = 0n, value = 0n;
  for (const [coinId, p] of w.positions) {
    cost += p.cost;
    if (p.base === 0n) continue;
    const coin = world.coins.get(coinId);
    const now = quoteSell(world, coinId, p.base);
    value += now;
    positions.push({ coin: coinId, symbol: coin.symbol, status: coin.status, base: p.base, cost: p.cost, avgPrice: Number(p.cost) / Number(p.base), value: now, unrealized: now - p.cost });
  }
  const openCost = positions.reduce((s, p) => s + p.cost, 0n);
  const escrow = escrowOf(world, walletId);
  const start = started(world, walletId);
  const realized = w.realized;
  const unrealized = value - openCost;
  const createdCoins = [...world.coins.values()].filter((c) => c.creator === walletId).map((c) => ({
    coin: c.id, symbol: c.symbol, status: c.status, feesHeld: c.feesHeld, feesSwept: c.feesSwept, split: c.feeSplit.map((s) => ({ ...s })), splitLocked: c.feeSplitLocked,
  }));
  const history = [];
  for (const coin of world.coins.values()) {
    for (const t of index.trades.get(coin.id) ?? []) if (t.wallet === walletId) history.push({ ...t, coin: coin.id, symbol: coin.symbol });
  }
  history.sort((a, b) => b.seq - a.seq);
  let rank = null, of = null;
  if (withRank) {
    const table = standings(world);
    const at = table.findIndex((r) => r.wallet === walletId);
    rank = at >= 0 ? at + 1 : null;
    of = table.length;
  }
  return {
    wallet: walletId,
    positions: positions.sort((a, b) => (b.value > a.value ? 1 : b.value < a.value ? -1 : a.coin.localeCompare(b.coin))),
    totals: { started: start, credits: w.credits, escrow, cost: openCost, value, realized, unrealized, net: realized + unrealized, feesReceived: w.feesReceived },
    // Zero unless the ledger lost or created credits for this wallet.
    ledgerDrift: w.credits + cost + escrow - start - realized - w.feesReceived,
    createdCoins,
    history: history.slice(0, historyLimit),
    rank,
    of,
  };
}
