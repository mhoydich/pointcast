export const HOME_PROJECT_ROTATION_PAUSE_KEY = 'pc:home-project-rotation:paused:v1';
export const HOME_PROJECT_ROTATION_INTERVAL_MS = 10000;

const rotations = new WeakMap();
const browsers = new WeakMap();
const FOCUSABLE = 'a, button, input, select, textarea, [tabindex], [contenteditable="true"]';

function storageFor(window, options) {
  try { return Object.hasOwn(options, 'storage') ? options.storage : window.localStorage; }
  catch { return null; }
}

/** Enhance only this text-card shelf. The art window keeps its own behavior. */
export function initializeHomeProjectRotation(root, options = {}) {
  if (!root?.querySelectorAll) return null;
  if (rotations.has(root)) return rotations.get(root);
  const panels = [...root.querySelectorAll('[data-project-panel]')];
  const controls = root.querySelector('[data-project-controls]');
  const previous = root.querySelector('[data-project-previous]');
  const next = root.querySelector('[data-project-next]');
  const toggle = root.querySelector('[data-project-toggle]');
  const counter = root.querySelector('[data-project-counter]');
  const status = root.querySelector('[data-project-status]');
  const window = root.ownerDocument?.defaultView;
  if (panels.length < 2 || !window || !controls || !previous || !next || !toggle || !counter || !status) return null;
  options ??= {};
  const document = root.ownerDocument;
  const storage = storageFor(window, options);
  let explicitPaused = false;
  try { explicitPaused = storage?.getItem(HOME_PROJECT_ROTATION_PAUSE_KEY) === 'paused'; } catch { /* Manual controls remain available. */ }
  let media;
  try { media = window.matchMedia?.('(prefers-reduced-motion: reduce)'); } catch { /* Missing API keeps the readable fallback. */ }
  let motionStopped = media?.matches ?? false;
  let focusStopped = root.contains(document.activeElement);
  let hovering = false;
  let inView = false;
  let currentIndex = 0;
  let timer = null;
  let pointerAction = null;
  let destroyed = false;
  const listeners = [];
  const tabStops = panels.map((panel) => [...panel.querySelectorAll(FOCUSABLE)].map((element) => {
    const authored = element.getAttribute('tabindex');
    return { element, authored: panel.dataset.active !== 'true' && authored === '-1' ? null : authored };
  }));

  function listen(target, type, listener) {
    target.addEventListener(type, listener);
    listeners.push(() => target.removeEventListener(type, listener));
  }
  function persist() {
    try { storage?.setItem(HOME_PROJECT_ROTATION_PAUSE_KEY, explicitPaused ? 'paused' : 'playing'); } catch { /* Storage is optional. */ }
  }
  const paused = () => explicitPaused || focusStopped || motionStopped || !!media?.matches;
  const canRotate = () => !destroyed && !paused() && !hovering && inView && document.visibilityState === 'visible';
  function cancelTimer() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  }
  function sync() {
    cancelTimer();
    toggle.disabled = !!media?.matches;
    toggle.textContent = media?.matches ? 'Rotation paused' : paused() ? 'Play rotation' : 'Pause rotation';
    root.dataset.rotationState = paused() ? 'paused' : canRotate() ? 'playing' : 'waiting';
    if (canRotate()) timer = window.setTimeout(() => {
      timer = null;
      if (canRotate()) activate(currentIndex + 1, false);
      sync();
    }, HOME_PROJECT_ROTATION_INTERVAL_MS);
  }
  function activate(index, announce) {
    const target = (index + panels.length) % panels.length;
    // Even a programmatic change cannot hide the reader's focused link.
    if (target !== currentIndex && panels[currentIndex].contains(document.activeElement)) {
      focusStopped = true;
      return false;
    }
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === target;
      panel.dataset.active = String(active);
      panel.setAttribute('aria-hidden', String(!active));
      if (active) panel.removeAttribute('inert');
      else panel.setAttribute('inert', '');
      tabStops[panelIndex].forEach(({ element, authored }) => {
        if (!active) element.setAttribute('tabindex', '-1');
        else if (authored === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', authored);
      });
    });
    currentIndex = target;
    counter.textContent = `Set ${target + 1} of ${panels.length}`;
    if (announce) status.textContent = `Showing set ${target + 1} of ${panels.length}: ${panels[target].dataset.panelTitles || ''}.`;
    return true;
  }
  function move(offset) {
    explicitPaused = true;
    persist();
    activate(currentIndex + offset, true);
    sync();
    return currentIndex;
  }
  const controller = {
    get currentIndex() { return currentIndex; },
    get paused() { return paused(); },
    get running() { return timer !== null; },
    previous() { return move(-1); },
    next() { return move(1); },
    pause() { explicitPaused = true; persist(); sync(); },
    play() {
      if (media?.matches) return false;
      explicitPaused = false;
      focusStopped = false;
      motionStopped = false;
      persist();
      sync();
      return true;
    },
    destroy() {
      destroyed = true;
      cancelTimer();
      listeners.forEach((remove) => remove());
      observer?.disconnect();
      controls.hidden = true;
      delete root.dataset.rotationState;
      rotations.delete(root);
    },
  };

  listen(previous, 'click', () => controller.previous());
  listen(next, 'click', () => controller.next());
  // Pointer focus stops rotation before click. Keep the action the reader
  // pressed; keyboard activation uses the label shown after keyboard focus.
  listen(toggle, 'pointerdown', () => { pointerAction = paused() ? 'play' : 'pause'; });
  listen(toggle, 'pointercancel', () => { pointerAction = null; });
  listen(toggle, 'keydown', () => { pointerAction = null; });
  listen(toggle, 'click', () => {
    const action = pointerAction ?? (paused() ? 'play' : 'pause');
    pointerAction = null;
    if (action === 'play') controller.play();
    else controller.pause();
  });
  listen(root, 'pointerenter', (event) => {
    if (!event.pointerType || event.pointerType === 'mouse' || event.pointerType === 'pen') { hovering = true; sync(); }
  });
  listen(root, 'pointerleave', () => { hovering = false; sync(); });
  listen(root, 'focusin', () => { focusStopped = true; sync(); });
  listen(document, 'visibilitychange', sync);
  if (media?.addEventListener) listen(media, 'change', () => {
    // Turning reduced motion off never silently restarts a stopped shelf.
    motionStopped = true;
    sync();
  });
  else if (media?.addListener) {
    const change = () => { motionStopped = true; sync(); };
    media.addListener(change);
    listeners.push(() => media.removeListener(change));
  }
  let observer;
  try {
    if (window.IntersectionObserver) {
      observer = new window.IntersectionObserver((entries) => {
        const entry = entries.find((entry) => entry.target === root);
        if (entry) { inView = entry.isIntersecting && entry.intersectionRatio >= 0.1; sync(); }
      }, { threshold: [0, 0.1] });
      observer.observe(root);
    }
  } catch { /* Without visibility evidence, keep automatic rotation stopped. */ }
  activate(0, false);
  controls.hidden = false;
  sync();
  rotations.set(root, controller);
  return controller;
}

const searchText = (value) => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

/** Filtering is an enhancement; the complete grouped catalog is authored HTML. */
export function initializeLatestProjectBrowser(root) {
  if (!root?.querySelectorAll) return null;
  if (browsers.has(root)) return browsers.get(root);
  const form = root.querySelector('[data-latest-filters]');
  const search = root.querySelector('[data-latest-search]');
  const group = root.querySelector('[data-latest-group-filter]');
  const clear = root.querySelector('[data-latest-clear]');
  const count = root.querySelector('[data-latest-count]');
  const empty = root.querySelector('[data-latest-empty]');
  if (!form || !search || !group || !clear || !count || !empty) return null;
  const entries = [...root.querySelectorAll('[data-latest-entry]')];
  if (entries.length === 0) return null;
  const groups = [...root.querySelectorAll('[data-latest-group]')];
  const haystacks = entries.map((entry) => searchText(entry.dataset.latestText || entry.textContent));
  function filter() {
    const terms = searchText(search.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    entries.forEach((entry, index) => {
      const match = (!group.value || entry.dataset.projectGroup === group.value) && terms.every((term) => haystacks[index].includes(term));
      entry.hidden = !match;
      if (match) visible++;
    });
    groups.forEach((section) => { section.hidden = ![...section.querySelectorAll('[data-latest-entry]')].some((entry) => !entry.hidden); });
    count.textContent = `${visible} of ${entries.length} published ${entries.length === 1 ? 'page or project' : 'pages and projects'}.`;
    empty.hidden = visible !== 0;
    return visible;
  }
  const submit = (event) => { event.preventDefault(); filter(); };
  const reset = () => { search.value = ''; group.value = ''; filter(); };
  search.addEventListener('input', filter);
  group.addEventListener('change', filter);
  clear.addEventListener('click', reset);
  form.addEventListener('submit', submit);
  const controller = { filter, destroy() {
    search.removeEventListener('input', filter);
    group.removeEventListener('change', filter);
    clear.removeEventListener('click', reset);
    form.removeEventListener('submit', submit);
    browsers.delete(root);
  } };
  filter();
  form.hidden = false;
  browsers.set(root, controller);
  return controller;
}
