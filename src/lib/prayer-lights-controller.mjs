import { BACKUP_FORMAT, openLightStore, parseBackup } from './prayer-lights-store.mjs';

const names = { honey: 'Honey', rose: 'Rose', sage: 'Sage', sky: 'Sky', lilac: 'Lilac', ivory: 'Ivory' };
const number = (n) => n.toLocaleString();

export function renderLight(document, light) {
  const card = document.createElement('li');
  card.className = 'pl-light-card';
  card.dataset.color = light.color;
  card.dataset.shape = String(light.seq % 3);
  card.style.setProperty('--delay', `${-(light.seq % 11) / 3}s`);
  const visual = document.createElement('div');
  visual.className = 'pl-light-art';
  visual.setAttribute('aria-hidden', 'true');
  for (const name of ['pl-halo', 'pl-flame', 'pl-wick', 'pl-vessel', 'pl-base']) {
    const part = document.createElement('span');
    part.className = name;
    visual.append(part);
  }
  const heading = document.createElement('p');
  heading.className = 'pl-light-number';
  heading.textContent = `${names[light.color]} · No. ${number(light.seq)}`;
  const intention = document.createElement('p');
  intention.className = 'pl-light-intention';
  intention.textContent = light.intention || 'A quiet prayer.';
  const time = document.createElement('time');
  time.dateTime = new Date(light.createdAt).toISOString();
  time.textContent = new Date(light.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  card.append(visual, heading, intention, time);
  return card;
}

export async function mountPrayerLights(root, scope = window, suppliedStore) {
  const document = root.ownerDocument;
  const $ = (selector) => root.querySelector(selector);
  const wall = $('[data-wall]');
  const form = $('form');
  const submit = $('[data-light]');
  const older = $('[data-older]');
  const status = $('[data-status]');
  const intention = $('[name=intention]');
  const downloads = $('[data-export]');
  const file = $('[data-import]');
  let store, session = 0, busy = true, before, total = 0, alive = true, pendingSync = false;
  const channel = scope.BroadcastChannel ? new scope.BroadcastChannel('pointcast-prayer-lights') : null;
  const say = (text) => { status.textContent = text; };
  const updateOlder = () => {
    older.hidden = wall.children.length >= total;
    $('[data-visible]').textContent = `${number(wall.children.length)} of ${number(total)} lights`;
    $('[data-empty]').hidden = total > 0;
  };
  async function stats() {
    const data = await store.stats();
    if (!alive) return;
    total = data.total;
    $('[data-total]').textContent = number(total);
    $('[data-today]').textContent = number(data.days[6]);
    $('[data-session]').textContent = number(session);
    const max = Math.max(1, ...data.days);
    const chart = $('[data-week]');
    chart.replaceChildren();
    data.days.forEach((count, index) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + index);
      const column = document.createElement('div');
      const bar = document.createElement('span');
      bar.className = 'pl-week-bar';
      bar.style.setProperty('--height', `${Math.max(4, (count / max) * 100)}%`);
      bar.dataset.empty = String(count === 0);
      const label = document.createElement('span');
      label.textContent = date.toLocaleDateString(undefined, { weekday: 'narrow' });
      column.setAttribute('aria-label', `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${number(count)} lights`);
      column.append(bar, label);
      chart.append(column);
    });
    $('[data-week-count]').textContent = `${number(data.days.reduce((a, b) => a + b, 0))} this week`;
    updateOlder();
  }
  async function load(reset = false, limit = 48) {
    const lights = await store.page(reset ? undefined : before, limit);
    if (!alive) return;
    if (reset) { wall.replaceChildren(); before = undefined; }
    lights.forEach((light) => wall.append(renderLight(document, light)));
    if (lights.length) before = lights.at(-1).seq;
    updateOlder();
    if (!lights.length) older.hidden = true;
  }
  async function sync() {
    if (!store || !alive) return;
    if (busy) { pendingSync = true; return; }
    await operation(async () => {
      await stats();
      await load(true, Math.max(48, wall.children.length));
    }, 'Your collection could not be refreshed. Reload to see the latest saved lights.');
  }
  const onFocus = () => { sync(); };
  if (channel) channel.onmessage = onFocus;
  scope.addEventListener('focus', onFocus);
  const cleanup = () => { alive = false; store?.close(); channel?.close(); scope.removeEventListener('focus', onFocus); };
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  async function operation(action, failure) {
    if (busy) return;
    busy = true;
    submit.disabled = older.disabled = downloads.disabled = file.disabled = true;
    try { await action(); }
    catch { say(failure); }
    finally {
      busy = false;
      if (alive) submit.disabled = older.disabled = downloads.disabled = file.disabled = false;
      if (pendingSync && alive) { pendingSync = false; await sync(); }
    }
  }
  function changeColor() {
    root.dataset.color = form.elements.color.value;
  }
  form.addEventListener('change', changeColor);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    operation(async () => {
      const draft = intention.value;
      const record = await store.add({ id: scope.crypto.randomUUID(), createdAt: Date.now(), color: form.elements.color.value, intention: draft.trim() });
      if (!alive) return;
      session++;
      wall.prepend(renderLight(document, record));
      if (before === undefined) before = record.seq;
      if (intention.value === draft) intention.value = '';
      channel?.postMessage('updated');
      try {
        await stats();
        say(`Light ${number(record.seq)} is lit and saved on this device.`);
      } catch {
        say('Your light is saved. The counters could not refresh; reload to update them.');
      }
    }, 'This light could not be saved. Your existing lights are safe. Make a backup, check browser storage, then try again.');
  });
  older.addEventListener('click', () => operation(async () => {
    const previous = wall.children.length;
    await load();
    const first = wall.children[previous];
    if (first) { first.tabIndex = -1; first.focus({ preventScroll: true }); }
    say(`${number(wall.children.length)} lights are now showing.`);
  }, 'Older lights could not be loaded. Please try again.'));
  downloads.addEventListener('click', () => operation(async () => {
    const lights = await store.export();
    const blob = new scope.Blob([JSON.stringify({ format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), lights })], { type: 'application/json' });
    const url = scope.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prayer-lights-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    scope.setTimeout(() => scope.URL.revokeObjectURL(url), 1000);
    say('Backup downloaded. Keep it somewhere safe; intentions are included.');
  }, 'The backup could not be created. Your lights are still saved here.'));
  file.addEventListener('change', () => operation(async () => {
    try {
      const selected = file.files?.[0];
      if (!selected) return;
      if (selected.size > 20 * 1024 * 1024) { say('Choose a backup smaller than 20 MB. Your existing lights are safe.'); return; }
      const records = parseBackup(await selected.text());
      const added = await store.import(records);
      channel?.postMessage('updated');
      try {
        await stats();
        await load(true);
        say(`${number(added)} lights restored. Lights already here were kept without duplicates.`);
      } catch { say('Your backup was restored. Reload to refresh the collection and counters.'); }
    } catch (error) {
      say(error instanceof SyntaxError ? 'This file is not valid JSON. Your existing lights are safe.' : error.message || 'Restore failed. Your existing lights are safe.');
    } finally { file.value = ''; }
  }, 'Restore failed. Your existing lights are safe.'));
  try {
    store = suppliedStore || await openLightStore(scope.indexedDB, scope.IDBKeyRange);
    if (!alive) { store.close(); return; }
    await stats();
    if (!alive) return;
    await load();
    if (!alive) return;
    submit.disabled = downloads.disabled = file.disabled = false;
    say(total ? 'Your lights are here. There is room for another.' : 'Your first light starts the collection.');
  } catch {
    say('Browser storage is unavailable. Allow site storage and reload to keep your lights here.');
  } finally {
    busy = false;
    if (pendingSync && alive) { pendingSync = false; await sync(); }
  }
  return cleanup;
}
