// The Desk — the public broadcast payload for /the-desk and /api/the-desk.
// Read-only. Sealed reasoning and salts stay hidden until an order is revealed.
import { cents, deskDay } from './util.mjs';

export async function deskBroadcast({ config, configHash, store, now = Date.now() }) {
  const [st, positions, marks, pnlRows, orders, events, days] = await Promise.all([
    store.state(), store.positions(), store.marks(), store.agentPnl(), store.recentOrders(100), store.events(60), store.days(14),
  ]);
  const markOf = new Map(marks.map((m) => [`${m.venue}|${m.instrument}`, m.price]));
  const today = deskDay(now, config.timezone);

  const pos = positions.map((p) => {
    const mark = markOf.get(`${p.venue}|${p.instrument}`) ?? p.cost / p.qty;
    const value = cents(p.qty * mark);
    return { agent: p.agent, venue: p.venue, instrument: p.instrument, title: p.title, qty: p.qty, cost: p.cost, mark, value, unrealized: cents(value - p.cost), openedAt: p.opened_at };
  });

  const venues = [];
  let equity = 0;
  let bankroll = 0;
  for (const [id, v] of Object.entries(config.venues)) {
    const cash = await store.cash(id, v.bankrollUsd);
    const value = cents(pos.filter((p) => p.venue === id).reduce((s, p) => s + p.value, 0));
    const eq = cents(cash + value);
    if (v.enabled) {
      equity += eq;
      bankroll += v.bankrollUsd;
    }
    venues.push({ id, label: v.label || id, kind: v.kind, enabled: v.enabled, mode: v.mode, bankroll: v.bankrollUsd, cash: cents(cash), value, equity: eq, pnl: cents(eq - v.bankrollUsd) });
  }

  const agents = config.agents.map((a) => {
    const rows = pnlRows.filter((r) => r.agent === a.id);
    const realized = cents(rows.reduce((s, r) => s + r.realized, 0));
    const fees = cents(rows.reduce((s, r) => s + r.fees, 0));
    const unrealized = cents(pos.filter((p) => p.agent === a.id).reduce((s, p) => s + p.unrealized, 0));
    return { id: a.id, name: a.name, kind: a.kind, venue: a.venue, thesis: a.thesis, realized, fees, unrealized, pnl: cents(realized - fees + unrealized) };
  });

  const trades = orders.map((o) => {
    const revealed = Boolean(o.revealed_at);
    const open = revealed || o.status === 'refused' && !o.sealed_at;
    return {
      id: o.id, at: o.created_at, agent: o.agent, venue: o.venue, instrument: o.instrument, title: o.title,
      action: o.action, qty: o.qty, limitPrice: o.limit_price, notional: o.notional, status: o.status, refusal: o.refusal,
      filledQty: o.filled_qty, avgPrice: o.avg_price, fees: o.fees, filledAt: o.filled_at,
      configHash: o.config_hash, commitment: o.commitment, chain: o.chain, sealedAt: o.sealed_at,
      revealAfter: o.reveal_after, revealedAt: o.revealed_at, flatten: Boolean(o.flatten),
      reasoning: open ? o.reasoning : null,
      salt: revealed ? o.salt : null,
    };
  });

  const todayRow = days.find((d) => d.day === today);
  const dayPnl = todayRow ? cents(todayRow.last_equity - todayRow.start_equity) : 0;

  return {
    name: 'The Desk',
    banner: config.banner,
    mode: config.mode,
    configHash,
    generatedAt: new Date(now).toISOString(),
    limits: {
      maxPositionPctOfBankroll: config.limits.maxPositionPctOfBankroll,
      dailyLossLimitUsd: config.limits.dailyLossLimitUsd,
      approvalAboveUsd: config.limits.approvalAboveUsd,
    },
    state: {
      killed: Boolean(st?.killed),
      killedAt: st?.killed_at ?? null,
      haltedToday: st?.halted_day === today,
      haltedAt: st?.halted_day === today ? st.halted_at : null,
      day: today,
    },
    totals: { bankroll: cents(bankroll), equity: cents(equity), pnl: cents(equity - bankroll), dayPnl },
    venues,
    agents,
    positions: pos,
    trades,
    events: events.map((e) => ({ id: e.id, at: e.at, kind: e.kind, agent: e.agent, venue: e.venue, orderId: e.order_id, detail: e.detail })),
    days: days.map((d) => ({ day: d.day, startEquity: d.start_equity, lastEquity: d.last_equity, lowEquity: d.low_equity, halted: Boolean(d.halted) })),
    verify: 'For a revealed trade: sha256 of the canonical JSON {id, agent, venue, instrument, action, qty, limitPrice, configHash, reasoning, salt} (keys sorted) equals commitment; chain = sha256(previous chain + commitment), starting from "the-desk:genesis".',
  };
}
