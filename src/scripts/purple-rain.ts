/** Local enhancement for the standalone exhibition. All editorial content is server rendered. */
function initializePurpleRain() {
  const body = document.querySelector('.purple-exhibition');
  if (!body || body.hasAttribute('data-exhibition-initialized')) return;
  body.setAttribute('data-exhibition-initialized', 'true');

  const lensButtons = Array.from(body.querySelectorAll<HTMLButtonElement>('[data-lens-button]'));
  const kindButtons = Array.from(body.querySelectorAll<HTMLButtonElement>('[data-kind-button]'));
  const lensPanels = Array.from(body.querySelectorAll<HTMLElement>('[data-lens-panel]'));
  const imageCards = Array.from(body.querySelectorAll<HTMLElement>('[data-gallery-card]'));
  const timelineEvents = Array.from(body.querySelectorAll<HTMLElement>('[data-timeline-lenses]'));
  const search = body.querySelector<HTMLInputElement>('#gallery-search');
  const galleryStatus = body.querySelector<HTMLElement>('#gallery-status');
  const lensStatus = body.querySelector<HTMLElement>('#lens-status');
  const emptyGallery = body.querySelector<HTMLElement>('#gallery-empty');
  const emptyTimeline = body.querySelector<HTMLElement>('#timeline-empty');
  let currentLens = 'all';
  let currentKind = 'all';
  const lensNames: Record<string, string> = { all: 'All four lenses', fashion: 'Fashion', energy: 'Energy', results: 'Results', time: 'Time' };

  const matchesLens = (value?: string) => currentLens === 'all' || (value || '').split(' ').includes(currentLens);
  function filterGallery() {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of imageCards) {
      const matches = matchesLens(card.dataset.imageLenses)
        && (currentKind === 'all' || card.dataset.imageKind === currentKind)
        && (!query || (card.dataset.imageSearch || '').includes(query));
      card.hidden = !matches;
      if (matches) visible++;
    }
    if (galleryStatus) galleryStatus.textContent = `${visible} of ${imageCards.length} entries · ${lensNames[currentLens]}${query ? ` · Search: ${search?.value.trim()}` : ''}`;
    if (emptyGallery) emptyGallery.hidden = visible > 0;
  }
  function applyLens(lens: string, announce = true) {
    currentLens = lens;
    lensButtons.forEach((button) => {
      const active = button.dataset.lensButton === lens;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    lensPanels.forEach((panel) => { panel.hidden = lens !== 'all' && panel.dataset.lensPanel !== lens; });
    let timelineVisible = 0;
    timelineEvents.forEach((event) => { event.hidden = !matchesLens(event.dataset.timelineLenses); if (!event.hidden) timelineVisible++; });
    if (emptyTimeline) emptyTimeline.hidden = timelineVisible > 0;
    if (lensStatus && announce) lensStatus.textContent = `${lensNames[lens]} selected. Editorial sections, atlas entries, and timeline are filtered.`;
    filterGallery();
  }
  lensButtons.forEach((button) => button.addEventListener('click', () => applyLens(button.dataset.lensButton || 'all')));
  kindButtons.forEach((button) => button.addEventListener('click', () => {
    currentKind = button.dataset.kindButton || 'all';
    kindButtons.forEach((other) => {
      const active = other === button;
      other.setAttribute('aria-pressed', String(active));
      other.classList.toggle('is-active', active);
    });
    filterGallery();
  }));
  search?.addEventListener('input', filterGallery);
  body.querySelectorAll<HTMLAnchorElement>('a[href^="#source-"]').forEach((link) => link.addEventListener('click', () => {
    const sources = body.querySelector<HTMLDetailsElement>('.sources-accordion');
    if (sources) sources.open = true;
  }));
  body.querySelector('#gallery-reset')?.addEventListener('click', () => {
    currentKind = 'all';
    if (search) search.value = '';
    kindButtons.forEach((button) => { const active = button.dataset.kindButton === 'all'; button.setAttribute('aria-pressed', String(active)); button.classList.toggle('is-active', active); });
    applyLens('all');
    search?.focus();
  });

  const stageReadings: Record<string, { title: string; description: string }> = {
    restraint: { title: 'Restraint', description: 'A held pose, a single spotlight, a phrase left open. Attention gathers because the scene gives it room. What do you notice when very little changes?' },
    build: { title: 'Build', description: 'Add a second light, a repeated gesture, another musical layer. The scene starts to accumulate possibilities. Which detail tells you something is about to change?' },
    release: { title: 'Release', description: 'A broad gesture, a wider field of light, a full arrangement. The composition opens outward. What makes the arrival feel earned by what came before?' },
  };
  const stageButtons = Array.from(body.querySelectorAll<HTMLButtonElement>('[data-stage-button]'));
  stageButtons.forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.stageButton || 'restraint';
    const reading = stageReadings[key];
    if (!reading) return;
    const title = body.querySelector('#stage-reading-title');
    const description = body.querySelector('#stage-reading-description');
    const scene = body.querySelector<HTMLElement>('[data-stage-scene]');
    if (title) title.textContent = reading.title;
    if (description) description.textContent = reading.description;
    if (scene) scene.dataset.stageScene = key;
    stageButtons.forEach((other) => { const active = other === button; other.setAttribute('aria-pressed', String(active)); other.classList.toggle('is-active', active); });
  }));

  const dialog = body.querySelector<HTMLDialogElement>('#image-dialog');
  const dialogImage = body.querySelector<HTMLImageElement>('#lightbox-image');
  const imageWrap = body.querySelector<HTMLElement>('#lightbox-image-wrap');
  const closeButton = body.querySelector<HTMLButtonElement>('#lightbox-close');
  const zoomButton = body.querySelector<HTMLButtonElement>('#lightbox-zoom');
  let returnFocus: HTMLAnchorElement | null = null;
  function resetZoom() {
    imageWrap?.classList.remove('is-zoomed');
    if (imageWrap) { imageWrap.scrollTop = 0; imageWrap.scrollLeft = 0; }
    if (zoomButton) { zoomButton.textContent = 'Zoom in'; zoomButton.setAttribute('aria-pressed', 'false'); }
  }
  if (dialog && typeof dialog.showModal === 'function' && dialogImage) {
    body.querySelectorAll<HTMLAnchorElement>('[data-lightbox]').forEach((link) => link.addEventListener('click', (event) => {
      // Preserve native open-in-new-tab behavior and the full-size-image fallback.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const source = link.dataset.imageSrc;
      if (!source) return;
      event.preventDefault();
      returnFocus = link;
      resetZoom();
      dialogImage.src = source;
      dialogImage.alt = link.dataset.imageAlt || '';
      const title = body.querySelector('#lightbox-title');
      const caption = body.querySelector('#lightbox-description');
      const creator = body.querySelector('#lightbox-creator');
      const sourceLink = body.querySelector<HTMLAnchorElement>('#lightbox-source');
      const licenseLink = body.querySelector<HTMLAnchorElement>('#lightbox-license');
      const licenseText = body.querySelector<HTMLElement>('#lightbox-license-text');
      if (title) title.textContent = link.dataset.imageTitle || '';
      if (caption) caption.textContent = link.dataset.imageCaption || '';
      if (creator) creator.textContent = link.dataset.imageCreator || '';
      if (sourceLink) {
        sourceLink.hidden = !link.dataset.imageSourceUrl;
        if (link.dataset.imageSourceUrl) sourceLink.href = link.dataset.imageSourceUrl;
        else sourceLink.removeAttribute('href');
      }
      if (licenseLink && licenseText) {
        const license = link.dataset.imageLicense || '';
        const licenseUrl = link.dataset.imageLicenseUrl || '';
        licenseLink.hidden = !licenseUrl;
        licenseText.hidden = Boolean(licenseUrl);
        licenseLink.textContent = `${license} ↗`;
        licenseText.textContent = license;
        if (licenseUrl) licenseLink.href = licenseUrl;
        else licenseLink.removeAttribute('href');
      }
      dialog.showModal();
      closeButton?.focus();
    }));
    closeButton?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => { resetZoom(); returnFocus?.focus({ preventScroll: true }); returnFocus = null; });
    zoomButton?.addEventListener('click', () => {
      const zoomed = imageWrap?.classList.toggle('is-zoomed') || false;
      zoomButton.setAttribute('aria-pressed', String(zoomed));
      zoomButton.textContent = zoomed ? 'Fit image' : 'Zoom in';
      if (zoomed) imageWrap?.focus();
    });
  }
  applyLens('all', false);
  document.documentElement.dataset.exhibitionEnhanced = 'true';
}

initializePurpleRain();
document.addEventListener('astro:page-load', initializePurpleRain);
