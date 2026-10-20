/**
 * The screener (plan §3): one table of coins per tab, over a 5m, 1h, 6h or
 * 24h window, with a watch star and a coin picker on every row. Trending
 * carries "Why this order?", which lists each rank's score and the factors
 * behind it (plan §4.6), so any position can be explained from the run.
 *
 * Rows are keyed by coin id and updated in place; if a reorder at 100× moves
 * the focused button, focus is put back on it.
 */
import { screen, TABS } from '../../lib/launchpad/screener.mjs';
import { WINDOWS } from '../../lib/launchpad/config.mjs';
import { el, setText, setAttr, keyedRows, num, price, age, change, bpsPct, riskBadges } from './ui.mjs';

const TAB_LABEL = Object.freeze({
  trending: 'Trending', new: 'New', graduating: 'About to graduate', graduated: 'Graduated',
  movers: 'Movers', holders: 'Most holders', bots: 'Bot favorites', watchlist: 'Watchlist',
});
const TAB_NOTE = Object.freeze({
  trending: 'Live coins ranked by score over the window. Graduated coins are listed under Graduated.',
  new: 'Newest first.',
  graduating: 'Coins with at least 70% of their graduation raise in, closest first.',
  graduated: 'Coins that moved to a pool, most recent first. LP burned.',
  movers: 'Largest price change over the window, up or down.',
  holders: 'Most holders first.',
  bots: 'Coins where bots made over half of the window’s volume.',
  watchlist: 'Coins you starred, saved in this browser for this run.',
});
const EMPTY = Object.freeze({
  trending: 'No live coin to rank yet.',
  new: 'No coin has launched yet.',
  graduating: 'No coin has 70% of its graduation raise in yet.',
  graduated: 'No coin has graduated yet.',
  movers: 'No coin is trading yet.',
  holders: 'No coin has launched yet.',
  bots: 'No coin where bots made over half of the window’s volume.',
  watchlist: 'Your watchlist is empty: use the star on any row.',
});
const COLUMNS = ['Coin', 'Age', 'Price (cr)', 'Market cap (cr)', 'Liquidity (cr)', 'Volume (cr)', 'Buys / sells', 'Makers', 'Holders', 'Δ', 'Progress', 'Risk'];
const NUMERIC = new Set(['Age', 'Price (cr)', 'Market cap (cr)', 'Liquidity (cr)', 'Volume (cr)', 'Buys / sells', 'Makers', 'Holders', 'Δ', 'Progress']);
const THOUSAND_CR = 1_000_000_000n;
/** trending() clamps the price-change input to this range (screener.mjs), so the explainer marks a clamped value. */
const CHANGE_CAP = [-0.5, 2];

/** Credits for a table cell under a "(cr)" header: whole credits from 1,000 up, two decimals below. */
const amount = (micro) => num(micro, micro >= THOUSAND_CR ? 0 : 2);
const fixed = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '0');
const signed = (x, d = 3) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;

export function mountScreener(root, ctx) {
  root.classList.add('lp-scr');
  let tab = 'trending';
  let win = '5m';
  let lastSig = '';
  let generation = 0;
  let ownAction = false;

  /* ---------- controls ---------- */
  const windowBtns = new Map();
  const windowBar = el('div', { class: 'lp-seg lp-scr-window', role: 'group', 'aria-label': 'Window' });
  for (const w of Object.keys(WINDOWS)) {
    const b = el('button', { type: 'button', 'aria-pressed': String(w === win), 'data-window': w }, w);
    windowBtns.set(w, b);
    windowBar.append(b);
  }
  const tabBtns = new Map();
  const tabBar = el('div', { class: 'lp-scr-tabs', role: 'group', 'aria-label': 'Screener tabs' });
  for (const t of TABS) {
    const b = el('button', { type: 'button', 'aria-pressed': String(t === tab), 'data-tab': t }, TAB_LABEL[t] ?? t);
    tabBtns.set(t, b);
    tabBar.append(b);
  }
  const note = el('p', { class: 'lp-note lp-scr-note' });

  /* ---------- table ---------- */
  const caption = el('caption', { class: 'lp-sr' });
  const headRow = el('tr', {}, el('th', { scope: 'col', class: 'lp-scr-watch' }, el('span', { class: 'lp-sr' }, 'Watch')));
  for (const c of COLUMNS) {
    const cls = [c === 'Coin' ? 'lp-scr-coin' : '', NUMERIC.has(c) ? 'num' : ''].filter(Boolean).join(' ') || undefined;
    headRow.append(el('th', { scope: 'col', class: cls }, c === 'Δ' ? [el('span', { 'aria-hidden': 'true' }, 'Δ'), el('span', { class: 'lp-sr' }, 'Price change')] : c));
  }
  const tbody = el('tbody');
  const table = el('table', { class: 'lp-scr-table' }, caption, el('thead', {}, headRow), tbody);
  const wrap = el('div', { class: 'lp-table-wrap lp-scr-wrap', tabindex: '0', role: 'region', 'aria-label': 'Screener results' }, table);
  const empty = el('p', { class: 'lp-empty-note lp-scr-empty', hidden: true });

  /* ---------- why this order ---------- */
  const whyLegend = el('p', { class: 'lp-note lp-scr-legend' });
  const whyList = el('ol', { class: 'lp-scr-why-list' });
  const whyNone = el('p', { class: 'lp-empty-note', hidden: true }, 'Nothing to rank yet: no live coin.');
  const why = el('details', { class: 'lp-scr-why' }, el('summary', {}, 'Why this order?'), whyLegend, whyList, whyNone);

  root.append(
    el('div', { class: 'lp-scr-head' }, el('h3', {}, 'Screener'), windowBar),
    tabBar, note, wrap, empty, why,
  );

  /* ---------- events ---------- */
  windowBar.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-window]');
    if (!b || b.dataset.window === win) return;
    win = b.dataset.window;
    update(true);
  });
  tabBar.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b || b.dataset.tab === tab) return;
    tab = b.dataset.tab;
    update(true);
  });
  tbody.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    ownAction = true;
    try {
      if (b.dataset.act === 'pick') ctx.actions.select(id);
      else {
        const was = ctx.watchlist.has(id);
        ctx.actions.toggleWatch(id);
        const sym = ctx.sim.world.coins.get(id)?.symbol ?? id;
        ctx.actions.announce(was ? `Removed ${sym} from your watchlist.` : `Added ${sym} to your watchlist.`);
      }
    } finally { ownAction = false; }
  });
  why.addEventListener('toggle', () => update(true));

  /* ---------- rows ---------- */
  function createRow() {
    const star = el('button', { type: 'button', class: 'lp-scr-star', 'data-act': 'watch', 'aria-pressed': 'false' }, el('span', { 'aria-hidden': 'true' }, '☆'));
    const pick = el('button', { type: 'button', class: 'lp-pick', 'data-act': 'pick', 'aria-pressed': 'false' });
    const mine = el('span', { class: 'lp-scr-tag', hidden: true }, 'yours');
    const name = el('span', { class: 'lp-scr-name' });
    const cells = {
      age: el('td', { class: 'num' }), price: el('td', { class: 'num' }), mcap: el('td', { class: 'num' }),
      liq: el('td', { class: 'num' }), vol: el('td', { class: 'num' }),
      bs: el('td', { class: 'num lp-scr-bs' }), makers: el('td', { class: 'num' }), holders: el('td', { class: 'num' }),
      change: el('td', { class: 'num' }), progress: el('td', { class: 'num lp-scr-prog' }), risk: el('td', { class: 'lp-scr-risk' }),
    };
    const buys = el('span', { class: 'lp-scr-buys' }), sells = el('span', { class: 'lp-scr-sells' });
    cells.bs.append(buys, ' / ', sells);
    const progText = el('span'), progState = el('span', { class: 'lp-scr-state', hidden: true });
    const progFill = el('span');
    cells.progress.append(progText, progState, el('span', { class: 'lp-bar lp-scr-bar', 'aria-hidden': 'true' }, progFill));
    const node = el('tr', {},
      el('td', { class: 'lp-scr-watch' }, star),
      el('th', { scope: 'row', class: 'lp-scr-coin' }, el('span', { class: 'lp-scr-pick' }, pick, mine), name),
      ...Object.values(cells));
    let riskSig = '';
    return {
      node,
      update(r) {
        const on = r.id === ctx.selected;
        const watched = ctx.watchlist.has(r.id);
        star.dataset.id = r.id;
        pick.dataset.id = r.id;
        setAttr(star, 'aria-label', `Watch ${r.symbol}`);
        setAttr(star, 'aria-pressed', String(watched));
        setText(star.firstChild, watched ? '★' : '☆');
        setText(pick, r.symbol);
        setAttr(pick, 'aria-pressed', String(on));
        node.classList.toggle('lp-scr-on', on);
        mine.hidden = !r.viewerMade;
        setText(name, r.name);
        setText(cells.age, age(r.age));
        setText(cells.price, price(r.price));
        setText(cells.mcap, amount(r.mcap));
        setText(cells.liq, amount(r.liquidity));
        setText(cells.vol, amount(r.volume));
        setText(buys, r.buys);
        setText(sells, r.sells);
        setText(cells.makers, r.makers);
        setText(cells.holders, r.holders);
        setText(cells.change, change(r.change));
        cells.change.classList.toggle('lp-scr-up', r.change > 0);
        cells.change.classList.toggle('lp-scr-down', r.change < 0);
        const bps = r.status === 'migrated' ? 10_000 : r.progress.creditsBps;
        setText(progText, bpsPct(bps, 1));
        const state = r.status === 'migrated' ? 'graduated' : r.status === 'auction' ? 'auction' : '';
        progState.hidden = !state;
        setText(progState, state);
        const width = `${Math.min(100, bps / 100)}%`;
        if (progFill.style.width !== width) progFill.style.width = width;
        const sig = `${r.risk.badge}|${r.risk.score}|${r.risk.flags.join(',')}`;
        if (sig !== riskSig) { riskSig = sig; cells.risk.replaceChildren(...riskBadges(r.risk)); }
      },
    };
  }

  /** One "Why this order?" entry: the score, its factors, and the inputs behind the base. */
  function createWhy() {
    const sym = el('strong', { class: 'lp-scr-sym' });
    const score = el('span');
    const factors = el('span', { class: 'lp-scr-factors' });
    const inputs = el('span', { class: 'lp-scr-inputs' });
    const notes = el('span', { class: 'lp-scr-inputs', hidden: true });
    const node = el('li', {}, el('span', { class: 'lp-scr-line' }, sym, score), factors, inputs, notes);
    return {
      node,
      update(r) {
        const t = r.trend;
        const p = r.risk.parts;
        const cfg = ctx.sim.world.config.trending;
        setText(sym, r.symbol);
        setText(score, ` score ${fixed(t.score, 4)}`);
        setText(factors, `= strength ${fixed(t.strength)} × trust ${fixed(t.trust, 2)} × warm-up ${fixed(t.warm, 2)} × decay ${fixed(t.decay)} × boost ${fixed(t.boost, 2)}`);
        const i = t.inputs;
        const capped = i.change <= CHANGE_CAP[0] || i.change >= CHANGE_CAP[1] ? ' (capped)' : '';
        setText(inputs, `base ${signed(t.base)} from breadth ${fixed(i.breadth, 2)}, organic ${fixed(i.organic, 2)}, trades ${i.txns}, price change ${change(i.change)}${capped}, holder growth ${signed(i.holders, 2)}, liquidity ${fixed(i.liquidity, 2)}, reactions ${i.reactions}`);
        const why = [];
        if (t.trust < 1) {
          const lows = [p.dev > 0.1 && 'dev over 10%', p.bundle > 0.2 && 'bundle over 20%', p.top10 > 0.6 && 'top-10 holders’ % over 60%'].filter(Boolean);
          why.push(`trust lowered: ${lows.join(', ')}`);
        }
        if (t.age < 0) why.push(`warm-up 0: still in its opening auction; trading opens in ${-t.age}s`);
        else if (t.warm < 1) why.push(`warm-up: ${t.age} of ${cfg.warmupTicks} ticks since trading opened`);
        notes.hidden = !why.length;
        setText(notes, why.join('. '));
      },
    };
  }

  function legend() {
    const cfg = ctx.sim.world.config.trending;
    const w = cfg.weights;
    const p = (k) => `${Math.round(w[k] * 100)}%`;
    return `score = strength × trust × warm-up × decay × boost. strength = ln(1 + e^base), where base weighs z-scores across live coins: ${p('breadth')} breadth, ${p('organic')} organic makers, ${p('txns')} trades, ${p('change')} price change, ${p('holders')} holder growth, ${p('liquidity')} liquidity, ${p('reactions')} reactions (0 here). Breadth, organic and liquidity are log-scaled; price change is capped at −50% and +200%; holder growth is the change in holders divided by the earlier count, or by 10 when that is smaller. With one live coin every z-score is 0, so its base is 0. Trust drops for a dev holding over 10%, a bundle over 20% or top-10 holders’ % over 60%. Warm-up ramps over the first ${cfg.warmupTicks} ticks of trading; decay halves every ${age(cfg.halfLifeTicks)}; boost is 1 (no boosts here). Equal scores are listed by coin id.`;
  }

  /* ---------- focus ---------- */
  /** Where focus sits in the table before an update: the element, its row position and its action. */
  function focusSpot() {
    const a = document.activeElement;
    if (!a || !tbody.contains(a)) return null;
    const tr = a.closest('tr');
    return { node: a, act: a.dataset.act, at: [...tbody.children].indexOf(tr) };
  }

  /**
   * Before keyedRows, when focus is in the table: drop the rows leaving the
   * tab and put the staying rows in their new order around the focused row,
   * moving only the others. Moving a node drops its focus, so the focused row
   * stays put and a reorder at 100× never blurs and re-focuses the button
   * (which a screen reader would announce again every time).
   */
  function holdFocusedRow(spot, rows) {
    const map = tbody.__rows;
    const fr = spot?.node.closest('tr');
    if (!map || !fr) return;
    const want = new Set(rows.map((r) => r.id));
    for (const [id, row] of map) if (!want.has(id) && row.node !== fr && row.node.parentNode === tbody) row.node.remove();
    const order = [];
    for (const r of rows) { const row = map.get(r.id); if (row) order.push(row.node); }
    const at = order.indexOf(fr);
    if (at < 0) return; // the focused row is leaving the tab: restoreFocus picks the next spot
    let ref = fr;
    for (let i = at - 1; i >= 0; i--) { if (ref.previousSibling !== order[i]) tbody.insertBefore(order[i], ref); ref = order[i]; }
    ref = fr;
    for (let i = at + 1; i < order.length; i++) { if (ref.nextSibling !== order[i]) tbody.insertBefore(order[i], ref.nextSibling); ref = order[i]; }
  }

  /**
   * Put focus back after rows moved or left the tab: on the same button when
   * it is still there; after the viewer's own un-star, on the same column of
   * the row that took its place; otherwise (a coin left the tab as the run
   * played) on the tab button, so Enter never lands on a coin nobody chose.
   */
  function restoreFocus(spot) {
    if (!spot || document.activeElement === spot.node) return;
    if (spot.node.isConnected && !wrap.hidden) { spot.node.focus({ preventScroll: true }); return; }
    const rows = tbody.children;
    const row = ownAction && rows.length && !wrap.hidden ? rows[Math.min(spot.at, rows.length - 1)] : null;
    const target = row?.querySelector(`button[data-act="${spot.act}"]`) ?? tabBtns.get(tab);
    target.focus({ preventScroll: true });
  }

  /* ---------- render ---------- */
  function update(force = false) {
    const sim = ctx.sim;
    if (!sim) return;
    const { world, index } = sim;
    const watch = [...ctx.watchlist];
    const sig = [generation, world.tick, world.events.length, tab, win, ctx.selected, watch.join(','), why.open].join('|');
    if (!force && sig === lastSig) return;
    lastSig = sig;

    for (const [t, b] of tabBtns) setAttr(b, 'aria-pressed', String(t === tab));
    for (const [w, b] of windowBtns) setAttr(b, 'aria-pressed', String(w === win));
    const present = watch.filter((id) => world.coins.has(id)).length;
    setText(tabBtns.get('watchlist'), `${TAB_LABEL.watchlist} (${present})`);
    setText(note, TAB_NOTE[tab]);
    setText(caption, `Screener: ${TAB_LABEL[tab]}, ${win} window`);

    const rows = screen(index, world, { tab, windowTicks: WINDOWS[win], ids: watch });
    const spot = focusSpot();
    holdFocusedRow(spot, rows);
    keyedRows(tbody, rows, (r) => r.id, createRow);
    wrap.hidden = !rows.length;
    empty.hidden = Boolean(rows.length);
    if (!rows.length) setText(empty, tab === 'watchlist' && watch.length ? 'None of your starred coins has launched in this run yet.' : EMPTY[tab]);
    restoreFocus(spot);

    why.hidden = tab !== 'trending';
    if (tab === 'trending' && why.open) {
      setText(whyLegend, legend());
      keyedRows(whyList, rows, (r) => r.id, createWhy);
      whyList.hidden = !rows.length;
      whyNone.hidden = Boolean(rows.length);
    }
  }

  return {
    /** The signature covers every input (tick, tab, window, selection, watchlist), so a forced paint with nothing new is skipped too. */
    render() { update(); },
    reset() {
      generation += 1;
      lastSig = '';
      tbody.replaceChildren();
      delete tbody.__rows;
      whyList.replaceChildren();
      delete whyList.__rows;
    },
  };
}
