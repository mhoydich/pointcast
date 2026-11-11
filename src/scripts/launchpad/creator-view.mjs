/**
 * The Creator panel (plan §3 "Creator view") for coins the viewer launched:
 * creator fees accrued, held and swept, the creator payout split they are
 * swept to, holders and the risk badge, and a one-time editor for the split
 * (a `split` record, plan §8.4).
 *
 * The creator payout split is not the fee split. Every trade's fee splits
 * into creator, house and LP lines (plan §4.3); the payout split only decides
 * who receives the creator line when held fees are swept, every 600 ticks.
 * It can be set once and then it locks (engine `setFeeSplit`). What each
 * recipient has been paid is read from the event log as it grows: a SWEEP
 * pays each recipient floor(swept·bps/10000) and the first one the
 * remainder, as the engine does, so the paid column sums to the swept total.
 */
import { risk } from '../../lib/launchpad/screener.mjs';
import { LIMITS } from '../../lib/launchpad/config.mjs';
import { el, setText, setAttr, keyedRows, cr, num, pct, bpsPct, riskBadges } from './ui.mjs';

/** sim.mjs sweeps held creator fees in every tick that is a multiple of 600 (plan §5.1, phase 6). */
const SWEEP_EVERY = 600;
const TOTAL_BPS = 10_000;
const MAX_ROWS = LIMITS.feeSplitMax;
const STATUS_WORDS = Object.freeze({ auction: 'opening auction', curve: 'on the curve', complete: 'moving to a pool', migrated: 'graduated · LP burned' });
/** Refusals of a split record, in plain words. */
const SPLIT_REASON = Object.freeze({
  SPLIT_LOCKED: 'this coin’s creator payout split was already set, and it can be set only once',
  BAD_SPLIT: 'a split needs 1 to 10 recipients, each an existing wallet listed once with a whole number of bps above 0, summing to 10,000',
  NOT_CREATOR: 'only the wallet that launched a coin can set its creator payout split',
  NO_COIN: 'that coin is not in this run',
  NOT_HUMAN: 'that wallet is not a viewer wallet',
});
/** Datalist order: the viewer first, then devs, bots, copy-traders, bundle wallets and retail. */
const ROLE_ORDER = Object.freeze({ human: 0, dev: 1, sniper: 2, bot: 3, copy: 4, bundler: 5, retail: 6 });
const ROLE_WORDS = Object.freeze({ human: 'viewer wallet', dev: 'dev wallet', copy: 'copy-trader', retail: 'retail wallet' });

const group = (n) => n.toLocaleString('en-US');
const plural = (n, word) => `${group(n)} ${word}${n === 1 ? '' : 's'}`;
const th = (label, cls) => el('th', { scope: 'col', class: cls }, label);
const section = (title, ...kids) => el('section', { class: 'lp-ctr-sec' }, el('h4', {}, title), ...kids);
/** A dl of label–value lines (the shared .lp-lines layout); returns the dl and its dd nodes by key. */
function lines(cls, entries) {
  const dl = el('dl', { class: `lp-lines ${cls}` });
  const dd = {};
  for (const [key, label] of entries) { dd[key] = el('dd'); dl.append(el('dt', {}, label), dd[key]); }
  return { dl, dd };
}
/** A typed bps value: a whole number above 0 (group commas allowed, as the sum line shows them), or null. */
function parseBps(text) {
  const t = String(text).replace(/[,\s]/g, '');
  return /^\d{1,5}$/.test(t) && Number(t) > 0 ? Number(t) : null;
}
/** [7] → "tick 7"; [7, 11] → "ticks 7 and 11"; [7, 9, 11] → "ticks 7, 9 and 11". */
function tickList(ticks) {
  const t = ticks.map(group);
  return t.length === 1 ? `tick ${t[0]}` : `ticks ${t.slice(0, -1).join(', ')} and ${t[t.length - 1]}`;
}
/** The first tick at or after `t` that runs a sweep. */
const nextSweep = (t) => Math.max(SWEEP_EVERY, Math.ceil(t / SWEEP_EVERY) * SWEEP_EVERY);

export function mountCreator(root, ctx) {
  root.classList.add('lp-ctr');
  let generation = 0;
  let lastSig = '';
  let chosen = null;          // coin id shown
  let picked = false;         // the viewer chose a coin with the chooser (stop following the newest)
  let seenNewest = null;      // the newest viewer coin already considered for showing
  let loadedFor = null;       // coin id whose split the editor rows hold
  let showErrors = false;     // after a refused Save, problems update as the viewer types
  let saveError = '';
  let rowSeq = 0;
  let rows = [];
  let cursor = 0;             // event log position read so far
  let walletCount = -1;
  let riskKey = '';
  let riskSig = '';
  let lastState = null;
  let lastPlaying = false;
  const drafts = new Map();   // coin id → unsaved editor rows
  const ledger = new Map();   // coin id → { split, paid: Map(wallet → µcr), sweeps, lockedTick }
  const submitted = new WeakSet();
  const announced = new WeakSet();

  /* ---------- header and empty state ---------- */
  // Shown above the empty state and above the coins alike, so a second launch is visible too.
  const launchNote = el('p', { class: 'lp-note lp-pending lp-ctr-launching', hidden: true });
  const empty = el('div', { class: 'lp-ctr-empty' },
    el('p', { class: 'lp-empty-note lp-ctr-start' }, 'Launch a coin in Create to set its creator payout split.'));

  /* ---------- coin chooser and coin line ---------- */
  const chooser = el('div', { class: 'lp-seg lp-ctr-choose', role: 'group', 'aria-labelledby': 'lp-ctr-choose-label' });
  const chooseRow = el('div', { class: 'lp-ctr-chooser' }, el('span', { class: 'lp-ctr-choose-label', id: 'lp-ctr-choose-label' }, 'Your coins'), chooser);
  const img = el('img', { class: 'lp-ctr-img', width: 56, height: 56, alt: '', decoding: 'async' });
  const coinName = el('strong', { class: 'lp-ctr-name' });
  const coinSym = el('span', { class: 'lp-ctr-sym' });
  const coinMeta = el('span', { class: 'lp-ctr-meta' });
  const drawerBtn = el('button', { type: 'button', class: 'lp-ctr-drawer' }, 'Show in the coin drawer');
  const coinLine = el('div', { class: 'lp-ctr-coin' }, img, el('div', { class: 'lp-ctr-id' }, coinName, coinSym, coinMeta), drawerBtn);

  /* ---------- creator fees ---------- */
  const fees = lines('lp-ctr-fees', [['accrued', 'Accrued (held + swept)'], ['held', 'Held on the coin now'], ['swept', 'Swept so far'], ['next', 'Next sweep']]);
  const feesSec = section('Creator fees', fees.dl,
    el('p', { class: 'lp-note' }, `Held fees are swept to the creator payout split every ${SWEEP_EVERY} ticks. A sweep pays each recipient its bps of the amount, rounded down, and the remainder to the first recipient.`));

  /* ---------- the current split ---------- */
  const splitBody = el('tbody');
  const footCells = { bps: el('td', { class: 'num' }), pct: el('td', { class: 'num' }), paid: el('td', { class: 'num' }) };
  const splitWrap = el('div', { class: 'lp-table-wrap lp-ctr-wrap', tabindex: '0', role: 'region', 'aria-label': 'Creator payout split' },
    el('table', { class: 'lp-ctr-table' }, el('caption', { class: 'lp-sr' }, 'The coin’s creator payout split, with what each recipient has been paid by sweeps'),
      el('thead', {}, el('tr', {}, th('Wallet'), th('bps', 'num'), th('%', 'num'), th('Paid so far (cr)', 'num'))), splitBody,
      el('tfoot', {}, el('tr', {}, el('th', { scope: 'row' }, 'All recipients'), footCells.bps, footCells.pct, footCells.paid))));
  const splitNote = el('p', { class: 'lp-note lp-ctr-splitnote' });
  const status = el('p', { class: 'lp-ctr-status', id: 'lp-ctr-status', tabindex: '-1', hidden: true });
  const lockedNote = el('p', { class: 'lp-ctr-locked', id: 'lp-ctr-locked', hidden: true }, 'Locked: a creator payout split can be set once.');

  /* ---------- the split editor ---------- */
  const datalist = el('datalist', { id: 'lp-ctr-wallets' });
  const rowsBox = el('div', { class: 'lp-ctr-rows' });
  const addBtn = el('button', { type: 'button', class: 'lp-ctr-add', id: 'lp-ctr-add' }, 'Add row');
  const sum = el('p', { class: 'lp-ctr-sum', id: 'lp-ctr-sum' });
  const errors = el('ul', { class: 'lp-error lp-ctr-errors', id: 'lp-ctr-errors', hidden: true });
  const saveBtn = el('button', { type: 'submit', class: 'lp-ctr-save', id: 'lp-ctr-save', 'aria-describedby': 'lp-ctr-sum lp-ctr-why' }, 'Save and lock');
  const why = el('span', { class: 'lp-note lp-ctr-why', id: 'lp-ctr-why' });
  const form = el('form', { class: 'lp-form lp-ctr-form', id: 'lp-ctr-form', novalidate: true, 'aria-label': 'Set the creator payout split', hidden: true },
    el('p', { class: 'lp-note lp-ctr-help' }, `Up to ${MAX_ROWS} recipients, each a wallet in this run (you, a dev, a bot, a copy-trader or a retail wallet) listed once, with a whole number of bps above 0. The bps must sum to 10,000. Once it applies, it cannot be changed.`),
    rowsBox,
    el('div', { class: 'lp-row lp-ctr-tools' }, addBtn, sum),
    errors,
    el('div', { class: 'lp-row lp-ctr-go' }, saveBtn, why),
    datalist);

  const splitSec = section('Creator payout split',
    el('p', { class: 'lp-note lp-ctr-sep' }, 'This creator payout split is separate from the creator/house/LP fee split of every trade: it only decides who receives the creator line.'),
    splitWrap, splitNote, status, lockedNote, form);

  /* ---------- holders and risk ---------- */
  const hold = lines('lp-ctr-hold', [['holders', 'Holders'], ['top10', 'Top-10 holders’ %'], ['risk', 'Risk']]);
  const holdSec = section('Holders and risk', hold.dl,
    el('p', { class: 'lp-note' }, 'Top-10 holders’ % counts a cluster (a wallet and the wallets it funded) as one holder. The coin drawer lists each holder with its cluster.'));

  const body = el('div', { class: 'lp-ctr-body', hidden: true }, chooseRow, coinLine, feesSec, splitSec, holdSec);
  root.append(el('div', { class: 'lp-ctr-head' }, el('h3', {}, 'Creator'),
    el('p', { class: 'lp-note' }, 'Creator fees from the coins you launched, and the creator payout split they are swept to.')), launchNote, empty, body);

  /* ---------- the event log, read as it grows ---------- */

  /** Follow CREATE, FEE_SPLIT and SWEEP events for the viewer's coins: the split in force at each sweep and what it paid. */
  function scan(world) {
    const ev = world.events;
    for (; cursor < ev.length; cursor++) {
      const e = ev[cursor];
      if (e.type === 'CREATE') {
        if (e.creator === ctx.viewer) ledger.set(e.coin, { split: [{ wallet: e.creator, bps: TOTAL_BPS }], paid: new Map(), sweeps: 0, lockedTick: null });
        continue;
      }
      const l = (e.type === 'FEE_SPLIT' || e.type === 'SWEEP') && ledger.get(e.coin);
      if (!l) continue;
      if (e.type === 'FEE_SPLIT') { l.split = e.split.map((s) => ({ wallet: s.wallet, bps: s.bps })); l.lockedTick = e.tick; continue; }
      const parts = l.split.map((s) => (e.quote * BigInt(s.bps)) / BigInt(TOTAL_BPS));
      parts[0] += e.quote - parts.reduce((a, x) => a + x, 0n);
      l.split.forEach((s, i) => l.paid.set(s.wallet, (l.paid.get(s.wallet) ?? 0n) + parts[i]));
      l.sweeps += 1;
    }
  }

  /* ---------- editor rows ---------- */

  function renumber() {
    rows.forEach((r, i) => {
      setText(r.legend, `Recipient ${i + 1}`);
      // The visible word "Remove" leads the accessible name (WCAG 2.5.3, label in name).
      setAttr(r.remove, 'aria-label', `Remove recipient ${i + 1}`);
    });
  }

  function addRow(wallet = '', bps = '') {
    const n = ++rowSeq;
    const walletIn = el('input', { type: 'text', id: `lp-ctr-w${n}`, class: 'lp-ctr-win', list: 'lp-ctr-wallets', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', value: wallet });
    const bpsIn = el('input', { type: 'text', id: `lp-ctr-b${n}`, class: 'lp-ctr-bin', inputmode: 'numeric', autocomplete: 'off', maxlength: 6, value: bps });
    const share = el('span', { class: 'lp-ctr-pct' });
    const remove = el('button', { type: 'button', class: 'lp-ctr-remove' }, 'Remove');
    const legend = el('legend', {});
    const node = el('fieldset', { class: 'lp-ctr-row' }, legend,
      el('div', { class: 'lp-ctr-cells' },
        el('label', { class: 'lp-ctr-wallet', for: walletIn.id }, 'Wallet', walletIn),
        el('label', { class: 'lp-ctr-bps', for: bpsIn.id }, 'bps', bpsIn),
        share, remove));
    const row = { node, legend, wallet: walletIn, bps: bpsIn, share, remove };
    remove.addEventListener('click', () => removeRow(row));
    rows.push(row);
    rowsBox.append(node);
    renumber();
    return row;
  }

  /** Remove a row; focus moves to the row that took its place, or the one before it. */
  function removeRow(row) {
    if (rows.length <= 1) return;
    const i = rows.indexOf(row);
    rows.splice(i, 1);
    row.node.remove();
    renumber();
    edited();
    (rows[i] ?? rows[i - 1]).wallet.focus();
  }

  function loadRows(list) {
    rowsBox.replaceChildren();
    rows = [];
    for (const r of list.length ? list : [{ wallet: '', bps: '' }]) addRow(r.wallet, r.bps);
  }

  const readRows = () => rows.map((r) => ({ wallet: r.wallet.value.trim(), bps: r.bps.value.trim() }));

  /** Check the rows as the engine will: 1–10 rows, existing and distinct wallets, positive whole bps, summing to 10,000. */
  function check(list) {
    const wallets = ctx.sim.world.wallets;
    const problems = [];
    const firstAt = new Map();
    let total = 0;
    list.forEach((r, i) => {
      const n = i + 1;
      if (!r.wallet) problems.push({ i, field: 'wallet', text: `Recipient ${n}: add a wallet id.` });
      else if (!wallets.has(r.wallet)) problems.push({ i, field: 'wallet', text: `Recipient ${n}: there is no wallet “${r.wallet}” in this run.` });
      else if (firstAt.has(r.wallet)) problems.push({ i, field: 'wallet', text: `Recipient ${n}: “${r.wallet}” is already recipient ${firstAt.get(r.wallet) + 1}.` });
      if (r.wallet && !firstAt.has(r.wallet)) firstAt.set(r.wallet, i);
      const b = parseBps(r.bps);
      if (b === null) problems.push({ i, field: 'bps', text: `Recipient ${n}: bps must be a whole number above 0.` });
      else total += b;
    });
    if (list.length < 1 || list.length > MAX_ROWS) problems.push({ i: -1, text: `A split has 1 to ${MAX_ROWS} recipients.` });
    if (total !== TOTAL_BPS) problems.push({ i: -1, text: `The bps sum to ${group(total)}; they must sum to exactly 10,000.` });
    return { problems, total, split: problems.length ? null : list.map((r) => ({ wallet: r.wallet, bps: parseBps(r.bps) })) };
  }

  /** Repaint the running sum, each row's percent, the row buttons and (after a refused Save) the problems. */
  function edited() {
    const list = readRows();
    const v = check(list);
    rows.forEach((r, i) => {
      const b = parseBps(list[i].bps);
      setText(r.share, b === null ? '–' : bpsPct(b));
      r.remove.disabled = rows.length <= 1;
    });
    addBtn.disabled = rows.length >= MAX_ROWS;
    const left = TOTAL_BPS - v.total;
    setText(sum, `Sum: ${group(v.total)} of 10,000 bps${left > 0 ? ` · ${group(left)} left` : left < 0 ? ` · ${group(-left)} over` : ''}`);
    sum.classList.toggle('lp-ctr-even', left === 0);
    paintProblems(showErrors ? v.problems : []);
    return v;
  }

  let problemSig = '';
  function paintProblems(problems) {
    const sig = problems.map((p) => p.text).join('\n');
    if (sig !== problemSig) {
      problemSig = sig;
      errors.hidden = !problems.length;
      errors.replaceChildren(...problems.map((p) => el('li', {}, p.text)));
    }
    rows.forEach((r, i) => {
      setAttr(r.wallet, 'aria-invalid', String(problems.some((p) => p.i === i && p.field === 'wallet')));
      setAttr(r.bps, 'aria-invalid', String(problems.some((p) => p.i === i && p.field === 'bps')));
    });
  }

  rowsBox.addEventListener('input', () => {
    if (!ctx.sim) return;
    edited();
    if (saveError) { saveError = ''; paintStatusOnly(); }
  });
  addBtn.addEventListener('click', () => {
    if (rows.length >= MAX_ROWS) return;
    const row = addRow();
    edited();
    row.wallet.focus();
  });
  drawerBtn.addEventListener('click', () => { if (chosen) ctx.actions.select(chosen); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const coin = chosen && ctx.sim.world.coins.get(chosen);
    if (!coin || saveBtn.disabled) return;
    showErrors = true;
    const v = edited();
    if (v.problems.length) {
      const at = v.problems.find((p) => p.i >= 0);
      if (at) rows[at.i][at.field].focus();
      ctx.actions.announce(`Not saved: ${v.problems[0].text} Nothing has been recorded.`);
      return;
    }
    const res = ctx.actions.record({ type: 'split', wallet: ctx.viewer, coin: coin.id, shares: v.split });
    if (!res.ok) {
      saveError = `Not recorded: ${res.error}`;
      paintStatusOnly();
      ctx.actions.announce(saveError);
      return;
    }
    submitted.add(ctx.sim.log.at(-1));
    showErrors = false;
    saveError = '';
    drafts.delete(coin.id);
    lastSig = '';
    ctx.actions.requestRender();
    status.focus();
    ctx.actions.announce(`Creator payout split for ${coin.symbol} recorded. Applies at tick ${res.tick} and then locks.`);
  });

  /* ---------- painting ---------- */

  /** Wallet ids for the recipient datalist, rebuilt only when a wallet is added. */
  function syncWallets(world) {
    if (world.wallets.size === walletCount) return;
    walletCount = world.wallets.size;
    const bots = new Map(ctx.sim.bots.map((b) => [b.id, b]));
    const label = (w) => {
      if (w.id === ctx.viewer) return 'your wallet';
      if (bots.has(w.id)) return `${w.role === 'sniper' ? 'sniper bot' : 'bot'} · ${bots.get(w.id).label}`;
      if (w.role === 'bundler') return `bundle wallet funded by ${w.fundedBy}`;
      return ROLE_WORDS[w.role] ?? w.role;
    };
    const rank = (w) => (w.id === ctx.viewer ? -1 : ROLE_ORDER[w.role] ?? 9);
    const list = [...world.wallets.values()].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id, 'en', { numeric: true }));
    datalist.replaceChildren(...list.map((w) => el('option', { value: w.id }, label(w))));
  }

  function paintCoin(coin, world) {
    const src = ctx.coinImage(coin);
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    setText(coinName, coin.name);
    setText(coinSym, coin.symbol);
    setText(coinMeta, `${coin.id} · launched at tick ${group(coin.createdTick)} · ${STATUS_WORDS[coin.status] ?? coin.status}`);
    const t = world.tick, last = ctx.sim.scenario.ticks - 1;
    const l = ledger.get(coin.id);
    setText(fees.dd.accrued, cr(coin.feesHeld + coin.feesSwept));
    setText(fees.dd.held, cr(coin.feesHeld));
    setText(fees.dd.swept, l?.sweeps ? `${cr(coin.feesSwept)} in ${plural(l.sweeps, 'sweep')}` : cr(coin.feesSwept));
    const n = nextSweep(t);
    setText(fees.dd.next, n > last ? 'none left in this run' : n === t ? `tick ${group(n)}, the next to run` : `tick ${group(n)} (in ${plural(n - t, 'tick')})`);
  }

  function paintSplit(coin) {
    const l = ledger.get(coin.id);
    const paid = l?.paid ?? new Map();
    const inSplit = new Set(coin.feeSplit.map((s) => s.wallet));
    // Current recipients, then anyone an earlier split paid (the default 100% before the split locked).
    const items = [...coin.feeSplit.map((s) => ({ wallet: s.wallet, bps: s.bps })), ...[...paid.keys()].filter((w) => !inSplit.has(w)).map((w) => ({ wallet: w, bps: null }))]
      .map((s) => ({ ...s, paid: paid.get(s.wallet) ?? 0n }));
    keyedRows(splitBody, items, (s) => s.wallet, () => {
      const cells = { wallet: el('th', { scope: 'row', class: 'lp-ctr-wid' }), bps: el('td', { class: 'num' }), pct: el('td', { class: 'num' }), paid: el('td', { class: 'num' }) };
      return {
        node: el('tr', {}, ...Object.values(cells)),
        update(s) {
          // The viewer's id already reads "you"; any other viewer id gets the label.
          setText(cells.wallet, s.wallet === ctx.viewer && s.wallet !== 'you' ? `${s.wallet} (you)` : s.wallet);
          setText(cells.bps, s.bps === null ? 'earlier split' : group(s.bps));
          setText(cells.pct, s.bps === null ? '' : bpsPct(s.bps));
          setText(cells.paid, num(s.paid, 6));
        },
      };
    });
    setText(footCells.bps, group(coin.feeSplit.reduce((a, s) => a + s.bps, 0)));
    setText(footCells.pct, bpsPct(TOTAL_BPS));
    setText(footCells.paid, num([...paid.values()].reduce((a, x) => a + x, 0n), 6));
    setText(splitNote, coin.feeSplitLocked
      ? `Set at tick ${group(l?.lockedTick ?? 0)}. Paid so far sums to the swept total.`
      : 'Default: 100% to you until a split you save applies. Paid so far sums to the swept total.');
  }

  /** The split's state for the coin: pending, locked, refused or editable, read from the log and the coin. */
  function splitState(coin) {
    const sim = ctx.sim;
    const recs = sim.log.filter((r) => r.type === 'split' && r.coin === coin.id && r.wallet === ctx.viewer);
    const last = recs.at(-1) ?? null;
    const pending = Boolean(last && last.tick >= sim.world.tick);
    const refused = last && !pending ? sim.humanRejects.find((x) => x.record === last) ?? null : null;
    return { last, pending, refused, mode: pending ? 'pending' : coin.feeSplitLocked ? 'locked' : 'edit' };
  }

  function showStatus(cls, text) {
    status.hidden = !text;
    setAttr(status, 'class', `lp-ctr-status ${cls}`.trim());
    setText(status, text);
  }

  function paintStatus(coin, st, playing) {
    form.hidden = st.mode !== 'edit';
    lockedNote.hidden = st.mode !== 'locked';
    if (st.mode === 'pending') showStatus('lp-ctr-wait', `Applies at tick ${group(st.last.tick)} and then locks.${playing ? '' : ' Press Step or Play to run it.'}`);
    else if (st.refused) showStatus('lp-error', `Your split for tick ${group(st.last.tick)} was refused: ${SPLIT_REASON[st.refused.reason] ?? st.refused.reason}.${st.mode === 'edit' ? ' Nothing changed; edit it and save again.' : ''}`);
    else if (st.mode === 'locked' && st.last) showStatus('lp-ok', `Saved: your split applied at tick ${group(st.last.tick)} and is now locked.`);
    else if (st.mode === 'edit' && saveError) showStatus('lp-error', saveError);
    else showStatus('', '');
    // Say the outcome of a split saved here once its tick has run.
    if (st.last && !st.pending && submitted.has(st.last) && !announced.has(st.last)) {
      announced.add(st.last);
      ctx.actions.announce(st.refused ? status.textContent : `Creator payout split for ${coin.symbol} applied and locked.`);
    }
    const finished = ctx.sim.world.tick >= ctx.sim.scenario.ticks;
    saveBtn.disabled = finished;
    setText(why, finished ? 'The run has finished. Reset to start a new one.' : `Records the split for tick ${group(ctx.sim.world.tick)}. It locks once that tick runs.`);
  }

  /** After typing or a refused record: only the status line can change, so repaint just that. */
  function paintStatusOnly() {
    const coin = chosen && ctx.sim?.world.coins.get(chosen);
    if (coin && lastState) paintStatus(coin, lastState, lastPlaying);
  }

  function paintHolders(coin, sim) {
    setText(hold.dd.holders, group(coin.holders.size));
    const key = `${coin.id}@${sim.world.tick}`;
    if (key === riskKey) return;
    riskKey = key;
    const r = risk(sim.index, sim.world, coin);
    setText(hold.dd.top10, pct(r.parts.top10));
    const sig = `${r.badge} ${r.score} ${r.flags.join(',')}`;
    if (sig !== riskSig) { riskSig = sig; hold.dd.risk.replaceChildren(...riskBadges(r)); }
  }

  /**
   * Show a coin the viewer just launched, once, when it appears: unless they picked a coin with the
   * chooser, or are busy with the one in view (typing in its editor, or its split saved and waiting
   * to apply). A busy viewer keeps their coin; the new one is in the chooser.
   */
  function choose(mine, sim) {
    const newest = mine[mine.length - 1].id;
    if (!mine.some((c) => c.id === chosen)) { chosen = newest; picked = false; seenNewest = newest; return; }
    if (newest === seenNewest) return;
    seenNewest = newest;
    const a = document.activeElement;
    const busy = form.contains(a) || a === status
      || sim.log.some((r) => r.type === 'split' && r.coin === chosen && r.wallet === ctx.viewer && r.tick >= sim.world.tick);
    if (!picked && !busy) chosen = newest;
  }

  function paint(info) {
    const sim = ctx.sim, world = sim.world;
    scan(world);
    const mine = [];
    for (const c of world.coins.values()) if (c.creator === ctx.viewer) mine.push(c);
    const launching = sim.log.filter((r) => r.type === 'launch' && r.wallet === ctx.viewer && r.tick >= world.tick);
    launchNote.hidden = !launching.length;
    if (launching.length) {
      const ticks = [...new Set(launching.map((r) => r.tick))].sort((a, b) => a - b);
      const who = launching.length === 1 ? 'Your launch applies' : `Your ${launching.length} launches apply`;
      setText(launchNote, `${who} at ${tickList(ticks)}.${info.playing ? '' : ` Press Step or Play to run ${launching.length === 1 ? 'it' : 'them'}.`}`);
    }
    empty.hidden = mine.length > 0;
    body.hidden = !mine.length;
    if (!mine.length) return;

    choose(mine, sim);
    keyedRows(chooser, mine, (c) => c.id, (c) => {
      const b = el('button', { type: 'button', class: 'lp-ctr-pick', 'aria-pressed': 'false' });
      b.addEventListener('click', () => {
        if (chosen === c.id) return;
        chosen = c.id;
        picked = true;
        ctx.actions.requestRender();
      });
      return { node: b, update(x) { setText(b, `${x.symbol} (${x.id})`); setAttr(b, 'aria-pressed', String(x.id === chosen)); } };
    });

    const coin = world.coins.get(chosen);
    if (loadedFor !== coin.id) {
      if (loadedFor) drafts.set(loadedFor, readRows());
      loadRows(drafts.get(coin.id) ?? coin.feeSplit.map((s) => ({ wallet: s.wallet, bps: String(s.bps) })));
      loadedFor = coin.id;
      showErrors = false;
      saveError = '';
    }
    syncWallets(world);
    paintCoin(coin, world);
    paintSplit(coin);
    lastState = splitState(coin);
    lastPlaying = info.playing;
    paintStatus(coin, lastState, info.playing);
    edited();
    paintHolders(coin, sim);
  }

  return {
    /** Repaints when the tick, the coins, the chosen coin or the play state changed, or after any action. */
    render(info) {
      if (!ctx.sim) return;
      const world = ctx.sim.world;
      const sig = [generation, world.tick, info.finished, info.playing, world.coins.size, chosen].join('|');
      if (!info.force && sig === lastSig) return;
      lastSig = sig;
      paint(info);
    },
    /** A new run: forget the chosen coin, drafts, outcomes and what was read from the old log. */
    reset() {
      generation += 1;
      lastSig = '';
      chosen = null;
      picked = false;
      seenNewest = null;
      loadedFor = null;
      showErrors = false;
      saveError = '';
      cursor = 0;
      walletCount = -1;
      riskKey = '';
      riskSig = '';
      lastState = null;
      drafts.clear();
      ledger.clear();
      loadRows([]);
      paintProblems([]);
      showStatus('', '');
    },
  };
}
