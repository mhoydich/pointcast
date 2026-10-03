const mounted = new WeakMap();

export const normalizeReadingText = (value) => String(value ?? '')
  .normalize('NFKD').replace(/\p{Diacritic}/gu, '')
  .replace(/[’‘]/g, "'").replace(/\s+/g, ' ').toLowerCase().trim();

// Exact RSS IDs, full title aliases and authors: never a substring match.
// A mapping is usable only when its curated door is also in readingShelf.
export const readingCompanionMappings = [
  { id: '52036', title: 'Siddhartha', author: 'Hermann Hesse', shelfId: 'siddhartha', shelfTitles: ['Siddhartha'], href: '/siddhartha/' },
  { id: '5246', title: 'Ethan Frome', author: 'Edith Wharton', shelfId: 'ethan-frome', shelfTitles: ['Ethan Frome'], href: '/books/ethan-frome/' },
  { id: '77203', title: 'The Kite Runner', author: 'Khaled Hosseini', shelfId: 'the-kite-runner', shelfTitles: ['The Kite Runner'], href: '/books/the-kite-runner/' },
  { id: '295', title: 'Treasure Island', author: 'Robert Louis Stevenson', shelfId: 'treasure-island', shelfTitles: ['Treasure Island'], href: '/books/treasure-island/' },
  { id: '48731', title: 'New Rules for the New Economy: 10 Radical Strategies for a Connected World', author: 'Kevin Kelly', shelfId: 'new-rules-for-the-new-economy', shelfTitles: ['New Rules for the New Economy'], href: '/books/new-rules-for-the-new-economy/' },
  { id: '68428', title: 'Mistborn: The Final Empire (Mistborn, #1)', author: 'Brandon Sanderson', shelfId: 'mistborn-the-final-empire', shelfTitles: ['Mistborn', 'Mistborn: The Final Empire'], href: '/books/mistborn-the-final-empire/' },
  { id: '10229557', title: 'Think and Grow Rich', author: 'Napoleon Hill', shelfId: 'think-and-grow-rich', shelfTitles: ['Think and Grow Rich'], href: '/books/think-and-grow-rich/' },
];

export function findReadingCompanion(record, shelf = []) {
  const mapping = readingCompanionMappings.find((item) => item.id === String(record.id)
    && normalizeReadingText(item.title) === normalizeReadingText(record.title)
    && normalizeReadingText(item.author) === normalizeReadingText(record.author));
  if (!mapping) return null;
  const door = shelf.find((item) => item.id === mapping.shelfId && item.href === mapping.href
    && mapping.shelfTitles.some((title) => normalizeReadingText(title) === normalizeReadingText(item.title))
    && normalizeReadingText(item.author) === normalizeReadingText(mapping.author));
  return door ? { id: door.id, title: door.title, href: door.href } : null;
}

export function makeThemeAssignments(groups) {
  const assignments = Object.create(null);
  for (const [theme, ids] of Object.entries(groups)) {
    for (const id of ids) {
      if (Object.hasOwn(assignments, id)) throw new Error(`Duplicate reading-map assignment: ${id}`);
      assignments[id] = theme;
    }
  }
  return assignments;
}

/** Keep the public data restricted to book metadata and editorial connections. */
export function buildReadingMapRecords(records, assignments, shelf = []) {
  const seen = new Set();
  return records.map((record) => {
    const id = String(record.id);
    if (!/^\d+$/.test(id) || seen.has(id)) throw new Error(`Invalid or duplicate reading record: ${id}`);
    seen.add(id);
    if (!record.title?.trim() || !record.author?.trim()) throw new Error(`Missing title or author: ${id}`);
    if (record.bookUrl !== `https://www.goodreads.com/book/show/${id}`) throw new Error(`Noncanonical book catalog URL: ${id}`);
    return {
      id, title: record.title, author: record.author, bookUrl: record.bookUrl,
      theme: assignments[id] ?? 'open-shelf', companion: findReadingCompanion(record, shelf),
    };
  }).sort((left, right) => left.title.localeCompare(right.title, 'en', { sensitivity: 'base' })
    || left.author.localeCompare(right.author, 'en', { sensitivity: 'base' }));
}

export function matchesReadingRecord(searchText, recordTheme, query = '', theme = 'all') {
  const words = normalizeReadingText(query).split(' ').filter(Boolean);
  return (theme === 'all' || theme === recordTheme)
    && words.every((word) => normalizeReadingText(searchText).includes(word));
}

/** Enhance server-rendered records. The unenhanced page already shows every title. */
export function mountReadingMap(root) {
  if (mounted.has(root)) return mounted.get(root);
  const controls = root.querySelector('[data-map-controls]');
  const input = root.querySelector('[data-map-search]');
  const reset = root.querySelector('[data-map-reset]');
  const status = root.querySelector('[data-map-status]');
  const empty = root.querySelector('[data-map-empty]');
  const buttons = [...root.querySelectorAll('[data-map-theme]')];
  const records = [...root.querySelectorAll('[data-map-record]')];
  const staticLabels = [...root.querySelectorAll('[data-map-static]')];
  if (!controls || !input || !reset || !status || !empty || !records.length || !buttons.length) return () => {};
  const themeLabels = new Map(buttons.map((button) => [button.dataset.mapTheme, button.dataset.mapLabel]));
  let theme = 'all';
  const update = () => {
    let count = 0;
    for (const record of records) {
      record.hidden = !matchesReadingRecord(record.dataset.mapSearch, record.dataset.mapGroup, input.value, theme);
      if (!record.hidden) count += 1;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.mapTheme === theme));
    status.textContent = `${count} of ${records.length} title records shown${theme === 'all' ? '' : ` · ${themeLabels.get(theme)}`}.`;
    empty.hidden = count !== 0;
    reset.disabled = theme === 'all' && input.value.length === 0;
  };
  const onReset = () => { input.value = ''; theme = 'all'; update(); input.focus(); };
  const handlers = buttons.map((button) => {
    const handle = () => { theme = button.dataset.mapTheme; update(); };
    button.addEventListener('click', handle);
    return [button, handle];
  });
  input.addEventListener('input', update);
  reset.addEventListener('click', onReset);
  controls.hidden = false;
  buttons.forEach((button) => { button.hidden = false; });
  staticLabels.forEach((label) => { label.hidden = true; });
  update();
  const dispose = () => {
    input.removeEventListener('input', update);
    reset.removeEventListener('click', onReset);
    handlers.forEach(([button, handle]) => button.removeEventListener('click', handle));
    records.forEach((record) => { record.hidden = false; });
    buttons.forEach((button) => { button.hidden = true; });
    staticLabels.forEach((label) => { label.hidden = false; });
    controls.hidden = true;
    empty.hidden = true;
    status.textContent = `All ${records.length} title records shown.`;
    mounted.delete(root);
  };
  mounted.set(root, dispose);
  return dispose;
}
