/**
 * The Bots & approvals panel (plan §3 "Bot console", §6): a roster with each
 * bot's strategy, parameters, policy, net credits, fills and refusals; a kill
 * switch per bot and one for every bot; the approval queue; the recent gate
 * decisions; and a policy editor. Bots trade on paper (this board) only.
 *
 * Every press here is a record in the run's action log (kill, unkill,
 * approve, decline, policy) that applies when the next tick runs, so a replay
 * link reproduces it. Until then the view shows the press as pending; once
 * the tick has run it reads the outcome back from the event log (KILL,
 * APPROVED, DECLINED, POLICY, VOID) or from the run's refused records.
 * The event log is read incrementally, never rescanned.
 */
import { DEFAULT_POLICY, patchPolicy } from '../../lib/launchpad/gate.mjs';
import { unrealized } from '../../lib/launchpad/engine.mjs';
import { units, fmt } from '../../lib/launchpad/units.mjs';
import { el, setText, setAttr, keyedRows, num, bpsPct } from './ui.mjs';

/** A queued intent is void this many ticks after it was queued (sim.mjs, plan §6.3). */
const QUEUE_TICKS = 30;
/** The queue lists its oldest intents only: at 100× dozens arrive and void between paints, and rebuilding them all is most of a paint. */
const QUEUE_SHOWN = 8;
const RECENT = 12;
/** The event types listed under Recent decisions, with the class each row gets. */
const DECISIONS = Object.freeze({ GATE_REFUSE: 'refuse', QUEUED: 'queued', APPROVED: 'approved', DECLINED: 'declined', VOID: 'void', KILL: 'kill', POLICY: 'policy' });

/** Gate reason codes (plan §6.2) in lowercase words; codes not listed read as their own words. */
const REASON_WORDS = Object.freeze({ PER_TRADE: 'per-trade cap', WINDOW_CAP: 'per-window cap', POSITION: 'position cap', RATE: 'trades-per-window cap', NOT_PERMITTED: 'not a permitted coin', BLOCKED_COIN: 'blocked coin', CREDITS: 'not enough credits', KILLED: 'kill switch on', PRIORITY_FEE: 'priority fee over its cap', SLIPPAGE: 'slippage over its cap', EXPIRED: 'policy expired', NEEDS_APPROVAL: 'above its approval line (refuse mode)' });
const words = (code) => REASON_WORDS[code] ?? String(code).toLowerCase().replaceAll('_', ' ');
const plain = (code) => String(code).toLowerCase().replaceAll('_', ' ');
/** Why a queued intent went void. */
const VOID_WORDS = Object.freeze({ EXPIRED: `it waited ${QUEUE_TICKS} ticks`, CREDITS: 'the bot’s credits changed', POLICY: 'the bot’s policy changed' });
/** Why the run refused one of the viewer's records. */
const REJECT_WORDS = Object.freeze({ RUN_KEY: 'it belongs to another run', NOT_QUEUED: 'it had already left the approval queue', NO_BOT: 'there is no such bot', BAD_POLICY: 'the gate refused the edit' });

/** The policy editor's fields: policy path, label, and whether it is an amount in credits. */
const FIELDS = Object.freeze([
  { key: 'maxPerTrade', label: 'Per-trade cap (cr)', amount: true, read: (p) => p.maxPerTrade },
  { key: 'windowCap.amount', label: 'Per-window cap (cr)', amount: true, read: (p) => p.windowCap.amount },
  { key: 'windowCap.ticks', label: 'Window (ticks)', read: (p) => p.windowCap.ticks },
  { key: 'approvalAbove', label: 'Approval above (cr)', amount: true, read: (p) => p.approvalAbove },
  { key: 'maxPositionBps', label: 'Position cap (bps)', read: (p) => p.maxPositionBps },
  { key: 'cooldownTicks', label: 'Cooldown (ticks)', read: (p) => p.cooldownTicks },
  { key: 'maxSlippageBps', label: 'Max slippage (bps)', read: (p) => p.maxSlippageBps },
]);
const FIELD_LABEL = Object.freeze(Object.fromEntries(FIELDS.map((f) => [f.key, f.label])));
const AMOUNT_RE = /^\d+(\.\d{1,6})?$/;
const WHOLE_RE = /^[-+]?\d+$/;

/** Grouped whole numbers; one shared formatter, since toLocaleString builds a new one per call and this runs every paint. */
const GROUP = new Intl.NumberFormat('en-US');
const group = (n) => GROUP.format(Number(n));
/** Credits with only the decimals they need (50, 12.5, 0.000001). */
function amt(micro) {
  const t = fmt(micro, 6);
  return t.includes('.') ? t.replace(/0+$/, '').replace(/\.$/, '') : t;
}
/** A signed amount: +12.34 or −3.21; one that rounds to zero reads 0.00. */
function signed(micro) {
  const t = num(micro);
  if (/^−?0(\.0+)?$/.test(t)) return num(0n);
  return micro > 0n ? `+${t}` : t;
}
const pc = (x) => `${Number((x * 100).toFixed(2))}%`;
const bps = (n) => bpsPct(n, n % 100 ? (n % 10 ? 2 : 1) : 0);
/** The policy with defaults filled in, in its JSON form (amounts as decimal strings). */
const effective = (raw) => ({ ...DEFAULT_POLICY, ...raw, windowCap: { ...DEFAULT_POLICY.windowCap, ...(raw.windowCap ?? {}) } });

/** A short summary of each strategy's parameters (strategies.mjs). */
const PARAMS = Object.freeze({
  'market-maker': (p) => `±${pc(p.band)} band around the ${group(p.emaTicks)}-tick average · buys ${p.buySize} cr below it · sells ${pc(p.sellShare)} of its holdings above it`,
  momentum: (p) => `buys ${p.size} cr when up ${pc(p.threshold)} over ${group(p.lookback)} ticks with buys over ${p.ratio}× sells · ${pc(p.trail)} trailing stop`,
  sniper: (p) => `buys ${p.size} cr once per coin in its first ${group(p.window)} ticks · priority fee ${bps(p.priorityFeeBps)} · sells at ${p.exitMultiple}× or after ${group(p.maxHold)} ticks`,
  'dip-buyer': (p) => `buys ${p.size} cr ${pc(p.drop)} under its ${group(p.lookback)}-tick high while holders grow · sells at +${pc(p.takeProfit)}`,
  holder: (p) => `buys ${p.size} cr of coins with risk under ${p.maxRisk} once ${group(p.minAge)} ticks old · sells half after graduation`,
});
const paramsText = (b) => (PARAMS[b.strategy.id] ?? ((p) => Object.entries(p).map(([k, v]) => `${k} ${v}`).join(' · ')))(b.params);

/** A loaded policy in plain words (plan §6.1 fields, §2.5 vocabulary). */
function policyText(p) {
  const parts = [
    `per trade ${amt(p.maxPerTrade)} cr`,
    `per-window cap ${amt(p.windowCap.amount)} cr over ${group(p.windowCap.ticks)} ticks`,
    `approval above ${amt(p.approvalAbove)} cr`,
    `position cap ${bps(p.maxPositionBps)}`,
    `cooldown ${group(p.cooldownTicks)} ticks`,
  ];
  if (p.permittedCoins) parts.push(`permitted coins ${p.permittedCoins.join(', ') || 'none'}`);
  if (p.blockedCoins.length) parts.push(`blocked coins ${p.blockedCoins.join(', ')}`);
  if (p.killed) parts.push('kill switch on in the policy');
  if (p.rev) parts.push(`rev ${p.rev}`);
  return parts.join(' · ');
}

/** A policy edit (a POLICY event's patch) in plain words. A patch can come from a replay link, so it is only ever text. */
function patchText(patch) {
  const say = {
    maxPerTrade: (v) => `per-trade cap ${v} cr`,
    approvalAbove: (v) => `approval above ${v} cr`,
    windowCap: (v) => [v?.amount !== undefined ? `per-window cap ${v.amount} cr` : '', v?.ticks !== undefined ? `window ${v.ticks} ticks` : ''].filter(Boolean).join(', '),
    maxPositionBps: (v) => `position cap ${v} bps`,
    cooldownTicks: (v) => `cooldown ${v} ticks`,
    maxSlippageBps: (v) => `max slippage ${v} bps`,
  };
  return Object.entries(patch ?? {}).map(([k, v]) => (say[k] ? say[k](v) : `${k} ${typeof v === 'object' ? JSON.stringify(v) : v}`)).join(', ') || 'no change';
}

const th = (label, cls) => el('th', { scope: 'col', role: 'columnheader', class: cls }, label);
/** A table cell carrying its column label, so a phone can lay the row out as a card. */
const cell = (label, cls = '') => el('td', { role: 'cell', class: cls, 'data-label': label });
/** A table in the shared sideways-scroll wrapper; explicit roles keep table semantics when rows become cards. */
const REGION = { 'lp-con-roster': 'Bot roster', 'lp-con-queue': 'Approval queue' };
const tableIn = (cls, caption, head, body) => el('div', { class: `lp-table-wrap lp-con-wrap ${cls}-wrap`, tabindex: '0', role: 'region', 'aria-label': REGION[cls] ?? caption },
  el('table', { class: `lp-con-table lp-con-cards ${cls}`, role: 'table' }, el('caption', { class: 'lp-sr' }, caption),
    el('thead', { role: 'rowgroup' }, el('tr', { role: 'row' }, ...head)), body));
const section = (cls, ...kids) => el('section', { class: `lp-con-sec ${cls}` }, ...kids);

export function mountConsole(root, ctx) {
  root.classList.add('lp-con');
  const state = {
    sim: null,
    sig: '',
    version: 0,
    /** Stop presses not yet applied: bot id → { on, tick }; the all-bots switch on its own. */
    wanted: new Map(),
    wantedAll: null,
    /** Approve or decline presses for intents still in the queue: intent id → { type, tick }. */
    decided: new Map(),
    /** Event-log reading: how far it got, the last decisions, and queued intents still open. */
    cursor: 0,
    recent: [],
    intents: new Map(),
    rejCursor: 0,
    /** Policy edits recorded here ({ bot, tick, rev, patch }), what each POLICY event did (by `${bot}@${tick}`, a list), and edits the run refused. */
    policyPending: [],
    policyApplied: new Map(),
    policyRefused: new Set(),
    lastPolicy: null,
    formBot: null,
    formRev: -1,
    dirty: false,
  };
  const bump = () => { state.version += 1; };
  /** Show a message line; kind is error, ok, pending or note, and empty text hides it. */
  function say(node, text, kind = 'note') {
    node.hidden = !text;
    setText(node, text);
    setAttr(node, 'class', `lp-con-msg ${kind === 'error' ? 'lp-error' : kind === 'ok' ? 'lp-ok' : kind === 'pending' ? 'lp-pending' : 'lp-note'}`);
  }
  const message = (id) => el('p', { class: 'lp-con-msg', id, hidden: true });

  /* ---------- head: title and the paper / live choice ---------- */
  const paper = el('input', { type: 'radio', name: 'lp-con-mode', value: 'paper', id: 'lp-con-paper', checked: true });
  const live = el('input', { type: 'radio', name: 'lp-con-mode', value: 'live', id: 'lp-con-live', disabled: true, 'aria-describedby': 'lp-con-live-note' });
  const mode = el('fieldset', { class: 'lp-con-mode' }, el('legend', {}, 'Where bots trade'),
    el('label', { for: 'lp-con-paper' }, paper, 'Paper (this board)'),
    el('label', { for: 'lp-con-live', class: 'lp-con-off' }, live, 'Live (stage B, not built)'),
    el('p', { class: 'lp-note lp-con-modenote', id: 'lp-con-live-note' }, 'Live would need stage B, which is not built. Every bot here trades play credits on this page.'));
  const finishedNote = el('p', { class: 'lp-note lp-con-finished', hidden: true }, 'The run has finished, so no more presses can be recorded. Reset to start a new run.');

  /* ---------- roster ---------- */
  const killAll = el('button', { type: 'button', class: 'lp-kill lp-con-killall', id: 'lp-con-killall', 'aria-pressed': 'false', 'aria-describedby': 'lp-con-allstate' }, 'Stop all bots');
  const allState = el('span', { class: 'lp-note lp-con-allstate', id: 'lp-con-allstate' });
  const rosterBody = el('tbody', { role: 'rowgroup' });
  const roster = tableIn('lp-con-roster', 'Bots: kill switch, net credits, fills, refusals, queued intents, parameters and policy',
    [th('Bot', 'lp-con-bot'), th('Kill switch'), th('Net credits (cr)', 'num'), th('Fills', 'num'), th('Refused', 'num'), th('Queued', 'num'), th('Parameters'), th('Policy')], rosterBody);
  const rosterEmpty = el('p', { class: 'lp-empty-note', hidden: true }, 'This run has no bots.');
  const rosterMsg = message('lp-con-roster-msg');
  const rosterSec = section('lp-con-rostersec',
    el('div', { class: 'lp-con-sechead' }, el('h4', {}, 'Roster'), el('div', { class: 'lp-con-allrow' }, killAll, allState)),
    el('p', { class: 'lp-note' }, 'Bots only propose. Each intent passes the bot’s policy gate, and the first check it fails is the reason on record. Stop is the bot’s kill switch. Net credits are realized plus unrealized change in credits.'),
    roster, rosterEmpty, rosterMsg);

  /* ---------- approval queue ---------- */
  const queueMode = el('p', { class: 'lp-note lp-con-qmode', id: 'lp-con-qmode' });
  const queueBody = el('tbody', { role: 'rowgroup' });
  const queueWrap = tableIn('lp-con-queue', 'Intents waiting for approval, oldest first',
    [th('Intent', 'lp-con-intent'), th('Bot'), th('Coin'), th('Side'), th('Amount (cr)', 'num'), th('Queued', 'num'), th('Void'), th('Decision')], queueBody);
  // tabindex -1: focus lands here when the last focused intent leaves the queue.
  const queueEmpty = el('p', { class: 'lp-empty-note', hidden: true, tabindex: '-1' }, 'Nothing is waiting for approval.');
  const queueMsg = message('lp-con-queue-msg');
  const queueSec = section('lp-con-queuesec', el('h4', {}, 'Approval queue'), queueMode, queueWrap, queueEmpty, queueMsg);

  /* ---------- recent decisions ---------- */
  const logList = el('ol', { class: 'lp-con-log', id: 'lp-con-log' });
  const logEmpty = el('p', { class: 'lp-empty-note' }, 'No decisions yet. Press Step or Play.');
  const logSec = section('lp-con-logsec', el('h4', {}, 'Recent decisions'),
    el('p', { class: 'lp-note' }, `The last ${RECENT} gate refusals, queued intents, approvals, declines, voids, kill switch presses and policy edits, newest first.`),
    logList, logEmpty);

  /* ---------- policy editor ---------- */
  const botSel = el('select', { id: 'lp-con-bot' });
  const revNote = el('p', { class: 'lp-note lp-con-rev', id: 'lp-con-rev' });
  const inputs = {};
  const fieldEls = FIELDS.map((f) => {
    const id = `lp-con-f-${f.key.replace('.', '-')}`;
    inputs[f.key] = el('input', { type: 'text', id, inputmode: f.amount ? 'decimal' : 'numeric', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'lp-con-policy-err' });
    return el('label', { for: id }, f.label, inputs[f.key]);
  });
  const submit = el('button', { type: 'submit', class: 'lp-con-submit', id: 'lp-con-policy-submit' }, 'Record policy edit');
  const refill = el('button', { type: 'button', class: 'lp-con-refill', id: 'lp-con-policy-refill' }, 'Reset fields');
  const policyErr = el('p', { class: 'lp-error lp-con-err', id: 'lp-con-policy-err', 'aria-live': 'polite' });
  const policyMsg = message('lp-con-policy-msg');
  const approvalHint = el('p', { class: 'lp-note lp-con-hint', hidden: true });
  const form = el('form', { class: 'lp-form lp-con-form', id: 'lp-con-policy', novalidate: true, 'aria-label': 'Edit a bot’s policy' },
    el('label', { for: 'lp-con-bot' }, 'Bot', botSel),
    revNote,
    el('div', { class: 'lp-con-fields' }, ...fieldEls),
    el('p', { class: 'lp-note lp-con-units' }, 'Amounts are play credits (cr). bps are hundredths of a percent: a position cap of 200 bps is 2% of supply.'),
    approvalHint,
    el('div', { class: 'lp-row lp-con-go' }, submit, refill),
    policyErr,
    policyMsg,
    el('p', { class: 'lp-note lp-con-applies' }, 'An edit applies at the next tick, bumps the policy’s rev by one, and voids that bot’s queued approvals.'));
  const policySec = section('lp-con-policysec', el('h4', {}, 'Policy editor'), form);

  root.append(
    el('div', { class: 'lp-con-head' },
      el('div', { class: 'lp-con-title' }, el('h3', {}, 'Bots & approvals'),
        el('p', { class: 'lp-note lp-con-intro' }, 'Stop, approve, decline and policy presses are records in the run’s action log. Each applies when the next tick runs, so a replay link reproduces it.')),
      mode),
    finishedNote,
    rosterSec,
    queueSec,
    el('div', { class: 'lp-con-cols' }, el('div', { class: 'lp-con-col' }, logSec), el('div', { class: 'lp-con-col' }, policySec)));

  /* ---------- reading the run ---------- */
  /** One decision event in plain words, written when it is read (its coin and queued intent are known then). */
  function describe(e, world) {
    const sym = (id) => world.coins.get(id)?.symbol ?? id;
    const what = (q) => (q ? ` (${q.bot}: ${q.side} ${sym(q.coin)} for ${num(q.amount)} cr)` : '');
    switch (e.type) {
      case 'GATE_REFUSE': return `${e.bot}: ${e.side} ${sym(e.coin)} refused by its gate: ${words(e.reason)}.`;
      case 'QUEUED': return `${e.bot}: ${e.side} ${sym(e.coin)} for ${num(e.amount)} cr is above its approval line; queued as ${e.intent}.`;
      case 'APPROVED': return `${e.intent} approved${what(state.intents.get(e.intent))}; its gate checks it again as it runs.`;
      case 'DECLINED': return `${e.intent} declined${what(state.intents.get(e.intent))}; it does not run.`;
      case 'VOID': return `${e.intent} is void${what(state.intents.get(e.intent))}: ${VOID_WORDS[e.reason] ?? plain(e.reason)}.`;
      case 'KILL':
        if (e.bot === '*') return e.on ? 'Kill switch on for all bots; their open auction orders are withdrawn.' : 'Kill switch off for all bots; they run again.';
        return e.on ? `Kill switch on for ${e.bot}.` : `Kill switch off for ${e.bot}; it runs again.`;
      case 'POLICY': return `${e.bot}’s policy edited, now rev ${e.rev}: ${patchText(e.patch)}. Its queued approvals are void.`;
      default: return e.type;
    }
  }

  /** Read the events added since last time: keep the last decisions, the open queued intents, and what each policy edit voided. */
  function ingest(sim) {
    const { events } = sim.world;
    for (let i = state.cursor; i < events.length; i++) {
      const e = events[i];
      const kind = DECISIONS[e.type];
      if (!kind) continue;
      if (e.type === 'QUEUED') state.intents.set(e.intent, { bot: e.bot, coin: e.coin, side: e.side, amount: e.amount });
      if (e.type === 'POLICY') {
        // Several edits can apply in one tick; keep each, so every recorded edit finds its own rev.
        state.lastPolicy = { bot: e.bot, tick: e.tick, rev: e.rev, voided: 0 };
        const key = `${e.bot}@${e.tick}`;
        state.policyApplied.set(key, [...(state.policyApplied.get(key) ?? []), state.lastPolicy]);
      }
      if (e.type === 'VOID' && e.reason === 'POLICY' && state.lastPolicy) {
        const p = state.lastPolicy;
        if (p.tick === e.tick && String(e.intent).startsWith(`${p.bot}:`)) p.voided += 1;
      }
      state.recent.push({ seq: e.seq, tick: e.tick, kind, text: describe(e, sim.world) });
      if (state.recent.length > RECENT) state.recent.shift();
      if (e.type === 'APPROVED' || e.type === 'DECLINED' || e.type === 'VOID') state.intents.delete(e.intent);
    }
    state.cursor = events.length;
  }

  /** The viewer's records the run refused (a stale approval, say), shown next to the control that made them. */
  function readRejects(sim) {
    const list = sim.humanRejects;
    for (let i = state.rejCursor; i < list.length; i++) {
      const r = list[i];
      const why = REJECT_WORDS[r.reason] ?? plain(r.reason);
      if (r.type === 'approve' || r.type === 'decline') say(queueMsg, `Your ${r.type === 'approve' ? 'approval' : 'decline'} of ${r.record.intent} did not apply at tick ${group(r.tick)}: ${why}.`, 'error');
      else if (r.type === 'kill' || r.type === 'unkill') say(rosterMsg, `Your ${r.type === 'kill' ? 'Stop' : 'restart'} for ${r.record.bot} did not apply at tick ${group(r.tick)}: ${why}.`, 'error');
      else if (r.type === 'policy') {
        state.policyRefused.add(`${r.record.bot}@${r.tick}`);
        say(policyMsg, `The policy edit for ${r.record.bot} did not apply at tick ${group(r.tick)}: ${why}.`, 'error');
      }
    }
    state.rejCursor = list.length;
  }

  /* ---------- roster rows ---------- */
  let rv = null;
  /** What a bot's row says about its kill switch, including a press that applies at the next tick. */
  function runWords(b, w) {
    const all = state.wantedAll;
    if (all) return b.killed ? 'stopped' : all.on ? `stops at tick ${group(all.tick)}` : `runs again at tick ${group(all.tick)}`;
    if (rv.allOn) return 'stopped (all bots)';
    if (w) return w.on ? `stops at tick ${group(w.tick)}` : `runs again at tick ${group(w.tick)}`;
    return b.killed ? 'stopped' : 'running';
  }

  function createBot(b) {
    const stop = el('button', { type: 'button', class: 'lp-kill lp-con-stop', 'data-kill': b.id, 'aria-pressed': 'false' }, 'Stop', el('span', { class: 'lp-sr' }, ` ${b.id}`));
    const runEl = el('span', { class: 'lp-con-state' });
    const c = { net: cell('Net credits (cr)', 'num'), fills: cell('Fills', 'num'), refused: cell('Refused', 'num lp-con-refused'), queued: cell('Queued', 'num lp-con-queued'), params: cell('Parameters', 'lp-con-text'), policy: cell('Policy', 'lp-con-text') };
    const refusedN = el('span', { class: 'lp-con-n' });
    const refusedWhy = el('span', { class: 'lp-con-why' });
    c.refused.append(refusedN, refusedWhy);
    const queuedN = el('span', { class: 'lp-con-n' });
    const queuedNow = el('span', { class: 'lp-con-why' });
    c.queued.append(queuedN, queuedNow);
    setText(c.params, paramsText(b));
    const node = el('tr', { role: 'row', 'data-bot': b.id },
      el('th', { scope: 'row', role: 'rowheader', class: 'lp-con-bot' }, el('span', { class: 'lp-con-id' }, b.id), el('span', { class: 'lp-con-label' }, b.label), runEl),
      el('td', { role: 'cell', class: 'lp-con-killcell' }, stop),
      ...Object.values(c));
    let lastPolicy = null;
    let lastTick = -1;
    return {
      node,
      update(b) {
        const w = state.wanted.get(b.id);
        const stopped = (w ? w.on : b.killed) || rv.allOn;
        setAttr(stop, 'aria-pressed', String(stopped));
        stop.disabled = rv.allOn || rv.finished;
        setText(runEl, runWords(b, w));
        runEl.classList.toggle('lp-con-stopped', stopped);
        runEl.classList.toggle('lp-con-soon', Boolean(w || state.wantedAll));
        const waiting = rv.waiting.get(b.id) ?? 0;
        setText(queuedN, group(b.queued));
        setText(queuedNow, waiting ? `${group(waiting)} waiting now` : '');
        if (b.policy !== lastPolicy) { lastPolicy = b.policy; setText(c.policy, policyText(b.policy)); }
        if (rv.tick === lastTick) return;
        lastTick = rv.tick;
        const wallet = rv.world.wallets.get(b.id);
        const net = wallet ? wallet.realized + unrealized(rv.world, wallet) : 0n;
        setText(c.net, signed(net));
        c.net.classList.toggle('lp-con-up', net > 0n);
        c.net.classList.toggle('lp-con-down', net < 0n);
        setText(c.fills, group(b.fills));
        const gate = Object.entries(b.rejects);
        const engine = Object.entries(b.engineRejects);
        const total = [...gate, ...engine].reduce((s, [, n]) => s + n, 0);
        setText(refusedN, group(total));
        const list = (pairs, wordsOf) => pairs.sort((x, y) => y[1] - x[1]).map(([k, n]) => `${wordsOf(k)} (${group(n)})`).join(', ');
        const why = [gate.length ? `by the gate: ${list(gate, words)}` : '', engine.length ? `at fill: ${list(engine, plain)}` : ''].filter(Boolean).join('; ');
        setAttr(c.refused, 'title', why || 'no refusals');
        setText(refusedWhy, why);
      },
    };
  }

  function paintRoster(sim, finished) {
    const { world } = sim;
    // A press stays pending until the run shows it, or until its tick has run.
    if (state.wantedAll && (state.wantedAll.on === sim.killedAll || world.tick > state.wantedAll.tick)) state.wantedAll = null;
    for (const [id, w] of state.wanted) {
      const b = sim.bots.find((x) => x.id === id);
      if (!b || b.killed === w.on || world.tick > w.tick) state.wanted.delete(id);
    }
    const allOn = state.wantedAll ? state.wantedAll.on : sim.killedAll;
    setAttr(killAll, 'aria-pressed', String(allOn));
    killAll.disabled = finished || !sim.bots.length;
    const all = state.wantedAll;
    setText(allState, all
      ? (all.on ? `All bots stop at tick ${group(all.tick)}.` : `Bots run again at tick ${group(all.tick)}.`)
      : sim.killedAll ? 'All bots are stopped. Each bot’s own Stop waits until this is off.' : 'The kill switch for every bot at once.');
    const waiting = new Map();
    for (const q of sim.queue) waiting.set(q.bot, (waiting.get(q.bot) ?? 0) + 1);
    rv = { world, allOn, finished, waiting, tick: world.tick };
    keyedRows(rosterBody, sim.bots, (b) => b.id, createBot);
    roster.hidden = !sim.bots.length;
    rosterEmpty.hidden = Boolean(sim.bots.length);
  }

  rosterBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kill]');
    if (!btn || btn.disabled) return;
    const sim = ctx.sim;
    const bot = sim.bots.find((b) => b.id === btn.dataset.kill);
    if (!bot || (state.wantedAll ? state.wantedAll.on : sim.killedAll)) return;
    const prev = state.wanted.get(bot.id);
    const on = !(prev ? prev.on : bot.killed);
    say(rosterMsg, '');
    // Pending first: recording re-renders at once, and the press must already show.
    state.wanted.set(bot.id, { on, tick: sim.world.tick });
    bump();
    const res = ctx.actions.record({ type: on ? 'kill' : 'unkill', bot: bot.id });
    if (!res.ok) {
      if (prev) state.wanted.set(bot.id, prev); else state.wanted.delete(bot.id);
      say(rosterMsg, res.error, 'error');
    } else {
      state.wanted.set(bot.id, { on, tick: res.tick });
      ctx.actions.announce(`${bot.id} ${on ? 'stops' : 'runs again'} at tick ${res.tick}.`);
    }
    bump();
    ctx.actions.requestRender();
  });

  killAll.addEventListener('click', () => {
    const sim = ctx.sim;
    if (killAll.disabled) return;
    const prev = state.wantedAll;
    const on = !(prev ? prev.on : sim.killedAll);
    say(rosterMsg, '');
    state.wantedAll = { on, tick: sim.world.tick };
    bump();
    const res = ctx.actions.record({ type: on ? 'kill' : 'unkill', bot: '*' });
    if (!res.ok) {
      state.wantedAll = prev;
      say(rosterMsg, res.error, 'error');
    } else {
      state.wantedAll = { on, tick: res.tick };
      ctx.actions.announce(on ? `All bots stop at tick ${res.tick}; their open auction orders are withdrawn.` : `Bots run again at tick ${res.tick}.`);
    }
    bump();
    ctx.actions.requestRender();
  });

  /* ---------- queue rows ---------- */
  let qv = null;
  function createIntent(q) {
    const c = { bot: cell('Bot', 'lp-con-mono'), coin: cell('Coin', 'lp-con-mono'), side: cell('Side'), amount: cell('Amount (cr)', 'num'), at: cell('Queued', 'num'), void: cell('Void', 'lp-con-void') };
    const approve = el('button', { type: 'button', class: 'lp-con-approve', 'data-decide': 'approve', 'data-intent': q.id }, 'Approve', el('span', { class: 'lp-sr' }, ` ${q.id}`));
    const decline = el('button', { type: 'button', class: 'lp-con-decline', 'data-decide': 'decline', 'data-intent': q.id }, 'Decline', el('span', { class: 'lp-sr' }, ` ${q.id}`));
    const wait = el('span', { class: 'lp-con-wait lp-pending', hidden: true });
    const node = el('tr', { role: 'row', 'data-intent': q.id },
      el('th', { scope: 'row', role: 'rowheader', class: 'lp-con-intent' }, q.id),
      ...Object.values(c),
      el('td', { role: 'cell', class: 'lp-con-decide' }, el('span', { class: 'lp-con-btns' }, approve, decline), wait));
    // A queued intent never changes, so its cells are written once; only the decision state updates.
    const { intent } = q;
    setText(c.bot, q.bot);
    setText(c.coin, qv.world.coins.get(intent.coin)?.symbol ?? intent.coin);
    setText(c.side, intent.side);
    setText(c.amount, intent.side === 'buy' ? num(intent.quoteIn) : `${num(intent.baseIn)} tokens`);
    setText(c.at, `tick ${group(q.tick)}`);
    setText(c.void, `void at tick ${group(q.tick + QUEUE_TICKS)}`);
    let sig = null;
    return {
      node,
      update(q) {
        const d = state.decided.get(q.id);
        // On its void tick the intent is voided before any approval or decline runs (sim.step), so a press then could never apply.
        const late = !qv.finished && qv.world.tick - q.tick >= QUEUE_TICKS;
        const now = `${d?.type}|${d?.tick}|${qv.finished}|${late}`;
        if (now === sig) return;
        sig = now;
        for (const [btn, type] of [[approve, 'approve'], [decline, 'decline']]) {
          // aria-disabled, not disabled, so a pressed button keeps focus.
          setAttr(btn, 'aria-disabled', String(Boolean(d) || qv.finished || late));
          btn.classList.toggle('lp-con-chosen', d?.type === type);
        }
        wait.hidden = !d && !late;
        wait.classList.toggle('lp-con-late', !d && late);
        if (d) setText(wait, `${d.type === 'approve' ? 'Approval' : 'Decline'} applies at tick ${group(d.tick)}`);
        else if (late) setText(wait, `Void when tick ${group(qv.world.tick)} runs: too late to decide`);
      },
    };
  }

  /** Where focus sits in the queue before a paint: a button, with its row position and column; or the table region or empty note. */
  function queueSpot() {
    const a = document.activeElement;
    if (a === queueWrap || a === queueEmpty) return { node: a };
    if (!a || !queueBody.contains(a)) return null;
    return { node: a, decide: a.dataset.decide, at: [...queueBody.children].indexOf(a.closest('tr')) };
  }

  /**
   * Put focus back after the focused intent's row left the queue (decided or
   * void), as the screener does: on the same button in the row now at that
   * position, else in the last row, else on the empty note. When the table
   * region or the note hides (the queue emptied or filled), focus goes to
   * whichever now shows, so Enter never lands on an intent nobody chose.
   */
  function restoreQueueFocus(spot) {
    if (!spot || document.activeElement === spot.node) return;
    const rows = queueBody.children;
    let target;
    if (!spot.decide) target = queueWrap.hidden ? queueEmpty : queueWrap;
    else if (spot.node.isConnected) target = spot.node;
    else target = rows.length ? rows[Math.min(spot.at, rows.length - 1)].querySelector(`button[data-decide="${spot.decide}"]`) : queueEmpty;
    target.focus({ preventScroll: true });
  }

  function paintQueue(sim, finished) {
    const asking = sim.approvals === 'queue';
    const items = asking ? sim.queue : [];
    const open = new Set(items.map((q) => q.id));
    for (const id of state.decided.keys()) if (!open.has(id)) state.decided.delete(id);
    qv = { world: sim.world, finished };
    const spot = queueSpot();
    keyedRows(queueBody, items.slice(0, QUEUE_SHOWN), (q) => q.id, createIntent);
    queueWrap.hidden = !items.length;
    queueEmpty.hidden = !asking || items.length > 0;
    restoreQueueFocus(spot);
    setText(queueMode, asking
      ? `Ask mode: a trade above a bot’s approval line waits here for you. A queued intent is void after ${QUEUE_TICKS} ticks, or as soon as the bot’s policy rev or its credits change. An approved intent is checked by the gate again as it runs.${items.length ? ` ${group(items.length)} waiting${items.length > QUEUE_SHOWN ? `; the oldest ${QUEUE_SHOWN} are listed` : ''}.` : ''}`
      : 'Refuse mode: trades above a bot’s approval line are refused and logged. Set Approvals to Ask me to queue them here instead.');
  }

  queueBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-decide]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const sim = ctx.sim;
    const id = btn.dataset.intent;
    const type = btn.dataset.decide;
    if (state.decided.has(id)) return;
    // The row may be a paint behind the sim during Play: refuse an intent that is gone or on its void tick, and repaint it.
    const q = sim.queue.find((x) => x.id === id);
    if (!q || sim.world.tick - q.tick >= QUEUE_TICKS) { bump(); ctx.actions.requestRender(); return; }
    say(queueMsg, '');
    state.decided.set(id, { type, tick: sim.world.tick });
    bump();
    const res = ctx.actions.record({ type, intent: id, runKey: sim.runKey });
    if (!res.ok) {
      state.decided.delete(id);
      say(queueMsg, res.error, 'error');
    } else {
      state.decided.set(id, { type, tick: res.tick });
      ctx.actions.announce(`${type === 'approve' ? 'Approval' : 'Decline'} of ${id} recorded; it applies at tick ${res.tick}.`);
    }
    bump();
    ctx.actions.requestRender();
  });

  /* ---------- recent decisions ---------- */
  function createDecision(d) {
    const t = el('span', { class: 'lp-con-t' });
    const what = el('span', { class: 'lp-con-what' });
    return {
      node: el('li', { class: `lp-con-ev lp-con-k-${d.kind}` }, t, what),
      update(d) { setText(t, `tick ${group(d.tick)}`); setText(what, d.text); },
    };
  }

  function paintRecent() {
    keyedRows(logList, state.recent.slice().reverse(), (d) => d.seq, createDecision);
    logEmpty.hidden = state.recent.length > 0;
  }

  /* ---------- policy editor ---------- */
  const botOf = (sim) => sim.bots.find((b) => b.id === botSel.value) ?? sim.bots[0] ?? null;

  function clearInvalid() {
    for (const input of Object.values(inputs)) input.removeAttribute('aria-invalid');
    setText(policyErr, '');
  }

  /** Put the bot's policy, defaults filled in, into the fields. */
  function fill(bot) {
    const cur = effective(bot.raw);
    for (const f of FIELDS) inputs[f.key].value = String(f.read(cur));
    state.formBot = bot.id;
    state.formRev = bot.policy.rev;
    state.dirty = false;
    clearInvalid();
    hint();
  }

  /** A note when approval can never fire: the per-trade cap runs first and refuses anything larger (plan §6.1). */
  function hint() {
    const a = inputs.approvalAbove.value.trim().replace(/,/g, '');
    const m = inputs.maxPerTrade.value.trim().replace(/,/g, '');
    const never = AMOUNT_RE.test(a) && AMOUNT_RE.test(m) && units(a) >= units(m);
    approvalHint.hidden = !never;
    if (never) setText(approvalHint, `With approval above ${a} cr and a per-trade cap of ${m} cr, nothing ever needs approval: the per-trade cap refuses anything larger first.`);
  }

  /** A policy error in the editor's own field names. */
  function plainError(message) {
    return String(message)
      .replace(/policy\.([\w.]+)/g, (_, k) => FIELD_LABEL[k] ?? k)
      .replace('must be a non-negative integer', 'must be a whole number, 0 or more')
      .replace('must be positive', 'must be at least 1')
      .replace(/^bad amount: (.*)$/, (_, v) => `An amount must be credits with at most 6 decimals (got ${v})`)
      .replace(/^./, (ch) => ch.toUpperCase())
      .replace(/[^.]$/, (ch) => `${ch}.`);
  }

  function fail(text, key) {
    setText(policyErr, text);
    if (key && inputs[key]) { setAttr(inputs[key], 'aria-invalid', 'true'); inputs[key].focus(); }
  }

  form.addEventListener('input', (e) => {
    if (e.target === botSel) return;
    state.dirty = true;
    if (e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); setText(policyErr, ''); }
    hint();
  });
  botSel.addEventListener('change', () => {
    const bot = botOf(ctx.sim);
    if (bot) fill(bot);
    bump();
    ctx.actions.requestRender();
  });
  refill.addEventListener('click', () => {
    const bot = botOf(ctx.sim);
    if (bot) fill(bot);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const sim = ctx.sim;
    const bot = botOf(sim);
    clearInvalid();
    if (!bot) return fail('Choose a bot first.');
    // Edits recorded for this bot that wait for the next tick apply first, in log order: compare and check against the policy they leave.
    const waitingEdits = state.policyPending.filter((p) => p.bot === bot.id && p.tick >= sim.world.tick);
    let base = bot.raw;
    try { for (const p of waitingEdits) base = patchPolicy(base, p.patch).raw; } catch { base = bot.raw; }
    const cur = effective(base);
    const vals = {};
    for (const f of FIELDS) {
      const text = inputs[f.key].value.trim().replace(/,/g, '');
      if (f.amount) {
        if (!AMOUNT_RE.test(text)) return fail(`${f.label} must be an amount of credits, 0 or more, with at most 6 decimals.`, f.key);
        vals[f.key] = { value: text, changed: units(text) !== units(String(f.read(cur))) };
      } else {
        if (!WHOLE_RE.test(text)) return fail(`${f.label} must be a whole number.`, f.key);
        const n = Number(text);
        vals[f.key] = { value: n, changed: n !== f.read(cur) };
      }
    }
    const patch = {};
    for (const k of ['maxPerTrade', 'approvalAbove', 'maxPositionBps', 'cooldownTicks', 'maxSlippageBps']) if (vals[k].changed) patch[k] = vals[k].value;
    if (vals['windowCap.amount'].changed || vals['windowCap.ticks'].changed) patch.windowCap = { amount: vals['windowCap.amount'].value, ticks: vals['windowCap.ticks'].value };
    if (!Object.keys(patch).length) return fail(`Nothing to record: every field matches ${bot.id}’s policy (rev ${base.rev ?? 0}${waitingEdits.length ? ', with the edits waiting for the next tick' : ''}).`);
    // The gate's own check: an edit it would refuse is never recorded.
    let next;
    try {
      next = patchPolicy(base, patch);
    } catch (err) {
      return fail(plainError(err.message), /policy\.([\w.]+)/.exec(err.message)?.[1]);
    }
    const res = ctx.actions.record({ type: 'policy', bot: bot.id, patch });
    if (!res.ok) return fail(res.error);
    const waiting = sim.queue.filter((q) => q.bot === bot.id).length;
    state.policyPending.push({ bot: bot.id, tick: res.tick, rev: next.policy.rev, patch });
    state.dirty = false;
    say(policyMsg, `Recorded: ${patchText(patch)}. It applies at tick ${group(res.tick)}, moves ${bot.id} to policy rev ${next.policy.rev}, and voids its queued approvals${waiting ? ` (${group(waiting)} waiting now)` : ''}.`, 'pending');
    ctx.actions.announce(`Policy edit for ${bot.id} recorded; it applies at tick ${res.tick}.`);
    bump();
    ctx.actions.requestRender();
  });

  function paintPolicy(sim, info) {
    const { world } = sim;
    // Recorded edits whose tick has run: say what the POLICY event did.
    state.policyPending = state.policyPending.filter((p) => {
      if (world.tick <= p.tick) return true;
      const key = `${p.bot}@${p.tick}`;
      const list = state.policyApplied.get(key);
      const done = list && (list.find((x) => x.rev === p.rev) ?? list[list.length - 1]);
      if (done) say(policyMsg, `Applied at tick ${group(p.tick)}: ${p.bot} is on policy rev ${done.rev}${done.voided ? `; ${group(done.voided)} queued approval${done.voided === 1 ? ' was' : 's were'} voided` : ''}.`, 'ok');
      else if (!state.policyRefused.has(key)) say(policyMsg, `The policy edit for ${p.bot} did not apply at tick ${group(p.tick)}.`, 'error');
      return false;
    });
    const bot = botOf(sim);
    form.hidden = !bot;
    if (!bot) return;
    if (state.formBot !== bot.id || (state.formRev !== bot.policy.rev && !state.dirty)) fill(bot);
    else state.formRev = bot.policy.rev;
    setText(revNote, `${bot.label} · policy rev ${bot.policy.rev}${bot.killed || sim.killedAll ? ' · stopped' : ''}`);
    submit.disabled = info.finished;
  }

  /** A new run: forget the last run's presses, reading positions and rows. */
  function adopt(sim) {
    Object.assign(state, {
      sim, sig: '', wanted: new Map(), wantedAll: null, decided: new Map(), cursor: 0, recent: [], intents: new Map(), rejCursor: 0,
      policyPending: [], policyApplied: new Map(), policyRefused: new Set(), lastPolicy: null, formBot: null, formRev: -1, dirty: false,
    });
    for (const body of [rosterBody, queueBody, logList]) { body.replaceChildren(); delete body.__rows; }
    for (const node of [rosterMsg, queueMsg, policyMsg]) say(node, '');
    setText(policyErr, '');
    if (!sim) return;
    const keep = botSel.value;
    botSel.replaceChildren(...sim.bots.map((b) => el('option', { value: b.id }, `${b.id} · ${b.label}`)));
    if (sim.bots.some((b) => b.id === keep)) botSel.value = keep;
  }

  return {
    /** Skips a paint when nothing it reads has changed: run, tick, events, the action log, local presses, play state. */
    render(info) {
      const sim = ctx.sim;
      if (!sim) return;
      if (sim !== state.sim) adopt(sim);
      const { world } = sim;
      const sig = `${world.tick}|${world.events.length}|${sim.log.length}|${state.version}|${info.finished}|${info.playing}`;
      if (sig === state.sig) return;
      state.sig = sig;
      finishedNote.hidden = !info.finished;
      ingest(sim);
      readRejects(sim);
      paintRoster(sim, info.finished);
      paintQueue(sim, info.finished);
      paintRecent();
      paintPolicy(sim, info);
    },
    reset() {
      adopt(null);
    },
  };
}
