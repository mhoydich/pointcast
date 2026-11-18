/** A receipt renderer, not a presence detector. No fetching or clock ownership. */
export const DESK_FRESHNESS_MS = 15 * 60 * 1000;
const parts = new WeakMap();

function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, 'https://pointcast.xyz');
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
function instant(value) {
  if (typeof value !== 'string' || !value.trim()) return NaN;
  // Require an explicit timezone so a receipt means the same thing everywhere.
  return /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
}
function node(document, tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function createDesk(document, agent = {}) {
  const desk = node(document, 'article', 'office-desk');
  const name = typeof agent.name === 'string' && agent.name ? agent.name : 'Unnamed desk';
  const handle = typeof agent.handle === 'string' ? agent.handle : '';
  desk.setAttribute('aria-label', `${name} desk`);
  const portrait = node(document, 'div', 'office-desk__portrait');
  const nounUrl = safeUrl(agent.nounUrl);
  const fallback = node(document, 'p', 'office-desk__portrait-fallback', 'Noun portrait unavailable');
  portrait.append(fallback);
  if (nounUrl) {
    const image = node(document, 'img', 'office-desk__noun');
    image.src = nounUrl;
    image.alt = `${name} — whole Noun portrait`;
    image.width = 320;
    image.height = 320;
    fallback.hidden = true;
    image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; });
    portrait.append(image);
  }
  const title = node(document, 'h2', 'office-desk__name', name);
  const identity = node(document, 'p', 'office-desk__handle', handle || 'Handle not supplied');
  const activity = node(document, 'p', 'office-desk__activity');
  const status = node(document, 'p', 'office-desk__status');
  const receipt = node(document, 'p', 'office-desk__receipt');
  const asOf = node(document, 'p', 'office-desk__as-of');
  const explanation = node(document, 'p', 'office-desk__explanation',
    'Light marks a sourced post within 15 minutes of the snapshot. It does not show whether a process is running.');
  desk.append(portrait, title, identity, activity, status, receipt, asOf, explanation);
  parts.set(desk, { activity, status, receipt, asOf });
  updateDesk(desk, {});
  return desk;
}

export function updateDesk(element, facts = {}) {
  const refs = parts.get(element);
  if (!refs) throw new TypeError('updateDesk requires an element returned by createDesk');
  const posted = instant(facts.lastPostAt);
  const snapshot = instant(facts.asOf);
  const postUrl = safeUrl(facts.postUrl);
  const complete = Number.isFinite(posted) && Number.isFinite(snapshot) && !!postUrl;
  const age = snapshot - posted;
  const recent = complete && age >= 0 && age <= DESK_FRESHNESS_MS && facts.stale !== true;
  const state = recent ? 'recent' : facts.stale === true || (complete && age > DESK_FRESHNESS_MS) ? 'stale' : 'unknown';
  element.dataset.activity = state;
  refs.activity.textContent = recent ? 'Recent sourced post' : state === 'stale' ? 'Stale evidence · light off' : 'Activity unknown · light off';
  refs.status.textContent = typeof facts.status === 'string' && facts.status.trim()
    ? `Reported status: ${facts.status}` : 'Reported status: unknown';
  refs.receipt.replaceChildren();
  if (Number.isFinite(posted)) {
    const time = node(element.ownerDocument, 'time', 'office-desk__post-time', new Date(posted).toISOString());
    time.dateTime = new Date(posted).toISOString();
    refs.receipt.append('Last supplied post: ', time, ' · ');
  } else refs.receipt.append('Last post time unknown · ');
  if (postUrl) {
    const source = node(element.ownerDocument, 'a', 'office-desk__source', 'Source post');
    source.href = postUrl;
    refs.receipt.append(source);
  } else refs.receipt.append('Source unknown');
  refs.asOf.textContent = Number.isFinite(snapshot)
    ? `Snapshot as of ${new Date(snapshot).toISOString()}` : 'Snapshot time unknown';
  return element;
}
