import { editionWindow, morningCard, readBoard } from './morning.mjs';

const element = (id) => document.getElementById(id);
const formatDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric',
});
const sections = ['shipped', 'stuck', 'decisions'];
let active = false;
let currentEdition = null;
let rollover;

function rowLink(row) {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'row';
  link.href = row.href;
  const copy = document.createElement('span');
  copy.className = 'row-text';
  const title = document.createElement('span');
  title.className = 'row-title';
  title.textContent = row.title;
  copy.append(title);
  if (row.detail) {
    const detail = document.createElement('span');
    detail.className = 'row-detail';
    detail.textContent = row.detail;
    copy.append(detail);
  }
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  link.append(copy, arrow);
  li.append(link);
  return li;
}

function render(card) {
  for (const section of sections) {
    const rows = card[section];
    element(section).replaceChildren(...rows.map(rowLink));
    element(`${section}-empty`).hidden = rows.length > 0;
    const more = element(`${section}-more`);
    more.textContent = `+${card.more[section]} more on the board`;
    more.hidden = !card.more[section];
  }
  element('board-note').hidden = false;
  element('history-note').hidden = !card.trimmed;
  element('sections').hidden = false;
}

async function refresh() {
  if (active) return;
  active = true;
  clearTimeout(rollover);
  element('refresh').setAttribute('aria-disabled', 'true');
  element('status').textContent = 'Reading the task board…';
  try {
    const data = await readBoard(window.location);
    const card = morningCard(data);
    currentEdition = card.window.until;
    element('edition').dateTime = new Date(currentEdition).toISOString();
    element('edition').textContent = `${formatDate.format(currentEdition)} · 7 AM ET`;
    render(card);
    element('status').textContent = '';
  } catch {
    element('sections').hidden = true;
    element('board-note').hidden = true;
    element('history-note').hidden = true;
    element('status').textContent = 'The task board couldn’t load. Refresh to try again.';
  } finally {
    active = false;
    element('refresh').removeAttribute('aria-disabled');
    rollover = setTimeout(refresh, Math.max(0, editionWindow().next - Date.now()));
  }
}

element('refresh').hidden = false;
element('refresh').addEventListener('click', refresh);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentEdition !== editionWindow().until) refresh();
});
refresh();
