/**
 * The launchpad live board (plan §3, roadmap A1): one simulator run in the
 * browser, with a screener, a coin drawer with a trade panel, a Create
 * surface, the viewer's portfolio, the bot console with its approval queue,
 * and a creator view. Every viewer action is a record in the run's human
 * action log, so a replay link reproduces the run exactly.
 *
 * The shell owns the run, the clock, settings, routing (#/c/<id>,
 * #/replay/<payload>) and the watchlist; each view mounts into its own
 * region and re-renders from the sim on a throttled frame.
 */
import { createSim } from '../../lib/launchpad/sim.mjs';
import { eventsHash } from '../../lib/launchpad/engine.mjs';
import { RULES, configHash } from '../../lib/launchpad/config.mjs';
import { encodeReplay, decodeReplay } from '../../lib/launchpad/replay.mjs';
import { coinPath, previewPath } from '../../lib/launchpad/paths.mjs';
import { el, setText, setAttr } from './ui.mjs';
import { mountScreener } from './screener-view.mjs';
import { mountCoin } from './coin-view.mjs';
import { mountCreate } from './create-view.mjs';
import { mountPortfolio } from './portfolio-view.mjs';
import { mountConsole } from './console-view.mjs';
import { mountCreator } from './creator-view.mjs';
import quietLaunch from '../../data/launchpad/scenarios/quiet-launch.json' with { type: 'json' };
import snipeWar from '../../data/launchpad/scenarios/snipe-war.json' with { type: 'json' };
import devDump from '../../data/launchpad/scenarios/dev-dump.json' with { type: 'json' };
import graduationRun from '../../data/launchpad/scenarios/graduation-run.json' with { type: 'json' };

export const SCENARIOS = Object.freeze({ 'quiet-launch': quietLaunch, 'snipe-war': snipeWar, 'dev-dump': devDump, 'graduation-run': graduationRun });
export const VIEWER = 'you';
const SPEEDS = [1, 10, 100, 1000];
const PAINT_MS = 150;
const PANELS = [
  { id: 'create', label: 'Create', mount: mountCreate },
  { id: 'portfolio', label: 'Portfolio', mount: mountPortfolio },
  { id: 'bots', label: 'Bots & approvals', mount: mountConsole },
  { id: 'creator', label: 'Creator', mount: mountCreator },
];

/** localStorage, wrapped: private windows and blocked storage must never break the board. */
const store = {
  get(key) { try { return JSON.parse(window.localStorage.getItem(key) ?? 'null'); } catch { return null; } },
  set(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: the watchlist lasts for this page only */ } },
};

/**
 * Mount the board into `root`. `routing: false` leaves the URL alone (no #/c/ or #/replay/ hash), and
 * `replayLinks: false` hides the Copy replay link button, for hosts where the hash cannot carry a route.
 */
export function mountApp(root, { routing = true, replayLinks = true } = {}) {
  const settings = { scenario: 'snipe-war', rules: 'naked', approvals: 'queue', speed: 10 };
  const ctx = {
    sim: null,
    viewer: VIEWER,
    selected: null,
    settings,
    watchlist: new Set(),
    scenarios: SCENARIOS,
    rules: RULES,
    /** The image for a coin: the built portrait for a scenario coin, the Noun's coin face for one launched on the board. */
    coinImage(coin) {
      const scenario = SCENARIOS[settings.scenario];
      const scripted = !coin.viewerMade && scenario.launches.some((l) => l.symbol === coin.symbol);
      return scripted ? coinPath(scenario.id, coin.symbol) : previewPath(coin.nounId);
    },
    actions: {
      select(id) { ctx.selected = id; writeHash(); render(true); },
      record(rec) {
        if (ctx.sim.world.tick >= ctx.sim.scenario.ticks) return { ok: false, error: 'The run has finished. Reset to start a new one.' };
        try {
          const full = ctx.sim.record(rec);
          linkOut.hidden = true; // a link copied before this record no longer reproduces the run
          render(true);
          return { ok: true, tick: full.tick };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      },
      toggleWatch(id) {
        const coin = ctx.sim.world.coins.get(id);
        if (!coin) return;
        const on = !ctx.watchlist.has(id);
        if (coin.viewerMade) {
          if (on) watchMine.add(id); else watchMine.delete(id);
        } else {
          if (on) watchSymbols.add(coin.symbol); else watchSymbols.delete(coin.symbol);
          store.set(watchKey(), [...watchSymbols]);
        }
        syncWatchlist();
        render(true);
      },
      announce,
      step() { if (!done()) { ctx.sim.step(); render(true); if (done()) announceFinished(); } },
      requestRender: () => render(true),
    },
  };

  /* ---------- shell DOM ---------- */
  const option = (value, label, selected) => el('option', { value, selected: selected || undefined }, label);
  const runSel = el('select', { id: 'lp-run' }, ...Object.values(SCENARIOS).map((s) => option(s.id, s.title, s.id === settings.scenario)));
  const rulesSel = el('select', { id: 'lp-rules' }, ...Object.values(RULES).map((r) => option(r.id, r.label, r.id === settings.rules)));
  const approvalsSel = el('select', { id: 'lp-approvals' }, option('queue', 'Ask me', true), option('deny', 'Refuse'));
  const speedSel = el('select', { id: 'lp-speed' }, ...SPEEDS.map((s) => option(String(s), `${s}×`, s === settings.speed)));
  const playBtn = el('button', { type: 'button', id: 'lp-play' }, 'Play');
  const stepBtn = el('button', { type: 'button', id: 'lp-step' }, 'Step');
  const resetBtn = el('button', { type: 'button', id: 'lp-reset' }, 'Reset');
  const linkBtn = el('button', { type: 'button', id: 'lp-link' }, 'Copy replay link');
  const clock = el('span', { class: 'lp-clock', id: 'lp-clock', tabindex: '-1' });
  const pending = el('span', { class: 'lp-note lp-pending', id: 'lp-pending', hidden: true });
  const status = el('p', { class: 'lp-sr', id: 'lp-status', role: 'status', 'aria-live': 'polite' });
  const linkOut = el('input', { class: 'lp-link-out', id: 'lp-link-out', type: 'text', readonly: true, 'aria-label': 'Replay link', hidden: true });
  const notice = el('p', { class: 'lp-note lp-notice', id: 'lp-notice', hidden: true });
  const controls = el('div', { class: 'lp-controls', role: 'group', 'aria-label': 'Simulation controls' },
    el('label', {}, 'Run ', runSel), el('label', {}, 'Rules ', rulesSel), el('label', { title: 'What happens when a bot wants to trade above its approval line' }, 'Approvals ', approvalsSel),
    playBtn, stepBtn, el('label', {}, 'Speed ', speedSel), resetBtn, linkBtn, clock, pending, status);

  const screenerRoot = el('div', { class: 'lp-card lp-screener-card', id: 'lp-screener-view' });
  const coinRoot = el('div', { class: 'lp-card lp-coin-card', id: 'lp-coin-view' });
  const tabBar = el('div', { class: 'lp-tabs', role: 'tablist', 'aria-label': 'Board panels' });
  const panelRoots = new Map();
  for (const p of PANELS) {
    const tab = el('button', { type: 'button', role: 'tab', id: `lp-tab-${p.id}`, 'aria-controls': `lp-panel-${p.id}`, 'aria-selected': 'false', tabindex: '-1', 'data-panel': p.id }, p.label);
    tabBar.append(tab);
    panelRoots.set(p.id, el('div', { class: 'lp-card lp-panel', role: 'tabpanel', id: `lp-panel-${p.id}`, 'aria-labelledby': `lp-tab-${p.id}`, hidden: true }));
  }
  root.replaceChildren(controls, notice, linkOut, el('div', { class: 'lp-board' }, screenerRoot, coinRoot), tabBar, ...panelRoots.values());

  const screener = mountScreener(screenerRoot, ctx);
  const coinView = mountCoin(coinRoot, ctx);
  const panels = new Map(PANELS.map((p) => [p.id, p.mount(panelRoots.get(p.id), ctx)]));
  let activePanel = 'create';

  function showPanel(id, focus = false) {
    activePanel = id;
    for (const tab of tabBar.children) {
      const on = tab.dataset.panel === id;
      setAttr(tab, 'aria-selected', String(on));
      setAttr(tab, 'tabindex', on ? '0' : '-1');
      if (on && focus) tab.focus();
    }
    for (const [pid, node] of panelRoots) node.hidden = pid !== id;
    render(true);
  }
  tabBar.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) showPanel(t.dataset.panel); });
  tabBar.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = PANELS.findIndex((p) => p.id === activePanel);
    const next = PANELS[(i + (e.key === 'ArrowRight' ? 1 : PANELS.length - 1)) % PANELS.length];
    showPanel(next.id, true);
    e.preventDefault();
  });

  /* ---------- run lifecycle ---------- */
  let playing = false, raf = 0, last = 0, carry = 0, lastPaint = 0;
  const done = () => ctx.sim.world.tick >= ctx.sim.scenario.ticks;
  const watchKey = () => `pc:launchpad:watchlist:${settings.scenario}`;
  // Coin ids are reused between runs, so the saved watchlist holds scenario coins by symbol.
  // Coins launched on the board are starred for this run only.
  let watchSymbols = new Set(), watchMine = new Set();
  function syncWatchlist() {
    const ids = new Set(watchMine);
    for (const [id, coin] of ctx.sim.world.coins) if (!coin.viewerMade && watchSymbols.has(coin.symbol)) ids.add(id);
    if (ids.size !== ctx.watchlist.size || [...ids].some((id) => !ctx.watchlist.has(id))) ctx.watchlist = ids;
  }
  function announce(text) { status.textContent = text; }
  /** Said when the run ends, by Play or by Step: focus has just moved to Play, and this says why. */
  const announceFinished = () => announce(`Run finished at tick ${ctx.sim.world.tick}. Log hash ${eventsHash(ctx.sim.world.events)}.`);

  function reset({ humanLog = [], seed } = {}) {
    stop(false);
    const scenario = SCENARIOS[settings.scenario];
    ctx.sim = createSim({ scenario, seed: seed ?? scenario.seed, rules: settings.rules, approvals: settings.approvals, humanLog });
    ctx.selected = null;
    const saved = store.get(watchKey());
    watchSymbols = new Set(Array.isArray(saved) ? saved.filter((s) => typeof s === 'string') : []);
    watchMine = new Set();
    ctx.watchlist = new Set();
    linkOut.hidden = true;
    screener.reset?.();
    coinView.reset?.();
    for (const v of panels.values()) v.reset?.();
    render(true);
    announce(`${scenario.title}, ${RULES[settings.rules].label} rules, ready.`);
  }

  function stop(say = true) {
    if (playing && say) announce(`Paused at tick ${ctx.sim.world.tick}.`);
    playing = false;
    setText(playBtn, 'Play');
    cancelAnimationFrame(raf);
  }

  function frame(now) {
    if (!playing) return;
    const dt = last ? Math.min(250, now - last) : 16;
    last = now;
    carry += (settings.speed * dt) / 1000;
    let steps = Math.floor(carry);
    carry -= steps;
    while (steps-- > 0 && !done()) ctx.sim.step();
    if (done() || now - lastPaint > PAINT_MS) { lastPaint = now; render(); }
    if (done()) { stop(false); announceFinished(); return; }
    raf = requestAnimationFrame(frame);
  }

  function render(force = false) {
    if (!ctx.sim) return;
    const { world, scenario } = ctx.sim;
    const finished = world.tick >= scenario.ticks;
    setText(clock, `tick ${world.tick} of ${scenario.ticks} · ${world.events.length} events${finished ? ` · log ${eventsHash(world.events)}` : ''}`);
    // Only the records the next Step runs: a replay's log also holds records for later ticks.
    const waiting = finished ? 0 : ctx.sim.log.filter((r) => r.tick === world.tick).length;
    pending.hidden = !waiting;
    if (waiting) setText(pending, `${waiting} action${waiting === 1 ? ' applies' : 's apply'} at tick ${world.tick}${playing ? '' : ': press Step or Play'}`);
    // Step stays focusable at the run's end (aria-disabled, guarded by done()), so a key held on it keeps focus and does nothing.
    const focused = finished ? document.activeElement : null;
    setAttr(stepBtn, 'aria-disabled', String(finished));
    if (!ctx.selected) { const first = world.coins.keys().next(); if (!first.done) ctx.selected = first.value; }
    syncWatchlist();
    const info = { tick: world.tick, finished, force, playing };
    screener.render(info);
    coinView.render(info);
    // A hidden panel still settles its own pending actions (a launch, say), so it can report the outcome on the tick it lands.
    for (const [id, view] of panels) if (id === activePanel || view.pending?.()) view.render(info);
    // A view's control the run's end disabled would drop focus to the page: move it to the clock, which reads the final tick and
    // log hash and does nothing when pressed (Play would start a new run and discard this one).
    if (focused?.disabled && root.contains(focused)) clock.focus();
  }

  /* ---------- routing and replay links ---------- */
  // The shared run on the board ({ log, seed }), so Play at its end runs it again; null for the viewer's own run.
  let replay = null;

  function writeHash() {
    if (!routing) return;
    const id = ctx.selected;
    const want = id ? `#/c/${id}` : '';
    if (location.hash.startsWith('#/replay/')) return;
    if (location.hash !== want) history.replaceState(null, '', want || location.pathname + location.search);
  }
  const clearHash = () => { if (routing) history.replaceState(null, '', location.pathname + location.search); };

  function replayLink() {
    const payload = encodeReplay({ scenario: settings.scenario, seed: ctx.sim.seed, rules: settings.rules, approvals: settings.approvals, configHash: configHash(), log: ctx.sim.log });
    return `${location.origin}${location.pathname}#/replay/${payload}`;
  }

  /** Start a shared run from tick 0, with its notice. */
  function playReplay(r) {
    reset({ humanLog: r.log, seed: r.seed });
    replay = r;
    notice.hidden = false;
    setText(notice, `Replaying a shared run: ${r.log.length} viewer action${r.log.length === 1 ? '' : 's'}. Press Play.`);
  }

  function loadFromHash() {
    const h = routing ? location.hash : '';
    replay = null;
    if (h.startsWith('#/replay/')) {
      try {
        const r = decodeReplay(h.slice('#/replay/'.length), { scenarios: SCENARIOS, rules: Object.keys(RULES), configHash: configHash() });
        Object.assign(settings, { scenario: r.scenario, rules: r.rules, approvals: r.approvals });
        runSel.value = r.scenario; rulesSel.value = r.rules; approvalsSel.value = r.approvals;
        playReplay({ log: r.log, seed: r.seed });
        return;
      } catch (e) {
        notice.hidden = false;
        setText(notice, `That replay link could not be used (${e.code ?? 'error'}). Starting a fresh run instead.`);
        clearHash(); // a bad link left in the address bar would come back on reload, and writeHash would never replace it
      }
    }
    reset();
    if (h.startsWith('#/c/')) { ctx.selected = h.slice(4); render(true); }
  }

  /* ---------- controls ---------- */
  playBtn.addEventListener('click', () => {
    if (playing) { stop(); render(true); return; }
    if (done()) { if (replay) playReplay(replay); else reset(); }
    playing = true; last = 0; carry = 0;
    setText(playBtn, 'Pause');
    announce('Playing.');
    raf = requestAnimationFrame(frame);
  });
  stepBtn.addEventListener('click', () => ctx.actions.step());
  /** A fresh run of the viewer's own: drop the shared run, its notice and its link in the address bar. */
  const leaveReplay = () => { replay = null; notice.hidden = true; clearHash(); };
  resetBtn.addEventListener('click', () => { leaveReplay(); reset(); });
  const resetOn = (sel, key) => sel.addEventListener('change', () => {
    settings[key] = sel.value;
    leaveReplay();
    reset();
  });
  resetOn(runSel, 'scenario');
  resetOn(rulesSel, 'rules');
  resetOn(approvalsSel, 'approvals');
  speedSel.addEventListener('change', () => { settings.speed = Number(speedSel.value); });
  linkBtn.addEventListener('click', async () => {
    let url = '';
    try {
      url = replayLink();
      linkOut.value = url;
      linkOut.hidden = false;
      linkOut.select();
      await navigator.clipboard.writeText(url);
      announce('Replay link copied.');
    } catch {
      announce(url ? 'Replay link ready to copy.' : 'This run could not be turned into a replay link.');
    }
  });
  // A link pasted into this tab changes only the hash, so the page does not reload: follow it here. A replay
  // link replaces the run (reset stops play first); a coin link only selects the coin. replaceState fires no hashchange.
  if (routing) window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/replay/')) loadFromHash();
    else if (location.hash.startsWith('#/c/')) ctx.actions.select(location.hash.slice(4));
  });

  linkBtn.hidden = !replayLinks;
  showPanel('create');
  loadFromHash();
  return ctx;
}
