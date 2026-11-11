(() => {
  'use strict';

  const dataNode = document.getElementById('worlds-data');
  const gallery = document.getElementById('worlds-gallery');
  const dialog = document.getElementById('worlds-dialog');
  if (!dataNode || !gallery || !dialog || gallery.dataset.initialized) return;
  let data;
  try { data = JSON.parse(dataNode.textContent || '{}'); } catch { return; }
  if (!Array.isArray(data.images) || !data.images.length) return;
  gallery.dataset.initialized = 'true';

  const images = data.images;
  const byId = new Map(images.map((image) => [image.id, image]));
  const groups = new Map();
  images.forEach((image) => {
    if (!groups.has(image.groupId)) groups.set(image.groupId, []);
    groups.get(image.groupId).push(image);
  });
  groups.forEach((group) => group.sort((a, b) => a.variant - b.variant));
  const get = (id) => document.getElementById(`worlds-${id}`);
  const search = get('search');
  const category = get('category');
  const brand = get('brand');
  const count = get('count');
  const more = get('more');
  const fullImage = get('full-image');
  const close = get('close');
  const previous = get('prev');
  const next = get('next');
  const title = get('image-title');
  const meta = get('image-meta');
  const copy = get('image-copy');
  const variants = get('variants');
  const openImage = get('open-image');
  const labels = {
    coastal: 'Coastal world', scene: 'South Bay scene',
    'ad-selected': 'Selected ad representative', 'ad-alternate': 'Alternate ad variation',
  };
  const pageSize = 24;
  let filtered = images;
  let visible = pageSize;
  let sequence = images;
  let current = null;
  let opener = null;
  let closing = false;
  let returnHash = '';
  const historyOwner = `saturday-worlds-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const searchText = new Map(images.map((image) => [image.id,
    [image.title, image.brand, image.chapter, image.headline, image.shortCopy, image.groupId,
      image.id, labels[image.category]].filter(Boolean).join(' ').toLocaleLowerCase(),
  ]));

  function makeCard(image) {
    const card = element('button', 'worlds-card');
    card.type = 'button';
    card.dataset.openImage = image.id;
    card.setAttribute('aria-label', `Open ${image.title}, variation ${image.variant}. ${labels[image.category]}.`);
    const picture = element('img', 'worlds-card-image');
    picture.src = image.thumb;
    picture.alt = '';
    picture.width = image.thumbWidth || Math.min(420, image.width);
    picture.height = image.thumbHeight || Math.round(picture.width * image.height / image.width);
    picture.loading = 'lazy';
    picture.decoding = 'async';
    const caption = element('span', 'worlds-card-caption');
    caption.append(element('span', 'worlds-card-title', image.title));
    caption.append(element('span', 'worlds-card-meta', `${labels[image.category]} · ${image.variant}/4`));
    card.append(picture, caption);
    return card;
  }

  function renderGallery({ append = false } = {}) {
    const start = append ? gallery.children.length : 0;
    const fragment = document.createDocumentFragment();
    filtered.slice(start, visible).forEach((image) => fragment.append(makeCard(image)));
    if (!append) gallery.replaceChildren();
    gallery.append(fragment);
    if (!filtered.length) {
      const empty = element('p', 'worlds-empty', 'No worlds found. Try another word or reset the filters.');
      gallery.append(empty);
    }
    const shown = Math.min(visible, filtered.length);
    if (count) count.textContent = `Showing ${shown} of ${filtered.length} images${filtered.length !== images.length ? ` · ${images.length} in the complete archive` : ''}.`;
    if (more) {
      more.hidden = shown >= filtered.length;
      more.textContent = `Show ${Math.min(pageSize, filtered.length - shown)} more`;
    }
  }

  function filterGallery() {
    const terms = (search?.value || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    filtered = images.filter((image) =>
      (!category?.value || category.value === 'all' || category.value === image.category) &&
      (!brand?.value || brand.value === 'all' || brand.value === image.brand) &&
      terms.every((term) => searchText.get(image.id).includes(term)),
    );
    visible = pageSize;
    renderGallery();
  }
  search?.addEventListener('input', filterGallery);
  category?.addEventListener('change', filterGallery);
  brand?.addEventListener('change', filterGallery);
  get('reset')?.addEventListener('click', () => {
    if (search) search.value = '';
    if (category) category.value = 'all';
    if (brand) brand.value = 'all';
    filterGallery();
    search?.focus();
  });
  more?.addEventListener('click', () => {
    const firstNew = gallery.children.length;
    visible += pageSize;
    renderGallery({ append: true });
    // Keyboard users continue at the newly revealed images, even on the final page.
    gallery.children[firstNew]?.focus({ preventScroll: true });
  });

  function imageFromHash() {
    if (!location.hash.startsWith('#image=')) return null;
    try { return byId.get(decodeURIComponent(location.hash.slice(7))) || null; } catch { return null; }
  }

  function show(image) {
    if (!image || closing) return;
    current = image;
    fullImage.src = image.src;
    fullImage.width = image.width;
    fullImage.height = image.height;
    fullImage.alt = `${image.title}. Speculative AI-generated artwork, variation ${image.variant} of 4.`;
    title.textContent = image.title;
    meta.textContent = `${image.brand} · ${labels[image.category]} · Variation ${image.variant} of 4`;
    copy.replaceChildren();
    if (image.headline) copy.append(element('strong', 'worlds-ad-headline', image.headline));
    if (image.shortCopy) copy.append(element('p', 'worlds-ad-copy', image.shortCopy));
    if (image.category.startsWith('ad-')) {
      copy.append(element('p', 'worlds-ad-note', 'Speculative campaign concept. The caption is the intended copy; lettering inside AI artwork may differ.'));
    }
    copy.hidden = !copy.childNodes.length;
    openImage.href = image.src;
    openImage.setAttribute('aria-label', `Open optimized image: ${image.title}, variation ${image.variant}`);
    variants.replaceChildren();
    (groups.get(image.groupId) || []).forEach((variant) => {
      const button = element('button', 'worlds-variant', `${variant.variant}${variant.selected ? ' · Selected' : ''}`);
      button.type = 'button';
      button.dataset.worldsVariant = variant.id;
      button.setAttribute('aria-label', `Variation ${variant.variant}${variant.selected ? ', selected ad representative' : variant.category === 'ad-alternate' ? ', alternate ad variation' : ''}`);
      button.setAttribute('aria-pressed', String(variant.id === image.id));
      const preview = element('img');
      preview.src = variant.thumb; preview.alt = '';
      preview.width = variant.thumbWidth || 420;
      preview.height = variant.thumbHeight || Math.round(preview.width * variant.height / variant.width);
      preview.loading = 'lazy'; preview.decoding = 'async';
      button.prepend(preview);
      variants.append(button);
    });
    previous.disabled = sequence.length < 2;
    next.disabled = sequence.length < 2;
    if (!dialog.open) {
      if (!opener) opener = document.activeElement;
      dialog.showModal();
      close.focus({ preventScroll: true });
    }
    document.documentElement.classList.add('worlds-modal-open');
  }

  function setImageHash(image, replace = false) {
    // Only a pushed entry can safely close with history.back(). Navigating
    // variants of a direct image URL must keep its replacement-only behavior.
    const owner = !replace || history.state?.worldsModal?.owner === historyOwner ? historyOwner : null;
    const state = { ...(history.state || {}), worldsModal: { owner, returnHash } };
    history[replace ? 'replaceState' : 'pushState'](state, '', `#image=${encodeURIComponent(image.id)}`);
  }

  function open(image, source) {
    if (!image || closing) return;
    const alreadyOpen = Boolean(current && dialog.open);
    if (!alreadyOpen) {
      opener = source || document.activeElement;
      returnHash = location.hash.startsWith('#image=') ? '' : location.hash;
      sequence = source && gallery.contains(source) ? filtered : images;
    }
    setImageHash(image, alreadyOpen);
    show(image);
  }

  function hide() {
    const wasOpen = dialog.open;
    const restoreFocus = opener;
    current = null;
    opener = null;
    if (wasOpen) dialog.close();
    document.documentElement.classList.remove('worlds-modal-open');
    // Hash navigation also reaches this function when no modal is open.
    // Restore focus only for the actual transition out of an open dialog.
    if (wasOpen && restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
  }

  function dismiss() {
    if (closing || !dialog.open) return;
    const entry = history.state?.worldsModal;
    hide();
    if (entry?.owner === historyOwner && imageFromHash()) {
      closing = true;
      history.back();
    } else if (location.hash.startsWith('#image=')) {
      // A direct image URL has no guaranteed same-page previous entry.
      const state = { ...(history.state || {}) };
      delete state.worldsModal;
      history.replaceState(state, '', `${location.pathname}${location.search}${returnHash}`);
    }
  }

  function move(direction) {
    if (!current || closing || sequence.length < 2) return;
    let index = sequence.findIndex((image) => image.id === current.id);
    if (index < 0) {
      sequence = images;
      index = sequence.findIndex((image) => image.id === current.id);
    }
    const image = sequence[(index + direction + sequence.length) % sequence.length];
    setImageHash(image, true);
    show(image);
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const variant = event.target.closest('[data-worlds-variant]');
    if (variant && dialog.contains(variant)) {
      const image = byId.get(variant.dataset.worldsVariant);
      if (!image || closing) return;
      sequence = groups.get(image.groupId) || images;
      setImageHash(image, true);
      show(image);
      // Preserve focus when replacing the variation controls.
      variants.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
      return;
    }
    const trigger = event.target.closest('[data-open-image]');
    if (trigger) {
      const image = byId.get(trigger.dataset.openImage);
      if (image) { event.preventDefault(); open(image, trigger); }
    }
  });
  close.addEventListener('click', dismiss);
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dismiss(); });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  function syncHistory() {
    closing = false;
    const image = imageFromHash();
    if (image) {
      const entry = history.state?.worldsModal;
      const savedHash = entry?.owner === historyOwner ? entry.returnHash : '';
      returnHash = typeof savedHash === 'string' && (!savedHash || (savedHash.startsWith('#') && !savedHash.startsWith('#image='))) ? savedHash : '';
      show(image);
    } else hide();
  }
  window.addEventListener('popstate', syncHistory);
  window.addEventListener('hashchange', syncHistory);
  get('surprise')?.addEventListener('click', (event) => {
    const choices = images.filter((image) => image.id !== current?.id);
    open(choices[Math.floor(Math.random() * choices.length)], event.currentTarget);
  });

  const motion = get('motion');
  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let motionOverridden = false;
  function setMotion(still) {
    document.documentElement.dataset.motion = still ? 'still' : 'gentle';
    motion?.setAttribute('aria-pressed', String(still));
    if (motion) motion.textContent = still ? 'Motion: still' : 'Motion: gentle';
  }
  setMotion(Boolean(motionPreference?.matches));
  motion?.addEventListener('click', () => {
    motionOverridden = true;
    setMotion(document.documentElement.dataset.motion !== 'still');
  });
  motionPreference?.addEventListener?.('change', (event) => { if (!motionOverridden) setMotion(event.matches); });

  const chapters = [...document.querySelectorAll('[data-worlds-chapter]')];
  const links = [...document.querySelectorAll('[data-chapter-link]')];
  const progress = get('progress');
  const progressLabel = get('progress-label');
  let queued = false;
  function updateProgress() {
    queued = false;
    if (!chapters.length) return;
    const position = Math.min(window.innerHeight * 0.38, 280);
    let index = -1;
    chapters.forEach((chapter, i) => { if (chapter.getBoundingClientRect().top <= position) index = i; });
    links.forEach((link) => {
      const active = index >= 0 && link.dataset.chapterLink === chapters[index].id;
      if (active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    });
    if (progress) progress.value = ((index + 1) / chapters.length) * 100;
    if (progressLabel) progressLabel.textContent = index < 0 ? `Your journey · ${chapters.length} chapters` : `${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')} · ${chapters[index].dataset.worldsChapter || chapters[index].querySelector('h2')?.textContent || 'On the way'}`;
  }
  function queueProgress() {
    if (!queued) { queued = true; requestAnimationFrame(updateProgress); }
  }
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  renderGallery();
  syncHistory();
  updateProgress();
})();
