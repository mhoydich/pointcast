const mounted = new WeakMap();

/** Enhance an already complete, readable book page without persistence or network calls. */
export function mountBookCompanion(root) {
  if (mounted.has(root)) return mounted.get(root);
  const removers = [];
  const filterControls = root.querySelector('[data-copy-filters]');
  const filterStatus = root.querySelector('[data-copy-status]');
  const filterButtons = [...root.querySelectorAll('[data-copy-filter]')];
  const cards = [...root.querySelectorAll('[data-copy-card]')];
  const filters = new Set(['all', 'new', 'used', 'borrow', 'online']);

  const applyFilter = (filter) => {
    let count = 0;
    for (const card of cards) {
      const matches = filter === 'all' || (card.dataset.copyKinds || '').split(' ').includes(filter);
      card.hidden = !matches;
      if (matches) count += 1;
      for (const route of card.querySelectorAll('[data-route-kind]')) {
        route.hidden = filter !== 'all' && route.dataset.routeKind !== filter;
      }
    }
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.copyFilter === filter));
    filterStatus.textContent = `${count} ${filter === 'all' ? 'reading' : filter} ${count === 1 ? 'route' : 'routes'} shown.`;
  };
  if (filterControls && filterStatus && cards.length) {
    for (const button of filterButtons) {
      const handleClick = () => { if (filters.has(button.dataset.copyFilter)) applyFilter(button.dataset.copyFilter); };
      button.addEventListener('click', handleClick);
      removers.push(() => button.removeEventListener('click', handleClick));
    }
    applyFilter('all');
    filterControls.hidden = false;
  }

  const lensControls = root.querySelector('[data-lens-controls]');
  const lensList = root.querySelector('[data-lens-list]');
  const lensPanel = root.querySelector('[data-lens-panel]');
  const lensTitle = root.querySelector('[data-active-lens-title]');
  const lensPrompt = root.querySelector('[data-active-lens-prompt]');
  const lensStatus = root.querySelector('[data-lens-status]');
  const lensButtons = [...root.querySelectorAll('[data-lens-choice]')];
  const lenses = [...root.querySelectorAll('[data-reading-lens]')];
  const applyLens = (id, announce = true) => {
    const lens = lenses.find((item) => item.dataset.readingLens === id);
    if (!lens) return;
    const title = lens.querySelector('[data-lens-title]')?.textContent || '';
    const prompt = lens.querySelector('[data-lens-prompt]')?.textContent || '';
    lensTitle.textContent = title;
    lensPrompt.textContent = prompt;
    for (const button of lensButtons) button.setAttribute('aria-pressed', String(button.dataset.lensChoice === id));
    if (announce) lensStatus.textContent = `${title}. ${prompt}`;
  };
  if (lensControls && lensList && lensPanel && lensTitle && lensPrompt && lensStatus && lenses.length && lensButtons.length) {
    for (const button of lensButtons) {
      const handleClick = () => applyLens(button.dataset.lensChoice);
      button.addEventListener('click', handleClick);
      removers.push(() => button.removeEventListener('click', handleClick));
    }
    applyLens(lenses[0].dataset.readingLens, false);
    lensControls.hidden = false;
    lensPanel.hidden = false;
    lensList.hidden = true;
  }
  const dispose = () => {
    removers.forEach((remove) => remove());
    cards.forEach((card) => { card.hidden = false; card.querySelectorAll('[data-route-kind]').forEach((route) => { route.hidden = false; }); });
    if (filterControls) filterControls.hidden = true;
    if (filterStatus) filterStatus.textContent = `All ${cards.length} reading routes shown.`;
    if (lensControls) lensControls.hidden = true;
    if (lensPanel) lensPanel.hidden = true;
    if (lensList) lensList.hidden = false;
    mounted.delete(root);
  };
  mounted.set(root, dispose);
  return dispose;
}

/** Build Book metadata from verified fields; never invent an Offer or emit unknown nulls. */
export function buildBookStructuredData(book) {
  if (book.resourceType === 'reading-room') {
    return { '@context': 'https://schema.org', '@type': 'WebPage', name: `${book.title} — PointCast reading room`, url: `https://pointcast.xyz/books/${book.id}/`, description: book.dek, image: `https://pointcast.xyz${book.art.src}`, dateModified: book.checkedAt };
  }
  const verifiedDate = (value) => typeof value === 'string' && /^\d{4}(?:-\d{2}-\d{2})?$/.test(value);
  const formats = { paperback: 'Paperback', hardcover: 'Hardcover', ebook: 'EBook', audiobook: 'Audiobook' };
  const editions = book.editions.map((edition) => {
    const record = { '@type': 'Book', name: book.title };
    if (typeof edition.isbn === 'string' && /^(?:\d{13}|\d{9}[\dX])$/.test(edition.isbn)) record.isbn = edition.isbn;
    if (verifiedDate(edition.publicationDate)) record.datePublished = edition.publicationDate;
    if (Number.isInteger(edition.pages) && edition.pages > 0) record.numberOfPages = edition.pages;
    if (edition.publisher) record.publisher = { '@type': 'Organization', name: edition.publisher };
    const knownFormat = Object.keys(formats).find((format) => edition.format?.toLowerCase().replace(/[^a-z]/g, '').includes(format));
    if (knownFormat) record.bookFormat = `https://schema.org/${formats[knownFormat]}`;
    const source = book.sources.find((item) => item.id === edition.sourceId);
    if (source) record.url = source.url;
    return record;
  });
  const about = { '@type': 'Book', '@id': `https://pointcast.xyz/books/${book.id}/#work`, name: book.title, author: (book.authorCredits ? book.authorCredits.filter(credit => credit.role === 'author').map(credit => credit.name) : book.authors).map((name) => ({ '@type': 'Person', name })), inLanguage: 'en', genre: book.kind, workExample: editions };
  if (book.authorCredits?.some(credit => credit.role === 'contributor')) about.contributor = book.authorCredits.filter(credit => credit.role === 'contributor').map(credit => ({ '@type': 'Person', name: credit.name }));
  if (verifiedDate(book.firstPublished)) about.datePublished = book.firstPublished;
  return { '@context': 'https://schema.org', '@type': 'WebPage', name: `${book.title} — PointCast book companion`, url: `https://pointcast.xyz/books/${book.id}/`, description: book.dek, image: `https://pointcast.xyz${book.art.src}`, dateModified: book.checkedAt, about };
}
