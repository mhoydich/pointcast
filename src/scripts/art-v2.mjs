import { matchesWork, normalizeView, stepIndex } from '../lib/art-v2.mjs';

/** Enhance the server-rendered collection without requiring a browser framework. */
export function initArtGallery(root) {
  if (!root) return () => {};
  const dialog = root.querySelector('[data-viewer]');
  const rawData = root.querySelector('[data-gallery-data]');
  if (!dialog || !rawData || typeof dialog.showModal !== 'function') return () => {};

  let manifest;
  try { manifest = JSON.parse(rawData.textContent || '{}'); }
  catch { return () => {}; }
  const works = Array.isArray(manifest.works) ? manifest.works : [];
  const cards = new Map([...root.querySelectorAll('[data-work-id]')].map((card) => [card.dataset.workId, card]));
  const controller = new AbortController();
  const on = (element, event, handler) => element?.addEventListener(event, handler, { signal: controller.signal });
  const search = root.querySelector('[data-search]');
  const categoryButtons = [...root.querySelectorAll('[data-category]')];
  const viewButtons = [...root.querySelectorAll('[data-view-control]')];
  const resultCount = root.querySelector('[data-result-count]');
  const filterStatus = root.querySelector('[data-filter-status]');
  const viewerStatus = root.querySelector('[data-viewer-status]');
  const imageStage = root.querySelector('[data-viewer-images]');
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const close = root.querySelector('[data-close]');
  let category = 'all';
  let query = '';
  let view = 'paired';
  let visibleWorks = works;
  let activeId = null;
  let opener = null;
  let searchTimer;
  let backdropPointerDown = false;

  const el = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };
  const textAt = (selector, content) => { const element = root.querySelector(selector); if (element) element.textContent = content; };
  const activeWork = () => visibleWorks.find((work) => work.id === activeId);
  const workNumber = (work) => String(work.number ?? works.indexOf(work) + 1).padStart(2, '0');
  const displayTitle = (work) => work.v2?.title || work.title;
  const viewLabel = () => view === 'v2' ? 'V2' : view;

  function imageFigure(work, image, kind) {
    if (!image?.asset) {
      return el('p', `art-v2-pending art-image-${kind}`, `${kind === 'v2' ? 'The V2 interpretation' : 'The source image'} is not yet exhibited.`);
    }
    const figure = el('figure', `art-image art-image-${kind}`);
    if (image.width) figure.style.setProperty('--art-native-width', `${image.width}px`);
    const img = el('img');
    img.src = image.asset;
    const imageTitle = kind === 'source' ? work.title : displayTitle(work);
    img.alt = `${imageTitle} — ${kind === 'source' ? 'Midjourney source reference' : 'V2 interpretation'}`;
    img.decoding = 'async';
    if (image.width) img.width = image.width;
    if (image.height) img.height = image.height;
    const caption = el('figcaption');
    caption.append(el('span', '', kind === 'source' ? '01 / SOURCE' : '02 / NEW INTERPRETATION'));
    caption.append(el('span', '', kind === 'source' ? 'Midjourney' : image.generator || 'V2'));
    const error = el('p', 'art-image-error', 'This image could not be loaded.');
    error.hidden = true;
    img.addEventListener('error', () => { error.hidden = false; img.hidden = true; }, { once: true, signal: controller.signal });
    figure.append(img, error, caption, el('p', 'art-image-title', imageTitle));
    return figure;
  }

  function promptDetails(prompt, label, note) {
    const details = el('details');
    details.append(el('summary', '', label), el('p', '', prompt || 'No public prompt is recorded.'));
    if (note) details.append(el('p', 'art-source-note', note));
    return details;
  }

  function renderProvenance(work) {
    const source = root.querySelector('[data-viewer-source]');
    const v2 = root.querySelector('[data-viewer-v2]');
    const sourceNodes = [el('h3', '', '01 / Midjourney source')];
    sourceNodes.push(el('p', 'art-source-title', `Source title: ${work.title}`));
    if (work.source.jobUrl || work.source.catalogUrl) {
      const jobLink = el('a', '', work.source.jobUrl ? 'Open the original job ↗' : 'View published source record ↗');
      jobLink.href = work.source.jobUrl || work.source.catalogUrl;
      jobLink.target = '_blank';
      jobLink.rel = 'noopener noreferrer';
      sourceNodes.push(jobLink);
    }
    if (work.source.generationDate) {
      const date = new Date(work.source.generationDate);
      const time = el('time', '', Number.isNaN(date.getTime()) ? work.source.generationDate : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date));
      time.dateTime = work.source.generationDate;
      const record = el('p');
      record.append('Source generation date: ', time);
      sourceNodes.push(record);
    }
    if (work.source.attribution) sourceNodes.push(el('p', '', work.source.attribution));
    if (work.source.referenceRole) sourceNodes.push(el('p', '', work.source.referenceRole));
    sourceNodes.push(el('p', '', `Rights: ${work.source.rightsStatus || 'Review pending'}`));
    sourceNodes.push(promptDetails(work.source.prompt, 'Source prompt fragment', 'The original complete Midjourney prompt is unavailable in the published record.'));
    if (work.source.sha256) {
      const digest = el('details');
      digest.append(el('summary', '', 'Source reference SHA-256'), el('p', '', work.source.sha256));
      sourceNodes.push(digest);
    }
    source?.replaceChildren(...sourceNodes);
    const v2Nodes = [el('h3', '', '02 / V2 interpretation')];
    if (work.v2?.title) v2Nodes.push(el('p', 'art-v2-title', work.v2.title));
    if (work.v2?.caption) v2Nodes.push(el('p', 'art-v2-caption', work.v2.caption));
    if (work.v2?.generator) v2Nodes.push(el('p', '', `Generator: ${work.v2.generator}`));
    if (work.v2?.generatedAt) {
      const date = new Date(work.v2.generatedAt);
      const time = el('time', '', Number.isNaN(date.getTime()) ? work.v2.generatedAt : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(date));
      time.dateTime = work.v2.generatedAt;
      const record = el('p');
      record.append('Generated ', time);
      v2Nodes.push(record);
    }
    v2Nodes.push(promptDetails(work.v2?.prompt, 'Read the V2 prompt'));
    v2?.replaceChildren(...v2Nodes);
  }

  function renderViewer() {
    const work = activeWork();
    if (!work) return;
    const index = visibleWorks.indexOf(work);
    textAt('[data-viewer-title]', displayTitle(work));
    textAt('[data-viewer-source-title]', `Source: ${work.title}`);
    textAt('[data-viewer-category]', `${workNumber(work)} / ${work.category}`);
    textAt('[data-viewer-counter]', `${String(index + 1).padStart(2, '0')} / ${String(visibleWorks.length).padStart(2, '0')} IN THIS VIEW`);
    imageStage.replaceChildren(imageFigure(work, work.source, 'source'), imageFigure(work, work.v2, 'v2'));
    renderProvenance(work);
    previous.disabled = visibleWorks.length < 2;
    next.disabled = visibleWorks.length < 2;
    previous.setAttribute('aria-label', `Previous artwork${visibleWorks.length > 1 ? `: ${displayTitle(visibleWorks[stepIndex(index, -1, visibleWorks.length)])}` : ''}`);
    next.setAttribute('aria-label', `Next artwork${visibleWorks.length > 1 ? `: ${displayTitle(visibleWorks[stepIndex(index, 1, visibleWorks.length)])}` : ''}`);
    viewerStatus.textContent = `${displayTitle(work)}. Work ${index + 1} of ${visibleWorks.length}. ${viewLabel()} view.`;
  }

  function setView(value) {
    view = normalizeView(value);
    root.dataset.view = view;
    dialog.dataset.view = view;
    viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.viewControl === view)));
    cards.forEach((card) => card.querySelectorAll('img').forEach((image) => {
      image.sizes = view === 'paired'
        ? `(min-width: 1100px) ${card.dataset.featured === 'true' ? '45' : '22'}vw, (min-width: 480px) 45vw, 90vw`
        : '(min-width: 1100px) 45vw, 90vw';
    }));
    resultCount.textContent = `${visibleWorks.length} ${visibleWorks.length === 1 ? 'work' : 'works'} / ${viewLabel()} view`;
    if (dialog.open && activeWork()) viewerStatus.textContent = `${displayTitle(activeWork())}. ${viewLabel()} view.`;
  }

  function applyFilters(announce = true) {
    visibleWorks = works.filter((work) => matchesWork(work, { category, query }));
    const visibleIds = new Set(visibleWorks.map((work) => work.id));
    cards.forEach((card, id) => {
      card.hidden = !visibleIds.has(id);
      card.dataset.featured = String(id === visibleWorks[0]?.id);
    });
    categoryButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    root.querySelector('[data-empty]').hidden = visibleWorks.length !== 0;
    setView(view);
    if (announce) filterStatus.textContent = `${visibleWorks.length} of ${works.length} works shown${category !== 'all' ? ` in ${category}` : ''}${query ? ` for “${query}”` : ''}.`;
    if (dialog.open && !visibleIds.has(activeId)) dialog.close();
  }

  function openWork(id, trigger) {
    if (!visibleWorks.some((work) => work.id === id)) return;
    activeId = id;
    opener = trigger || document.activeElement;
    renderViewer();
    dialog.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('art-dialog-open');
    close.focus({ preventScroll: true });
  }

  function move(direction) {
    if (visibleWorks.length < 2) return;
    const focused = document.activeElement;
    const sourceLinkFocused = focused instanceof Element && Boolean(focused.closest('[data-viewer-source] a'));
    const index = visibleWorks.findIndex((work) => work.id === activeId);
    activeId = visibleWorks[stepIndex(index, direction, visibleWorks.length)].id;
    renderViewer();
    if (focused && !focused.isConnected) {
      const target = sourceLinkFocused ? root.querySelector('[data-viewer-source] a') : null;
      (target || (direction > 0 ? next : previous) || close).focus({ preventScroll: true });
    }
    dialog.scrollTop = 0;
  }

  const outsideDialog = (event) => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  const isEditing = (target) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"], summary'));
  const focusableElements = () => [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.closest('[hidden]') && element.getClientRects().length);

  on(root, 'click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('[data-open-work]') : null;
    if (!link || !root.contains(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openWork(link.dataset.openWork, link);
  });
  on(search, 'input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { query = search.value; applyFilters(); }, 120);
  });
  categoryButtons.forEach((button) => on(button, 'click', () => {
    clearTimeout(searchTimer);
    category = button.dataset.category;
    query = search.value;
    applyFilters();
  }));
  viewButtons.forEach((button) => on(button, 'click', () => setView(button.dataset.viewControl)));
  on(root.querySelector('[data-reset]'), 'click', () => {
    clearTimeout(searchTimer);
    category = 'all'; query = ''; search.value = '';
    applyFilters(); search.focus();
  });
  on(previous, 'click', () => move(-1));
  on(next, 'click', () => move(1));
  on(close, 'click', () => dialog.close());
  on(dialog, 'close', () => {
    document.body.classList.remove('art-dialog-open');
    const target = opener?.isConnected && !opener.closest('[hidden]') ? opener : root.querySelector('[data-work-id]:not([hidden]) [data-open-work]') || search;
    target?.focus({ preventScroll: true });
    activeId = null;
  });
  on(dialog, 'pointerdown', (event) => { backdropPointerDown = event.target === dialog && outsideDialog(event); });
  on(dialog, 'click', (event) => {
    if (event.target === dialog && backdropPointerDown && outsideDialog(event)) dialog.close();
    backdropPointerDown = false;
  });
  on(dialog, 'keydown', (event) => {
    const plainKey = !event.altKey && !event.ctrlKey && !event.metaKey && !event.defaultPrevented;
    if (event.key === 'ArrowRight' && plainKey && !isEditing(event.target)) { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft' && plainKey && !isEditing(event.target)) { event.preventDefault(); move(-1); }
    if (event.key !== 'Tab') return;
    const focusable = focusableElements();
    if (!focusable.length) { event.preventDefault(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });

  root.querySelector('[data-gallery-controls]').hidden = false;
  applyFilters(false);
  return () => {
    clearTimeout(searchTimer);
    if (dialog.open) dialog.close();
    controller.abort();
    document.body.classList.remove('art-dialog-open');
  };
}
