import { chooseAndSaveHomeDeck } from './home-visit-deck.mjs';

// A mounted window keeps its reading view until the reader asks for another.
const initializedWindows = new WeakMap();
const FOCUSABLE = 'a, button, input, select, textarea, [tabindex], [contenteditable="true"]';

function availableStorage(window, options) {
  try {
    if (Object.prototype.hasOwnProperty.call(options, 'storage')) return options.storage ?? null;
    return window?.localStorage ?? null;
  } catch {
    return null;
  }
}

function entropySample(window, injected) {
  if (typeof injected === 'number') return injected;
  if (typeof injected === 'function') {
    try { return injected(); } catch { /* Use the ordinary browser fallback. */ }
  }
  try {
    if (typeof window?.crypto?.getRandomValues === 'function') {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0] / 0x100000000;
    }
  } catch { /* Some browsing modes do not expose usable crypto. */ }
  try {
    const value = window?.Math?.random();
    if (Number.isFinite(value) && value >= 0 && value < 1) return value;
  } catch { /* A deterministic usable view is the last fallback. */ }
  return 0;
}

/**
 * Enhance the server's readable default once. Choices affect only this
 * section: social metadata, URLs, and the rest of the page remain untouched.
 * Omit previousId on a fresh visit so persisted history can avoid a repeat.
 */
export function initializeHomeVisitWindow(root, options = {}) {
  if (!root || typeof root.querySelectorAll !== 'function' || typeof root.setAttribute !== 'function') return null;
  const existing = initializedWindows.get(root);
  if (existing) return existing;
  options ??= {};

  const views = [...root.querySelectorAll('[data-home-visit-view]')];
  const button = root.querySelector('[data-home-visit-next]');
  const status = root.querySelector('[data-home-visit-status]');
  if (views.length < 2 || !button || !status) return null;

  const ids = views.map((view) => view.getAttribute('data-view-id'));
  const window = root.ownerDocument?.defaultView;
  const storage = availableStorage(window, options);
  const firstChoice = chooseAndSaveHomeDeck({ ids, storage, entropy: entropySample(window, options.entropy) });
  if (!firstChoice) return null;

  // Inactive server-rendered views use tabindex=-1 as their fallback guard.
  // Restore natural focusability when they become the reader's active view.
  const tabStops = views.map((view) => [...view.querySelectorAll(FOCUSABLE)].map((element) => {
    const authored = element.getAttribute('tabindex');
    return { element, activeTabIndex: view.getAttribute('data-active') !== 'true' && authored === '-1' ? null : authored };
  }));
  let currentId = firstChoice.id;

  function activate(choice, announce) {
    views.forEach((view, index) => {
      const active = index === choice.index;
      view.setAttribute('data-active', String(active));
      view.setAttribute('aria-hidden', String(!active));
      if (active) view.removeAttribute('inert');
      else view.setAttribute('inert', '');
      tabStops[index].forEach(({ element, activeTabIndex }) => {
        if (!active) element.setAttribute('tabindex', '-1');
        else if (activeTabIndex === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', activeTabIndex);
      });
    });
    currentId = choice.id;
    root.setAttribute('data-view', currentId);
    root.setAttribute('data-ready', 'true');
    if (announce) {
      const title = views[choice.index].getAttribute('data-view-title') || currentId;
      status.textContent = 'Now showing: ' + title + '.';
    }
  }

  const controller = {
    get currentId() { return currentId; },
    shuffle() {
      const choice = chooseAndSaveHomeDeck({
        ids,
        storage,
        previousId: currentId,
        entropy: entropySample(window, options.entropy),
      });
      if (!choice) return null;
      activate(choice, true);
      return currentId;
    },
  };
  activate(firstChoice, false);
  button.addEventListener('click', () => controller.shuffle());
  button.removeAttribute('hidden');
  initializedWindows.set(root, controller);
  return controller;
}
