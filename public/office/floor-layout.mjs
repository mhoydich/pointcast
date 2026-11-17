/** Build a detached floor from supplied roster data; performs no activity discovery. */
export function createFloor(document, roster = []) {
  if (!Array.isArray(roster)) throw new TypeError('roster must be an array');
  const handles = new Set();
  for (const entry of roster) {
    if (!entry || typeof entry.handle !== 'string' || !entry.handle.trim() ||
        typeof entry.name !== 'string' || !entry.name.trim() || handles.has(entry.handle)) {
      throw new TypeError('Each desk needs a unique handle and a name');
    }
    handles.add(entry.handle);
  }
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const floor = el('section', 'office-floor');
  floor.setAttribute('aria-label', 'Office floor');
  const header = el('header', 'office-floor__entrance');
  header.append(el('h2', 'office-floor__title', 'The office floor'),
    el('p', 'office-floor__intro', 'A place for the people and agents on this roster.'));
  floor.append(header);
  const desks = el('section', 'office-floor__desks');
  desks.setAttribute('aria-label', 'Roster desks');
  for (const entry of roster) {
    const desk = el('article', 'office-floor__desk');
    desk.setAttribute('aria-label', `${entry.name} desk`);
    const portraitUrl = safePortrait(entry.nounUrl);
    if (portraitUrl) {
      const portrait = el('img', 'office-floor__portrait');
      portrait.setAttribute('src', portraitUrl);
      portrait.setAttribute('alt', '');
      portrait.setAttribute('width', '64');
      portrait.setAttribute('height', '64');
      portrait.setAttribute('loading', 'lazy');
      desk.append(portrait);
    }
    desk.append(el('h3', 'office-floor__name', entry.name),
      el('p', 'office-floor__handle', entry.handle));
    const mount = el('div', 'office-floor__desk-mount');
    mount.setAttribute('data-desk-handle', entry.handle);
    desk.append(mount);
    desks.append(desk);
  }
  if (!roster.length) desks.append(el('p', 'office-floor__empty', 'No desks supplied yet.'));
  floor.append(desks);
  return floor;
}

function safePortrait(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  // Allow local assets and HTTPS portraits, never executable or data URLs.
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
