/**
 * The coin drawer (plan §3, "Coin page"): the selected coin's portrait and
 * status, two progress bars, hand-drawn candles at 1s/1m/5m/1h with their
 * data table, a buy/sell panel whose preview comes from the same engine as
 * the fill, the trade tape, the largest holders with their clusters, and the
 * risk panel in plain words.
 *
 * A trade is a `trade` record in the run's human action log. It applies when
 * its tick runs; the outcome is read back from the event log after that.
 */
import { previewBuy, previewSell, sniperFeeBps, coinPrice, coinMarketCap, presetOf, rulesOf, orderRoom } from '../../lib/launchpad/engine.mjs';
import { candles, holdersTable, risk } from '../../lib/launchpad/screener.mjs';
import { progress } from '../../lib/launchpad/curve.mjs';
import { LIMITS } from '../../lib/launchpad/config.mjs';
import { units, ONE } from '../../lib/launchpad/units.mjs';
import { el, svg, setText, setAttr, keyedRows, cr, num, tokens, pct, bpsPct, price, badgeFor, riskBadges, parseAmount } from './ui.mjs';

const INTERVALS = Object.freeze([
  { label: '1s', size: 1, name: 'One-second' },
  { label: '1m', size: 60, name: 'One-minute' },
  { label: '5m', size: 300, name: 'Five-minute' },
  { label: '1h', size: 3600, name: 'One-hour' },
]);
const CANDLES = 40;
const DATA_ROWS = 10;
const TAPE_ROWS = 15;
const HOLDER_ROWS = 10;
const IMPACT_WARN_BPS = 500;
/** Chart box in SVG units: the chart scales evenly to the card's width. */
const W = 400, H = 150, PAD = 8;

/** Engine and sim refusal codes, in plain words. */
const REASON_WORDS = Object.freeze({
  INSUFFICIENT_CREDITS: 'not enough credits held',
  INSUFFICIENT_TOKENS: 'you hold fewer tokens than that',
  SLIPPAGE: 'the price moved past your slippage limit before it could fill',
  CURVE_COMPLETE: 'the curve had already sold out',
  AUCTION_OPEN: 'selling opens when the opening auction clears',
  AUCTION_CAP: 'you are already at the per-wallet auction cap',
  EARLY_CAP: 'it would take you over the early wallet cap',
  DEV_LOCKED: 'the creator cannot sell before the coin graduates',
  POSITION: 'it would go over the position limit',
  BAD_AMOUNT: 'the amount is too small to fill',
  NO_COIN: 'that coin is not in this run',
  NO_WALLET: 'that wallet cannot trade here',
  NOT_HUMAN: 'that wallet cannot trade here',
});
const words = (reason) => REASON_WORDS[reason] ?? String(reason).toLowerCase().replace(/_/g, ' ');

const group = (n) => n.toLocaleString('en-US');
const plural = (n, one, many = `${one}s`) => `${group(n)} ${n === 1 ? one : many}`;
/** Micro-units as a plain decimal a record accepts: no grouping, trailing zeros dropped. */
function plain(micro) {
  const frac = (micro % ONE).toString().padStart(6, '0').replace(/0+$/, '');
  return frac ? `${micro / ONE}.${frac}` : String(micro / ONE);
}
/** A whole number typed into a bps field, or null when it is not one inside [lo, hi]. */
function wholeIn(text, lo, hi) {
  const t = String(text ?? '').trim();
  if (!/^\d{1,6}$/.test(t)) return null;
  const n = Number(t);
  return n >= lo && n <= hi ? n : null;
}
/** A dl.lp-lines with one dd per key; the dt nodes are kept so a label can change. */
function lines(rows, extra) {
  const dl = el('dl', { class: `lp-lines ${extra}` });
  const dd = {}, dt = {};
  for (const [key, label] of rows) {
    dt[key] = el('dt', {}, label);
    dd[key] = el('dd', {});
    dl.append(dt[key], dd[key]);
  }
  return { dl, dd, dt };
}
const section = (title, ...kids) => el('section', { class: 'lp-coin-sec' }, el('h4', {}, title), ...kids);
/** Set the hidden attribute only when it changes: setting it to the value it already has still restyles the node. */
function setHidden(node, hidden) {
  if (node.hidden !== hidden) node.hidden = hidden;
}
/**
 * A fixed set of table rows, filled in order and updated in place. The tape turns over every paint at 100×,
 * so reusing rows changes cell text instead of building and dropping rows the browser must style and lay out.
 * These rows hold no focusable control, so giving a row another item never moves focus.
 */
function rowSlots(tbody, count, create) {
  const rows = Array.from({ length: count }, () => {
    const row = create();
    row.node.hidden = true;
    tbody.append(row.node);
    return row;
  });
  return (items) => rows.forEach((row, i) => {
    setHidden(row.node, i >= items.length);
    if (i < items.length) row.update(items[i]);
  });
}

export function mountCoin(root, ctx) {
  const state = {
    sim: null, sig: '', coinId: null, size: 60, side: 'buy', amounts: { buy: '', sell: '' },
    playing: false, subs: [], claimed: new Set(), riskSig: '', error: null,
    // What each sub-paint last drew from (coin, its trade count, ...), so a paint with the same inputs is skipped.
    drawn: { candles: '', tape: '', holders: '', risk: '' },
  };

  /* ---------- empty state ---------- */
  const emptyNote = el('p', { class: 'lp-empty-note' });
  const empty = el('div', { class: 'lp-coin-empty' }, el('h3', {}, 'Coin'), emptyNote);

  /* ---------- header ---------- */
  const img = el('img', { class: 'lp-coin-img', width: 96, height: 96, alt: '', decoding: 'async' });
  const nameEl = el('span', { class: 'lp-coin-name' });
  const symEl = el('span', { class: 'lp-coin-sym' });
  const madeTag = el('span', { class: 'lp-badge lp-coin-made', hidden: true }, 'launched on this board');
  const statusEl = el('p', { class: 'lp-coin-status' });
  const factsEl = el('p', { class: 'lp-note lp-coin-facts' });
  const rulesEl = el('p', { class: 'lp-note lp-coin-rules' });
  const sniperEl = el('p', { class: 'lp-coin-sniper', hidden: true });
  const head = el('div', { class: 'lp-coin-head' }, img,
    el('div', { class: 'lp-coin-id' }, el('h3', { class: 'lp-coin-title' }, nameEl, ' ', symEl), madeTag, statusEl, factsEl, rulesEl, sniperEl));

  /* ---------- progress bars ---------- */
  function bar(label) {
    const value = el('span', { class: 'lp-coin-bar-value' });
    const fill = el('span', { style: 'width: 0%' });
    const track = el('div', { class: 'lp-bar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, fill);
    const node = el('div', { class: 'lp-coin-bar' }, el('div', { class: 'lp-coin-bar-label' }, el('span', {}, label), value), track);
    return {
      node,
      set(bps) {
        const p = Math.min(100, Math.max(0, bps / 100));
        setText(value, `${p.toFixed(1)}%`);
        setAttr(track, 'aria-valuenow', p.toFixed(1));
        if (fill.style.width !== `${p}%`) fill.style.width = `${p}%`;
      },
    };
  }
  const soldBar = bar('Coins sold');
  const creditsBar = bar('Credits in');
  const bars = el('div', { class: 'lp-coin-bars' }, soldBar.node, creditsBar.node);

  /* ---------- candles ---------- */
  // The accessible name starts with the visible label (WCAG 2.5.3), then says what it is.
  const sizeBtns = INTERVALS.map((iv) => el('button', { type: 'button', 'aria-pressed': String(iv.size === state.size), 'data-size': String(iv.size), 'aria-label': `${iv.label}: ${iv.name.toLowerCase()} candles` }, iv.label));
  const sizeSeg = el('div', { class: 'lp-seg lp-coin-sizes', role: 'group', 'aria-label': 'Candle interval' }, ...sizeBtns);
  const chartTitle = svg('title', { id: 'lp-coin-chart-title' });
  const marks = svg('g', { class: 'lp-coin-marks' });
  const slots = Array.from({ length: CANDLES }, () => {
    const wick = svg('line', { 'vector-effect': 'non-scaling-stroke' });
    const body = svg('rect', {});
    const g = svg('g', { visibility: 'hidden' }, wick, body);
    marks.append(g);
    return { g, wick, body };
  });
  const chart = svg('svg', { class: 'lp-coin-candles', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': 'lp-coin-chart-title' },
    chartTitle,
    svg('g', { class: 'lp-coin-grid', 'aria-hidden': 'true' }, svg('line', { x1: 0, x2: W, y1: PAD, y2: PAD }), svg('line', { x1: 0, x2: W, y1: H - PAD, y2: H - PAD })),
    marks);
  const rangeEl = el('p', { class: 'lp-note lp-coin-range' });
  const dataCaption = el('caption', { class: 'lp-sr' });
  const dataBody = el('tbody');
  const data = el('details', { class: 'lp-data lp-coin-data' }, el('summary', {}, 'Candle data'),
    el('div', { class: 'lp-table-wrap', tabindex: '0', role: 'region', 'aria-label': 'Candle data' }, el('table', { class: 'lp-coin-table' }, dataCaption,
      el('thead', {}, el('tr', {}, ...['From tick', 'Open', 'High', 'Low', 'Close', 'Volume (cr)'].map((h) => el('th', { scope: 'col', class: 'num' }, h)))),
      dataBody)));
  const candleSec = section('Candles', sizeSeg, chart, rangeEl, data);

  /* ---------- trade panel ---------- */
  const buyBtn = el('button', { type: 'button', 'aria-pressed': 'true', 'data-side': 'buy' }, 'Buy');
  const sellBtn = el('button', { type: 'button', 'aria-pressed': 'false', 'data-side': 'sell' }, 'Sell');
  const sideSeg = el('div', { class: 'lp-seg lp-coin-side', role: 'group', 'aria-label': 'Trade side' }, buyBtn, sellBtn);
  const amountLabel = el('label', { for: 'lp-coin-amount' }, 'Amount (cr)');
  // Each field is described by the form's message line, and marked invalid when the message is about it.
  const amount = el('input', { id: 'lp-coin-amount', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', placeholder: '25', 'aria-describedby': 'lp-coin-why', 'aria-invalid': 'false' });
  const maxBtn = el('button', { type: 'button', class: 'lp-coin-max', hidden: true }, 'Max');
  const slipIn = el('input', { id: 'lp-coin-slippage', type: 'number', inputmode: 'numeric', min: '0', max: String(LIMITS.maxSlippageBps), step: '1', value: String(LIMITS.defaultSlippageBps), 'aria-describedby': 'lp-coin-why', 'aria-invalid': 'false' });
  const prioIn = el('input', { id: 'lp-coin-priority', type: 'number', inputmode: 'numeric', min: '0', max: String(LIMITS.maxPriorityFeeBps), step: '1', value: '0', 'aria-describedby': 'lp-coin-why', 'aria-invalid': 'false' });
  const quote = lines([['out', 'Tokens out'], ['minOut', 'Minimum out'], ['impact', 'Price impact']], 'lp-coin-quote');
  const fees = lines([['creator', 'Creator fee'], ['house', 'House fee'], ['lp', 'Pool (LP) fee'], ['sniper', 'Sniper fee'], ['priority', 'Priority fee'], ['fee', 'Total fee']], 'lp-coin-fees');
  const auction = lines([['accepted', 'Accepted'], ['refused', 'Refused over the cap'], ['priority', 'Priority fee'], ['estOut', 'Fill at most']], 'lp-coin-auction');
  const feesHead = el('p', { class: 'lp-coin-subhead' }, 'Fees');
  const auctionNote = el('p', { class: 'lp-note', hidden: true });
  const gradNote = el('p', { class: 'lp-coin-grad', hidden: true }, 'This buy takes the last coins on the curve: it graduates the coin, which moves to a pool with LP burned.');
  const warnNote = el('p', { class: 'lp-coin-warn', hidden: true });
  const previewBox = el('div', { class: 'lp-coin-preview', hidden: true }, quote.dl, feesHead, fees.dl, auction.dl, auctionNote, gradNote, warnNote);
  const why = el('p', { id: 'lp-coin-why', class: 'lp-note' });
  // aria-disabled, not disabled, so a pressed submit keeps focus when its trade applies, and Enter in a field
  // still reaches the submit handler, which checks the form again and says why nothing was recorded.
  const submit = el('button', { type: 'submit', class: 'lp-coin-submit', 'aria-describedby': 'lp-coin-why', 'aria-disabled': 'true' }, 'Buy');
  const result = el('p', { class: 'lp-coin-result', hidden: true });
  const walletEl = el('p', { class: 'lp-note lp-coin-wallet' });
  const form = el('form', { class: 'lp-form lp-coin-form', novalidate: true, 'aria-label': 'Trade this coin' },
    sideSeg,
    el('div', { class: 'lp-coin-field' }, amountLabel, el('div', { class: 'lp-coin-amount' }, amount, maxBtn)),
    el('div', { class: 'lp-coin-pair' },
      el('label', {}, 'Slippage (bps)', slipIn),
      el('label', {}, 'Priority fee (bps)', prioIn)),
    previewBox, why, submit, result, walletEl);
  const tradeSec = section('Trade', form);

  /* ---------- tape and holders ---------- */
  const th = (label, numeric = false) => el('th', { scope: 'col', class: numeric ? 'num' : undefined }, label);
  const tapeBody = el('tbody');
  const tapeEmpty = el('p', { class: 'lp-empty-note' }, 'No trades yet.');
  const tapeSec = section('Tape', el('p', { class: 'lp-note' }, `The last ${TAPE_ROWS} trades, newest first. Your rows are marked.`),
    el('div', { class: 'lp-table-wrap', tabindex: '0', role: 'region', 'aria-label': 'Tape' }, el('table', { class: 'lp-coin-table' },
      el('caption', { class: 'lp-sr' }, `The last ${TAPE_ROWS} trades of this coin, newest first`),
      el('thead', {}, el('tr', {}, th('Tick', true), th('Side'), th('Who'), th('Wallet'), th('cr', true), th('Tokens', true))),
      tapeBody)), tapeEmpty);
  const holdersBody = el('tbody');
  const holdersNote = el('p', { class: 'lp-note' });
  const holdersSec = section('Holders', holdersNote,
    el('div', { class: 'lp-table-wrap', tabindex: '0', role: 'region', 'aria-label': 'Holders' }, el('table', { class: 'lp-coin-table' },
      el('caption', { class: 'lp-sr' }, `The ${HOLDER_ROWS} largest holders of this coin`),
      el('thead', {}, el('tr', {}, th('Wallet'), th('Who'), th('Cluster'), th('% of supply', true))),
      holdersBody)));
  /** A role badge that is updated in place, for rows that are reused. */
  const roleCell = () => {
    const badge = el('span', { class: 'lp-role' });
    return { cell: el('td', {}, badge), set(role) { setAttr(badge, 'class', `lp-role ${role}`); setText(badge, badgeFor(role)); } };
  };
  const fillTape = rowSlots(tapeBody, TAPE_ROWS, () => {
    const who = roleCell();
    const cells = { tick: el('td', { class: 'num' }), side: el('td', {}), who: who.cell, wallet: el('td', { class: 'lp-coin-wallet-id' }), quote: el('td', { class: 'num' }), base: el('td', { class: 'num' }) };
    const node = el('tr', {}, ...Object.values(cells));
    return {
      node,
      update(t) {
        // Read the wallet from the current run, never a captured world: rows outlive a run.
        who.set(ctx.sim.world.wallets.get(t.wallet)?.role ?? 'human');
        setText(cells.tick, group(t.tick));
        setText(cells.side, t.kind === 'AUCTION_FILL' ? 'fill' : t.side);
        setAttr(cells.side, 'class', t.side === 'sell' ? 'lp-coin-sell' : 'lp-coin-buy');
        setText(cells.wallet, t.wallet);
        setText(cells.quote, num(t.quote));
        setText(cells.base, tokens(t.base));
        node.classList.toggle('lp-coin-you', t.wallet === ctx.viewer);
      },
    };
  });
  const fillHolders = rowSlots(holdersBody, HOLDER_ROWS, () => {
    const who = roleCell();
    const cells = { wallet: el('td', { class: 'lp-coin-wallet-id' }), who: who.cell, cluster: el('td', {}), pct: el('td', { class: 'num' }) };
    const node = el('tr', {}, ...Object.values(cells));
    return {
      node,
      update(r) {
        who.set(r.role);
        setText(cells.wallet, r.creator ? `${r.wallet} (creator)` : r.wallet);
        setText(cells.cluster, r.cluster !== r.wallet ? `funded by ${r.cluster}` : '');
        setText(cells.pct, pct(r.share, 2));
        node.classList.toggle('lp-coin-you', r.wallet === ctx.viewer);
      },
    };
  });

  /* ---------- risk ---------- */
  const riskBadgeBox = el('div', { class: 'lp-coin-badges' });
  const riskParts = lines([['dev', 'Creator holds'], ['bundle', 'Bundled at launch'], ['sniper', 'Bought by others in the first ticks'], ['top10', 'Top-10 holders’ %'], ['devSold', 'Creator has sold'], ['wash', 'Wash trades, % of volume']], 'lp-coin-risk');
  const flagNote = el('p', { class: 'lp-note', hidden: true });
  const riskSec = section('Risk', riskBadgeBox, riskParts.dl, flagNote,
    el('p', { class: 'lp-note' }, 'The score runs 0 to 100 from the parts above: under 25 reads low, over 55 high. A hard flag raises the badge.'));

  const body = el('div', { class: 'lp-coin-body', hidden: true }, head, bars, candleSec, tradeSec, tapeSec, holdersSec, riskSec);
  root.append(el('div', { class: 'lp-coin' }, empty, body));

  /* ---------- reading the run ---------- */
  const current = () => (state.coinId ? ctx.sim.world.coins.get(state.coinId) ?? null : null);
  const viewerWallet = () => ctx.sim.world.wallets.get(ctx.viewer) ?? null;
  const creditsHeld = () => viewerWallet()?.credits ?? units(ctx.sim.scenario.humanCredits ?? '1000');
  const holdingOf = (coin) => viewerWallet()?.positions.get(coin.id)?.base ?? 0n;
  const auctionCap = (coin) => presetOf(ctx.sim.world, coin).Q0 / rulesOf(ctx.sim.world, coin).auction.capDivisor;

  /* ---------- header, bars ---------- */
  function paintHead(coin, world) {
    setAttr(img, 'src', ctx.coinImage(coin));
    setAttr(img, 'alt', `${coin.name} (${coin.symbol}), a simulated coin showing actual Noun #${coin.nounId}`);
    setText(nameEl, coin.name);
    setText(symEl, coin.symbol);
    setHidden(madeTag, !coin.viewerMade);
    const rules = rulesOf(world, coin);
    setText(statusEl, coin.status === 'auction' ? `Opening auction, trading opens in ${plural(Math.max(0, coin.openTick - world.tick), 'tick')}`
      : coin.status === 'migrated' ? 'Graduated: trading in a pool, LP burned'
      : coin.status === 'complete' ? 'Sold out: moving to a pool'
      : 'On the curve');
    setText(factsEl, `Noun #${coin.nounId} · price ${price(coinPrice(coin))} cr per token · market cap ${cr(coinMarketCap(world, coin), 0)} · launched at tick ${group(coin.createdTick)} by ${coin.creator}`);
    const notes = [`${rules.label} rules`];
    if (rules.earlyCap && world.tick < coin.openTick + rules.earlyCap.ticks) notes.push(`early wallet cap ${bpsPct(rules.earlyCap.bps, 0)} of supply until tick ${coin.openTick + rules.earlyCap.ticks}`);
    if (rules.devLock && coin.status !== 'migrated') notes.push('the creator cannot sell before graduation');
    setText(rulesEl, notes.join(' · '));
    const fee = sniperFeeBps(world, coin);
    setHidden(sniperEl, !fee);
    if (fee) setText(sniperEl, `Sniper fee now ${bpsPct(fee)} on buys, falling to 0 by tick ${coin.openTick + rules.sniperFee.ticks}`);
  }

  function paintBars(coin, world) {
    const p = coin.status === 'migrated' ? { tokensBps: 10_000, creditsBps: 10_000 } : progress(coin.curve, presetOf(world, coin));
    soldBar.set(p.tokensBps);
    creditsBar.set(p.creditsBps);
  }

  /* ---------- candles ---------- */
  function paintCandles(coin, world) {
    const iv = INTERVALS.find((i) => i.size === state.size);
    const cs = candles(ctx.sim.index, world, coin, state.size, CANDLES);
    const n = cs.length;
    // With no new trade, the candles only change when one more starts (n, or the first kept one, moves).
    const sig = `${coin.id}|${state.size}|${data.open}|${ctx.sim.index.trades.get(coin.id).length}|${n}|${cs[0].t}`;
    if (sig === state.drawn.candles) return;
    state.drawn.candles = sig;
    let hi = -Infinity, lo = Infinity;
    for (const c of cs) { if (c.h > hi) hi = c.h; if (c.l < lo) lo = c.l; }
    const top = hi, bottom = lo;
    if (!(hi > lo)) { const mid = hi > 0 ? hi : 1; hi = mid * 1.02; lo = mid * 0.98; }
    const padY = (hi - lo) * 0.06;
    hi += padY; lo -= padY;
    const y = (p) => PAD + ((hi - p) / (hi - lo)) * (H - 2 * PAD);
    const slot = W / CANDLES;
    slots.forEach((s, k) => {
      const i = k - (CANDLES - n);
      if (i < 0) { setAttr(s.g, 'visibility', 'hidden'); return; }
      const c = cs[i];
      const cls = c.c >= c.o ? 'up' : 'down';
      const cx = (k * slot + slot / 2).toFixed(2);
      const yo = y(c.o), yc = y(c.c);
      setAttr(s.g, 'visibility', 'visible');
      setAttr(s.wick, 'class', cls);
      setAttr(s.body, 'class', cls);
      setAttr(s.wick, 'x1', cx);
      setAttr(s.wick, 'x2', cx);
      setAttr(s.wick, 'y1', y(c.h).toFixed(2));
      setAttr(s.wick, 'y2', y(c.l).toFixed(2));
      setAttr(s.body, 'x', (k * slot + slot * 0.15).toFixed(2));
      setAttr(s.body, 'width', (slot * 0.7).toFixed(2));
      setAttr(s.body, 'y', Math.min(yo, yc).toFixed(2));
      setAttr(s.body, 'height', Math.max(1, Math.abs(yo - yc)).toFixed(2));
    });
    setText(chartTitle, `${iv.name} candles for ${coin.symbol}: the last ${plural(n, 'candle')}, rising ones in green and falling ones in red`);
    setText(rangeEl, `${iv.name} candles · high ${price(top)} · low ${price(bottom)} · last close ${price(cs[n - 1].c)} cr per token`);
    setText(dataCaption, `The last ${Math.min(n, DATA_ROWS)} ${iv.name.toLowerCase()} candles, newest first`);
    if (data.open) paintCandleData(cs);
  }

  function paintCandleData(cs) {
    keyedRows(dataBody, cs.slice(-DATA_ROWS).reverse(), (c) => c.t, () => {
      const cells = Array.from({ length: 6 }, () => el('td', { class: 'num' }));
      return {
        node: el('tr', {}, ...cells),
        update(c) {
          setText(cells[0], group(c.t));
          [c.o, c.h, c.l, c.c].forEach((p, i) => setText(cells[i + 1], p.toPrecision(4)));
          setText(cells[5], c.v.toFixed(2));
        },
      };
    });
  }

  /* ---------- trade panel ---------- */
  function setLine(dd, text, warn = false) {
    setText(dd, text);
    dd.classList.toggle('lp-coin-warn', warn);
  }

  /** Check the form against the run and fill in the live preview. */
  function paintTrade() {
    const coin = current();
    if (!coin) return;
    const sim = ctx.sim, world = sim.world;
    const finished = world.tick >= sim.scenario.ticks;
    const buying = state.side === 'buy';
    const inAuction = coin.status === 'auction';
    const credits = creditsHeld();
    const held = holdingOf(coin);
    const order = coin.orders.get(ctx.viewer);
    const rules = rulesOf(world, coin);

    setText(amountLabel, buying ? 'Amount (cr)' : 'Amount (tokens)');
    setAttr(amount, 'placeholder', buying ? '25' : 'tokens to sell');
    setHidden(maxBtn, buying);
    const noMax = held === 0n || finished;
    setAttr(maxBtn, 'aria-disabled', String(noMax)); // stays focusable: a sell-all that empties the holding must not drop focus
    setText(submit, buying ? (inAuction ? 'Place auction order' : 'Buy') : 'Sell');
    setText(walletEl, `Credits held ${cr(credits)} · holdings ${tokens(held, 2)} ${coin.symbol}${order ? ` · ${cr(order.amount + order.priorityFee)} in the opening auction` : ''}`);

    const text = amount.value.trim();
    const amt = parseAmount(text);
    const slip = wholeIn(slipIn.value, 0, LIMITS.maxSlippageBps);
    const prio = wholeIn(prioIn.value, 0, LIMITS.maxPriorityFeeBps);
    // field: the input the problem is about, when changing one input can fix it.
    let problem = '', hint = '', pv = null, field = null;
    if (finished) problem = 'The run has finished. Reset to start a new one.';
    else if (!buying && inAuction) problem = `Selling opens when trading opens at tick ${coin.openTick}.`;
    else if (!text) hint = buying ? 'Enter an amount of credits to see the preview.' : held ? 'Enter an amount of tokens, or press Max.' : 'You hold none of this coin yet.';
    else if (!amt) { problem = 'Enter a positive amount with at most 6 decimals.'; field = amount; }
    else if (slip === null) { problem = `Slippage is a whole number of bps from 0 to ${group(LIMITS.maxSlippageBps)}.`; field = slipIn; }
    else if (prio === null) { problem = `Priority fee is a whole number of bps from 0 to ${group(LIMITS.maxPriorityFeeBps)}.`; field = prioIn; }
    else if (buying) {
      const q = units(amt);
      pv = previewBuy(world, coin.id, q, { priorityFeeBps: prio, slippageBps: slip, walletId: ctx.viewer });
      if (!pv) { problem = 'That amount is too small to fill.'; field = amount; }
      else if (pv.venue === 'auction' && pv.accepted === 0n) problem = 'You are already at the auction cap for this coin.';
      else if ((pv.venue === 'auction' ? pv.accepted : q) > credits) { problem = `That is more than your credits held (${cr(credits)}).`; field = amount; }
    } else {
      const q = units(amt);
      pv = previewSell(world, coin.id, q, { priorityFeeBps: prio, slippageBps: slip });
      if (held === 0n) problem = 'You hold none of this coin yet.';
      else if (q > held) { problem = `That is more than your holdings (${tokens(held, 2)} tokens). Max sells all of them.`; field = amount; }
      else if (!pv) { problem = 'That amount is too small to fill.'; field = amount; }
    }

    setHidden(previewBox, !pv);
    if (pv) {
      const isAuction = pv.venue === 'auction';
      setHidden(quote.dl, isAuction);
      setHidden(feesHead, isAuction);
      setHidden(fees.dl, isAuction);
      setHidden(auction.dl, !isAuction);
      setHidden(auctionNote, !isAuction);
      if (isAuction) {
        setText(auction.dt.refused, `Refused over the ${cr(auctionCap(coin), 0)} cap`);
        setLine(auction.dd.accepted, cr(pv.accepted));
        setLine(auction.dd.refused, cr(pv.refused), pv.refused > 0n);
        setLine(auction.dd.priority, cr(pv.priorityFee, 6));
        setLine(auction.dd.estOut, `${tokens(pv.estOut, 2)} tokens`);
        setText(auctionNote, `Orders collect until trading opens at tick ${coin.openTick}, then fill pro rata at one price. Room left under your cap: ${cr(orderRoom(world, coin.id, ctx.viewer))}.`);
      } else {
        setText(quote.dt.out, buying ? 'Tokens out' : 'Credits out');
        setLine(quote.dd.out, buying ? `${tokens(pv.out, 2)} tokens` : cr(pv.out, 6));
        setLine(quote.dd.minOut, buying ? `${tokens(pv.minOut, 2)} tokens` : cr(pv.minOut, 6));
        setLine(quote.dd.impact, `${bpsPct(pv.impactBps)}${pv.impactBps > IMPACT_WARN_BPS ? ' (high)' : ''}`, pv.impactBps > IMPACT_WARN_BPS);
        for (const k of ['creator', 'house', 'lp', 'sniper', 'priority', 'fee']) setLine(fees.dd[k], cr(pv.lines[k], 6), k === 'sniper' && pv.lines.sniper > 0n);
      }
      setHidden(gradNote, !pv.graduates);
      let warn = '';
      if (buying && !isAuction && rules.earlyCap && world.tick < coin.openTick + rules.earlyCap.ticks
        && (held + pv.out) * 10_000n > presetOf(world, coin).supply * BigInt(rules.earlyCap.bps)) {
        warn = `Over the early wallet cap: no wallet may hold more than ${bpsPct(rules.earlyCap.bps, 0)} of supply until tick ${coin.openTick + rules.earlyCap.ticks}, so this will be refused.`;
      } else if (!buying && rules.devLock && coin.creator === ctx.viewer && coin.status !== 'migrated') {
        warn = 'Dev lock: as this coin’s creator you cannot sell before it graduates, so this will be refused.';
      }
      setHidden(warnNote, !warn);
      setText(warnNote, warn);
    }

    const blocked = Boolean(problem || hint || !pv);
    setAttr(submit, 'aria-disabled', String(blocked));
    for (const input of [amount, slipIn, prioIn]) setAttr(input, 'aria-invalid', String(input === field));
    setText(why, problem || hint);
    setHidden(why, !(problem || hint));
    why.classList.toggle('lp-error', Boolean(problem));
    paintResult(coin);
    return { blocked, message: problem || hint };
  }

  /** The latest trade for this coin: pending until its tick runs, then its outcome. A refused record shows until the form changes. */
  function paintResult(coin) {
    if (state.error && state.error.coin === coin.id) {
      setHidden(result, false);
      setText(result, state.error.text);
      setAttr(result, 'class', 'lp-coin-result lp-error');
      return;
    }
    let sub = null;
    for (let i = state.subs.length - 1; i >= 0 && !sub; i--) if (state.subs[i].coin === coin.id) sub = state.subs[i];
    setHidden(result, !sub);
    if (!sub) return;
    if (!sub.outcome) {
      setText(result, `Applies at tick ${sub.tick}.${state.playing ? '' : ' Press Step or Play.'}`);
      setAttr(result, 'class', 'lp-coin-result lp-pending');
    } else {
      setText(result, sub.outcome.text);
      setAttr(result, 'class', `lp-coin-result ${sub.outcome.ok ? 'lp-ok' : 'lp-error'}`);
    }
  }

  /** Read a submitted trade's outcome from the event log once its tick has run. */
  function outcomeOf(sub, sim) {
    const { world } = sim;
    const ev = world.events;
    const mine = [];
    for (let i = sub.from; i < ev.length && ev[i].tick <= sub.tick; i++) {
      const e = ev[i];
      if (e.tick !== sub.tick || e.coin !== sub.coin || state.claimed.has(e.seq)) continue;
      const viewerTrade = (e.type === 'TRADE' || e.type === 'AUCTION_ORDER') && e.wallet === ctx.viewer && e.reason === 'viewer';
      const refused = e.type === 'ENGINE_REFUSE' && e.actor === 'human' && e.wallet === ctx.viewer;
      if ((viewerTrade || refused) && (e.type === 'AUCTION_ORDER' ? sub.side === 'buy' : e.side === sub.side)) mine.push(i);
    }
    // A graduating buy fills in two legs: the curve's last coins, then the overflow from the new pool.
    const overflowAfter = (i) => {
      for (let k = i + 1; k < Math.min(ev.length, i + 4); k++) if (ev[k].type === 'POST_COMPLETE_BUY' && ev[k].wallet === ctx.viewer && ev[k].coin === sub.coin) return ev[k];
      return null;
    };
    const amountOf = (i) => {
      const e = ev[i];
      if (e.type === 'TRADE') return e.side === 'sell' ? e.base : e.quote + (overflowAfter(i)?.quote ?? 0n);
      if (e.type === 'AUCTION_ORDER') return e.quote + e.refused;
      return null;
    };
    const pick = mine.find((i) => amountOf(i) === sub.amount) ?? mine.find((i) => ev[i].type === 'ENGINE_REFUSE') ?? mine[0];
    if (pick !== undefined) {
      const e = ev[pick];
      state.claimed.add(e.seq);
      // previewOut is the preview at the record's priority fee, so a gap here is the price moving.
      const versus = (got, said, fmt) => (said === null ? '.'
        : got === said ? ', exactly the preview.'
        : `. The preview said ${fmt(said)}: trades ahead of yours in that tick moved the price.`);
      if (e.type === 'TRADE' && e.side === 'buy') {
        const extra = overflowAfter(pick);
        const base = e.base + (extra?.base ?? 0n);
        const paid = e.quote + (extra?.quote ?? 0n);
        return { ok: true, text: `Filled: ${tokens(base, 2)} tokens for ${cr(paid)}${versus(base, sub.previewOut, (x) => tokens(x, 2))}${extra ? ' It graduated the coin.' : ''}` };
      }
      if (e.type === 'TRADE') return { ok: true, text: `Sold ${tokens(e.base, 2)} tokens for ${cr(e.quote, 6)}${versus(e.quote, sub.previewOut, (x) => cr(x, 6))}` };
      if (e.type === 'AUCTION_ORDER') {
        const refusedPart = e.refused > 0n ? `, ${cr(e.refused)} refused over the cap` : '';
        return { ok: true, text: `Order placed: ${cr(e.quote)} in the opening auction${refusedPart}. It fills pro rata when trading opens at tick ${world.coins.get(sub.coin).openTick}.` };
      }
      return { ok: false, text: `Refused: ${words(e.reason)}.` };
    }
    const rej = sim.humanRejects.find((r) => r.tick === sub.tick && r.record.coin === sub.coin && r.record.side === sub.side && !state.claimed.has(r));
    if (rej) { state.claimed.add(rej); return { ok: false, text: `Refused: ${words(rej.reason)}.` }; }
    return { ok: false, text: 'No result was recorded for that trade.' };
  }

  function resolveSubs() {
    const sim = ctx.sim;
    for (const sub of state.subs) {
      if (sub.outcome || sim.world.tick <= sub.tick) continue;
      sub.outcome = outcomeOf(sub, sim);
      ctx.actions.announce(sub.outcome.text);
    }
  }

  /* ---------- tape, holders, risk ---------- */
  // Holdings, the tape and the risk parts all change only through the coin's trades and fills, so the
  // coin and its trade count are what they are drawn from.
  function paintTape(coin, trades) {
    const sig = `${coin.id}|${trades.length}`;
    if (sig === state.drawn.tape) return;
    state.drawn.tape = sig;
    const recent = trades.slice(-TAPE_ROWS).reverse();
    setHidden(tapeEmpty, recent.length > 0);
    fillTape(recent);
  }

  function paintHolders(coin, world, trades) {
    const sig = `${coin.id}|${trades.length}`;
    if (sig === state.drawn.holders) return;
    state.drawn.holders = sig;
    const rows = holdersTable(world, coin, HOLDER_ROWS);
    setText(holdersNote, `${plural(coin.holders.size, 'holder')}; the largest ${Math.min(HOLDER_ROWS, rows.length)} shown. The curve and the pool are not holders.`);
    fillHolders(rows);
  }

  const flagWords = (cfg) => ({
    DEV_DUMP: `DEV_DUMP: the creator sold over ${pct(cfg.devDump.share, 0)} of its peak holdings within ${cfg.devDump.ticks} ticks of launch.`,
    BUNDLED: `BUNDLED: wallets the creator funded bought over ${pct(cfg.bundled, 0)} of supply in the launch tick.`,
    WHALE: `WHALE: one cluster holds over ${pct(cfg.whale, 0)} of supply.`,
    WASH: `WASH: over ${pct(cfg.wash, 0)} of volume came from clusters trading both ways within ${cfg.washTicks} ticks.`,
  });

  function paintRisk(coin, world, trades) {
    // The creator's cluster is read from the wallets, so their count is an input too.
    const inputs = `${coin.id}|${trades.length}|${world.wallets.size}`;
    if (inputs === state.drawn.risk) return;
    state.drawn.risk = inputs;
    const r = risk(ctx.sim.index, world, coin);
    const cfg = world.config.risk;
    const sig = `${r.score}|${r.badge}|${r.flags.join(',')}`;
    if (sig !== state.riskSig) {
      state.riskSig = sig;
      riskBadgeBox.replaceChildren(...riskBadges(r));
      const said = flagWords(cfg);
      setHidden(flagNote, !r.flags.length);
      setText(flagNote, r.flags.map((f) => said[f] ?? f).join(' '));
    }
    const p = r.parts;
    setText(riskParts.dt.sniper, `Bought by others in the first ${cfg.sniperTicks} ticks`);
    setText(riskParts.dd.dev, pct(p.dev));
    setText(riskParts.dd.bundle, pct(p.bundle));
    setText(riskParts.dd.sniper, pct(p.sniper));
    setText(riskParts.dd.top10, pct(p.top10));
    setText(riskParts.dd.devSold, `${pct(p.devSold)} of its peak`);
    setText(riskParts.dd.wash, pct(p.washShare));
  }

  /* ---------- events ---------- */
  sizeSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-size]');
    if (!btn) return;
    state.size = Number(btn.dataset.size);
    for (const b of sizeBtns) setAttr(b, 'aria-pressed', String(b === btn));
    const coin = current();
    if (coin) paintCandles(coin, ctx.sim.world);
  });
  data.addEventListener('toggle', () => { const coin = current(); if (coin && data.open) paintCandles(coin, ctx.sim.world); });
  sideSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-side]');
    if (!btn || btn.dataset.side === state.side) return;
    state.error = null;
    state.amounts[state.side] = amount.value;
    state.side = btn.dataset.side;
    amount.value = state.amounts[state.side];
    setAttr(buyBtn, 'aria-pressed', String(state.side === 'buy'));
    setAttr(sellBtn, 'aria-pressed', String(state.side === 'sell'));
    paintTrade();
  });
  maxBtn.addEventListener('click', () => {
    const coin = current();
    if (!coin || maxBtn.getAttribute('aria-disabled') === 'true') return;
    const held = holdingOf(coin);
    state.error = null;
    amount.value = held ? plain(held) : '';
    paintTrade();
  });
  for (const input of [amount, slipIn, prioIn]) input.addEventListener('input', () => { state.error = null; paintTrade(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.error = null;
    const check = paintTrade();
    const coin = current();
    if (!coin || !check) return;
    // The form check is the guard, not the button; Enter in a field lands here too, so say why nothing was recorded.
    if (check.blocked) { if (check.message) ctx.actions.announce(`Not recorded: ${check.message}`); return; }
    const side = state.side;
    const amt = parseAmount(amount.value);
    const slippageBps = wholeIn(slipIn.value, 0, LIMITS.maxSlippageBps);
    const priorityFeeBps = wholeIn(prioIn.value, 0, LIMITS.maxPriorityFeeBps) ?? 0;
    const world = ctx.sim.world;
    const pv = side === 'buy'
      ? previewBuy(world, coin.id, units(amt), { priorityFeeBps, slippageBps, walletId: ctx.viewer })
      : previewSell(world, coin.id, units(amt), { priorityFeeBps, slippageBps });
    const rec = side === 'buy'
      ? { type: 'trade', wallet: ctx.viewer, side, coin: coin.id, quote: amt, slippageBps }
      : { type: 'trade', wallet: ctx.viewer, side, coin: coin.id, base: amt, slippageBps };
    if (priorityFeeBps > 0) rec.priorityFeeBps = priorityFeeBps;
    const sim = ctx.sim;
    const from = sim.world.events.length;
    const res = ctx.actions.record(rec);
    if (!res.ok) {
      state.error = { coin: coin.id, text: res.error };
      paintResult(coin);
      return;
    }
    if (ctx.sim !== sim) return;
    state.subs.push({ tick: res.tick, coin: coin.id, side, amount: units(amt), from, previewOut: pv && pv.venue !== 'auction' ? pv.out : null, outcome: null });
    paintTrade();
    ctx.actions.announce(`${side === 'buy' ? 'Buy' : 'Sell'} recorded. It applies at tick ${res.tick}.`);
  });

  /* ---------- render ---------- */
  /** A new run: every sub-paint draws again (coin ids and trade counts repeat between runs). */
  const undraw = () => { for (const k of Object.keys(state.drawn)) state.drawn[k] = ''; };

  function showEmpty(world) {
    setHidden(body, true);
    setHidden(empty, false);
    setText(emptyNote, ctx.selected
      ? 'That coin has not launched yet in this run. Press Step or Play, or pick a coin from the screener.'
      : world.tick === 0 ? 'No coin yet. Press Step or Play: the first coin launches in the run’s first few ticks.' : 'No coin yet. Keep the run going: coins launch as it plays.');
  }

  return {
    render(info) {
      const sim = ctx.sim;
      const { world } = sim;
      if (sim !== state.sim) { state.sim = sim; state.subs = []; state.claimed = new Set(); state.sig = ''; state.riskSig = ''; state.error = null; undraw(); }
      const sig = `${ctx.selected}|${world.tick}|${world.events.length}|${info.finished}|${info.playing}`;
      if (!info.force && sig === state.sig) return;
      state.sig = sig;
      state.playing = info.playing;
      resolveSubs();
      const coin = ctx.selected ? world.coins.get(ctx.selected) ?? null : null;
      if (!coin || !sim.index.prices.has(coin.id)) { state.coinId = null; showEmpty(world); return; }
      if (coin.id !== state.coinId) { state.coinId = coin.id; state.riskSig = ''; }
      setHidden(empty, true);
      setHidden(body, false);
      paintHead(coin, world);
      paintBars(coin, world);
      paintCandles(coin, world);
      paintTrade();
      const trades = sim.index.trades.get(coin.id);
      paintTape(coin, trades);
      paintHolders(coin, world, trades);
      paintRisk(coin, world, trades);
    },
    reset() {
      state.sim = null;
      state.sig = '';
      state.coinId = null;
      state.subs = [];
      state.claimed = new Set();
      state.riskSig = '';
      state.error = null;
      undraw();
      setHidden(result, true);
    },
  };
}
