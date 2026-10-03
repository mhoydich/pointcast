import {
  appendScorecardEntry, buildPracticePlan, exportScorecard, localDate, normalizePracticeOptions,
  parseScorecard, PRACTICE_OPTIONS, PRACTICE_PRESETS, SCORECARD_KEY, SCORECARD_MAX,
  serializeScorecard, summarizeScorecard, validateScorecardEntry,
} from './model.js';

const mounted = new WeakMap();
const visitStates = new WeakMap();
const submissionGuards = new WeakMap();
let sequence = 0;

/** Local-only enhancement. No network, location, analytics, or user HTML is used. */
export function mountPickleballV2(root = document) {
  const home = root.matches?.('[data-pickleball-v2]') ? root : root.querySelector('[data-pickleball-v2]');
  if (!home) return () => {};
  if (mounted.has(home)) return mounted.get(home);
  const doc = home.ownerDocument;
  const win = doc.defaultView;
  const one = (selector) => home.querySelector(selector);
  const all = (selector) => [...home.querySelectorAll(selector)];
  const listeners = [];
  let active = true;
  const lifecycle = Symbol('pickleball-v2-mount');
  let mutationQueue = Promise.resolve();
  const urls = new Set();
  const revokeTimers = new Set();
  const focusTimers = new Set();
  let plannerFocusArmed = win.location.hash === '#pb-v2-planner';
  const on = (target, event, callback) => {
    if (!target) return;
    target.addEventListener(event, callback);
    listeners.push(() => target.removeEventListener(event, callback));
  };
  const element = (tag, text, className) => {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const planner = one('[data-v2-planner]');
  const planOutput = one('[data-v2-plan]');
  const planStatus = one('[data-v2-plan-status]');
  const scorecard = one('[data-v2-scorecard]');
  const scoreStatus = one('[data-v2-scorecard-status]');
  const summary = one('[data-v2-scorecard-summary]');
  const history = one('[data-v2-scorecard-history]');
  const clearButton = one('[data-v2-clear]');
  const confirmation = one('[data-v2-clear-confirm]');
  const clearYes = one('[data-v2-clear-yes]');
  const clearCancel = one('[data-v2-clear-cancel]');
  const dateField = scorecard?.elements.namedItem('date');
  let currentPlan;
  const guard = (scorecard && submissionGuards.get(scorecard)) || { editVersion: 0, lastSubmission: null, pendingSubmission: null };
  if (scorecard) submissionGuards.set(scorecard, guard);
  let state = visitStates.get(win);
  if (!state) { state = { entries: [], mode: 'saved', notice: '' }; visitStates.set(win, state); }

  const modeMessage = () => state.mode === 'blocked'
    ? 'Browser storage is unavailable. Counts stay in memory for this visit only; export them before leaving.'
    : state.mode === 'corrupt'
      ? 'Saved scorecard data could not be read. New counts stay in memory for this visit only; export them before leaving. Clearing resets this scorecard’s saved data.'
      : 'Saved only in this browser. Self-reported counts are not skill ratings or verified results.';
  const status = (message = '') => {
    if (scoreStatus && active) scoreStatus.textContent = `${message}${message ? ' ' : ''}${modeMessage()}`;
  };
  const readSaved = () => {
    try {
      const parsed = parseScorecard(win.localStorage.getItem(SCORECARD_KEY), { today: localDate() });
      if (!parsed.ok) { state.mode = 'corrupt'; return false; }
      state.entries = parsed.entries;
      if (guard.lastSubmission && !state.entries.some((entry) => entry.id === guard.lastSubmission.id)) guard.lastSubmission = null;
      state.mode = 'saved';
      return true;
    } catch { state.mode = 'blocked'; return false; }
  };
  // Once a save fails, keep that visit's memory rather than silently reloading older data.
  if (state.mode === 'saved') readSaved();
  if (scoreStatus) { scoreStatus.setAttribute('role', 'status'); scoreStatus.setAttribute('aria-live', 'polite'); }
  if (planStatus) { planStatus.setAttribute('role', 'status'); planStatus.setAttribute('aria-live', 'polite'); }
  if (planOutput) planOutput.removeAttribute('aria-live');
  if (dateField) { dateField.max = localDate(); if (!dateField.value) dateField.value = localDate(); }

  const formValues = (form) => {
    const data = new win.FormData(form);
    return Object.fromEntries([...data.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']));
  };
  const setFields = (form, values) => {
    if (!form) return;
    Object.entries(values).forEach(([key, value]) => { const field = form.elements.namedItem(key); if (field && 'value' in field) field.value = String(value); });
  };
  const renderPlan = (options, announce = true) => {
    currentPlan = buildPracticePlan(options);
    if (planOutput && active) {
      const heading = element('div', undefined, 'v2-plan-heading');
      heading.append(element('span', `${currentPlan.totalMinutes} MINUTES / YOUR PRACTICE`, 'v2-eyebrow'), element('h4', currentPlan.title), element('p', currentPlan.description));
      const constraints = element('p', currentPlan.constraintNote, 'v2-constraint');
      const blocks = element('ol', undefined, 'v2-plan-blocks');
      currentPlan.blocks.forEach((block) => {
        const row = element('li', undefined, 'v2-plan-block');
        const header = element('div');
        header.append(element('span', `${block.minutes} min`, 'v2-plan-minutes'), element('h5', block.title));
        row.append(header, element('p', block.instruction));
        for (const [label, value] of [['Quality cue', block.qualityCue], ['Progression', block.progression], ['Count honestly', block.successTarget]]) {
          const cue = element('p', undefined, label === 'Progression' ? 'v2-plan-progression' : 'v2-plan-cue');
          cue.append(element('b', `${label}: `), doc.createTextNode(value));
          row.append(cue);
        }
        blocks.append(row);
      });
      const reference = element('a', 'Read the related field guide ↗', 'v2-text-link');
      reference.href = currentPlan.articleUrl;
      planOutput.replaceChildren(heading, constraints, blocks, reference);
    }
    if (announce && planStatus && active) planStatus.textContent = `${currentPlan.totalMinutes}-minute ${currentPlan.options.partner} plan ready for ${currentPlan.options.space === 'compact' ? 'compact practice' : currentPlan.options.space === 'halfcourt' ? 'a shared half-court lane' : 'a full court'}.`;
    return currentPlan;
  };
  const renderScorecard = () => {
    if (!active) return;
    if (summary) {
      const rows = summarizeScorecard(state.entries).map((item) => {
        const row = element('div', undefined, 'v2-summary-row');
        row.append(element('h4', item.label), element('p', `${item.successes} made / ${item.attempts} attempted · ${item.entries} ${item.entries === 1 ? 'entry' : 'entries'}`));
        return row;
      });
      summary.replaceChildren(...rows);
    }
    if (history) {
      if (!state.entries.length) history.replaceChildren(element('p', 'No practice counts yet. Add the result of one clearly defined target.', 'v2-score-empty'));
      else {
        const list = element('ol', undefined, 'v2-score-history-list');
        state.entries.slice(0, 10).forEach((entry) => {
          const row = element('li', undefined, 'v2-score-entry');
          const goal = PRACTICE_OPTIONS.goals.find((option) => option.id === entry.goal).label;
          const space = PRACTICE_OPTIONS.spaces.find((option) => option.id === entry.space).label;
          row.append(element('h4', `${entry.successes} / ${entry.attempts} · ${goal}`), element('p', `${entry.date} · ${space} · ${entry.partner === 'solo' ? 'Solo' : 'With a partner'}`, 'v2-score-entry-meta'));
          if (entry.notes) row.append(element('p', entry.notes, 'v2-score-entry-notes'));
          list.append(row);
        });
        history.replaceChildren(list);
      }
    }
  };
  const clearErrors = () => {
    if (!scorecard) return;
    [...scorecard.elements].forEach((field) => { field.removeAttribute('aria-invalid'); field.setCustomValidity?.(''); });
  };
  const snapshot = () => scorecard ? JSON.stringify(formValues(scorecard)) : '';
  const invalidateSubmission = () => {
    guard.observedSnapshot = snapshot();
    guard.editVersion++; guard.lastSubmission = null; clearErrors();
  };
  const markEdited = () => {
    // Blur/change can follow an Enter-submit without changing a value. Only an actual edit resets the guard.
    if (snapshot() !== guard.observedSnapshot) invalidateSubmission();
  };
  if (guard.observedSnapshot === undefined) guard.observedSnapshot = snapshot();
  else markEdited();
  const makeId = () => win.crypto?.randomUUID?.() || `entry-${Date.now()}-${++sequence}`;
  const locked = (callback) => {
    const guardedCallback = () => active ? callback() : undefined;
    const run = () => {
      if (!active) return;
      return win.navigator.locks?.request ? win.navigator.locks.request(SCORECARD_KEY, guardedCallback) : guardedCallback();
    };
    const operation = mutationQueue.then(run, run);
    mutationQueue = operation.catch(() => {});
    return operation;
  };

  if (planner) {
    let initial = normalizePracticeOptions(formValues(planner));
    const params = new URLSearchParams(win.location.search);
    const query = {};
    for (const [field, type] of [['goal', 'goals'], ['space', 'spaces'], ['partner', 'partners']]) {
      const value = params.get(field);
      if (PRACTICE_OPTIONS[type].some((option) => option.id === value)) query[field] = value;
    }
    const duration = params.get('duration');
    if (duration && /^\d+$/.test(duration) && PRACTICE_OPTIONS.durations.includes(Number(duration))) query.duration = Number(duration);
    initial = { ...initial, ...query };
    setFields(planner, initial); renderPlan(initial, false);
    on(planner, 'submit', (event) => { event.preventDefault(); renderPlan(formValues(planner)); });
    on(planner, 'change', () => renderPlan(formValues(planner)));
    on(planner, 'reset', () => {
      // Wait until the native form reset has restored its default values.
      win.setTimeout(() => { if (active) renderPlan(formValues(planner)); }, 0);
    });
    all('[data-v2-preset]').forEach((button) => on(button, 'click', () => {
      const preset = PRACTICE_PRESETS.find((item) => item.id === button.dataset.v2Preset);
      if (preset) { setFields(planner, preset.options); renderPlan(preset.options); }
    }));
  } else currentPlan = buildPracticePlan(PRACTICE_PRESETS[0].options);

  on(scorecard, 'input', markEdited);
  on(scorecard, 'change', markEdited);
  on(scorecard, 'reset', () => {
    win.setTimeout(() => {
      if (!active) return;
      if (dateField && !dateField.value) dateField.value = localDate();
      markEdited();
    }, 0);
  });
  on(scorecard, 'submit', (event) => {
    event.preventDefault();
    // Autofill or programmatic form population need not emit input/change events.
    markEdited();
    clearErrors();
    const result = validateScorecardEntry(formValues(scorecard), { today: localDate(), id: makeId() });
    if (!result.ok) {
      Object.entries(result.errors).forEach(([name, message]) => {
        const field = scorecard.elements.namedItem(name);
        field?.setAttribute('aria-invalid', 'true'); field?.setCustomValidity?.(message);
      });
      status(Object.values(result.errors).join(' '));
      scorecard.elements.namedItem(Object.keys(result.errors)[0])?.focus();
      return;
    }
    if (state.mode === 'saved') readSaved();
    const fingerprint = JSON.stringify({ ...result.entry, id: undefined });
    const submission = { id: result.entry.id, fingerprint, version: guard.editVersion, lifecycle };
    const matches = (other) => other?.fingerprint === fingerprint && other.version === guard.editVersion;
    if (matches(guard.lastSubmission) || matches(guard.pendingSubmission)) { renderScorecard(); status('This unchanged entry is already recorded. Edit a field for a new entry.'); return; }
    guard.pendingSubmission = submission;
    locked(() => {
      // Re-read inside the mutation lock so another page's clear cannot restore stale entries.
      if (state.mode === 'saved') readSaved();
      state.entries = appendScorecardEntry(state.entries, result.entry);
      if (state.mode === 'saved') {
        try { win.localStorage.setItem(SCORECARD_KEY, serializeScorecard(state.entries)); }
        catch { state.mode = 'blocked'; }
      }
      guard.lastSubmission = submission;
      if (guard.pendingSubmission === submission) guard.pendingSubmission = null;
      renderScorecard(); status(`Recorded ${result.entry.successes} made / ${result.entry.attempts} attempted. Keeping the latest ${SCORECARD_MAX} entries.`);
    }).catch(() => {
      if (!active) return;
      // A failed browser lock cannot silently claim a save. Preserve a local memory entry.
      state.mode = 'blocked'; state.entries = appendScorecardEntry(state.entries, result.entry);
      guard.lastSubmission = submission; if (guard.pendingSubmission === submission) guard.pendingSubmission = null;
      renderScorecard(); status('Recorded for this visit.');
    });
  });

  on(one('[data-v2-use-plan]'), 'click', () => {
    if (!currentPlan || !scorecard) return;
    const { goal, space, partner } = currentPlan.options;
    setFields(scorecard, { goal, space, partner }); markEdited();
    status('Using this plan’s goal, space, and partner setting. Your date, counts, and notes are unchanged.');
    scorecard.elements.namedItem('attempts')?.focus();
  });
  on(clearButton, 'click', () => {
    if (confirmation) { confirmation.hidden = false; clearYes?.focus(); }
  });
  on(clearCancel, 'click', () => { if (confirmation) confirmation.hidden = true; clearButton?.focus(); });
  on(clearYes, 'click', () => {
    if (!confirmation || confirmation.hidden) return;
    confirmation.hidden = true;
    locked(() => {
      let removed = true;
      try { win.localStorage.removeItem(SCORECARD_KEY); state.mode = 'saved'; }
      catch { removed = false; state.mode = 'blocked'; }
      state.entries = []; invalidateSubmission(); guard.pendingSubmission = null;
      renderScorecard();
      status(removed ? 'Cleared this scorecard’s saved entries and visit counts.' : 'Cleared the visit counts. Browser storage could not be cleared; saved data may remain.');
      clearButton?.focus();
    }).catch(() => {
      if (!active) return;
      state.entries = []; state.mode = 'blocked'; invalidateSubmission(); guard.pendingSubmission = null;
      renderScorecard(); status('Cleared the visit counts. Browser storage could not be cleared; saved data may remain.'); clearButton?.focus();
    });
  });

  const refresh = (message = '') => {
    if (state.mode === 'saved') readSaved();
    if (dateField) dateField.max = localDate();
    renderScorecard(); status(message);
  };
  on(win, 'pageshow', (event) => {
    if (event.persisted) plannerFocusArmed = false;
    refresh();
  });
  on(win, 'storage', (event) => {
    if (event.key !== SCORECARD_KEY && event.key !== null) return;
    if (event.newValue === null) {
      state.entries = []; invalidateSubmission(); guard.pendingSubmission = null;
      renderScorecard(); status('This scorecard was cleared in another page.');
    } else if (state.mode === 'saved') refresh('This scorecard changed in another page.');
  });

  on(one('[data-v2-export]'), 'click', () => {
    if (state.mode === 'saved') readSaved();
    try {
      const url = win.URL.createObjectURL(new win.Blob([exportScorecard(state.entries)], { type: 'application/json;charset=utf-8' }));
      urls.add(url);
      const download = element('a'); download.href = url; download.download = `pointcast-pickleball-scorecard-${localDate()}.json`;
      doc.body.append(download); download.click(); download.remove();
      const timer = win.setTimeout(() => { win.URL.revokeObjectURL(url); urls.delete(url); revokeTimers.delete(timer); }, 1000);
      revokeTimers.add(timer);
      status(`Export prepared with ${state.entries.length} self-reported ${state.entries.length === 1 ? 'entry' : 'entries'}.`);
    } catch { status('The download could not be prepared in this browser. Your visible counts are still available.'); }
  });

  all('[data-v2-enhanced-only]').forEach((node) => { node.hidden = false; });
  const focusPlannerIfIdle = () => {
    const target = doc.activeElement;
    const nativeFragmentTarget = one('#pb-v2-planner');
    if (plannerFocusArmed && win.location.hash === '#pb-v2-planner' && (!target || target === doc.body || target === doc.documentElement || target === nativeFragmentTarget)) planner?.elements.namedItem('goal')?.focus({ preventScroll: true });
  };
  const deferPlannerFocus = (callback) => {
    const timer = win.setTimeout(() => {
      focusTimers.delete(timer);
      if (active && plannerFocusArmed) callback();
    }, 0);
    focusTimers.add(timer);
  };
  const settlePlannerFocus = () => {
    if (!plannerFocusArmed || focusTimers.size) return;
    // Native initial-fragment focus can run after module evaluation. Settle after load, without overriding another focused control.
    deferPlannerFocus(() => deferPlannerFocus(() => { focusPlannerIfIdle(); plannerFocusArmed = false; }));
  };
  on(doc, 'pointerdown', () => { plannerFocusArmed = false; });
  on(doc, 'keydown', () => { plannerFocusArmed = false; });
  on(win, 'load', settlePlannerFocus);
  focusPlannerIfIdle();
  if (doc.readyState === 'complete') settlePlannerFocus();
  renderScorecard(); status();
  const unmount = () => {
    if (!active) return;
    active = false;
    if (guard.pendingSubmission?.lifecycle === lifecycle) guard.pendingSubmission = null;
    listeners.forEach((remove) => remove());
    revokeTimers.forEach((timer) => win.clearTimeout(timer));
    focusTimers.forEach((timer) => win.clearTimeout(timer));
    urls.forEach((url) => win.URL.revokeObjectURL(url));
    all('[data-v2-enhanced-only]').forEach((node) => { node.hidden = true; });
    mounted.delete(home);
  };
  mounted.set(home, unmount);
  return unmount;
}
