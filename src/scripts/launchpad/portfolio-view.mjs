/**
 * The Portfolio panel (plan §3, "Portfolio") for the viewer's wallet: credits
 * held, open auction orders, positions at what selling them now would pay
 * after fees, net credits (realized and unrealized change in credits),
 * creator fees for coins the viewer launched, the last trades, and the
 * season rank by net credits.
 *
 * The ledger line checks the portfolio identity to the micro-credit:
 *   credits held + cost of open positions + auction orders
 *     = starting credits + realized change + creator fees received.
 * Ranking touches every wallet, so it runs at most once per tick.
 */
import { portfolio, standings } from '../../lib/launchpad/portfolio.mjs';
import { units, ONE } from '../../lib/launchpad/units.mjs';
import { el, setText, setAttr, keyedRows, num, tokens, price, bpsPct } from './ui.mjs';

const HISTORY_ROWS = 20;
const STATUS_WORDS = Object.freeze({ auction: 'opening auction', curve: 'on the curve', complete: 'moving to a pool', migrated: 'graduated · LP burned' });
const KIND_WORDS = Object.freeze({ AUCTION_FILL: 'auction fill', POST_COMPLETE_BUY: 'buy (pool)' });
/** The totals grid: key, label, and a short note on how the figure is made. */
const TOTALS = Object.freeze([
  ['credits', 'Credits held', ''],
  ['escrow', 'In open auction orders', 'held until trading opens'],
  ['cost', 'Cost of open positions', ''],
  ['value', 'Value now', 'if you sold every position now, after fees'],
  ['realized', 'Realized change in credits', 'from sells so far'],
  ['unrealized', 'Unrealized change in credits', 'value now less cost'],
  ['net', 'Net credits', 'realized plus unrealized'],
  ['fees', 'Creator fees received', 'paid out by sweeps'],
  ['rank', 'Season rank', 'by net credits'],
]);

const group = (n) => n.toLocaleString('en-US');
/** A signed amount: +12.34 or −3.21; one that rounds to zero reads 0.00. */
function signed(micro, digits = 2) {
  const t = num(micro, digits);
  if (/^−?0(\.0+)?$/.test(t)) return num(0n, digits);
  return micro > 0n ? `+${t}` : t;
}
/** Whole tokens for large holdings, two decimals below 1,000. */
const tok = (micro) => tokens(micro, micro < 1000n * ONE ? 2 : 0);
/** Credits without decimals when there is no fraction (the starting credits). */
const whole = (micro) => num(micro, micro % ONE ? 2 : 0);
/** Green for a rise, red for a fall. */
function tone(node, micro) {
  node.classList.toggle('lp-pf-up', micro > 0n);
  node.classList.toggle('lp-pf-down', micro < 0n);
}
const th = (label, cls) => el('th', { scope: 'col', class: cls }, label);
const td = (cls = 'num') => el('td', { class: cls });
const section = (title, ...kids) => el('section', { class: 'lp-pf-sec' }, el('h4', {}, title), ...kids);
/** A table inside the shared sideways-scroll wrapper. */
const tableIn = (caption, head, body, extra = '') => el('div', { class: 'lp-table-wrap lp-pf-wrap', tabindex: '0', role: 'region', 'aria-label': caption },
  el('table', { class: `lp-pf-table ${extra}`.trim() }, el('caption', { class: 'lp-sr' }, caption), el('thead', {}, el('tr', {}, ...head)), body));

export function mountPortfolio(root, ctx) {
  root.classList.add('lp-pf');
  const state = { sim: null, sig: '', cache: null, playing: false };

  /* ---------- header and empty state ---------- */
  const walletEl = el('p', { class: 'lp-note lp-pf-wallet' });
  const startNote = el('p', { class: 'lp-empty-note lp-pf-start' });
  const pendingNote = el('p', { class: 'lp-note lp-pending', hidden: true });
  const empty = el('div', { class: 'lp-pf-empty' }, startNote, pendingNote,
    el('p', { class: 'lp-note' }, 'Buy a coin in the coin drawer, or launch one in the Create tab. Your positions, net credits and season rank show here once your first action runs.'));

  /* ---------- totals and ledger check ---------- */
  const totals = el('dl', { class: 'lp-pf-totals' });
  const dd = {};
  for (const [key, label, hint] of TOTALS) {
    dd[key] = el('dd', {});
    totals.append(el('div', { class: `lp-pf-cell${key === 'net' || key === 'rank' ? ' lp-pf-key' : ''}` },
      el('dt', {}, label, hint ? el('span', { class: 'lp-pf-hint' }, hint) : null), dd[key]));
  }
  const ledgerEl = el('p', { class: 'lp-pf-ledger' });
  const identityEl = el('p', { class: 'lp-note lp-pf-identity' });
  const proof = el('details', { class: 'lp-pf-proof' }, el('summary', {}, 'Show the ledger sum'), identityEl);
  const rankNote = el('p', { class: 'lp-note lp-pf-ranknote' });
  const totalsSec = section('Totals', totals, ledgerEl, proof, rankNote);

  /* ---------- positions ---------- */
  const posBody = el('tbody');
  const posWrap = tableIn('Your open positions, largest value now first',
    [th('Coin', 'lp-pf-coin'), th('Tokens', 'num'), th('Avg price (cr)', 'num'), th('Cost (cr)', 'num'), th('Value now (cr)', 'num'), th('Unrealized (cr)', 'num'), th('Status')], posBody);
  const posEmpty = el('p', { class: 'lp-empty-note', hidden: true }, 'No open positions.');
  const ordersNote = el('p', { class: 'lp-note lp-pf-orders', hidden: true });
  const posSec = section('Positions',
    el('p', { class: 'lp-note' }, 'Avg price is cost per token. Value now is what selling the whole position now would pay, after fees. Pick a coin to open it in the coin drawer.'),
    posWrap, posEmpty, ordersNote);

  /* ---------- coins you launched ---------- */
  const madeBody = el('tbody');
  const madeWrap = tableIn('Coins you launched, with their creator fees',
    [th('Coin', 'lp-pf-coin'), th('Fees held (cr)', 'num'), th('Swept so far (cr)', 'num'), th('Creator payout split', 'lp-pf-wrapth')], madeBody);
  const madeEmpty = el('p', { class: 'lp-empty-note' }, 'You have not launched a coin. Launch one in the Create tab.');
  const madeNote = el('p', { class: 'lp-note', hidden: true }, 'Creator fees collect on each coin and are paid out at each sweep. Set the creator payout split once in the Creator tab; after that it is locked.');
  const madeSec = section('Coins you launched', madeWrap, madeEmpty, madeNote);

  /* ---------- history ---------- */
  const histBody = el('tbody');
  const histWrap = tableIn(`Your last ${HISTORY_ROWS} trades, newest first`,
    [th('Tick', 'num'), th('Coin'), th('Side'), th('Credits (cr)', 'num'), th('Tokens', 'num')], histBody, 'lp-pf-narrow');
  const histEmpty = el('p', { class: 'lp-empty-note' }, 'No trades yet.');
  const histSec = section('History', el('p', { class: 'lp-note' }, `Your last ${HISTORY_ROWS} trades, newest first.`), histWrap, histEmpty);

  const body = el('div', { class: 'lp-pf-body', hidden: true }, totalsSec, posSec, madeSec, histSec);
  root.append(el('div', { class: 'lp-pf-head' }, el('h3', {}, 'Portfolio'), walletEl), empty, body);

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-pick]');
    if (b && b.dataset.pick) ctx.actions.select(b.dataset.pick);
  });

  /* ---------- reading the run ---------- */
  /** The portfolio and rank for this tick: computed once per tick, whatever else re-renders. */
  function read() {
    const sim = ctx.sim, world = sim.world;
    const key = `${world.tick}|${world.events.length}`;
    if (state.cache && state.cache.sim === sim && state.cache.key === key) return state.cache;
    const pf = portfolio(world, sim.index, ctx.viewer, { historyLimit: HISTORY_ROWS, withRank: false });
    let rank = null, of = 0;
    if (pf) {
      const table = standings(world);
      const at = table.findIndex((r) => r.wallet === ctx.viewer);
      rank = at >= 0 ? at + 1 : null;
      of = table.length;
    }
    const orders = [];
    if (pf) for (const coin of world.coins.values()) {
      const o = coin.orders.get(ctx.viewer);
      if (o) orders.push({ symbol: coin.symbol, amount: o.amount + o.priorityFee, openTick: coin.openTick });
    }
    state.cache = { sim, key, pf, rank, of, orders };
    return state.cache;
  }

  /** Put focus back on a coin button that a reorder moved. */
  function keepFocus(container, update) {
    const a = document.activeElement;
    const had = a && container.contains(a) ? a : null;
    update();
    if (had && had.isConnected && document.activeElement !== had) had.focus({ preventScroll: true });
  }

  /* ---------- rows ---------- */
  function coinCell() {
    const pick = el('button', { type: 'button', class: 'lp-pick', 'data-pick': '', 'aria-pressed': 'false' });
    const name = el('span', { class: 'lp-pf-name' });
    return {
      cell: el('th', { scope: 'row', class: 'lp-pf-coin' }, pick, name),
      set(id, symbol) {
        pick.dataset.pick = id;
        setText(pick, symbol);
        setAttr(pick, 'aria-pressed', String(id === ctx.selected));
        setText(name, ctx.sim.world.coins.get(id)?.name ?? '');
      },
    };
  }

  function createPosition() {
    const coin = coinCell();
    const cells = { base: td(), avg: td(), cost: td(), value: td(), unrealized: td(), status: td('lp-pf-status') };
    return {
      node: el('tr', {}, coin.cell, ...Object.values(cells)),
      update(p) {
        coin.set(p.coin, p.symbol);
        setText(cells.base, tok(p.base));
        setText(cells.avg, price(p.avgPrice));
        setText(cells.cost, num(p.cost));
        setText(cells.value, num(p.value));
        setText(cells.unrealized, signed(p.unrealized));
        tone(cells.unrealized, p.unrealized);
        setText(cells.status, STATUS_WORDS[p.status] ?? p.status);
      },
    };
  }

  function createMade() {
    const coin = coinCell();
    const cells = { held: td(), swept: td(), split: td('lp-pf-split') };
    return {
      node: el('tr', {}, coin.cell, ...Object.values(cells)),
      update(c) {
        coin.set(c.coin, c.symbol);
        setText(cells.held, num(c.feesHeld));
        setText(cells.swept, num(c.feesSwept));
        const parts = c.split.map((s) => `${s.wallet === ctx.viewer ? 'you' : s.wallet} ${bpsPct(s.bps, s.bps % 100 ? 2 : 0)}`).join(', ');
        setText(cells.split, c.splitLocked ? `Locked: ${parts}` : 'Not set: all to you. Set it once in the Creator tab.');
        cells.split.classList.toggle('lp-pf-open', !c.splitLocked);
      },
    };
  }

  function createTrade() {
    const cells = { tick: td(), coin: td('lp-pf-sym'), side: td(''), quote: td(), base: td() };
    return {
      node: el('tr', {}, ...Object.values(cells)),
      update(t) {
        setText(cells.tick, group(t.tick));
        setText(cells.coin, t.symbol);
        setText(cells.side, KIND_WORDS[t.kind] ?? t.side);
        setAttr(cells.side, 'class', t.side === 'sell' ? 'lp-pf-sell' : 'lp-pf-buy');
        setText(cells.quote, num(t.quote));
        setText(cells.base, tok(t.base));
      },
    };
  }

  /* ---------- paint ---------- */
  function paintEmpty(world) {
    const start = units(ctx.sim.scenario.humanCredits ?? '1000');
    setText(startNote, `You have not traded yet. You start with ${whole(start)} play credits.`);
    // Only the records the next Step runs: a replay's log also holds records for later ticks.
    const live = world.tick < ctx.sim.scenario.ticks;
    const mine = live ? ctx.sim.log.filter((r) => r.wallet === ctx.viewer && r.tick === world.tick) : [];
    pendingNote.hidden = !mine.length;
    if (mine.length) setText(pendingNote, `${mine.length === 1 ? 'Your first action applies' : `Your ${mine.length} actions apply`} at tick ${group(world.tick)}${state.playing ? '.' : ': press Step or Play.'}`);
  }

  function paintTotals({ pf, rank, of }) {
    const t = pf.totals;
    setText(dd.credits, `${num(t.credits)} cr`);
    setText(dd.escrow, `${num(t.escrow)} cr`);
    setText(dd.cost, `${num(t.cost)} cr`);
    setText(dd.value, `${num(t.value)} cr`);
    for (const k of ['realized', 'unrealized', 'net']) { setText(dd[k], `${signed(t[k])} cr`); tone(dd[k], t[k]); }
    setText(dd.fees, `${num(t.feesReceived)} cr`);
    setText(dd.rank, rank ? `#${group(rank)} of ${group(of)}` : 'not ranked yet');
    const field = of ? `the ${group(of)} wallets` : 'the wallets';
    setText(rankNote, `Season rank orders ${field} that have traded in this run by net credits${rank ? '.' : '; yours joins once you hold a coin.'}`);

    const ok = pf.ledgerDrift === 0n;
    setText(ledgerEl, ok
      ? 'Ledger check: net credits match the ledger to the micro-credit.'
      : `Ledger check: off by ${signed(pf.ledgerDrift, 6)} cr. Credits held, cost of open positions and auction orders should add up to starting credits plus realized change plus creator fees.`);
    setAttr(ledgerEl, 'class', `lp-pf-ledger ${ok ? 'lp-ok' : 'lp-error'}`);
    const six = (m) => num(m, 6);
    const plusMinus = (m) => (m < 0n ? `− ${six(-m)}` : `+ ${six(m)}`);
    setText(identityEl, `Credits held ${six(t.credits)} + cost of open positions ${six(t.cost)} + auction orders ${six(t.escrow)} = ${six(t.credits + t.cost + t.escrow)} cr. `
      + `Starting credits ${six(t.started)} ${plusMinus(t.realized)} realized change + creator fees ${six(t.feesReceived)} = ${six(t.started + t.realized + t.feesReceived)} cr.`);
  }

  function paintPositions({ pf, orders }) {
    keepFocus(posBody, () => keyedRows(posBody, pf.positions, (p) => p.coin, createPosition));
    posWrap.hidden = !pf.positions.length;
    posEmpty.hidden = Boolean(pf.positions.length);
    ordersNote.hidden = !orders.length;
    if (orders.length) {
      setText(ordersNote, `Open auction orders: ${orders.map((o) => `${o.symbol} ${num(o.amount)} cr, a pro-rata fill when trading opens at tick ${group(o.openTick)}`).join('; ')}.`);
    }
  }

  function paintMade({ pf }) {
    const made = pf.createdCoins;
    keepFocus(madeBody, () => keyedRows(madeBody, made, (c) => c.coin, createMade));
    madeWrap.hidden = !made.length;
    madeNote.hidden = !made.length;
    madeEmpty.hidden = Boolean(made.length);
  }

  function paintHistory({ pf }) {
    keyedRows(histBody, pf.history, (t) => t.seq, createTrade);
    histWrap.hidden = !pf.history.length;
    histEmpty.hidden = Boolean(pf.history.length);
  }

  return {
    /** The signature covers every input (run, tick, events, selection, queued records, play state), so a forced paint with nothing new is skipped. */
    render(info) {
      const sim = ctx.sim;
      if (!sim) return;
      const { world } = sim;
      if (sim !== state.sim) { state.sim = sim; state.sig = ''; state.cache = null; }
      const wallet = world.wallets.get(ctx.viewer);
      const queued = wallet ? 0 : sim.log.length;
      const sig = `${world.tick}|${world.events.length}|${ctx.selected}|${queued}|${info.playing}`;
      if (sig === state.sig) return;
      state.sig = sig;
      state.playing = info.playing;
      setText(walletEl, `Your wallet (${ctx.viewer}) · amounts in play credits (cr)`);
      const data = wallet ? read() : null;
      empty.hidden = Boolean(data?.pf);
      body.hidden = !data?.pf;
      if (!data?.pf) { paintEmpty(world); return; }
      paintTotals(data);
      paintPositions(data);
      paintMade(data);
      paintHistory(data);
    },
    reset() {
      state.sim = null;
      state.sig = '';
      state.cache = null;
      for (const tbody of [posBody, madeBody, histBody]) { tbody.replaceChildren(); delete tbody.__rows; }
    },
  };
}
