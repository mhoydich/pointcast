import { SESSION, TOTAL_SECONDS, phaseAt, phaseStart, clockText } from './session.mjs';

const mounts = new WeakMap();
export function mountPlayLab(doc = document, { now = () => doc.defaultView.performance.now() } = {}) {
  const root = doc.querySelector('[data-play-lab]');
  if (!root) return () => {};
  if (mounts.has(root)) return mounts.get(root);
  const win = doc.defaultView;
  const query = selector => root.querySelector(selector);
  const toggle = query('[data-clock-toggle]');
  let elapsed = 0;
  let startedAt = null;
  let interval = null;
  let previousPhase = -1;
  let previousHalf = false;
  let disposed = false;
  const removers = [];
  function listen(target, type, callback) {
    target.addEventListener(type, callback);
    removers.push(() => target.removeEventListener(type, callback));
  }
  const seconds = () => Math.min(TOTAL_SECONDS, elapsed + (startedAt === null ? 0 : Math.max(0, now() - startedAt) / 1000));
  function clearClock() {
    if (interval !== null) win.clearInterval(interval);
    interval = null;
  }
  function announce(message) { query('[data-clock-status]').textContent = message; }
  function paint() {
    const current = seconds();
    const done = current >= TOTAL_SECONDS;
    const index = phaseAt(current);
    const phase = SESSION[index];
    if (done && startedAt !== null) {
      elapsed = TOTAL_SECONDS;
      startedAt = null;
      clearClock();
      announce('Session complete. Keep one observation and one next experiment. Reset to play again.');
    }
    query('[data-clock]').textContent = clockText(Math.ceil(TOTAL_SECONDS - current));
    query('[data-phase-time]').textContent = done ? 'Play card complete.' : `${clockText(Math.ceil(phaseStart(index) + phase.duration - current))} in this block`;
    query('[data-phase-title]').textContent = done ? 'See you next session.' : phase.title;
    const swapRoles = index === 2 && current >= phaseStart(2) + 150;
    query('[data-phase-cue]').textContent = done ? 'What will you keep? What will you change?' : swapRoles ? 'Swap roles for the second half. Keep the feed and lane consistent.' : phase.cue;
    query('[data-clock-state]').textContent = done ? 'SESSION COMPLETE' : startedAt !== null ? 'IN PLAY' : current ? 'PAUSED' : 'READY WHEN YOU ARE';
    toggle.textContent = startedAt !== null ? 'Pause session' : current ? 'Resume session' : 'Start session';
    toggle.disabled = done;
    root.querySelectorAll('[data-phase]').forEach((element, itemIndex) => {
      if (itemIndex === index && !done) element.setAttribute('aria-current', 'step');
      else element.removeAttribute('aria-current');
      element.classList.toggle('is-finished', itemIndex < index || done);
    });
    if (index !== previousPhase && startedAt !== null) announce(`Now: ${phase.title}. ${phase.cue}`);
    if (swapRoles && !previousHalf && startedAt !== null) announce('Drop-and-Go: swap roles for the second half.');
    previousHalf = swapRoles;
    previousPhase = index;
  }
  function pause(message) {
    if (startedAt === null) return;
    elapsed = seconds();
    startedAt = null;
    clearClock();
    paint();
    announce(elapsed >= TOTAL_SECONDS ? 'Session complete. Reset to play again.' : message);
  }
  listen(toggle, 'click', () => {
    if (startedAt !== null) return pause('Session paused. Resume when you are ready.');
    if (elapsed >= TOTAL_SECONDS || doc.visibilityState === 'hidden') return;
    startedAt = now();
    interval = win.setInterval(paint, 250);
    paint();
    announce(`Session running. ${SESSION[phaseAt(elapsed)].title}.`);
  });
  listen(query('[data-clock-reset]'), 'click', () => {
    clearClock();
    elapsed = 0;
    startedAt = null;
    paint();
    announce('Session reset to twenty minutes. Press Start session when ready.');
  });
  root.querySelectorAll('[data-jump]').forEach(button => {
    button.hidden = false;
    listen(button, 'click', () => {
      clearClock();
      elapsed = phaseStart(Number(button.dataset.jump));
      startedAt = null;
      paint();
      announce(`${SESSION[Number(button.dataset.jump)].title} selected. Press ${elapsed ? 'Resume' : 'Start'} session to begin.`);
      toggle.focus();
    });
  });
  const gameButtons = [...root.querySelectorAll('[data-game-button]')];
  function chooseGame(id) {
    gameButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.gameButton === id)));
    root.querySelectorAll('[data-game]').forEach(panel => { panel.hidden = panel.dataset.game !== id; });
  }
  gameButtons.forEach((button, index) => {
    listen(button, 'click', () => chooseGame(button.dataset.gameButton));
    listen(button, 'keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % gameButtons.length;
      if (event.key === 'ArrowLeft') next = (index + gameButtons.length - 1) % gameButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = gameButtons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      gameButtons[next].focus();
      chooseGame(gameButtons[next].dataset.gameButton);
    });
  });
  listen(doc, 'visibilitychange', () => { if (doc.visibilityState === 'hidden') pause('Session paused while you were away. Resume when ready.'); });
  listen(win, 'pagehide', () => pause('Session paused while you were away. Resume when ready.'));
  listen(win, 'pageshow', paint);
  query('[data-clock-controls]').hidden = false;
  query('[data-game-picker]').hidden = false;
  chooseGame('backhand');
  paint();
  function unmount() {
    if (disposed) return;
    disposed = true;
    clearClock();
    removers.forEach(remove => remove());
    query('[data-clock-controls]').hidden = true;
    query('[data-game-picker]').hidden = true;
    root.querySelectorAll('[data-jump]').forEach(button => { button.hidden = true; });
    root.querySelectorAll('[data-game]').forEach(panel => { panel.hidden = false; });
    mounts.delete(root);
  }
  mounts.set(root, unmount);
  return unmount;
}
