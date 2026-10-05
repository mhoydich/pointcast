const initializedRoots = new WeakSet();
const rootCleanups = new WeakMap();

const asText = (value) => typeof value === 'string' ? value : '';
const entriesById = (entries) => new Map(
  (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && typeof entry.id === 'string' && entry.id)
    .map((entry) => [entry.id, entry]),
);

/** Enhance the already-readable Canterbury page; no account or saved state. */
export function initCanterbury(root, data = {}) {
  if (!root?.querySelector || !root?.ownerDocument) return () => {};
  if (initializedRoots.has(root)) return rootCleanups.get(root);
  data = data && typeof data === 'object' ? data : {};

  const document = root.ownerDocument;
  const window = document.defaultView;
  const tales = entriesById(data.tales);
  const routes = entriesById(data.routes);
  const connections = entriesById(data.connections);
  const journey = entriesById(data.journey);
  const listeners = [];
  const status = root.querySelector('[data-status]');
  let activeRoute = null;
  let activeInvoker = null;

  function listen(element, type, handler) {
    if (!element) return;
    element.addEventListener(type, handler);
    listeners.push(() => element.removeEventListener(type, handler));
  }

  function setText(selector, value) {
    const element = root.querySelector(selector);
    if (element) element.textContent = asText(value);
  }

  function announce(message) {
    if (status) status.textContent = message;
  }

  function announceSelection(prefix, value) {
    const label = asText(value);
    announce(`${prefix}: ${label}${/[.!?]$/.test(label) ? '' : '.'}`);
  }

  function focus(element) {
    if (!element?.isConnected) return;
    try { element.focus({ preventScroll: true }); }
    catch { element.focus(); }
  }

  function taleLinks(container, ids) {
    if (!container) return;
    const fragment = document.createDocumentFragment();
    for (const id of Array.isArray(ids) ? ids : []) {
      const tale = tales.get(id);
      if (!tale) continue;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#tale-${tale.id}`;
      link.textContent = asText(tale.title);
      item.append(link);
      fragment.append(item);
    }
    container.replaceChildren(fragment);
  }

  const routeForm = root.querySelector('form[data-routes]');
  const routeInputs = [...(routeForm?.querySelectorAll('input[name="reading-route"]') ?? [])];
  function selectRoute(id, shouldAnnounce = true) {
    const route = routes.get(id);
    if (!route) {
      for (const input of routeInputs) input.checked = input.value === activeRoute;
      return;
    }
    activeRoute = id;
    for (const input of routeInputs) input.checked = input.value === id;
    setText('[data-route-title]', route.label);
    setText('[data-route-description]', route.description);
    taleLinks(root.querySelector('[data-route-list]'), route.tales);
    if (shouldAnnounce) announceSelection('Reading route', route.label);
  }
  listen(routeForm, 'change', (event) => {
    const input = event.target;
    if (input?.matches?.('input[name="reading-route"]')) selectRoute(input.value);
  });
  const firstRoute = routeInputs.find((input) => input.checked && routes.has(input.value))
    ?? routeInputs.find((input) => routes.has(input.value));
  if (firstRoute) selectRoute(firstRoute.value, false);

  const connectionButtons = [...root.querySelectorAll('[data-connection]')];
  function selectConnection(id, shouldAnnounce = true) {
    const connection = connections.get(id);
    if (!connection) return;
    for (const button of connectionButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.connection === id));
    }
    setText('[data-connection-title]', connection.title);
    setText('[data-connection-body]', connection.body);
    taleLinks(root.querySelector('[data-connection-list]'), connection.tales);
    const connected = new Set(Array.isArray(connection.tales) ? connection.tales : []);
    for (const article of root.querySelectorAll('[data-tale]')) {
      article.dataset.connected = String(connected.has(article.dataset.tale));
    }
    if (shouldAnnounce) announceSelection('Story connection', connection.title);
  }
  for (const button of connectionButtons) {
    listen(button, 'click', () => selectConnection(button.dataset.connection));
  }
  const firstConnection = connectionButtons.find((button) => button.getAttribute('aria-pressed') === 'true' && connections.has(button.dataset.connection))
    ?? connectionButtons.find((button) => connections.has(button.dataset.connection));
  if (firstConnection) selectConnection(firstConnection.dataset.connection, false);

  const journeyButtons = [...root.querySelectorAll('[data-journey]')];
  function selectJourney(id, shouldAnnounce = true) {
    const stop = journey.get(id);
    if (!stop) return;
    for (const button of journeyButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.journey === id));
    }
    setText('[data-journey-title]', stop.title);
    setText('[data-journey-body]', stop.body);
    if (shouldAnnounce) announceSelection('Journey', stop.title);
  }
  for (const button of journeyButtons) {
    listen(button, 'click', () => selectJourney(button.dataset.journey));
  }
  const firstStop = journeyButtons.find((button) => button.getAttribute('aria-pressed') === 'true' && journey.has(button.dataset.journey))
    ?? journeyButtons.find((button) => journey.has(button.dataset.journey));
  if (firstStop) selectJourney(firstStop.dataset.journey, false);

  const languages = new Set(['middle', 'gloss', 'both']);
  const languageButtons = [...root.querySelectorAll('[data-language]')]
    .filter((element) => element.tagName === 'BUTTON');
  function selectLanguage(language, shouldAnnounce = true) {
    if (!languages.has(language)) return;
    root.dataset.language = language;
    for (const button of languageButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    }
    const label = { middle: 'Middle English', gloss: 'Accessible gloss', both: 'Middle English and accessible gloss' }[language];
    if (shouldAnnounce) announce(`${label} selected.`);
  }
  for (const button of languageButtons) {
    listen(button, 'click', () => selectLanguage(button.dataset.language));
  }
  selectLanguage(languages.has(root.dataset.language) ? root.dataset.language : 'both', false);

  const dialog = root.querySelector('[data-pilgrim-dialog]');
  const dialogBody = dialog?.querySelector('[data-dialog-body]');
  const closeButton = dialog?.querySelector('[data-dialog-close]');
  function closeDialog(restoreFocus = true) {
    const invoker = activeInvoker;
    activeInvoker = null;
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    if (restoreFocus) focus(invoker);
  }

  function renderPilgrim(tale) {
    const fragment = document.createDocumentFragment();
    if (asText(tale.portrait)) {
      const portrait = document.createElement('img');
      portrait.className = 'pilgrim-dialog-portrait';
      portrait.src = tale.portrait;
      portrait.width = 640;
      portrait.height = 640;
      if (/\/portrait-[a-z0-9-]+\.webp$/i.test(tale.portrait)) {
        const base = tale.portrait.slice(0, -5);
        portrait.srcset = `${base}-160.webp 160w, ${base}-320.webp 320w, ${tale.portrait} 640w`;
        portrait.sizes = '(max-width: 760px) 160px, 300px';
      }
      portrait.alt = `Original interpretive portrait of ${asText(tale.pilgrim)}, imagined for this reading experience.`;
      portrait.decoding = 'async';
      fragment.append(portrait);
    }
    const copy = document.createElement('div');
    copy.className = 'pilgrim-dialog-copy';
    const kicker = document.createElement('p');
    kicker.className = 'ct-kicker';
    kicker.textContent = 'Meet the storyteller';
    copy.append(kicker);
    const title = document.createElement('h2');
    title.id = 'pilgrim-title';
    title.textContent = asText(tale.pilgrim);
    copy.append(title);
    const voice = document.createElement('p');
    voice.className = 'pilgrim-dialog-voice';
    voice.textContent = asText(tale.voice);
    copy.append(voice);
    const taleTitle = document.createElement('h3');
    taleTitle.textContent = asText(tale.title);
    copy.append(taleTitle);
    const premise = document.createElement('p');
    premise.className = 'pilgrim-dialog-premise';
    premise.textContent = asText(tale.premise);
    copy.append(premise);
    if (asText(tale.note)) {
      const note = document.createElement('p');
      note.className = 'pilgrim-dialog-note ct-content-note';
      const label = document.createElement('strong');
      label.textContent = 'Content note: ';
      note.append(label, document.createTextNode(tale.note));
      copy.append(note);
    }
    if (asText(tale.question)) {
      const question = document.createElement('p');
      question.className = 'pilgrim-dialog-question';
      question.textContent = tale.question;
      copy.append(question);
    }
    const read = document.createElement('a');
    read.className = 'pilgrim-dialog-read';
    read.href = `#tale-${tale.id}`;
    read.dataset.dialogRead = tale.id;
    read.textContent = 'Read the tale';
    copy.append(read);
    fragment.append(copy);
    dialogBody.replaceChildren(fragment);
    dialog.setAttribute('aria-labelledby', 'pilgrim-title');
  }

  for (const link of root.querySelectorAll('a[data-pilgrim]')) {
    listen(link, 'click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const tale = tales.get(link.dataset.pilgrim);
      if (!tale || !dialogBody || typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') return;
      try {
        if (dialog.open) closeDialog(false);
        renderPilgrim(tale);
        dialog.showModal();
      } catch {
        // The original anchor still works if the browser cannot show a dialog.
        return;
      }
      event.preventDefault();
      activeInvoker = link;
      focus(closeButton);
    });
  }

  listen(closeButton, 'click', () => closeDialog());
  listen(dialog, 'cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  listen(dialog, 'close', () => {
    // A queued close event from an earlier dialog must not interrupt a new one.
    if (!dialog.open && activeInvoker) closeDialog();
  });
  listen(dialog, 'keydown', (event) => {
    if (event.key !== 'Tab' || !dialog.open) return;
    const focusable = [...dialog.querySelectorAll('a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable="true"]')]
      .filter((element) => {
        if (element.tabIndex < 0 || element.matches(':disabled') || element.matches('input[type="hidden"]')) return false;
        for (let ancestor = element; ancestor && ancestor !== dialog; ancestor = ancestor.parentElement) {
          if (ancestor.matches('[hidden], [inert], [aria-hidden="true"]')) return false;
          const style = window?.getComputedStyle(ancestor);
          if (style?.display === 'none' || style?.visibility === 'hidden') return false;
        }
        return true;
      });
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if ((event.shiftKey && document.activeElement === first)
      || (!event.shiftKey && document.activeElement === last)
      || !focusable.includes(document.activeElement)) {
      event.preventDefault();
      focus(event.shiftKey ? last : first);
    }
  });
  listen(dialog, 'click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
  });
  listen(dialogBody, 'click', (event) => {
    const link = event.target?.closest?.('a[data-dialog-read]');
    if (!link || !dialogBody.contains(link) || event.button !== 0
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = [...root.querySelectorAll('[data-tale]')]
      .find((article) => article.dataset.tale === link.dataset.dialogRead);
    if (!target) return;
    event.preventDefault();
    closeDialog(false);
    const reduceMotion = window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    focus(target);
  });

  root.dataset.enhanced = 'true';
  root.classList.add('is-enhanced');
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    closeDialog();
    for (const remove of listeners) remove();
    initializedRoots.delete(root);
    rootCleanups.delete(root);
    delete root.dataset.enhanced;
    root.classList.remove('is-enhanced');
    // Both texts are the readable, unenhanced state.
    delete root.dataset.language;
  };
  initializedRoots.add(root);
  rootCleanups.set(root, cleanup);
  return cleanup;
}
