import { recentLogs } from './activity.mjs';
import { drawHearth } from './hearth.mjs';

const room = 'https://pointcast.xyz/loom?to=%23bonfire';
const endpoint = 'https://pointcast.xyz/api/loom?to=%23bonfire';
const canvas = document.querySelector('canvas');
const heading = document.querySelector('#state');
const caption = document.querySelector('#caption');
const action = document.querySelector('#action');
const sheet = document.querySelector('dialog');
const notes = document.querySelector('#notes');
const formatter = new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' });
let snapshot = null;
let loading = false;

function render() {
  const logs = snapshot ? recentLogs(snapshot) : [];
  drawHearth(canvas, logs.length, { unavailable: !snapshot });
  if (!snapshot) {
    heading.textContent = 'The room is out of reach.';
    caption.textContent = 'The fire will return when its notes can be read.';
    action.textContent = 'Check the room again';
    return;
  }
  const count = logs.length;
  heading.textContent = count === 0 ? 'Only embers.' : count === 1 ? 'A single log is burning.' : count + ' logs on the fire.';
  caption.textContent = count ? 'Last tended by ' + logs[0].name + '.' : 'No original notes from the past 24 hours.';
  action.textContent = count ? 'Read by the fire →' : 'Sit by the embers →';
}

async function refresh() {
  if (loading) return;
  loading = true;
  if (!snapshot) { action.disabled = true; action.textContent = 'Reading…'; }
  try {
    const response = await fetch(endpoint, { credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Room unavailable');
    const data = await response.json();
    recentLogs(data);
    snapshot = data;
  } catch {
    snapshot = null;
  } finally {
    loading = false;
    action.disabled = false;
    render();
  }
}

function roomLink(text, url) {
  const a = document.createElement('a');
  a.textContent = text;
  a.href = url;
  return a;
}

action.addEventListener('click', () => {
  if (!snapshot) { refresh(); return; }
  const logs = recentLogs(snapshot);
  notes.replaceChildren();
  for (const log of logs) {
    const article = document.createElement('article');
    const byline = document.createElement('p');
    byline.className = 'byline';
    byline.textContent = log.name + ' · ' + formatter.format(new Date(log.at));
    const body = document.createElement('p');
    body.textContent = log.body;
    const address = 'loom:' + snapshot.log.key + '#' + log.id;
    article.append(byline, body, roomLink('Open original note ↗', 'https://pointcast.xyz/loom?to=' + encodeURIComponent(address)));
    notes.append(article);
  }
  if (!logs.length) {
    const article = document.createElement('article');
    const p = document.createElement('p');
    p.textContent = 'The wood has burned down. Earlier notes are still in the room.';
    article.append(p, roomLink('Visit the room ↗', room));
    notes.append(article);
  }
  sheet.showModal();
});

drawHearth(canvas, 0, { unavailable:true });
refresh();
setInterval(() => { if (!document.hidden && !sheet.open) refresh(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !sheet.open) refresh(); });
sheet.addEventListener('close', () => { if (snapshot) render(); });
